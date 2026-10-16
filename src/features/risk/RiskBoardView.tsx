import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  ShieldAlert,
  Sparkles,
  MessageSquare,
  Check,
  TrendingDown,
  Info,
} from 'lucide-react'
import { StatusPill } from '@/components/ui/StatusPill'
import { ReasonChip } from '@/components/ui/ReasonChip'
import { Button } from '@/components/ui/Button'
import { useApp } from '@/context/AppContext'
import { useToast } from '@/context/ToastContext'
import { store } from '@/mocks/store'
import { RiskLevel } from '@/types'

export const RiskBoardView: React.FC = () => {
  const { role, setCopilotOpen } = useApp()
  const { success } = useToast()
  const navigate = useNavigate()

  const [activeTier, setActiveTier] = useState<RiskLevel | 'all'>('all')
  const [acknowledgedIds, setAcknowledgedIds] = useState<string[]>([])

  const students = store.students

  const filtered = students.filter((s) => {
    if (activeTier === 'all') return true
    return s.riskLevel === activeTier
  })

  const sorted = [...filtered].sort((a, b) => b.riskScore - a.riskScore)

  const toggleAcknowledge = (id: string) => {
    setAcknowledgedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
    success('Risk status acknowledged')
  }

  const criticalCount = students.filter((s) => s.riskLevel === 'critical').length
  const highCount = students.filter((s) => s.riskLevel === 'high').length
  const watchCount = students.filter((s) => s.riskLevel === 'watch').length
  const lowCount = students.filter((s) => s.riskLevel === 'low').length

  return (
    <div className="space-y-5 animate-fade-in select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-fg">Student Retention & Risk Board</h1>
          <p className="text-xs text-fg-muted mt-0.5">
            Predictive dropout & absenteeism monitoring · Continuous automated risk scoring
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ai"
            size="sm"
            onClick={() => setCopilotOpen(true)}
            leftIcon={<Sparkles className="w-3.5 h-3.5" />}
          >
            Ask Copilot to analyze risk causes
          </Button>
        </div>
      </div>

      {/* Tier Tabs with Counts */}
      <div className="flex items-center gap-2 border-b border-border text-xs font-medium">
        <button
          onClick={() => setActiveTier('all')}
          className={`py-2 px-3 border-b-2 transition-colors ${
            activeTier === 'all'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-fg-muted hover:text-fg'
          }`}
        >
          All Students ({students.length})
        </button>
        <button
          onClick={() => setActiveTier('critical')}
          className={`py-2 px-3 border-b-2 transition-colors ${
            activeTier === 'critical'
              ? 'border-danger text-danger font-semibold'
              : 'border-transparent text-fg-muted hover:text-fg'
          }`}
        >
          Critical ({criticalCount})
        </button>
        <button
          onClick={() => setActiveTier('high')}
          className={`py-2 px-3 border-b-2 transition-colors ${
            activeTier === 'high'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-semibold'
              : 'border-transparent text-fg-muted hover:text-fg'
          }`}
        >
          High Risk ({highCount})
        </button>
        <button
          onClick={() => setActiveTier('watch')}
          className={`py-2 px-3 border-b-2 transition-colors ${
            activeTier === 'watch'
              ? 'border-warning text-warning font-semibold'
              : 'border-transparent text-fg-muted hover:text-fg'
          }`}
        >
          Watchlist ({watchCount})
        </button>
        <button
          onClick={() => setActiveTier('low')}
          className={`py-2 px-3 border-b-2 transition-colors ${
            activeTier === 'low'
              ? 'border-success text-success font-semibold'
              : 'border-transparent text-fg-muted hover:text-fg'
          }`}
        >
          Low Risk ({lowCount})
        </button>
      </div>

      {/* Risk Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sorted.map((st) => {
          const isAck = acknowledgedIds.includes(st.id)
          const isTrainer = role === 'trainer'

          return (
            <div
              key={st.id}
              className={`p-4 rounded-card border bg-surface space-y-3.5 shadow-sm transition-all hover:shadow-hover ${
                st.riskLevel === 'critical'
                  ? 'border-danger/40'
                  : st.riskLevel === 'high'
                  ? 'border-amber-500/40'
                  : 'border-border'
              }`}
            >
              {/* Card Header: Student & Score Gauge */}
              <div className="flex items-start justify-between gap-3">
                <div
                  onClick={() => navigate(`/students/${st.id}`)}
                  className="cursor-pointer group flex items-center gap-2.5"
                >
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                    {st.avatar || st.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-fg group-hover:text-primary transition-colors">
                      {st.name}
                    </h3>
                    <p className="text-[11px] text-fg-muted truncate max-w-[170px]">
                      {st.batchNames[0]}
                    </p>
                  </div>
                </div>

                {/* Score Gauge */}
                <div className="text-right shrink-0">
                  <div
                    className={`text-lg font-bold font-mono ${
                      st.riskScore >= 80
                        ? 'text-danger'
                        : st.riskScore >= 60
                        ? 'text-amber-600 dark:text-amber-400'
                        : st.riskScore >= 40
                        ? 'text-warning'
                        : 'text-fg-muted'
                    }`}
                  >
                    {st.riskScore}
                    <span className="text-[10px] text-fg-muted font-normal">/100</span>
                  </div>
                  <StatusPill status={st.riskLevel} size="sm" />
                </div>
              </div>

              {/* Top 3 Reason Chips (Financial reasons masked for trainer) */}
              <div className="space-y-1.5 pt-1">
                {st.riskReasons.map((reason, rIdx) => {
                  const isFinancial = reason.toLowerCase().includes('emi') || reason.toLowerCase().includes('due')
                  const displayedReason =
                    isTrainer && isFinancial
                      ? 'Non-academic factor — counselor informed'
                      : reason

                  return (
                    <ReasonChip
                      key={rIdx}
                      reason={displayedReason}
                      variant={
                        st.riskLevel === 'critical'
                          ? 'danger'
                          : st.riskLevel === 'high'
                          ? 'warning'
                          : 'neutral'
                      }
                      className="w-full justify-start text-[11px]"
                    />
                  )
                })}
              </div>

              {/* Action Buttons & Acknowledge Checkbox */}
              <div className="pt-3 border-t border-border flex items-center justify-between gap-2 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-fg-muted select-none">
                  <input
                    type="checkbox"
                    checked={isAck}
                    onChange={() => toggleAcknowledge(st.id)}
                    className="rounded border-border text-primary focus:ring-primary w-3.5 h-3.5"
                  />
                  <span>Acknowledge</span>
                </label>

                <Button
                  variant="ai"
                  size="sm"
                  className="h-7 text-xs px-2.5"
                  onClick={() => {
                    success(
                      `Drafting check-in reminder for ${st.name.split(' ')[0]}`,
                      'Opening Copilot approval staging.'
                    )
                    setCopilotOpen(true)
                  }}
                  leftIcon={<Sparkles className="w-3 h-3" />}
                >
                  Draft Check-in
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
