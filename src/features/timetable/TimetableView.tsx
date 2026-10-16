import React, { useState } from 'react'
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
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ReasonChip } from '@/components/ui/ReasonChip'
import { ApprovalCard } from '@/components/app/ApprovalCard'
import { useApp } from '@/context/AppContext'
import { useToast } from '@/context/ToastContext'
import { store } from '@/mocks/store'
import { TimetableSession } from '@/types'
import { cn } from '@/lib/utils'

export const TimetableView: React.FC = () => {
  const { branch } = useApp()
  const { success } = useToast()

  const [viewMode, setViewMode] = useState<'batch' | 'trainer' | 'room'>('batch')
  const [sessions, setSessions] = useState<TimetableSession[]>([...store.timetableSessions])
  const [isDiffMode, setIsDiffMode] = useState(false)
  const [selectedSession, setSelectedSession] = useState<TimetableSession | null>(null)
  const [showPublishApproval, setShowPublishApproval] = useState(false)
  const [showChangeDrawer, setShowChangeDrawer] = useState(false)

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

  const hasConflicts = sessions.some((s) => s.hasConflict)
  const conflictCount = sessions.filter((s) => s.hasConflict).length

  // Trigger Re-plan Simulation: Arjun on leave Thursday
  const handleSimulateArjunLeave = () => {
    store.simulateArjunLeave()
    setSessions([...store.timetableSessions])
    setIsDiffMode(true)
    setShowChangeDrawer(true)
    success(
      'Schedule re-planned',
      '3 sessions moved, 1 substitute assigned (Meera Rao), 0 conflicts remaining.'
    )
  }

  const handleReset = () => {
    setIsDiffMode(false)
    setShowChangeDrawer(false)
    setSessions([...store.timetableSessions])
  }

  const toggleLock = (sessId: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === sessId ? { ...s, isLocked: !s.isLocked } : s))
    )
    success('Session slot lock toggled')
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

        {/* Action Buttons: single primary button */}
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSimulateArjunLeave}
          >
            Simulate: Arjun on leave Thursday
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
            onClick={() => setShowPublishApproval(true)}
            leftIcon={<Send className="w-3.5 h-3.5" />}
          >
            Publish timetable
          </Button>
        </div>
      </div>

      {/* Conflict Bar */}
      {!isDiffMode && hasConflicts && (
        <div className="p-3 rounded-card border border-border bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-danger shrink-0" />
            <div className="text-text">
              <span className="font-semibold text-danger">
                {conflictCount} conflicts detected:
              </span>{' '}
              <span>
                Arjun Thu 19:00 (Room 3 & Room 1) · Room 3 over capacity (32 of 30)
              </span>
            </div>
          </div>
          <Button
            variant="secondary"
            size="xs"
            onClick={handleSimulateArjunLeave}
            className="self-start sm:self-auto shrink-0"
          >
            Simulate clash resolution
          </Button>
        </div>
      )}

      {/* Re-plan Summary Banner (Diff Mode) */}
      {isDiffMode && (
        <div className="p-3 rounded-card border border-border bg-surface-sunken/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-accent shrink-0" />
            <div className="text-text">
              <span className="font-semibold">
                Re-planned diff: 3 moved · 1 substitute (Meera Rao) · 0 conflicts
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
            Inspect change list
          </Button>
        </div>
      )}

      {/* Timetable Week Grid (08:00 - 21:00 x Mon - Sun) */}
      <div className="rounded-card border border-border bg-surface overflow-x-auto">
        <div className="min-w-[960px]">
          {/* Header Days Row */}
          <div className="grid grid-cols-8 border-b border-border bg-surface-sunken text-xs font-semibold text-text">
            <div className="p-2.5 border-r border-border text-center text-text-muted font-mono">
              Time (IST)
            </div>
            {days.map((day, dIdx) => (
              <div
                key={dIdx}
                className={cn(
                  'p-2.5 text-center border-r border-border last:border-r-0',
                  dIdx === 3 && hasConflicts && !isDiffMode
                    ? 'text-danger font-semibold bg-danger/5'
                    : ''
                )}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Time Slots */}
          <div className="divide-y divide-border">
            {timeSlots.map((time) => (
              <div key={time} className="grid grid-cols-8 min-h-[60px]">
                {/* Time Column */}
                <div className="p-2 border-r border-border bg-surface-sunken/40 text-[11px] font-mono text-text-muted text-center flex items-center justify-center">
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
                        'p-1 border-r border-border last:border-r-0 relative hover:bg-surface-sunken/30 transition-colors',
                        dayNum === 4 && hasConflicts && !isDiffMode ? 'bg-danger/5' : ''
                      )}
                    >
                      {matchingSessions.map((sess) => (
                        <div
                          key={sess.id}
                          onClick={() => setSelectedSession(sess)}
                          className={cn(
                            'p-2 rounded-control text-xs cursor-pointer border transition-all mb-1',
                            sess.hasConflict
                              ? 'border-danger bg-surface text-text'
                              : isDiffMode && (sess.id === 'sess-th1' || sess.id === 'sess-f2')
                              ? 'border-accent bg-surface text-text'
                              : 'border-border bg-surface hover:border-border-strong text-text'
                          )}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-medium truncate">{sess.batchName}</span>
                            {sess.isLocked ? (
                              <Lock className="w-3 h-3 text-text-muted shrink-0" />
                            ) : null}
                          </div>

                          <div className="text-[11px] text-text-muted truncate mt-0.5">
                            {sess.trainerName} · {sess.room}
                          </div>

                          {sess.hasConflict && (
                            <div className="mt-1">
                              <ReasonChip
                                reason="Clash: Room double-booked"
                                variant="danger"
                              />
                            </div>
                          )}

                          {isDiffMode && sess.id === 'sess-th2' && (
                            <div className="mt-1">
                              <ReasonChip
                                reason="Substituted: Meera Rao"
                                variant="neutral"
                              />
                            </div>
                          )}
                        </div>
                      ))}
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
                <div className="p-3 rounded-card border border-border bg-surface-sunken text-xs text-text space-y-1">
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

              <div className="space-y-3">
                <div className="p-3 rounded-card bg-surface-sunken border border-border text-xs space-y-1">
                  <div className="line-through text-text-muted font-mono text-[11px]">
                    Thu 22 Oct · 19:00 - 21:00 · Room 3 (Arjun Mehta)
                  </div>
                  <div className="text-text font-medium font-mono text-[11px] flex items-center gap-1">
                    <ArrowRight className="w-3 h-3 text-accent" />
                    Fri 23 Oct · 19:00 - 21:00 · Room 3 (Arjun Mehta)
                  </div>
                  <ReasonChip
                    reason="Arjun on approved leave Thu; Room 3 is vacant on Friday 19:00"
                    variant="neutral"
                    className="mt-1"
                  />
                </div>

                <div className="p-3 rounded-card bg-surface-sunken border border-border text-xs space-y-1">
                  <div className="line-through text-text-muted font-mono text-[11px]">
                    Spring Doubt Lab · Arjun Mehta
                  </div>
                  <div className="text-text font-medium font-mono text-[11px] flex items-center gap-1">
                    <ArrowRight className="w-3 h-3 text-accent" />
                    Spring Doubt Lab · Meera Rao (Substitute)
                  </div>
                  <ReasonChip
                    reason="Meera Rao certified in Java; 0 clashes in calendar"
                    variant="neutral"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            <Button
              variant="primary"
              className="w-full"
              onClick={() => {
                setShowChangeDrawer(false)
                success('Diff accepted into working timetable')
              }}
            >
              Accept all adjustments
            </Button>
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
                approval={store.approvals[1]}
                onApproved={() => {
                  setShowPublishApproval(false)
                  success('Timetable published & student alerts sent')
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
