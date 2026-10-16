import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Upload,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Download,
  Check,
  Lock,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useApp } from '@/context/AppContext'
import { useToast } from '@/context/ToastContext'
import { store } from '@/mocks/store'
import { formatINR, cn } from '@/lib/utils'

export const PaymentsView: React.FC = () => {
  const { role } = useApp()
  const { success } = useToast()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<'reconcile' | 'all'>('reconcile')
  const [bankFormat, setBankFormat] = useState('HDFC Bank NetBanking CSV')
  const [payments, setPayments] = useState([...store.payments])

  // Trainer access lockdown
  if (role === 'trainer') {
    return (
      <div className="p-8 text-center max-w-md mx-auto space-y-4">
        <div className="w-12 h-12 rounded-full bg-surface-sunken border border-border flex items-center justify-center mx-auto text-text-muted">
          <Lock className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-text">Permission restricted</h2>
          <p className="text-xs text-text-muted mt-1 leading-relaxed">
            Payment transactions and bank reconciliation records are restricted to Owner and Accounts roles.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => navigate('/')}>
          Return to dashboard
        </Button>
      </div>
    )
  }

  const handleConfirmMatch = (paymentId: string) => {
    store.reconcilePayment(paymentId)
    setPayments([...store.payments])
    success('Transaction matched & verified', 'Receipt generated and ledger updated.')
  }

  const needsReviewItems = payments.filter((p) => p.status === 'needs_review')
  const autoMatchedItems = payments.filter((p) => p.status === 'verified')
  const unmatchedItems = payments.filter((p) => p.status === 'unmatched')

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <h1 className="text-xl font-semibold text-text">Payments & reconciliation</h1>
          <p className="text-xs text-text-muted mt-0.5">
            Auto-match incoming bank statements, UPI collections, and NEFT transfers with student EMIs
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => success('Exporting bank reconciliation audit sheet...')}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export audit sheet
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border text-xs font-medium">
        <button
          onClick={() => setActiveTab('reconcile')}
          className={cn(
            'py-2 px-3 border-b-2 transition-colors',
            activeTab === 'reconcile'
              ? 'border-accent text-text font-semibold'
              : 'border-transparent text-text-muted hover:text-text'
          )}
        >
          Reconciliation board (3 columns)
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={cn(
            'py-2 px-3 border-b-2 transition-colors',
            activeTab === 'all'
              ? 'border-accent text-text font-semibold'
              : 'border-transparent text-text-muted hover:text-text'
          )}
        >
          All payments ({payments.length})
        </button>
      </div>

      {/* RECONCILE BOARD */}
      {activeTab === 'reconcile' && (
        <div className="space-y-4">
          {/* File Upload Dropzone */}
          <div className="p-3.5 rounded-card border border-border bg-surface-sunken/40 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded border border-border bg-surface flex items-center justify-center text-text-muted shrink-0">
                <Upload className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-text">Import bank statement</h3>
                <p className="text-[11px] text-text-muted">
                  Drag and drop HDFC, ICICI, SBI or Razorpay CSV settlement file
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={bankFormat}
                onChange={(e) => setBankFormat(e.target.value)}
                className="bg-surface border border-border text-text rounded-control px-2.5 py-1.5 text-xs outline-none focus:border-accent"
              >
                <option value="HDFC Bank NetBanking CSV">HDFC Bank NetBanking CSV</option>
                <option value="ICICI Corporate Export">ICICI Corporate Export</option>
                <option value="SBI Current Account Statement">SBI Current Account Statement</option>
                <option value="Razorpay Settlement CSV">Razorpay Settlement CSV</option>
              </select>

              <Button
                variant="primary"
                size="xs"
                onClick={() => success('Bank statement parsed: 4 records imported.')}
              >
                Upload file
              </Button>
            </div>
          </div>

          {/* Three-Column Board */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Column 1: Auto-Matched */}
            <div className="rounded-card border border-border bg-surface p-3.5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <h3 className="text-xs font-semibold text-text flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                  Auto-matched ({autoMatchedItems.length})
                </h3>
                <span className="text-[11px] font-mono text-text-muted">
                  100% confidence
                </span>
              </div>

              <div className="space-y-2">
                {autoMatchedItems.map((p) => (
                  <div
                    key={p.id}
                    className="p-2.5 rounded-control bg-surface-sunken border border-border text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-text">{p.studentName}</span>
                      <span className="tabular-nums font-medium text-text">
                        {formatINR(p.amount)}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-text-muted">{p.utrNo}</div>
                    <div className="text-[10px] text-success font-medium flex items-center gap-1 pt-0.5">
                      ✓ UTR verified against student registered phone
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 2: Needs Review */}
            <div className="rounded-card border border-border bg-surface p-3.5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <h3 className="text-xs font-semibold text-text flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                  Needs review ({needsReviewItems.length})
                </h3>
                <span className="text-[11px] font-mono text-text-muted">
                  85% match
                </span>
              </div>

              <div className="space-y-3">
                {needsReviewItems.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-control bg-surface-sunken border border-border text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-text">{p.studentName}</span>
                      <span className="tabular-nums font-medium text-text">
                        {formatINR(p.amount)}
                      </span>
                    </div>

                    <div className="p-2 rounded bg-surface border border-border space-y-1">
                      <div className="text-[11px] font-mono text-text-muted">Bank line: {p.utrNo}</div>
                      <div className="text-[11px] text-accent font-medium">
                        Suggested: Priya Nair (Instalment #3 of Java Full-Stack B3 (Kothrud))
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-text-muted">Match confidence</span>
                        <span className="font-medium text-text tabular-nums">{p.confidence}%</span>
                      </div>
                      <div className="w-full h-1 rounded bg-surface overflow-hidden border border-border">
                        <div className="h-full bg-accent" style={{ width: `${p.confidence}%` }} />
                      </div>
                    </div>

                    {p.reconcileReasons && (
                      <div className="space-y-0.5">
                        {p.reconcileReasons.map((r, rIdx) => (
                          <div key={rIdx} className="text-[11px] text-text-muted flex items-start gap-1">
                            <span>•</span>
                            <span>{r}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="pt-2 flex items-center justify-between gap-2 border-t border-border">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => success('Marked as non-fee deposit')}
                      >
                        Not a fee
                      </Button>
                      <Button
                        variant="primary"
                        size="xs"
                        onClick={() => handleConfirmMatch(p.id)}
                        leftIcon={<Check className="w-3 h-3" />}
                      >
                        Confirm match
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 3: Unmatched */}
            <div className="rounded-card border border-border bg-surface p-3.5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <h3 className="text-xs font-semibold text-text flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-text-muted" />
                  Unmatched ({unmatchedItems.length})
                </h3>
                <span className="text-[11px] text-text-muted">Manual lookup</span>
              </div>

              <div className="space-y-2">
                {unmatchedItems.map((p) => (
                  <div
                    key={p.id}
                    className="p-2.5 rounded-control bg-surface-sunken border border-border text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-text">{p.studentName}</span>
                      <span className="tabular-nums font-medium text-text">
                        {formatINR(p.amount)}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-text-muted">{p.utrNo}</div>
                    <p className="text-[11px] text-text-muted">
                      No matching phone or roll number found in transaction remarks.
                    </p>
                    <Button
                      variant="outline"
                      size="xs"
                      className="w-full"
                      onClick={() => success('Lookup student directory drawer opened')}
                    >
                      Assign manually
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
        <div className="rounded-card border border-border bg-surface overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-sunken border-b border-border text-[11px] font-medium text-text-muted sticky top-0">
              <tr>
                <th className="py-2 px-3">Receipt no</th>
                <th className="py-2 px-3">Student name</th>
                <th className="py-2 px-3">Date</th>
                <th className="py-2 px-3 text-right">Amount</th>
                <th className="py-2 px-3">Payment method</th>
                <th className="py-2 px-3">UTR reference</th>
                <th className="py-2 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-surface-sunken/40 h-10 transition-colors">
                  <td className="px-3 font-mono text-[11px] text-text-muted">{p.receiptNo}</td>
                  <td className="px-3 font-medium text-text">{p.studentName}</td>
                  <td className="px-3 text-text-muted tabular-nums">{p.date}</td>
                  <td className="px-3 text-right tabular-nums font-medium text-text">
                    {formatINR(p.amount)}
                  </td>
                  <td className="px-3 text-text-muted">{p.method}</td>
                  <td className="px-3 font-mono text-[11px] text-text-muted">{p.utrNo}</td>
                  <td className="px-3">
                    {p.status === 'verified' ? (
                      <span className="inline-flex items-center gap-1 text-success text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-warning text-xs">
                        <AlertTriangle className="w-3.5 h-3.5" /> Needs review
                      </span>
                    )}
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
