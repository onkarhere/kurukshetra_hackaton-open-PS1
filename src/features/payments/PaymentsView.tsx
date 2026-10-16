import React, { useState } from 'react'
import {
  Upload,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  FileSpreadsheet,
  ArrowRight,
  Sparkles,
  Download,
  Building2,
  Check,
} from 'lucide-react'
import { StatusPill } from '@/components/ui/StatusPill'
import { ReasonChip } from '@/components/ui/ReasonChip'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/context/ToastContext'
import { store } from '@/mocks/store'
import { formatINR } from '@/lib/utils'

export const PaymentsView: React.FC = () => {
  const { success } = useToast()
  const [activeTab, setActiveTab] = useState<'reconcile' | 'all'>('reconcile')
  const [bankFormat, setBankFormat] = useState('HDFC Bank NetBanking CSV')
  const [payments, setPayments] = useState([...store.payments])

  const handleConfirmMatch = (paymentId: string) => {
    store.reconcilePayment(paymentId)
    setPayments([...store.payments])
    success('Transaction matched & verified', 'Receipt generated and ledger updated.')
  }

  const needsReviewItems = payments.filter((p) => p.status === 'needs_review')
  const autoMatchedItems = payments.filter((p) => p.status === 'verified')
  const unmatchedItems = payments.filter((p) => p.status === 'unmatched')

  return (
    <div className="space-y-5 animate-fade-in select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-fg">Payments & Reconciliation</h1>
          <p className="text-xs text-fg-muted mt-0.5">
            Auto-match incoming bank statements, UPI collections & NEFT transfers with student EMIs
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => success('Exporting bank reconciliation report...')}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export Audit Sheet
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border text-xs font-medium">
        <button
          onClick={() => setActiveTab('reconcile')}
          className={`py-2 px-3 border-b-2 transition-colors ${
            activeTab === 'reconcile'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-fg-muted hover:text-fg'
          }`}
        >
          Reconciliation Board
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`py-2 px-3 border-b-2 transition-colors ${
            activeTab === 'all'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-fg-muted hover:text-fg'
          }`}
        >
          All Payments Table ({payments.length})
        </button>
      </div>

      {/* RECONCILE BOARD */}
      {activeTab === 'reconcile' && (
        <div className="space-y-5">
          {/* File Upload Dropzone */}
          <div className="p-4 rounded-card border-2 border-dashed border-border bg-surface-2/40 hover:bg-surface-2 transition-colors flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-fg">Upload Bank Statement or UPI Settlement</h3>
                <p className="text-[11px] text-fg-muted">
                  Drag and drop HDFC, ICICI, SBI or Razorpay CSV/XLSX
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={bankFormat}
                onChange={(e) => setBankFormat(e.target.value)}
                className="bg-surface border border-border text-fg rounded-btn px-2.5 py-1.5 text-xs outline-none focus:border-primary"
              >
                <option value="HDFC Bank NetBanking CSV">HDFC Bank NetBanking CSV</option>
                <option value="ICICI Corporate Export">ICICI Corporate Export</option>
                <option value="SBI Current Account Statement">SBI Current Account Statement</option>
                <option value="Razorpay Settlement CSV">Razorpay Settlement CSV</option>
              </select>

              <Button
                variant="primary"
                size="sm"
                onClick={() => success('Bank statement parsed: 4 records imported.')}
              >
                Upload File
              </Button>
            </div>
          </div>

          {/* Three-Column Board */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Column 1: Auto-Matched */}
            <div className="rounded-card border border-border bg-surface p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <h3 className="text-xs font-semibold text-fg flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  Auto-Matched ({autoMatchedItems.length})
                </h3>
                <span className="text-[10px] font-mono font-semibold text-success bg-success/10 px-1.5 py-0.5 rounded">
                  100% confidence
                </span>
              </div>

              <div className="space-y-2">
                {autoMatchedItems.map((p) => (
                  <div key={p.id} className="p-2.5 rounded-btn bg-surface-2 border border-border text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-fg">{p.studentName}</span>
                      <span className="font-mono font-bold text-fg">{formatINR(p.amount)}</span>
                    </div>
                    <div className="text-[11px] font-mono text-fg-muted">{p.utrNo}</div>
                    <div className="text-[10px] text-success font-semibold flex items-center gap-1 pt-0.5">
                      ✓ UTR verified against student registered phone
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 2: Needs Review */}
            <div className="rounded-card border border-warning/40 bg-surface p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <h3 className="text-xs font-semibold text-fg flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  Needs Review ({needsReviewItems.length})
                </h3>
                <span className="text-[10px] font-mono font-semibold text-warning bg-warning/10 px-1.5 py-0.5 rounded">
                  85% match
                </span>
              </div>

              <div className="space-y-3">
                {needsReviewItems.map((p) => (
                  <div key={p.id} className="p-3 rounded-btn bg-surface-2 border border-warning/30 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-fg">{p.studentName}</span>
                      <span className="font-mono font-bold text-fg">{formatINR(p.amount)}</span>
                    </div>

                    <div className="p-2 rounded bg-surface border border-border space-y-1">
                      <div className="text-[11px] font-mono text-fg-muted">Bank line: {p.utrNo}</div>
                      <div className="text-[11px] text-primary font-medium">
                        Suggested: Priya Nair (Instalment #3 of Java B3)
                      </div>
                    </div>

                    {/* Confidence Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-fg-muted">Match Confidence</span>
                        <span className="font-bold text-warning">{p.confidence}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-surface overflow-hidden border border-border">
                        <div className="h-full bg-warning" style={{ width: `${p.confidence}%` }} />
                      </div>
                    </div>

                    {/* Reasons list */}
                    {p.reconcileReasons && (
                      <div className="space-y-1">
                        {p.reconcileReasons.map((r, rIdx) => (
                          <div key={rIdx} className="text-[11px] text-fg-muted flex items-start gap-1">
                            <span className="text-warning">•</span>
                            <span>{r}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="pt-2 flex items-center justify-between gap-2 border-t border-border">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[11px] h-7 px-2"
                        onClick={() => success('Marked as non-fee deposit')}
                      >
                        Not a fee
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        className="text-[11px] h-7 px-3"
                        onClick={() => handleConfirmMatch(p.id)}
                        leftIcon={<Check className="w-3 h-3" />}
                      >
                        Confirm Match
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 3: Unmatched */}
            <div className="rounded-card border border-border bg-surface p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <h3 className="text-xs font-semibold text-fg flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-fg-muted" />
                  Unmatched ({unmatchedItems.length})
                </h3>
                <span className="text-[10px] font-mono text-fg-muted">No student match</span>
              </div>

              <div className="space-y-2">
                {unmatchedItems.map((p) => (
                  <div key={p.id} className="p-2.5 rounded-btn bg-surface-2 border border-border text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-fg">{p.studentName}</span>
                      <span className="font-mono font-bold text-fg">{formatINR(p.amount)}</span>
                    </div>
                    <div className="text-[11px] font-mono text-fg-muted">{p.utrNo}</div>
                    <p className="text-[11px] text-fg-muted">
                      No matching phone or roll number found in transaction remarks.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-[11px] h-7"
                      onClick={() => success('Lookup student directory drawer opened')}
                    >
                      Assign Manually
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ALL PAYMENTS TABLE */}
      {activeTab === 'all' && (
        <div className="rounded-card border border-border bg-surface overflow-x-auto shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-2 border-b border-border text-[11px] font-semibold text-fg-muted uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Receipt No</th>
                <th className="py-2.5 px-3">Student Name</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Amount</th>
                <th className="py-2.5 px-3">Payment Method</th>
                <th className="py-2.5 px-3">UTR Reference</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-surface-2/50 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-medium text-primary">{p.receiptNo}</td>
                  <td className="py-2.5 px-3 font-semibold text-fg">{p.studentName}</td>
                  <td className="py-2.5 px-3 font-mono text-fg-muted">{p.date}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-fg">{formatINR(p.amount)}</td>
                  <td className="py-2.5 px-3">{p.method}</td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-fg-muted">{p.utrNo}</td>
                  <td className="py-2.5 px-3">
                    <StatusPill status={p.status} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
