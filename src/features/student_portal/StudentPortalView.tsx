import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar,
  CreditCard,
  Award,
  Clock,
  QrCode,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  FileText,
  Play,
  BookOpen,
  ArrowRight,
  Download,
  Building2,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ReasonChip } from '@/components/ui/ReasonChip'
import { StatusPill } from '@/components/ui/StatusPill'
import { formatINR } from '@/lib/utils'
import { useToast } from '@/context/ToastContext'

export const StudentPortalView: React.FC = () => {
  const { success } = useToast()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'today' | 'schedule' | 'recordings' | 'fees' | 'certificate'>('today')

  return (
    <div className="w-full min-h-screen bg-canvas text-text select-none font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-[1360px] mx-auto space-y-6">
        {/* Desktop Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-control bg-surface-sunken border border-border text-text font-medium text-sm flex items-center justify-center shrink-0">
              PN
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-text">Priya Nair</h1>
                <span className="text-xs px-2 py-0.5 rounded-control bg-surface-sunken border border-border text-text-muted">
                  Roll #104
                </span>
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                Java Full-Stack B3 (Kothrud) · CodeCraft Academy Pune · Kothrud Campus
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<QrCode className="w-3.5 h-3.5" />}
              onClick={() => success('Checked into today\'s session via student GPS token.')}
            >
              Scan classroom QR
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<CreditCard className="w-3.5 h-3.5" />}
              onClick={() => setActiveTab('fees')}
            >
              Pay instalment
            </Button>
          </div>
        </div>

        {/* Desktop KPI Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-card border border-border bg-surface text-left">
            <span className="text-xs text-text-muted">Overall attendance</span>
            <div className="mt-2 text-2xl font-medium tracking-tight text-text tabular-nums">
              44.0%
            </div>
            <div className="mt-2 text-xs text-danger flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              <span>Target: 80% (3 missed)</span>
            </div>
          </div>

          <div className="p-4 rounded-card border border-border bg-surface text-left">
            <span className="text-xs text-text-muted">Next class session</span>
            <div className="mt-2 text-2xl font-medium tracking-tight text-text tabular-nums">
              Today 19:00
            </div>
            <div className="mt-2 text-xs text-text-muted">
              Room 3 · Faculty: Arjun Mehta
            </div>
          </div>

          <div className="p-4 rounded-card border border-border bg-surface text-left">
            <span className="text-xs text-text-muted">Syllabus completion</span>
            <div className="mt-2 text-2xl font-medium tracking-tight text-text tabular-nums">
              68.5%
            </div>
            <div className="mt-2 text-xs text-success">
              180 / 240 hours finished
            </div>
          </div>

          <div className="p-4 rounded-card border border-border bg-surface text-left">
            <span className="text-xs text-text-muted">Fee dues</span>
            <div className="mt-2 text-2xl font-medium tracking-tight text-text tabular-nums">
              {formatINR(6500)}
            </div>
            <div className="mt-2 text-xs text-danger">
              Instalment 3 · 12 days overdue
            </div>
          </div>
        </div>

        {/* Desktop Horizontal Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-border text-xs font-normal overflow-x-auto">
          <button
            onClick={() => setActiveTab('today')}
            className={`py-2 px-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'today'
                ? 'border-accent text-accent font-medium'
                : 'border-transparent text-text-muted hover:text-text'
            }`}
          >
            Today & overview
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`py-2 px-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'schedule'
                ? 'border-accent text-accent font-medium'
                : 'border-transparent text-text-muted hover:text-text'
            }`}
          >
            Weekly schedule
          </button>
          <button
            onClick={() => setActiveTab('recordings')}
            className={`py-2 px-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'recordings'
                ? 'border-accent text-accent font-medium'
                : 'border-transparent text-text-muted hover:text-text'
            }`}
          >
            Recorded lectures & catch-up
          </button>
          <button
            onClick={() => setActiveTab('fees')}
            className={`py-2 px-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'fees'
                ? 'border-accent text-accent font-medium'
                : 'border-transparent text-text-muted hover:text-text'
            }`}
          >
            Fees & receipts
          </button>
          <button
            onClick={() => setActiveTab('certificate')}
            className={`py-2 px-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'certificate'
                ? 'border-accent text-accent font-medium'
                : 'border-transparent text-text-muted hover:text-text'
            }`}
          >
            Credential & certificate
          </button>
        </div>

        {/* TAB 1: TODAY & OVERVIEW (12 COLUMNS) */}
        {activeTab === 'today' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Main (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              {/* Today's Class Card */}
              <div className="p-5 rounded-card border border-border bg-surface space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-text-muted">
                    Today's live class · 19:00 – 21:00 IST
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-accent">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                    Scheduled on timetable
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-text">
                      Spring Data JPA Repositories
                    </h3>
                    <p className="text-xs text-text-muted mt-1">
                      Room 3 (Kothrud Campus) · Faculty: Arjun Mehta · Hybrid Classroom
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => success('Checked into class via student session token.')}
                    leftIcon={<QrCode className="w-4 h-4" />}
                  >
                    Check into classroom
                  </Button>
                </div>
              </div>

              {/* Next Sessions Preview Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-text">Upcoming batch sessions</h2>
                  <span className="text-xs text-text-muted">Java Full-Stack B3 (Kothrud)</span>
                </div>

                <div className="border border-border rounded-card bg-surface overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-surface-sunken border-b border-border text-text-muted">
                      <tr>
                        <th className="py-2.5 px-3 font-medium">Session topic</th>
                        <th className="py-2.5 px-3 font-medium">Date & Time</th>
                        <th className="py-2.5 px-3 font-medium">Room</th>
                        <th className="py-2.5 px-3 font-medium">Instructor</th>
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
                        <td className="py-3 px-3 font-medium text-text">Spring Security & JWT</td>
                        <td className="py-3 px-3 tabular-nums text-text">Fri, 17 Oct · 19:00 – 21:00</td>
                        <td className="py-3 px-3 text-text-muted">Room 3</td>
                        <td className="py-3 px-3 text-text">Arjun Mehta</td>
                        <td className="py-3 px-3 text-right">
                          <StatusPill status="scheduled" />
                        </td>
                      </tr>
                      <tr className="hover:bg-surface-sunken/40">
                        <td className="py-3 px-3 font-medium text-text">Database Transactions & Locks</td>
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
            </div>

            {/* Right Sidebar (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              {/* Attendance Placement Alert Card */}
              <div className="p-5 rounded-card border border-warning/40 bg-surface space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-warning flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Attendance qualification warning
                  </span>
                  <span className="tabular-nums font-semibold text-warning">44% / 80%</span>
                </div>
                <div className="w-full h-2 bg-surface-sunken rounded-full overflow-hidden">
                  <div className="h-full bg-warning rounded-full" style={{ width: '44%' }} />
                </div>
                <p className="text-text-muted leading-relaxed">
                  You missed 3 classes last week. Please watch catch-up recordings to restore placement qualification eligibility above 80%.
                </p>
                <Button
                  variant="secondary"
                  size="xs"
                  className="w-full"
                  onClick={() => setActiveTab('recordings')}
                >
                  Go to catch-up recordings
                </Button>
              </div>

              {/* Tuition Fees Card */}
              <div className="p-5 rounded-card border border-border bg-surface space-y-3.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-text">Outstanding tuition instalment</span>
                  <span className="text-danger font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3" /> 12 days overdue
                  </span>
                </div>

                <div className="text-2xl font-semibold text-text tabular-nums">
                  {formatINR(6500)}
                </div>
                <p className="text-text-muted">Instalment 3 of 6 · Due 04 Oct 2026</p>

                <Button
                  variant="primary"
                  size="sm"
                  className="w-full"
                  onClick={() => success('Launching UPI gateway (PhonePe/GPay)...')}
                >
                  Pay via UPI / GPay
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: WEEKLY SCHEDULE */}
        {activeTab === 'schedule' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-text">Weekly timetable schedule</h2>
                <p className="text-xs text-text-muted">Cohort: Java Full-Stack B3 (Kothrud Campus)</p>
              </div>
              <ReasonChip reason="Arjun on medical leave Thu · Class moved to Fri 19:00" />
            </div>

            <div className="border border-border rounded-card bg-surface overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-surface-sunken border-b border-border text-text-muted">
                  <tr>
                    <th className="py-3 px-4 font-medium">Day</th>
                    <th className="py-3 px-4 font-medium">Time (IST)</th>
                    <th className="py-3 px-4 font-medium">Session topic</th>
                    <th className="py-3 px-4 font-medium">Campus & Room</th>
                    <th className="py-3 px-4 font-medium">Instructor</th>
                    <th className="py-3 px-4 text-right font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr className="hover:bg-surface-sunken/40">
                    <td className="py-3 px-4 font-medium text-text">Thursday</td>
                    <td className="py-3 px-4 tabular-nums text-text">19:00 – 21:00</td>
                    <td className="py-3 px-4 font-medium text-text">Spring Data JPA Repositories</td>
                    <td className="py-3 px-4 text-text-muted">Kothrud · Room 3</td>
                    <td className="py-3 px-4 text-text">Arjun Mehta</td>
                    <td className="py-3 px-4 text-right">
                      <StatusPill status="in_progress" />
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-sunken/40 bg-surface-sunken/20">
                    <td className="py-3 px-4 font-medium text-text">Friday (Rescheduled)</td>
                    <td className="py-3 px-4 tabular-nums text-text">19:00 – 21:00</td>
                    <td className="py-3 px-4 font-medium text-text">
                      Spring Security & JWT Authentication
                    </td>
                    <td className="py-3 px-4 text-text-muted">Kothrud · Room 3</td>
                    <td className="py-3 px-4 text-text">Arjun Mehta</td>
                    <td className="py-3 px-4 text-right">
                      <StatusPill status="scheduled" />
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-sunken/40">
                    <td className="py-3 px-4 font-medium text-text">Saturday</td>
                    <td className="py-3 px-4 tabular-nums text-text">11:00 – 13:00</td>
                    <td className="py-3 px-4 font-medium text-text">Database Transactions & Concurrency</td>
                    <td className="py-3 px-4 text-text-muted">Kothrud · Lab 2</td>
                    <td className="py-3 px-4 text-text">Arjun Mehta</td>
                    <td className="py-3 px-4 text-right">
                      <StatusPill status="scheduled" />
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-sunken/40">
                    <td className="py-3 px-4 font-medium text-text">Monday</td>
                    <td className="py-3 px-4 tabular-nums text-text">19:00 – 21:00</td>
                    <td className="py-3 px-4 font-medium text-text">RESTful Microservices with Docker</td>
                    <td className="py-3 px-4 text-text-muted">Kothrud · Room 3</td>
                    <td className="py-3 px-4 text-text">Arjun Mehta</td>
                    <td className="py-3 px-4 text-right">
                      <StatusPill status="scheduled" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: RECORDED LECTURES & CATCH-UP */}
        {activeTab === 'recordings' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-text">Class recordings & catch-up queue</h2>
              <p className="text-xs text-text-muted">
                Completed recordings for your batch. Watching missed lectures helps recover academic attendance.
              </p>
            </div>

            <div className="border border-border rounded-card bg-surface overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-surface-sunken border-b border-border text-text-muted">
                  <tr>
                    <th className="py-3 px-4 font-medium">Lecture topic</th>
                    <th className="py-3 px-4 font-medium">Session date</th>
                    <th className="py-3 px-4 font-medium">Duration</th>
                    <th className="py-3 px-4 font-medium">Attendance status</th>
                    <th className="py-3 px-4 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr className="hover:bg-surface-sunken/40">
                    <td className="py-3.5 px-4 font-medium text-text">
                      Core Java: Streams, Lambdas & Concurrency
                    </td>
                    <td className="py-3.5 px-4 text-text-muted">14 Oct 2026</td>
                    <td className="py-3.5 px-4 tabular-nums text-text-muted">1h 52m</td>
                    <td className="py-3.5 px-4">
                      <span className="text-danger font-medium flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Missed
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant="secondary"
                        size="xs"
                        leftIcon={<Play className="w-3.5 h-3.5 text-accent" />}
                        onClick={() => success('Launching recording: Streams & Concurrency...')}
                      >
                        Watch recording
                      </Button>
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-sunken/40">
                    <td className="py-3.5 px-4 font-medium text-text">
                      Hibernate ORM & Entity Mapping
                    </td>
                    <td className="py-3.5 px-4 text-text-muted">12 Oct 2026</td>
                    <td className="py-3.5 px-4 tabular-nums text-text-muted">2h 05m</td>
                    <td className="py-3.5 px-4">
                      <span className="text-danger font-medium flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Missed
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant="secondary"
                        size="xs"
                        leftIcon={<Play className="w-3.5 h-3.5 text-accent" />}
                        onClick={() => success('Launching recording: Hibernate ORM...')}
                      >
                        Watch recording
                      </Button>
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-sunken/40">
                    <td className="py-3.5 px-4 font-medium text-text">
                      Spring Boot Core Annotations & IoC
                    </td>
                    <td className="py-3.5 px-4 text-text-muted">10 Oct 2026</td>
                    <td className="py-3.5 px-4 tabular-nums text-text-muted">1h 48m</td>
                    <td className="py-3.5 px-4">
                      <span className="text-success font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Attended
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => success('Reviewing notes & slides for IoC Container...')}
                      >
                        Review
                      </Button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: FEES & RECEIPTS */}
        {activeTab === 'fees' && (
          <div className="space-y-6">
            <div className="p-5 rounded-card border border-border bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs text-text-muted">Total course fee structure</span>
                <div className="text-2xl font-semibold text-text tabular-nums mt-1">
                  {formatINR(75000)}
                </div>
                <p className="text-xs text-text-muted mt-0.5">
                  6 monthly instalments of ₹6,500 · ₹39,000 paid to date
                </p>
              </div>

              <div className="p-4 rounded-control bg-surface-sunken border border-border text-xs space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-medium text-text">Current due instalment:</span>
                  <span className="font-semibold text-danger tabular-nums">{formatINR(6500)}</span>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full"
                  onClick={() => success('Opening UPI payment interface...')}
                >
                  Pay instalment now
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-text">Instalment ledger & receipt vouchers</h3>
              <div className="border border-border rounded-card bg-surface overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-surface-sunken border-b border-border text-text-muted">
                    <tr>
                      <th className="py-3 px-4 font-medium">Instalment</th>
                      <th className="py-3 px-4 font-medium">Due Date</th>
                      <th className="py-3 px-4 font-medium">Amount</th>
                      <th className="py-3 px-4 font-medium">Payment status</th>
                      <th className="py-3 px-4 font-medium">Receipt No.</th>
                      <th className="py-3 px-4 text-right font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr className="hover:bg-surface-sunken/40">
                      <td className="py-3 px-4 font-medium text-text">Instalment 1 of 6</td>
                      <td className="py-3 px-4 text-text-muted">04 Aug 2026</td>
                      <td className="py-3 px-4 tabular-nums text-text">{formatINR(6500)}</td>
                      <td className="py-3 px-4">
                        <span className="text-success font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Paid
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-text-muted">REC-2026-0801</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => success('Downloading receipt PDF: REC-2026-0801')}
                          className="text-accent hover:underline inline-flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" /> PDF
                        </button>
                      </td>
                    </tr>
                    <tr className="hover:bg-surface-sunken/40">
                      <td className="py-3 px-4 font-medium text-text">Instalment 2 of 6</td>
                      <td className="py-3 px-4 text-text-muted">04 Sep 2026</td>
                      <td className="py-3 px-4 tabular-nums text-text">{formatINR(6500)}</td>
                      <td className="py-3 px-4">
                        <span className="text-success font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Paid
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-text-muted">REC-2026-0902</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => success('Downloading receipt PDF: REC-2026-0902')}
                          className="text-accent hover:underline inline-flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" /> PDF
                        </button>
                      </td>
                    </tr>
                    <tr className="hover:bg-surface-sunken/40 bg-surface-sunken/20">
                      <td className="py-3 px-4 font-medium text-text">Instalment 3 of 6</td>
                      <td className="py-3 px-4 text-danger font-medium">04 Oct 2026</td>
                      <td className="py-3 px-4 tabular-nums text-text font-semibold">{formatINR(6500)}</td>
                      <td className="py-3 px-4">
                        <span className="text-danger font-medium flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Overdue (12 days)
                        </span>
                      </td>
                      <td className="py-3 px-4 text-text-muted">—</td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="primary"
                          size="xs"
                          onClick={() => success('Opening UPI payment interface...')}
                        >
                          Pay
                        </Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: CERTIFICATE */}
        {activeTab === 'certificate' && (
          <div className="max-w-2xl mx-auto p-8 rounded-card border border-border bg-surface text-center space-y-4">
            <Award className="w-12 h-12 text-text-muted mx-auto" />
            <h2 className="text-base font-semibold text-text">Diploma certificate in progress</h2>
            <p className="text-xs text-text-muted leading-relaxed">
              Upon completing the 240 syllabus hours of Java Full-Stack Development and raising your overall attendance above 80%, your verifiable cryptographic credential will be minted.
            </p>

            <div className="p-4 rounded-control bg-surface-sunken border border-border text-left space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Syllabus hours:</span>
                <span className="font-medium text-text tabular-nums">180 / 240 hrs completed</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Attendance benchmark:</span>
                <span className="font-medium text-warning tabular-nums">44% (80% required)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Capstone project:</span>
                <span className="font-medium text-text">In evaluation</span>
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setActiveTab('recordings')}
              leftIcon={<Play className="w-3.5 h-3.5 text-accent" />}
            >
              Watch catch-up sessions to raise attendance
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
