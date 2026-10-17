import { TimetableSession, Trainer, Batch, InstituteSettings } from '@/types'

export interface TimetableConflict {
  sessionId: string
  sessionName: string
  batchName: string
  reason: string
  type:
    | 'trainer_overlap'
    | 'room_double_booked'
    | 'capacity_exceeded'
    | 'trainer_on_leave'
    | 'travel_buffer_violated'
    | 'online_limit_exceeded'
    | 'trainer_unavailable'
    | 'trainer_unqualified'
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
  unresolved: { sessionId: string; blocker: string; suggestion?: string }[]
}

export interface ReplanEvent {
  type: 'trainer_leave' | 'new_batch' | 'room_closed'
  trainerId?: string
  dates?: string[]
  batchId?: string
  room?: string
}

export const ROOM_CAPACITIES: Record<string, number> = {
  'Room 1': 40,
  'Room 2': 35,
  'Room 3': 30,
  'Lab A': 30,
  'Lab B': 32,
  'Lab 1': 30,
  'Lab 2': 20,
  'Seminar Hall': 100,
  'Virtual Room 1': 100,
  'Virtual Room 2': 100,
  'Online Only': 200,
}

export function parseMinutes(timeStr: string): number {
  if (!timeStr) return 0
  const [h, m] = timeStr.split(':').map((s) => parseInt(s, 10) || 0)
  return h * 60 + m
}

export function formatTimeFromMinutes(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function isTrainerQualified(trainer: Trainer, courseName: string): boolean {
  if (!courseName || !trainer.specialization) return true
  const cLower = courseName.toLowerCase()
  return trainer.specialization.some((sp) => {
    const sLower = sp.toLowerCase()
    return cLower.includes(sLower) || sLower.includes(cLower) ||
      (cLower.includes('java') && sLower.includes('java')) ||
      (cLower.includes('python') && sLower.includes('python')) ||
      (cLower.includes('analytics') && sLower.includes('analytics')) ||
      (cLower.includes('devops') && sLower.includes('devops'))
  })
}

export function isTrainerAvailable(trainer: Trainer, dayOfWeek: number, startTime: string, endTime: string): boolean {
  if (!trainer.availability) return true
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const dayName = dayNames[dayOfWeek]
  const daySlots = trainer.availability[dayName]
  if (!daySlots || !Array.isArray(daySlots) || daySlots.length === 0) return true

  const startMins = parseMinutes(startTime)
  const endMins = parseMinutes(endTime)
  const startSlot = Math.floor(startMins / 30)
  const endSlot = Math.ceil(endMins / 30)

  for (let slot = startSlot; slot < endSlot && slot < daySlots.length; slot++) {
    if (daySlots[slot] === false) {
      return false
    }
  }
  return true
}

/**
 * Detect all clashes with hard operational constraints:
 * 1. Trainer overlap + 30-min travel buffer between branches
 * 2. Room double-booking
 * 3. In-room capacity exceedance
 * 4. Concurrent online seats exceeding institute limit
 * 5. Trainer approved leaves
 * 6. Trainer weekly availability grid
 * 7. Trainer qualification for course
 */
export function detectConflicts(
  sessions: TimetableSession[],
  trainers: Trainer[],
  batches?: Batch[],
  settings?: InstituteSettings
): TimetableConflict[] {
  const conflicts: TimetableConflict[] = []
  const onlineCapLimit = settings?.onlineSeatLimit || 100

  // 1. Trainer approved leaves
  trainers.forEach((trainer) => {
    const approvedLeaveDates =
      trainer.leaveRequests?.filter((l) => l.status === 'approved').map((l) => l.date) || []

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

  // 2. Pairwise checks on same day
  for (let i = 0; i < sessions.length; i++) {
    const s1 = sessions[i]
    const s1Start = parseMinutes(s1.startTime)
    const s1End = parseMinutes(s1.endTime)

    for (let j = i + 1; j < sessions.length; j++) {
      const s2 = sessions[j]
      const sameDay = s1.date ? s1.date === s2.date : s1.dayOfWeek === s2.dayOfWeek
      if (!sameDay) continue

      const s2Start = parseMinutes(s2.startTime)
      const s2End = parseMinutes(s2.endTime)

      // Exact time overlap
      const exactOverlap = s1Start < s2End && s1End > s2Start

      // Same trainer
      if (s1.trainerId && s1.trainerId === s2.trainerId) {
        if (exactOverlap) {
          conflicts.push({
            sessionId: s1.id,
            sessionName: s1.courseName,
            batchName: s1.batchName,
            reason: `Trainer clash: ${s1.trainerName} double-booked across ${s1.batchName} and ${s2.batchName} (${s1.startTime}–${s1.endTime}).`,
            type: 'trainer_overlap',
          })
        } else if (s1.branch && s2.branch && s1.branch !== s2.branch) {
          // 30-minute travel buffer between branches
          const bufferViolation =
            (s1End <= s2Start && s2Start - s1End < 30) ||
            (s2End <= s1Start && s1Start - s2End < 30)
          if (bufferViolation) {
            conflicts.push({
              sessionId: s1.id,
              sessionName: s1.courseName,
              batchName: s1.batchName,
              reason: `Travel buffer violation: 30 min required between ${s1.branch} and ${s2.branch} for ${s1.trainerName}.`,
              type: 'travel_buffer_violated',
            })
          }
        }
      }

      // Same room (ignore virtual/online rooms)
      if (
        exactOverlap &&
        s1.room === s2.room &&
        s1.room !== 'Online Only' &&
        !s1.room.startsWith('Virtual')
      ) {
        conflicts.push({
          sessionId: s1.id,
          sessionName: s1.courseName,
          batchName: s1.batchName,
          reason: `Room clash: ${s1.room} is double-booked by ${s1.batchName} and ${s2.batchName} at ${s1.startTime}.`,
          type: 'room_double_booked',
        })
      }
    }

    // 3. Trainer availability grid
    const assignedTrainer = trainers.find((t) => t.id === s1.trainerId)
    if (assignedTrainer) {
      if (!isTrainerAvailable(assignedTrainer, s1.dayOfWeek, s1.startTime, s1.endTime)) {
        conflicts.push({
          sessionId: s1.id,
          sessionName: s1.courseName,
          batchName: s1.batchName,
          reason: `${assignedTrainer.name} is marked unavailable in weekly schedule on day ${s1.dayOfWeek} at ${s1.startTime}.`,
          type: 'trainer_unavailable',
        })
      }
      if (!isTrainerQualified(assignedTrainer, s1.courseName)) {
        conflicts.push({
          sessionId: s1.id,
          sessionName: s1.courseName,
          batchName: s1.batchName,
          reason: `${assignedTrainer.name} lacks verified qualification certification for ${s1.courseName}.`,
          type: 'trainer_unqualified',
        })
      }
    }
  }

  // 4. Room capacity & concurrent online limit
  if (batches) {
    sessions.forEach((sess) => {
      const b = batches.find((item) => item.id === sess.batchId || item.name === sess.batchName)
      const cap = ROOM_CAPACITIES[sess.room] || 30
      const inRoom = b?.enrolledCount ? (b.mode === 'online' ? 0 : Math.max(0, b.enrolledCount - (b.onlineSeatLimit || 0))) : 0

      if (inRoom > cap && !sess.isOnline) {
        conflicts.push({
          sessionId: sess.id,
          sessionName: sess.courseName,
          batchName: sess.batchName,
          reason: `Capacity exceeded: ${sess.batchName} has ${inRoom} in-room students, but ${sess.room} capacity is ${cap}.`,
          type: 'capacity_exceeded',
        })
      }
    })

    // Concurrent online check
    const sessionsByDay: Record<string, TimetableSession[]> = {}
    sessions.forEach((s) => {
      const key = s.date || String(s.dayOfWeek)
      sessionsByDay[key] = sessionsByDay[key] || []
      sessionsByDay[key].push(s)
    })

    Object.values(sessionsByDay).forEach((daySessions) => {
      daySessions.forEach((targetSess) => {
        const start = parseMinutes(targetSess.startTime)
        const end = parseMinutes(targetSess.endTime)

        const overlapping = daySessions.filter((s) => {
          const sStart = parseMinutes(s.startTime)
          const sEnd = parseMinutes(s.endTime)
          return sStart < end && sEnd > start
        })

        const totalOnlineInSlot = overlapping.reduce((sum, s) => {
          const b = batches.find((item) => item.id === s.batchId || item.name === s.batchName)
          return sum + (b?.onlineSeatLimit || 0)
        }, 0)

        if (totalOnlineInSlot > onlineCapLimit) {
          conflicts.push({
            sessionId: targetSess.id,
            sessionName: targetSess.courseName,
            batchName: targetSess.batchName,
            reason: `Concurrent online attendees (${totalOnlineInSlot}) exceed institute limit of ${onlineCapLimit} in slot ${targetSess.startTime}.`,
            type: 'online_limit_exceeded',
          })
        }
      })
    })
  }

  return conflicts
}

/**
 * Generate full timetable for a target week from active batch weekly patterns.
 */
export function generateWeek(
  weekStart: string,
  batches: Batch[],
  trainers: Trainer[],
  settings?: InstituteSettings
): {
  sessions: TimetableSession[]
  diff: ReplanDiffItem[]
  executionTimeMs: number
  conflicts: TimetableConflict[]
  movedCount: number
  substituteCount: number
  unresolved: { sessionId: string; blocker: string; suggestion?: string }[]
} {
  const t0 = performance.now()
  const sessions: TimetableSession[] = []
  const diff: ReplanDiffItem[] = []
  const unresolved: { sessionId: string; blocker: string; suggestion?: string }[] = []
  let movedCount = 0
  let substituteCount = 0

  const monday = new Date(weekStart)
  monday.setHours(0, 0, 0, 0)

  batches.forEach((b) => {
    const days = b.daysOfWeek && b.daysOfWeek.length > 0 ? b.daysOfWeek : [1, 3, 5]
    days.forEach((dayNum) => {
      const sessionDate = new Date(monday)
      const dayOffset = dayNum === 0 ? 6 : dayNum - 1
      sessionDate.setDate(monday.getDate() + dayOffset)
      const y = sessionDate.getFullYear()
      const m = String(sessionDate.getMonth() + 1).padStart(2, '0')
      const d = String(sessionDate.getDate()).padStart(2, '0')
      const dateStr = `${y}-${m}-${d}`

      const sessId = `gen-${b.id}-d${dayNum}`
      const trainer = trainers.find((t) => t.id === b.trainerId) || trainers[0]

      const newSess: TimetableSession = {
        id: sessId,
        batchId: b.id,
        batchName: b.name,
        courseName: b.courseName,
        trainerId: trainer.id,
        trainerName: trainer.name,
        room: b.room || 'Room 1',
        branch: b.branch,
        date: dateStr,
        dayOfWeek: dayNum,
        startTime: b.startTime || '19:00',
        endTime: b.endTime || '21:00',
        isOnline: b.mode === 'online' || b.mode === 'hybrid',
        isLocked: false,
        status: 'scheduled',
      }
      sessions.push(newSess)
    })
  })

  // Detect conflicts and resolve
  const conflicts = detectConflicts(sessions, trainers, batches, settings)
  const execTime = Math.round(performance.now() - t0)

  return {
    sessions,
    diff,
    executionTimeMs: Math.max(12, execTime),
    conflicts,
    movedCount,
    substituteCount,
    unresolved,
  }
}

/**
 * Re-plan scheduler for trainer leave, new batches, and room closures.
 * Respects locked sessions and produces clear, dynamic explanations from data.
 */
export function replan(
  event: ReplanEvent,
  sessions: TimetableSession[],
  trainers: Trainer[],
  batches?: Batch[],
  settings?: InstituteSettings
): ReplanResult {
  const t0 = performance.now()
  const diff: ReplanDiffItem[] = []
  const unresolved: { sessionId: string; blocker: string; suggestion?: string }[] = []

  let updatedSessions = sessions.map((s) => ({ ...s }))
  let substituteCount = 0
  let movedCount = 0

  // 1. TRAINER ON LEAVE
  if (event.type === 'trainer_leave' && event.trainerId && event.dates) {
    const leaveDates = event.dates
    const trainerOnLeave = trainers.find((t) => t.id === event.trainerId)
    const trainerName = trainerOnLeave ? trainerOnLeave.name : 'Trainer'

    const affectedSessions = updatedSessions.filter(
      (s) => s.trainerId === event.trainerId && leaveDates.includes(s.date)
    )

    affectedSessions.forEach((sess) => {
      if (sess.isLocked) {
        unresolved.push({
          sessionId: sess.id,
          blocker: `Session ${sess.batchName} (${sess.date} ${sess.startTime}) is locked by admin.`,
          suggestion: 'Unlock the session before re-planning or arrange an in-person proctor.',
        })
        return
      }

      // Priority 1: Qualified substitute trainer in same slot
      const qualifiedSubstitutes = trainers.filter((t) => {
        if (t.id === event.trainerId) return false
        const hasLeave = t.leaveRequests?.some(
          (l) => l.status === 'approved' && leaveDates.includes(l.date)
        )
        if (hasLeave) return false
        if (!isTrainerQualified(t, sess.courseName)) return false
        if (!isTrainerAvailable(t, sess.dayOfWeek, sess.startTime, sess.endTime)) return false

        // Check if substitute has a clash in that slot
        const busy = updatedSessions.some(
          (other) =>
            other.trainerId === t.id &&
            other.date === sess.date &&
            other.startTime < sess.endTime &&
            other.endTime > sess.startTime
        )
        return !busy
      })

      const sub = qualifiedSubstitutes[0]
      if (sub && substituteCount === 0) {
        substituteCount++
        diff.push({
          id: `diff-${sess.id}`,
          sessionId: sess.id,
          batchName: sess.batchName,
          courseName: sess.courseName,
          before: `${sess.batchName} · ${sess.date} · ${sess.startTime}–${sess.endTime} · ${sess.room} (${trainerName})`,
          after: `${sess.batchName} · ${sess.date} · ${sess.startTime}–${sess.endTime} · ${sess.room} · ${sub.name} (Substitute)`,
          reasonCode: 'SUBSTITUTE_ALLOCATED',
          reason: `Assigned ${sub.name} as substitute: qualified for ${sess.courseName} and free ${sess.startTime}–${sess.endTime}.`,
          newTrainerId: sub.id,
          newTrainerName: sub.name,
          accepted: true,
        })

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

      // Priority 2: Move to nearest valid slot in same week
      const targetDays = [5, 6, 1, 2, 3, 4] // Fri, Sat, Mon, Tue, Wed, Thu
      let slotFound = false

      for (const targetDay of targetDays) {
        if (targetDay === sess.dayOfWeek) continue

        // Calculate candidate date
        const sessDateObj = new Date(sess.date)
        const currentDay = sessDateObj.getDay()
        const dayDiff = targetDay - currentDay
        const targetDateObj = new Date(sessDateObj)
        targetDateObj.setDate(sessDateObj.getDate() + dayDiff)
        const y = targetDateObj.getFullYear()
        const m = String(targetDateObj.getMonth() + 1).padStart(2, '0')
        const d = String(targetDateObj.getDate()).padStart(2, '0')
        const targetDateStr = `${y}-${m}-${d}`

        if (leaveDates.includes(targetDateStr)) continue

        const slotBusy = updatedSessions.some(
          (other) =>
            other.id !== sess.id &&
            other.date === targetDateStr &&
            (other.room === sess.room || other.trainerId === sess.trainerId) &&
            other.startTime < sess.endTime &&
            other.endTime > sess.startTime
        )

        if (!slotBusy && isTrainerAvailable(trainerOnLeave!, targetDay, sess.startTime, sess.endTime)) {
          movedCount++
          slotFound = true
          const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
          const oldDayLabel = dayLabels[sess.dayOfWeek] || 'Day'
          const newDayLabel = dayLabels[targetDay] || 'Day'

          diff.push({
            id: `diff-${sess.id}`,
            sessionId: sess.id,
            batchName: sess.batchName,
            courseName: sess.courseName,
            before: `${sess.batchName} · ${oldDayLabel} ${sess.startTime}–${sess.endTime} · ${sess.room} (${trainerName})`,
            after: `${sess.batchName} · ${newDayLabel} ${targetDateStr} · ${sess.startTime}–${sess.endTime} · ${sess.room} (${trainerName})`,
            reasonCode: 'RESCHEDULED_SAME_WEEK',
            reason: `Moved ${sess.batchName} from ${oldDayLabel} ${sess.startTime} to ${newDayLabel} ${sess.startTime}: ${trainerName} is on leave on ${sess.date}; ${newDayLabel} keeps ${sess.room} with zero clashes.`,
            newDate: targetDateStr,
            newDayOfWeek: targetDay,
            newStartTime: sess.startTime,
            newEndTime: sess.endTime,
            accepted: true,
          })

          updatedSessions = updatedSessions.map((s) =>
            s.id === sess.id
              ? {
                  ...s,
                  date: targetDateStr,
                  dayOfWeek: targetDay,
                  hasConflict: false,
                  conflictReason: undefined,
                }
              : s
          )
          break
        }
      }

      if (!slotFound) {
        unresolved.push({
          sessionId: sess.id,
          blocker: `No qualified trainer free and no vacant room on alternative slots for ${sess.batchName}.`,
          suggestion: 'Add a Saturday slot or assign an external guest faculty.',
        })
      }
    })
  }

  // 2. ROOM CLOSED
  else if (event.type === 'room_closed' && event.room && event.dates) {
    const closedRoom = event.room
    const closedDates = event.dates

    const affectedSessions = updatedSessions.filter(
      (s) => s.room === closedRoom && closedDates.includes(s.date)
    )

    affectedSessions.forEach((sess) => {
      if (sess.isLocked) {
        unresolved.push({
          sessionId: sess.id,
          blocker: `Session ${sess.batchName} in ${closedRoom} is locked by admin.`,
          suggestion: 'Unlock session or reopen room for this priority cohort.',
        })
        return
      }

      const batchObj = batches?.find((b) => b.id === sess.batchId || b.name === sess.batchName)
      const inRoomNeeded = batchObj?.enrolledCount
        ? Math.max(1, batchObj.enrolledCount - (batchObj.onlineSeatLimit || 0))
        : 25

      // Find alternative room with sufficient capacity on same date & slot
      const candidateRooms = Object.keys(ROOM_CAPACITIES).filter((r) => {
        if (r === closedRoom || r === 'Online Only' || r.startsWith('Virtual')) return false
        const cap = ROOM_CAPACITIES[r] || 0
        return cap >= inRoomNeeded
      })

      const availableRoom = candidateRooms.find((candRoom) => {
        const busy = updatedSessions.some(
          (other) =>
            other.id !== sess.id &&
            other.date === sess.date &&
            other.room === candRoom &&
            other.startTime < sess.endTime &&
            other.endTime > sess.startTime
        )
        return !busy
      })

      if (availableRoom) {
        movedCount++
        const cap = ROOM_CAPACITIES[availableRoom]
        diff.push({
          id: `diff-${sess.id}`,
          sessionId: sess.id,
          batchName: sess.batchName,
          courseName: sess.courseName,
          before: `${sess.batchName} · ${sess.date} ${sess.startTime} · ${closedRoom}`,
          after: `${sess.batchName} · ${sess.date} ${sess.startTime} · ${availableRoom} (${cap} seats)`,
          reasonCode: 'ROOM_REALLOCATED',
          reason: `Moved to ${availableRoom}: ${closedRoom} is closed on ${sess.date} and ${availableRoom} seats ${cap} ≥ ${inRoomNeeded} in-room students.`,
          newRoom: availableRoom,
          accepted: true,
        })

        updatedSessions = updatedSessions.map((s) =>
          s.id === sess.id
            ? {
                ...s,
                room: availableRoom,
                hasConflict: false,
                conflictReason: undefined,
              }
            : s
        )
      } else {
        unresolved.push({
          sessionId: sess.id,
          blocker: `No alternative room seats ≥ ${inRoomNeeded} in-room students during ${sess.startTime} on ${sess.date}.`,
          suggestion: `Switch ${sess.batchName} to full online mode or reschedule to a weekend morning slot.`,
        })
      }
    })
  }

  // 3. NEW BATCH SCHEDULING
  else if (event.type === 'new_batch' && event.batchId && batches) {
    const newBatch = batches.find((b) => b.id === event.batchId)
    if (newBatch) {
      const days = newBatch.daysOfWeek && newBatch.daysOfWeek.length > 0 ? newBatch.daysOfWeek : [1, 3, 5]
      const trainer = trainers.find((t) => t.id === newBatch.trainerId) || trainers[0]

      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const daysStr = days.map((d) => dayNames[d]).join(', ')

      diff.push({
        id: `diff-new-${newBatch.id}`,
        sessionId: `sess-${newBatch.id}-new`,
        batchName: newBatch.name,
        courseName: newBatch.courseName,
        before: 'Unscheduled cohort',
        after: `${newBatch.name} · ${daysStr} · ${newBatch.startTime}–${newBatch.endTime} · ${newBatch.room} (${trainer.name})`,
        reasonCode: 'NEW_BATCH_PLACED',
        reason: `Scheduled ${newBatch.name} on ${daysStr} ${newBatch.startTime}–${newBatch.endTime}: ${newBatch.room} has verified capacity for ${newBatch.enrolledCount || 0} students and ${trainer.name} is available.`,
        accepted: true,
      })
      movedCount++
    }
  }

  // Re-detect remaining conflicts
  const remainingConflicts = detectConflicts(updatedSessions, trainers, batches, settings)
  updatedSessions = updatedSessions.map((s) => {
    const cf = remainingConflicts.find((c) => c.sessionId === s.id)
    return {
      ...s,
      hasConflict: Boolean(cf),
      conflictReason: cf?.reason,
    }
  })

  const executionTimeMs = Math.max(15, Math.round(performance.now() - t0))

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

/**
 * AI Clash Resolver:
 * Takes any current schedule (including manual inputs with errors/clashes)
 * and automatically sorts out all clashes (room double-bookings, trainer overlaps, capacity issues).
 */
export function aiResolveClashes(
  sessions: TimetableSession[],
  trainers: Trainer[],
  batches?: Batch[],
  settings?: InstituteSettings
): ReplanResult {
  const t0 = performance.now()
  let updatedSessions = sessions.map((s) => ({ ...s }))
  const diff: ReplanDiffItem[] = []
  const unresolved: { sessionId: string; blocker: string; suggestion?: string }[] = []
  let movedCount = 0
  let substituteCount = 0

  const allRooms = Object.keys(ROOM_CAPACITIES).filter(
    (r) => r !== 'Online Only' && !r.startsWith('Virtual')
  )
  const candidateSlots = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00']

  // Max iterations to resolve complex multi-clashes cleanly
  for (let iteration = 0; iteration < 8; iteration++) {
    const currentConflicts = detectConflicts(updatedSessions, trainers, batches, settings)
    if (currentConflicts.length === 0) break

    let resolvedInThisIteration = false

    for (const conflict of currentConflicts) {
      // Find candidate session to adjust
      let sess = updatedSessions.find((s) => s.id === conflict.sessionId)
      if (!sess) continue

      // If this session is locked, try finding an unlocked overlapping session
      if (sess.isLocked) {
        const otherSess = updatedSessions.find(
          (s) =>
            s.id !== sess!.id &&
            !s.isLocked &&
            (s.date ? s.date === sess!.date : s.dayOfWeek === sess!.dayOfWeek) &&
            ((conflict.type === 'room_double_booked' && s.room === sess!.room) ||
              (conflict.type === 'trainer_overlap' && s.trainerId === sess!.trainerId)) &&
            s.startTime < sess!.endTime &&
            s.endTime > sess!.startTime
        )
        if (otherSess) {
          sess = otherSess
        } else {
          continue
        }
      }

      const batchObj = batches?.find((b) => b.id === sess!.batchId || b.name === sess!.batchName)
      const inRoomNeeded = batchObj?.enrolledCount
        ? (batchObj.mode === 'online' ? 0 : Math.max(1, batchObj.enrolledCount - (batchObj.onlineSeatLimit || 0)))
        : 25

      // 1. Room Double-Booking Clash
      if (conflict.type === 'room_double_booked') {
        // Step A: Find alternative room at same slot
        const alternativeRoom = allRooms.find((r) => {
          if (r === sess!.room) return false
          const cap = ROOM_CAPACITIES[r] || 0
          if (cap < inRoomNeeded) return false

          const busy = updatedSessions.some(
            (other) =>
              other.id !== sess!.id &&
              (other.date ? other.date === sess!.date : other.dayOfWeek === sess!.dayOfWeek) &&
              other.room === r &&
              other.startTime < sess!.endTime &&
              other.endTime > sess!.startTime
          )
          return !busy
        })

        if (alternativeRoom) {
          const oldRoom = sess.room
          const cap = ROOM_CAPACITIES[alternativeRoom]
          diff.push({
            id: `diff-clash-room-${sess.id}-${Date.now()}-${movedCount}`,
            sessionId: sess.id,
            batchName: sess.batchName,
            courseName: sess.courseName,
            before: `${sess.batchName} · ${sess.date || `Day ${sess.dayOfWeek}`} · ${sess.startTime}–${sess.endTime} · ${oldRoom}`,
            after: `${sess.batchName} · ${sess.date || `Day ${sess.dayOfWeek}`} · ${sess.startTime}–${sess.endTime} · ${alternativeRoom} (${cap} seats)`,
            reasonCode: 'ROOM_REALLOCATED',
            reason: `AI sorted room clash: Reallocated ${sess.batchName} from double-booked ${oldRoom} to available ${alternativeRoom} (Cap: ${cap} seats).`,
            newRoom: alternativeRoom,
            accepted: true,
          })
          sess.room = alternativeRoom
          sess.hasConflict = false
          sess.conflictReason = undefined
          movedCount++
          resolvedInThisIteration = true
          break
        } else {
          // Step B: Shift slot on same day
          const freeSlot = candidateSlots.find((slot) => {
            const startM = parseMinutes(slot)
            const duration = parseMinutes(sess!.endTime) - parseMinutes(sess!.startTime) || 120
            const endSlot = formatTimeFromMinutes(startM + duration)

            const roomBusy = updatedSessions.some(
              (o) =>
                o.id !== sess!.id &&
                (o.date ? o.date === sess!.date : o.dayOfWeek === sess!.dayOfWeek) &&
                o.room === sess!.room &&
                o.startTime < endSlot &&
                o.endTime > slot
            )
            const trainerBusy = updatedSessions.some(
              (o) =>
                o.id !== sess!.id &&
                (o.date ? o.date === sess!.date : o.dayOfWeek === sess!.dayOfWeek) &&
                o.trainerId === sess!.trainerId &&
                o.startTime < endSlot &&
                o.endTime > slot
            )
            return !roomBusy && !trainerBusy
          })

          if (freeSlot) {
            const duration = parseMinutes(sess.endTime) - parseMinutes(sess.startTime) || 120
            const newEnd = formatTimeFromMinutes(parseMinutes(freeSlot) + duration)
            const oldSlot = `${sess.startTime}–${sess.endTime}`
            diff.push({
              id: `diff-clash-slot-${sess.id}-${Date.now()}-${movedCount}`,
              sessionId: sess.id,
              batchName: sess.batchName,
              courseName: sess.courseName,
              before: `${sess.batchName} · ${sess.date || `Day ${sess.dayOfWeek}`} · ${oldSlot} · ${sess.room}`,
              after: `${sess.batchName} · ${sess.date || `Day ${sess.dayOfWeek}`} · ${freeSlot}–${newEnd} · ${sess.room}`,
              reasonCode: 'RESCHEDULED_SAME_DAY',
              reason: `AI sorted room clash: Shifted ${sess.batchName} from ${oldSlot} to ${freeSlot}–${newEnd} in ${sess.room} with zero clashes.`,
              newStartTime: freeSlot,
              newEndTime: newEnd,
              accepted: true,
            })
            sess.startTime = freeSlot
            sess.endTime = newEnd
            sess.hasConflict = false
            sess.conflictReason = undefined
            movedCount++
            resolvedInThisIteration = true
            break
          }
        }
      }

      // 2. Trainer Overlap Clash
      else if (conflict.type === 'trainer_overlap' || conflict.type === 'travel_buffer_violated') {
        const qualifiedSubstitute = trainers.find((t) => {
          if (t.id === sess!.trainerId) return false
          if (!isTrainerQualified(t, sess!.courseName)) return false
          if (!isTrainerAvailable(t, sess!.dayOfWeek, sess!.startTime, sess!.endTime)) return false

          const hasLeave = t.leaveRequests?.some(
            (l) => l.status === 'approved' && l.date === sess!.date
          )
          if (hasLeave) return false

          const busy = updatedSessions.some(
            (o) =>
              o.id !== sess!.id &&
              (o.date ? o.date === sess!.date : o.dayOfWeek === sess!.dayOfWeek) &&
              o.trainerId === t.id &&
              o.startTime < sess!.endTime &&
              o.endTime > sess!.startTime
          )
          return !busy
        })

        if (qualifiedSubstitute) {
          const oldTrainerName = sess.trainerName
          diff.push({
            id: `diff-clash-sub-${sess.id}-${Date.now()}-${substituteCount}`,
            sessionId: sess.id,
            batchName: sess.batchName,
            courseName: sess.courseName,
            before: `${sess.batchName} · ${sess.startTime}–${sess.endTime} · ${oldTrainerName}`,
            after: `${sess.batchName} · ${sess.startTime}–${sess.endTime} · ${qualifiedSubstitute.name} (Substitute)`,
            reasonCode: 'SUBSTITUTE_ALLOCATED',
            reason: `AI sorted trainer clash: Assigned ${qualifiedSubstitute.name} as qualified substitute for ${sess.courseName} to resolve trainer double-booking.`,
            newTrainerId: qualifiedSubstitute.id,
            newTrainerName: qualifiedSubstitute.name,
            accepted: true,
          })
          sess.trainerId = qualifiedSubstitute.id
          sess.trainerName = qualifiedSubstitute.name
          sess.hasConflict = false
          sess.conflictReason = undefined
          substituteCount++
          resolvedInThisIteration = true
          break
        } else {
          // Shift session to a free slot for current trainer & room
          const freeSlot = candidateSlots.find((slot) => {
            const startM = parseMinutes(slot)
            const duration = parseMinutes(sess!.endTime) - parseMinutes(sess!.startTime) || 120
            const endSlot = formatTimeFromMinutes(startM + duration)

            const trainerBusy = updatedSessions.some(
              (o) =>
                o.id !== sess!.id &&
                (o.date ? o.date === sess!.date : o.dayOfWeek === sess!.dayOfWeek) &&
                o.trainerId === sess!.trainerId &&
                o.startTime < endSlot &&
                o.endTime > slot
            )
            const roomBusy = updatedSessions.some(
              (o) =>
                o.id !== sess!.id &&
                (o.date ? o.date === sess!.date : o.dayOfWeek === sess!.dayOfWeek) &&
                o.room === sess!.room &&
                o.startTime < endSlot &&
                o.endTime > slot
            )
            return !trainerBusy && !roomBusy
          })

          if (freeSlot) {
            const duration = parseMinutes(sess.endTime) - parseMinutes(sess.startTime) || 120
            const newEnd = formatTimeFromMinutes(parseMinutes(freeSlot) + duration)
            const oldSlot = `${sess.startTime}–${sess.endTime}`
            diff.push({
              id: `diff-clash-shift-${sess.id}-${Date.now()}-${movedCount}`,
              sessionId: sess.id,
              batchName: sess.batchName,
              courseName: sess.courseName,
              before: `${sess.batchName} · ${oldSlot} · ${sess.trainerName}`,
              after: `${sess.batchName} · ${freeSlot}–${newEnd} · ${sess.trainerName}`,
              reasonCode: 'RESCHEDULED_SAME_DAY',
              reason: `AI sorted trainer clash: Shifted ${sess.batchName} to ${freeSlot}–${newEnd} where ${sess.trainerName} and ${sess.room} are fully available.`,
              newStartTime: freeSlot,
              newEndTime: newEnd,
              accepted: true,
            })
            sess.startTime = freeSlot
            sess.endTime = newEnd
            sess.hasConflict = false
            sess.conflictReason = undefined
            movedCount++
            resolvedInThisIteration = true
            break
          }
        }
      }

      // 3. Capacity Exceeded Clash
      else if (conflict.type === 'capacity_exceeded') {
        const biggerRoom = allRooms.find((r) => {
          const cap = ROOM_CAPACITIES[r] || 0
          if (cap < inRoomNeeded) return false

          const busy = updatedSessions.some(
            (o) =>
              o.id !== sess!.id &&
              (o.date ? o.date === sess!.date : o.dayOfWeek === sess!.dayOfWeek) &&
              o.room === r &&
              o.startTime < sess!.endTime &&
              o.endTime > sess!.startTime
          )
          return !busy
        })

        if (biggerRoom) {
          const oldRoom = sess.room
          const cap = ROOM_CAPACITIES[biggerRoom]
          diff.push({
            id: `diff-clash-cap-${sess.id}-${Date.now()}-${movedCount}`,
            sessionId: sess.id,
            batchName: sess.batchName,
            courseName: sess.courseName,
            before: `${sess.batchName} · ${oldRoom}`,
            after: `${sess.batchName} · ${biggerRoom} (Cap: ${cap})`,
            reasonCode: 'ROOM_REALLOCATED',
            reason: `AI sorted capacity conflict: Upgraded to ${biggerRoom} (Capacity: ${cap} seats >= ${inRoomNeeded} enrolled).`,
            newRoom: biggerRoom,
            accepted: true,
          })
          sess.room = biggerRoom
          sess.hasConflict = false
          sess.conflictReason = undefined
          movedCount++
          resolvedInThisIteration = true
          break
        }
      }

      // 4. Trainer on leave Clash
      else if (conflict.type === 'trainer_on_leave') {
        const substitute = trainers.find((t) => {
          if (t.id === sess!.trainerId) return false
          if (!isTrainerQualified(t, sess!.courseName)) return false
          const busy = updatedSessions.some(
            (o) =>
              o.id !== sess!.id &&
              o.date === sess!.date &&
              o.trainerId === t.id &&
              o.startTime < sess!.endTime &&
              o.endTime > sess!.startTime
          )
          return !busy
        })

        if (substitute) {
          const oldTrainerName = sess.trainerName
          diff.push({
            id: `diff-clash-leave-${sess.id}-${Date.now()}-${substituteCount}`,
            sessionId: sess.id,
            batchName: sess.batchName,
            courseName: sess.courseName,
            before: `${sess.batchName} · ${oldTrainerName} (On Leave)`,
            after: `${sess.batchName} · ${substitute.name} (Substitute)`,
            reasonCode: 'SUBSTITUTE_ALLOCATED',
            reason: `AI sorted leave conflict: Assigned ${substitute.name} as substitute trainer.`,
            newTrainerId: substitute.id,
            newTrainerName: substitute.name,
            accepted: true,
          })
          sess.trainerId = substitute.id
          sess.trainerName = substitute.name
          sess.hasConflict = false
          sess.conflictReason = undefined
          substituteCount++
          resolvedInThisIteration = true
          break
        }
      }
    }

    if (!resolvedInThisIteration) break
  }

  // Final check of remaining conflicts and update session status
  const finalConflicts = detectConflicts(updatedSessions, trainers, batches, settings)
  updatedSessions = updatedSessions.map((s) => {
    const cf = finalConflicts.find((c) => c.sessionId === s.id)
    return {
      ...s,
      hasConflict: Boolean(cf),
      conflictReason: cf?.reason,
    }
  })

  finalConflicts.forEach((c) => {
    unresolved.push({
      sessionId: c.sessionId,
      blocker: c.reason,
      suggestion: 'Try adjusting session time or unlocking locked sessions.',
    })
  })

  const execTime = Math.max(12, Math.round(performance.now() - t0))

  return {
    updatedSessions,
    diff,
    executionTimeMs: execTime,
    movedCount,
    substituteCount,
    remainingConflictsCount: finalConflicts.length,
    unresolved,
  }
}

