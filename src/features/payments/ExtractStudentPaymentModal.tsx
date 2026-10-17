import React, { useState, useMemo } from 'react'
import {
  X,
  Download,
  Printer,
  Copy,
  Check,
  Search,
  Filter,
  Building2,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/context/ToastContext'
import { useStore } from '@/mocks/store'
import { formatINR, cn } from '@/lib/utils'
import { exportToCsv } from '@/lib/exportCsv'

interface ExtractStudentPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  initialStudentId?: string
}

export const ExtractStudentPaymentModal: React.FC<ExtractStudentPaymentModalProps> = ({
  isOpen,
  onClose,
  initialStudentId,
}) => {
  const { success } = useToast()
  const students = useStore((s) => s.students)
  const payments = useStore((s) => s.payments)
  const feeInstalments = useStore((s) => s.feeInstalments)

  // State
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    initialStudentId || students[0]?.id || ''
  )
  const [dataScope, setDataScope] = useState<'all' | 'verified_only' | 'full_ledger'>('all')
  const [dateRange, setDateRange] = useState<'all' | 'last_30_days' | 'current_year' | 'custom'>('all')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [copied, setCopied] = useState(false)
  const [showPrintView, setShowPrintView] = useState(false)

  // Selected student object
  const currentStudent = useMemo(() => {
    return (
      students.find((s) => s.id === selectedStudentId) ||
      students.find((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      students[0]
    )
  }, [students, selectedStudentId, searchQuery])

  // Filter students for search dropdown
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students
    const q = searchQuery.toLowerCase()
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.phone.includes(q) ||
        s.batchNames.some((b) => b.toLowerCase().includes(q))
    )
  }, [students, searchQuery])

  // Combine payments and paid/scheduled fee instalments for the selected student
  const studentPaymentRecords = useMemo(() => {
    if (!currentStudent) return []

    const studentPayments = payments.filter(
      (p) =>
        p.studentId === currentStudent.id ||
        p.studentName.toLowerCase().includes(currentStudent.name.toLowerCase())
    )

    const studentInstalments = feeInstalments.filter(
      (f) =>
        f.studentId === currentStudent.id ||
        f.studentName.toLowerCase().includes(currentStudent.name.toLowerCase())
    )

    // Build unified extracted row entries
    const unifiedRows: Array<{
      id: string
      receiptNo: string
      date: string
      amount: number
      method: string
      utrNo: string
      status: string
      instalment: string
      batch: string
      type: 'payment' | 'instalment'
    }> = []

    // 1. Add direct payment records
    studentPayments.forEach((p) => {
      unifiedRows.push({
        id: p.id,
        receiptNo: p.receiptNo || 'Pending',
        date: p.date,
        amount: p.amount,
        method: p.method,
        utrNo: p.utrNo || '—',
        status: p.status === 'verified' ? 'Verified' : p.status === 'needs_review' ? 'Needs Review' : 'Unmatched',
        instalment: p.instalmentId || 'Tuition Instalment',
        batch: currentStudent.batchNames[0] || 'Java Full-Stack B3 (Kothrud)',
        type: 'payment',
      })
    })

    // 2. Add instalments based on selected scope
    studentInstalments.forEach((inst) => {
      // Avoid duplicate if receiptNo already recorded in payments
      const isAlreadyInPayments = unifiedRows.some((r) => r.receiptNo && inst.receiptNo && r.receiptNo === inst.receiptNo)
      if (isAlreadyInPayments) return

      if (dataScope === 'full_ledger') {
        unifiedRows.push({
          id: inst.id,
          receiptNo: inst.receiptNo || 'Unassigned',
          date: inst.paidDate || inst.dueDate,
          amount: inst.paidAmount > 0 ? inst.paidAmount : inst.amount,
          method: inst.paymentMethod || 'UPI / NetBanking',
          utrNo: inst.receiptNo ? `REF/${inst.receiptNo}` : '—',
          status: inst.status === 'paid' ? 'Paid' : inst.status === 'overdue' ? 'Overdue' : 'Due Soon',
          instalment: inst.sequence,
          batch: inst.batchName || currentStudent.batchNames[0] || 'CodeCraft Academy',
          type: 'instalment',
        })
      } else if (inst.status === 'paid' && inst.paidAmount > 0) {
        unifiedRows.push({
          id: inst.id,
          receiptNo: inst.receiptNo || `REC-2026-${inst.id.slice(-4)}`,
          date: inst.paidDate || inst.dueDate,
          amount: inst.paidAmount,
          method: inst.paymentMethod || 'UPI (Direct)',
          utrNo: `UPI/AUTO/${inst.receiptNo || inst.id}`,
          status: 'Verified',
          instalment: inst.sequence,
          batch: inst.batchName || currentStudent.batchNames[0] || 'CodeCraft Academy',
          type: 'instalment',
        })
      }
    })

    // Filter by Scope
    let result = unifiedRows
    if (dataScope === 'verified_only') {
      result = result.filter((r) => r.status.toLowerCase() === 'verified' || r.status.toLowerCase() === 'paid')
    }

    // Filter by Date Range
    if (dateRange === 'last_30_days') {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      result = result.filter((r) => {
        try {
          const d = new Date(r.date.split(' ')[0])
          return !isNaN(d.getTime()) && d >= thirtyDaysAgo
        } catch {
          return true
        }
      })
    } else if (dateRange === 'custom' && (customStartDate || customEndDate)) {
      result = result.filter((r) => {
        try {
          const d = new Date(r.date.split(' ')[0])
          if (isNaN(d.getTime())) return true
          if (customStartDate && d < new Date(customStartDate)) return false
          if (customEndDate && d > new Date(customEndDate)) return false
          return true
        } catch {
          return true
        }
      })
    }

    return result
  }, [currentStudent, payments, feeInstalments, dataScope, dateRange, customStartDate, customEndDate])

  // Aggregate metrics for selected student
  const totalPaid = useMemo(() => {
    return studentPaymentRecords
      .filter((r) => r.status.toLowerCase() === 'verified' || r.status.toLowerCase() === 'paid')
      .reduce((acc, r) => acc + r.amount, 0)
  }, [studentPaymentRecords])

  const pendingDues = useMemo(() => {
    if (!currentStudent) return 0
    return feeInstalments
      .filter((f) => (f.studentId === currentStudent.id || f.studentName === currentStudent.name) && f.status !== 'paid')
      .reduce((acc, f) => acc + (f.amount - f.paidAmount), 0)
  }, [currentStudent, feeInstalments])

  if (!isOpen || !currentStudent) return null

  // Handler: Export CSV
  const handleExportCsv = () => {
    const filename = `payment_statement_${currentStudent.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.csv`
    const rows = studentPaymentRecords.map((r) => ({
      'Receipt No': r.receiptNo,
      'Student ID': currentStudent.id,
      'Student Name': currentStudent.name,
      Batch: r.batch,
      'Payment Date': r.date,
      'Amount (INR)': r.amount,
      'Payment Method': r.method,
      'UTR / Transaction Reference': r.utrNo,
      'Instalment / Item': r.instalment,
      'Reconciliation Status': r.status,
    }))

    exportToCsv(rows, filename)
    success(
      'Payment data exported',
      `Extracted ${rows.length} payment record(s) for ${currentStudent.name} as CSV.`
    )
  }

  // Handler: Copy summary text to clipboard
  const handleCopySummary = () => {
    const lines = [
      `Payment Statement: ${currentStudent.name} (ID: ${currentStudent.id})`,
      `Batch: ${currentStudent.batchNames.join(', ')}`,
      `Total Verified Paid: ${formatINR(totalPaid)}`,
      `Pending Dues: ${formatINR(pendingDues)}`,
      `Extracted Records (${studentPaymentRecords.length} entries):`,
      '-------------------------------------------------------',
      ...studentPaymentRecords.map(
        (r, i) =>
          `${i + 1}. [${r.receiptNo}] ${r.date} | ${formatINR(r.amount)} via ${r.method} | UTR: ${r.utrNo} | Status: ${r.status}`
      ),
    ]

    navigator.clipboard.writeText(lines.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    success('Copied to clipboard', `Statement summary for ${currentStudent.name} is ready to paste.`)
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 select-none"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-border rounded-card max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl text-left overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:px-6 border-b border-border bg-surface-sunken flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-control bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-semibold text-text">
                  Extract Student Payment Data
                </h2>
                <span className="text-[10px] font-mono uppercase bg-surface border border-border px-1.5 py-0.5 rounded text-text-muted">
                  Accountant Tool
                </span>
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                Extract, customize, filter, and export payment records and fee ledgers for any student
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-control text-text-muted hover:text-text hover:bg-surface transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* 1. Student Selection Bar */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-text">
              Select Child / Student to Extract:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              <div className="sm:col-span-7 relative">
                <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search student by name, ID, phone, or batch…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-surface-sunken border border-border rounded-control pl-8 pr-3 py-1.5 text-xs text-text outline-none focus:border-accent"
                />
              </div>

              <div className="sm:col-span-5">
                <select
                  value={currentStudent.id}
                  onChange={(e) => {
                    setSelectedStudentId(e.target.value)
                    setSearchQuery('')
                  }}
                  className="w-full bg-surface-sunken border border-border rounded-control px-2.5 py-1.5 text-xs text-text outline-none focus:border-accent font-medium truncate"
                >
                  {filteredStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.id}) · {s.batchNames[0]?.slice(0, 20)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 2. Selected Student Profile Summary Strip */}
          <div className="p-3.5 rounded-card border border-border bg-surface-sunken/60 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-surface border border-border font-semibold text-accent flex items-center justify-center shrink-0 text-sm">
                {currentStudent.avatar || currentStudent.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-text text-sm">{currentStudent.name}</span>
                  <span className="text-[11px] font-mono text-text-muted px-1.5 py-0.2 rounded bg-surface border border-border">
                    {currentStudent.id}
                  </span>
                </div>
                <div className="text-[11px] text-text-muted mt-0.5">
                  {currentStudent.batchNames.join(', ')} · Phone: {currentStudent.phone}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-border pt-2 md:pt-0 md:pl-4 shrink-0">
              <div>
                <span className="text-[10px] text-text-muted uppercase tracking-wider block">
                  Total Verified Paid
                </span>
                <span className="text-sm font-semibold text-success tabular-nums">
                  {formatINR(totalPaid)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-text-muted uppercase tracking-wider block">
                  Pending Balance
                </span>
                <span
                  className={cn(
                    'text-sm font-semibold tabular-nums',
                    pendingDues > 0 ? 'text-danger' : 'text-text-muted'
                  )}
                >
                  {formatINR(pendingDues)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-text-muted uppercase tracking-wider block">
                  Transactions
                </span>
                <span className="text-sm font-semibold text-text tabular-nums">
                  {studentPaymentRecords.length} records
                </span>
              </div>
            </div>
          </div>

          {/* 3. Extraction Filters & Parameters */}
          <div className="p-3.5 rounded-card border border-border bg-surface space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-text">
              <Filter className="w-3.5 h-3.5 text-accent" />
              <span>Extraction Criteria & Scope</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {/* Scope filter */}
              <div>
                <label className="block text-text-muted font-medium mb-1">Data Scope</label>
                <select
                  value={dataScope}
                  onChange={(e) => setDataScope(e.target.value as any)}
                  className="w-full bg-surface-sunken border border-border rounded-control px-2.5 py-1.5 text-text outline-none focus:border-accent"
                >
                  <option value="all">All Payments & Receipts (Default)</option>
                  <option value="verified_only">Verified Payments Only</option>
                  <option value="full_ledger">Full Financial Ledger (Paid + Scheduled EMIs)</option>
                </select>
              </div>

              {/* Date range filter */}
              <div>
                <label className="block text-text-muted font-medium mb-1">Time Period</label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value as any)}
                  className="w-full bg-surface-sunken border border-border rounded-control px-2.5 py-1.5 text-text outline-none focus:border-accent"
                >
                  <option value="all">All Time (Full History)</option>
                  <option value="last_30_days">Last 30 Days</option>
                  <option value="current_year">Current Financial Year (2026)</option>
                  <option value="custom">Custom Date Range…</option>
                </select>
              </div>

              {/* Custom Date inputs if selected */}
              {dateRange === 'custom' && (
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="block text-text-muted font-medium mb-1">From</label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full bg-surface-sunken border border-border rounded-control px-2 py-1 text-xs text-text outline-none focus:border-accent"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-text-muted font-medium mb-1">To</label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full bg-surface-sunken border border-border rounded-control px-2 py-1 text-xs text-text outline-none focus:border-accent"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 4. Live Extraction Preview Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-text">
                Live Preview ({studentPaymentRecords.length} records ready to export)
              </span>
              <span className="text-text-muted text-[11px]">
                Target: {currentStudent.name}
              </span>
            </div>

            <div className="rounded-card border border-border bg-surface overflow-x-auto max-h-56">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-sunken border-b border-border text-[11px] font-medium text-text-muted sticky top-0">
                  <tr>
                    <th className="py-2 px-3">Receipt No</th>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3 text-right">Amount</th>
                    <th className="py-2 px-3">Method</th>
                    <th className="py-2 px-3">UTR / Ref</th>
                    <th className="py-2 px-3">Instalment</th>
                    <th className="py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {studentPaymentRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-text-muted text-xs">
                        No payments found matching the selected criteria for this student.
                      </td>
                    </tr>
                  ) : (
                    studentPaymentRecords.map((r) => (
                      <tr key={r.id} className="hover:bg-surface-sunken/40">
                        <td className="py-2 px-3 font-mono text-[11px] text-text-muted">
                          {r.receiptNo}
                        </td>
                        <td className="py-2 px-3 text-text-muted tabular-nums">{r.date}</td>
                        <td className="py-2 px-3 text-right tabular-nums font-semibold text-text">
                          {formatINR(r.amount)}
                        </td>
                        <td className="py-2 px-3 text-text-muted">{r.method}</td>
                        <td className="py-2 px-3 font-mono text-[10px] text-text-muted truncate max-w-[140px]">
                          {r.utrNo}
                        </td>
                        <td className="py-2 px-3 text-text-muted">{r.instalment}</td>
                        <td className="py-2 px-3">
                          {r.status === 'Verified' || r.status === 'Paid' ? (
                            <span className="inline-flex items-center gap-1 text-success text-[11px] font-medium">
                              <CheckCircle2 className="w-3 h-3" /> {r.status}
                            </span>
                          ) : r.status === 'Needs Review' ? (
                            <span className="inline-flex items-center gap-1 text-warning text-[11px] font-medium">
                              <Clock className="w-3 h-3" /> {r.status}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-danger text-[11px] font-medium">
                              <AlertTriangle className="w-3 h-3" /> {r.status}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:px-6 border-t border-border bg-surface-sunken flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-text-muted">
            Format: Standard CSV / ISO-8859 with injection safety guards
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopySummary}
              leftIcon={copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
            >
              {copied ? 'Copied summary' : 'Copy summary'}
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowPrintView(true)}
              leftIcon={<Printer className="w-3.5 h-3.5" />}
            >
              Print statement
            </Button>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleExportCsv}
              disabled={studentPaymentRecords.length === 0}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Export CSV ({studentPaymentRecords.length})
            </Button>
          </div>
        </div>
      </div>

      {/* Printable Statement Modal */}
      {showPrintView && (
        <div
          className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setShowPrintView(false)}
        >
          <div
            className="bg-surface border border-border rounded-card max-w-2xl w-full p-6 space-y-4 shadow-2xl text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-accent" />
                <div>
                  <h3 className="text-sm font-semibold text-text">CodeCraft Academy Pune</h3>
                  <span className="text-[10px] text-text-muted">Official Student Fee Payment Statement</span>
                </div>
              </div>
              <Button
                variant="primary"
                size="xs"
                onClick={() => window.print()}
                leftIcon={<Printer className="w-3 h-3" />}
              >
                Print / Save PDF
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-surface-sunken p-3.5 rounded-control border border-border">
              <div>
                <span className="text-text-muted block text-[11px]">Student Name</span>
                <span className="font-semibold text-text">{currentStudent.name}</span>
                <span className="text-text-muted block text-[11px] mt-1 font-mono">ID: {currentStudent.id}</span>
              </div>
              <div>
                <span className="text-text-muted block text-[11px]">Enrolled Course & Batch</span>
                <span className="font-semibold text-text">{currentStudent.batchNames[0]}</span>
                <span className="text-text-muted block text-[11px] mt-1">Generated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto border border-border rounded-control">
              <table className="w-full text-xs text-left">
                <thead className="bg-surface-sunken text-[11px] text-text-muted border-b border-border">
                  <tr>
                    <th className="py-2 px-3">Receipt</th>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Mode</th>
                    <th className="py-2 px-3">UTR Reference</th>
                    <th className="py-2 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {studentPaymentRecords.map((r) => (
                    <tr key={r.id}>
                      <td className="py-1.5 px-3 font-mono text-[11px]">{r.receiptNo}</td>
                      <td className="py-1.5 px-3 text-text-muted">{r.date}</td>
                      <td className="py-1.5 px-3 text-text-muted">{r.method}</td>
                      <td className="py-1.5 px-3 font-mono text-[10px] text-text-muted">{r.utrNo}</td>
                      <td className="py-1.5 px-3 text-right font-semibold tabular-nums">{formatINR(r.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 rounded-control bg-surface-sunken border border-border flex justify-between text-xs">
              <span className="font-medium text-text">Total Amount Settled</span>
              <span className="font-bold text-success text-sm tabular-nums">{formatINR(totalPaid)}</span>
            </div>

            <div className="flex justify-end pt-2 border-t border-border">
              <Button variant="secondary" size="sm" onClick={() => setShowPrintView(false)}>
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
