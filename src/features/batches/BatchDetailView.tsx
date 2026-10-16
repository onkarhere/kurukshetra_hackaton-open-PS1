import React from 'react'
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
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { store } from '@/mocks/store'
import { useToast } from '@/context/ToastContext'

export const BatchDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { success } = useToast()

  const batch = store.batches.find((b) => b.id === id) || store.batches[0]
  const enrolledStudents = store.students.filter((s) => s.batchIds.includes(batch.id))

  const isOverCapacity = batch.enrolledCount > batch.capacity

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
              onClick={() => success('Room re-assignment staged')}
            >
              Move to Room 4
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

      {/* Roster of Enrolled Students */}
      <div className="rounded-card border border-border bg-surface overflow-hidden">
        <div className="p-3 border-b border-border bg-surface-sunken/40 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text">
            Enrolled student roster ({enrolledStudents.length})
          </h3>
          <Button
            variant="secondary"
            size="xs"
            onClick={() => success('Exporting batch roster...')}
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
    </div>
  )
}
