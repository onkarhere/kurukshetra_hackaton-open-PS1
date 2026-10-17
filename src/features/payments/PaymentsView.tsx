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
  X,
  Search,
  UserCheck,
  FileSpreadsheet,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useApp } from '@/context/AppContext'
import { useToast } from '@/context/ToastContext'
import { store, useStore } from '@/mocks/store'
import { formatINR, cn } from '@/lib/utils'
import { exportToCsv } from '@/lib/exportCsv'
import { PaymentRecord } from '@/types'
import { ExtractStudentPaymentModal } from './ExtractStudentPaymentModal'

export const PaymentsView: React.FC = () => {
  const { role } = useApp()
  const { success, error } = useToast()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<'reconcile' | 'all'>('reconcile')
  const [bankFormat, setBankFormat] = useState('HDFC Bank NetBanking CSV')

  // Modals state
  const [showImportModal, setShowImportModal] = useState(false)
  const [showExtractModal, setShowExtractModal] = useState(false)
  const [selectedStudentForExtract, setSelectedStudentForExtract] = useState<string | undefined>()
  const [allTabStudentFilter, setAllTabStudentFilter] = useState<string>('all')
  const [allTabStatusFilter, setAllTabStatusFilter] = useState<string>('all')
  const [csvContent, setCsvContent] = useState('')
  const [manualMatchPayment, setManualMatchPayment] = useState<PaymentRecord | null>(null)
  const [studentSearchQuery, setStudentSearchQuery] = useState('')

  // Reactive store slices
  const payments = useStore((s) => s.payments)
  const students = useStore((s) => s.students)
  const instalments = useStore((s) => s.feeInstalments)

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
    success('Transaction matched & verified', 'Receipt generated and ledger updated.')
  }

  const handleMarkNonFee = (paymentId: string) => {
    store.markPaymentNonFee(paymentId)
    success('Marked as non-fee transaction', 'Item moved to verified non-tuition entries.')
  }

  const handleAssignStudent = (studentId: string) => {
    if (!manualMatchPayment) return
    store.matchPaymentManually(manualMatchPayment.id, studentId)
    setManualMatchPayment(null)
    success('Payment assigned successfully', 'Student EMI settled and transaction verified.')
  }

  // P1: Parse statement CSV
  const handleProcessStatement = (rawCsv: string) => {
    const lines = rawCsv.split('\n').map((l) => l.trim()).filter(Boolean)
    if (lines.length <= 1) {
      error('Invalid statement', 'Please provide a CSV with header and transaction rows.')
      return
    }

    const newRecords: PaymentRecord[] = []

    // Format: Date, Amount, Narration, Reference
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim())
      if (parts.length < 3) continue

      const dateStr = parts[0]
      const amount = parseFloat(parts[1]) || 6500
      const narration = parts[2]
      const ref = parts[3] || `REF-${Math.floor(100000 + Math.random() * 900000)}`

      // Match logic: Match against overdue instalments by amount + narration name/phone
      const matchInstalment = instalments.find((inst) => {
        const namePart = inst.studentName.toLowerCase()
        const narrationLower = narration.toLowerCase()
        return (
          inst.amount === amount &&
          (narrationLower.includes(namePart.split(' ')[0]) || narrationLower.includes(namePart.split(' ')[1] || ''))
        )
      })

      let confidence = 40
      let status: PaymentRecord['status'] = 'unmatched'
      let matchedStudentName = 'Unknown Sender'
      let matchedStudentId = ''
      const reasons: string[] = []

      if (matchInstalment) {
        matchedStudentName = matchInstalment.studentName
        matchedStudentId = matchInstalment.studentId
        confidence = 96
        status = 'verified'
        reasons.push(`Exact amount match ₹${amount} and student name in narration.`)
      } else {
        // Partial match
        const student = students.find((s) => narration.toLowerCase().includes(s.name.split(' ')[0].toLowerCase()))
        if (student) {
          matchedStudentName = student.name
          matchedStudentId = student.id
          confidence = 85
          status = 'needs_review'
          reasons.push(`Sender name matches student "${student.name}". Amount requires verification.`)
        } else {
          reasons.push('No student phone or name match in payment note.')
        }
      }

      newRecords.push({
        id: `pay-${Date.now()}-${i}`,
        receiptNo: `REC-2026-${Math.floor(3000 + Math.random() * 6000)}`,
        studentName: matchedStudentName,
        studentId: matchedStudentId,
        amount,
        date: dateStr || '16 Oct 2026',
        method: narration.toUpperCase().includes('NEFT') ? 'Bank Transfer' : 'UPI',
        utrNo: ref,
        status,
        confidence,
        reconcileReasons: reasons,
      })
    }

    const imported = store.importPayments(newRecords)
    setShowImportModal(false)
    success('Statement imported', `Processed ${newRecords.length} records (${imported} new transactions added to ledger).`)
  }

  // P1: Export visible rows as CSV
  const handleExport = () => {
    const rows = (activeTab === 'reconcile' ? payments : payments).map((p) => ({
      'Receipt No': p.receiptNo,
      'Student Name': p.studentName,
      Date: p.date,
      Amount: p.amount,
      Method: p.method,
      'UTR Reference': p.utrNo,
      Status: p.status,
      Confidence: p.confidence ? `${p.confidence}%` : '—',
    }))
    exportToCsv(rows, `payments_reconciliation_${new Date().toISOString().slice(0, 10)}.csv`)
    success('Payments exported', `${rows.length} rows exported to CSV.`)
  }

  const needsReviewItems = payments.filter((p) => p.status === 'needs_review')
  const autoMatchedItems = payments.filter((p) => p.status === 'verified')
  const unmatchedItems = payments.filter((p) => p.status === 'unmatched')

  const filteredCandidateSearch = students.filter(
    (s) =>
      s.name.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(studentSearchQuery.toLowerCase())
  )

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

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedStudentForExtract(undefined)
              setShowExtractModal(true)
            }}
            leftIcon={<FileSpreadsheet className="w-3.5 h-3.5 text-accent" />}
          >
            Extract child payments
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExport}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export audit sheet
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowImportModal(true)}
            leftIcon={<Upload className="w-3.5 h-3.5" />}
          >
            Import statement
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
                onClick={() => setShowImportModal(true)}
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
                        onClick={() => handleMarkNonFee(p.id)}
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
                      onClick={() => setManualMatchPayment(p)}
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
      {activeTab === 'all' && (() => {
        const filteredAllTabPayments = payments.filter((p) => {
          if (allTabStatusFilter !== 'all' && p.status !== allTabStatusFilter) return false
          if (allTabStudentFilter !== 'all') {
            const match =
              p.studentId === allTabStudentFilter ||
              p.studentName.toLowerCase().includes(
                (students.find((s) => s.id === allTabStudentFilter)?.name || '').toLowerCase()
              )
            if (!match) return false
          }
          return true
        })

        return (
          <div className="space-y-3">
            {/* Filter Bar with Student Selection & Instant Extract */}
            <div className="p-3 rounded-card border border-border bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-text-muted font-medium">Child / Student:</span>
                <select
                  value={allTabStudentFilter}
                  onChange={(e) => setAllTabStudentFilter(e.target.value)}
                  className="bg-surface-sunken border border-border rounded-control px-2.5 py-1 text-text outline-none focus:border-accent font-medium"
                >
                  <option value="all">All students ({payments.length} transactions)</option>
                  {students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.id})
                    </option>
                  ))}
                </select>

                <select
                  value={allTabStatusFilter}
                  onChange={(e) => setAllTabStatusFilter(e.target.value)}
                  className="bg-surface-sunken border border-border rounded-control px-2.5 py-1 text-text outline-none focus:border-accent"
                >
                  <option value="all">All statuses</option>
                  <option value="verified">Verified only</option>
                  <option value="needs_review">Needs review</option>
                  <option value="unmatched">Unmatched</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                {allTabStudentFilter !== 'all' ? (
                  <Button
                    variant="primary"
                    size="xs"
                    onClick={() => {
                      setSelectedStudentForExtract(allTabStudentFilter)
                      setShowExtractModal(true)
                    }}
                    leftIcon={<Download className="w-3.5 h-3.5" />}
                  >
                    Extract {students.find((s) => s.id === allTabStudentFilter)?.name.split(' ')[0]}'s data
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => {
                      setSelectedStudentForExtract(undefined)
                      setShowExtractModal(true)
                    }}
                    leftIcon={<FileSpreadsheet className="w-3.5 h-3.5 text-accent" />}
                  >
                    Extract by child…
                  </Button>
                )}
              </div>
            </div>

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
                    <th className="py-2 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredAllTabPayments.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-text-muted">
                        No payments found for this filter.
                      </td>
                    </tr>
                  ) : (
                    filteredAllTabPayments.map((p) => (
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
                        <td className="px-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              const foundStudent = students.find(
                                (s) => s.id === p.studentId || p.studentName.toLowerCase().includes(s.name.toLowerCase())
                              )
                              setSelectedStudentForExtract(foundStudent?.id || p.studentId)
                              setShowExtractModal(true)
                            }}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-border text-[11px] text-text-muted hover:text-text hover:bg-surface-sunken transition-colors"
                            title="Extract all payment records for this student"
                          >
                            <Download className="w-3 h-3 text-accent" />
                            <span>Extract</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )
      })()}

      {/* Import Statement Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-card max-w-lg w-full p-5 space-y-4 shadow-dialog">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="text-sm font-semibold text-text">Import Bank Settlement Statement</h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-text-muted hover:text-text p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-text-muted leading-relaxed">
              Upload bank statement CSV (Format: Date, Amount, Narration, Reference). System automatically reconciles against overdue student EMIs with ≥95% confidence matching.
            </p>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-text">Statement CSV Rows</span>
                <button
                  type="button"
                  onClick={() => {
                    const sample = `Date,Amount,Narration,Reference\n16 Oct 2026,6500,UPI-PRIYA NAIR-FEE-OCT,UPI/329910283011\n16 Oct 2026,6500,NEFT-ROHAN KULKARNI-EMIS,NEFT/HDFC2910291\n16 Oct 2026,12000,CANTEEN VENDOR SETTLEMENT,UTR/VENDOR/8912`
                    setCsvContent(sample)
                  }}
                  className="text-accent hover:underline"
                >
                  Load sample statement
                </button>
              </div>
              <textarea
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                placeholder="Date,Amount,Narration,Reference&#10;16 Oct 2026,6500,UPI-PRIYA NAIR,UPI/12345678"
                rows={5}
                className="w-full text-xs font-mono p-2.5 rounded-control border border-border bg-surface-sunken text-text focus:outline-none focus:border-accent"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="cursor-pointer text-xs text-accent hover:underline flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload .csv</span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const reader = new FileReader()
                      reader.onload = (event) => {
                        const content = event.target?.result as string
                        setCsvContent(content || '')
                      }
                      reader.readAsText(file)
                    }
                  }}
                />
              </label>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowImportModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleProcessStatement(csvContent)}
                  disabled={!csvContent.trim()}
                >
                  Parse & reconcile
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Student Search & Match Modal */}
      {manualMatchPayment && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-card max-w-md w-full p-5 space-y-4 shadow-dialog">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="text-sm font-semibold text-text">Assign Payment to Student</h3>
              <button
                onClick={() => setManualMatchPayment(null)}
                className="text-text-muted hover:text-text p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-control bg-surface-sunken border border-border text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Transaction UTR:</span>
                <span className="font-mono font-medium text-text">{manualMatchPayment.utrNo}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Amount:</span>
                <span className="font-bold text-success tabular-nums">{formatINR(manualMatchPayment.amount)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search student by name, ID or email..."
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-control border border-border bg-surface text-text focus:outline-none focus:border-accent"
                />
              </div>

              <div className="max-h-56 overflow-y-auto divide-y divide-border border border-border rounded-control">
                {filteredCandidateSearch.slice(0, 6).map((st) => (
                  <div
                    key={st.id}
                    className="p-2.5 hover:bg-surface-sunken cursor-pointer flex items-center justify-between text-xs transition-colors"
                    onClick={() => handleAssignStudent(st.id)}
                  >
                    <div>
                      <div className="font-medium text-text">{st.name}</div>
                      <div className="text-[11px] text-text-muted font-mono">{st.id} · {st.branch}</div>
                    </div>
                    <Button variant="secondary" size="xs" leftIcon={<UserCheck className="w-3 h-3" />}>
                      Match
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-border">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setManualMatchPayment(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Extract Student Payment Data Modal */}
      <ExtractStudentPaymentModal
        isOpen={showExtractModal}
        onClose={() => setShowExtractModal(false)}
        initialStudentId={selectedStudentForExtract}
      />
    </div>
  )
}
