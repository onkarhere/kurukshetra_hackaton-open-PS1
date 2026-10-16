import React, { useState } from 'react'
import {
  Calendar,
  Video,
  CreditCard,
  Award,
  Clock,
  Sparkles,
  QrCode,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ReasonChip } from '@/components/ui/ReasonChip'
import { formatINR } from '@/lib/utils'
import { useToast } from '@/context/ToastContext'

export const StudentPortalView: React.FC = () => {
  const { success } = useToast()
  const [activeTab, setActiveTab] = useState<'today' | 'schedule' | 'recordings' | 'fees' | 'certificate'>('today')

  return (
    <div className="max-w-md mx-auto min-h-screen bg-bg text-fg flex flex-col justify-between select-none animate-fade-in font-sans pb-20">
      {/* Top Header */}
      <div className="p-4 border-b border-border bg-surface flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-xs flex items-center justify-center">
            PN
          </div>
          <div>
            <div className="font-bold text-xs text-fg">Priya Nair</div>
            <div className="text-[10px] text-fg-muted font-mono">Java Full-Stack B3 · Roll #104</div>
          </div>
        </div>
        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
          CodeCraft Pune
        </span>
      </div>

      {/* Main Tab Content */}
      <div className="p-4 space-y-4 flex-1 overflow-y-auto">
        {/* TAB 1: TODAY */}
        {activeTab === 'today' && (
          <div className="space-y-4">
            <div className="p-4 rounded-card border border-primary/30 bg-primary/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono font-bold text-primary">
                  Today's Class · 19:00 IST
                </span>
                <span className="w-2 h-2 rounded-full bg-success animate-ping" />
              </div>
              <h3 className="text-sm font-bold text-fg">Spring Data JPA Repositories</h3>
              <p className="text-xs text-fg-muted">
                Room 3 (Kothrud Campus) · Faculty: Arjun Mehta
              </p>
              <Button
                variant="primary"
                size="sm"
                className="w-full"
                onClick={() => success('Checked into class via student GPS beacon.')}
              >
                Scan Classroom QR Code
              </Button>
            </div>

            {/* Attendance & Catch-up Card */}
            <div className="p-4 rounded-card border border-warning/40 bg-warning/5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-warning">Current Attendance: 44%</span>
                <span className="text-[10px] text-fg-muted">Min 80% required</span>
              </div>
              <p className="text-xs text-fg leading-relaxed">
                You missed 3 classes last week. Please watch recordings to remain eligible for placement drives.
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: SCHEDULE */}
        {activeTab === 'schedule' && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-fg uppercase tracking-wider font-mono">
              Class Schedule
            </h3>

            {/* Changed Banner */}
            <div className="p-3 rounded-btn border border-ai/30 bg-ai/5 space-y-1 text-xs">
              <div className="font-semibold text-ai flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Schedule Adjustment Alert
              </div>
              <p className="text-fg-muted leading-relaxed">
                Thursday class rescheduled to Friday 19:00 in Room 3 due to faculty leave.
              </p>
              <ReasonChip reason="Arjun on medical leave Thu" variant="ai" className="mt-1" />
            </div>

            <div className="p-3 rounded-card border border-border bg-surface text-xs space-y-1">
              <div className="flex items-center justify-between font-semibold text-fg">
                <span>Friday Session</span>
                <span className="font-mono text-primary">19:00 - 21:00</span>
              </div>
              <div className="text-fg-muted">Java Full-Stack B3 · Room 3</div>
            </div>
          </div>
        )}

        {/* TAB 4: FEES */}
        {activeTab === 'fees' && (
          <div className="space-y-4">
            <div className="p-4 rounded-card border border-danger/40 bg-danger/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono font-bold text-danger">
                  Outstanding Instalment
                </span>
                <span className="text-[10px] text-danger font-semibold">12 Days Overdue</span>
              </div>
              <div className="text-2xl font-bold font-mono text-fg">{formatINR(6500)}</div>
              <p className="text-xs text-fg-muted">Instalment 3 of 6 · Due 04 Oct 2026</p>
              <Button
                variant="primary"
                size="sm"
                className="w-full bg-success hover:bg-success/90"
                onClick={() => success('Launching UPI payment gateway (PhonePe/GPay)...')}
              >
                Pay via UPI / GPay
              </Button>
            </div>
          </div>
        )}

        {/* TAB 5: CERTIFICATE */}
        {activeTab === 'certificate' && (
          <div className="p-6 text-center rounded-card border border-border bg-surface space-y-3">
            <Award className="w-10 h-10 text-fg-muted mx-auto" />
            <h3 className="text-xs font-bold text-fg">Certificate in Progress</h3>
            <p className="text-xs text-fg-muted leading-relaxed">
              Complete remaining 60 hours and raise attendance above 80% to unlock cryptographic credential.
            </p>
          </div>
        )}
      </div>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-surface border-t border-border flex items-center justify-around py-2 text-xs">
        <button
          onClick={() => setActiveTab('today')}
          className={`flex flex-col items-center gap-1 ${
            activeTab === 'today' ? 'text-primary font-bold' : 'text-fg-muted'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span className="text-[10px]">Today</span>
        </button>

        <button
          onClick={() => setActiveTab('schedule')}
          className={`flex flex-col items-center gap-1 ${
            activeTab === 'schedule' ? 'text-primary font-bold' : 'text-fg-muted'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span className="text-[10px]">Schedule</span>
        </button>

        <button
          onClick={() => setActiveTab('fees')}
          className={`flex flex-col items-center gap-1 ${
            activeTab === 'fees' ? 'text-primary font-bold' : 'text-fg-muted'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span className="text-[10px]">Fees</span>
        </button>

        <button
          onClick={() => setActiveTab('certificate')}
          className={`flex flex-col items-center gap-1 ${
            activeTab === 'certificate' ? 'text-primary font-bold' : 'text-fg-muted'
          }`}
        >
          <Award className="w-4 h-4" />
          <span className="text-[10px]">Certificate</span>
        </button>
      </div>
    </div>
  )
}
