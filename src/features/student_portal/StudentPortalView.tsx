import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import QRCode from 'qrcode'
import {
  Calendar,
  CreditCard,
  Award,
  Clock,
  QrCode,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  FileText,
  Play,
  BookOpen,
  ArrowRight,
  Download,
  Building2,
  X,
  ExternalLink,
  Printer,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ReasonChip } from '@/components/ui/ReasonChip'
import { StatusPill } from '@/components/ui/StatusPill'
import { formatINR } from '@/lib/utils'
import { useToast } from '@/context/ToastContext'
import { store, useStore } from '@/mocks/store'

export const StudentPortalView: React.FC = () => {
  const { success, error } = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [activeTab, setActiveTab] = useState<'today' | 'schedule' | 'recordings' | 'fees' | 'certificate'>('today')

  // Reactive store slices
  const students = useStore((s) => s.students)
  const feeInstalments = useStore((s) => s.feeInstalments)
  const recordings = useStore((s) => s.recordings)
  const attendanceRecords = useStore((s) => s.attendanceRecords)

  // Current logged in student
  const currentStudent = students.find((s) => s.id === 'std-priya-01' || s.name.includes('Priya')) || students[0]

  // Check-in state
  const [showCheckInModal, setShowCheckInModal] = useState(false)
  const [enteredToken, setEnteredToken] = useState('')
  const [isCheckedIn, setIsCheckedIn] = useState(false)

  // UPI payment state
  const [showUpiModal, setShowUpiModal] = useState(false)
  const [upiQrUrl, setUpiQrUrl] = useState('')
  const [selectedInstalment, setSelectedInstalment] = useState({
    id: 'fee-inst-01',
    sequence: 'Instalment 3 of 6',
    amount: 6500,
    dueDate: '04 Oct 2026',
    reference: 'JFS-B3-INST3',
  })

  // Receipt modal state
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [activeReceipt, setActiveReceipt] = useState({
    receiptNo: 'REC-2026-0801',
    date: '04 Aug 2026',
    amount: 6500,
    instalment: 'Instalment 1 of 6',
    method: 'UPI (Google Pay)',
    utr: 'UPI/321890123910/HDFC',
  })

  // Video player modal state
  const [showPlayerModal, setShowPlayerModal] = useState(false)
  const [activeVideo, setActiveVideo] = useState({
    title: 'Core Java: Streams, Lambdas & Concurrency',
    duration: '1h 52m',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    summary: 'Comprehensive hands-on lecture on Java 8 Streams API, parallel streams, functional interfaces, and deadlock avoidance.',
  })

  // URL-based auto check-in (/s/checkin?session=...&t=...)
  useEffect(() => {
    const sessionParam = searchParams.get('session')
    const tokenParam = searchParams.get('t')

    if (sessionParam && tokenParam) {
      const isValid = store.verifySessionQrToken(sessionParam, tokenParam)
      if (isValid) {
        setIsCheckedIn(true)
        store.recordAttendance([
          {
            id: `att-${Date.now()}`,
            sessionId: sessionParam,
            studentId: currentStudent.id,
            studentName: currentStudent.name,
            status: 'present',
            method: 'qr',
            checkInTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST',
          },
        ])
        success('Classroom check-in verified!', 'Attendance marked for today\'s live lecture.')
      } else {
        error('Invalid QR token', 'Classroom check-in code has expired or is invalid. Please scan the current rotating code.')
      }
    }
  }, [searchParams])

  // Generate UPI QR code
  useEffect(() => {
    if (showUpiModal) {
      const upiUrl = `upi://pay?pa=codecraft@hdfcbank&pn=CodeCraft%20Academy&am=${selectedInstalment.amount}&tn=${selectedInstalment.reference}`
      QRCode.toDataURL(upiUrl, { width: 220, margin: 1 })
        .then((url) => setUpiQrUrl(url))
        .catch((err) => console.error('Error generating UPI QR', err))
    }
  }, [showUpiModal, selectedInstalment])

  const handleManualCheckIn = () => {
    if (!enteredToken.trim()) {
      error('Token required', 'Please enter the 6-character code shown on the classroom screen.')
      return
    }

    const isValid = store.verifySessionQrToken('sess-m2', enteredToken.trim().toUpperCase())
    if (isValid) {
      setIsCheckedIn(true)
      store.recordAttendance([
        {
          id: `att-${Date.now()}`,
          sessionId: 'sess-m2',
          studentId: currentStudent.id,
          studentName: currentStudent.name,
          status: 'present',
          method: 'qr',
          checkInTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST',
        },
      ])
      setShowCheckInModal(false)
      success('Classroom check-in verified!', 'Attendance marked for today\'s session.')
    } else {
      error('Invalid code', 'The code entered does not match the active rotating token. Please check the screen and try again.')
    }
  }

  const handleConfirmUpiPayment = () => {
    // Record payment in store
    const newPayment = {
      id: `pay-${Date.now()}`,
      receiptNo: `REC-2026-${Math.floor(2000 + Math.random() * 8000)}`,
      studentName: currentStudent.name,
      studentId: currentStudent.id,
      amount: selectedInstalment.amount,
      date: new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST',
      method: 'UPI' as const,
      utrNo: `UPI/${Math.floor(100000000000 + Math.random() * 900000000000)}/DEMO`,
      status: 'verified' as const,
      confidence: 100,
    }
    store.payments.unshift(newPayment)

    // Update instalment in store
    const inst = feeInstalments.find((i) => i.id === selectedInstalment.id || i.studentId === currentStudent.id && i.status === 'overdue')
    if (inst) {
      inst.status = 'paid'
      inst.paidAmount = inst.amount
      inst.paidDate = new Date().toISOString().split('T')[0]
      inst.receiptNo = newPayment.receiptNo
    }
    store.notify()

    setShowUpiModal(false)
    success('Payment confirmed!', `Instalment marked as Paid. Receipt: ${newPayment.receiptNo}`)
  }

  const handleOpenReceipt = (receiptNo: string, date: string, amount: number, instalment: string) => {
    setActiveReceipt({
      receiptNo,
      date,
      amount,
      instalment,
      method: 'UPI (Instant NetBanking)',
      utr: `UPI/HDFC/${receiptNo.replace('REC-', '')}/VERIFIED`,
    })
    setShowReceiptModal(true)
  }

  const handleLaunchZoom = () => {
    window.open('https://zoom.us/j/9823488210?pwd=demo', '_blank')
    success('Launching Zoom class session in new tab...')
  }

  return (
    <div className="w-full min-h-screen bg-canvas text-text select-none font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-[1360px] mx-auto space-y-6">
        {/* Desktop Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-control bg-surface-sunken border border-border text-text font-medium text-sm flex items-center justify-center shrink-0">
              {currentStudent.avatar || 'PN'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-text">{currentStudent.name}</h1>
                <span className="text-xs px-2 py-0.5 rounded-control bg-surface-sunken border border-border text-text-muted">
                  Roll #104
                </span>
                {isCheckedIn && (
                  <span className="text-xs px-2 py-0.5 rounded-control bg-success/15 border border-success/30 text-success font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Checked In Today
                  </span>
                )}
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                {currentStudent.batchNames[0] || 'Java Full-Stack B3 (Kothrud)'} · CodeCraft Academy Pune · Kothrud Campus
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<QrCode className="w-3.5 h-3.5" />}
              onClick={() => setShowCheckInModal(true)}
            >
              Scan classroom QR
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<CreditCard className="w-3.5 h-3.5" />}
              onClick={() => setShowUpiModal(true)}
            >
              Pay instalment
            </Button>
          </div>
        </div>

        {/* Desktop KPI Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-card border border-border bg-surface text-left">
            <span className="text-xs text-text-muted">Overall attendance</span>
            <div className="mt-2 text-2xl font-medium tracking-tight text-text tabular-nums">
              {currentStudent.attendanceRate}%
            </div>
            <div className="mt-2 text-xs text-danger flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              <span>Target: 80% (3 missed)</span>
            </div>
          </div>

          <div className="p-4 rounded-card border border-border bg-surface text-left">
            <span className="text-xs text-text-muted">Next class session</span>
            <div className="mt-2 text-2xl font-medium tracking-tight text-text tabular-nums">
              Today 19:00
            </div>
            <div className="mt-2 text-xs text-text-muted">
              Room 3 · Faculty: Arjun Mehta
            </div>
          </div>

          <div className="p-4 rounded-card border border-border bg-surface text-left">
            <span className="text-xs text-text-muted">Syllabus completion</span>
            <div className="mt-2 text-2xl font-medium tracking-tight text-text tabular-nums">
              68.5%
            </div>
            <div className="mt-2 text-xs text-success">
              180 / 240 hours finished
            </div>
          </div>

          <div className="p-4 rounded-card border border-border bg-surface text-left">
            <span className="text-xs text-text-muted">Fee dues</span>
            <div className="mt-2 text-2xl font-medium tracking-tight text-text tabular-nums">
              {formatINR(6500)}
            </div>
            <div className="mt-2 text-xs text-danger">
              Instalment 3 · 12 days overdue
            </div>
          </div>
        </div>

        {/* Desktop Horizontal Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-border text-xs font-normal overflow-x-auto">
          <button
            onClick={() => setActiveTab('today')}
            className={`py-2 px-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'today'
                ? 'border-accent text-accent font-medium'
                : 'border-transparent text-text-muted hover:text-text'
            }`}
          >
            Today & overview
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`py-2 px-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'schedule'
                ? 'border-accent text-accent font-medium'
                : 'border-transparent text-text-muted hover:text-text'
            }`}
          >
            Weekly schedule
          </button>
          <button
            onClick={() => setActiveTab('recordings')}
            className={`py-2 px-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'recordings'
                ? 'border-accent text-accent font-medium'
                : 'border-transparent text-text-muted hover:text-text'
            }`}
          >
            Recorded lectures & catch-up
          </button>
          <button
            onClick={() => setActiveTab('fees')}
            className={`py-2 px-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'fees'
                ? 'border-accent text-accent font-medium'
                : 'border-transparent text-text-muted hover:text-text'
            }`}
          >
            Fees & receipts
          </button>
          <button
            onClick={() => setActiveTab('certificate')}
            className={`py-2 px-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'certificate'
                ? 'border-accent text-accent font-medium'
                : 'border-transparent text-text-muted hover:text-text'
            }`}
          >
            Credential & certificate
          </button>
        </div>

        {/* TAB 1: TODAY & OVERVIEW (12 COLUMNS) */}
        {activeTab === 'today' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Main (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              {/* Today's Class Card */}
              <div className="p-5 rounded-card border border-border bg-surface space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-text-muted">
                    Today's live class · 19:00 – 21:00 IST
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-accent">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                    Scheduled on timetable
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-text">
                      Spring Data JPA Repositories
                    </h3>
                    <p className="text-xs text-text-muted mt-1">
                      Room 3 (Kothrud Campus) · Faculty: Arjun Mehta · Hybrid Classroom
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="md"
                      onClick={handleLaunchZoom}
                      leftIcon={<ExternalLink className="w-4 h-4 text-accent" />}
                    >
                      Join Zoom
                    </Button>
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => setShowCheckInModal(true)}
                      leftIcon={<QrCode className="w-4 h-4" />}
                    >
                      {isCheckedIn ? 'Checked In ✓' : 'Check into classroom'}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Next Sessions Preview Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-text">Upcoming batch sessions</h2>
                  <span className="text-xs text-text-muted">Java Full-Stack B3 (Kothrud)</span>
                </div>

                <div className="border border-border rounded-card bg-surface overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-surface-sunken border-b border-border text-text-muted">
                      <tr>
                        <th className="py-2.5 px-3 font-medium">Session topic</th>
                        <th className="py-2.5 px-3 font-medium">Date & Time</th>
                        <th className="py-2.5 px-3 font-medium">Room</th>
                        <th className="py-2.5 px-3 font-medium">Instructor</th>
                        <th className="py-2.5 px-3 text-right font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr className="hover:bg-surface-sunken/40">
                        <td className="py-3 px-3 font-medium text-text">Spring Data JPA Repositories</td>
                        <td className="py-3 px-3 tabular-nums text-text">Today, 19:00 – 21:00</td>
                        <td className="py-3 px-3 text-text-muted">Room 3</td>
                        <td className="py-3 px-3 text-text">Arjun Mehta</td>
                        <td className="py-3 px-3 text-right">
                          <StatusPill status="in_progress" />
                        </td>
                      </tr>
                      <tr className="hover:bg-surface-sunken/40">
                        <td className="py-3 px-3 font-medium text-text">Spring Security & JWT</td>
                        <td className="py-3 px-3 tabular-nums text-text">Fri, 17 Oct · 19:00 – 21:00</td>
                        <td className="py-3 px-3 text-text-muted">Room 3</td>
                        <td className="py-3 px-3 text-text">Arjun Mehta</td>
                        <td className="py-3 px-3 text-right">
                          <StatusPill status="scheduled" />
                        </td>
                      </tr>
                      <tr className="hover:bg-surface-sunken/40">
                        <td className="py-3 px-3 font-medium text-text">Database Transactions & Locks</td>
                        <td className="py-3 px-3 tabular-nums text-text">Sat, 18 Oct · 11:00 – 13:00</td>
                        <td className="py-3 px-3 text-text-muted">Lab 2</td>
                        <td className="py-3 px-3 text-text">Arjun Mehta</td>
                        <td className="py-3 px-3 text-right">
                          <StatusPill status="scheduled" />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Aside (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              {/* Overdue Fee Banner Card */}
              <div className="p-4 rounded-card border border-border bg-surface space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-text">Tuition fee balance</span>
                  <span className="text-danger font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3" /> 12 days overdue
                  </span>
                </div>

                <div className="text-2xl font-semibold tracking-tight text-text tabular-nums">
                  {formatINR(6500)}
                </div>
                <p className="text-xs text-text-muted">Instalment 3 of 6 · Due 04 Oct 2026</p>

                <Button
                  variant="primary"
                  size="sm"
                  className="w-full"
                  onClick={() => setShowUpiModal(true)}
                >
                  Pay via UPI
                </Button>
              </div>

              {/* Catch-up Lectures Card */}
              <div className="p-4 rounded-card border border-border bg-surface space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-text">Catch-up lectures</span>
                  <span className="text-text-muted">2 missed</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div
                    onClick={() => {
                      setActiveVideo({
                        title: 'Core Java: Streams, Lambdas & Concurrency',
                        duration: '1h 52m',
                        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                        summary: 'Streams API, parallel processing, and lambda expressions in Java 8.',
                      })
                      setShowPlayerModal(true)
                    }}
                    className="p-2.5 rounded border border-border bg-surface-sunken/40 flex items-center justify-between cursor-pointer hover:bg-surface-sunken transition-colors"
                  >
                    <div>
                      <div className="font-medium text-text">Core Java: Streams & Concurrency</div>
                      <div className="text-[11px] text-text-muted mt-0.5">14 Oct · 1h 52m</div>
                    </div>
                    <Play className="w-4 h-4 text-accent shrink-0" />
                  </div>
                </div>

                <Button
                  variant="secondary"
                  size="xs"
                  className="w-full"
                  onClick={() => setActiveTab('recordings')}
                >
                  Open catch-up queue
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: WEEKLY SCHEDULE */}
        {activeTab === 'schedule' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-text">Weekly academic timetable</h2>
                <p className="text-xs text-text-muted">Timetable sessions scheduled for this week (16 Oct – 22 Oct 2026)</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.print()}
                leftIcon={<Printer className="w-3.5 h-3.5" />}
              >
                Print timetable
              </Button>
            </div>

            <div className="border border-border rounded-card bg-surface overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-surface-sunken border-b border-border text-text-muted">
                  <tr>
                    <th className="py-3 px-4 font-medium">Day</th>
                    <th className="py-3 px-4 font-medium">Time (IST)</th>
                    <th className="py-3 px-4 font-medium">Topic</th>
                    <th className="py-3 px-4 font-medium">Location</th>
                    <th className="py-3 px-4 font-medium">Trainer</th>
                    <th className="py-3 px-4 text-right font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr className="hover:bg-surface-sunken/40">
                    <td className="py-3 px-4 font-medium text-text">Wednesday</td>
                    <td className="py-3 px-4 tabular-nums text-text">19:00 – 21:00</td>
                    <td className="py-3 px-4 font-medium text-text">
                      Spring Data JPA Repositories
                    </td>
                    <td className="py-3 px-4 text-text-muted">Kothrud · Room 3</td>
                    <td className="py-3 px-4 text-text">Arjun Mehta</td>
                    <td className="py-3 px-4 text-right">
                      <StatusPill status="in_progress" />
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-sunken/40">
                    <td className="py-3 px-4 font-medium text-text">Friday</td>
                    <td className="py-3 px-4 tabular-nums text-text">19:00 – 21:00</td>
                    <td className="py-3 px-4 font-medium text-text">
                      Spring Security & JWT Authentication
                    </td>
                    <td className="py-3 px-4 text-text-muted">Kothrud · Room 3</td>
                    <td className="py-3 px-4 text-text">Arjun Mehta</td>
                    <td className="py-3 px-4 text-right">
                      <StatusPill status="scheduled" />
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-sunken/40">
                    <td className="py-3 px-4 font-medium text-text">Saturday</td>
                    <td className="py-3 px-4 tabular-nums text-text">11:00 – 13:00</td>
                    <td className="py-3 px-4 font-medium text-text">Database Transactions & Concurrency</td>
                    <td className="py-3 px-4 text-text-muted">Kothrud · Lab 2</td>
                    <td className="py-3 px-4 text-text">Arjun Mehta</td>
                    <td className="py-3 px-4 text-right">
                      <StatusPill status="scheduled" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: RECORDED LECTURES & CATCH-UP */}
        {activeTab === 'recordings' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-text">Class recordings & catch-up queue</h2>
              <p className="text-xs text-text-muted">
                Completed recordings for your batch. Watching missed lectures helps recover academic attendance.
              </p>
            </div>

            <div className="border border-border rounded-card bg-surface overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-surface-sunken border-b border-border text-text-muted">
                  <tr>
                    <th className="py-3 px-4 font-medium">Lecture topic</th>
                    <th className="py-3 px-4 font-medium">Session date</th>
                    <th className="py-3 px-4 font-medium">Duration</th>
                    <th className="py-3 px-4 font-medium">Attendance status</th>
                    <th className="py-3 px-4 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recordings.slice(0, 5).map((rec, idx) => (
                    <tr key={rec.id || idx} className="hover:bg-surface-sunken/40">
                      <td className="py-3.5 px-4 font-medium text-text">
                        {rec.title}
                      </td>
                      <td className="py-3.5 px-4 text-text-muted">{rec.date}</td>
                      <td className="py-3.5 px-4 tabular-nums text-text-muted">{rec.duration}</td>
                      <td className="py-3.5 px-4">
                        {idx === 0 ? (
                          <span className="text-danger font-medium flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" /> Missed
                          </span>
                        ) : (
                          <span className="text-success font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Attended
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="secondary"
                          size="xs"
                          leftIcon={<Play className="w-3.5 h-3.5 text-accent" />}
                          onClick={() => {
                            setActiveVideo({
                              title: rec.title,
                              duration: rec.duration,
                              url: rec.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                              summary: rec.aiSummary || 'Lecture covering core concepts and hands-on coding demonstrations.',
                            })
                            setShowPlayerModal(true)
                          }}
                        >
                          Watch recording
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: FEES & RECEIPTS */}
        {activeTab === 'fees' && (
          <div className="space-y-6">
            <div className="p-5 rounded-card border border-border bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs text-text-muted">Total course fee structure</span>
                <div className="text-2xl font-semibold text-text tabular-nums mt-1">
                  {formatINR(75000)}
                </div>
                <p className="text-xs text-text-muted mt-0.5">
                  6 monthly instalments of ₹6,500 · ₹39,000 paid to date
                </p>
              </div>

              <div className="p-4 rounded-control bg-surface-sunken border border-border text-xs space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-medium text-text">Current due instalment:</span>
                  <span className="font-semibold text-danger tabular-nums">{formatINR(6500)}</span>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full"
                  onClick={() => setShowUpiModal(true)}
                >
                  Pay instalment now
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-text">Instalment ledger & receipt vouchers</h3>
              <div className="border border-border rounded-card bg-surface overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-surface-sunken border-b border-border text-text-muted">
                    <tr>
                      <th className="py-3 px-4 font-medium">Instalment</th>
                      <th className="py-3 px-4 font-medium">Due Date</th>
                      <th className="py-3 px-4 font-medium">Amount</th>
                      <th className="py-3 px-4 font-medium">Payment status</th>
                      <th className="py-3 px-4 font-medium">Receipt No.</th>
                      <th className="py-3 px-4 text-right font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr className="hover:bg-surface-sunken/40">
                      <td className="py-3 px-4 font-medium text-text">Instalment 1 of 6</td>
                      <td className="py-3 px-4 text-text-muted">04 Aug 2026</td>
                      <td className="py-3 px-4 tabular-nums text-text">{formatINR(6500)}</td>
                      <td className="py-3 px-4">
                        <span className="text-success font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Paid
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-text-muted">REC-2026-0801</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleOpenReceipt('REC-2026-0801', '04 Aug 2026', 6500, 'Instalment 1 of 6')}
                          className="text-accent hover:underline inline-flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" /> PDF
                        </button>
                      </td>
                    </tr>
                    <tr className="hover:bg-surface-sunken/40">
                      <td className="py-3 px-4 font-medium text-text">Instalment 2 of 6</td>
                      <td className="py-3 px-4 text-text-muted">04 Sep 2026</td>
                      <td className="py-3 px-4 tabular-nums text-text">{formatINR(6500)}</td>
                      <td className="py-3 px-4">
                        <span className="text-success font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Paid
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-text-muted">REC-2026-0902</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleOpenReceipt('REC-2026-0902', '04 Sep 2026', 6500, 'Instalment 2 of 6')}
                          className="text-accent hover:underline inline-flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" /> PDF
                        </button>
                      </td>
                    </tr>
                    <tr className="hover:bg-surface-sunken/40 bg-surface-sunken/20">
                      <td className="py-3 px-4 font-medium text-text">Instalment 3 of 6</td>
                      <td className="py-3 px-4 text-danger font-medium">04 Oct 2026</td>
                      <td className="py-3 px-4 tabular-nums text-text font-semibold">{formatINR(6500)}</td>
                      <td className="py-3 px-4">
                        <span className="text-danger font-medium flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Overdue (12 days)
                        </span>
                      </td>
                      <td className="py-3 px-4 text-text-muted">—</td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="primary"
                          size="xs"
                          onClick={() => setShowUpiModal(true)}
                        >
                          Pay
                        </Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: CERTIFICATE */}
        {activeTab === 'certificate' && (
          <div className="max-w-2xl mx-auto p-8 rounded-card border border-border bg-surface text-center space-y-4">
            <Award className="w-12 h-12 text-text-muted mx-auto" />
            <h2 className="text-base font-semibold text-text">Diploma certificate in progress</h2>
            <p className="text-xs text-text-muted leading-relaxed">
              Upon completing the 240 syllabus hours of Java Full-Stack Development and raising your overall attendance above 80%, your verifiable cryptographic credential will be minted.
            </p>

            <div className="p-4 rounded-control bg-surface-sunken border border-border text-left space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Syllabus hours:</span>
                <span className="font-medium text-text tabular-nums">180 / 240 hrs completed</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Attendance benchmark:</span>
                <span className="font-medium text-warning tabular-nums">44% (80% required)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Capstone project:</span>
                <span className="font-medium text-text">In evaluation</span>
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setActiveTab('recordings')}
              leftIcon={<Play className="w-3.5 h-3.5 text-accent" />}
            >
              Watch catch-up sessions to raise attendance
            </Button>
          </div>
        )}
      </div>

      {/* Check-In Modal Dialog */}
      {showCheckInModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-card max-w-sm w-full p-5 space-y-4 shadow-dialog">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="text-sm font-semibold text-text flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-accent" />
                <span>Classroom Check-In</span>
              </h3>
              <button
                onClick={() => setShowCheckInModal(false)}
                className="text-text-muted hover:text-text p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-text-muted leading-relaxed">
              Enter the 6-character rotating token displayed on the classroom projector screen to confirm your physical presence.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text">Screen Verification Token</label>
              <input
                type="text"
                maxLength={8}
                value={enteredToken}
                onChange={(e) => setEnteredToken(e.target.value.toUpperCase())}
                placeholder="e.g. 482913"
                className="w-full text-center tracking-widest font-mono text-lg font-bold p-2.5 rounded-control border border-border bg-surface-sunken text-text focus:outline-none focus:border-accent"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowCheckInModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleManualCheckIn}
              >
                Confirm Attendance
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Pay via UPI Modal */}
      {showUpiModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-card max-w-md w-full p-5 space-y-4 shadow-dialog text-center">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="text-sm font-semibold text-text flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-accent" />
                <span>Pay via UPI (Instant Fee Settlement)</span>
              </h3>
              <button
                onClick={() => setShowUpiModal(false)}
                className="text-text-muted hover:text-text p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1 text-center">
              <span className="text-xs text-text-muted">{selectedInstalment.sequence}</span>
              <div className="text-2xl font-bold text-text tabular-nums">
                {formatINR(selectedInstalment.amount)}
              </div>
              <div className="text-[11px] font-mono text-text-muted">
                Reference: {selectedInstalment.reference}
              </div>
            </div>

            {/* UPI QR Code */}
            <div className="p-3 bg-white rounded-card border border-border inline-block mx-auto shadow-sm">
              {upiQrUrl ? (
                <img src={upiQrUrl} alt="UPI QR" className="w-48 h-48 mx-auto" />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-xs text-neutral-500">
                  Generating UPI QR...
                </div>
              )}
            </div>

            <div className="text-xs text-text-muted space-y-1">
              <div className="font-mono text-text font-medium">
                VPA: codecraft@hdfcbank <span className="text-[11px] text-accent">(Demo VPA)</span>
              </div>
              <p className="text-[11px]">
                Scan with Google Pay, PhonePe, Paytm, or any BHIM UPI application
              </p>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  window.open(
                    `upi://pay?pa=codecraft@hdfcbank&pn=CodeCraft%20Academy&am=${selectedInstalment.amount}&tn=${selectedInstalment.reference}`,
                    '_blank'
                  )
                }}
              >
                Open UPI App
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmUpiPayment}
              >
                I have paid ✓
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {showReceiptModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-card max-w-lg w-full p-6 space-y-5 shadow-dialog text-left">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-accent" />
                <div>
                  <h3 className="text-sm font-semibold text-text">CodeCraft Academy</h3>
                  <span className="text-[10px] text-text-muted">Official Fee Receipt</span>
                </div>
              </div>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="text-text-muted hover:text-text p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-control bg-surface-sunken border border-border space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Receipt Voucher:</span>
                <span className="font-mono font-semibold text-text">{activeReceipt.receiptNo}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Student Name:</span>
                <span className="font-medium text-text">{currentStudent.name} (Roll #104)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Cohort / Batch:</span>
                <span className="text-text">{currentStudent.batchNames[0]}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Instalment Item:</span>
                <span className="text-text">{activeReceipt.instalment}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Payment Method:</span>
                <span className="text-text">{activeReceipt.method}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted">UTR / Transaction Ref:</span>
                <span className="font-mono text-text-muted">{activeReceipt.utr}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="font-medium text-text">Net Amount Paid:</span>
                <span className="font-bold text-base text-success tabular-nums">
                  {formatINR(activeReceipt.amount)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-text-muted flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-success" />
                Digitally authenticated voucher
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowReceiptModal(false)}
                >
                  Close
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Printer className="w-3.5 h-3.5" />}
                  onClick={() => window.print()}
                >
                  Print Receipt
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recording Player Modal */}
      {showPlayerModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-card max-w-3xl w-full p-5 space-y-4 shadow-dialog text-left">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div>
                <h3 className="text-sm font-semibold text-text">{activeVideo.title}</h3>
                <span className="text-xs text-text-muted">
                  Duration: {activeVideo.duration} · Java Full-Stack B3 (Kothrud)
                </span>
              </div>
              <button
                onClick={() => setShowPlayerModal(false)}
                className="text-text-muted hover:text-text p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Video Player */}
            <div className="relative w-full aspect-video bg-black rounded overflow-hidden">
              <video
                src={activeVideo.url}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>

            <div className="p-3 rounded-control bg-surface-sunken border border-border space-y-1 text-xs">
              <div className="font-medium text-text">AI Session Summary</div>
              <p className="text-text-muted leading-relaxed">{activeVideo.summary}</p>
            </div>

            <div className="flex justify-end pt-2 border-t border-border">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowPlayerModal(false)}
              >
                Close Player
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
