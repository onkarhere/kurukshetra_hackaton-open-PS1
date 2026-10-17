import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  FileCheck,
  CheckCheck,
  AlertTriangle,
  Clock,
  ShieldAlert,
  ArrowRight,
  Filter,
  Search,
  CheckCircle2,
  Send,
  Users,
  Award,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ReasonChip } from '@/components/ui/ReasonChip'
import { StatusPill } from '@/components/ui/StatusPill'
import { useApp } from '@/context/AppContext'
import { useToast } from '@/context/ToastContext'
import { store, useStore } from '@/mocks/store'
import { Submission, Assignment, ClassRoom } from '@/types'
import { cn } from '@/lib/utils'

export const ClassroomReviewView: React.FC = () => {
  const navigate = useNavigate()
  const { currentUser, role } = useApp()
  const { success, info } = useToast()

  const classes = useStore((s) => s.classes)
  const assignments = useStore((s) => s.assignments)
  const submissions = useStore((s) => s.submissions)
  const students = useStore((s) => s.students)

  // Teachers only see their classes unless admin/owner
  const isTeacher = role === 'trainer'
  const allowedClasses = isTeacher
    ? classes.filter((c) => c.teacherIds.includes(currentUser.id))
    : classes
  const allowedClassIds = allowedClasses.map((c) => c.id)

  const relevantAssignments = assignments.filter((a) => allowedClassIds.includes(a.classId))
  const relevantAssignmentIds = relevantAssignments.map((a) => a.id)

  // Submissions across allowed classes
  const relevantSubmissions = submissions.filter((s) =>
    relevantAssignmentIds.includes(s.assignmentId)
  )

  // Filter state
  const [selectedClassId, setSelectedClassId] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'needs_review' | 'low_confidence' | 'similarity' | 'late' | 'recheck' | 'ready_to_return'
  >('needs_review')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Submissions ready to bulk return (status === 'graded_draft')
  const draftSubmissions = relevantSubmissions.filter((s) => s.status === 'graded_draft')
  const draftAverageMarks =
    draftSubmissions.length > 0
      ? (
          draftSubmissions.reduce(
            (sum, s) => sum + (s.finalMarks ?? s.aiResult?.awarded ?? 0),
            0
          ) / draftSubmissions.length
        ).toFixed(1)
      : '0'

  const flaggedInDraft = draftSubmissions.filter(
    (s) => s.flagReason || s.aiResult?.confidence === 'low' || s.status === 'resubmit_requested'
  ).length

  // Filtered list
  const filteredSubmissions = relevantSubmissions.filter((sub) => {
    const asg = assignments.find((a) => a.id === sub.assignmentId)
    if (!asg) return false

    if (selectedClassId !== 'all' && asg.classId !== selectedClassId) return false

    const student = students.find((s) => s.id === sub.studentId)
    const stName = sub.studentName || student?.name || ''
    const matchSearch =
      !searchQuery ||
      stName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asg.title.toLowerCase().includes(searchQuery.toLowerCase())
    if (!matchSearch) return false

    if (statusFilter === 'needs_review') {
      return (
        sub.status === 'submitted' ||
        sub.status === 'late' ||
        sub.status === 'graded_draft' ||
        sub.status === 'resubmit_requested'
      )
    }
    if (statusFilter === 'ready_to_return') return sub.status === 'graded_draft'
    if (statusFilter === 'low_confidence') return sub.aiResult?.confidence === 'low'
    if (statusFilter === 'similarity') return Boolean(sub.flagReason)
    if (statusFilter === 'late') return sub.status === 'late' || (sub.aiResult?.latePenalty ?? 0) > 0
    if (statusFilter === 'recheck') return sub.status === 'resubmit_requested'
    return true
  })

  const waitingCount = relevantSubmissions.filter(
    (s) =>
      s.status === 'submitted' ||
      s.status === 'late' ||
      s.status === 'graded_draft' ||
      s.status === 'resubmit_requested'
  ).length

  const handleBulkReturnAll = () => {
    if (draftSubmissions.length === 0) {
      info('No drafts to return', 'All evaluated submissions are already returned.')
      return
    }
    const count = store.returnAllReviewed()
    success('Bulk return completed', `Released grades to ${count} students across all classes.`)
  }

  return (
    <div className="w-full space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-xl font-semibold text-text">To review</h1>
          <p className="text-xs text-text-muted mt-0.5">
            {waitingCount === 1 ? '1 submission' : `${waitingCount} submissions`} waiting for teacher evaluation or release
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search student or assignment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-surface border border-border text-text rounded-control pl-8 pr-3 py-1.5 text-xs outline-none focus:border-accent w-48"
            />
          </div>

          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="bg-surface border border-border text-text rounded-control px-2.5 py-1.5 text-xs outline-none focus:border-accent"
          >
            <option value="all">All my classes</option>
            {allowedClasses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-surface border border-border text-text rounded-control px-2.5 py-1.5 text-xs outline-none focus:border-accent"
          >
            <option value="needs_review">Needs review / waiting</option>
            <option value="ready_to_return">Ready to release (Drafts)</option>
            <option value="similarity">Similarity flags (&gt;80%)</option>
            <option value="low_confidence">Low AI confidence</option>
            <option value="recheck">Re-checks requested</option>
            <option value="late">Late submissions</option>
            <option value="all">All submissions</option>
          </select>
        </div>
      </div>

      {/* Bulk Return Approval Pattern Card */}
      {draftSubmissions.length > 0 && (
        <div className="p-4 rounded-card border border-border bg-surface-sunken flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CheckCheck className="w-4 h-4 text-accent" />
              <h3 className="text-xs font-semibold text-text">
                {draftSubmissions.length} evaluated submissions ready to return
              </h3>
            </div>
            <p className="text-xs text-text-muted">
              Class average: <strong className="text-text">{draftAverageMarks} marks</strong>
              {flaggedInDraft > 0 ? (
                <span className="text-warning ml-2 font-medium">
                  · {flaggedInDraft} submission(s) flagged for similarity or low confidence
                </span>
              ) : (
                <span className="text-success ml-2">· All criteria confident</span>
              )}
            </p>
          </div>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<Send className="w-3.5 h-3.5" />}
            onClick={handleBulkReturnAll}
          >
            Return all reviewed ({draftSubmissions.length})
          </Button>
        </div>
      )}

      {/* Submissions Inbox List */}
      {filteredSubmissions.length === 0 ? (
        <div className="p-12 text-center rounded-card border border-border bg-surface space-y-2">
          <div className="w-10 h-10 rounded-full bg-surface-sunken border border-border text-text-muted flex items-center justify-center mx-auto">
            <CheckCheck className="w-5 h-5 text-success" />
          </div>
          <h3 className="text-sm font-semibold text-text">Nothing to review</h3>
          <p className="text-xs text-text-muted max-w-sm mx-auto">
            All student submissions have been evaluated and released. New submissions will appear here.
          </p>
        </div>
      ) : (
        <div className="rounded-card border border-border bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-surface-sunken text-text-muted border-b border-border uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-3 py-3 font-medium">Class & Assignment</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Score</th>
                  <th className="px-3 py-3 font-medium">AI Confidence & Flags</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredSubmissions.map((sub) => {
                  const asg = assignments.find((a) => a.id === sub.assignmentId)
                  const cls = classes.find((c) => c.id === asg?.classId)
                  const student = students.find((s) => s.id === sub.studentId)
                  const isDraft = sub.status === 'graded_draft'

                  return (
                    <tr key={sub.id} className="hover:bg-surface-sunken/40 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-control bg-surface-sunken border border-border text-text font-medium text-xs flex items-center justify-center shrink-0">
                            {student?.avatar || sub.studentName?.slice(0, 2).toUpperCase() || 'ST'}
                          </div>
                          <div>
                            <div className="font-semibold text-text">
                              {sub.studentName || student?.name || sub.studentId}
                            </div>
                            <div className="text-[11px] text-text-muted">
                              Attempt {sub.attempt} ·{' '}
                              {sub.submittedAt
                                ? new Date(sub.submittedAt).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                  })
                                : 'Assigned'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-3.5">
                        <div className="font-medium text-text">{asg?.title || 'Assignment'}</div>
                        <div className="text-[11px] text-text-muted">{cls?.name}</div>
                      </td>

                      <td className="px-3 py-3.5">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-control text-[11px] font-medium capitalize',
                            sub.status === 'returned'
                              ? 'bg-success/15 text-success border border-success/30'
                              : sub.status === 'graded_draft'
                              ? 'bg-accent/15 text-accent border border-accent/30'
                              : sub.status === 'late'
                              ? 'bg-warning/15 text-warning border border-warning/30'
                              : sub.status === 'resubmit_requested'
                              ? 'bg-danger/15 text-danger border border-danger/30'
                              : 'bg-surface-sunken text-text-muted border border-border'
                          )}
                        >
                          {sub.status.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="px-3 py-3.5 whitespace-nowrap">
                        {sub.finalMarks !== undefined ? (
                          <div className="font-semibold text-text">
                            {sub.finalMarks}{' '}
                            <span className="text-[11px] font-normal text-text-muted">
                              / {asg?.maxMarks || 20}
                            </span>
                          </div>
                        ) : sub.aiResult ? (
                          <div className="text-text font-medium">
                            AI: {sub.aiResult.awarded}{' '}
                            <span className="text-[11px] text-text-muted">
                              / {asg?.maxMarks || 20}
                            </span>
                          </div>
                        ) : (
                          <span className="text-text-muted">—</span>
                        )}
                      </td>

                      <td className="px-3 py-3.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {sub.flagReason && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-warning/15 text-warning border border-warning/30 flex items-center gap-1">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              {sub.flagReason}
                            </span>
                          )}
                          {sub.status === 'resubmit_requested' && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-danger/15 text-danger border border-danger/30">
                              Re-check requested
                            </span>
                          )}
                          {sub.aiResult?.confidence && (
                            <span
                              className={cn(
                                'text-[10px] px-1.5 py-0.5 rounded border capitalize',
                                sub.aiResult.confidence === 'high'
                                  ? 'text-success border-success/30 bg-success/10'
                                  : sub.aiResult.confidence === 'medium'
                                  ? 'text-accent border-accent/30 bg-accent/10'
                                  : 'text-warning border-warning/30 bg-warning/10'
                              )}
                            >
                              {sub.aiResult.confidence} conf.
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            rightIcon={<ArrowRight className="w-3 h-3" />}
                            onClick={() =>
                              asg &&
                              cls &&
                              navigate(
                                `/classroom/${cls.id}/assignments/${asg.id}/submissions/${sub.id}`
                              )
                            }
                          >
                            Review & grade
                          </Button>
                          {isDraft && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => {
                                store.returnSubmission(sub.id)
                                success('Returned to student', 'Released grade.')
                              }}
                            >
                              Return
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
