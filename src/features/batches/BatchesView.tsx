import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Layers,
  Users,
  Calendar,
  AlertOctagon,
  Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { store, useStore } from '@/mocks/store'
import { NewBatchModal } from './NewBatchModal'

export const BatchesView: React.FC = () => {
  const navigate = useNavigate()
  const batches = useStore((s) => s.batches)
  const [isNewBatchOpen, setIsNewBatchOpen] = useState(false)

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <h1 className="text-xl font-semibold text-text">Batches</h1>
          <p className="text-xs text-text-muted mt-0.5">
            Cohort capacity tracking, trainer assignments, and schedule patterns
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsNewBatchOpen(true)}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          New batch
        </Button>
      </div>

      {/* Batches Table */}
      <div className="rounded-card border border-border bg-surface overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-surface-sunken border-b border-border text-[11px] font-medium text-text-muted sticky top-0">
            <tr>
              <th className="py-2.5 px-3">Batch name</th>
              <th className="py-2.5 px-3">Course</th>
              <th className="py-2.5 px-3">Trainer</th>
              <th className="py-2.5 px-3">Schedule pattern</th>
              <th className="py-2.5 px-3">Room & mode</th>
              <th className="py-2.5 px-3 text-right min-w-[170px]">Strength</th>
              <th className="py-2.5 px-3 text-right">Progress</th>
              <th className="py-2.5 px-3 text-right">Health</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {batches.map((b) => {
              const strength = store.getBatchStrength(b.id)
              const isOverCapacity =
                strength.enrolled > strength.capacity || strength.inRoom > strength.roomCapacity
              const pct = Math.min(100, Math.round((strength.enrolled / Math.max(1, strength.capacity)) * 100))

              return (
                <tr
                  key={b.id}
                  onClick={() => navigate(`/batches/${b.id}`)}
                  className="hover:bg-surface-sunken/40 cursor-pointer h-12 transition-colors"
                >
                  <td className="px-3 font-medium text-text">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate max-w-[200px]">{b.name}</span>
                      {isOverCapacity && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-danger font-medium shrink-0 bg-danger/10 px-1.5 py-0.5 rounded">
                          <AlertOctagon className="w-3 h-3" />
                          Over capacity
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 text-text-muted truncate max-w-[160px]">{b.courseName}</td>
                  <td className="px-3 text-text">{b.trainerName}</td>
                  <td className="px-3 text-text-muted text-[11px] tabular-nums">
                    {b.schedulePattern}
                  </td>
                  <td className="px-3 text-text-muted">
                    {b.room} · {b.mode}
                  </td>
                  {/* Strength Column with bar and breakdown */}
                  <td className="px-3 text-right tabular-nums">
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1.5 font-medium text-xs">
                        <span className={isOverCapacity ? 'text-danger font-semibold' : 'text-text'}>
                          {strength.enrolled} / {strength.capacity}
                        </span>
                        <div className="w-12 h-1.5 rounded-full bg-surface-sunken overflow-hidden border border-border">
                          <div
                            className={`h-full ${isOverCapacity ? 'bg-danger' : 'bg-accent'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-[10px] text-text-muted mt-0.5 font-mono">
                        {strength.inRoom} in room · {strength.online} online
                      </span>
                    </div>
                  </td>
                  <td className="px-3 text-right tabular-nums text-text-muted">
                    {b.progress}%
                  </td>
                  <td className="px-3 text-right tabular-nums font-medium text-text">
                    {b.healthScore}%
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <NewBatchModal
        isOpen={isNewBatchOpen}
        onClose={() => setIsNewBatchOpen(false)}
      />
    </div>
  )
}
