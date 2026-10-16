import React, { useState } from 'react'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  GitCompare,
  AlertTriangle,
  Lock,
  Unlock,
  Check,
  Send,
  Layers,
  Building2,
  Users,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Plus,
  X,
  FileSpreadsheet,
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
  const { success, error } = useToast()

  const [viewMode, setViewMode] = useState<'trainer' | 'room' | 'batch'>('batch')
  const [sessions, setSessions] = useState<TimetableSession[]>([...store.timetableSessions])
  const [isDiffMode, setIsDiffMode] = useState(false)
  const [selectedSession, setSelectedSession] = useState<TimetableSession | null>(null)
  const [showPublishApproval, setShowPublishApproval] = useState(false)
  const [showChangeDrawer, setShowChangeDrawer] = useState(false)

  const days = ['Mon 19 Oct', 'Tue 20 Oct', 'Wed 21 Oct', 'Thu 22 Oct', 'Fri 23 Oct', 'Sat 24 Oct', 'Sun 25 Oct']
  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00', '21:00'
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
      'AI Re-plan Generated (1.8s)',
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
    success('Session lock toggled')
  }

  return (
    <div className="space-y-4 animate-fade-in select-none">
      {/* Top Controls Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-2 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-surface-2 border border-border rounded-btn p-0.5">
            <button className="p-1 hover:text-fg text-fg-muted rounded">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 text-xs font-semibold text-fg">Week of 19 Oct – 25 Oct 2026</span>
            <button className="p-1 hover:text-fg text-fg-muted rounded">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Segmented View Switcher */}
          <div className="flex items-center bg-surface-2 border border-border rounded-btn p-0.5 text-xs font-medium">
            <button
              onClick={() => setViewMode('batch')}
              className={cn(
                'px-2.5 py-1 rounded-btn transition-colors',
                viewMode === 'batch' ? 'bg-surface text-fg font-semibold shadow-sm' : 'text-fg-muted hover:text-fg'
              )}
            >
              Batch View
            </button>
            <button
              onClick={() => setViewMode('trainer')}
              className={cn(
                'px-2.5 py-1 rounded-btn transition-colors',
                viewMode === 'trainer' ? 'bg-surface text-fg font-semibold shadow-sm' : 'text-fg-muted hover:text-fg'
              )}
            >
              Trainer View
            </button>
            <button
              onClick={() => setViewMode('room')}
              className={cn(
                'px-2.5 py-1 rounded-btn transition-colors',
                viewMode === 'room' ? 'bg-surface text-fg font-semibold shadow-sm' : 'text-fg-muted hover:text-fg'
              )}
            >
              Room View
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Arjun on Leave Simulation Button */}
          <Button
            variant="ai"
            size="sm"
            onClick={handleSimulateArjunLeave}
            className="shadow-sm"
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
              Revert Diff
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowPublishApproval(true)}
            leftIcon={<Send className="w-3.5 h-3.5" />}
          >
            Publish Timetable
          </Button>
        </div>
      </div>

      {/* Conflict Bar (Active when not in resolved diff mode) */}
      {!isDiffMode && hasConflicts && (
        <div className="p-3 rounded-card border border-danger/40 bg-danger/10 flex items-center justify-between gap-3 text-xs animate-pulse-subtle">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-danger shrink-0" />
            <div>
              <span className="font-bold text-danger">
                {conflictCount} Operational Conflicts Detected:
              </span>{' '}
              <span className="text-fg">
                Arjun double-booked Thu 19:00 (Room 3 & Room 1) · Room 3 capacity exceeded on Mon 19:00
              </span>
            </div>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleSimulateArjunLeave}
            className="text-xs h-7"
          >
            Auto Re-plan with AI
          </Button>
        </div>
      )}

      {/* Re-plan Summary Banner (Diff Mode) */}
      {isDiffMode && (
        <div className="p-3 rounded-card border border-success/40 bg-success/10 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-success shrink-0" />
            <div>
              <span className="font-bold text-success">
                Re-planned in 1.8 s · 3 moved · 1 substitute · 0 conflicts
              </span>
              <p className="text-fg-muted mt-0.5">
                Ghost boxes show prior conflicting positions. Click any row to inspect substitution rationale.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowChangeDrawer(true)}
            className="h-7 text-xs border-success/30 text-success hover:bg-success/20"
          >
            Inspect Change List
          </Button>
        </div>
      )}

      {/* Timetable Grid (08:00 - 21:00 x Mon - Sun) */}
      <div className="rounded-card border border-border bg-surface overflow-x-auto shadow-sm">
        <div className="min-w-[980px]">
          {/* Header Days Row */}
          <div className="grid grid-cols-8 border-b border-border bg-surface-2 text-xs font-semibold text-fg">
            <div className="p-2.5 border-r border-border text-center text-fg-muted font-mono">
              IST Time
            </div>
            {days.map((day, dIdx) => (
              <div
                key={dIdx}
                className={cn(
                  'p-2.5 text-center border-r border-border last:border-r-0',
                  dIdx === 3 && hasConflicts && !isDiffMode
                    ? 'bg-danger/10 text-danger font-bold'
                    : ''
                )}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Time Slots */}
          <div className="divide-y divide-border/60">
            {timeSlots.map((time) => (
              <div key={time} className="grid grid-cols-8 min-h-[58px]">
                {/* Time Column */}
                <div className="p-2 border-r border-border bg-surface-2/40 text-[11px] font-mono text-fg-muted text-center flex items-center justify-center">
                  {time}
                </div>

                {/* Day Columns (1-7) */}
                {[1, 2, 3, 4, 5, 6, 7].map((dayNum) => {
                  // Find sessions in this slot
                  const matchingSessions = sessions.filter(
                    (s) => s.dayOfWeek === dayNum && s.startTime === time
                  )

                  return (
                    <div
                      key={dayNum}
                      className={cn(
                        'p-1 border-r border-border last:border-r-0 relative hover:bg-surface-2/30 transition-colors',
                        dayNum === 4 && hasConflicts && !isDiffMode ? 'bg-danger/5' : ''
                      )}
                    >
                      {matchingSessions.map((sess) => (
                        <div
                          key={sess.id}
                          onClick={() => setSelectedSession(sess)}
                          className={cn(
                            'p-2 rounded-btn text-xs cursor-pointer shadow-sm border transition-all mb-1',
                            sess.hasConflict
                              ? 'border-danger bg-danger/15 text-danger ring-1 ring-danger'
                              : isDiffMode && sess.id === 'sess-th1'
                              ? 'border-ai bg-ai/15 text-fg ring-1 ring-ai'
                              : 'border-primary/30 bg-primary/10 text-fg hover:border-primary'
                          )}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-semibold truncate">{sess.batchName}</span>
                            {sess.isLocked ? (
                              <Lock className="w-3 h-3 text-fg-muted shrink-0" />
                            ) : null}
                          </div>

                          <div className="text-[11px] text-fg-muted truncate mt-0.5">
                            {sess.trainerName} · {sess.room}
                          </div>

                          {sess.hasConflict && (
                            <ReasonChip
                              reason={sess.conflictReason || 'Clash'}
                              variant="danger"
                              className="mt-1"
                            />
                          )}

                          {isDiffMode && sess.id === 'sess-th2' && (
                            <ReasonChip
                              reason="Substituted: Meera Rao"
                              variant="ai"
                              className="mt-1"
                            />
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
            className="w-full max-w-md h-full bg-surface border-l border-border p-6 shadow-2xl flex flex-col justify-between animate-slide-in-right"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="text-sm font-semibold text-fg">Session Details</h3>
                <button
                  onClick={() => setSelectedSession(null)}
                  className="text-fg-muted hover:text-fg p-1 rounded-btn"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <h2 className="text-base font-bold text-fg">{selectedSession.batchName}</h2>
                <p className="text-xs text-fg-muted">{selectedSession.courseName}</p>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-border">
                  <span className="text-fg-muted">Trainer</span>
                  <span className="font-medium text-fg">{selectedSession.trainerName}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border">
                  <span className="text-fg-muted">Room & Mode</span>
                  <span className="font-medium text-fg">
                    {selectedSession.room} ({selectedSession.isOnline ? 'Hybrid / Zoom' : 'In-person'})
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border">
                  <span className="text-fg-muted">Time Slot</span>
                  <span className="font-mono text-fg">
                    {selectedSession.startTime} - {selectedSession.endTime} IST
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border">
                  <span className="text-fg-muted">Campus</span>
                  <span className="font-medium text-fg">{selectedSession.branch}</span>
                </div>
              </div>

              {selectedSession.hasConflict && (
                <div className="p-3 rounded-card border border-danger/40 bg-danger/10 text-xs text-danger space-y-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Conflict Detected
                  </div>
                  <p>{selectedSession.conflictReason}</p>
                </div>
              )}
            </div>

            <div className="space-y-2 pt-4 border-t border-border">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => toggleLock(selectedSession.id)}
                leftIcon={selectedSession.isLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              >
                {selectedSession.isLocked ? 'Unlock Session Slot' : 'Lock to Slot (Prevent Auto Move)'}
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
            className="w-full max-w-md h-full bg-surface border-l border-border p-6 shadow-2xl flex flex-col justify-between animate-slide-in-right"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="text-sm font-semibold text-fg flex items-center gap-1.5">
                  <GitCompare className="w-4 h-4 text-ai" />
                  Proposed Timetable Diff
                </h3>
                <button
                  onClick={() => setShowChangeDrawer(false)}
                  className="text-fg-muted hover:text-fg p-1 rounded-btn"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-btn bg-surface-2 border border-border text-xs space-y-1">
                  <div className="line-through text-fg-muted font-mono text-[11px]">
                    Thu 22 Oct · 19:00 - 21:00 · Room 3 (Arjun Mehta)
                  </div>
                  <div className="text-success font-semibold font-mono text-[11px] flex items-center gap-1">
                    <ArrowRight className="w-3 h-3 text-success" />
                    Fri 23 Oct · 19:00 - 21:00 · Room 3 (Arjun Mehta)
                  </div>
                  <ReasonChip
                    reason="Arjun on approved leave Thu; Room 3 is vacant on Friday 19:00"
                    variant="neutral"
                    className="mt-1"
                  />
                </div>

                <div className="p-3 rounded-btn bg-surface-2 border border-border text-xs space-y-1">
                  <div className="line-through text-fg-muted font-mono text-[11px]">
                    Spring Doubt Lab · Arjun Mehta
                  </div>
                  <div className="text-success font-semibold font-mono text-[11px] flex items-center gap-1">
                    <ArrowRight className="w-3 h-3 text-success" />
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
              Accept All Adjustments
            </Button>
          </div>
        </div>
      )}

      {/* Publish Approval Card Modal */}
      {showPublishApproval && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowPublishApproval(false)}
        >
          <div
            className="w-full max-w-lg bg-surface border border-border rounded-modal shadow-modal p-6 text-fg relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-sm font-semibold">Publish Timetable & Broadcast Notifications</h3>
              <button
                onClick={() => setShowPublishApproval(false)}
                className="text-fg-muted hover:text-fg p-1 rounded-btn"
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
