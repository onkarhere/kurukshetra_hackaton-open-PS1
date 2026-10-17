import React, { useState } from 'react'
import {
  Building2,
  Calendar,
  Clock,
  Shield,
  Radio,
  Bell,
  Save,
  Check,
  ToggleLeft,
  ToggleRight,
  Lock,
  RotateCcw,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/context/ToastContext'
import { store, useStore } from '@/mocks/store'

export const SettingsView: React.FC = () => {
  const { success } = useToast()
  const settings = useStore((s) => s.settings)

  const [activeSubTab, setActiveSubTab] = useState<
    'attendance_rules' | 'fees_rules' | 'permissions' | 'governance' | 'notifications'
  >('attendance_rules')

  const [hasChanges, setHasChanges] = useState(false)

  // Config states initialized from store
  const [minAttendanceThreshold, setMinAttendanceThreshold] = useState(settings.minAttendanceThreshold || 75)
  const [criticalRiskThreshold, setCriticalRiskThreshold] = useState(settings.criticalRiskThreshold || 40)
  const [lateToleranceMinutes, setLateToleranceMinutes] = useState(settings.lateToleranceMinutes || 10)
  const [quietHoursStart, setQuietHoursStart] = useState(settings.quietHoursStart || '21:00')
  const [quietHoursEnd, setQuietHoursEnd] = useState(settings.quietHoursEnd || '08:00')
  const [disableExternalLLMs, setDisableExternalLLMs] = useState(settings.disableExternalLLMs || false)
  const [autoSmsWaivers, setAutoSmsWaivers] = useState(settings.autoSmsWaivers !== undefined ? settings.autoSmsWaivers : true)

  const handleSave = () => {
    store.updateSettings({
      minAttendanceThreshold,
      criticalRiskThreshold,
      lateToleranceMinutes,
      quietHoursStart,
      quietHoursEnd,
      disableExternalLLMs,
      autoSmsWaivers,
    })
    setHasChanges(false)
    success('Settings saved', 'Configuration changes are now active.')
  }

  const handleResetDemo = () => {
    store.resetDemo()
    setMinAttendanceThreshold(75)
    setCriticalRiskThreshold(40)
    setLateToleranceMinutes(10)
    setQuietHoursStart('21:00')
    setQuietHoursEnd('08:00')
    setDisableExternalLLMs(false)
    setAutoSmsWaivers(true)
    setHasChanges(false)
    success('Demo data restored', 'Restored all seed batches, students, instalments, and messages.')
  }

  return (
    <div className="space-y-6 select-none relative pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-text">Settings & governance</h1>
          <p className="text-xs text-text-muted mt-0.5">
            Operational thresholds, role permissions, data privacy guardrails and quiet hours
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleResetDemo}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Reset demo data
          </Button>
          {hasChanges && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              leftIcon={<Save className="w-3.5 h-3.5" />}
            >
              Save changes
            </Button>
          )}
        </div>
      </div>

      {/* Sub-nav tabs */}
      <div className="flex items-center gap-2 border-b border-border text-xs font-normal overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('attendance_rules')}
          className={`py-2 px-3 border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'attendance_rules'
              ? 'border-accent text-accent font-medium'
              : 'border-transparent text-text-muted hover:text-text'
          }`}
        >
          Attendance rules
        </button>
        <button
          onClick={() => setActiveSubTab('fees_rules')}
          className={`py-2 px-3 border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'fees_rules'
              ? 'border-accent text-accent font-medium'
              : 'border-transparent text-text-muted hover:text-text'
          }`}
        >
          Fees & EMI governance
        </button>
        <button
          onClick={() => setActiveSubTab('permissions')}
          className={`py-2 px-3 border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'permissions'
              ? 'border-accent text-accent font-medium'
              : 'border-transparent text-text-muted hover:text-text'
          }`}
        >
          Roles & permissions
        </button>
        <button
          onClick={() => setActiveSubTab('governance')}
          className={`py-2 px-3 border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'governance'
              ? 'border-accent text-accent font-medium'
              : 'border-transparent text-text-muted hover:text-text'
          }`}
        >
          Data & model governance
        </button>
        <button
          onClick={() => setActiveSubTab('notifications')}
          className={`py-2 px-3 border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'notifications'
              ? 'border-accent text-accent font-medium'
              : 'border-transparent text-text-muted hover:text-text'
          }`}
        >
          Quiet hours & channels
        </button>
      </div>

      {/* SUB-TAB 1: ATTENDANCE RULES */}
      {activeSubTab === 'attendance_rules' && (
        <div className="p-5 rounded-card border border-border bg-surface space-y-5 max-w-2xl">
          <div className="text-xs font-medium text-text">
            Attendance scoring and tardiness thresholds
          </div>

          <div className="space-y-5 text-xs">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-text font-normal">
                <span>Minimum attendance threshold for certification</span>
                <span className="tabular-nums font-medium text-text">{minAttendanceThreshold}%</span>
              </div>
              <input
                type="range"
                min="60"
                max="90"
                value={minAttendanceThreshold}
                onChange={(e) => {
                  setMinAttendanceThreshold(Number(e.target.value))
                  setHasChanges(true)
                }}
                className="w-full accent-accent"
              />
              <p className="text-[11px] text-text-muted">
                Students dropping below this threshold will appear in the attention queue.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-text font-normal">
                <span>Critical risk escalation threshold</span>
                <span className="tabular-nums font-medium text-danger">{criticalRiskThreshold}%</span>
              </div>
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
              <p className="text-[11px] text-text-muted">
                Drops below {criticalRiskThreshold}% flag candidate for immediate intervention.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-text font-normal">
                <span>Late check-in tolerance window</span>
                <span className="tabular-nums font-medium text-warning">{lateToleranceMinutes} minutes</span>
              </div>
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
              <p className="text-[11px] text-text-muted">
                Check-ins after {lateToleranceMinutes} minutes are recorded as Late instead of Present.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: FEES RULES */}
      {activeSubTab === 'fees_rules' && (
        <div className="p-5 rounded-card border border-border bg-surface space-y-5 max-w-2xl">
          <div className="text-xs font-medium text-text">
            Fee ageing & instalment policies
          </div>
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3.5 rounded-control bg-surface-sunken border border-border">
              <div>
                <div className="font-medium text-text">Automated overdue WhatsApp notices</div>
                <div className="text-[11px] text-text-muted mt-0.5">
                  Sends payment reminder on day 3 and day 7 post due date with payment link.
                </div>
              </div>
              <button
                onClick={() => {
                  setAutoSmsWaivers(!autoSmsWaivers)
                  setHasChanges(true)
                }}
                className={`p-1 transition-colors ${autoSmsWaivers ? 'text-accent' : 'text-text-muted'}`}
              >
                {autoSmsWaivers ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
              </button>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-control bg-surface-sunken border border-border">
              <div>
                <div className="font-medium text-text">Strict financial opacity for trainers</div>
                <div className="text-[11px] text-text-muted mt-0.5">
                  Never expose student fees, overdue status, or payment amounts to faculty or trainers.
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-xs text-success font-medium">
                <Check className="w-3.5 h-3.5" /> Enforced
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: PERMISSIONS */}
      {activeSubTab === 'permissions' && (
        <div className="p-5 rounded-card border border-border bg-surface space-y-5 max-w-2xl">
          <div className="text-xs font-medium text-text">
            Role-based access matrix
          </div>
          <div className="border border-border rounded-control overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-surface-sunken border-b border-border text-text-muted font-normal">
                <tr>
                  <th className="text-left p-3">Capability</th>
                  <th className="text-center p-3">Owner</th>
                  <th className="text-center p-3">Trainer</th>
                  <th className="text-center p-3">Counselor</th>
                  <th className="text-center p-3">Accounts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-text">
                <tr>
                  <td className="p-3 font-normal">Fee balances & collections</td>
                  <td className="p-3 text-center text-success">✓</td>
                  <td className="p-3 text-center text-text-muted">—</td>
                  <td className="p-3 text-center text-text-muted">—</td>
                  <td className="p-3 text-center text-success">✓</td>
                </tr>
                <tr>
                  <td className="p-3 font-normal">Mark attendance & start session</td>
                  <td className="p-3 text-center text-success">✓</td>
                  <td className="p-3 text-center text-success">✓</td>
                  <td className="p-3 text-center text-text-muted">—</td>
                  <td className="p-3 text-center text-text-muted">—</td>
                </tr>
                <tr>
                  <td className="p-3 font-normal">Approve timetable re-plans</td>
                  <td className="p-3 text-center text-success">✓</td>
                  <td className="p-3 text-center text-text-muted">—</td>
                  <td className="p-3 text-center text-text-muted">—</td>
                  <td className="p-3 text-center text-text-muted">—</td>
                </tr>
                <tr>
                  <td className="p-3 font-normal">Reconcile bank statements</td>
                  <td className="p-3 text-center text-success">✓</td>
                  <td className="p-3 text-center text-text-muted">—</td>
                  <td className="p-3 text-center text-text-muted">—</td>
                  <td className="p-3 text-center text-success">✓</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: DATA & MODEL GOVERNANCE */}
      {activeSubTab === 'governance' && (
        <div className="p-5 rounded-card border border-border bg-surface space-y-5 max-w-2xl">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-text-muted" />
            <div className="text-xs font-medium text-text">
              Data governance and safety controls
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3.5 rounded-control bg-surface-sunken border border-border">
              <div>
                <div className="font-medium text-text">Disable external LLMs (Private enclave only)</div>
                <div className="text-[11px] text-text-muted mt-0.5">
                  Execute inference strictly on local self-hosted open weights; disable third-party cloud API calls.
                </div>
              </div>
              <button
                onClick={() => {
                  setDisableExternalLLMs(!disableExternalLLMs)
                  setHasChanges(true)
                }}
                className={`p-1 transition-colors ${disableExternalLLMs ? 'text-accent' : 'text-text-muted'}`}
              >
                {disableExternalLLMs ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
              </button>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-control bg-surface-sunken border border-border">
              <div>
                <div className="font-medium text-text">Enforce row-level security on inferred SQL</div>
                <div className="text-[11px] text-text-muted mt-0.5">
                  Always inject user role bounds to prevent trainers from querying tuition fee tables.
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-xs text-success font-medium">
                <Check className="w-3.5 h-3.5" /> Mandatory
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-control bg-surface-sunken border border-border">
              <div>
                <div className="font-medium text-text">Mask personally identifiable data in telemetry</div>
                <div className="text-[11px] text-text-muted mt-0.5">
                  Strip student phone numbers, email addresses, and bank accounts prior to prompt compilation.
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-xs text-success font-medium">
                <Check className="w-3.5 h-3.5" /> Mandatory
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: QUIET HOURS */}
      {activeSubTab === 'notifications' && (
        <div className="p-5 rounded-card border border-border bg-surface space-y-5 max-w-2xl">
          <div className="text-xs font-medium text-text">
            Quiet hours compliance (21:00 – 08:00 IST)
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="text-text-muted">Quiet hours start</label>
              <input
                type="time"
                value={quietHoursStart}
                onChange={(e) => {
                  setQuietHoursStart(e.target.value)
                  setHasChanges(true)
                }}
                className="w-full bg-surface-sunken border border-border-strong rounded-control p-2 text-xs text-text tabular-nums"
              />
            </div>
            <div className="space-y-1">
              <label className="text-text-muted">Quiet hours end</label>
              <input
                type="time"
                value={quietHoursEnd}
                onChange={(e) => {
                  setQuietHoursEnd(e.target.value)
                  setHasChanges(true)
                }}
                className="w-full bg-surface-sunken border border-border-strong rounded-control p-2 text-xs text-text tabular-nums"
              />
            </div>
          </div>

          <p className="text-[11px] text-text-muted">
            All automated student and parent notifications scheduled during quiet hours are queued until 08:00 IST the following morning.
          </p>
        </div>
      )}

      {/* Sticky Save Bar */}
      {hasChanges && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-surface border border-border-strong shadow-lg rounded-control px-4 py-2.5 flex items-center gap-4">
          <span className="text-xs text-text font-normal">Unsaved configuration changes</span>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            leftIcon={<Save className="w-3.5 h-3.5" />}
          >
            Save changes
          </Button>
        </div>
      )}
    </div>
  )
}
