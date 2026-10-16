import React, { useState } from 'react'
import {
  Settings,
  Building2,
  Calendar,
  Clock,
  Shield,
  Radio,
  Sparkles,
  Bell,
  Save,
  Check,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/context/ToastContext'

export const SettingsView: React.FC = () => {
  const { success } = useToast()
  const [activeSubTab, setActiveSubTab] = useState<
    'institute' | 'attendance_rules' | 'fees_rules' | 'permissions' | 'ai' | 'notifications'
  >('attendance_rules')

  const [hasChanges, setHasChanges] = useState(false)

  // Config states
  const [minAttendanceThreshold, setMinAttendanceThreshold] = useState(75)
  const [criticalRiskThreshold, setCriticalRiskThreshold] = useState(40)
  const [lateToleranceMinutes, setLateToleranceMinutes] = useState(10)
  const [quietHoursStart, setQuietHoursStart] = useState('21:00')
  const [quietHoursEnd, setQuietHoursEnd] = useState('08:00')
  const [disableExternalLLMs, setDisableExternalLLMs] = useState(false)
  const [autoSmsWaivers, setAutoSmsWaivers] = useState(true)

  const handleSave = () => {
    setHasChanges(false)
    success('Settings persisted successfully', 'Updated parameters now active across institute services.')
  }

  return (
    <div className="space-y-5 animate-fade-in select-none relative pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-fg">Institute Settings & Governance</h1>
          <p className="text-xs text-fg-muted mt-0.5">
            Operating thresholds, role permission matrices, AI safety controls & notification quiet hours
          </p>
        </div>
      </div>

      {/* Sub-nav */}
      <div className="flex items-center gap-1 border-b border-border text-xs font-medium overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('attendance_rules')}
          className={`py-2 px-3 border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'attendance_rules'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-fg-muted hover:text-fg'
          }`}
        >
          Attendance Rules
        </button>
        <button
          onClick={() => setActiveSubTab('fees_rules')}
          className={`py-2 px-3 border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'fees_rules'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-fg-muted hover:text-fg'
          }`}
        >
          Fees & EMI Governance
        </button>
        <button
          onClick={() => setActiveSubTab('permissions')}
          className={`py-2 px-3 border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'permissions'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-fg-muted hover:text-fg'
          }`}
        >
          Roles & Permissions Matrix
        </button>
        <button
          onClick={() => setActiveSubTab('ai')}
          className={`py-2 px-3 border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'ai'
              ? 'border-ai text-ai font-semibold'
              : 'border-transparent text-fg-muted hover:text-fg'
          }`}
        >
          AI Guardrails & LLMs
        </button>
        <button
          onClick={() => setActiveSubTab('notifications')}
          className={`py-2 px-3 border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'notifications'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-fg-muted hover:text-fg'
          }`}
        >
          Quiet Hours & Channels
        </button>
      </div>

      {/* SUB-TAB 1: ATTENDANCE RULES */}
      {activeSubTab === 'attendance_rules' && (
        <div className="p-5 rounded-card border border-border bg-surface space-y-5 shadow-sm max-w-2xl">
          <h3 className="text-xs font-semibold uppercase tracking-wider font-mono text-fg">
            Attendance Scoring & Tardiness Thresholds
          </h3>

          <div className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="flex items-center justify-between text-fg font-medium">
                <span>Minimum Attendance Threshold (Certification Qualification)</span>
                <span className="font-mono font-bold text-primary">{minAttendanceThreshold}%</span>
              </label>
              <input
                type="range"
                min="60"
                max="90"
                value={minAttendanceThreshold}
                onChange={(e) => {
                  setMinAttendanceThreshold(Number(e.target.value))
                  setHasChanges(true)
                }}
                className="w-full accent-primary"
              />
              <p className="text-[11px] text-fg-muted">
                Students dropping below this threshold will automatically show in the Attention Queue.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center justify-between text-fg font-medium">
                <span>Critical Risk Escalation Boundary</span>
                <span className="font-mono font-bold text-danger">{criticalRiskThreshold}%</span>
              </label>
              <input
                type="range"
                min="20"
                max="60"
                value={criticalRiskThreshold}
                onChange={(e) => {
                  setCriticalRiskThreshold(Number(e.target.value))
                  setHasChanges(true)
                }}
                className="w-full accent-danger"
              />
              <p className="text-[11px] text-fg-muted">
                Drop below {criticalRiskThreshold}% flags candidate for immediate counselor intervention.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center justify-between text-fg font-medium">
                <span>Tardy / Late Check-in Window</span>
                <span className="font-mono font-bold text-warning">{lateToleranceMinutes} minutes</span>
              </label>
              <input
                type="range"
                min="5"
                max="30"
                value={lateToleranceMinutes}
                onChange={(e) => {
                  setLateToleranceMinutes(Number(e.target.value))
                  setHasChanges(true)
                }}
                className="w-full accent-warning"
              />
              <p className="text-[11px] text-fg-muted">
                Scans after {lateToleranceMinutes}m mark attendance as "Late (amber)" instead of Present.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: AI GUARDRAILS */}
      {activeSubTab === 'ai' && (
        <div className="p-5 rounded-card border border-ai/30 bg-surface space-y-5 shadow-sm max-w-2xl">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-ai" />
            <h3 className="text-xs font-semibold uppercase tracking-wider font-mono text-fg">
              AI Copilot Safety & Privacy Guardrails
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 rounded-btn bg-surface-2 border border-border">
              <div>
                <div className="font-semibold text-fg">Disable External LLMs (Private Enclave Only)</div>
                <div className="text-[11px] text-fg-muted mt-0.5">
                  Execute inference strictly on local self-hosted open weights; disable API calls.
                </div>
              </div>
              <button
                onClick={() => {
                  setDisableExternalLLMs(!disableExternalLLMs)
                  setHasChanges(true)
                }}
                className={`p-1 text-base ${disableExternalLLMs ? 'text-primary' : 'text-fg-muted'}`}
              >
                {disableExternalLLMs ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-btn bg-surface-2 border border-border">
              <div>
                <div className="font-semibold text-fg">Enforce Row-Level Security on Inferred SQL</div>
                <div className="text-[11px] text-fg-muted mt-0.5">
                  Always inject user role bounds to prevent trainers from querying tuition fee tables.
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-success">Mandatory ✓</span>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: QUIET HOURS */}
      {activeSubTab === 'notifications' && (
        <div className="p-5 rounded-card border border-border bg-surface space-y-5 shadow-sm max-w-2xl">
          <h3 className="text-xs font-semibold uppercase tracking-wider font-mono text-fg">
            TRAI / Quiet Hours Compliance (21:00 – 08:00 IST)
          </h3>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="text-fg-muted">Quiet Hours Start</label>
              <input
                type="time"
                value={quietHoursStart}
                onChange={(e) => {
                  setQuietHoursStart(e.target.value)
                  setHasChanges(true)
                }}
                className="w-full bg-surface-2 border border-border rounded-btn p-2 text-xs font-mono text-fg"
              />
            </div>
            <div className="space-y-1">
              <label className="text-fg-muted">Quiet Hours End</label>
              <input
                type="time"
                value={quietHoursEnd}
                onChange={(e) => {
                  setQuietHoursEnd(e.target.value)
                  setHasChanges(true)
                }}
                className="w-full bg-surface-2 border border-border rounded-btn p-2 text-xs font-mono text-fg"
              />
            </div>
          </div>

          <p className="text-[11px] text-fg-muted">
            All AI WhatsApp broadcasts scheduled during quiet hours are auto-delayed until 08:00 IST next morning.
          </p>
        </div>
      )}

      {/* Sticky Save Bar */}
      {hasChanges && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-surface border border-primary/50 shadow-modal rounded-full px-5 py-2.5 flex items-center gap-4 animate-scale-in">
          <span className="text-xs text-fg font-medium">Unsaved configuration changes pending</span>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            leftIcon={<Save className="w-3.5 h-3.5" />}
          >
            Save All Changes
          </Button>
        </div>
      )}
    </div>
  )
}
