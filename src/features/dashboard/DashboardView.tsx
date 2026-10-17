import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckCheck,
  AlertOctagon,
  CreditCard,
  ShieldAlert,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Table as TableIcon,
  LineChart as LineChartIcon,
  Calendar,
  UserPlus,
  Layers,
  Clock,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Play,
  UserCheck,
  PhoneCall,
  Lock,
  QrCode,
  Award,
  Video,
  GraduationCap,
} from 'lucide-react'
import { KpiCard } from '@/components/app/KpiCard'
import { ReasonChip } from '@/components/ui/ReasonChip'
import { StatusPill } from '@/components/ui/StatusPill'
import { Button } from '@/components/ui/Button'
import { useApp } from '@/context/AppContext'
import { useToast } from '@/context/ToastContext'
import { store, useStore } from '@/mocks/store'
import { formatINR } from '@/lib/utils'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { NewBatchModal } from '@/features/batches/NewBatchModal'

export const DashboardView: React.FC = () => {
  const { role, currentUser, branch } = useApp()
  const { success } = useToast()
  const navigate = useNavigate()

  const [isSummaryOpen, setIsSummaryOpen] = useState(false)
  const [showChartAsTable, setShowChartAsTable] = useState(false)
  const [isNewBatchOpen, setIsNewBatchOpen] = useState(false)

  // Reactive store data
  const approvals = useStore((s) => s.approvals)
  const students = useStore((s) => s.students)
  const feeInstalments = useStore((s) => s.feeInstalments)
  const payments = useStore((s) => s.payments)
  const timetableSessions = useStore((s) => s.timetableSessions)
  const batches = useStore((s) => s.batches)
  const trainers = useStore((s) => s.trainers)

  // Dynamic Data aggregations
  const pendingApprovalsCount = approvals.filter((a) => a.status === 'pending').length
  const pendingStudentRegistrations = approvals.filter(
    (a) => a.type === 'student_registration' && a.status === 'pending'
  )
  const criticalStudents = students.filter((s) => s.riskLevel === 'critical')
  const highRiskStudents = students.filter((s) => s.riskLevel === 'high')
  const watchRiskStudents = students.filter((s) => s.riskLevel === 'watch')
  const lowRiskStudents = students.filter((s) => s.riskLevel === 'low')
  const totalAtRiskCount = criticalStudents.length + highRiskStudents.length + watchRiskStudents.length

  const overdueInstalments = feeInstalments.filter(
    (i) => i.status === 'overdue' || (i.status === 'partially_paid' && i.amount > i.paidAmount)
  )
  const overdueTotal = overdueInstalments.reduce((acc, i) => acc + (i.amount - i.paidAmount), 0)

  const avgAttendance =
    students.length > 0
      ? (students.reduce((acc, s) => acc + s.attendanceRate, 0) / students.length).toFixed(1)
      : '89.4'

  const verifiedPayments = payments.filter((p) => p.status === 'verified')
  const verifiedTotal = verifiedPayments.reduce((acc, p) => acc + p.amount, 0)
  const collectedThisMonth = 462500 + (verifiedTotal > 11500 ? verifiedTotal - 11500 : 0)

  const unreconciledPayments = payments.filter((p) => p.status === 'needs_review' || p.status === 'unmatched')

  // 7-day collections data
  const collectionData = [
    { day: '10 Oct', amount: 45000, target: 40000 },
    { day: '11 Oct', amount: 52000, target: 40000 },
    { day: '12 Oct', amount: 38000, target: 40000 },
    { day: '13 Oct', amount: 64000, target: 45000 },
    { day: '14 Oct', amount: 78000, target: 45000 },
    { day: '15 Oct', amount: 89000, target: 50000 },
    { day: '16 Oct', amount: 96500, target: 50000 },
  ]

  // Attendance matrix: batch by weekday
  const attendanceHeatmapData = [
    { batch: 'Java Full-Stack B3 (Kothrud)', mon: 88, tue: 82, wed: 78, thu: 85, fri: 79 },
    { batch: 'Java Full-Stack B4 (Baner)', mon: 94, tue: 92, wed: 96, thu: 91, fri: 93 },
    { batch: 'Python Data B1 (Baner)', mon: 89, tue: 86, wed: 91, thu: 88, fri: 90 },
    { batch: 'Data Analytics B2 (Kothrud)', mon: 96, tue: 94, wed: 98, thu: 95, fri: 97 },
    { batch: 'React Frontend B1 (Online)', mon: 91, tue: 89, wed: 90, thu: 92, fri: 91 },
  ]

  // Sequential scale of peach to espresso: #F6E3D1 → #E2C6A7 → #C9A57F → #9A7655 → #6E5040
  const getSequentialAccentClass = (pct: number) => {
    if (pct >= 95) return 'bg-[#6E5040] text-[#F8F4EF] font-semibold'
    if (pct >= 90) return 'bg-[#9A7655] text-[#F8F4EF] font-medium'
    if (pct >= 85) return 'bg-[#C9A57F] text-[#1E140E] font-medium'
    if (pct >= 80) return 'bg-[#E2C6A7] text-[#1E140E]'
    return 'bg-[#F6E3D1] text-[#1E140E]'
  }

  /* =========================================================================
     0. STUDENT DASHBOARD VARIANT (FULL DESKTOP-SIZED DASHBOARD)
     ========================================================================= */
  if (role === 'student') {
    const currentStudent =
      students.find(
        (s) => s.id === currentUser.id || s.name === currentUser.name || s.name.includes('Priya')
      ) || students[0]

    const studentOverdue = feeInstalments.filter(
      (i) =>
        (i.studentId === currentStudent?.id || i.studentName === currentStudent?.name) &&
        (i.status === 'overdue' || (i.status === 'partially_paid' && i.amount > i.paidAmount))
    )
    const studentOverdueTotal = studentOverdue.reduce(
      (acc, i) => acc + (i.amount - i.paidAmount),
      0
    )

    return (
      <div className="space-y-6">
        {/* Desktop Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
          <div>
            <h1 className="text-xl font-semibold text-text">Good afternoon, {currentStudent?.name.split(' ')[0] || 'Student'}</h1>
            <p className="text-xs text-text-muted mt-0.5">
              {currentStudent?.batchNames[0] || 'Java Full-Stack B3 (Kothrud)'} · Roll #104 · CodeCraft Academy Pune · Thu, 16 Oct 2026
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => success('Checked into today\'s session: Spring Data JPA')}
              leftIcon={<QrCode className="w-3.5 h-3.5" />}
            >
              Check into session
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/recordings')}
              leftIcon={<Video className="w-3.5 h-3.5" />}
            >
              Watch recordings
            </Button>
          </div>
        </div>

        {/* 4 Desktop Student KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="My attendance"
            value={`${currentStudent?.attendanceRate ?? 44}%`}
            delta={{ value: 'Target: 80% · 3 missed', isPositive: false }}
            onClick={() => navigate('/recordings')}
          />
          <KpiCard
            label="Next session"
            value="Today 19:00"
            delta={{ value: 'Spring Data JPA · Room 3', isNeutral: true }}
            onClick={() => navigate('/timetable')}
          />
          <KpiCard
            label="Curriculum progress"
            value="68%"
            delta={{ value: 'Module 4 of 6 active', isPositive: true }}
            onClick={() => navigate('/courses')}
          />
          <KpiCard
            label="Tuition fees"
            value={formatINR(studentOverdueTotal > 0 ? studentOverdueTotal : 6500)}
            delta={{ value: 'Instalment 3 · 12d overdue', isPositive: false }}
            onClick={() => navigate('/fees')}
          />
        </div>

        {/* 12-Column Desktop Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Content (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Today's Live/Upcoming Session */}
            <div className="p-4 rounded-card border border-border bg-surface space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-text-muted">
                  Today's class · 19:00 – 21:00 IST
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-accent">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                  Scheduled
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-text">Spring Data JPA Repositories</h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    Room 3 (Kothrud Campus) · Faculty: Arjun Mehta · Hybrid Classroom
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => success('Checked into session via student QR beacon')}
                  leftIcon={<QrCode className="w-3.5 h-3.5" />}
                >
                  Scan QR code
                </Button>
              </div>
            </div>

            {/* Class Schedule Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-text">Weekly class schedule</h2>
                <span className="text-xs text-text-muted">Java Full-Stack B3 (Kothrud)</span>
              </div>

              {/* Adjustment Notice Banner */}
              <div className="p-3 rounded-control border border-border bg-surface-sunken flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-warning shrink-0" />
                  <span className="text-text">
                    Thursday lecture rescheduled to Friday 19:00 in Room 3 due to faculty leave.
                  </span>
                </div>
                <ReasonChip reason="Arjun on medical leave Thu" />
              </div>

              <div className="border border-border rounded-card bg-surface overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-surface-sunken border-b border-border text-text-muted">
                    <tr>
                      <th className="py-2.5 px-3 font-medium">Session topic</th>
                      <th className="py-2.5 px-3 font-medium">Day & Time (IST)</th>
                      <th className="py-2.5 px-3 font-medium">Room</th>
                      <th className="py-2.5 px-3 font-medium">Faculty</th>
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
                      <td className="py-3 px-3 font-medium text-text">
                        Spring Security & JWT Authentication
                      </td>
                      <td className="py-3 px-3 tabular-nums text-text">Fri, 17 Oct · 19:00 – 21:00</td>
                      <td className="py-3 px-3 text-text-muted">Room 3</td>
                      <td className="py-3 px-3 text-text">Arjun Mehta</td>
                      <td className="py-3 px-3 text-right">
                        <StatusPill status="scheduled" />
                      </td>
                    </tr>
                    <tr className="hover:bg-surface-sunken/40">
                      <td className="py-3 px-3 font-medium text-text">
                        Database Transactions & Concurrency
                      </td>
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

            {/* Recent Recordings Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-text">Recorded sessions & catch-up queue</h2>
                  <p className="text-[11px] text-text-muted">
                    Watch completed lectures to catch up on missed attendance and maintain placement eligibility
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="xs"
                  onClick={() => navigate('/recordings')}
                >
                  View all
                </Button>
              </div>

              <div className="border border-border rounded-card bg-surface overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-surface-sunken border-b border-border text-text-muted">
                    <tr>
                      <th className="py-2.5 px-3 font-medium">Lecture title</th>
                      <th className="py-2.5 px-3 font-medium">Date</th>
                      <th className="py-2.5 px-3 font-medium">Duration</th>
                      <th className="py-2.5 px-3 font-medium">Status</th>
                      <th className="py-2.5 px-3 text-right font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr className="hover:bg-surface-sunken/40">
                      <td className="py-3 px-3 font-medium text-text">
                        Core Java: Streams, Lambdas & Concurrency
                      </td>
                      <td className="py-3 px-3 text-text-muted">14 Oct 2026</td>
                      <td className="py-3 px-3 tabular-nums text-text-muted">1h 52m</td>
                      <td className="py-3 px-3">
                        <span className="text-danger font-medium flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Missed
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Button
                          variant="secondary"
                          size="xs"
                          onClick={() => navigate('/recordings')}
                          leftIcon={<Play className="w-3 h-3 text-accent" />}
                        >
                          Watch
                        </Button>
                      </td>
                    </tr>
                    <tr className="hover:bg-surface-sunken/40">
                      <td className="py-3 px-3 font-medium text-text">
                        Hibernate ORM & Entity Mapping
                      </td>
                      <td className="py-3 px-3 text-text-muted">12 Oct 2026</td>
                      <td className="py-3 px-3 tabular-nums text-text-muted">2h 05m</td>
                      <td className="py-3 px-3">
                        <span className="text-danger font-medium flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Missed
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Button
                          variant="secondary"
                          size="xs"
                          onClick={() => navigate('/recordings')}
                          leftIcon={<Play className="w-3 h-3 text-accent" />}
                        >
                          Watch
                        </Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Sidebar Column (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Attendance & Placement Alert */}
            <div className="p-4 rounded-card border border-warning/40 bg-surface space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-warning flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Placement eligibility at risk
                </span>
                <span className="tabular-nums font-semibold text-warning">44% / 80%</span>
              </div>
              <div className="w-full h-2 bg-surface-sunken rounded-full overflow-hidden">
                <div className="h-full bg-warning rounded-full" style={{ width: '44%' }} />
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                You have missed 3 classes last week. Complete catch-up recordings to lift attendance above 80% to remain eligible for placement drives.
              </p>
              <Button
                variant="secondary"
                size="xs"
                className="w-full"
                onClick={() => navigate('/recordings')}
              >
                Open catch-up queue
              </Button>
            </div>

            {/* Fee Instalments Card */}
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
                onClick={() => success('Opening UPI payment interface...')}
              >
                Pay instalment
              </Button>

              <div className="pt-2 border-t border-border space-y-2 text-xs">
                <div className="text-[11px] font-medium text-text-muted">Past instalment payments</div>
                <div className="flex items-center justify-between py-1 text-[11px]">
                  <span className="text-text">Instalment 1 (04 Aug 2026)</span>
                  <span className="text-success font-medium">₹6,500 Paid ✓</span>
                </div>
                <div className="flex items-center justify-between py-1 text-[11px]">
                  <span className="text-text">Instalment 2 (04 Sep 2026)</span>
                  <span className="text-success font-medium">₹6,500 Paid ✓</span>
                </div>
              </div>
            </div>

            {/* Course Certificate Milestone */}
            <div className="p-4 rounded-card border border-border bg-surface space-y-3 text-xs">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-text-muted" />
                <span className="font-medium text-text">Course diploma credential</span>
              </div>
              <p className="text-text-muted leading-relaxed text-[11px]">
                Java Full-Stack Developer credential unlocks upon completing remaining 60 syllabus hours and achieving 80% attendance.
              </p>
              <div className="p-2.5 rounded-control bg-surface-sunken border border-border text-[11px] text-text-muted font-mono">
                Status: In Progress · 180 / 240 hrs
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* =========================================================================
     1. TRAINER DASHBOARD VARIANT
     STRICT RULE: Never show fee amount, payment status, instalment, fee column or ₹ symbol
     ========================================================================= */
  if (role === 'trainer') {
    const trainerBatches = batches.filter((b) => b.trainerName.includes('Arjun'))
    const trainerSessions = timetableSessions.filter((s) => s.trainerName.includes('Arjun'))
    const trainerEnrolled = trainerBatches.reduce((acc, b) => acc + b.enrolledCount, 0)
    const trainerStudents = students.filter((s) =>
      trainerBatches.some((b) => s.batchNames.includes(b.name) || s.batchIds.includes(b.id))
    )
    const trainerAvgAtt =
      trainerStudents.length > 0
        ? (trainerStudents.reduce((acc, s) => acc + s.attendanceRate, 0) / trainerStudents.length).toFixed(1)
        : '84.2'
    const trainerCriticalStudents = trainerStudents.filter(
      (s) => s.riskLevel === 'critical' || s.riskLevel === 'high'
    )

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
          <div>
            <h1 className="text-xl font-semibold text-text">Good afternoon, Arjun</h1>
            <p className="text-xs text-text-muted mt-0.5">
              CodeCraft Academy · {branch === 'All' ? 'All Campuses' : `${branch} Campus`} · Thu, 16 Oct 2026
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/sessions/sess-m2')}
              leftIcon={<Play className="w-3.5 h-3.5" />}
            >
              Start today's session
            </Button>
          </div>
        </div>

        {/* Pending Student Admission Alert Banner for Head (Trainer) */}
        {pendingStudentRegistrations.length > 0 && (
          <div className="p-3.5 rounded-card bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-text">
                  {pendingStudentRegistrations.length === 1
                    ? '1 new student admission awaiting Head review'
                    : `${pendingStudentRegistrations.length} new student admissions awaiting Head review`}
                </span>
                <span className="text-text-muted text-[11px] block">
                  Verify and approve registration to grant student access to their portal.
                </span>
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/approvals')}
              className="shrink-0 text-xs"
            >
              Review admissions
            </Button>
          </div>
        )}

        {/* 4 Trainer KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Today's sessions"
            value={`${trainerSessions.length} classes`}
            delta={{ value: 'Room 3 & Lab A', isNeutral: true }}
            onClick={() => navigate('/timetable')}
          />
          <KpiCard
            label="My active batches"
            value={`${trainerBatches.length} cohorts`}
            delta={{ value: `${trainerEnrolled} total students`, isNeutral: true }}
            onClick={() => navigate('/batches')}
          />
          <KpiCard
            label="My attendance rate"
            value={`${trainerAvgAtt}%`}
            delta={{ value: '+2.4% vs last week', isPositive: true }}
            onClick={() => navigate('/attendance')}
          />
          <KpiCard
            label="Students needing attention"
            value={`${trainerCriticalStudents.length} students`}
            delta={{ value: `${trainerCriticalStudents.filter(s => s.riskLevel === 'critical').length} critical catch-ups`, isPositive: false }}
            onClick={() => navigate('/risk')}
          />
        </div>

        {/* Main Content: Today's Sessions + Students Needing Academic Attention */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Today's Schedule (8 cols) */}
          <div className="lg:col-span-8 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text">Today's sessions</h2>
              <span className="text-xs text-text-muted">16 Oct 2026 · IST</span>
            </div>

            <div className="border border-border rounded-card bg-surface overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-surface-sunken border-b border-border text-text-muted">
                  <tr>
                    <th className="py-2.5 px-3 font-medium">Batch</th>
                    <th className="py-2.5 px-3 font-medium">Time (IST)</th>
                    <th className="py-2.5 px-3 font-medium">Room</th>
                    <th className="py-2.5 px-3 font-medium">Status</th>
                    <th className="py-2.5 px-3 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr className="hover:bg-surface-sunken/40">
                    <td className="py-3 px-3 font-medium text-text">
                      Java Full-Stack B3 (Kothrud)
                      <div className="text-[11px] text-text-muted font-normal mt-0.5">
                        Topic: Spring Data JPA Repositories
                      </div>
                    </td>
                    <td className="py-3 px-3 tabular-nums text-text">19:00 - 21:00</td>
                    <td className="py-3 px-3">
                      <span className="text-text-muted">Room 3 · Hybrid</span>
                    </td>
                    <td className="py-3 px-3">
                      <StatusPill status="in_progress" />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Button
                        variant="primary"
                        size="xs"
                        onClick={() => navigate('/sessions/sess-m2')}
                        leftIcon={<Play className="w-3 h-3" />}
                      >
                        Start QR
                      </Button>
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-sunken/40">
                    <td className="py-3 px-3 font-medium text-text">
                      Spring Boot Doubt Lab
                      <div className="text-[11px] text-text-muted font-normal mt-0.5">
                        Topic: Docker containerization Q&A
                      </div>
                    </td>
                    <td className="py-3 px-3 tabular-nums text-text">17:00 - 18:30</td>
                    <td className="py-3 px-3">
                      <span className="text-text-muted">Online Room 1</span>
                    </td>
                    <td className="py-3 px-3">
                      <StatusPill status="scheduled" />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Button
                        variant="secondary"
                        size="xs"
                        onClick={() => success('Launching Zoom session...')}
                      >
                        Open room
                      </Button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Week at a Glance */}
            <div className="pt-3">
              <h3 className="text-xs font-semibold text-text mb-2">Week at a glance</h3>
              <div className="border border-border rounded-card bg-surface p-3">
                <div className="grid grid-cols-5 gap-2 text-center text-xs">
                  {['Mon 19 Oct', 'Tue 20 Oct', 'Wed 21 Oct', 'Thu 22 Oct', 'Fri 23 Oct'].map(
                    (d, i) => (
                      <div key={i} className="p-2 border border-border rounded bg-surface-sunken/50">
                        <div className="text-text-muted text-[11px] mb-1">{d}</div>
                        <div className="font-medium text-text">
                          {i === 3 ? (
                            <span className="text-danger flex items-center justify-center gap-1">
                              <AlertOctagon className="w-3 h-3" /> 2 classes (Clash)
                            </span>
                          ) : (
                            `${i === 1 ? '1 class' : '2 classes'}`
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Students Needing Academic Attention (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <h2 className="text-sm font-semibold text-text">Students needing attention</h2>
            <div className="border border-border rounded-card bg-surface divide-y divide-border">
              {criticalStudents.slice(0, 3).map((st) => (
                <div
                  key={st.id}
                  onClick={() => navigate(`/students/${st.id}`)}
                  className="p-3 hover:bg-surface-sunken/50 cursor-pointer space-y-1 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-xs text-text">{st.name}</span>
                    <span className="text-[11px] tabular-nums text-danger font-medium">
                      {st.attendanceRate}% attendance
                    </span>
                  </div>
                  <p className="text-[11px] text-text-muted">
                    Missed last 4 sessions · Needs Spring JPA catch-up
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* =========================================================================
     2. COUNSELOR DASHBOARD VARIANT
     ========================================================================= */
  if (role === 'counselor') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
          <div>
            <h1 className="text-xl font-semibold text-text">Good afternoon, Snehal</h1>
            <p className="text-xs text-text-muted mt-0.5">
              CodeCraft Academy · Student Success & Counseling · Thu, 16 Oct 2026
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/students?action=new')}
              leftIcon={<UserPlus className="w-3.5 h-3.5" />}
            >
              New admission
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Admissions this week"
            value="14"
            delta={{ value: 'Target: 18 (78%)', isPositive: true }}
            onClick={() => navigate('/students')}
          />
          <KpiCard
            label="Follow-ups due today"
            value="8 calls"
            delta={{ value: '3 high priority', isPositive: false }}
            onClick={() => navigate('/messages')}
          />
          <KpiCard
            label="Students at critical risk"
            value={`${criticalStudents.length} students`}
            delta={{
              value: criticalStudents.slice(0, 2).map((s) => s.name).join(', ') || 'None',
              isPositive: false,
            }}
            onClick={() => navigate('/risk')}
          />
          <KpiCard
            label="Total active students"
            value={students.length.toString()}
            delta={{ value: '+14 this month', isPositive: true }}
            onClick={() => navigate('/students')}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-3">
            <h2 className="text-sm font-semibold text-text">Attention list (Students)</h2>
            <div className="border border-border rounded-card bg-surface divide-y divide-border">
              {criticalStudents.slice(0, 4).map((s) => (
                <div key={s.id} className="p-3 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="text-xs font-medium text-text">
                      {s.name}: Attendance at {s.attendanceRate}% in {s.batchNames[0] || 'active cohort'}
                    </div>
                    <div className="text-[11px] text-text-muted">
                      {s.riskReasons[0] || 'Low attendance threshold breached; counseling check-in required'}
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="xs"
                    onClick={() => navigate(`/students/${s.id}`)}
                  >
                    Open profile
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-4 space-y-3">
            <h2 className="text-sm font-semibold text-text">Risk tier overview</h2>
            <div className="border border-border rounded-card bg-surface p-3 space-y-2">
              <div
                onClick={() => navigate('/risk?tier=critical')}
                className="p-2 border border-border rounded flex items-center justify-between cursor-pointer hover:bg-surface-sunken"
              >
                <span className="text-xs font-medium text-danger">Critical risk</span>
                <span className="text-xs tabular-nums font-medium text-danger">
                  {criticalStudents.length} students
                </span>
              </div>
              <div
                onClick={() => navigate('/risk?tier=high')}
                className="p-2 border border-border rounded flex items-center justify-between cursor-pointer hover:bg-surface-sunken"
              >
                <span className="text-xs font-medium text-warning">High risk</span>
                <span className="text-xs tabular-nums font-medium text-warning">
                  {highRiskStudents.length} students
                </span>
              </div>
              <div
                onClick={() => navigate('/risk?tier=watch')}
                className="p-2 border border-border rounded flex items-center justify-between cursor-pointer hover:bg-surface-sunken"
              >
                <span className="text-xs font-medium text-text">Watch list</span>
                <span className="text-xs tabular-nums font-medium text-text-muted">
                  {watchRiskStudents.length} students
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* =========================================================================
     3. ACCOUNTS DASHBOARD VARIANT
     ========================================================================= */
  if (role === 'accounts') {
    const ageing1to7 = overdueInstalments.filter((i) => i.daysOverdue >= 1 && i.daysOverdue <= 7)
    const ageing8to15 = overdueInstalments.filter((i) => i.daysOverdue >= 8 && i.daysOverdue <= 15)
    const ageing16to30 = overdueInstalments.filter((i) => i.daysOverdue >= 16 && i.daysOverdue <= 30)
    const ageing30plus = overdueInstalments.filter((i) => i.daysOverdue > 30)

    const sumAmount = (list: typeof overdueInstalments) =>
      list.reduce((acc, i) => acc + (i.amount - i.paidAmount), 0)

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
          <div>
            <h1 className="text-xl font-semibold text-text">Good afternoon, Sunita</h1>
            <p className="text-xs text-text-muted mt-0.5">
              CodeCraft Academy · Accounts & Collections · Thu, 16 Oct 2026
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/payments?action=record')}
              leftIcon={<CreditCard className="w-3.5 h-3.5" />}
            >
              Record payment
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Collected today"
            value={formatINR(96500)}
            delta={{ value: '14 transactions', isPositive: true }}
            onClick={() => navigate('/payments')}
          />
          <KpiCard
            label="Collected this month"
            value={formatINR(collectedThisMonth)}
            delta={{ value: 'Target: ₹5,00,000 (92.5%)', isPositive: true }}
            onClick={() => navigate('/fees')}
          />
          <KpiCard
            label="Overdue instalments"
            value={formatINR(overdueTotal)}
            delta={{ value: `${overdueInstalments.length} accounts overdue`, isPositive: false }}
            onClick={() => navigate('/fees')}
          />
          <KpiCard
            label="Reconciliation queue"
            value={`${unreconciledPayments.length} entries`}
            delta={{ value: 'Needs manual UTR review', isPositive: false }}
            onClick={() => navigate('/payments')}
          />
        </div>

        {/* Dues Ageing + Reconciliation Queue */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-3">
            <h2 className="text-sm font-semibold text-text">Instalment dues ageing</h2>
            <div className="border border-border rounded-card bg-surface p-4 space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-muted">1–7 days overdue</span>
                  <span className="tabular-nums font-medium text-text">
                    {formatINR(sumAmount(ageing1to7))} ({ageing1to7.length} accounts)
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-muted">8–15 days overdue</span>
                  <span className="tabular-nums font-medium text-warning">
                    {formatINR(sumAmount(ageing8to15))} ({ageing8to15.length} accounts)
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-muted">16–30 days overdue</span>
                  <span className="tabular-nums font-medium text-danger">
                    {formatINR(sumAmount(ageing16to30))} ({ageing16to30.length} accounts)
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-muted">&gt; 30 days overdue</span>
                  <span className="tabular-nums font-medium text-text-muted">
                    {formatINR(sumAmount(ageing30plus))} ({ageing30plus.length} accounts)
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text">Reconciliation queue</h2>
              <button
                onClick={() => navigate('/payments')}
                className="text-xs text-accent hover:underline"
              >
                View all
              </button>
            </div>
            <div className="border border-border rounded-card bg-surface divide-y divide-border">
              {payments.slice(0, 3).map((p) => (
                <div key={p.id} className="p-3 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-medium text-text">{p.studentName}</div>
                    <div className="text-[11px] text-text-muted font-mono">{p.receiptNo} · {p.method}</div>
                  </div>
                  <div className="text-right">
                    <div className="tabular-nums font-medium text-text">{formatINR(p.amount)}</div>
                    <span className="text-[10px] text-text-muted">16 Oct 2026</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* =========================================================================
     4. OWNER / ADMIN DASHBOARD (Canonical full operations view)
     Order strictly follows specifications:
     1. Header: "Good afternoon, <name>" with date and branch scope + 4 secondary buttons
     2. "Needs a decision": attention list (sum of rows equals header count)
     3. Four KPI cards: Collected, Overdue, Attendance, At risk
     4. Collections vs target line chart + Today's sessions table
     5. Risk tier counts as text + Attendance matrix on sequential accent scale
     6. Operational summary, collapsed by default (plain text: "3 or more", no LaTeX)
     ========================================================================= */
  const attentionItems: {
    id: string
    sentence: string
    actionLabel: string
    action: () => void
    severity: 'critical' | 'warning' | 'pending'
  }[] = []

  if (pendingApprovalsCount > 0) {
    attentionItems.push({
      id: 'att-1',
      sentence: `${
        pendingApprovalsCount === 1
          ? '1 approval waiting'
          : `${pendingApprovalsCount} approvals waiting`
      }: WhatsApp fee reminder notifications staged for review.`,
      actionLabel: 'Review approvals',
      action: () => navigate('/approvals'),
      severity: 'pending' as const,
    })
  }

  const conflictingSessions = timetableSessions.filter((s) => s.hasConflict)
  if (conflictingSessions.length > 0) {
    const clash = conflictingSessions[0]
    attentionItems.push({
      id: 'att-2',
      sentence: `${conflictingSessions.length} timetable conflict${conflictingSessions.length > 1 ? 's' : ''}: ${
        clash.trainerName
      } ${clash.conflictReason || 'scheduling conflict in ' + clash.room}.`,
      actionLabel: 'Resolve clash',
      action: () => navigate('/timetable'),
      severity: 'critical' as const,
    })
  }

  if (unreconciledPayments.length > 0) {
    attentionItems.push({
      id: 'att-3',
      sentence: `${unreconciledPayments.length} bank payments require UTR match verification against student records.`,
      actionLabel: 'Reconcile payments',
      action: () => navigate('/payments'),
      severity: 'warning' as const,
    })
  }

  if (criticalStudents.length > 0) {
    const names = criticalStudents
      .slice(0, 2)
      .map((s) => `${s.name} (${s.attendanceRate}% attendance)`)
      .join(' and ')
    attentionItems.push({
      id: 'att-4',
      sentence: `${criticalStudents.length} students at critical academic risk: ${names}.`,
      actionLabel: 'Open risk board',
      action: () => navigate('/risk'),
      severity: 'critical' as const,
    })
  }

  const totalDecisionCount = attentionItems.length
  const criticalCount = attentionItems.filter((i) => i.severity === 'critical').length
  const warningCount = attentionItems.filter((i) => i.severity === 'warning').length
  const pendingCount = attentionItems.filter((i) => i.severity === 'pending').length

  return (
    <div className="space-y-6">
      {/* 1. Header: Greeting, date & branch scope + 4 secondary quick actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border">
        <div>
          <h1 className="text-xl font-semibold text-text">
            Good afternoon, {currentUser.name}
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            CodeCraft Academy ·{' '}
            {branch === 'All' ? 'All Campuses (Kothrud & Baner)' : `${branch} Campus`} · Thu, 16
            Oct 2026
          </p>
        </div>

        {/* Four secondary buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/payments?action=record')}
          >
            Record payment
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/sessions/sess-m2')}
          >
            Mark attendance
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsNewBatchOpen(true)}
          >
            New batch
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/timetable?action=generate')}
          >
            Generate timetable
          </Button>
        </div>
      </div>

      {/* Pending Student Admission Alert Banner for Head (Owner / Admin) */}
      {pendingStudentRegistrations.length > 0 && (
        <div className="p-3.5 rounded-card bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-text">
                {pendingStudentRegistrations.length === 1
                  ? '1 new student admission awaiting Head review'
                  : `${pendingStudentRegistrations.length} new student admissions awaiting Head review`}
              </span>
              <span className="text-text-muted text-[11px] block">
                Verify and approve registration to grant student access to their portal.
              </span>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/approvals')}
            className="shrink-0 text-xs"
          >
            Review admissions
          </Button>
        </div>
      )}

      {/* 2. Needs a decision: attention list */}
      <div className="border border-border rounded-card bg-surface overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-surface-sunken/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-semibold text-text uppercase tracking-wider">
              Needs a decision
            </h2>
            <span className="text-[11px] tabular-nums font-medium px-2 py-0.5 rounded-full border border-border bg-surface text-text">
              {totalDecisionCount} items
            </span>
          </div>
          <span className="text-[11px] text-text-muted">
            {criticalCount} critical · {warningCount} warning · {pendingCount} review
          </span>
        </div>

        <div className="divide-y divide-border">
          {attentionItems.map((item) => (
            <div
              key={item.id}
              className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-surface-sunken/30 transition-colors"
            >
              <div className="flex items-start sm:items-center gap-2.5 text-xs text-text">
                {item.severity === 'critical' ? (
                  <span className="inline-flex items-center gap-1 text-danger font-medium shrink-0">
                    <AlertOctagon className="w-3.5 h-3.5 shrink-0" />
                    Critical
                  </span>
                ) : item.severity === 'warning' ? (
                  <span className="inline-flex items-center gap-1 text-warning font-medium shrink-0">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    Warning
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-text-muted font-medium shrink-0">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    Pending
                  </span>
                )}
                <span className="text-text leading-snug">{item.sentence}</span>
              </div>
              <Button
                variant="secondary"
                size="xs"
                onClick={item.action}
                className="shrink-0 self-start sm:self-auto"
              >
                {item.actionLabel}
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Four KPI cards: Sans tabular numbers, text trends, zero sparklines */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Collected this month"
          value={formatINR(collectedThisMonth)}
          delta={{ value: 'Target: ₹5,00,000 (92.5%) · +12.4% vs last month', isPositive: true }}
          onClick={() => navigate('/fees')}
        />
        <KpiCard
          label={`Overdue instalments (${overdueInstalments.length} accounts)`}
          value={formatINR(overdueTotal)}
          delta={{ value: `${overdueInstalments.length} accounts overdue`, isPositive: false }}
          onClick={() => navigate('/fees')}
        />
        <KpiCard
          label="Attendance last 7 days"
          value={`${avgAttendance}%`}
          delta={{ value: '+1.8% vs last week', isPositive: true }}
          onClick={() => navigate('/attendance')}
        />
        <KpiCard
          label="Students at risk (by tier)"
          value={totalAtRiskCount.toString()}
          delta={{
            value: `${criticalStudents.length} critical · ${highRiskStudents.length} high · ${watchRiskStudents.length} watch`,
            isPositive: false,
          }}
          onClick={() => navigate('/risk')}
        />
      </div>

      {/* 4. Collections against target (7 days) + Today's sessions table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Collections Chart (8 cols) */}
        <div className="lg:col-span-8 border border-border rounded-card bg-surface p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-xs font-semibold text-text">
                  Collections against target (7 days)
                </h3>
                <p className="text-[11px] text-text-muted">
                  Daily net inflows across UPI and NetBanking
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="xs"
                  onClick={() => setShowChartAsTable(!showChartAsTable)}
                  leftIcon={showChartAsTable ? <LineChartIcon className="w-3.5 h-3.5" /> : <TableIcon className="w-3.5 h-3.5" />}
                >
                  {showChartAsTable ? 'View as chart' : 'View as table'}
                </Button>
              </div>
            </div>

            <div className="mt-4 h-60 w-full">
              {showChartAsTable ? (
                <div className="overflow-x-auto h-full">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-surface-sunken text-text-muted border-b border-border">
                      <tr>
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3 text-right">Collected (₹)</th>
                        <th className="py-2 px-3 text-right">Target (₹)</th>
                        <th className="py-2 px-3 text-right">Variance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {collectionData.map((row, idx) => {
                        const variance = row.amount - row.target
                        return (
                          <tr key={idx} className="hover:bg-surface-sunken/40">
                            <td className="py-2 px-3 font-medium text-text">{row.day}</td>
                            <td className="py-2 px-3 text-right tabular-nums text-text">
                              {formatINR(row.amount)}
                            </td>
                            <td className="py-2 px-3 text-right tabular-nums text-text-muted">
                              {formatINR(row.target)}
                            </td>
                            <td
                              className={`py-2 px-3 text-right tabular-nums font-medium ${
                                variance >= 0 ? 'text-success' : 'text-danger'
                              }`}
                            >
                              {variance >= 0 ? `+${formatINR(variance)}` : `-${formatINR(Math.abs(variance))}`}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={collectionData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="#DDBF9F" strokeOpacity={0.6} vertical={false} />
                    <XAxis
                      dataKey="day"
                      stroke="#5C4636"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#DDBF9F' }}
                    />
                    <YAxis
                      stroke="#5C4636"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `₹${val / 1000}k`}
                    />
                    <Tooltip
                      formatter={(val: any, name: any) => [
                        formatINR(Number(val)),
                        name === 'amount' ? 'Collected' : 'Target',
                      ]}
                      contentStyle={{
                        backgroundColor: '#F6E3D1',
                        borderColor: '#D6B48A',
                        borderRadius: '6px',
                        fontSize: '12px',
                        color: '#1E140E',
                      }}
                    />
                    {/* Target line: dashed champagne-gold #B9926A */}
                    <Line
                      type="monotone"
                      dataKey="target"
                      stroke="#B9926A"
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      dot={false}
                    />
                    {/* Main line: espresso #4A3528 */}
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="#4A3528"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#4A3528' }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-border mt-2 text-[11px] text-text-muted flex items-center justify-between">
            <span>Source: Bank reconciliation ledger (HDFC Current Account)</span>
            <span>Target line: Daily run-rate</span>
          </div>
        </div>

        {/* Today's sessions as a table (4 cols) */}
        <div className="lg:col-span-4 border border-border rounded-card bg-surface p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-xs font-semibold text-text">Today's sessions</h3>
              <button
                onClick={() => navigate('/timetable')}
                className="text-xs text-accent hover:underline"
              >
                View all
              </button>
            </div>

            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] text-text-muted border-b border-border bg-surface-sunken/40">
                  <tr>
                    <th className="py-2 px-2 font-medium">Batch</th>
                    <th className="py-2 px-2 font-medium">Time</th>
                    <th className="py-2 px-2 font-medium">Room</th>
                    <th className="py-2 px-2 font-medium text-right">Strength</th>
                    <th className="py-2 px-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {store.timetableSessions.slice(0, 4).map((sess) => {
                    const sessStrength = store.getBatchStrength(sess.batchId)
                    return (
                      <tr
                        key={sess.id}
                        onClick={() => navigate(`/sessions/${sess.id}`)}
                        className="hover:bg-surface-sunken/50 cursor-pointer transition-colors"
                      >
                        <td className="py-2.5 px-2">
                          <div className="font-medium text-text truncate max-w-[140px]">
                            {sess.batchName}
                          </div>
                          <div className="text-[11px] text-text-muted truncate">
                            {sess.trainerName}
                          </div>
                        </td>
                        <td className="py-2.5 px-2 tabular-nums text-text font-normal whitespace-nowrap">
                          {sess.startTime}
                        </td>
                        <td className="py-2.5 px-2 text-text-muted whitespace-nowrap">
                          {sess.room}
                        </td>
                        <td className="py-2.5 px-2 text-right tabular-nums whitespace-nowrap">
                          <div className="font-medium text-text">
                            {sessStrength.enrolled} / {sessStrength.capacity}
                          </div>
                          <div className="text-[10px] text-text-muted font-mono">
                            {sessStrength.inRoom} in-room · {sessStrength.online} online
                          </div>
                        </td>
                        <td className="py-2.5 px-2 whitespace-nowrap">
                          {sess.hasConflict ? (
                            <span className="inline-flex items-center gap-1 text-danger font-medium text-[11px]">
                              <AlertOctagon className="w-3 h-3" />
                              Clash
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-text-muted text-[11px]">
                              <CheckCircle2 className="w-3 h-3 text-success" />
                              OK
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-text-muted">
            Click any session row to inspect live check-in roster.
          </div>
        </div>
      </div>

      {/* 5. Risk tier counts as text + Attendance matrix on sequential accent scale */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Risk tier counts as text (6 cols) */}
        <div className="lg:col-span-6 border border-border rounded-card bg-surface p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h3 className="text-xs font-semibold text-text">Students at risk by tier</h3>
            <button
              onClick={() => navigate('/risk')}
              className="text-xs text-accent hover:underline"
            >
              Open risk board
            </button>
          </div>

          {/* Ordered Critical, High, Watch, Low. Critical visually strongest. None selected by default */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div
              onClick={() => navigate('/risk?tier=critical')}
              className="p-3 rounded-card border border-border-strong bg-surface hover:bg-surface-sunken cursor-pointer transition-colors"
            >
              <div className="text-xl font-medium tabular-nums text-danger">
                {criticalStudents.length}
              </div>
              <div className="text-[11px] font-medium text-danger mt-0.5">Critical</div>
            </div>

            <div
              onClick={() => navigate('/risk?tier=high')}
              className="p-3 rounded-card border border-border bg-surface hover:bg-surface-sunken cursor-pointer transition-colors"
            >
              <div className="text-xl font-medium tabular-nums text-warning">
                {highRiskStudents.length}
              </div>
              <div className="text-[11px] font-medium text-warning mt-0.5">High</div>
            </div>

            <div
              onClick={() => navigate('/risk?tier=watch')}
              className="p-3 rounded-card border border-border bg-surface hover:bg-surface-sunken cursor-pointer transition-colors"
            >
              <div className="text-xl font-medium tabular-nums text-text">
                {watchRiskStudents.length}
              </div>
              <div className="text-[11px] font-medium text-text-muted mt-0.5">Watch</div>
            </div>

            <div
              onClick={() => navigate('/risk?tier=low')}
              className="p-3 rounded-card border border-border bg-surface hover:bg-surface-sunken cursor-pointer transition-colors"
            >
              <div className="text-xl font-medium tabular-nums text-text-muted">
                {lowRiskStudents.length}
              </div>
              <div className="text-[11px] font-medium text-text-muted mt-0.5">Low</div>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-text-muted leading-relaxed">
            Primary risk drivers: consecutive absences (&gt; 3 sessions), overdue instalment dates (&gt; 10 days), and assignment backlog.
          </div>
        </div>

        {/* Attendance matrix on one sequential accent scale (6 cols) */}
        <div className="lg:col-span-6 border border-border rounded-card bg-surface p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h3 className="text-xs font-semibold text-text">Attendance matrix (batch × weekday)</h3>
            <button
              onClick={() => navigate('/attendance')}
              className="text-xs text-accent hover:underline"
            >
              Detailed ledger
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[11px] text-text-muted border-b border-border">
                <tr>
                  <th className="py-1.5 px-2 font-medium">Batch</th>
                  <th className="py-1.5 px-2 text-center font-medium">Mon</th>
                  <th className="py-1.5 px-2 text-center font-medium">Tue</th>
                  <th className="py-1.5 px-2 text-center font-medium">Wed</th>
                  <th className="py-1.5 px-2 text-center font-medium">Thu</th>
                  <th className="py-1.5 px-2 text-center font-medium">Fri</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {attendanceHeatmapData.map((row, idx) => (
                  <tr key={idx}>
                    <td className="py-2 px-2 font-medium text-text truncate max-w-[150px]">
                      {row.batch}
                    </td>
                    {[row.mon, row.tue, row.wed, row.thu, row.fri].map((pct, pIdx) => (
                      <td key={pIdx} className="py-1 px-1.5 text-center">
                        <span
                          className={`inline-block w-10 py-1 rounded text-center tabular-nums text-[11px] ${getSequentialAccentClass(
                            pct
                          )}`}
                        >
                          {pct}%
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Sequential Accent Scale Legend */}
          <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-text-muted">
            <span>Sequential scale:</span>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-[#F6E3D1] border border-[#DDBF9F]" /> &lt;80%
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-[#E2C6A7]" /> 80–84%
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-[#C9A57F]" /> 85–89%
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-[#9A7655]" /> 90–94%
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-[#6E5040]" /> ≥95%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Operational summary, generated 08:30 IST — Collapsed by default */}
      <div className="border border-border rounded-card bg-surface overflow-hidden">
        <button
          onClick={() => setIsSummaryOpen(!isSummaryOpen)}
          className="w-full px-4 py-3 bg-surface-sunken/40 flex items-center justify-between text-left hover:bg-surface-sunken transition-colors"
        >
          <div className="flex items-center gap-2">
            {isSummaryOpen ? (
              <ChevronDown className="w-4 h-4 text-text-muted" />
            ) : (
              <ChevronRight className="w-4 h-4 text-text-muted" />
            )}
            <span className="text-xs font-semibold text-text">
              Operational summary, generated 08:30 IST
            </span>
          </div>
          <span className="text-[11px] text-text-muted">
            {isSummaryOpen ? 'Click to collapse' : 'Click to expand'}
          </span>
        </button>

        {isSummaryOpen && (
          <div className="p-4 border-t border-border space-y-2.5 text-xs text-text leading-relaxed">
            <div className="flex items-start gap-2">
              <span className="text-text-muted">•</span>
              <div>
                <strong>Timetable conflict:</strong> Arjun Mehta has two overlapping sessions
                scheduled for Thursday 19:00 in Kothrud (Java Full-Stack B3 (Kothrud) in Room 3 &
                Spring Doubt Clearing in Room 1).{' '}
                <button
                  onClick={() => navigate('/timetable')}
                  className="text-accent font-medium hover:underline inline-flex items-center gap-0.5 ml-1"
                >
                  Resolve in timetable <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-text-muted">•</span>
              <div>
                <strong>Fee dues & risk:</strong> 5 students in Java Full-Stack B3 (Kothrud) have
                missed 3 or more classes with EMIs due this week, totaling <strong>₹32,500</strong>.{' '}
                <button
                  onClick={() => navigate('/approvals')}
                  className="text-accent font-medium hover:underline inline-flex items-center gap-0.5 ml-1"
                >
                  Review approval queue <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-text-muted">•</span>
              <div>
                <strong>Room capacity:</strong> Java Full-Stack B3 (Kothrud) has 32 registered
                students in Room 3 (capacity 30). Recommend shifting to Room 4 or capping offline
                seats.{' '}
                <button
                  onClick={() => navigate('/batches/batch-java-b3')}
                  className="text-accent font-medium hover:underline inline-flex items-center gap-0.5 ml-1"
                >
                  Inspect batch capacity <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-text-muted">•</span>
              <div>
                <strong>Bank reconciliation:</strong> 1 UPI transfer of ₹6,500 requires student name
                verification (sender: K. Balakrishnan Nair).{' '}
                <button
                  onClick={() => navigate('/payments')}
                  className="text-accent font-medium hover:underline inline-flex items-center gap-0.5 ml-1"
                >
                  Reconcile in payments ledger <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <NewBatchModal
        isOpen={isNewBatchOpen}
        onClose={() => setIsNewBatchOpen(false)}
      />
    </div>
  )
}
