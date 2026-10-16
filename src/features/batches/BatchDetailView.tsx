import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  Building2,
  Sparkles,
  AlertTriangle,
  Play,
  FileSpreadsheet,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ReasonChip } from '@/components/ui/ReasonChip'
import { StatusPill } from '@/components/ui/StatusPill'
import { store } from '@/mocks/store'
import { useToast } from '@/context/ToastContext'

export const BatchDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { success } = useToast()

  const batch = store.batches.find((b) => b.id === id) || store.batches[0]
  const enrolledStudents = store.students.filter((s) => s.batchIds.includes(batch.id))

  const isOverCapacity = batch.enrolledCount > batch.capacity

  return (
    <div className="space-y-5 animate-fade-in select-none">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate('/batches')}
          className="text-xs text-fg-muted hover:text-fg inline-flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Batches</span>
        </button>
      </div>

      {/* Header Card */}
      <div className="p-5 rounded-card border border-border bg-surface space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                {batch.code}
              </span>
              <h1 className="text-xl font-bold text-fg">{batch.name}</h1>
            </div>
            <p className="text-xs text-fg-muted mt-0.5">
              Course: {batch.courseName} · Branch: {batch.branch}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/sessions/sess-m2')}
              leftIcon={<Play className="w-3.5 h-3.5" />}
            >
              Start Session (QR)
            </Button>
          </div>
        </div>

        {/* Capacity Warning Banner */}
        {isOverCapacity && (
          <div className="p-3 rounded-btn border border-danger/40 bg-danger/10 text-xs text-danger flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                <strong>Over Capacity Alert:</strong> {batch.enrolledCount} students assigned to{' '}
                {batch.room} (Maximum seating limit: {batch.capacity}).
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-6 text-[11px] border-danger/30 text-danger hover:bg-danger/20"
              onClick={() => success('Opened room re-assignment modal')}
            >
              Move to Room 4
            </Button>
          </div>
        )}

        {/* Weekly Pattern Visual & KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-border text-xs">
          <div className="space-y-1">
            <div className="text-fg-muted text-[11px]">Schedule Pattern</div>
            <div className="font-semibold text-fg font-mono">{batch.schedulePattern}</div>
          </div>
          <div className="space-y-1">
            <div className="text-fg-muted text-[11px]">Assigned Faculty</div>
            <div className="font-semibold text-fg">{batch.trainerName}</div>
          </div>
          <div className="space-y-1">
            <div className="text-fg-muted text-[11px]">Room & Seat Limit</div>
            <div className="font-semibold text-fg">
              {batch.room} ({batch.onlineSeatLimit} online seats)
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-fg-muted text-[11px]">Current Module</div>
            <div className="font-semibold text-primary">{batch.currentModule}</div>
          </div>
        </div>
      </div>

      {/* Roster of Enrolled Students */}
      <div className="rounded-card border border-border bg-surface overflow-hidden shadow-sm">
        <div className="p-3.5 border-b border-border bg-surface-2/60 flex items-center justify-between">
          <h3 className="text-xs font-semibold text-fg uppercase tracking-wider font-mono">
            Enrolled Student Roster ({enrolledStudents.length})
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => success('Exporting batch roster...')}
          >
            Export Attendance Sheet
          </Button>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-surface-2 border-b border-border text-[11px] font-semibold text-fg-muted uppercase tracking-wider">
            <tr>
              <th className="py-2.5 px-3">Student</th>
              <th className="py-2.5 px-3">Attendance Rate</th>
              <th className="py-2.5 px-3">Risk Tier</th>
              <th className="py-2.5 px-3 text-right">Profile</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {enrolledStudents.map((st) => (
              <tr key={st.id} className="hover:bg-surface-2/50 transition-colors">
                <td className="py-2.5 px-3 font-medium text-fg">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-[10px] flex items-center justify-center">
                      {st.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span>{st.name}</span>
                  </div>
                </td>
                <td className="py-2.5 px-3">
                  <span
                    className={`font-mono font-bold ${
                      st.attendanceRate < 60 ? 'text-danger' : 'text-fg'
                    }`}
                  >
                    {st.attendanceRate}%
                  </span>
                </td>
                <td className="py-2.5 px-3">
                  <StatusPill status={st.riskLevel} size="sm" />
                </td>
                <td className="py-2.5 px-3 text-right">
                  <button
                    onClick={() => navigate(`/students/${st.id}`)}
                    className="text-primary hover:underline text-xs font-medium"
                  >
                    View Details
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
