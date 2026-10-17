import React, { useState, useEffect } from 'react'
import {
  X,
  PencilLine,
  Calendar,
  Clock,
  User,
  BookOpen,
  DoorClosed,
  AlertTriangle,
  Sparkles,
  MapPin,
  Laptop,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { TimetableSession, Trainer, Batch, Branch } from '@/types'
import { ROOM_CAPACITIES, parseMinutes } from './scheduler'
import { cn } from '@/lib/utils'

interface ManualLectureModalProps {
  isOpen: boolean
  onClose: () => void
  initialSession?: TimetableSession | null
  initialDayOfWeek?: number
  initialStartTime?: string
  trainers: Trainer[]
  batches: Batch[]
  existingSessions: TimetableSession[]
  onSave: (session: TimetableSession, isEdit: boolean) => void
}

export const ManualLectureModal: React.FC<ManualLectureModalProps> = ({
  isOpen,
  onClose,
  initialSession,
  initialDayOfWeek = 1,
  initialStartTime = '10:00',
  trainers,
  batches,
  existingSessions,
  onSave,
}) => {
  const daysMap = [
    { dayOfWeek: 1, date: '2026-10-19', label: 'Mon 19 Oct' },
    { dayOfWeek: 2, date: '2026-10-20', label: 'Tue 20 Oct' },
    { dayOfWeek: 3, date: '2026-10-21', label: 'Wed 21 Oct' },
    { dayOfWeek: 4, date: '2026-10-22', label: 'Thu 22 Oct' },
    { dayOfWeek: 5, date: '2026-10-23', label: 'Fri 23 Oct' },
    { dayOfWeek: 6, date: '2026-10-24', label: 'Sat 24 Oct' },
    { dayOfWeek: 7, date: '2026-10-25', label: 'Sun 25 Oct' },
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
  ]

  const endTimeSlots = [
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
    '22:00',
  ]

  // Form states
  const [selectedBatchId, setSelectedBatchId] = useState<string>(
    initialSession?.batchId || batches[0]?.id || ''
  )
  const [customBatchName, setCustomBatchName] = useState<string>('')
  const [courseName, setCourseName] = useState<string>(
    initialSession?.courseName || batches[0]?.courseName || 'Java Full-Stack Developer'
  )
  const [trainerId, setTrainerId] = useState<string>(
    initialSession?.trainerId || trainers[0]?.id || ''
  )
  const [dayOfWeek, setDayOfWeek] = useState<number>(
    initialSession?.dayOfWeek || initialDayOfWeek || 1
  )
  const [startTime, setStartTime] = useState<string>(
    initialSession?.startTime || initialStartTime || '10:00'
  )
  const [endTime, setEndTime] = useState<string>(
    initialSession?.endTime || '12:00'
  )
  const [room, setRoom] = useState<string>(initialSession?.room || 'Room 1')
  const [branch, setBranch] = useState<Branch>(
    initialSession?.branch || 'Kothrud'
  )
  const [isOnline, setIsOnline] = useState<boolean>(
    initialSession?.isOnline || false
  )

  // Sync state when opening or when initialSession / initialDay / initialTime changes
  useEffect(() => {
    if (initialSession) {
      setSelectedBatchId(initialSession.batchId || '')
      setCustomBatchName(initialSession.batchName || '')
      setCourseName(initialSession.courseName || '')
      setTrainerId(initialSession.trainerId || trainers[0]?.id || '')
      setDayOfWeek(initialSession.dayOfWeek || 1)
      setStartTime(initialSession.startTime || '10:00')
      setEndTime(initialSession.endTime || '12:00')
      setRoom(initialSession.room || 'Room 1')
      setBranch(initialSession.branch || 'Kothrud')
      setIsOnline(Boolean(initialSession.isOnline))
    } else {
      const defaultBatch = batches[0]
      setSelectedBatchId(defaultBatch?.id || '')
      setCustomBatchName('')
      setCourseName(defaultBatch?.courseName || 'Java Full-Stack Developer')
      setTrainerId(defaultBatch?.trainerId || trainers[0]?.id || '')
      setDayOfWeek(initialDayOfWeek || 1)
      setStartTime(initialStartTime || '10:00')

      // Calculate default end time (+2 hours)
      const startMins = parseMinutes(initialStartTime || '10:00')
      const endMins = startMins + 120
      const endH = Math.floor(endMins / 60)
      const endM = endMins % 60
      const defaultEndTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
      setEndTime(defaultEndTime)

      setRoom(defaultBatch?.room || 'Room 1')
      setBranch(defaultBatch?.branch || 'Kothrud')
      setIsOnline(defaultBatch?.mode === 'online' || defaultBatch?.mode === 'hybrid')
    }
  }, [initialSession, initialDayOfWeek, initialStartTime, isOpen])

  // When selectedBatchId changes, auto-fill course & default room
  const handleBatchChange = (batchId: string) => {
    setSelectedBatchId(batchId)
    if (batchId === 'custom') {
      return
    }
    const b = batches.find((item) => item.id === batchId)
    if (b) {
      setCourseName(b.courseName)
      if (b.trainerId) setTrainerId(b.trainerId)
      if (b.room) setRoom(b.room)
      if (b.branch) setBranch(b.branch)
      setIsOnline(b.mode === 'online' || b.mode === 'hybrid')
    }
  }

  // When start time changes, automatically adjust end time to start + 2h if end <= start
  const handleStartTimeChange = (newStart: string) => {
    setStartTime(newStart)
    const startM = parseMinutes(newStart)
    const endM = parseMinutes(endTime)
    if (endM <= startM) {
      const nextEnd = startM + 120
      const nextH = Math.floor(nextEnd / 60)
      const nextM = nextEnd % 60
      setEndTime(`${String(nextH).padStart(2, '0')}:${String(nextM).padStart(2, '0')}`)
    }
  }

  if (!isOpen) return null

  // Target date resolution
  const dayInfo = daysMap.find((d) => d.dayOfWeek === dayOfWeek) || daysMap[0]
  const targetDate = dayInfo.date

  // Selected Trainer Info
  const selectedTrainer = trainers.find((t) => t.id === trainerId) || trainers[0]

  // Resolved Batch Name
  const matchedBatch = batches.find((b) => b.id === selectedBatchId)
  const batchName = selectedBatchId === 'custom' ? customBatchName || 'Custom Lecture' : (matchedBatch?.name || 'Class Cohort')

  // LIVE CLASH DETECTION:
  // Check if this manual lecture clashes with any existing session!
  const currentStartM = parseMinutes(startTime)
  const currentEndM = parseMinutes(endTime)

  const detectedClashes: { type: 'room' | 'trainer' | 'capacity'; message: string }[] = []

  existingSessions.forEach((sess) => {
    // Skip checking against itself when editing
    if (initialSession && sess.id === initialSession.id) return

    const sameDay = sess.date ? sess.date === targetDate : sess.dayOfWeek === dayOfWeek
    if (!sameDay) return

    const sessStartM = parseMinutes(sess.startTime)
    const sessEndM = parseMinutes(sess.endTime)
    const overlaps = currentStartM < sessEndM && currentEndM > sessStartM

    if (overlaps) {
      // Room clash
      if (sess.room === room && room !== 'Online Only' && !room.startsWith('Virtual')) {
        detectedClashes.push({
          type: 'room',
          message: `Room "${room}" is already double-booked by "${sess.batchName}" at ${sess.startTime}–${sess.endTime}.`,
        })
      }

      // Trainer clash
      if (sess.trainerId === trainerId) {
        detectedClashes.push({
          type: 'trainer',
          message: `Trainer ${selectedTrainer?.name} is already scheduled for "${sess.batchName}" at ${sess.startTime}–${sess.endTime}.`,
        })
      }
    }
  })

  // Room capacity check
  const inRoomStudents = matchedBatch?.enrolledCount
    ? isOnline
      ? 0
      : Math.max(1, matchedBatch.enrolledCount - (matchedBatch.onlineSeatLimit || 0))
    : 25
  const roomCap = ROOM_CAPACITIES[room] || 30
  if (inRoomStudents > roomCap && !isOnline) {
    detectedClashes.push({
      type: 'capacity',
      message: `Enrolled students (${inRoomStudents}) exceed room capacity (${roomCap} seats) for ${room}.`,
    })
  }

  const hasClashes = detectedClashes.length > 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const sessionId = initialSession?.id || `manual-sess-${Date.now()}`

    const newSession: TimetableSession = {
      id: sessionId,
      batchId: selectedBatchId === 'custom' ? `custom-${Date.now()}` : selectedBatchId,
      batchName,
      courseName,
      trainerId: selectedTrainer?.id || 'tr-arjun',
      trainerName: selectedTrainer?.name || 'Arjun Mehta',
      room,
      branch,
      date: targetDate,
      dayOfWeek,
      startTime,
      endTime,
      isOnline,
      isLocked: initialSession?.isLocked || false,
      hasConflict: hasClashes,
      conflictReason: hasClashes ? detectedClashes[0].message : undefined,
      status: 'scheduled',
    }

    onSave(newSession, Boolean(initialSession))
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-surface border border-border rounded-dialog shadow-dialog p-6 text-text my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
              <PencilLine className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-text">
                {initialSession ? 'Edit Lecture Manually' : 'Write Lecture Manually'}
              </h2>
              <p className="text-[11px] text-text-muted">
                Schedule lecture details directly. AI will automatically sort any clashes if needed.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text p-1 rounded-control"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {/* Batch & Course Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-text font-medium mb-1 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-accent" />
                Select Batch / Cohort
              </label>
              <select
                value={selectedBatchId}
                onChange={(e) => handleBatchChange(e.target.value)}
                className="w-full px-3 py-2 rounded-control bg-surface border border-border text-text focus:outline-none focus:border-accent"
              >
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.branch})
                  </option>
                ))}
                <option value="custom">+ Custom Batch / Special Lecture...</option>
              </select>
            </div>

            <div>
              <label className="block text-text font-medium mb-1">Course / Topic Name</label>
              {selectedBatchId === 'custom' ? (
                <div className="space-y-1.5">
                  <input
                    type="text"
                    placeholder="e.g. Masterclass: System Design"
                    value={customBatchName}
                    onChange={(e) => setCustomBatchName(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 rounded-control bg-surface border border-border text-text focus:outline-none focus:border-accent"
                  />
                  <input
                    type="text"
                    placeholder="Course name"
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 rounded-control bg-surface border border-border text-text focus:outline-none focus:border-accent text-[11px]"
                  />
                </div>
              ) : (
                <input
                  type="text"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-control bg-surface border border-border text-text focus:outline-none focus:border-accent"
                />
              )}
            </div>
          </div>

          {/* Trainer & Branch */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-text font-medium mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-accent" />
                Faculty / Trainer
              </label>
              <select
                value={trainerId}
                onChange={(e) => setTrainerId(e.target.value)}
                className="w-full px-3 py-2 rounded-control bg-surface border border-border text-text focus:outline-none focus:border-accent"
              >
                {trainers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.specialization?.[0] || 'Trainer'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-text font-medium mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-accent" />
                Campus Branch
              </label>
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value as Branch)}
                className="w-full px-3 py-2 rounded-control bg-surface border border-border text-text focus:outline-none focus:border-accent"
              >
                <option value="Kothrud">Kothrud Campus</option>
                <option value="Baner">Baner Campus</option>
              </select>
            </div>
          </div>

          {/* Day of Week & Date */}
          <div>
            <label className="block text-text font-medium mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-accent" />
              Day of Week & Date
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
              {daysMap.map((d) => (
                <button
                  key={d.dayOfWeek}
                  type="button"
                  onClick={() => setDayOfWeek(d.dayOfWeek)}
                  className={cn(
                    'py-2 px-1 text-center rounded-control border text-[11px] transition-all cursor-pointer',
                    dayOfWeek === d.dayOfWeek
                      ? 'bg-accent/20 border-accent font-semibold text-text shadow-2xs'
                      : 'bg-surface hover:bg-surface-sunken border-border text-text-muted hover:text-text'
                  )}
                >
                  <div className="font-medium">{d.label.slice(0, 3)}</div>
                  <div className="text-[10px] text-text-muted">{d.label.slice(4, 6)} Oct</div>
                </button>
              ))}
            </div>
          </div>

          {/* Time Slot (Start Time & End Time) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-text font-medium mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-accent" />
                Start Time (IST)
              </label>
              <select
                value={startTime}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                className="w-full px-3 py-2 rounded-control bg-surface border border-border text-text font-mono focus:outline-none focus:border-accent"
              >
                {timeSlots.map((t) => (
                  <option key={t} value={t}>
                    {t} IST
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-text font-medium mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-accent" />
                End Time (IST)
              </label>
              <select
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 rounded-control bg-surface border border-border text-text font-mono focus:outline-none focus:border-accent"
              >
                {endTimeSlots.map((t) => (
                  <option key={t} value={t}>
                    {t} IST
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Room & Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-text font-medium mb-1 flex items-center gap-1.5">
                <DoorClosed className="w-3.5 h-3.5 text-accent" />
                Classroom / Lab
              </label>
              <select
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="w-full px-3 py-2 rounded-control bg-surface border border-border text-text focus:outline-none focus:border-accent"
              >
                {Object.entries(ROOM_CAPACITIES).map(([rm, cap]) => (
                  <option key={rm} value={rm}>
                    {rm} ({cap} seats)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-text font-medium mb-1 flex items-center gap-1.5">
                <Laptop className="w-3.5 h-3.5 text-accent" />
                Delivery Mode
              </label>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsOnline(false)}
                  className={cn(
                    'flex-1 py-1.5 px-2 rounded-control border text-xs text-center transition-colors cursor-pointer',
                    !isOnline
                      ? 'bg-accent/20 border-accent text-text font-semibold'
                      : 'bg-surface border-border text-text-muted hover:text-text'
                  )}
                >
                  🏫 In-person
                </button>
                <button
                  type="button"
                  onClick={() => setIsOnline(true)}
                  className={cn(
                    'flex-1 py-1.5 px-2 rounded-control border text-xs text-center transition-colors cursor-pointer',
                    isOnline
                      ? 'bg-accent/20 border-accent text-text font-semibold'
                      : 'bg-surface border-border text-text-muted hover:text-text'
                  )}
                >
                  🌐 Hybrid / Zoom
                </button>
              </div>
            </div>
          </div>

          {/* LIVE CLASH WARNING (AI Heads-Up) */}
          {hasClashes && (
            <div className="p-3.5 rounded-card border border-amber-500/40 bg-amber-500/10 text-xs text-[#1E140E] space-y-2 animate-in fade-in">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-amber-900">
                    Scheduling Clash Detected ({detectedClashes.length})
                  </div>
                  <ul className="mt-1 space-y-1 text-amber-800 list-disc list-inside">
                    {detectedClashes.map((c, i) => (
                      <li key={i}>{c.message}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-2 border-t border-amber-500/20 text-[11px] text-amber-900 flex items-center gap-1.5 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span>
                  No problem! You can still write and save this slot. The AI Clash Assistant can sort and resolve it automatically whenever you want.
                </span>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <span className="text-[11px] text-text-muted">
              {targetDate} · {startTime}–{endTime} IST · {room}
            </span>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant={hasClashes ? 'secondary' : 'primary'}
                size="sm"
                className={hasClashes ? 'border-amber-500/40 text-amber-900 bg-amber-500/20' : ''}
              >
                {hasClashes
                  ? 'Save Lecture (AI Will Sort)'
                  : initialSession
                  ? 'Update Lecture'
                  : 'Save Lecture'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
