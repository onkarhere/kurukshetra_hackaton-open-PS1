import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ClipboardCheck,
  Calendar,
  Filter,
  Play,
  Download,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { StatusPill } from '@/components/ui/StatusPill'
import { useToast } from '@/context/ToastContext'
import { store } from '@/mocks/store'

export const AttendanceView: React.FC = () => {
  const navigate = useNavigate()
  const { success } = useToast()

  const [selectedBatch, setSelectedBatch] = useState('all')

  const dates = ['12 Oct', '13 Oct', '14 Oct', '15 Oct', '16 Oct', '17 Oct']

  const batchAttendance = [
    {
      batchId: 'batch-java-b3',
      batchName: 'Java Full-Stack B3 (Kothrud)',
      records: ['present', 'present', 'partial', 'absent', 'present', 'present'],
      rate: '82%',
    },
    {
      batchId: 'batch-java-b4',
      batchName: 'Java Full-Stack B4 (Baner)',
      records: ['present', 'present', 'online', 'present', 'present', 'present'],
      rate: '94%',
    },
    {
      batchId: 'batch-py-b1',
      batchName: 'Python Data B1 (Baner)',
      records: ['present', 'late', 'present', 'online', 'present', 'present'],
      rate: '89%',
    },
    {
      batchId: 'batch-dbi-b2',
      batchName: 'Data Analytics B2 (Kothrud)',
      records: ['present', 'present', 'present', 'present', 'present', 'present'],
      rate: '98%',
    },
    {
      batchId: 'batch-react-b1',
      batchName: 'React Next.js B1 (Online)',
      records: ['online', 'online', 'online', 'online', 'online', 'online'],
      rate: '91%',
    },
  ]

  return (
    <div className="space-y-4 animate-fade-in select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-fg">Attendance Ledger & Heatmap</h1>
          <p className="text-xs text-fg-muted mt-0.5">
            Cohort aggregate tracking · QR check-in records & automated absenteeism detection
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/sessions/sess-m2')}
            leftIcon={<Play className="w-3.5 h-3.5" />}
          >
            Launch Live QR Check-in
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => success('Exporting attendance report...')}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export
          </Button>
        </div>
      </div>

      {/* Legend Bar */}
      <div className="p-3 rounded-card border border-border bg-surface flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-[11px] font-mono uppercase text-fg-muted font-semibold">
            Status Legend:
          </span>
          <StatusPill status="present" size="sm" />
          <StatusPill status="partial" size="sm" />
          <StatusPill status="late" size="sm" />
          <StatusPill status="absent" size="sm" />
          <StatusPill status="online" size="sm" />
          <StatusPill status="excused" size="sm" />
        </div>

        <span className="text-[11px] font-mono text-fg-muted">
          Showing Oct 2026 Batch Ledger
        </span>
      </div>

      {/* Batch x Date Heatmap Table */}
      <div className="rounded-card border border-border bg-surface overflow-x-auto shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-surface-2 border-b border-border text-[11px] font-semibold text-fg-muted uppercase tracking-wider">
            <tr>
              <th className="py-2.5 px-3">Batch</th>
              {dates.map((d) => (
                <th key={d} className="py-2.5 px-3 text-center">
                  {d}
                </th>
              ))}
              <th className="py-2.5 px-3 text-center">7d Avg Turnout</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {batchAttendance.map((b) => (
              <tr key={b.batchId} className="hover:bg-surface-2/40 transition-colors">
                <td className="py-3 px-3 font-semibold text-fg">
                  <div className="truncate max-w-[220px]">{b.batchName}</div>
                </td>
                {b.records.map((st, sIdx) => (
                  <td key={sIdx} className="py-3 px-3 text-center">
                    <StatusPill status={st} size="sm" />
                  </td>
                ))}
                <td className="py-3 px-3 text-center font-mono font-bold text-fg">
                  {b.rate}
                </td>
                <td className="py-3 px-3 text-right">
                  <button
                    onClick={() => navigate(`/sessions/sess-m2`)}
                    className="text-xs text-primary font-medium hover:underline"
                  >
                    Drill into Session
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
