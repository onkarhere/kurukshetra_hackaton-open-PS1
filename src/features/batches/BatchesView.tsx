import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Layers,
  Users,
  Calendar,
  Clock,
  Sparkles,
  Building2,
  AlertTriangle,
  Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ReasonChip } from '@/components/ui/ReasonChip'
import { store } from '@/mocks/store'
import { Batch } from '@/types'
import { cn } from '@/lib/utils'

export const BatchesView: React.FC = () => {
  const navigate = useNavigate()
  const batches = store.batches

  return (
    <div className="space-y-4 animate-fade-in select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-fg">Active Batches</h1>
          <p className="text-xs text-fg-muted mt-0.5">
            Capacity tracking, trainer assignment & weekly cohort schedule patterns
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => navigate('/setup')}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          New Batch
        </Button>
      </div>

      {/* Batches Table */}
      <div className="rounded-card border border-border bg-surface overflow-x-auto shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-surface-2 border-b border-border text-[11px] font-semibold text-fg-muted uppercase tracking-wider">
            <tr>
              <th className="py-2.5 px-3">Batch Name</th>
              <th className="py-2.5 px-3">Course</th>
              <th className="py-2.5 px-3">Faculty / Trainer</th>
              <th className="py-2.5 px-3">Schedule Pattern</th>
              <th className="py-2.5 px-3">Room / Mode</th>
              <th className="py-2.5 px-3">Capacity</th>
              <th className="py-2.5 px-3">Progress</th>
              <th className="py-2.5 px-3">Health</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {batches.map((b) => {
              const isOverCapacity = b.enrolledCount > b.capacity
              return (
                <tr
                  key={b.id}
                  onClick={() => navigate(`/batches/${b.id}`)}
                  className="hover:bg-surface-2/60 cursor-pointer transition-colors h-12"
                >
                  <td className="py-2.5 px-3 font-semibold text-fg">
                    <div className="flex items-center gap-1.5">
                      <span>{b.name}</span>
                      {isOverCapacity && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-danger/10 text-danger font-mono font-bold">
                          Over Capacity
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-fg-muted">{b.courseName}</td>
                  <td className="py-2.5 px-3 font-medium text-fg">{b.trainerName}</td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-fg-muted">
                    {b.schedulePattern}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-mono text-fg">{b.room}</span>
                    <span className="text-fg-muted text-[10px] ml-1">({b.mode})</span>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-surface-2 overflow-hidden border border-border">
                        <div
                          className={`h-full ${isOverCapacity ? 'bg-danger' : 'bg-primary'}`}
                          style={{ width: `${Math.min(100, (b.enrolledCount / b.capacity) * 100)}%` }}
                        />
                      </div>
                      <span className="font-mono font-bold text-fg">
                        {b.enrolledCount}/{b.capacity}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-12 h-1.5 rounded-full bg-surface-2 overflow-hidden border border-border">
                        <div className="h-full bg-success" style={{ width: `${b.progress}%` }} />
                      </div>
                      <span className="font-mono text-[11px] text-fg-muted">{b.progress}%</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`font-mono font-bold text-xs ${
                        b.healthScore >= 90
                          ? 'text-success'
                          : b.healthScore >= 80
                          ? 'text-primary'
                          : 'text-warning'
                      }`}
                    >
                      {b.healthScore}%
                    </span>
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
