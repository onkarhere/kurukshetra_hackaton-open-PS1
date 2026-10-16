import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  Clock,
  Star,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ReasonChip } from '@/components/ui/ReasonChip'
import { store } from '@/mocks/store'
import { useApp } from '@/context/AppContext'
import { useToast } from '@/context/ToastContext'
import { cn } from '@/lib/utils'

export const TrainerProfileView: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { role } = useApp()
  const { success } = useToast()

  const trainer = store.trainers.find((t) => t.id === id) || store.trainers[0]

  // Availability matrix state (7 days x 14 hourly slots)
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const hours = [
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
    <div className="space-y-4">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate('/trainers')}
          className="text-xs text-text-muted hover:text-text inline-flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to trainers</span>
        </button>
      </div>

      {/* Header Card */}
      <div className="p-4 rounded-card border border-border bg-surface space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-border bg-surface-sunken text-text font-medium text-sm flex items-center justify-center">
              {trainer.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold text-text">{trainer.name}</h1>
                <span className="text-xs text-text-muted flex items-center gap-1">
                  <Star className="w-3 h-3 text-warning fill-warning" />
                  {trainer.rating} rating
                </span>
              </div>
              <p className="text-xs text-text-muted mt-0.5">
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
              Save availability
            </Button>
          </div>
        </div>

        {/* Credentials and Subjects */}
        <div className="pt-3 border-t border-border space-y-1.5 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-text-muted text-[11px]">Credentials:</span>
            {trainer.qualifications.map((q, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded border border-border bg-surface-sunken text-[11px] text-text"
              >
                {q}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-text-muted text-[11px]">Core subjects:</span>
            {trainer.specialization.map((s, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded border border-border bg-surface text-[11px] text-text font-medium"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Availability Grid Painter */}
      <div className="p-4 rounded-card border border-border bg-surface space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text">
              Weekly availability matrix
            </h3>
            <p className="text-[11px] text-text-muted">
              Click or drag across slots to configure available teaching hours
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-accent/20 border border-accent/40 inline-block" />
              <span className="text-text-muted">Available</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-surface-sunken border border-border inline-block" />
              <span className="text-text-muted">Unavailable</span>
            </div>
          </div>
        </div>

        <div
          className="overflow-x-auto border border-border rounded-control"
          onMouseDown={() => setIsMouseDown(true)}
          onMouseUp={() => setIsMouseDown(false)}
        >
          <table className="w-full text-center text-xs border-collapse">
            <thead className="bg-surface-sunken border-b border-border text-[11px] font-mono text-text-muted">
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
                  <td className="p-1.5 border-r border-border bg-surface-sunken/40 font-mono text-[10px] text-text-muted">
                    {h}
                  </td>
                  {days.map((d) => {
                    const isAvail = availability[d]?.[hIdx]
                    return (
                      <td
                        key={d}
                        onClick={() => toggleSlot(d, hIdx)}
                        onMouseEnter={() => handleCellHover(d, hIdx)}
                        className={cn(
                          'p-1.5 border-r border-border last:border-r-0 cursor-pointer transition-colors',
                          isAvail
                            ? 'bg-accent/15 hover:bg-accent/25'
                            : 'bg-surface hover:bg-surface-sunken'
                        )}
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
      <div className="p-4 rounded-card border border-border bg-surface space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-text">
          Leave requests
        </h3>
        {trainer.leaveRequests.length > 0 ? (
          <div className="space-y-2">
            {trainer.leaveRequests.map((l) => (
              <div
                key={l.id}
                className="p-3 rounded-control bg-surface-sunken border border-border text-xs flex items-center justify-between"
              >
                <div>
                  <div className="font-medium text-text">Date: {l.date}</div>
                  <div className="text-[11px] text-text-muted">{l.reason}</div>
                </div>
                <div className="flex items-center gap-2">
                  <ReasonChip reason="Medical / Urgent" variant="warning" />
                  <Button
                    variant="secondary"
                    size="xs"
                    onClick={() => success('Approved leave and scheduled re-plan diff')}
                  >
                    Approve leave
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-text-muted">No pending leave requests.</p>
        )}
      </div>
    </div>
  )
}
