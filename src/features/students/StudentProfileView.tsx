import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  MessageSquare,
  Sparkles,
  Plus,
  Calendar,
  CreditCard,
  AlertTriangle,
  FileText,
  Clock,
  CheckCircle2,
  Phone,
  Mail,
  Building2,
  Layers,
  ShieldAlert,
} from 'lucide-react'
import { StatusPill } from '@/components/ui/StatusPill'
import { ReasonChip } from '@/components/ui/ReasonChip'
import { Button } from '@/components/ui/Button'
import { useApp } from '@/context/AppContext'
import { useToast } from '@/context/ToastContext'
import { store } from '@/mocks/store'
import { formatINR, maskPhone } from '@/lib/utils'

export const StudentProfileView: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { role, setCopilotOpen } = useApp()
  const { success } = useToast()

  const [activeTab, setActiveTab] = useState<
    'overview' | 'attendance' | 'fees' | 'assignments' | 'risk' | 'notes' | 'activity'
  >('overview')
  const [newNote, setNewNote] = useState('')

  const student = store.students.find((s) => s.id === id) || store.students[0]
  const feeInstalments = store.feeInstalments.filter((f) => f.studentId === student.id)

  const handleAddNote = () => {
    if (!newNote.trim()) return
    store.addStudentNote(student.id, newNote)
    setNewNote('')
    success('Counselor note added')
  }

  return (
    <div className="space-y-5 animate-fade-in select-none">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate('/students')}
          className="text-xs text-fg-muted hover:text-fg inline-flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Students</span>
        </button>
      </div>

      {/* Header Card */}
      <div className="p-5 rounded-card border border-border bg-surface shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-base flex items-center justify-center shrink-0">
              {student.avatar || student.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-fg">{student.name}</h1>
                <StatusPill status={student.riskLevel} size="sm" />
                {role !== 'trainer' && <StatusPill status={student.feeStatus} size="sm" />}
              </div>
              <p className="text-xs text-fg-muted mt-0.5">
                {student.batchNames.join(', ')} · Enrolled {student.enrolledAt}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setActiveTab('notes')
              }}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Note
            </Button>

            <Button
              variant="ai"
              size="sm"
              onClick={() => setCopilotOpen(true)}
              leftIcon={<Sparkles className="w-3.5 h-3.5" />}
            >
              Ask Copilot about {student.name.split(' ')[0]}
            </Button>
          </div>
        </div>

        {/* Quick Contact & Meta info */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-border text-xs">
          <div className="flex items-center gap-2 text-fg-muted">
            <Phone className="w-3.5 h-3.5 text-primary" />
            <span className="font-mono">{maskPhone(student.phone)}</span>
          </div>
          <div className="flex items-center gap-2 text-fg-muted">
            <Mail className="w-3.5 h-3.5 text-primary" />
            <span className="truncate">{student.email}</span>
          </div>
          <div className="flex items-center gap-2 text-fg-muted">
            <Building2 className="w-3.5 h-3.5 text-primary" />
            <span>{student.branch} Campus</span>
          </div>
          <div className="flex items-center gap-2 text-fg-muted">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span>Last seen {student.lastSeen}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border text-xs font-medium overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-2 px-3 border-b-2 transition-colors ${
            activeTab === 'overview'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-fg-muted hover:text-fg'
          }`}
        >
          Overview
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`py-2 px-3 border-b-2 transition-colors ${
            activeTab === 'attendance'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-fg-muted hover:text-fg'
          }`}
        >
          Attendance
        </button>

        {role !== 'trainer' && (
          <button
            onClick={() => setActiveTab('fees')}
            className={`py-2 px-3 border-b-2 transition-colors ${
              activeTab === 'fees'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-fg-muted hover:text-fg'
            }`}
          >
            Fees & EMIs
          </button>
        )}

        <button
          onClick={() => setActiveTab('risk')}
          className={`py-2 px-3 border-b-2 transition-colors ${
            activeTab === 'risk'
              ? 'border-danger text-danger font-semibold'
              : 'border-transparent text-fg-muted hover:text-fg'
          }`}
        >
          Risk Diagnostics
        </button>

        <button
          onClick={() => setActiveTab('notes')}
          className={`py-2 px-3 border-b-2 transition-colors ${
            activeTab === 'notes'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-fg-muted hover:text-fg'
          }`}
        >
          Counselor Notes ({student.notes?.length || 0})
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div className="p-4 rounded-card border border-border bg-surface space-y-3">
              <h3 className="text-xs font-semibold text-fg uppercase tracking-wider font-mono">
                Academic Progress & Attendance Summary
              </h3>
              <div className="flex items-center gap-4">
                <div className="text-3xl font-bold font-mono text-fg tnum">
                  {student.attendanceRate}%
                </div>
                <div className="flex-1 space-y-1">
                  <div className="w-full h-2 rounded-full bg-surface-2 overflow-hidden border border-border">
                    <div
                      className={`h-full ${
                        student.attendanceRate < 60
                          ? 'bg-danger'
                          : student.attendanceRate < 75
                          ? 'bg-warning'
                          : 'bg-success'
                      }`}
                      style={{ width: `${student.attendanceRate}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-fg-muted">
                    Requirement: Minimum 80% to qualify for final certification
                  </div>
                </div>
              </div>
            </div>

            {/* Risk Reasons */}
            <div className="p-4 rounded-card border border-border bg-surface space-y-3">
              <h3 className="text-xs font-semibold text-fg uppercase tracking-wider font-mono">
                Active Attention Flags
              </h3>
              <div className="space-y-2">
                {student.riskReasons.map((r, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-btn bg-surface-2 border border-border flex items-center justify-between text-xs"
                  >
                    <span className="text-fg">{r}</span>
                    <ReasonChip reason={student.riskLevel} variant="warning" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-card border border-border bg-surface space-y-3">
              <h3 className="text-xs font-semibold text-fg uppercase tracking-wider font-mono">
                Enrolled Modules
              </h3>
              <div className="space-y-2 text-xs">
                <div className="p-2 rounded bg-surface-2 border border-border">
                  <div className="font-semibold text-fg">Java Full-Stack B3</div>
                  <div className="text-[11px] text-fg-muted">Trainer: Arjun Mehta</div>
                  <div className="mt-1 text-primary text-[11px]">Module 2: Spring Data JPA</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Attendance Calendar Heatmap */}
      {activeTab === 'attendance' && (
        <div className="p-4 rounded-card border border-border bg-surface space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-fg">Session-by-Session Attendance Ledger</h3>
            <span className="text-xs font-mono text-fg-muted">18 of 32 sessions attended</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {[...Array(18)].map((_, i) => {
              const isAbsent = i === 12 || i === 14 || i === 15 || i === 16 || i === 17
              return (
                <div
                  key={i}
                  className={`p-2.5 rounded-btn border text-xs text-center space-y-1 ${
                    isAbsent
                      ? 'border-danger/40 bg-danger/10 text-danger'
                      : 'border-success/30 bg-success/10 text-success'
                  }`}
                >
                  <div className="text-[10px] font-mono">Session #{i + 1}</div>
                  <div className="font-bold">{isAbsent ? 'Absent ○' : 'Present ●'}</div>
                  <div className="text-[10px] text-fg-muted font-mono">
                    {isAbsent ? 'Unexcused' : 'In-person QR'}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Fees (Hidden for trainer) */}
      {activeTab === 'fees' && role !== 'trainer' && (
        <div className="p-4 rounded-card border border-border bg-surface space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-fg">Instalment Schedule & Receipts</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => success('Generating fee statement PDF...')}
            >
              Download Ledger
            </Button>
          </div>

          <table className="w-full text-xs text-left">
            <thead className="bg-surface-2 text-[11px] text-fg-muted border-b border-border">
              <tr>
                <th className="py-2 px-3">Instalment</th>
                <th className="py-2 px-3">Due Date</th>
                <th className="py-2 px-3">Amount</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {feeInstalments.map((f) => (
                <tr key={f.id} className="hover:bg-surface-2/50">
                  <td className="py-2.5 px-3 font-medium text-fg">{f.sequence}</td>
                  <td className="py-2.5 px-3 font-mono text-fg-muted">{f.dueDate}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-fg">
                    {formatINR(f.amount)}
                  </td>
                  <td className="py-2.5 px-3">
                    <StatusPill status={f.status} size="sm" />
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-primary">
                    {f.receiptNo || 'Pending'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 5: Risk Diagnostics */}
      {activeTab === 'risk' && (
        <div className="p-4 rounded-card border border-border bg-surface space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full border-4 border-danger flex flex-col items-center justify-center bg-danger/10 text-danger shrink-0">
              <span className="text-2xl font-bold font-mono leading-none">{student.riskScore}</span>
              <span className="text-[9px] uppercase font-bold tracking-wider">Score</span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-fg">Calculated Risk Score: {student.riskScore}/100</h3>
              <p className="text-xs text-fg-muted mt-1 leading-relaxed">
                Risk score triggers automatically when attendance drops below 75% or instalments cross due dates.
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-semibold text-fg">Diagnosed Risk Drivers</h4>
            {student.riskReasons.map((r, i) => (
              <div key={i} className="p-3 rounded-btn bg-surface-2 border border-border text-xs flex items-center justify-between">
                <span>{r}</span>
                <ReasonChip reason="High Impact" variant="danger" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: Notes */}
      {activeTab === 'notes' && (
        <div className="p-4 rounded-card border border-border bg-surface space-y-4">
          <h3 className="text-xs font-semibold text-fg uppercase tracking-wider font-mono">
            Internal Counselor & Faculty Notes
          </h3>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Record a follow-up conversation or call outcome..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="flex-1 bg-surface-2 border border-border rounded-btn px-3 py-2 text-xs text-fg outline-none focus:border-primary"
            />
            <Button variant="primary" size="sm" onClick={handleAddNote}>
              Post Note
            </Button>
          </div>

          <div className="space-y-2.5 pt-2">
            {student.notes?.map((n) => (
              <div key={n.id} className="p-3 rounded-btn bg-surface-2 border border-border text-xs space-y-1">
                <div className="flex items-center justify-between text-[11px] text-fg-muted">
                  <span className="font-semibold text-fg">{n.author} ({n.authorRole})</span>
                  <span>{n.createdAt}</span>
                </div>
                <p className="text-fg">{n.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
