import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Layers,
  Users,
  Calendar,
  AlertOctagon,
  Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { store } from '@/mocks/store'

export const BatchesView: React.FC = () => {
  const navigate = useNavigate()
  const batches = store.batches

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
          onClick={() => navigate('/setup')}
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
              <th className="py-2 px-3">Batch name</th>
              <th className="py-2 px-3">Course</th>
              <th className="py-2 px-3">Trainer</th>
              <th className="py-2 px-3">Schedule pattern</th>
              <th className="py-2 px-3">Room & mode</th>
              <th className="py-2 px-3 text-right">Capacity</th>
              <th className="py-2 px-3 text-right">Progress</th>
              <th className="py-2 px-3 text-right">Health</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {batches.map((b) => {
              const isOverCapacity = b.enrolledCount > b.capacity
              return (
                <tr
                  key={b.id}
                  onClick={() => navigate(`/batches/${b.id}`)}
                  className="hover:bg-surface-sunken/40 cursor-pointer h-10 transition-colors"
                >
                  <td className="px-3 font-medium text-text">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate max-w-[200px]">{b.name}</span>
                      {isOverCapacity && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-danger font-medium shrink-0">
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
                  <td className="px-3 text-right tabular-nums font-medium text-text">
                    <span className={isOverCapacity ? 'text-danger' : 'text-text'}>
                      {b.enrolledCount} / {b.capacity}
                    </span>
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
    </div>
  )
}
