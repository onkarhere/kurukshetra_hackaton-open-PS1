import React, { useState } from 'react'
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  Sparkles,
  Code2,
  Table as TableIcon,
  Download,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { SqlBlock } from '@/components/ui/SqlBlock'
import { useToast } from '@/context/ToastContext'
import { formatINR } from '@/lib/utils'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

export const AnalyticsView: React.FC = () => {
  const { success, ai } = useToast()
  const [activeReport, setActiveReport] = useState<'collections' | 'attendance' | 'trainer_load' | 'room_utilization'>('collections')
  const [showSql, setShowSql] = useState(false)
  const [viewAsTable, setViewAsTable] = useState(false)

  const collectionsData = [
    { name: 'May 26', amount: 320000 },
    { name: 'Jun 26', amount: 390000 },
    { name: 'Jul 26', amount: 410000 },
    { name: 'Aug 26', amount: 480000 },
    { name: 'Sep 26', amount: 510000 },
    { name: 'Oct 26 (MTD)', amount: 462500 },
  ]

  const trainerLoadData = [
    { name: 'Arjun Mehta', hours: 34, max: 40 },
    { name: 'Sana Kapoor', hours: 32, max: 36 },
    { name: 'Ananya Joshi', hours: 30, max: 35 },
    { name: 'Meera Rao', hours: 28, max: 35 },
    { name: 'Rahul D.', hours: 26, max: 32 },
    { name: 'Vikram M.', hours: 24, max: 30 },
  ]

  const reportSqls: Record<string, string> = {
    collections: `SELECT 
    DATE_TRUNC('month', payment_date) AS month, 
    SUM(amount) AS total_collected
FROM v_verified_payments
WHERE payment_date >= '2026-05-01'
GROUP BY 1 ORDER BY 1 ASC;`,
    attendance: `SELECT 
    b.name AS batch_name, 
    ROUND(AVG(a.attendance_rate), 1) AS avg_turnout
FROM v_batches b
JOIN v_attendance_summary a ON b.id = a.batch_id
GROUP BY b.id, b.name;`,
    trainer_load: `SELECT 
    t.name AS trainer_name,
    SUM(s.duration_hours) AS weekly_assigned_hours,
    t.max_weekly_hours
FROM v_trainers t
JOIN v_timetable_sessions s ON t.id = s.trainer_id
GROUP BY t.id, t.name, t.max_weekly_hours;`,
    room_utilization: `SELECT 
    r.room_number,
    COUNT(s.id) AS sessions_count,
    ROUND(AVG(s.occupancy_rate), 1) AS avg_occupancy
FROM v_rooms r
JOIN v_timetable_sessions s ON r.id = s.room_id
GROUP BY r.id, r.room_number;`,
  }

  const handleExplain = () => {
    ai(
      'AI Analysis Insight',
      'Collections increased 28% quarter-over-quarter driven by high enrolment in Java Full-Stack B3 and Advanced Data Analytics cohorts in Pune.'
    )
  }

  return (
    <div className="space-y-5 animate-fade-in select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-fg">Operations Analytics & Reports</h1>
          <p className="text-xs text-fg-muted mt-0.5">
            Holistic data intelligence · Every chart backed by deterministic SQL queries and AI explanations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ai"
            size="sm"
            onClick={handleExplain}
            leftIcon={<Sparkles className="w-3.5 h-3.5" />}
          >
            Explain This Chart
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSql(!showSql)}
            leftIcon={<Code2 className="w-3.5 h-3.5" />}
          >
            {showSql ? 'Hide SQL' : 'Show SQL'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewAsTable(!viewAsTable)}
            leftIcon={<TableIcon className="w-3.5 h-3.5" />}
          >
            {viewAsTable ? 'View as Chart' : 'View as Table'}
          </Button>
        </div>
      </div>

      {/* Report Gallery Navigation Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-medium border-b border-border">
        <button
          onClick={() => setActiveReport('collections')}
          className={`py-2 px-3 border-b-2 transition-colors whitespace-nowrap ${
            activeReport === 'collections'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-fg-muted hover:text-fg'
          }`}
        >
          Tuition Collections MTD
        </button>
        <button
          onClick={() => setActiveReport('trainer_load')}
          className={`py-2 px-3 border-b-2 transition-colors whitespace-nowrap ${
            activeReport === 'trainer_load'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-fg-muted hover:text-fg'
          }`}
        >
          Trainer Utilisation Hours
        </button>
      </div>

      {/* SQL Drawer */}
      {showSql && (
        <div className="animate-scale-in">
          <SqlBlock sql={reportSqls[activeReport]} />
        </div>
      )}

      {/* Main Chart Canvas or Table View */}
      <div className="p-5 rounded-card border border-border bg-surface space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <h3 className="text-xs font-semibold uppercase tracking-wider font-mono text-fg">
            {activeReport === 'collections'
              ? 'Monthly Gross Collections Trend (INR)'
              : 'Weekly Assigned Hours vs Capacity'}
          </h3>
          <span className="text-[11px] font-mono text-fg-muted">Source: Analytic Views</span>
        </div>

        {viewAsTable ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-2 border-b border-border text-[11px] font-semibold text-fg-muted">
                <tr>
                  <th className="py-2 px-3">Dimension</th>
                  <th className="py-2 px-3 text-right">Primary Metric</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {activeReport === 'collections'
                  ? collectionsData.map((d, i) => (
                      <tr key={i}>
                        <td className="py-2 px-3 font-medium text-fg">{d.name}</td>
                        <td className="py-2 px-3 font-mono font-bold text-fg text-right">
                          {formatINR(d.amount)}
                        </td>
                      </tr>
                    ))
                  : trainerLoadData.map((t, i) => (
                      <tr key={i}>
                        <td className="py-2 px-3 font-medium text-fg">{t.name}</td>
                        <td className="py-2 px-3 font-mono font-bold text-fg text-right">
                          {t.hours}h of {t.max}h
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-72 w-full">
            {activeReport === 'collections' ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={collectionsData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="var(--text-muted)"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(val) => `₹${val / 1000}k`}
                  />
                  <Tooltip
                    formatter={(val: any) => [formatINR(Number(val)), 'Total Inflow']}
                    contentStyle={{
                      backgroundColor: 'var(--surface)',
                      borderColor: 'var(--border)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#chartGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trainerLoadData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--surface)',
                      borderColor: 'var(--border)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="hours" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
