import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles,
  Search,
  CheckCheck,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldAlert,
  Play,
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  CreditCard,
  Building2,
  ChevronRight,
  CheckCircle2,
  AlertOctagon,
} from 'lucide-react'
import { KpiCard } from '@/components/app/KpiCard'
import { ReasonChip } from '@/components/ui/ReasonChip'
import { StatusPill } from '@/components/ui/StatusPill'
import { Button } from '@/components/ui/Button'
import { useApp } from '@/context/AppContext'
import { useToast } from '@/context/ToastContext'
import { store } from '@/mocks/store'
import { formatINR } from '@/lib/utils'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

export const DashboardView: React.FC = () => {
  const { role, currentUser, branch, setCopilotOpen } = useApp()
  const { success } = useToast()
  const navigate = useNavigate()

  const pendingApprovalsCount = store.approvals.filter((a) => a.status === 'pending').length
  const criticalStudents = store.students.filter((s) => s.riskLevel === 'critical')

  // Sample collection trend data
  const collectionData = [
    { day: '10 Oct', amount: 45000, target: 40000 },
    { day: '11 Oct', amount: 52000, target: 40000 },
    { day: '12 Oct', amount: 38000, target: 40000 },
    { day: '13 Oct', amount: 64000, target: 45000 },
    { day: '14 Oct', amount: 78000, target: 45000 },
    { day: '15 Oct', amount: 89000, target: 50000 },
    { day: '16 Oct', amount: 96500, target: 50000 },
  ]

  // Attendance batch x day matrix
  const attendanceHeatmapData = [
    { batch: 'Java B3 (Kothrud)', mon: 88, tue: 82, wed: 78, thu: 85, fri: 79 },
    { batch: 'Java B4 (Baner)', mon: 94, tue: 92, wed: 96, thu: 91, fri: 93 },
    { batch: 'Python B1 (Baner)', mon: 89, tue: 86, wed: 91, thu: 88, fri: 90 },
    { batch: 'Analytics B2 (Kothrud)', mon: 96, tue: 94, wed: 98, thu: 95, fri: 97 },
    { batch: 'React B1 (Online)', mon: 91, tue: 89, wed: 90, thu: 92, fri: 91 },
  ]

  // Suggested question chips
  const suggestedQuestions = [
    'Which students in Java batch have missed ≥3 classes and owe EMI?',
    'Show room capacity clashes for next week',
    'Who is Arjun Mehta substituting for on Thursday?',
    'Collections this week vs target in Kothrud branch',
  ]

  /* =========================================================================
     TRAINER DASHBOARD VARIANT (Strictly NO fee / money UI)
     ========================================================================= */
  if (role === 'trainer') {
    return (
      <div className="space-y-6 animate-fade-in select-none">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
          <div>
            <h1 className="text-xl font-bold text-fg">Welcome back, Arjun</h1>
            <p className="text-xs text-fg-muted mt-0.5">
              Trainer Portal · Java Full-Stack & Spring Boot Faculty
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/sessions/sess-m2')}
              leftIcon={<Play className="w-3.5 h-3.5" />}
            >
              Start Today's Session
            </Button>
          </div>
        </div>

        {/* Trainer KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            label="My Batches"
            value="3 active"
            delta={{ value: '112 students', isNeutral: true }}
            sparklineData={[3, 3, 3, 3, 3, 3]}
            onClick={() => navigate('/batches')}
          />
          <KpiCard
            label="Today's Sessions"
            value="2 classes"
            delta={{ value: 'Room 3 & Lab A', isNeutral: true }}
            sparklineData={[1, 2, 2, 2, 1, 2]}
            onClick={() => navigate('/timetable')}
          />
          <KpiCard
            label="Avg Batch Attendance"
            value="84.2%"
            delta={{ value: '+2.4% vs last wk', isPositive: true }}
            sparklineData={[78, 80, 81, 82, 83, 84]}
            sparklineColor="var(--success)"
            onClick={() => navigate('/attendance')}
          />
          <KpiCard
            label="Students Needing Catch-up"
            value="4 students"
            delta={{ value: '2 critical', isPositive: false }}
            sparklineData={[2, 3, 3, 4, 4, 4]}
            sparklineColor="var(--danger)"
            onClick={() => navigate('/risk')}
          />
        </div>

        {/* Schedule & Attention */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Today's Schedule (8 cols) */}
          <div className="lg:col-span-8 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-fg">Today's Class Schedule</h3>
              <span className="text-xs font-mono text-fg-muted">IST · Thu, 16 Oct</span>
            </div>

            <div className="space-y-2.5">
              <div className="p-4 rounded-card border border-primary/30 bg-primary/5 flex items-center justify-between gap-4 shadow-sm">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-primary font-mono">19:00 - 21:00</span>
                    <span className="text-xs font-semibold text-fg">Java Full-Stack B3 (Kothrud)</span>
                    <ReasonChip reason="Room 3 · Hybrid" variant="neutral" />
                  </div>
                  <p className="text-xs text-fg-muted">
                    Topic: Spring Data JPA Repositories & Transaction Management
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/sessions/sess-m2')}
                  leftIcon={<Play className="w-3.5 h-3.5" />}
                >
                  Start QR Check-in
                </Button>
              </div>

              <div className="p-4 rounded-card border border-border bg-surface flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-fg-muted">17:00 - 18:30</span>
                    <span className="text-xs font-semibold text-fg">Spring Boot Doubt Lab</span>
                    <ReasonChip reason="Virtual Room 1 · Online" variant="info" />
                  </div>
                  <p className="text-xs text-fg-muted">
                    Topic: Q&A on Docker containerization of Spring microservices
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => success('Launching Zoom session...')}>
                  Open Room
                </Button>
              </div>
            </div>
          </div>

          {/* Students Needing Help (4 cols - Strictly Academic) */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-sm font-semibold text-fg">Students Needing Help</h3>
            <div className="space-y-2">
              {criticalStudents.slice(0, 3).map((st) => (
                <div
                  key={st.id}
                  onClick={() => navigate(`/students/${st.id}`)}
                  className="p-3 rounded-card border border-danger/30 bg-danger/5 hover:bg-danger/10 transition-colors cursor-pointer space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-fg">{st.name}</span>
                    <span className="text-[10px] text-danger font-mono font-bold">
                      {st.attendanceRate}% Attd
                    </span>
                  </div>
                  <p className="text-[11px] text-fg-muted">
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
     OWNER / ADMIN / GENERAL DASHBOARD
     ========================================================================= */
  return (
    <div className="space-y-6 animate-fade-in select-none">
      {/* Top Greeting & Branch Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-fg">
            Good afternoon, {currentUser.name}
          </h1>
          <p className="text-xs text-fg-muted mt-0.5">
            CodeCraft Academy · {branch === 'All' ? 'All Campuses (Kothrud & Baner)' : `${branch} Campus`} · Thu, 16 Oct 2026
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ai"
            size="sm"
            onClick={() => setCopilotOpen(true)}
            leftIcon={<Sparkles className="w-3.5 h-3.5" />}
          >
            Ask Copilot anything (⌘J)
          </Button>
        </div>
      </div>

      {/* Full-width "Ask anything about your institute…" Bar */}
      <div className="rounded-card border border-ai/30 bg-surface shadow-sm p-3.5 space-y-2.5">
        <div
          onClick={() => setCopilotOpen(true)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-btn bg-surface-2 border border-border cursor-pointer hover:border-ai/50 transition-colors"
        >
          <Sparkles className="w-4 h-4 text-ai shrink-0" />
          <span className="text-xs text-fg-muted flex-1">
            Ask anything about attendance, fee dues, room conflicts, or simulate timetable re-plans…
          </span>
          <kbd className="font-mono text-[10px] bg-surface border border-border px-1.5 py-0.5 rounded text-fg-muted">
            ⌘J
          </kbd>
        </div>

        {/* Suggested Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] text-fg-muted font-medium shrink-0">Try asking:</span>
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => setCopilotOpen(true)}
              className="px-2.5 py-1 rounded-full border border-ai/20 bg-ai/5 text-ai hover:bg-ai/10 transition-colors text-[11px] font-medium shrink-0 whitespace-nowrap"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Row 1: Morning Brief (8 cols) + Attention Queue (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Morning Brief Card */}
        <div className="lg:col-span-8 rounded-card border border-ai/25 bg-surface p-4 space-y-3.5 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-ai/10 text-ai border border-ai/20">
                <Sparkles className="w-3 h-3" />
                AI Morning Brief
              </span>
              <span className="text-xs font-semibold text-fg">Daily Operational Synthesis</span>
            </div>
            <span className="text-[11px] font-mono text-fg-muted">Synthesized 08:30 IST</span>
          </div>

          <div className="space-y-3 text-xs leading-relaxed text-fg">
            <div className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-ai shrink-0 mt-1.5" />
              <div className="flex-1">
                <span>
                  <strong>Timetable Conflict:</strong> Arjun Mehta has two overlapping sessions scheduled for Thursday 19:00 in Kothrud (Java B3 in Room 3 & Doubt Clearing in Room 1).
                </span>
                <div className="mt-1 flex items-center gap-2 text-[11px]">
                  <button
                    onClick={() => navigate('/timetable')}
                    className="text-ai font-medium hover:underline flex items-center gap-0.5"
                  >
                    Resolve clash in Timetable <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-ai shrink-0 mt-1.5" />
              <div className="flex-1">
                <span>
                  <strong>Fee Dues & High Risk:</strong> 5 Java Full-Stack students have missed $\ge 3$ classes with EMIs due this week, totaling <strong>₹32,500</strong>.
                </span>
                <div className="mt-1 flex items-center gap-2 text-[11px]">
                  <button
                    onClick={() => navigate('/approvals')}
                    className="text-ai font-medium hover:underline flex items-center gap-0.5"
                  >
                    Review staged WhatsApp reminder action <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-ai shrink-0 mt-1.5" />
              <div className="flex-1">
                <span>
                  <strong>Over-capacity Room:</strong> Java B3 has 32 registered students in Room 3 (capacity 30). Recommend shifting to Room 4 or capping offline seats.
                </span>
                <div className="mt-1 flex items-center gap-2 text-[11px]">
                  <button
                    onClick={() => navigate('/batches/batch-java-b3')}
                    className="text-ai font-medium hover:underline flex items-center gap-0.5"
                  >
                    Inspect Batch Capacity <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-ai shrink-0 mt-1.5" />
              <div className="flex-1">
                <span>
                  <strong>Bank Reconciliation:</strong> 1 UPI transfer of ₹6,500 requires student name verification (sender: K. Balakrishnan Nair).
                </span>
                <div className="mt-1 flex items-center gap-2 text-[11px]">
                  <button
                    onClick={() => navigate('/payments')}
                    className="text-ai font-medium hover:underline flex items-center gap-0.5"
                  >
                    Match payment in Reconciliation Board <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Attention Queue (4 cols) */}
        <div className="lg:col-span-4 rounded-card border border-border bg-surface p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h3 className="text-xs font-semibold text-fg uppercase tracking-wider font-mono">
              Attention Queue
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-danger/10 text-danger border border-danger/30 font-bold">
              4 critical items
            </span>
          </div>

          <div className="space-y-2">
            <div
              onClick={() => navigate('/approvals')}
              className="p-2.5 rounded-btn border border-warning/30 bg-warning/5 hover:bg-warning/10 cursor-pointer transition-colors space-y-1"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-fg flex items-center gap-1.5">
                  <CheckCheck className="w-3.5 h-3.5 text-warning" />
                  {pendingApprovalsCount} Approvals Waiting
                </span>
                <span className="text-[10px] font-mono text-warning font-semibold">Staged</span>
              </div>
              <p className="text-[11px] text-fg-muted">WhatsApp reminders, timetable re-plans</p>
            </div>

            <div
              onClick={() => navigate('/timetable')}
              className="p-2.5 rounded-btn border border-danger/30 bg-danger/5 hover:bg-danger/10 cursor-pointer transition-colors space-y-1"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-fg flex items-center gap-1.5">
                  <AlertOctagon className="w-3.5 h-3.5 text-danger" />
                  Arjun double-booked Thu 7 pm
                </span>
                <span className="text-[10px] font-mono text-danger font-semibold">Conflict</span>
              </div>
              <p className="text-[11px] text-fg-muted">Room 3 and Room 1 double assignment</p>
            </div>

            <div
              onClick={() => navigate('/payments')}
              className="p-2.5 rounded-btn border border-border bg-surface-2 hover:bg-surface-2/80 cursor-pointer transition-colors space-y-1"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-fg flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-primary" />
                  9 Payments Need Review
                </span>
                <span className="text-[10px] font-mono text-fg-muted font-semibold">UTR Match</span>
              </div>
              <p className="text-[11px] text-fg-muted">Bank NEFT/UPI auto-confidence &lt; 90%</p>
            </div>

            <div
              onClick={() => navigate('/risk')}
              className="p-2.5 rounded-btn border border-danger/30 bg-danger/5 hover:bg-danger/10 cursor-pointer transition-colors space-y-1"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-fg flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-danger" />
                  2 Students at Critical Risk
                </span>
                <span className="text-[10px] font-mono text-danger font-semibold">Immediate</span>
              </div>
              <p className="text-[11px] text-fg-muted">Priya Nair (44% attd), Rohan Kulkarni</p>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: 6 KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <KpiCard
          label="Active Students"
          value="320"
          delta={{ value: '+14 this mo', isPositive: true }}
          sparklineData={[280, 290, 298, 305, 312, 320]}
          onClick={() => navigate('/students')}
        />
        <KpiCard
          label="Today's Sessions"
          value="6 classes"
          delta={{ value: '4 offline, 2 online', isNeutral: true }}
          sparklineData={[4, 5, 6, 6, 7, 6]}
          onClick={() => navigate('/timetable')}
        />
        <KpiCard
          label="Attendance (7d)"
          value="89.4%"
          delta={{ value: '+1.8% vs last wk', isPositive: true }}
          sparklineData={[84, 85, 87, 86, 88, 89.4]}
          sparklineColor="var(--success)"
          onClick={() => navigate('/attendance')}
        />
        <KpiCard
          label="Collected MTD"
          value={formatINR(462500)}
          delta={{ value: '92% of target', isPositive: true }}
          sparklineData={[120000, 240000, 310000, 390000, 462500]}
          sparklineColor="var(--primary)"
          onClick={() => navigate('/fees')}
        />
        <KpiCard
          label="Overdue EMIs"
          value={formatINR(45500)}
          delta={{ value: '7 students overdue', isPositive: false }}
          sparklineData={[24000, 32000, 38000, 41000, 45500]}
          sparklineColor="var(--danger)"
          onClick={() => navigate('/fees')}
        />
        <KpiCard
          label="At-Risk Students"
          value="12"
          delta={{ value: '2 critical, 4 high', isPositive: false }}
          sparklineData={[8, 9, 10, 11, 12]}
          sparklineColor="var(--warning)"
          onClick={() => navigate('/risk')}
        />
      </div>

      {/* Row 3: Collections Trend Line (8 cols) + Today's Sessions List (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Collections Chart */}
        <div className="lg:col-span-8 rounded-card border border-border bg-surface p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div>
              <h3 className="text-xs font-semibold text-fg">Collections Trend vs Target (7 Days)</h3>
              <p className="text-[11px] text-fg-muted">Daily cash inflow across UPI and NetBanking</p>
            </div>
            <span className="text-xs font-mono font-bold text-fg">MTD Total: {formatINR(462500)}</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={collectionData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="var(--text-muted)"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `₹${val / 1000}k`}
                />
                <Tooltip
                  formatter={(val: any) => [formatINR(Number(val)), 'Amount']}
                  contentStyle={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: 'var(--text)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorAmount)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Today's Sessions List */}
        <div className="lg:col-span-4 rounded-card border border-border bg-surface p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h3 className="text-xs font-semibold text-fg">Today's Sessions</h3>
            <span className="text-xs text-primary font-medium hover:underline cursor-pointer" onClick={() => navigate('/timetable')}>
              View all
            </span>
          </div>

          <div className="space-y-2.5">
            {store.timetableSessions.slice(0, 4).map((sess) => (
              <div
                key={sess.id}
                onClick={() => navigate(`/sessions/${sess.id}`)}
                className="p-2.5 rounded-btn border border-border bg-surface-2 hover:border-primary/40 transition-colors cursor-pointer space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-fg truncate">{sess.batchName}</span>
                  <span className="text-[11px] font-mono text-primary font-bold">
                    {sess.startTime}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-fg-muted">
                  <span>{sess.trainerName}</span>
                  <ReasonChip reason={sess.room} variant={sess.hasConflict ? 'danger' : 'neutral'} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 4: Risk Distribution Bar (6 cols) + Attendance Heatmap (6 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Risk Distribution */}
        <div className="lg:col-span-6 rounded-card border border-border bg-surface p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h3 className="text-xs font-semibold text-fg">Student Risk Tier Distribution</h3>
            <span className="text-xs text-primary font-medium hover:underline cursor-pointer" onClick={() => navigate('/risk')}>
              View board
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="p-3 rounded-btn bg-danger/10 border border-danger/30">
              <div className="text-lg font-bold font-mono text-danger">2</div>
              <div className="text-[10px] uppercase font-semibold text-danger">Critical</div>
            </div>
            <div className="p-3 rounded-btn bg-amber-500/10 border border-amber-500/30">
              <div className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400">4</div>
              <div className="text-[10px] uppercase font-semibold text-amber-600 dark:text-amber-400">High</div>
            </div>
            <div className="p-3 rounded-btn bg-warning/10 border border-warning/30">
              <div className="text-lg font-bold font-mono text-warning">6</div>
              <div className="text-[10px] uppercase font-semibold text-warning">Watch</div>
            </div>
            <div className="p-3 rounded-btn bg-surface-2 border border-border">
              <div className="text-lg font-bold font-mono text-fg-muted">308</div>
              <div className="text-[10px] uppercase font-semibold text-fg-muted">Low</div>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-fg-muted">
            Top primary causes: <strong>1.</strong> Consecutive unexcused absences (48%), <strong>2.</strong> Late EMI instalment payments (32%), <strong>3.</strong> Assignment backlogs (20%).
          </div>
        </div>

        {/* Attendance Heatmap batch x day */}
        <div className="lg:col-span-6 rounded-card border border-border bg-surface p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h3 className="text-xs font-semibold text-fg">Attendance Heatmap (Batch × Day)</h3>
            <span className="text-xs text-primary font-medium hover:underline cursor-pointer" onClick={() => navigate('/attendance')}>
              Detailed matrix
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[11px] text-fg-muted border-b border-border">
                <tr>
                  <th className="py-1.5 px-2">Batch</th>
                  <th className="py-1.5 px-2 text-center">Mon</th>
                  <th className="py-1.5 px-2 text-center">Tue</th>
                  <th className="py-1.5 px-2 text-center">Wed</th>
                  <th className="py-1.5 px-2 text-center">Thu</th>
                  <th className="py-1.5 px-2 text-center">Fri</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {attendanceHeatmapData.map((row, idx) => (
                  <tr key={idx}>
                    <td className="py-2 px-2 font-medium text-fg truncate max-w-[150px]">{row.batch}</td>
                    {[row.mon, row.tue, row.wed, row.thu, row.fri].map((pct, pIdx) => {
                      const color =
                        pct >= 90
                          ? 'bg-success/20 text-success'
                          : pct >= 80
                          ? 'bg-primary/15 text-primary'
                          : 'bg-warning/20 text-warning'
                      return (
                        <td key={pIdx} className="py-1.5 px-2 text-center">
                          <span className={`inline-block px-1.5 py-0.5 rounded font-mono text-[11px] font-semibold ${color}`}>
                            {pct}%
                          </span>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
