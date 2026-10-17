import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  Building2,
  AlertOctagon,
  Play,
  Download,
  CheckCircle2,
  AlertTriangle,
  X,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { store, useStore } from '@/mocks/store'
import { useToast } from '@/context/ToastContext'
import { exportToCsv } from '@/lib/exportCsv'

interface RoomOption {
  name: string
  capacity: number
}

const AVAILABLE_ROOMS: RoomOption[] = [
  { name: 'Room 1', capacity: 30 },
  { name: 'Room 2', capacity: 25 },
  { name: 'Room 3', capacity: 28 },
  { name: 'Room 4', capacity: 42 },
  { name: 'Lab A', capacity: 36 },
  { name: 'Lab B', capacity: 32 },
]

export const BatchDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { success, error } = useToast()

  const batches = useStore((s) => s.batches)
  const students = useStore((s) => s.students)
  const timetableSessions = useStore((s) => s.timetableSessions)

  const batch = batches.find((b) => b.id === id) || batches[0]
  const enrolledStudents = students.filter((s) => s.batchIds.includes(batch.id))

  const isOverCapacity = batch.enrolledCount > batch.capacity

  // Room reassignment modal state
  const [showRoomModal, setShowRoomModal] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState(batch.room)

  const handleReassignRoom = (targetRoomName?: string) => {
    const roomToAssign = targetRoomName || selectedRoom
    const roomDef = AVAILABLE_ROOMS.find((r) => r.name === roomToAssign)

    if (roomDef && roomDef.capacity < batch.enrolledCount) {
      error(
        'Capacity shortfall',
        `${roomToAssign} capacity (${roomDef.capacity}) is less than enrolled count (${batch.enrolledCount}).`
      )
      return
    }

    // Check for room clash in current schedule
    const clashSession = timetableSessions.find(
      (s) =>
        s.room === roomToAssign &&
        s.batchId !== batch.id &&
        s.batchName !== batch.name &&
        s.dayOfWeek === 1 // sample day check
    )

    if (clashSession) {
      error(
        'Room schedule clash',
        `${roomToAssign} is already booked by ${clashSession.batchName} on Mon ${clashSession.startTime}-${clashSession.endTime}.`
      )
      return
    }

    store.reassignBatchRoom(batch.id, roomToAssign)
    setShowRoomModal(false)
    success(
      'Room reassigned',
      `${batch.name} relocated to ${roomToAssign}. Timetable sessions updated.`
    )
  }

  const handleExportRoster = () => {
    const exportRows = enrolledStudents.map((s) => ({
      ID: s.id,
      Name: s.name,
      Email: s.email,
      Phone: s.phone,
      Batch: batch.name,
      'Attendance Rate': `${s.attendanceRate}%`,
      'Risk Level': s.riskLevel,
    }))
    exportToCsv(exportRows, `batch_${batch.code}_roster.csv`)
    success('Roster exported', `Downloaded ${enrolledStudents.length} student records as CSV.`)
  }

  const renderRiskGlyph = (risk: string) => {
    switch (risk) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 text-danger font-medium text-xs">
            <AlertOctagon className="w-3.5 h-3.5" /> Critical
          </span>
        )
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 text-warning font-medium text-xs">
            <AlertTriangle className="w-3.5 h-3.5" /> High
          </span>
        )
      case 'watch':
        return (
          <span className="inline-flex items-center gap-1 text-text-muted text-xs">
            <Clock className="w-3.5 h-3.5" /> Watch
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 text-text-muted text-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-success" /> Low
          </span>
        )
    }
  }

  return (
    <div className="space-y-4">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate('/batches')}
          className="text-xs text-text-muted hover:text-text inline-flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to batches</span>
        </button>
      </div>

      {/* Header Card */}
      <div className="p-4 rounded-card border border-border bg-surface space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-text-muted border border-border px-1.5 py-0.5 rounded bg-surface-sunken">
                {batch.code}
              </span>
              <h1 className="text-lg font-semibold text-text">{batch.name}</h1>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              Course: {batch.courseName} · Campus: {batch.branch}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowRoomModal(true)}
              leftIcon={<Building2 className="w-3.5 h-3.5" />}
            >
              Reassign room
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/sessions/sess-m2')}
              leftIcon={<Play className="w-3.5 h-3.5" />}
            >
              Start session (QR)
            </Button>
          </div>
        </div>

        {/* Capacity Warning Banner */}
        {isOverCapacity && (
          <div className="p-3 rounded-control border border-border bg-surface-sunken text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-danger font-medium">
              <AlertOctagon className="w-4 h-4 shrink-0" />
              <span>
                Over capacity: {batch.enrolledCount} students assigned to {batch.room} (Limit: {batch.capacity}).
              </span>
            </div>
            <Button
              variant="secondary"
              size="xs"
              onClick={() => handleReassignRoom('Room 4')}
            >
              Relocate to Room 4 (Cap 42)
            </Button>
          </div>
        )}

        {/* Weekly Pattern Visual & KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-border text-xs">
          <div>
            <div className="text-text-muted text-[11px]">Schedule pattern</div>
            <div className="font-medium text-text tabular-nums mt-0.5">{batch.schedulePattern}</div>
          </div>
          <div>
            <div className="text-text-muted text-[11px]">Assigned trainer</div>
            <div className="font-medium text-text mt-0.5">{batch.trainerName}</div>
          </div>
          <div>
            <div className="text-text-muted text-[11px]">Room & seat limit</div>
            <div className="font-medium text-text mt-0.5">
              {batch.room} ({batch.onlineSeatLimit} online seats)
            </div>
          </div>
          <div>
            <div className="text-text-muted text-[11px]">Current module</div>
            <div className="font-medium text-accent mt-0.5">{batch.currentModule}</div>
          </div>
        </div>
      </div>

      {/* Class Strength Card */}
      {(() => {
        const strength = store.getBatchStrength(batch.id)
        const seatsLeft = Math.max(0, strength.capacity - strength.enrolled)
        const isOver = strength.enrolled > strength.capacity || strength.inRoom > strength.roomCapacity

        return (
          <div className="p-4 rounded-card border border-border bg-surface text-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-accent" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-text">Class Strength & Capacity</h2>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded ${isOver ? 'bg-danger/10 text-danger' : 'bg-surface-sunken text-text'}`}>
                {strength.enrolled} / {strength.capacity} Enrolled ({seatsLeft} seats left)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 pt-2 border-t border-border">
              <div className="p-2.5 rounded-control bg-surface-sunken border border-border">
                <span className="text-[10px] text-text-muted block">Enrolled Total</span>
                <span className="text-sm font-semibold text-text tabular-nums">{strength.enrolled}</span>
              </div>
              <div className="p-2.5 rounded-control bg-surface-sunken border border-border">
                <span className="text-[10px] text-text-muted block">In-Room</span>
                <span className="text-sm font-semibold text-text tabular-nums">{strength.inRoom}</span>
              </div>
              <div className="p-2.5 rounded-control bg-surface-sunken border border-border">
                <span className="text-[10px] text-text-muted block">Room Capacity</span>
                <span className="text-sm font-semibold text-text tabular-nums">{strength.roomCapacity}</span>
              </div>
              <div className="p-2.5 rounded-control bg-surface-sunken border border-border">
                <span className="text-[10px] text-text-muted block">Online Attending</span>
                <span className="text-sm font-semibold text-text tabular-nums">{strength.online}</span>
              </div>
              <div className="p-2.5 rounded-control bg-surface-sunken border border-border">
                <span className="text-[10px] text-text-muted block">Online Seat Limit</span>
                <span className="text-sm font-semibold text-text tabular-nums">{strength.onlineSeatLimit}</span>
              </div>
              <div className="p-2.5 rounded-control bg-surface-sunken border border-border">
                <span className="text-[10px] text-text-muted block">Seats Left</span>
                <span className={`text-sm font-semibold tabular-nums ${seatsLeft === 0 ? 'text-danger' : 'text-success'}`}>{seatsLeft}</span>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Roster of Enrolled Students */}
      <div className="rounded-card border border-border bg-surface overflow-hidden">
        <div className="p-3 border-b border-border bg-surface-sunken/40 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text">
            Enrolled student roster ({enrolledStudents.length})
          </h3>
          <Button
            variant="secondary"
            size="xs"
            onClick={handleExportRoster}
            leftIcon={<Download className="w-3 h-3" />}
          >
            Export roster
          </Button>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-surface-sunken border-b border-border text-[11px] font-medium text-text-muted sticky top-0">
            <tr>
              <th className="py-2 px-3">Student</th>
              <th className="py-2 px-3 text-right">Attendance rate</th>
              <th className="py-2 px-3">Risk tier</th>
              <th className="py-2 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {enrolledStudents.map((st) => (
              <tr key={st.id} className="hover:bg-surface-sunken/40 h-10 transition-colors">
                <td className="px-3 font-medium text-text">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full border border-border bg-surface-sunken text-text font-medium text-[10px] flex items-center justify-center">
                      {st.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span>{st.name}</span>
                  </div>
                </td>
                <td className="px-3 text-right tabular-nums font-medium text-text">
                  <span className={st.attendanceRate < 60 ? 'text-danger' : 'text-text'}>
                    {st.attendanceRate}%
                  </span>
                </td>
                <td className="px-3">
                  {renderRiskGlyph(st.riskLevel)}
                </td>
                <td className="px-3 text-right">
                  <button
                    onClick={() => navigate(`/students/${st.id}`)}
                    className="text-accent hover:underline text-xs font-medium"
                  >
                    View profile
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Reassign Room Modal */}
      {showRoomModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowRoomModal(false)}
        >
          <div
            className="w-full max-w-md bg-surface border border-border rounded-dialog shadow-dialog p-5 text-text space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-sm font-semibold text-text">Reassign lecture room</h3>
                <p className="text-xs text-text-muted mt-0.5">
                  Batch: {batch.name} ({batch.enrolledCount} enrolled)
                </p>
              </div>
              <button
                onClick={() => setShowRoomModal(false)}
                className="text-text-muted hover:text-text p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <label className="block text-text-muted font-medium">Select target facility</label>
              <div className="space-y-2">
                {AVAILABLE_ROOMS.map((rm) => {
                  const hasCapacity = rm.capacity >= batch.enrolledCount
                  const isCurrent = rm.name === batch.room
                  const isSelected = rm.name === selectedRoom

                  return (
                    <div
                      key={rm.name}
                      onClick={() => setSelectedRoom(rm.name)}
                      className={`p-3 rounded-control border cursor-pointer flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'border-border-strong bg-surface-sunken'
                          : 'border-border bg-surface hover:bg-surface-sunken/40'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-text-muted" />
                        <div>
                          <div className="font-medium text-text">
                            {rm.name} {isCurrent && '(Current)'}
                          </div>
                          <div className="text-[11px] text-text-muted">
                            Capacity: {rm.capacity} seats
                          </div>
                        </div>
                      </div>

                      <div>
                        {hasCapacity ? (
                          <span className="text-[10px] text-success font-medium px-2 py-0.5 rounded bg-success/10 border border-success/20">
                            Fits {batch.enrolledCount}
                          </span>
                        ) : (
                          <span className="text-[10px] text-danger font-medium px-2 py-0.5 rounded bg-danger/10 border border-danger/20">
                            Too small ({rm.capacity})
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowRoomModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => handleReassignRoom()}
                >
                  Confirm reassignment
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
