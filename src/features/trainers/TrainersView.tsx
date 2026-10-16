import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  UserCog,
  Star,
  Clock,
  Layers,
  Award,
  Calendar,
  Lock,
  Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ReasonChip } from '@/components/ui/ReasonChip'
import { store } from '@/mocks/store'
import { useApp } from '@/context/AppContext'
import { formatINR } from '@/lib/utils'

export const TrainersView: React.FC = () => {
  const navigate = useNavigate()
  const { role } = useApp()
  const trainers = store.trainers

  return (
    <div className="space-y-4 animate-fade-in select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-fg">Faculty & Trainers</h1>
          <p className="text-xs text-fg-muted mt-0.5">
            Workload balancing, availability matrices & subject specialization
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => navigate('/setup')}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          Add Trainer
        </Button>
      </div>

      {/* Trainers Table */}
      <div className="rounded-card border border-border bg-surface overflow-x-auto shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-surface-2 border-b border-border text-[11px] font-semibold text-fg-muted uppercase tracking-wider">
            <tr>
              <th className="py-2.5 px-3">Trainer Name</th>
              <th className="py-2.5 px-3">Specialization</th>
              <th className="py-2.5 px-3">Campus</th>
              <th className="py-2.5 px-3">Weekly Hours</th>
              <th className="py-2.5 px-3">Rating</th>
              <th className="py-2.5 px-3">Active Batches</th>
              {role === 'owner' && <th className="py-2.5 px-3">Pay Rate</th>}
              <th className="py-2.5 px-3">Pending Leaves</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {trainers.map((tr) => {
              const utilPct = Math.round((tr.weeklyHours / tr.maxWeeklyHours) * 100)
              const hasPendingLeave = tr.leaveRequests.some((l) => l.status === 'pending')

              return (
                <tr
                  key={tr.id}
                  onClick={() => navigate(`/trainers/${tr.id}`)}
                  className="hover:bg-surface-2/60 cursor-pointer transition-colors h-12"
                >
                  <td className="py-2.5 px-3 font-semibold text-fg">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-[10px] flex items-center justify-center">
                        {tr.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span>{tr.name}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex flex-wrap gap-1 max-w-[240px]">
                      {tr.specialization.slice(0, 2).map((s, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 rounded bg-surface-2 border border-border text-[10px] text-fg-muted"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-fg-muted">{tr.branches.join(', ')}</td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-surface-2 overflow-hidden border border-border">
                        <div
                          className={`h-full ${
                            utilPct >= 90
                              ? 'bg-danger'
                              : utilPct >= 75
                              ? 'bg-warning'
                              : 'bg-success'
                          }`}
                          style={{ width: `${utilPct}%` }}
                        />
                      </div>
                      <span className="font-mono text-fg font-medium">
                        {tr.weeklyHours}/{tr.maxWeeklyHours}h
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1 text-amber-500 font-mono font-bold">
                      <Star className="w-3 h-3 fill-amber-500" />
                      <span>{tr.rating}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-fg">{tr.activeBatches}</td>
                  {role === 'owner' && (
                    <td className="py-2.5 px-3 font-mono font-bold text-primary">
                      {formatINR(tr.payRate || 0)}/hr
                    </td>
                  )}
                  <td className="py-2.5 px-3">
                    {hasPendingLeave ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-warning/15 text-warning font-semibold">
                        Leave requested
                      </span>
                    ) : (
                      <span className="text-fg-muted text-[11px]">—</span>
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
