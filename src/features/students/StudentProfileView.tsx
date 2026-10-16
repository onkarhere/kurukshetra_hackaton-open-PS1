import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Plus,
  Calendar,
  Clock,
  Phone,
  Mail,
  Building2,
  CheckCircle2,
  AlertOctagon,
  AlertTriangle,
  Command,
} from 'lucide-react'
import { ReasonChip } from '@/components/ui/ReasonChip'
import { Button } from '@/components/ui/Button'
import { useApp } from '@/context/AppContext'
import { useToast } from '@/context/ToastContext'
import { store } from '@/mocks/store'
import { formatINR, maskPhone, cn } from '@/lib/utils'

export const StudentProfileView: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { role, setPendingAskQuery, setCopilotOpen } = useApp()
  const { success } = useToast()

  const [activeTab, setActiveTab] = useState<
    'overview' | 'attendance' | 'fees' | 'risk' | 'notes'
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

  const handleAskAboutStudent = () => {
    setPendingAskQuery(`Show attendance and risk diagnostic for student ${student.name}`)
    setCopilotOpen(true)
  }

  return (
    <div className="space-y-4">
      {/* Back link */}
      <div>
        <button
          onClick={() => navigate('/students')}
          className="text-xs text-text-muted hover:text-text inline-flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to students</span>
        </button>
      </div>

      {/* Header Card */}
      <div className="p-4 rounded-card border border-border bg-surface space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-border bg-surface-sunken text-text font-medium text-sm flex items-center justify-center shrink-0">
              {student.avatar || student.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold text-text">{student.name}</h1>
                <span className="text-xs font-mono text-text-muted">ID: {student.id}</span>
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                {student.batchNames.join(', ')} · Enrolled {student.enrolledAt}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleAskAboutStudent}
              leftIcon={<Command className="w-3.5 h-3.5" />}
            >
              Ask about {student.name.split(' ')[0]}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setActiveTab('notes')}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add note
            </Button>
          </div>
        </div>

        {/* Contact info row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-border text-xs">
          <div className="flex items-center gap-1.5 text-text-muted">
            <Phone className="w-3.5 h-3.5" />
            <span className="font-mono text-[11px]">{maskPhone(student.phone)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-text-muted">
            <Mail className="w-3.5 h-3.5" />
            <span className="truncate">{student.email}</span>
          </div>
          <div className="flex items-center gap-1.5 text-text-muted">
            <Building2 className="w-3.5 h-3.5" />
            <span>{student.branch} Campus</span>
          </div>
          <div className="flex items-center gap-1.5 text-text-muted">
            <Clock className="w-3.5 h-3.5" />
            <span>Last seen {student.lastSeen}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border text-xs font-medium">
        <button
          onClick={() => setActiveTab('overview')}
          className={cn(
            'py-2 px-3 border-b-2 transition-colors',
            activeTab === 'overview'
              ? 'border-accent text-text font-semibold'
              : 'border-transparent text-text-muted hover:text-text'
          )}
        >
          Overview
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={cn(
            'py-2 px-3 border-b-2 transition-colors',
            activeTab === 'attendance'
              ? 'border-accent text-text font-semibold'
              : 'border-transparent text-text-muted hover:text-text'
          )}
        >
          Attendance
        </button>

        {role !== 'trainer' && (
          <button
            onClick={() => setActiveTab('fees')}
            className={cn(
              'py-2 px-3 border-b-2 transition-colors',
              activeTab === 'fees'
                ? 'border-accent text-text font-semibold'
                : 'border-transparent text-text-muted hover:text-text'
            )}
          >
            Fees & EMIs
          </button>
        )}

        <button
          onClick={() => setActiveTab('risk')}
          className={cn(
            'py-2 px-3 border-b-2 transition-colors',
            activeTab === 'risk'
              ? 'border-accent text-text font-semibold'
              : 'border-transparent text-text-muted hover:text-text'
          )}
        >
          Risk diagnostics
        </button>

        <button
          onClick={() => setActiveTab('notes')}
          className={cn(
            'py-2 px-3 border-b-2 transition-colors',
            activeTab === 'notes'
              ? 'border-accent text-text font-semibold'
              : 'border-transparent text-text-muted hover:text-text'
          )}
        >
          Counselor notes ({student.notes?.length || 0})
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div className="p-4 rounded-card border border-border bg-surface space-y-3">
              <h3 className="text-xs font-semibold text-text uppercase tracking-wider">
                Academic progress & attendance rate
              </h3>
              <div className="flex items-center gap-4">
                <div className="text-2xl font-semibold tabular-nums text-text">
                  {student.attendanceRate}%
                </div>
                <div className="flex-1 space-y-1">
                  <div className="w-full h-1.5 rounded-full bg-surface-sunken overflow-hidden border border-border">
                    <div
                      className={cn(
                        'h-full',
                        student.attendanceRate < 60
                          ? 'bg-danger'
                          : student.attendanceRate < 75
                          ? 'bg-warning'
                          : 'bg-accent'
                      )}
                      style={{ width: `${student.attendanceRate}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-text-muted">
                    Institute benchmark: 80% minimum attendance for certificate eligibility
                  </div>
                </div>
              </div>
            </div>

            {/* Risk Reasons */}
            <div className="p-4 rounded-card border border-border bg-surface space-y-3">
              <h3 className="text-xs font-semibold text-text uppercase tracking-wider">
                Attention flags
              </h3>
              <div className="space-y-2">
                {student.riskReasons.map((r, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-control bg-surface-sunken border border-border flex items-center justify-between text-xs"
                  >
                    <span className="text-text">{r}</span>
                    <ReasonChip reason={student.riskLevel} variant="warning" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-card border border-border bg-surface space-y-3">
              <h3 className="text-xs font-semibold text-text uppercase tracking-wider">
                Enrolled batch
              </h3>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-control bg-surface-sunken border border-border">
                  <div className="font-medium text-text">
                    Java Full-Stack B3 (Kothrud)
                  </div>
                  <div className="text-[11px] text-text-muted mt-0.5">Trainer: Arjun Mehta</div>
                  <div className="text-[11px] text-accent mt-1">Module 2: Spring Data JPA</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Attendance Ledger (clickable rows without extra drill column) */}
      {activeTab === 'attendance' && (
        <div className="p-4 rounded-card border border-border bg-surface space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h3 className="text-xs font-semibold text-text">Session attendance ledger</h3>
            <span className="text-xs tabular-nums text-text-muted">18 of 32 sessions attended</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {[...Array(18)].map((_, i) => {
              const isAbsent = i === 12 || i === 14 || i === 15 || i === 16 || i === 17
              return (
                <div
                  key={i}
                  onClick={() => navigate('/sessions/sess-m2')}
                  className={cn(
                    'p-2.5 rounded-control border text-xs cursor-pointer transition-colors text-center space-y-0.5',
                    isAbsent
                      ? 'border-border bg-surface-sunken text-danger'
                      : 'border-border bg-surface hover:bg-surface-sunken text-text'
                  )}
                >
                  <div className="text-[10px] font-mono text-text-muted">Session #{i + 1}</div>
                  <div className="font-medium text-xs">
                    {isAbsent ? (
                      <span className="inline-flex items-center gap-1 text-danger">
                        <AlertOctagon className="w-3 h-3" /> Absent
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-success">
                        <CheckCircle2 className="w-3 h-3" /> Present
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-text-muted">
                    {isAbsent ? 'Unexcused' : 'QR Scan'}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Fees (Strictly hidden for trainer) */}
      {activeTab === 'fees' && role !== 'trainer' && (
        <div className="p-4 rounded-card border border-border bg-surface space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h3 className="text-xs font-semibold text-text">Instalment schedule</h3>
            <Button
              variant="secondary"
              size="xs"
              onClick={() => success('Downloading statement PDF...')}
            >
              Download ledger
            </Button>
          </div>

          <table className="w-full text-xs text-left">
            <thead className="bg-surface-sunken text-[11px] text-text-muted border-b border-border">
              <tr>
                <th className="py-2 px-3">Instalment</th>
                <th className="py-2 px-3">Due date</th>
                <th className="py-2 px-3 text-right">Amount</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {feeInstalments.map((f) => (
                <tr key={f.id} className="hover:bg-surface-sunken/40">
                  <td className="py-2.5 px-3 font-medium text-text">{f.sequence}</td>
                  <td className="py-2.5 px-3 text-text-muted">{f.dueDate}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums font-medium text-text">
                    {formatINR(f.amount)}
                  </td>
                  <td className="py-2.5 px-3">
                    {f.status === 'paid' ? (
                      <span className="inline-flex items-center gap-1 text-success text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Paid
                      </span>
                    ) : f.status === 'overdue' ? (
                      <span className="inline-flex items-center gap-1 text-danger font-medium text-xs">
                        <AlertOctagon className="w-3.5 h-3.5" /> Overdue
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-warning text-xs">
                        <Clock className="w-3.5 h-3.5" /> Due soon
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-text-muted">
                    {f.receiptNo || 'Pending'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: Risk Diagnostics */}
      {activeTab === 'risk' && (
        <div className="p-4 rounded-card border border-border bg-surface space-y-4">
          <div className="flex items-center gap-4 pb-3 border-b border-border">
            <div className="w-16 h-16 rounded-card border border-border-strong flex flex-col items-center justify-center bg-surface-sunken text-danger shrink-0">
              <span className="text-xl font-semibold tabular-nums leading-none">
                {student.riskScore}
              </span>
              <span className="text-[10px] text-text-muted mt-1">/ 100</span>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-text">
                Risk score: {student.riskScore} of 100 ({student.riskLevel})
              </h3>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                Aggregated score computed from consecutive absences, assignment completion rate, and overdue payment intervals.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-medium text-text">Primary contributing factors</h4>
            {student.riskReasons.map((r, i) => (
              <div
                key={i}
                className="p-3 rounded-control bg-surface-sunken border border-border text-xs flex items-center justify-between"
              >
                <span className="text-text">{r}</span>
                <ReasonChip reason="High impact" variant="warning" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Notes */}
      {activeTab === 'notes' && (
        <div className="p-4 rounded-card border border-border bg-surface space-y-4">
          <h3 className="text-xs font-semibold text-text uppercase tracking-wider">
            Counselor notes
          </h3>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Record a follow-up conversation or call outcome…"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="flex-1 bg-surface border border-border-strong rounded-control px-3 py-1.5 text-xs text-text outline-none focus:border-accent font-sans"
            />
            <Button variant="primary" size="sm" onClick={handleAddNote}>
              Post note
            </Button>
          </div>

          <div className="space-y-2 pt-2">
            {student.notes?.map((n) => (
              <div
                key={n.id}
                className="p-3 rounded-control bg-surface-sunken border border-border text-xs space-y-1"
              >
                <div className="flex items-center justify-between text-[11px] text-text-muted">
                  <span className="font-medium text-text">
                    {n.author} ({n.authorRole})
                  </span>
                  <span>{n.createdAt}</span>
                </div>
                <p className="text-text leading-relaxed">{n.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
