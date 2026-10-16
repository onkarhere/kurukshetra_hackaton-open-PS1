import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  Clock,
  Award,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ReasonChip } from '@/components/ui/ReasonChip'
import { store } from '@/mocks/store'
import { useApp } from '@/context/AppContext'
import { useToast } from '@/context/ToastContext'
import { formatINR } from '@/lib/utils'

export const TrainerProfileView: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { role } = useApp()
  const { success } = useToast()

  const trainer = store.trainers.find((t) => t.id === id) || store.trainers[0]

  // Availability matrix state (7 days x 14 hourly slots)
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const hours = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00', '21:00'
  ]

  const [availability, setAvailability] = useState<Record<string, boolean[]>>(() => {
    const init: Record<string, boolean[]> = {}
    days.forEach((d) => {
      init[d] = Array(hours.length).fill(d !== 'Sun')
    })
    return init
  })

  const [isMouseDown, setIsMouseDown] = useState(false)

  const toggleSlot = (day: string, hourIdx: number) => {
    setAvailability((prev) => {
      const copy = { ...prev }
      const daySlots = [...copy[day]]
      daySlots[hourIdx] = !daySlots[hourIdx]
      copy[day] = daySlots
      return copy
    })
  }

  const handleCellHover = (day: string, hourIdx: number) => {
    if (isMouseDown) {
      toggleSlot(day, hourIdx)
    }
  }

  return (
    <div className="space-y-5 animate-fade-in select-none">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate('/trainers')}
          className="text-xs text-fg-muted hover:text-fg inline-flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Trainers</span>
        </button>
      </div>

      {/* Header Card */}
      <div className="p-5 rounded-card border border-border bg-surface space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-base flex items-center justify-center">
              {trainer.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-fg">{trainer.name}</h1>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-surface-2 border border-border">
                  ★ {trainer.rating} rating
                </span>
              </div>
              <p className="text-xs text-fg-muted mt-0.5">
                {trainer.phone} · {trainer.email} · {trainer.branches.join(' & ')} Campus
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => success('Updated trainer availability matrix.')}
            >
              Save Availability
            </Button>
          </div>
        </div>

        {/* Qualifications & Specialization Chips */}
        <div className="pt-3 border-t border-border space-y-2 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-fg-muted font-medium text-[11px]">Credentials:</span>
            {trainer.qualifications.map((q, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded bg-surface-2 border border-border text-[11px] font-mono text-fg"
              >
                {q}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-fg-muted font-medium text-[11px]">Core Subjects:</span>
            {trainer.specialization.map((s, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-[11px] font-semibold text-primary"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Availability Grid Painter (Drag across 7-day x 30/60-min grid) */}
      <div className="p-5 rounded-card border border-border bg-surface space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider font-mono text-fg">
              Weekly Availability Grid Painter
            </h3>
            <p className="text-[11px] text-fg-muted">
              Click or drag across cells to mark available teaching hours
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-primary/20 border border-primary/40 inline-block" />
              <span className="text-fg-muted">Available</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-surface-2 border border-border inline-block" />
              <span className="text-fg-muted">Unavailable</span>
            </div>
          </div>
        </div>

        <div
          className="overflow-x-auto border border-border rounded-btn"
          onMouseDown={() => setIsMouseDown(true)}
          onMouseUp={() => setIsMouseDown(false)}
        >
          <table className="w-full text-center text-xs border-collapse">
            <thead className="bg-surface-2 border-b border-border text-[11px] font-mono text-fg-muted">
              <tr>
                <th className="p-2 border-r border-border w-16">Slot</th>
                {days.map((d) => (
                  <th key={d} className="p-2 border-r border-border last:border-r-0">
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {hours.map((h, hIdx) => (
                <tr key={h}>
                  <td className="p-1.5 border-r border-border bg-surface-2/40 font-mono text-[10px] text-fg-muted">
                    {h}
                  </td>
                  {days.map((d) => {
                    const isAvail = availability[d]?.[hIdx]
                    return (
                      <td
                        key={d}
                        onClick={() => toggleSlot(d, hIdx)}
                        onMouseEnter={() => handleCellHover(d, hIdx)}
                        className={`p-1.5 border-r border-border last:border-r-0 cursor-pointer transition-colors ${
                          isAvail
                            ? 'bg-primary/20 hover:bg-primary/30'
                            : 'bg-surface hover:bg-surface-2'
                        }`}
                      >
                        <div className="w-full h-4 rounded-xs" />
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Leave Requests */}
      <div className="p-4 rounded-card border border-border bg-surface space-y-3 shadow-sm">
        <h3 className="text-xs font-semibold uppercase tracking-wider font-mono text-fg">
          Leave Requests & Time Off
        </h3>
        {trainer.leaveRequests.length > 0 ? (
          <div className="space-y-2">
            {trainer.leaveRequests.map((l) => (
              <div
                key={l.id}
                className="p-3 rounded-btn bg-surface-2 border border-border text-xs flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-fg">Date: {l.date}</div>
                  <div className="text-[11px] text-fg-muted">{l.reason}</div>
                </div>
                <div className="flex items-center gap-2">
                  <ReasonChip reason="Medical / Urgent" variant="warning" />
                  <Button
                    variant="primary"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => success('Approved leave and scheduled re-plan diff')}
                  >
                    Approve Leave
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-fg-muted">No pending leave requests.</p>
        )}
      </div>
    </div>
  )
}
