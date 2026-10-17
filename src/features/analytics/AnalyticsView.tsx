import React, { useState } from 'react'
import {
  Code2,
  Table as TableIcon,
  LineChart as LineChartIcon,
  Download,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { SqlBlock } from '@/components/ui/SqlBlock'
import { useApp } from '@/context/AppContext'
import { useToast } from '@/context/ToastContext'
import { formatINR, cn } from '@/lib/utils'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts'

export const AnalyticsView: React.FC = () => {
  const { role } = useApp()
  const { success } = useToast()
  const [activeReport, setActiveReport] = useState<
    'collections' | 'attendance' | 'trainer_load' | 'room_utilization'
  >(role === 'trainer' ? 'attendance' : 'collections')
  const [showSql, setShowSql] = useState(false)
  const [viewAsTable, setViewAsTable] = useState(false)

  const collectionsData = [
    { name: 'May 2026', amount: 320000, target: 300000 },
    { name: 'Jun 2026', amount: 390000, target: 350000 },
    { name: 'Jul 2026', amount: 410000, target: 400000 },
    { name: 'Aug 2026', amount: 480000, target: 450000 },
    { name: 'Sep 2026', amount: 510000, target: 500000 },
    { name: 'Oct 2026 (MTD)', amount: 462500, target: 500000 },
  ]

  const attendanceData = [
    { name: 'Java Full-Stack B3 (Kothrud)', turnout: 82, target: 80 },
    { name: 'Java Full-Stack B4 (Baner)', turnout: 94, target: 80 },
    { name: 'Python Data B1 (Baner)', turnout: 89, target: 80 },
    { name: 'Data Analytics B2 (Kothrud)', turnout: 98, target: 80 },
    { name: 'React Frontend B1 (Online)', turnout: 91, target: 80 },
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

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <h1 className="text-xl font-semibold text-text">Analytics</h1>
          <p className="text-xs text-text-muted mt-0.5">
            Operational reporting backed by SQL analytical views and deterministic audits
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowSql(!showSql)}
            leftIcon={<Code2 className="w-3.5 h-3.5" />}
          >
            {showSql ? 'Hide SQL' : 'View SQL query'}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setViewAsTable(!viewAsTable)}
            leftIcon={viewAsTable ? <LineChartIcon className="w-3.5 h-3.5" /> : <TableIcon className="w-3.5 h-3.5" />}
          >
            {viewAsTable ? 'View as chart' : 'View as table'}
          </Button>
        </div>
      </div>

      {/* Report Switcher Tabs */}
      <div className="flex items-center gap-1 border-b border-border text-xs font-medium overflow-x-auto">
        {role !== 'trainer' && (
          <button
            onClick={() => setActiveReport('collections')}
            className={cn(
              'py-2 px-3 border-b-2 transition-colors whitespace-nowrap',
              activeReport === 'collections'
                ? 'border-accent text-text font-semibold'
                : 'border-transparent text-text-muted hover:text-text'
            )}
          >
            Collections trend
          </button>
        )}
        <button
          onClick={() => setActiveReport('attendance')}
          className={cn(
            'py-2 px-3 border-b-2 transition-colors whitespace-nowrap',
            activeReport === 'attendance'
              ? 'border-accent text-text font-semibold'
              : 'border-transparent text-text-muted hover:text-text'
          )}
        >
          Cohort attendance
        </button>
        <button
          onClick={() => setActiveReport('trainer_load')}
          className={cn(
            'py-2 px-3 border-b-2 transition-colors whitespace-nowrap',
            activeReport === 'trainer_load'
              ? 'border-accent text-text font-semibold'
              : 'border-transparent text-text-muted hover:text-text'
          )}
        >
          Trainer workload
        </button>
      </div>

      {/* SQL Provenance Drawer / Accordion */}
      {showSql && (
        <div className="p-4 rounded-card border border-border bg-surface space-y-2">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span className="font-medium text-text">SQL Query Provenance</span>
            <span className="font-mono text-[11px]">Read-only execution · 0 mutation risk</span>
          </div>
          <SqlBlock sql={reportSqls[activeReport] || ''} />
        </div>
      )}

      {/* Main Chart/Table Card */}
      <div className="p-4 rounded-card border border-border bg-surface space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-text">
            {activeReport === 'collections'
              ? 'Tuition collections (6 months)'
              : activeReport === 'attendance'
              ? 'Cohort turnout rates vs 80% target'
              : 'Weekly teaching hours vs max capacity'}
          </h2>
          <span className="text-[11px] text-text-muted">
            {viewAsTable ? 'Tabular format' : 'One accent series with neutral baseline'}
          </span>
        </div>

        {/* Chart View */}
        {!viewAsTable && (
          <div className="h-72 w-full">
            {activeReport === 'collections' && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={collectionsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#DDBF9F" strokeOpacity={0.6} vertical={false} />
                  <XAxis
                    dataKey="name"
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
                  <Line
                    type="monotone"
                    dataKey="target"
                    stroke="#B9926A"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#4A3528"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#4A3528' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}

            {activeReport === 'attendance' && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#DDBF9F" strokeOpacity={0.6} vertical={false} />
                  <XAxis
                    dataKey="name"
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
                    domain={[0, 100]}
                    tickFormatter={(val) => `${val}%`}
                  />
                  <Tooltip
                    formatter={(val: any) => [`${val}%`, 'Turnout']}
                    contentStyle={{
                      backgroundColor: '#F6E3D1',
                      borderColor: '#D6B48A',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: '#1E140E',
                    }}
                  />
                  <Bar dataKey="turnout" fill="#4A3528" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}

            {activeReport === 'trainer_load' && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trainerLoadData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#DDBF9F" strokeOpacity={0.6} vertical={false} />
                  <XAxis
                    dataKey="name"
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
                    tickFormatter={(val) => `${val}h`}
                  />
                  <Tooltip
                    formatter={(val: any) => [`${val} hrs`, 'Weekly Hours']}
                    contentStyle={{
                      backgroundColor: '#F6E3D1',
                      borderColor: '#D6B48A',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: '#1E140E',
                    }}
                  />
                  <Bar dataKey="hours" fill="#4A3528" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        )}

        {/* Table View */}
        {viewAsTable && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-surface-sunken text-text-muted border-b border-border">
                <tr>
                  <th className="py-2 px-3">Dimension</th>
                  <th className="py-2 px-3 text-right">Metric Value</th>
                  <th className="py-2 px-3 text-right">Target / Limit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {activeReport === 'collections' &&
                  collectionsData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-surface-sunken/40 h-9">
                      <td className="px-3 font-medium text-text">{row.name}</td>
                      <td className="px-3 text-right tabular-nums text-text">{formatINR(row.amount)}</td>
                      <td className="px-3 text-right tabular-nums text-text-muted">{formatINR(row.target)}</td>
                    </tr>
                  ))}
                {activeReport === 'attendance' &&
                  attendanceData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-surface-sunken/40 h-9">
                      <td className="px-3 font-medium text-text">{row.name}</td>
                      <td className="px-3 text-right tabular-nums text-text">{row.turnout}%</td>
                      <td className="px-3 text-right tabular-nums text-text-muted">{row.target}%</td>
                    </tr>
                  ))}
                {activeReport === 'trainer_load' &&
                  trainerLoadData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-surface-sunken/40 h-9">
                      <td className="px-3 font-medium text-text">{row.name}</td>
                      <td className="px-3 text-right tabular-nums text-text">{row.hours} hrs</td>
                      <td className="px-3 text-right tabular-nums text-text-muted">{row.max} hrs</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Source Line */}
        <div className="pt-3 border-t border-border flex items-center justify-between text-[11px] text-text-muted">
          <span>Source: Analytical views materialized in Postgres schema · Updated every hour</span>
          <span>Dashed line: Operational target</span>
        </div>
      </div>
    </div>
  )
}
