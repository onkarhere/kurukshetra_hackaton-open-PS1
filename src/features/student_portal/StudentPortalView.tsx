import React, { useState } from 'react'
import {
  Calendar,
  CreditCard,
  Award,
  Clock,
  QrCode,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ReasonChip } from '@/components/ui/ReasonChip'
import { formatINR } from '@/lib/utils'
import { useToast } from '@/context/ToastContext'

export const StudentPortalView: React.FC = () => {
  const { success } = useToast()
  const [activeTab, setActiveTab] = useState<'today' | 'schedule' | 'fees' | 'certificate'>('today')

  return (
    <div className="max-w-md mx-auto min-h-screen bg-canvas text-text flex flex-col justify-between select-none font-sans pb-20">
      {/* Top Header */}
      <div className="p-4 border-b border-border bg-surface flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-control bg-surface-sunken border border-border text-text font-medium text-xs flex items-center justify-center">
            PN
          </div>
          <div>
            <div className="font-medium text-sm text-text">Priya Nair</div>
            <div className="text-xs text-text-muted">
              Java Full-Stack B3 (Kothrud) · <span className="font-mono text-[11px]">#104</span>
            </div>
          </div>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-control bg-surface-sunken border border-border text-text-muted font-normal">
          Kothrud
        </span>
      </div>

      {/* Main Tab Content */}
      <div className="p-4 space-y-4 flex-1 overflow-y-auto">
        {/* TAB 1: TODAY */}
        {activeTab === 'today' && (
          <div className="space-y-4">
            <div className="p-4 rounded-card border border-border bg-surface space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-text-muted">
                  Today · 19:00 IST
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-accent">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                  Scheduled
                </span>
              </div>
              <h3 className="text-base font-medium text-text">Spring Data JPA Repositories</h3>
              <p className="text-xs text-text-muted">
                Room 3 (Kothrud Campus) · Faculty: Arjun Mehta
              </p>
              <div className="pt-1">
                <Button
                  variant="primary"
                  size="md"
                  className="w-full"
                  leftIcon={<QrCode className="w-4 h-4" />}
                  onClick={() => success('Checked into class via student session token.')}
                >
                  Scan classroom QR code
                </Button>
              </div>
            </div>

            {/* Attendance & Catch-up Card */}
            <div className="p-4 rounded-card border border-border bg-surface space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-text">Current attendance: <span className="tabular-nums font-medium">44%</span></span>
                <span className="text-xs text-text-muted">Target 80%</span>
              </div>
              <div className="w-full h-1.5 bg-surface-sunken rounded-full overflow-hidden">
                <div className="h-full bg-warning rounded-full" style={{ width: '44%' }} />
              </div>
              <p className="text-xs text-text-muted leading-relaxed pt-1">
                3 or more classes missed last week. Recordings available for catch-up to remain eligible for placement drives.
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: SCHEDULE */}
        {activeTab === 'schedule' && (
          <div className="space-y-3">
            <div className="text-xs font-medium text-text-muted">
              Class schedule
            </div>

            {/* Changed Banner */}
            <div className="p-3 rounded-card border border-border bg-surface-sunken space-y-1.5 text-xs">
              <div className="font-medium text-text flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-info" />
                Schedule adjustment notice
              </div>
              <p className="text-text-muted leading-relaxed">
                Thursday class rescheduled to Friday 19:00 in Room 3 due to faculty leave.
              </p>
              <div className="pt-1">
                <ReasonChip reason="Arjun on medical leave Thu" />
              </div>
            </div>

            <div className="p-3 rounded-card border border-border bg-surface text-xs space-y-1">
              <div className="flex items-center justify-between font-medium text-text">
                <span>Friday session</span>
                <span className="text-text-muted tabular-nums">19:00 – 21:00</span>
              </div>
              <div className="text-text-muted">Java Full-Stack B3 (Kothrud) · Room 3</div>
            </div>

            <div className="p-3 rounded-card border border-border bg-surface text-xs space-y-1">
              <div className="flex items-center justify-between font-medium text-text">
                <span>Saturday session</span>
                <span className="text-text-muted tabular-nums">11:00 – 13:00</span>
              </div>
              <div className="text-text-muted">Java Full-Stack B3 (Kothrud) · Lab 2</div>
            </div>
          </div>
        )}

        {/* TAB 3: FEES */}
        {activeTab === 'fees' && (
          <div className="space-y-4">
            <div className="p-4 rounded-card border border-border bg-surface space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-text">Outstanding instalment</span>
                <span className="text-danger font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  12 days overdue
                </span>
              </div>
              <div className="text-2xl font-medium tracking-tight text-text tabular-nums">
                {formatINR(6500)}
              </div>
              <p className="text-xs text-text-muted">Instalment 3 of 6 · Due 04 Oct 2026</p>
              <div className="pt-1">
                <Button
                  variant="primary"
                  size="md"
                  className="w-full"
                  onClick={() => success('Opening UPI payment interface...')}
                >
                  Pay instalment
                </Button>
              </div>
            </div>

            <div className="border border-border rounded-card bg-surface divide-y divide-border text-xs">
              <div className="p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium text-text">Instalment 1 of 6</div>
                  <div className="text-text-muted">Paid 04 Aug 2026 · <span className="font-mono text-[11px]">REC-2026-0801</span></div>
                </div>
                <div className="text-right">
                  <div className="tabular-nums font-medium text-text">{formatINR(6500)}</div>
                  <span className="text-success text-[11px] flex items-center justify-end gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Paid
                  </span>
                </div>
              </div>
              <div className="p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium text-text">Instalment 2 of 6</div>
                  <div className="text-text-muted">Paid 04 Sep 2026 · <span className="font-mono text-[11px]">REC-2026-0902</span></div>
                </div>
                <div className="text-right">
                  <div className="tabular-nums font-medium text-text">{formatINR(6500)}</div>
                  <span className="text-success text-[11px] flex items-center justify-end gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Paid
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CERTIFICATE */}
        {activeTab === 'certificate' && (
          <div className="p-6 text-center rounded-card border border-border bg-surface space-y-3">
            <Award className="w-8 h-8 text-text-muted mx-auto" />
            <h3 className="text-sm font-medium text-text">Certificate in progress</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Complete the remaining 60 syllabus hours and maintain at least 80% attendance to receive your certificate.
            </p>
            <div className="pt-2">
              <div className="inline-flex items-center gap-1.5 text-xs text-text-muted bg-surface-sunken px-2.5 py-1 rounded-control border border-border">
                <FileText className="w-3.5 h-3.5" />
                <span>Verification code will be generated upon completion</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-surface border-t border-border flex items-center justify-around h-14 text-xs">
        <button
          onClick={() => setActiveTab('today')}
          className={`flex flex-col items-center justify-center h-full px-3 gap-0.5 transition-colors ${
            activeTab === 'today' ? 'text-accent font-medium' : 'text-text-muted hover:text-text'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span className="text-[11px]">Today</span>
        </button>

        <button
          onClick={() => setActiveTab('schedule')}
          className={`flex flex-col items-center justify-center h-full px-3 gap-0.5 transition-colors ${
            activeTab === 'schedule' ? 'text-accent font-medium' : 'text-text-muted hover:text-text'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span className="text-[11px]">Schedule</span>
        </button>

        <button
          onClick={() => setActiveTab('fees')}
          className={`flex flex-col items-center justify-center h-full px-3 gap-0.5 transition-colors ${
            activeTab === 'fees' ? 'text-accent font-medium' : 'text-text-muted hover:text-text'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span className="text-[11px]">Fees</span>
        </button>

        <button
          onClick={() => setActiveTab('certificate')}
          className={`flex flex-col items-center justify-center h-full px-3 gap-0.5 transition-colors ${
            activeTab === 'certificate' ? 'text-accent font-medium' : 'text-text-muted hover:text-text'
          }`}
        >
          <Award className="w-4 h-4" />
          <span className="text-[11px]">Certificate</span>
        </button>
      </div>
    </div>
  )
}
