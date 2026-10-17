import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  GitCompare,
  AlertOctagon,
  Lock,
  Unlock,
  Check,
  Send,
  Layers,
  ArrowRight,
  RotateCcw,
  X,
  Clock,
  UserCheck,
  Sparkles,
  DoorClosed,
  UserX,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ReasonChip } from '@/components/ui/ReasonChip'
import { ApprovalCard } from '@/components/app/ApprovalCard'
import { useApp } from '@/context/AppContext'
import { useToast } from '@/context/ToastContext'
import { store, useStore } from '@/mocks/store'
import { TimetableSession, ApprovalAction } from '@/types'
import { cn } from '@/lib/utils'
import {
  detectConflicts,
  replan,
  generateWeek,
  ReplanDiffItem,
  ROOM_CAPACITIES,
} from './scheduler'

export const TimetableView: React.FC = () => {
  const { branch } = useApp()
  const { success, error: toastError } = useToast()
  const location = useLocation()

  const storeSessions = useStore((s) => s.timetableSessions)
  const trainers = useStore((s) => s.trainers)
  const batches = useStore((s) => s.batches)

  const [viewMode, setViewMode] = useState<'batch' | 'trainer' | 'room'>('batch')
  const [sessions, setSessions] = useState<TimetableSession[]>([...storeSessions])
  const [isDiffMode, setIsDiffMode] = useState(false)
  const [selectedSession, setSelectedSession] = useState<TimetableSession | null>(null)
  const [showPublishApproval, setShowPublishApproval] = useState(false)
  const [showChangeDrawer, setShowChangeDrawer] = useState(false)
  const [diffItems, setDiffItems] = useState<ReplanDiffItem[]>([])
  const [unresolvedItems, setUnresolvedItems] = useState<
    { sessionId: string; blocker: string; suggestion?: string }[]
  >([])
  const [currentPublishApproval, setCurrentPublishApproval] = useState<ApprovalAction | null>(null)
  const [replanMetrics, setReplanMetrics] = useState<{
    timeMs: number
    moved: number
    substitutes: number
    remainingConflicts: number
  } | null>(null)

  // Modals for Trainer on leave & Room closed
  const [showTrainerLeaveModal, setShowTrainerLeaveModal] = useState(false)
  const [leaveTrainerId, setLeaveTrainerId] = useState(trainers[0]?.id || 'tr-arjun')
  const [leaveDate, setLeaveDate] = useState('2026-10-22')

  const [showRoomClosedModal, setShowRoomClosedModal] = useState(false)
  const [closedRoom, setClosedRoom] = useState('Room 3')
  const [closedRoomDate, setClosedRoomDate] = useState('2026-10-22')

  // Sync with store when not in preview/diff mode
  useEffect(() => {
    if (!isDiffMode) {
      setSessions([...storeSessions])
    }
  }, [storeSessions, isDiffMode])

  // Handle route state from NewBatchModal or leave approval
  useEffect(() => {
    const st = location.state as any
    if (st?.newBatchDiff) {
      setDiffItems(st.newBatchDiff)
      if (st.updatedSessions) setSessions(st.updatedSessions)
      if (st.replanMetrics) setReplanMetrics(st.replanMetrics)
      setIsDiffMode(true)
      setShowChangeDrawer(true)
    } else if (st?.diffMode) {
      handleTrainerLeaveReplan('tr-arjun', '2026-10-22')
    }
  }, [location.state])

  const days = [
    'Mon 19 Oct',
    'Tue 20 Oct',
    'Wed 21 Oct',
    'Thu 22 Oct',
    'Fri 23 Oct',
    'Sat 24 Oct',
    'Sun 25 Oct',
  ]

  const timeSlots = [
    '08:00',
    '09:00',
    '10:00',
    '11:00',
    '12:00',
    '13:00',
    '14:00',
    '15:00',
    '16:00',
    '17:00',
    '18:00',
    '19:00',
    '20:00',
    '21:00',
  ]

  const activeConflicts = detectConflicts(sessions, trainers, batches, store.settings)
  const hasConflicts = activeConflicts.length > 0
  const conflictCount = activeConflicts.length

  // Auto-generate whole week
  const handleAutoGenerate = () => {
    const res = generateWeek('2026-10-19', batches, trainers, store.settings)
    setDiffItems(res.diff)
    setSessions(res.sessions)
    setUnresolvedItems(res.unresolved || [])
    setIsDiffMode(true)
    setShowChangeDrawer(true)
    setReplanMetrics({
      timeMs: res.executionTimeMs,
      moved: res.movedCount,
      substitutes: res.substituteCount,
      remainingConflicts: res.conflicts.length,
    })
    success(
      'Schedule generated',
      `Generated in ${res.executionTimeMs.toFixed(1)}ms: ${res.sessions.length} sessions scheduled across ${batches.length} batches.`
    )
  }

  // Trainer on leave replan
  const handleTrainerLeaveReplan = (trainerId: string, date: string) => {
    const res = replan(
      { type: 'trainer_leave', trainerId, dates: [date] },
      sessions,
      trainers,
      batches,
      store.settings
    )
    setDiffItems(res.diff)
    setSessions(res.updatedSessions)
    setUnresolvedItems(res.unresolved || [])
    setIsDiffMode(true)
    setShowChangeDrawer(true)
    setReplanMetrics({
      timeMs: res.executionTimeMs,
      moved: res.movedCount,
      substitutes: res.substituteCount,
      remainingConflicts: res.remainingConflictsCount,
    })
    setShowTrainerLeaveModal(false)
    success(
      'Schedule re-planned',
      `Re-plan completed in ${res.executionTimeMs.toFixed(1)}ms: ${res.movedCount} moved, ${res.substituteCount} substitute assigned, ${res.remainingConflictsCount} conflicts remaining.`
    )
  }

  // Room closed replan
  const handleRoomClosedReplan = (room: string, date: string) => {
    const res = replan(
      { type: 'room_closed', room, dates: [date] },
      sessions,
      trainers,
      batches,
      store.settings
    )
    setDiffItems(res.diff)
    setSessions(res.updatedSessions)
    setUnresolvedItems(res.unresolved || [])
    setIsDiffMode(true)
    setShowChangeDrawer(true)
    setReplanMetrics({
      timeMs: res.executionTimeMs,
      moved: res.movedCount,
      substitutes: res.substituteCount,
      remainingConflicts: res.remainingConflictsCount,
    })
    setShowRoomClosedModal(false)
    success(
      'Room closure handled',
      `Re-plan completed in ${res.executionTimeMs.toFixed(1)}ms: ${res.movedCount} session(s) moved to available rooms.`
    )
  }

  const handleReset = () => {
    setIsDiffMode(false)
    setShowChangeDrawer(false)
    setDiffItems([])
    setUnresolvedItems([])
    setSessions([...store.timetableSessions])
  }

  const toggleLock = (sessId: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === sessId ? { ...s, isLocked: !s.isLocked } : s))
    )
    success('Session slot lock toggled')
  }

  const toggleDiffItem = (id: string) => {
    setDiffItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, accepted: !item.accepted } : item
      )
    )
  }

  const handleOpenPublish = () => {
    const activeDiff = diffItems.filter((d) => d.accepted)
    const diffToPublish =
      activeDiff.length > 0
        ? activeDiff.map((d) => ({ before: d.before, after: d.after, reason: d.reason }))
        : [
            {
              before: 'Thu 22 Oct · 19:00 - 21:00 · Room 3 (Arjun Mehta)',
              after: 'Fri 23 Oct · 19:00 - 21:00 · Room 3 (Arjun Mehta)',
              reason: 'Trainer leave coverage; Friday 19:00 retains Room 3 with Arjun Mehta',
            },
          ]
    const approval = store.createTimetablePublishApproval(diffToPublish)
    setCurrentPublishApproval(approval)
    setShowPublishApproval(true)
  }

  return (
    <div className="space-y-4">
      {/* Top Controls Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-border">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 border border-border rounded-control p-0.5 bg-surface">
            <button
              className="p-1 hover:text-text text-text-muted rounded-control"
              aria-label="Previous week"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 text-xs font-semibold text-text">
              Week of 19 Oct – 25 Oct 2026
            </span>
            <button
              className="p-1 hover:text-text text-text-muted rounded-control"
              aria-label="Next week"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Segmented View Switcher */}
          <div className="flex items-center border border-border rounded-control p-0.5 bg-surface text-xs font-medium">
            <button
              onClick={() => setViewMode('batch')}
              className={cn(
                'px-2.5 py-1 rounded-control transition-colors',
                viewMode === 'batch'
                  ? 'bg-surface-sunken text-text font-semibold'
                  : 'text-text-muted hover:text-text'
              )}
            >
              Batch view
            </button>
            <button
              onClick={() => setViewMode('trainer')}
              className={cn(
                'px-2.5 py-1 rounded-control transition-colors',
                viewMode === 'trainer'
                  ? 'bg-surface-sunken text-text font-semibold'
                  : 'text-text-muted hover:text-text'
              )}
            >
              Trainer view
            </button>
            <button
              onClick={() => setViewMode('room')}
              className={cn(
                'px-2.5 py-1 rounded-control transition-colors',
                viewMode === 'room'
                  ? 'bg-surface-sunken text-text font-semibold'
                  : 'text-text-muted hover:text-text'
              )}
            >
              Room view
            </button>
          </div>
        </div>

        {/* Action Buttons: Auto-generate, Trainer on leave, Room closed, Publish */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAutoGenerate}
            leftIcon={<Sparkles className="w-3.5 h-3.5 text-accent" />}
          >
            Auto-generate
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowTrainerLeaveModal(true)}
            leftIcon={<UserX className="w-3.5 h-3.5 text-warning" />}
          >
            Trainer on leave
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowRoomClosedModal(true)}
            leftIcon={<DoorClosed className="w-3.5 h-3.5 text-text-muted" />}
          >
            Room closed
          </Button>

          {isDiffMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Revert diff
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenPublish}
            leftIcon={<Send className="w-3.5 h-3.5" />}
          >
            Publish timetable
          </Button>
        </div>
      </div>

      {/* Conflict Bar - Data driven */}
      {!isDiffMode && hasConflicts && (
        <div className="p-3 rounded-card border border-danger/30 bg-danger/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-danger shrink-0" />
            <div className="text-text">
              <span className="font-semibold text-danger">
                {conflictCount} conflict{conflictCount > 1 ? 's' : ''} detected:
              </span>{' '}
              <span className="text-text">
                {activeConflicts.map((c) => c.reason).join(' · ')}
              </span>
            </div>
          </div>
          <Button
            variant="secondary"
            size="xs"
            onClick={() => handleTrainerLeaveReplan('tr-arjun', '2026-10-22')}
            className="self-start sm:self-auto shrink-0"
          >
            Resolve clashes
          </Button>
        </div>
      )}

      {/* Unresolved items banner */}
      {unresolvedItems.length > 0 && (
        <div className="p-3 rounded-card border border-warning/40 bg-warning/10 text-xs text-text space-y-1.5">
          <div className="font-semibold text-warning flex items-center gap-1.5">
            <AlertOctagon className="w-3.5 h-3.5" />
            {unresolvedItems.length} unresolved scheduling item{unresolvedItems.length > 1 ? 's' : ''}:
          </div>
          {unresolvedItems.map((u, i) => (
            <div key={i} className="pl-5 text-text-muted">
              • <span className="font-medium text-text">{u.blocker}</span>
              {u.suggestion && (
                <span className="italic text-text-muted"> — Suggestion: {u.suggestion}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Re-plan Summary Banner (Diff Mode) */}
      {isDiffMode && (
        <div className="p-3 rounded-card border border-border bg-surface-sunken/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-accent shrink-0" />
            <div className="text-text">
              <span className="font-semibold">
                Re-planned diff: {replanMetrics?.moved || diffItems.length} moved ·{' '}
                {replanMetrics?.substitutes || 0} substitute ·{' '}
                {replanMetrics?.remainingConflicts ?? 0} conflicts
                {replanMetrics ? ` (Generated in ${replanMetrics.timeMs.toFixed(1)} ms)` : ''}
              </span>
              <p className="text-[11px] text-text-muted mt-0.5">
                Staged adjustments pending owner approval before publication.
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="xs"
            onClick={() => setShowChangeDrawer(true)}
            className="self-start sm:self-auto shrink-0"
          >
            Inspect change list ({diffItems.length})
          </Button>
        </div>
      )}

      {/* Timetable Week Grid (08:00 - 21:00 x Mon - Sun) */}
      <div className="rounded-card border border-[#D6B48A] bg-[#F6E3D1] overflow-x-auto shadow-card">
        <div className="min-w-[960px]">
          {/* Header Days Row */}
          <div className="grid grid-cols-8 border-b border-[#DDBF9F] bg-[#EBCDB1] text-xs font-semibold text-[#1E140E]">
            <div className="p-2.5 border-r border-[#DDBF9F] text-center text-[#5C4636] font-mono">
              Time (IST)
            </div>
            {days.map((day, dIdx) => (
              <div
                key={dIdx}
                className={cn(
                  'p-2.5 text-center border-r border-[#DDBF9F] last:border-r-0 text-[#5C4636]',
                  dIdx === 3 && hasConflicts && !isDiffMode
                    ? 'text-[#A3123F] font-semibold bg-[#A3123F]/10'
                    : ''
                )}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Time Slots */}
          <div className="divide-y divide-[#DDBF9F]">
            {timeSlots.map((time) => (
              <div key={time} className="grid grid-cols-8 min-h-[60px]">
                {/* Time Column */}
                <div className="p-2 border-r border-[#DDBF9F] bg-[#EBCDB1]/25 text-[11px] font-mono text-[#5C4636] text-center flex items-center justify-center">
                  {time}
                </div>

                {/* Day Columns (1-7) */}
                {[1, 2, 3, 4, 5, 6, 7].map((dayNum) => {
                  const matchingSessions = sessions.filter(
                    (s) => s.dayOfWeek === dayNum && s.startTime === time
                  )

                  return (
                    <div
                      key={dayNum}
                      className={cn(
                        'p-1 border-r border-[#DDBF9F] last:border-r-0 relative hover:bg-[#EBCDB1]/20 transition-colors',
                        dayNum === 4 && hasConflicts && !isDiffMode ? 'bg-[#A3123F]/5' : ''
                      )}
                    >
                      {matchingSessions.map((sess) => {
                        const strength = store.getBatchStrength(sess.batchId)

                        const pastelOrder = [
                          { bg: '#F4C7A1', border: '#DCA477' }, // peach
                          { bg: '#C5D9B8', border: '#A3BC94' }, // sage
                          { bg: '#BCD4E6', border: '#9AB6CB' }, // sky
                          { bg: '#D7C7E8', border: '#BAA5CF' }, // lavender
                          { bg: '#EBD08F', border: '#CEB06A' }, // mustard
                          { bg: '#EEC0C8', border: '#D49AA4' }, // rose
                          { bg: '#B4DCD6', border: '#8FBFB7' }, // teal
                          { bg: '#E2CDB0', border: '#C3AA8A' }, // sand
                          { bg: '#F2B5A0', border: '#D79178' }, // coral
                          { bg: '#CDE8CF', border: '#A6CBA8' }, // mint
                        ]
                        let charSum = 0
                        const key = sess.batchName || sess.id
                        for (let i = 0; i < key.length; i++) charSum += key.charCodeAt(i)
                        const pastel = pastelOrder[charSum % pastelOrder.length]

                        const matchingDiff = diffItems.find((d) => d.sessionId === sess.id)

                        return (
                          <div
                            key={sess.id}
                            onClick={() => setSelectedSession(sess)}
                            style={{
                              backgroundColor: pastel.bg,
                              borderColor: sess.hasConflict ? '#A3123F' : pastel.border,
                              borderWidth: sess.hasConflict ? '2px' : '1px',
                            }}
                            className={cn(
                              'p-2 rounded-control text-xs cursor-pointer text-[#1E140E] transition-all mb-1 shadow-sm',
                              sess.hasConflict ? 'ring-1 ring-[#A3123F]/20' : ''
                            )}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-semibold truncate text-[#1E140E]">
                                {sess.batchName}
                              </span>
                              {sess.isLocked ? (
                                <Lock className="w-3 h-3 text-[#1E140E] shrink-0" />
                              ) : null}
                            </div>

                            {/* Second line: Class strength computed dynamically (Section 3) */}
                            <div className="text-[11px] text-[#5C4636] font-medium truncate mt-0.5">
                              {strength.enrolled} students · {strength.online} online
                            </div>

                            <div className="text-[11px] text-[#5C4636] truncate mt-0.5">
                              {sess.trainerName} · {sess.room}
                            </div>

                            {sess.hasConflict && (
                              <div className="mt-1">
                                <ReasonChip
                                  reason={sess.conflictReason || 'Clash: Double-booked'}
                                  variant="danger"
                                />
                              </div>
                            )}

                            {isDiffMode && matchingDiff && (
                              <div className="mt-1">
                                <ReasonChip
                                  reason={matchingDiff.reason}
                                  variant={
                                    matchingDiff.reasonCode === 'SUBSTITUTE_ALLOCATED'
                                      ? 'warning'
                                      : 'neutral'
                                  }
                                />
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Session Details Drawer */}
      {selectedSession && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs flex justify-end"
          onClick={() => setSelectedSession(null)}
        >
          <div
            className="w-full max-w-md h-full bg-surface border-l border-border p-6 shadow-dialog flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Session details
                </h3>
                <button
                  onClick={() => setSelectedSession(null)}
                  className="text-text-muted hover:text-text p-1 rounded-control"
                  aria-label="Close drawer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <h2 className="text-base font-semibold text-text">{selectedSession.batchName}</h2>
                <p className="text-xs text-text-muted mt-0.5">{selectedSession.courseName}</p>
              </div>

              {/* Class Strength breakdown (Section 3) */}
              {(() => {
                const str = store.getBatchStrength(selectedSession.batchId)
                return (
                  <div className="p-3 rounded-card border border-border bg-surface-sunken space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-text flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-accent" />
                        Class Strength & Capacity
                      </span>
                      <span
                        className={cn(
                          'text-[10px] px-1.5 py-0.5 rounded font-medium',
                          str.enrolled > str.capacity
                            ? 'bg-danger/10 text-danger border border-danger/30'
                            : 'bg-success/10 text-success border border-success/30'
                        )}
                      >
                        {str.enrolled > str.capacity ? 'Over capacity' : 'Optimal'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded bg-surface border border-border">
                        <div className="text-[10px] text-text-muted">Total Enrolled</div>
                        <div className="font-semibold text-text mt-0.5">
                          {str.enrolled} / {str.capacity}
                        </div>
                      </div>
                      <div className="p-2 rounded bg-surface border border-border">
                        <div className="text-[10px] text-text-muted">Seats Left</div>
                        <div className="font-semibold text-text mt-0.5">
                          {Math.max(0, str.capacity - str.enrolled)}
                        </div>
                      </div>
                      <div className="p-2 rounded bg-surface border border-border">
                        <div className="text-[10px] text-text-muted">In-Room</div>
                        <div className="font-semibold text-text mt-0.5">
                          {str.inRoom} (Cap: {str.roomCapacity})
                        </div>
                      </div>
                      <div className="p-2 rounded bg-surface border border-border">
                        <div className="text-[10px] text-text-muted">Online / Remote</div>
                        <div className="font-semibold text-text mt-0.5">
                          {str.online} (Limit: {str.onlineSeatLimit})
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })()}

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-border">
                  <span className="text-text-muted">Trainer</span>
                  <span className="font-medium text-text">{selectedSession.trainerName}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-border">
                  <span className="text-text-muted">Room & mode</span>
                  <span className="font-medium text-text">
                    {selectedSession.room} ({selectedSession.isOnline ? 'Hybrid / Zoom' : 'In-person'})
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-border">
                  <span className="text-text-muted">Time slot</span>
                  <span className="font-mono text-text">
                    {selectedSession.startTime} - {selectedSession.endTime} IST
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-border">
                  <span className="text-text-muted">Campus</span>
                  <span className="font-medium text-text">{selectedSession.branch}</span>
                </div>
              </div>

              {selectedSession.hasConflict && (
                <div className="p-3 rounded-card border border-danger/30 bg-danger/5 text-xs text-text space-y-1">
                  <div className="font-semibold text-danger flex items-center gap-1.5">
                    <AlertOctagon className="w-3.5 h-3.5" />
                    Conflict detected
                  </div>
                  <p className="text-text-muted">{selectedSession.conflictReason}</p>
                </div>
              )}
            </div>

            <div className="space-y-2 pt-4 border-t border-border">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => toggleLock(selectedSession.id)}
                leftIcon={
                  selectedSession.isLocked ? (
                    <Unlock className="w-3.5 h-3.5" />
                  ) : (
                    <Lock className="w-3.5 h-3.5" />
                  )
                }
              >
                {selectedSession.isLocked ? 'Unlock session slot' : 'Lock to slot'}
              </Button>
              <Button
                variant="primary"
                className="w-full"
                onClick={() => setSelectedSession(null)}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Change List Drawer (Diff Mode) */}
      {showChangeDrawer && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs flex justify-end"
          onClick={() => setShowChangeDrawer(false)}
        >
          <div
            className="w-full max-w-md h-full bg-surface border-l border-border p-6 shadow-dialog flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                  <GitCompare className="w-3.5 h-3.5 text-accent" />
                  Proposed timetable adjustments
                </h3>
                <button
                  onClick={() => setShowChangeDrawer(false)}
                  className="text-text-muted hover:text-text p-1 rounded-control"
                  aria-label="Close drawer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 overflow-y-auto max-h-[460px]">
                {replanMetrics && (
                  <div className="p-2.5 rounded-card bg-surface border border-border text-[11px] text-text-muted flex items-center justify-between font-mono">
                    <span>Re-plan: {replanMetrics.timeMs.toFixed(1)} ms</span>
                    <span>·</span>
                    <span>{replanMetrics.moved} moved</span>
                    <span>·</span>
                    <span>{replanMetrics.substitutes} substitute</span>
                    <span>·</span>
                    <span
                      className={
                        replanMetrics.remainingConflicts > 0
                          ? 'text-danger font-medium'
                          : 'text-success font-medium'
                      }
                    >
                      {replanMetrics.remainingConflicts} conflicts
                    </span>
                  </div>
                )}

                {diffItems.length === 0 ? (
                  <div className="p-4 text-center text-xs text-text-muted bg-surface-sunken rounded-card border border-border">
                    No active adjustments in this re-plan.
                  </div>
                ) : (
                  diffItems.map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        'p-3 rounded-card border text-xs space-y-1.5 transition-colors',
                        item.accepted
                          ? 'bg-surface-sunken border-border'
                          : 'bg-surface border-dashed border-border opacity-60'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-text">{item.batchName}</span>
                        <button
                          onClick={() => toggleDiffItem(item.id)}
                          className={cn(
                            'text-[10px] px-2 py-0.5 rounded border font-medium transition-colors',
                            item.accepted
                              ? 'bg-surface border-border text-text hover:bg-danger/10 hover:text-danger hover:border-danger/30'
                              : 'bg-accent/15 border-accent/40 text-accent font-semibold'
                          )}
                        >
                          {item.accepted ? 'Revert change' : 'Accept change'}
                        </button>
                      </div>
                      <div className="line-through text-text-muted font-mono text-[11px]">
                        {item.before}
                      </div>
                      <div className="text-text font-medium font-mono text-[11px] flex items-center gap-1">
                        <ArrowRight className="w-3 h-3 text-accent shrink-0" />
                        <span>{item.after}</span>
                      </div>
                      <ReasonChip
                        reason={item.reason}
                        variant={item.reasonCode === 'SUBSTITUTE_ALLOCATED' ? 'warning' : 'neutral'}
                        className="mt-1"
                      />
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-border flex items-center gap-2">
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => {
                  setShowChangeDrawer(false)
                  handleOpenPublish()
                }}
              >
                Proceed to publish ({diffItems.filter((d) => d.accepted).length})
              </Button>
              <Button variant="outline" onClick={() => setShowChangeDrawer(false)}>
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Trainer on leave modal */}
      {showTrainerLeaveModal && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowTrainerLeaveModal(false)}
        >
          <div
            className="w-full max-w-md bg-surface border border-border rounded-dialog shadow-dialog p-6 text-text space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-sm font-semibold text-text flex items-center gap-2">
                <UserX className="w-4 h-4 text-warning" />
                Simulate Trainer on Leave
              </h3>
              <button
                onClick={() => setShowTrainerLeaveModal(false)}
                className="text-text-muted hover:text-text p-1 rounded-control"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-text font-medium mb-1">Select Trainer</label>
                <select
                  value={leaveTrainerId}
                  onChange={(e) => setLeaveTrainerId(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-control bg-surface border border-border text-text focus:outline-none focus:border-accent"
                >
                  {trainers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.specialization?.[0] || 'Trainer'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-text font-medium mb-1">Leave Date</label>
                <input
                  type="date"
                  value={leaveDate}
                  onChange={(e) => setLeaveDate(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-control bg-surface border border-border text-text focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button variant="outline" onClick={() => setShowTrainerLeaveModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => handleTrainerLeaveReplan(leaveTrainerId, leaveDate)}
              >
                Run re-plan
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Room closed modal */}
      {showRoomClosedModal && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowRoomClosedModal(false)}
        >
          <div
            className="w-full max-w-md bg-surface border border-border rounded-dialog shadow-dialog p-6 text-text space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-sm font-semibold text-text flex items-center gap-2">
                <DoorClosed className="w-4 h-4 text-text-muted" />
                Simulate Room Closure
              </h3>
              <button
                onClick={() => setShowRoomClosedModal(false)}
                className="text-text-muted hover:text-text p-1 rounded-control"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-text font-medium mb-1">Select Room to Close</label>
                <select
                  value={closedRoom}
                  onChange={(e) => setClosedRoom(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-control bg-surface border border-border text-text focus:outline-none focus:border-accent"
                >
                  {Object.keys(ROOM_CAPACITIES).map((roomName) => (
                    <option key={roomName} value={roomName}>
                      {roomName} (Cap: {ROOM_CAPACITIES[roomName]} seats)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-text font-medium mb-1">Closure Date</label>
                <input
                  type="date"
                  value={closedRoomDate}
                  onChange={(e) => setClosedRoomDate(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-control bg-surface border border-border text-text focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button variant="outline" onClick={() => setShowRoomClosedModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => handleRoomClosedReplan(closedRoom, closedRoomDate)}
              >
                Run re-plan
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Publish Approval Card Modal */}
      {showPublishApproval && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowPublishApproval(false)}
        >
          <div
            className="w-full max-w-lg bg-surface border border-border rounded-dialog shadow-dialog p-6 text-text relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-sm font-semibold text-text">
                Publish timetable and broadcast alerts
              </h3>
              <button
                onClick={() => setShowPublishApproval(false)}
                className="text-text-muted hover:text-text p-1 rounded-control"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4">
              <ApprovalCard
                approval={currentPublishApproval || store.approvals[1]}
                onApproved={() => {
                  store.applyReplan(
                    diffItems.filter((d) => d.accepted),
                    sessions
                  )
                  setIsDiffMode(false)
                  setShowChangeDrawer(false)
                  setShowPublishApproval(false)
                  success('Timetable published & student alerts sent')
                }}
                onRejected={() => {
                  setShowPublishApproval(false)
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
