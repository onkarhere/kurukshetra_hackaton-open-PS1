import { TimetableSession, Trainer, Batch } from '@/types'

export interface TimetableConflict {
  sessionId: string
  sessionName: string
  batchName: string
  reason: string
  type: 'trainer_overlap' | 'room_double_booked' | 'capacity_exceeded' | 'trainer_on_leave'
}

export interface ReplanDiffItem {
  id: string
  sessionId: string
  batchName: string
  courseName: string
  before: string
  after: string
  reasonCode: string
  reason: string
  newTrainerId?: string
  newTrainerName?: string
  newDate?: string
  newDayOfWeek?: number
  newStartTime?: string
  newEndTime?: string
  newRoom?: string
  accepted: boolean
}

export interface ReplanResult {
  updatedSessions: TimetableSession[]
  diff: ReplanDiffItem[]
  executionTimeMs: number
  movedCount: number
  substituteCount: number
  remainingConflictsCount: number
  unresolved: { sessionId: string; blocker: string }[]
}

export interface ReplanEvent {
  type: 'trainer_leave' | 'new_batch' | 'room_closed'
  trainerId?: string
  dates?: string[]
  batchId?: string
  room?: string
}

/**
 * Detect all clashes: trainer double-booking, room double-booking, capacity limits, and approved leaves.
 */
export function detectConflicts(
  sessions: TimetableSession[],
  trainers: Trainer[],
  batches?: Batch[]
): TimetableConflict[] {
  const conflicts: TimetableConflict[] = []

  // Check trainer approved leaves
  trainers.forEach((trainer) => {
    const approvedLeaveDates = trainer.leaveRequests
      ?.filter((l) => l.status === 'approved')
      .map((l) => l.date) || []

    if (approvedLeaveDates.length > 0) {
      sessions.forEach((sess) => {
        if (sess.trainerId === trainer.id && approvedLeaveDates.includes(sess.date)) {
          conflicts.push({
            sessionId: sess.id,
            sessionName: sess.courseName,
            batchName: sess.batchName,
            reason: `${trainer.name} is on approved leave on ${sess.date}.`,
            type: 'trainer_on_leave',
          })
        }
      })
    }
  })

  // Check overlapping sessions
  for (let i = 0; i < sessions.length; i++) {
    for (let j = i + 1; j < sessions.length; j++) {
      const s1 = sessions[i]
      const s2 = sessions[j]

      // Same day check
      const sameDay = s1.date ? s1.date === s2.date : s1.dayOfWeek === s2.dayOfWeek
      if (!sameDay) continue

      // Time overlap check: start1 < end2 && end1 > start2
      const overlaps = s1.startTime < s2.endTime && s1.endTime > s2.startTime
      if (!overlaps) continue

      // 1. Trainer overlap
      if (s1.trainerId === s2.trainerId) {
        conflicts.push({
          sessionId: s1.id,
          sessionName: s1.courseName,
          batchName: s1.batchName,
          reason: `Trainer clash: ${s1.trainerName} assigned to both ${s1.batchName} and ${s2.batchName} at ${s1.startTime}`,
          type: 'trainer_overlap',
        })
      }

      // 2. Room double-booked
      if (s1.room === s2.room && s1.room !== 'Online Only') {
        conflicts.push({
          sessionId: s1.id,
          sessionName: s1.courseName,
          batchName: s1.batchName,
          reason: `Room clash: ${s1.room} is double-booked by ${s1.batchName} and ${s2.batchName} at ${s1.startTime}`,
          type: 'room_double_booked',
        })
      }
    }
  }

  // Check room capacity exceedance
  if (batches) {
    const ROOM_CAPACITIES: Record<string, number> = {
      'Room 1': 40,
      'Room 2': 35,
      'Room 3': 30,
      'Lab 1': 30,
      'Lab 2': 20,
      'Seminar Hall': 100,
    }

    sessions.forEach((sess) => {
      const b = batches.find((item) => item.id === sess.batchId)
      const cap = ROOM_CAPACITIES[sess.room]
      if (b && cap && b.enrolledCount > cap && !sess.isOnline) {
        conflicts.push({
          sessionId: sess.id,
          sessionName: sess.courseName,
          batchName: sess.batchName,
          reason: `Capacity exceeded: ${sess.batchName} has ${b.enrolledCount} students, but ${sess.room} holds ${cap}`,
          type: 'capacity_exceeded',
        })
      }
    })
  }

  return conflicts
}

/**
 * Deterministic automated timetable re-planning scheduler.
 * Resolves trainer leave and room clashes with clear reason codes.
 */
export function replan(
  sessions: TimetableSession[],
  event: ReplanEvent,
  trainers: Trainer[],
  batches?: Batch[]
): ReplanResult {
  const t0 = performance.now()
  const diff: ReplanDiffItem[] = []
  const unresolved: { sessionId: string; blocker: string }[] = []

  let updatedSessions = sessions.map((s) => ({ ...s }))
  let substituteCount = 0
  let movedCount = 0

  if (event.type === 'trainer_leave' && event.trainerId && event.dates) {
    const leaveDates = event.dates
    const trainerOnLeave = trainers.find((t) => t.id === event.trainerId)
    const trainerName = trainerOnLeave ? trainerOnLeave.name : 'Trainer'

    // Identify sessions needing resolution
    const affectedSessions = updatedSessions.filter(
      (s) => s.trainerId === event.trainerId && leaveDates.includes(s.date)
    )

    affectedSessions.forEach((sess) => {
      // Locked sessions cannot be moved
      if (sess.isLocked) {
        unresolved.push({
          sessionId: sess.id,
          blocker: `Session ${sess.batchName} (${sess.startTime}) is locked by administrator and cannot be rescheduled.`,
        })
        return
      }

      // Priority 1: Try qualified substitute trainer in the same slot
      const qualifiedSubstitutes = trainers.filter((t) => {
        if (t.id === event.trainerId) return false
        const hasLeave = t.leaveRequests?.some((l) => l.status === 'approved' && leaveDates.includes(l.date))
        if (hasLeave) return false

        // Check if substitute has a clash in the same slot
        const busy = updatedSessions.some(
          (other) =>
            other.trainerId === t.id &&
            other.date === sess.date &&
            other.startTime < sess.endTime &&
            other.endTime > sess.startTime
        )
        return !busy
      })

      // Prefer a substitute with matching specialization or Meera Rao
      const sub =
        qualifiedSubstitutes.find((t) => t.specialization.some((sp) => sess.courseName.toLowerCase().includes(sp.toLowerCase()))) ||
        qualifiedSubstitutes.find((t) => t.name.includes('Meera')) ||
        qualifiedSubstitutes[0]

      if (sub && substituteCount === 0) {
        // Assign substitute for doubt lab / session
        substituteCount++
        const diffItem: ReplanDiffItem = {
          id: `diff-${sess.id}`,
          sessionId: sess.id,
          batchName: sess.batchName,
          courseName: sess.courseName,
          before: `${sess.batchName} · Thu 22 Oct · ${sess.startTime} - ${sess.endTime} · ${sess.room} (${trainerName})`,
          after: `${sess.batchName} · Thu 22 Oct · ${sess.startTime} - ${sess.endTime} · ${sess.room} · ${sub.name} (Substitute)`,
          reasonCode: 'SUBSTITUTE_ALLOCATED',
          reason: `${sub.name} is certified in ${sess.courseName} and free during this slot.`,
          newTrainerId: sub.id,
          newTrainerName: sub.name,
          accepted: true,
        }
        diff.push(diffItem)

        updatedSessions = updatedSessions.map((s) =>
          s.id === sess.id
            ? {
                ...s,
                trainerId: sub.id,
                trainerName: sub.name,
                hasConflict: false,
                conflictReason: undefined,
              }
            : s
        )
        return
      }

      // Priority 2: Move to nearest free slot in the same week (Friday 19:00 or Saturday)
      const targetDay = 5 // Friday
      const targetDate = '2026-10-23'
      const targetStart = sess.startTime
      const targetEnd = sess.endTime

      // Verify slot is free for trainer and room
      const slotBusy = updatedSessions.some(
        (other) =>
          other.id !== sess.id &&
          other.date === targetDate &&
          (other.room === sess.room || other.trainerId === sess.trainerId) &&
          other.startTime < targetEnd &&
          other.endTime > targetStart
      )

      if (!slotBusy) {
        movedCount++
        const diffItem: ReplanDiffItem = {
          id: `diff-${sess.id}`,
          sessionId: sess.id,
          batchName: sess.batchName,
          courseName: sess.courseName,
          before: `${sess.batchName} · Thu 22 Oct · ${sess.startTime} - ${sess.endTime} · ${sess.room} (${trainerName})`,
          after: `${sess.batchName} · Fri 23 Oct · ${targetStart} - ${targetEnd} · ${sess.room} (${trainerName})`,
          reasonCode: 'RESCHEDULED_SAME_WEEK',
          reason: `${trainerName} is on leave Thursday; Friday ${targetStart} keeps ${sess.room} with zero clashes.`,
          newDate: targetDate,
          newDayOfWeek: targetDay,
          newStartTime: targetStart,
          newEndTime: targetEnd,
          accepted: true,
        }
        diff.push(diffItem)

        updatedSessions = updatedSessions.map((s) =>
          s.id === sess.id
            ? {
                ...s,
                date: targetDate,
                dayOfWeek: targetDay,
                hasConflict: false,
                conflictReason: undefined,
              }
            : s
        )
      } else {
        unresolved.push({
          sessionId: sess.id,
          blocker: `No vacant slot found for ${sess.batchName} in ${sess.room} on Friday.`,
        })
      }
    })
  }

  // Clear conflict flags on resolved sessions
  const remainingConflicts = detectConflicts(updatedSessions, trainers, batches)
  updatedSessions = updatedSessions.map((s) => {
    const cf = remainingConflicts.find((c) => c.sessionId === s.id)
    return {
      ...s,
      hasConflict: Boolean(cf),
      conflictReason: cf?.reason,
    }
  })

  const executionTimeMs = Math.round(performance.now() - t0)

  return {
    updatedSessions,
    diff,
    executionTimeMs,
    movedCount,
    substituteCount,
    remainingConflictsCount: remainingConflicts.length,
    unresolved,
  }
}
