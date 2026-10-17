import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertOctagon,
  AlertTriangle,
  Clock,
  CheckCircle2,
  MessageSquare,
  ShieldAlert,
} from 'lucide-react'
import { ReasonChip } from '@/components/ui/ReasonChip'
import { Button } from '@/components/ui/Button'
import { useApp } from '@/context/AppContext'
import { useToast } from '@/context/ToastContext'
import { store, useStore, getStudentRiskReasons } from '@/mocks/store'
import { RiskLevel, Student } from '@/types'
import { cn } from '@/lib/utils'

export const RiskBoardView: React.FC = () => {
  const { role, setPendingAskQuery, setCopilotOpen } = useApp()
  const { success } = useToast()
  const navigate = useNavigate()

  const [activeTier, setActiveTier] = useState<RiskLevel | 'all'>('all')

  const students = useStore((s) => s.students)
  const riskAcknowledgements = useStore((s) => s.riskAcknowledgements || {})

  const filtered = students.filter((s) => {
    if (activeTier === 'all') return true
    return s.riskLevel === activeTier
  })

  // Order Critical, High, Watch, Low
  const tierWeight: Record<RiskLevel, number> = {
    critical: 4,
    high: 3,
    watch: 2,
    low: 1,
  }

  const sorted = [...filtered].sort((a, b) => {
    const diff = tierWeight[b.riskLevel] - tierWeight[a.riskLevel]
    if (diff !== 0) return diff
    return b.riskScore - a.riskScore
  })

  const toggleAcknowledge = (id: string) => {
    store.acknowledgeRisk(id, store.currentUser.name)
    success('Risk status acknowledged', 'Saved to persistent risk registry.')
  }

  const handleDraftCheckIn = (st: Student) => {
    const title = `Check-in reminder: ${st.name} (${st.batchNames[0] || 'General'})`
    const summary = `Intervention check-in for risk level ${st.riskLevel.toUpperCase()} (score ${st.riskScore}/100)`
    const message = `Hi ${st.name.split(' ')[0]}, this is CodeCraft Academy faculty. We noticed you've missed recent sessions and want to make sure you're on track. Can you connect with us today to review your progress?`
    store.createSendMessageApproval(title, summary, [
      {
        id: st.id,
        name: st.name,
        phone: st.phone,
        messagePreview: message,
      },
    ])
    success(`Drafted check-in proposal for ${st.name}`, 'Opened approval staging.')
    navigate('/approvals')
  }

  const criticalCount = students.filter((s) => s.riskLevel === 'critical').length
  const highCount = students.filter((s) => s.riskLevel === 'high').length
  const watchCount = students.filter((s) => s.riskLevel === 'watch').length
  const lowCount = students.filter((s) => s.riskLevel === 'low').length

  const renderRiskGlyph = (risk: RiskLevel) => {
    switch (risk) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 text-danger font-medium text-xs">
            <AlertOctagon className="w-3.5 h-3.5" /> Critical
          </span>
        )
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 text-warning font-medium text-xs">
            <AlertTriangle className="w-3.5 h-3.5" /> High
          </span>
        )
      case 'watch':
        return (
          <span className="inline-flex items-center gap-1 text-text-muted text-xs">
            <Clock className="w-3.5 h-3.5" /> Watch
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 text-text-muted text-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-success" /> Low
          </span>
        )
    }
  }

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <h1 className="text-xl font-semibold text-text">Risk board</h1>
          <p className="text-xs text-text-muted mt-0.5">
            Student retention monitoring, automated risk diagnostics, and intervention workflows
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setPendingAskQuery('Analyze dropout risk drivers across all batches')
              setCopilotOpen(true)
            }}
          >
            Analyze risk drivers
          </Button>
        </div>
      </div>

      {/* Risk Tiers: No tile selected by default, ordered Critical, High, Watch, Low with Critical visually strongest */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => setActiveTier(activeTier === 'critical' ? 'all' : 'critical')}
          className={cn(
            'p-3.5 rounded-card border cursor-pointer transition-colors text-center',
            activeTier === 'critical'
              ? 'border-border-strong bg-surface-sunken'
              : 'border-border-strong bg-surface hover:bg-surface-sunken'
          )}
        >
          <div className="text-2xl font-semibold tabular-nums text-danger">
            {criticalCount}
          </div>
          <div className="text-xs font-semibold text-danger mt-1">Critical</div>
          <div className="text-[11px] text-text-muted mt-0.5">Immediate intervention</div>
        </div>

        <div
          onClick={() => setActiveTier(activeTier === 'high' ? 'all' : 'high')}
          className={cn(
            'p-3.5 rounded-card border cursor-pointer transition-colors text-center',
            activeTier === 'high'
              ? 'border-border-strong bg-surface-sunken'
              : 'border-border bg-surface hover:bg-surface-sunken'
          )}
        >
          <div className="text-2xl font-semibold tabular-nums text-warning">
            {highCount}
          </div>
          <div className="text-xs font-medium text-warning mt-1">High</div>
          <div className="text-[11px] text-text-muted mt-0.5">Follow-up needed</div>
        </div>

        <div
          onClick={() => setActiveTier(activeTier === 'watch' ? 'all' : 'watch')}
          className={cn(
            'p-3.5 rounded-card border cursor-pointer transition-colors text-center',
            activeTier === 'watch'
              ? 'border-border-strong bg-surface-sunken'
              : 'border-border bg-surface hover:bg-surface-sunken'
          )}
        >
          <div className="text-2xl font-semibold tabular-nums text-text">
            {watchCount}
          </div>
          <div className="text-xs font-medium text-text mt-1">Watch</div>
          <div className="text-[11px] text-text-muted mt-0.5">Early warning</div>
        </div>

        <div
          onClick={() => setActiveTier(activeTier === 'low' ? 'all' : 'low')}
          className={cn(
            'p-3.5 rounded-card border cursor-pointer transition-colors text-center',
            activeTier === 'low'
              ? 'border-border-strong bg-surface-sunken'
              : 'border-border bg-surface hover:bg-surface-sunken'
          )}
        >
          <div className="text-2xl font-semibold tabular-nums text-text-muted">
            {lowCount}
          </div>
          <div className="text-xs font-medium text-text-muted mt-1">Low</div>
          <div className="text-[11px] text-text-muted mt-0.5">On track</div>
        </div>
      </div>

      {/* Filter status row */}
      {activeTier !== 'all' && (
        <div className="flex items-center justify-between text-xs text-text-muted pb-1">
          <span>Filtering by tier: <strong className="text-text capitalize">{activeTier}</strong></span>
          <button
            onClick={() => setActiveTier('all')}
            className="text-accent hover:underline"
          >
            Show all tiers
          </button>
        </div>
      )}

      {/* Risk Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sorted.map((st) => {
          const ackInfo = riskAcknowledgements[st.id]
          const isAck = !!ackInfo
          const isTrainer = role === 'trainer'

          return (
            <div
              key={st.id}
              className={cn(
                'p-4 rounded-card border bg-surface space-y-3 transition-colors',
                st.riskLevel === 'critical'
                  ? 'border-border-strong'
                  : 'border-border'
              )}
            >
              {/* Card Header: Student & Score Gauge */}
              <div className="flex items-start justify-between gap-3">
                <div
                  onClick={() => navigate(`/students/${st.id}`)}
                  className="cursor-pointer group flex items-center gap-2.5"
                >
                  <div className="w-8 h-8 rounded-full border border-border bg-surface-sunken text-text font-medium text-xs flex items-center justify-center shrink-0">
                    {st.avatar || st.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xs font-medium text-text group-hover:underline">
                      {st.name}
                    </h3>
                    <p className="text-[11px] text-text-muted truncate max-w-[160px]">
                      {st.batchNames[0]}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-sm font-semibold tabular-nums text-text">
                    {st.riskScore}
                    <span className="text-[10px] text-text-muted font-normal"> / 100</span>
                  </div>
                  <div className="mt-0.5">{renderRiskGlyph(st.riskLevel)}</div>
                </div>
              </div>

              {/* Reasons list (Financial details masked for trainer) */}
              <div className="space-y-1 pt-1">
                {getStudentRiskReasons(st, role).map((reason, rIdx) => {
                  return (
                    <ReasonChip
                      key={rIdx}
                      reason={reason}
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
                <div className="flex flex-col gap-0.5">
                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-text-muted select-none">
                    <input
                      type="checkbox"
                      checked={isAck}
                      onChange={() => toggleAcknowledge(st.id)}
                      className="rounded border-border-strong text-accent focus:ring-accent w-3.5 h-3.5"
                    />
                    <span>Acknowledge</span>
                  </label>
                  {isAck && ackInfo && (
                    <span className="text-[10px] text-accent">
                      Ack'd by {ackInfo.by} ({ackInfo.at})
                    </span>
                  )}
                </div>

                <Button
                  variant="secondary"
                  size="xs"
                  onClick={() => handleDraftCheckIn(st)}
                  leftIcon={<MessageSquare className="w-3 h-3" />}
                >
                  Draft check-in
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
