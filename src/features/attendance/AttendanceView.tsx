import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar,
  Play,
  Download,
  CheckCircle2,
  AlertOctagon,
  Clock,
  Video,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/context/ToastContext'
import { exportToCsv } from '@/lib/exportCsv'

export const AttendanceView: React.FC = () => {
  const navigate = useNavigate()
  const { success } = useToast()

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
      batchName: 'React Frontend B1 (Online)',
      records: ['online', 'online', 'online', 'online', 'online', 'online'],
      rate: '91%',
    },
  ]

  const renderStatusCell = (status: string) => {
    switch (status) {
      case 'present':
        return (
          <span className="inline-flex items-center gap-1 text-success text-xs">
            <CheckCircle2 className="w-3.5 h-3.5" /> Present
          </span>
        )
      case 'absent':
        return (
          <span className="inline-flex items-center gap-1 text-danger font-medium text-xs">
            <AlertOctagon className="w-3.5 h-3.5" /> Absent
          </span>
        )
      case 'late':
        return (
          <span className="inline-flex items-center gap-1 text-warning text-xs">
            <Clock className="w-3.5 h-3.5" /> Late
          </span>
        )
      case 'online':
        return (
          <span className="inline-flex items-center gap-1 text-accent text-xs">
            <Video className="w-3.5 h-3.5" /> Online
          </span>
        )
      case 'partial':
        return (
          <span className="inline-flex items-center gap-1 text-text-muted text-xs">
            <Clock className="w-3.5 h-3.5" /> Partial
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 text-text-muted text-xs">
            —
          </span>
        )
    }
  }

  const handleExport = () => {
    const exportRows = batchAttendance.map((b) => {
      const row: Record<string, string> = {
        Batch: b.batchName,
      }
      dates.forEach((d, i) => {
        row[d] = b.records[i] || '—'
      })
      row['7d Avg Turnout'] = b.rate
      return row
    })
    exportToCsv(exportRows, `attendance_ledger_${new Date().toISOString().slice(0, 10)}.csv`)
    success('Attendance ledger exported', 'CSV file downloaded successfully.')
  }

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <h1 className="text-xl font-semibold text-text">Sessions & attendance</h1>
          <p className="text-xs text-text-muted mt-0.5">
            Cohort aggregate tracking, QR check-in records, and daily turnout rates
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExport}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/sessions/sess-m2')}
            leftIcon={<Play className="w-3.5 h-3.5" />}
          >
            Launch live QR check-in
          </Button>
        </div>
      </div>

      {/* Legend as one line of text */}
      <div className="px-4 py-2.5 rounded-card border border-border bg-surface flex flex-wrap items-center justify-between gap-3 text-xs text-text-muted">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="font-medium text-text">Legend:</span>
          <span className="inline-flex items-center gap-1 text-success">
            <CheckCircle2 className="w-3.5 h-3.5" /> Present
          </span>
          <span className="inline-flex items-center gap-1 text-accent">
            <Video className="w-3.5 h-3.5" /> Online
          </span>
          <span className="inline-flex items-center gap-1 text-warning">
            <Clock className="w-3.5 h-3.5" /> Late
          </span>
          <span className="inline-flex items-center gap-1 text-danger">
            <AlertOctagon className="w-3.5 h-3.5" /> Absent
          </span>
        </div>

        <span className="text-[11px] text-text-muted">
          Showing Oct 2026 ledger · Click any batch row to inspect live check-in roster
        </span>
      </div>

      {/* Batch Attendance Ledger: Clickable rows, no drill column */}
      <div className="rounded-card border border-border bg-surface overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-surface-sunken border-b border-border text-[11px] font-medium text-text-muted sticky top-0">
            <tr>
              <th className="py-2 px-3">Batch</th>
              {dates.map((d) => (
                <th key={d} className="py-2 px-3 text-center font-medium">
                  {d}
                </th>
              ))}
              <th className="py-2 px-3 text-right font-medium">7d Avg Turnout</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {batchAttendance.map((b) => (
              <tr
                key={b.batchId}
                onClick={() => navigate('/sessions/sess-m2')}
                className="hover:bg-surface-sunken/40 cursor-pointer h-10 transition-colors"
              >
                <td className="px-3 font-medium text-text">
                  <div className="truncate max-w-[240px]">{b.batchName}</div>
                </td>
                {b.records.map((st, sIdx) => (
                  <td key={sIdx} className="px-3 text-center">
                    {renderStatusCell(st)}
                  </td>
                ))}
                <td className="px-3 text-right tabular-nums font-medium text-text">
                  {b.rate}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
