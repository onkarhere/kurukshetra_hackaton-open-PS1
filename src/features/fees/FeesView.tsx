import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IndianRupee,
  Clock,
  AlertTriangle,
  Sparkles,
  Download,
  Filter,
  CheckCircle2,
  Lock,
  ArrowRight,
} from 'lucide-react'
import { KpiCard } from '@/components/app/KpiCard'
import { StatusPill } from '@/components/ui/StatusPill'
import { ReasonChip } from '@/components/ui/ReasonChip'
import { Button } from '@/components/ui/Button'
import { ApprovalCard } from '@/components/app/ApprovalCard'
import { useApp } from '@/context/AppContext'
import { useToast } from '@/context/ToastContext'
import { store } from '@/mocks/store'
import { formatINR } from '@/lib/utils'

export const FeesView: React.FC = () => {
  const { role, setCopilotOpen } = useApp()
  const { success } = useToast()
  const navigate = useNavigate()

  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [showBulkApprovalModal, setShowBulkApprovalModal] = useState(false)

  // Trainer Role Access Boundary Guard
  if (role === 'trainer') {
    return (
      <div className="p-8 text-center max-w-md mx-auto space-y-4 animate-fade-in">
        <div className="w-12 h-12 rounded-full bg-surface-2 border border-border flex items-center justify-center mx-auto text-fg-muted">
          <Lock className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base font-bold text-fg">Permission Restricted</h2>
          <p className="text-xs text-fg-muted mt-1">
            Fee ledgers and financial transactions are restricted to Owner, Accounts, and Counselors.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => navigate('/')}>
          Return to Dashboard
        </Button>
      </div>
    )
  }

  const instalments = store.feeInstalments

  const filtered = instalments.filter((f) => {
    if (filterStatus === 'all') return true
    return f.status === filterStatus
  })

  const totalOverdue = instalments
    .filter((f) => f.status === 'overdue')
    .reduce((acc, curr) => acc + curr.amount, 0)

  const totalDueSoon = instalments
    .filter((f) => f.status === 'due_soon')
    .reduce((acc, curr) => acc + curr.amount, 0)

  return (
    <div className="space-y-5 animate-fade-in select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-fg">Fees & EMIs Ledger</h1>
          <p className="text-xs text-fg-muted mt-0.5">
            Real-time instalment tracking · Ageing breakdown & Automated WhatsApp reminders
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ai"
            size="sm"
            onClick={() => setShowBulkApprovalModal(true)}
            leftIcon={<Sparkles className="w-3.5 h-3.5" />}
          >
            Draft Reminders (5 overdue)
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => success('Exporting fee reconciliation sheet...')}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export
          </Button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="Due This Week"
          value={formatINR(totalDueSoon)}
          delta={{ value: '3 instalments', isNeutral: true }}
          sparklineData={[15000, 18000, 19500, 19500]}
          sparklineColor="var(--warning)"
        />
        <KpiCard
          label="Overdue EMIs"
          value={formatINR(totalOverdue)}
          delta={{ value: '2 students', isPositive: false }}
          sparklineData={[6500, 6500, 13000, 13000]}
          sparklineColor="var(--danger)"
        />
        <KpiCard
          label="Collected MTD"
          value={formatINR(462500)}
          delta={{ value: '+18% vs last month', isPositive: true }}
          sparklineData={[120000, 240000, 310000, 462500]}
          sparklineColor="var(--success)"
        />
        <KpiCard
          label="Collection Rate"
          value="94.2%"
          delta={{ value: 'Target: 95%', isPositive: true }}
          sparklineData={[89, 91, 92, 94.2]}
          sparklineColor="var(--primary)"
        />
      </div>

      {/* Ageing Stacked Bar */}
      <div className="p-4 rounded-card border border-border bg-surface space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-fg uppercase tracking-wider font-mono">
            Overdue Ageing Breakdown (₹45,500 total arrears)
          </h3>
          <span className="text-xs text-fg-muted font-mono">IST Snapshot</span>
        </div>

        <div className="w-full h-3 rounded-full bg-surface-2 overflow-hidden flex border border-border">
          <div className="bg-amber-400 h-full" style={{ width: '40%' }} title="0-7 Days: ₹19,500" />
          <div className="bg-amber-600 h-full" style={{ width: '35%' }} title="8-30 Days: ₹13,000" />
          <div className="bg-danger h-full" style={{ width: '15%' }} title="31-60 Days: ₹6,500" />
          <div className="bg-red-800 h-full" style={{ width: '10%' }} title="60+ Days: ₹6,500" />
        </div>

        <div className="grid grid-cols-4 gap-2 text-xs text-fg-muted pt-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
            <span>0–7 Days: <strong>₹19,500</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600 shrink-0" />
            <span>8–30 Days: <strong>₹13,000</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-danger shrink-0" />
            <span>31–60 Days: <strong>₹6,500</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-800 shrink-0" />
            <span>60+ Days: <strong>₹6,500</strong></span>
          </div>
        </div>
      </div>

      {/* Instalments Table */}
      <div className="rounded-card border border-border bg-surface overflow-x-auto shadow-sm">
        <div className="p-3 border-b border-border bg-surface-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-fg">Active Instalments</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-surface border border-border text-fg rounded-btn px-2 py-1 text-xs outline-none focus:border-primary"
            >
              <option value="all">All Statuses</option>
              <option value="overdue">Overdue</option>
              <option value="due_soon">Due Soon</option>
              <option value="paid">Paid</option>
              <option value="partially_paid">Partially Paid</option>
            </select>
          </div>
          <span className="text-xs font-mono text-fg-muted">
            Showing {filtered.length} entries
          </span>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-surface-2/60 border-b border-border text-[11px] font-semibold text-fg-muted uppercase tracking-wider">
            <tr>
              <th className="py-2.5 px-3">Student</th>
              <th className="py-2.5 px-3">Batch</th>
              <th className="py-2.5 px-3">Sequence</th>
              <th className="py-2.5 px-3">Due Date</th>
              <th className="py-2.5 px-3">Amount</th>
              <th className="py-2.5 px-3">Paid</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3">Overdue Days</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filtered.map((inst) => (
              <tr key={inst.id} className="hover:bg-surface-2/50 transition-colors">
                <td className="py-2.5 px-3 font-medium text-fg">
                  <div className="flex items-center gap-2">
                    <span>{inst.studentName}</span>
                    {inst.isSecondMissed && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-danger/15 text-danger font-mono font-bold">
                        2nd Missed
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-2.5 px-3 text-fg-muted">{inst.batchName}</td>
                <td className="py-2.5 px-3 font-mono text-[11px] text-fg-muted">{inst.sequence}</td>
                <td className="py-2.5 px-3 font-mono">{inst.dueDate}</td>
                <td className="py-2.5 px-3 font-mono font-bold text-fg">
                  {formatINR(inst.amount)}
                </td>
                <td className="py-2.5 px-3 font-mono text-fg-muted">
                  {formatINR(inst.paidAmount)}
                </td>
                <td className="py-2.5 px-3">
                  <StatusPill status={inst.status} size="sm" />
                </td>
                <td className="py-2.5 px-3 font-mono">
                  {inst.daysOverdue > 0 ? (
                    <span className="text-danger font-semibold">+{inst.daysOverdue} days</span>
                  ) : (
                    <span className="text-fg-muted">—</span>
                  )}
                </td>
                <td className="py-2.5 px-3 text-right">
                  <button
                    onClick={() => {
                      setShowBulkApprovalModal(true)
                    }}
                    className="text-xs text-ai font-semibold hover:underline"
                  >
                    Draft WhatsApp
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bulk Approval Modal */}
      {showBulkApprovalModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowBulkApprovalModal(false)}
        >
          <div
            className="w-full max-w-lg bg-surface border border-border rounded-modal shadow-modal p-6 text-fg relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-sm font-semibold">Staged AI Action</h3>
              <button
                onClick={() => setShowBulkApprovalModal(false)}
                className="text-fg-muted hover:text-fg p-1 rounded-btn"
              >
                ✕
              </button>
            </div>

            <div className="mt-4">
              <ApprovalCard
                approval={store.approvals[0]}
                onApproved={() => {
                  setShowBulkApprovalModal(false)
                  success('Reminders dispatched')
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
