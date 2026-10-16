import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Star,
  Plus,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { store } from '@/mocks/store'
import { useApp } from '@/context/AppContext'
import { formatINR } from '@/lib/utils'

export const TrainersView: React.FC = () => {
  const navigate = useNavigate()
  const { role } = useApp()
  const trainers = store.trainers

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <h1 className="text-xl font-semibold text-text">Trainers</h1>
          <p className="text-xs text-text-muted mt-0.5">
            Faculty availability matrices, active cohorts, and workload balancing
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => navigate('/setup')}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          Add trainer
        </Button>
      </div>

      {/* Trainers Table */}
      <div className="rounded-card border border-border bg-surface overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-surface-sunken border-b border-border text-[11px] font-medium text-text-muted sticky top-0">
            <tr>
              <th className="py-2 px-3">Trainer name</th>
              <th className="py-2 px-3">Specialization</th>
              <th className="py-2 px-3">Campus</th>
              <th className="py-2 px-3 text-right">Weekly hours</th>
              <th className="py-2 px-3 text-center">Rating</th>
              <th className="py-2 px-3 text-right">Active batches</th>
              {role === 'owner' && <th className="py-2 px-3 text-right">Hourly rate</th>}
              <th className="py-2 px-3">Leave status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {trainers.map((tr) => {
              const utilPct = Math.round((tr.weeklyHours / tr.maxWeeklyHours) * 100)
              const hasPendingLeave = tr.leaveRequests.some((l) => l.status === 'pending')

              return (
                <tr
                  key={tr.id}
                  onClick={() => navigate(`/trainers/${tr.id}`)}
                  className="hover:bg-surface-sunken/40 cursor-pointer h-10 transition-colors"
                >
                  <td className="px-3 font-medium text-text">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full border border-border bg-surface-sunken text-text font-medium text-[10px] flex items-center justify-center">
                        {tr.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span>{tr.name}</span>
                    </div>
                  </td>
                  <td className="px-3">
                    <div className="flex flex-wrap gap-1 max-w-[220px]">
                      {tr.specialization.slice(0, 2).map((s, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 rounded border border-border bg-surface text-[10px] text-text-muted"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 text-text-muted">{tr.branches.join(', ')}</td>
                  <td className="px-3 text-right tabular-nums text-text">
                    {tr.weeklyHours} / {tr.maxWeeklyHours}h
                  </td>
                  <td className="px-3 text-center tabular-nums text-text">
                    <div className="inline-flex items-center gap-1 font-medium">
                      <Star className="w-3 h-3 text-warning fill-warning" />
                      <span>{tr.rating}</span>
                    </div>
                  </td>
                  <td className="px-3 text-right tabular-nums text-text">{tr.activeBatches}</td>
                  {role === 'owner' && (
                    <td className="px-3 text-right tabular-nums font-medium text-text">
                      {formatINR(tr.payRate || 0)}/hr
                    </td>
                  )}
                  <td className="px-3">
                    {hasPendingLeave ? (
                      <span className="inline-flex items-center gap-1 text-warning font-medium text-[11px]">
                        <AlertTriangle className="w-3 h-3" /> Leave requested
                      </span>
                    ) : (
                      <span className="text-text-muted text-[11px]">Available</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
