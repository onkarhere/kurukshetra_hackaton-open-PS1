import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Clock,
  Download,
  Lock,
  CheckCircle2,
  AlertOctagon,
  AlertTriangle,
  MessageSquare,
  X,
} from 'lucide-react'
import { KpiCard } from '@/components/app/KpiCard'
import { Button } from '@/components/ui/Button'
import { ApprovalCard } from '@/components/app/ApprovalCard'
import { useApp } from '@/context/AppContext'
import { useToast } from '@/context/ToastContext'
import { store, useStore } from '@/mocks/store'
import { formatINR } from '@/lib/utils'
import { canSeeFeeAmounts } from '@/lib/permissions'
import { exportToCsv } from '@/lib/exportCsv'
import { ApprovalAction } from '@/types'

export const FeesView: React.FC = () => {
  const { role } = useApp()
  const { success } = useToast()
  const navigate = useNavigate()

  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [showBulkApprovalModal, setShowBulkApprovalModal] = useState(false)
  const [currentApproval, setCurrentApproval] = useState<ApprovalAction | null>(null)

  const showAmounts = canSeeFeeAmounts(role)
  const instalments = useStore((s) => s.feeInstalments)

  // Trainer Role Access Boundary Guard: locked panel with no financial data
  if (role === 'trainer') {
    return (
      <div className="p-8 text-center max-w-md mx-auto space-y-4">
        <div className="w-12 h-12 rounded-full bg-surface-sunken border border-border flex items-center justify-center mx-auto text-text-muted">
          <Lock className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-text">Permission restricted</h2>
          <p className="text-xs text-text-muted mt-1 leading-relaxed">
            Financial ledgers and fee instalments are restricted to Owner, Accounts, and Counselor roles.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => navigate('/')}>
          Return to dashboard
        </Button>
      </div>
    )
  }

  const filtered = instalments.filter((f) => {
    if (filterStatus === 'all') return true
    return f.status === filterStatus
  })

  const totalOverdue = instalments
    .filter((f) => f.status === 'overdue')
    .reduce((acc, curr) => acc + (curr.amount - curr.paidAmount), 0)

  const totalDueSoon = instalments
    .filter((f) => f.status === 'due_soon')
    .reduce((acc, curr) => acc + curr.amount, 0)

  const renderStatusGlyph = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 text-success text-xs">
            <CheckCircle2 className="w-3.5 h-3.5" /> Paid
          </span>
        )
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1 text-danger font-medium text-xs">
            <AlertOctagon className="w-3.5 h-3.5" /> Overdue
          </span>
        )
      case 'due_soon':
        return (
          <span className="inline-flex items-center gap-1 text-warning text-xs font-medium">
            <Clock className="w-3.5 h-3.5" /> Due soon
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 text-text-muted text-xs">
            <Clock className="w-3.5 h-3.5" /> Pending
          </span>
        )
    }
  }

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <h1 className="text-xl font-semibold text-text">Fees & EMIs</h1>
          <p className="text-xs text-text-muted mt-0.5">
            Instalment ledger, dues ageing breakdown, and staged payment reminders
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              const approval = store.createDraftRemindersApproval()
              setCurrentApproval(approval)
              setShowBulkApprovalModal(true)
            }}
            leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
          >
            Draft reminders ({instalments.filter((i) => i.status === 'overdue').length} overdue)
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              const cols = showAmounts
                ? [
                    { key: 'studentName', label: 'Student' },
                    { key: 'batchName', label: 'Batch' },
                    { key: 'sequence', label: 'Instalment' },
                    { key: 'dueDate', label: 'Due Date' },
                    { key: 'amount', label: 'Amount' },
                    { key: 'paidAmount', label: 'Paid Amount' },
                    { key: 'status', label: 'Status' },
                    { key: 'daysOverdue', label: 'Days Overdue' },
                  ]
                : [
                    { key: 'studentName', label: 'Student' },
                    { key: 'batchName', label: 'Batch' },
                    { key: 'sequence', label: 'Instalment' },
                    { key: 'dueDate', label: 'Due Date' },
                    { key: 'status', label: 'Status' },
                    { key: 'daysOverdue', label: 'Days Overdue' },
                  ]
              exportToCsv(`fee_instalments_${Date.now()}.csv`, cols, filtered)
              success('Exported fee instalments to CSV')
            }}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export
          </Button>
        </div>
      </div>

      {/* KPI Strip: Sans tabular figures, text trends */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="Due this week"
          value={showAmounts ? formatINR(totalDueSoon) : '3 instalments'}
          delta={{ value: '3 instalments pending', isNeutral: true }}
        />
        <KpiCard
          label="Overdue EMIs"
          value={
            showAmounts
              ? formatINR(totalOverdue)
              : `${instalments.filter((i) => i.status === 'overdue').length} accounts`
          }
          delta={{
            value: `${instalments.filter((i) => i.status === 'overdue').length} students overdue`,
            isPositive: false,
          }}
        />
        <KpiCard
          label="Collected this month"
          value={showAmounts ? formatINR(462500) : '48 payments'}
          delta={{
            value: showAmounts ? 'Target: ₹5,00,000 (92.5%)' : '92.5% of target',
            isPositive: true,
          }}
        />
        <KpiCard
          label="Collection rate"
          value="94.2%"
          delta={{ value: '+1.4% vs last month', isPositive: true }}
        />
      </div>

      {/* Flat Ageing Bar */}
      <div className="p-4 rounded-card border border-border bg-surface space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text">
            Overdue dues ageing ({showAmounts ? '₹45,500 total arrears' : '7 overdue accounts'})
          </h3>
          <span className="text-[11px] text-text-muted">Updated today</span>
        </div>

        {/* Flat neutral/accent segments */}
        <div className="w-full h-2.5 rounded bg-surface-sunken overflow-hidden flex border border-border">
          <div className="bg-warning h-full" style={{ width: '42%' }} title="1–7 days: ₹19,500" />
          <div className="bg-amber-600 h-full" style={{ width: '29%' }} title="8–15 days: ₹13,000" />
          <div className="bg-danger h-full" style={{ width: '29%' }} title="16–30 days: ₹13,000" />
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs pt-1">
          <div className="flex items-center gap-1.5 text-text-muted">
            <span className="w-2 h-2 rounded bg-warning shrink-0" />
            <span>
              1–7 days:{' '}
              <strong className="text-text tabular-nums">
                {showAmounts ? '₹19,500' : '3 accounts'}
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-text-muted">
            <span className="w-2 h-2 rounded bg-amber-600 shrink-0" />
            <span>
              8–15 days:{' '}
              <strong className="text-text tabular-nums">
                {showAmounts ? '₹13,000' : '2 accounts'}
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-text-muted">
            <span className="w-2 h-2 rounded bg-danger shrink-0" />
            <span>
              16–30 days:{' '}
              <strong className="text-text tabular-nums">
                {showAmounts ? '₹13,000' : '2 accounts'}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Instalments Table */}
      <div className="rounded-card border border-border bg-surface overflow-x-auto">
        <div className="p-3 border-b border-border bg-surface-sunken/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-text">Instalments</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-surface border border-border text-text rounded-control px-2 py-1 text-xs outline-none focus:border-accent"
            >
              <option value="all">All statuses</option>
              <option value="overdue">Overdue</option>
              <option value="due_soon">Due soon</option>
              <option value="paid">Paid</option>
              <option value="partially_paid">Partially paid</option>
            </select>
          </div>
          <span className="text-xs text-text-muted tabular-nums">
            {filtered.length} instalments
          </span>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-surface-sunken border-b border-border text-[11px] font-medium text-text-muted sticky top-0">
            <tr>
              <th className="py-2 px-3">Student</th>
              <th className="py-2 px-3">Batch</th>
              <th className="py-2 px-3">Instalment</th>
              <th className="py-2 px-3">Due date</th>
              {showAmounts && (
                <>
                  <th className="py-2 px-3 text-right">Amount</th>
                  <th className="py-2 px-3 text-right">Paid</th>
                </>
              )}
              <th className="py-2 px-3">Status</th>
              <th className="py-2 px-3 text-right">Overdue</th>
              <th className="py-2 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((inst) => (
              <tr key={inst.id} className="hover:bg-surface-sunken/40 h-10 transition-colors">
                <td className="px-3 font-medium text-text">
                  <div className="flex items-center gap-2">
                    <span>{inst.studentName}</span>
                    {inst.isSecondMissed && (
                      <span className="text-[10px] text-danger font-medium">
                        (2nd missed)
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-3 text-text-muted truncate max-w-[180px]">
                  {inst.batchName}
                </td>
                <td className="px-3 text-text-muted">{inst.sequence}</td>
                <td className="px-3 text-text-muted tabular-nums">{inst.dueDate}</td>
                {showAmounts && (
                  <>
                    <td className="px-3 text-right tabular-nums font-medium text-text">
                      {formatINR(inst.amount)}
                    </td>
                    <td className="px-3 text-right tabular-nums text-text-muted">
                      {formatINR(inst.paidAmount)}
                    </td>
                  </>
                )}
                <td className="px-3">
                  {renderStatusGlyph(inst.status)}
                </td>
                <td className="px-3 text-right tabular-nums">
                  {inst.daysOverdue > 0 ? (
                    <span className="text-danger font-medium">+{inst.daysOverdue}d</span>
                  ) : (
                    <span className="text-text-muted">—</span>
                  )}
                </td>
                <td className="px-3 text-right">
                  <button
                    onClick={() => {
                      const approval = store.createDraftRemindersApproval()
                      setCurrentApproval(approval)
                      setShowBulkApprovalModal(true)
                    }}
                    className="text-xs text-accent hover:underline font-medium"
                  >
                    Draft reminder
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
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowBulkApprovalModal(false)}
        >
          <div
            className="w-full max-w-lg bg-surface border border-border rounded-dialog shadow-dialog p-6 text-text relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-sm font-semibold text-text">Staged reminder approval</h3>
              <button
                onClick={() => setShowBulkApprovalModal(false)}
                className="text-text-muted hover:text-text p-1 rounded-control"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4">
              <ApprovalCard
                approval={currentApproval || store.approvals[0]}
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
