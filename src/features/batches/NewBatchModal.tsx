import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Calendar, Layers, Check, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { store } from '@/mocks/store'
import { useToast } from '@/context/ToastContext'
import { Batch, Branch } from '@/types'
import { ROOM_CAPACITIES, isTrainerQualified } from '@/features/timetable/scheduler'

interface NewBatchModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (batch: Batch) => void
}

export const NewBatchModal: React.FC<NewBatchModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const navigate = useNavigate()
  const { success, error } = useToast()

  const courses = store.courses
  const trainers = store.trainers

  const [courseId, setCourseId] = useState(courses[0]?.id || '')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [branch, setBranch] = useState<Branch>('Kothrud')
  const [mode, setMode] = useState<'offline' | 'online' | 'hybrid'>('hybrid')
  const [startDate, setStartDate] = useState('2026-10-26')
  const [endDate, setEndDate] = useState('2027-02-26')
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 3, 5]) // Mon, Wed, Fri
  const [startTime, setStartTime] = useState('19:00')
  const [endTime, setEndTime] = useState('21:00')
  const [preferredRoom, setPreferredRoom] = useState('Room 3')
  const [onlineSeatLimit, setOnlineSeatLimit] = useState(15)
  const [primaryTrainerId, setPrimaryTrainerId] = useState(trainers[0]?.id || '')
  const [maxStrength, setMaxStrength] = useState(30)
  const [formError, setFormError] = useState<string | null>(null)

  if (!isOpen) return null

  const selectedCourse = courses.find((c) => c.id === courseId) || courses[0]
  const qualifiedTrainers = trainers.filter((t) =>
    isTrainerQualified(t, selectedCourse?.title || '')
  )

  const roomCapacity = ROOM_CAPACITIES[preferredRoom] || 30
  const totalCapacityAllowed = roomCapacity + (mode === 'offline' ? 0 : onlineSeatLimit)

  const dayLabels = [
    { day: 1, label: 'Mon' },
    { day: 2, label: 'Tue' },
    { day: 3, label: 'Wed' },
    { day: 4, label: 'Thu' },
    { day: 5, label: 'Fri' },
    { day: 6, label: 'Sat' },
    { day: 0, label: 'Sun' },
  ]

  const toggleDay = (d: number) => {
    setSelectedDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    // Validation
    if (!name.trim()) {
      setFormError('Batch name is required.')
      return
    }
    if (!code.trim()) {
      setFormError('Batch code is required.')
      return
    }
    if (new Date(startDate) >= new Date(endDate)) {
      setFormError('Start date must be before end date.')
      return
    }
    if (selectedDays.length === 0) {
      setFormError('Please select at least one weekly meeting day.')
      return
    }
    const chosenTrainer = trainers.find((t) => t.id === primaryTrainerId)
    if (!chosenTrainer || !isTrainerQualified(chosenTrainer, selectedCourse.title)) {
      setFormError(`Primary trainer must be qualified for course "${selectedCourse.title}".`)
      return
    }
    if (maxStrength > totalCapacityAllowed) {
      setFormError(
        `Max strength (${maxStrength}) exceeds room capacity (${roomCapacity}) + online seats (${onlineSeatLimit}). Total allowed: ${totalCapacityAllowed}`
      )
      return
    }

    const dayNames = selectedDays
      .map((d) => dayLabels.find((l) => l.day === d)?.label)
      .join('/')
    const schedulePattern = `${dayNames} ${startTime}–${endTime}`

    const newBatch: Batch = {
      id: `batch-${code.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      courseId: selectedCourse.id,
      courseName: selectedCourse.title,
      trainerId: chosenTrainer.id,
      trainerName: chosenTrainer.name,
      branch,
      room: preferredRoom,
      roomCapacity,
      capacity: maxStrength,
      enrolledCount: 0,
      onlineSeatLimit: mode === 'offline' ? 0 : onlineSeatLimit,
      mode,
      startDate,
      endDate,
      schedulePattern,
      daysOfWeek: selectedDays,
      startTime,
      endTime,
      currentModule: selectedCourse.syllabus?.[0]?.module || 'Core Concepts',
      progress: 0,
      healthScore: 100,
    }

    const replanResult = store.addBatch(newBatch)
    success('Batch created', `${newBatch.name} added. Re-plan generated ${replanResult.diff.length} timetable slot(s).`)

    onClose()
    onSuccess?.(newBatch)
    navigate(`/timetable?batch=${newBatch.id}&replan=new_batch`)
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-surface border border-border rounded-dialog shadow-dialog overflow-hidden my-8 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface-sunken">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-accent" />
            <h2 className="text-sm font-semibold text-text">Create Academic Batch</h2>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text p-1 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1 text-xs text-text">
          {formError && (
            <div className="p-2.5 rounded-control bg-danger-subtle border border-danger/30 text-danger flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-text-muted mb-1">
                Course Track
              </label>
              <select
                value={courseId}
                onChange={(e) => {
                  setCourseId(e.target.value)
                  const c = courses.find((x) => x.id === e.target.value)
                  if (c) {
                    const qTrainers = trainers.filter((t) => isTrainerQualified(t, c.title))
                    if (qTrainers.length > 0) setPrimaryTrainerId(qTrainers[0].id)
                  }
                }}
                className="w-full bg-surface-sunken border border-border rounded-control px-2.5 py-1.5 text-xs text-text outline-none focus:border-accent"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-text-muted mb-1">
                Delivery Mode
              </label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as any)}
                className="w-full bg-surface-sunken border border-border rounded-control px-2.5 py-1.5 text-xs text-text outline-none focus:border-accent"
              >
                <option value="hybrid">Hybrid (Classroom + Virtual)</option>
                <option value="offline">Offline Only (Physical Classroom)</option>
                <option value="online">Online Only (Virtual Stream)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-text-muted mb-1">
                Batch Name
              </label>
              <input
                type="text"
                placeholder="e.g. Java Full-Stack B5 (Kothrud)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-surface-sunken border border-border rounded-control px-2.5 py-1.5 text-xs text-text outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-text-muted mb-1">
                Batch Code
              </label>
              <input
                type="text"
                placeholder="e.g. JFS-B5"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-surface-sunken border border-border rounded-control px-2.5 py-1.5 text-xs text-text outline-none focus:border-accent font-mono uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-text-muted mb-1">
                Campus Branch
              </label>
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value as Branch)}
                className="w-full bg-surface-sunken border border-border rounded-control px-2.5 py-1.5 text-xs text-text outline-none focus:border-accent"
              >
                <option value="Kothrud">Kothrud</option>
                <option value="Baner">Baner</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-text-muted mb-1">
                Preferred Room
              </label>
              <select
                value={preferredRoom}
                onChange={(e) => setPreferredRoom(e.target.value)}
                className="w-full bg-surface-sunken border border-border rounded-control px-2.5 py-1.5 text-xs text-text outline-none focus:border-accent"
              >
                {Object.entries(ROOM_CAPACITIES).map(([rm, cap]) => (
                  <option key={rm} value={rm}>
                    {rm} ({cap} seats)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-text-muted mb-1">
                Primary Qualified Trainer
              </label>
              <select
                value={primaryTrainerId}
                onChange={(e) => setPrimaryTrainerId(e.target.value)}
                className="w-full bg-surface-sunken border border-border rounded-control px-2.5 py-1.5 text-xs text-text outline-none focus:border-accent"
              >
                {qualifiedTrainers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Schedule Pattern */}
          <div className="p-3 rounded-control bg-surface-sunken border border-border space-y-2.5">
            <label className="block text-[11px] font-medium text-text-muted">
              Weekly Schedule Pattern
            </label>
            <div className="flex flex-wrap gap-1.5">
              {dayLabels.map(({ day, label }) => {
                const isSelected = selectedDays.includes(day)
                return (
                  <button
                    type="button"
                    key={day}
                    onClick={() => toggleDay(day)}
                    className={`px-3 py-1 rounded-control text-xs font-medium transition-colors border ${
                      isSelected
                        ? 'bg-accent text-accent-contrast border-accent'
                        : 'bg-surface text-text-muted border-border hover:text-text'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>

            <div className="flex items-center gap-3 pt-1">
              <div className="flex-1">
                <span className="block text-[10px] text-text-muted mb-0.5">Start Time</span>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-surface border border-border rounded-control px-2 py-1 text-xs text-text"
                />
              </div>
              <span className="text-text-muted mt-4">to</span>
              <div className="flex-1">
                <span className="block text-[10px] text-text-muted mb-0.5">End Time</span>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-surface border border-border rounded-control px-2 py-1 text-xs text-text"
                />
              </div>
            </div>
          </div>

          {/* Dates & Capacity Validation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-text-muted mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-surface-sunken border border-border rounded-control px-2.5 py-1.5 text-xs text-text outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-text-muted mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-surface-sunken border border-border rounded-control px-2.5 py-1.5 text-xs text-text outline-none focus:border-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-border">
            <div>
              <label className="block text-[11px] font-medium text-text-muted mb-1">
                Physical Room Limit
              </label>
              <input
                type="number"
                disabled
                value={roomCapacity}
                className="w-full bg-surface-sunken/60 border border-border rounded-control px-2.5 py-1.5 text-xs text-text-muted cursor-not-allowed font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-text-muted mb-1">
                Online Seat Limit
              </label>
              <input
                type="number"
                disabled={mode === 'offline'}
                min={0}
                max={200}
                value={mode === 'offline' ? 0 : onlineSeatLimit}
                onChange={(e) => setOnlineSeatLimit(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-surface-sunken border border-border rounded-control px-2.5 py-1.5 text-xs text-text outline-none focus:border-accent font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-text-muted mb-1">
                Total Max Strength
              </label>
              <input
                type="number"
                min={1}
                max={totalCapacityAllowed}
                value={maxStrength}
                onChange={(e) => setMaxStrength(parseInt(e.target.value, 10) || 1)}
                className="w-full bg-surface-sunken border border-border rounded-control px-2.5 py-1.5 text-xs text-text outline-none focus:border-accent font-mono font-medium"
              />
            </div>
          </div>
          <div className="text-[11px] text-text-muted">
            Constraint: Max strength ({maxStrength}) must not exceed physical room seats ({roomCapacity}) + online limit ({onlineSeatLimit}) = {totalCapacityAllowed}.
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" leftIcon={<Check className="w-3.5 h-3.5" />}>
              Save and Allocate Sessions
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
