import React, { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  FileCheck,
  Clock,
  Award,
  AlertTriangle,
  CheckCircle2,
  Paperclip,
  Upload,
  FileCode,
  FileText,
  AlertCircle,
  ExternalLink,
  RotateCcw,
  RefreshCw,
  Edit,
  Send,
  MessageSquare,
  Lock,
  ChevronRight,
  User,
  ShieldAlert,
  HelpCircle,
  X,
  Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { StatusPill } from '@/components/ui/StatusPill'
import { ReasonChip } from '@/components/ui/ReasonChip'
import { useApp } from '@/context/AppContext'
import { useToast } from '@/context/ToastContext'
import { store, useStore } from '@/mocks/store'
import {
  Assignment,
  Submission,
  CheckingLevel,
  Attachment,
  RubricCriterion,
  SubmissionStatus,
} from '@/types'
import { cn } from '@/lib/utils'

export const AssignmentDetailView: React.FC = () => {
  const { classId, assignmentId } = useParams<{ classId: string; assignmentId: string }>()
  const navigate = useNavigate()
  const { role, currentUser } = useApp()
  const { success, error, info } = useToast()

  const classes = useStore((s) => s.classes)
  const assignments = useStore((s) => s.assignments)
  const submissions = useStore((s) => s.submissions)
  const students = useStore((s) => s.students)
  const trainers = useStore((s) => s.trainers)

  const currentClass = classes.find((c) => c.id === classId) || classes[0]
  const assignment = assignments.find((a) => a.id === assignmentId)

  // Modals state
  const [showEditModal, setShowEditModal] = useState(false)
  const [showRecheckModal, setShowRecheckModal] = useState(false)
  const [recheckReason, setRecheckReason] = useState('')
  const [isRegradingAll, setIsRegradingAll] = useState(false)

  // Student submission form state
  const [pastedCode, setPastedCode] = useState('')
  const [stagedFiles, setStagedFiles] = useState<
    { name: string; sizeBytes: number; mimeType: string; url: string }[]
  >([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Filter state for teacher submissions table
  const [submissionFilter, setSubmissionFilter] = useState<'all' | 'needs_review' | 'late' | 'returned' | 'recheck'>('all')
  const [searchStudent, setSearchStudent] = useState('')

  // Edit assignment state
  const [editTitle, setEditTitle] = useState(assignment?.title || '')
  const [editInstructions, setEditInstructions] = useState(assignment?.instructions || '')
  const [editDueAt, setEditDueAt] = useState(assignment?.dueAt || '')
  const [editAllowLate, setEditAllowLate] = useState(assignment?.allowLate ?? true)
  const [editLatePenalty, setEditLatePenalty] = useState(assignment?.latePenaltyPerDay || 2)

  if (!assignment) {
    return (
      <div className="p-8 text-center space-y-3">
        <h2 className="text-base font-semibold text-text">Assignment not found</h2>
        <Button variant="secondary" onClick={() => navigate(`/classroom/${classId}`)}>
          Back to class
        </Button>
      </div>
    )
  }

  const isTeacherOrAdmin = role === 'trainer' || role === 'owner' || role === 'admin'
  const isStudent = role === 'student'

  // Submissions for this assignment
  const assignmentSubmissions = submissions.filter((s) => s.assignmentId === assignment.id)

  // Current student submission (for student view or matching student user)
  const currentStudentId = currentUser.role === 'student' ? currentUser.id : 'std-priya-01'
  const studentSubmission = assignmentSubmissions.find((s) => s.studentId === currentStudentId)

  const isDuePast = new Date(assignment.dueAt).getTime() < Date.now()

  // Enrolled students in class batch
  const enrolledStudents = students.filter((s) => s.batchIds.includes(currentClass.batchId))

  // Stats calculation
  const totalAssigned = enrolledStudents.length || assignmentSubmissions.length || 1
  const turnedInCount = assignmentSubmissions.filter(
    (s) => s.status === 'submitted' || s.status === 'late' || s.status === 'grading' || s.status === 'graded_draft' || s.status === 'returned'
  ).length
  const returnedCount = assignmentSubmissions.filter((s) => s.status === 'returned').length
  const flaggedCount = assignmentSubmissions.filter(
    (s) => s.flagReason || s.aiResult?.confidence === 'low' || s.status === 'resubmit_requested'
  ).length
  const scoredSubmissions = assignmentSubmissions.filter((s) => s.finalMarks !== undefined || s.aiResult?.awarded !== undefined)
  const avgMarks =
    scoredSubmissions.length > 0
      ? (
          scoredSubmissions.reduce(
            (sum, s) => sum + (s.finalMarks ?? s.aiResult?.awarded ?? 0),
            0
          ) / scoredSubmissions.length
        ).toFixed(1)
      : '-'

  // Checking level explanation texts
  const checkingLevelExplanations: Record<CheckingLevel, { label: string; desc: string }> = {
    easy: {
      label: 'Easy checking',
      desc: 'Checks whether each idea is present in any reasonable form; gives partial credit generously; ignores small mistakes in wording and formatting.',
    },
    medium: {
      label: 'Medium checking',
      desc: 'Each criterion must be clearly present and mostly correct; partial credit for incomplete work; minor errors cost a small part of criterion marks.',
    },
    hard: {
      label: 'Hard checking',
      desc: 'Each criterion must be present, complete and correct; partial credit only when explicitly enabled; logic errors cost full marks.',
    },
  }

  // --- ACTIONS ---

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const fileList = Array.from(e.target.files)
    if (stagedFiles.length + fileList.length > 5) {
      error('Limit exceeded', 'Maximum 5 files allowed per submission.')
      return
    }

    const newAttachments = fileList.map((file) => {
      if (file.size > 25 * 1024 * 1024) {
        error('File too large', `${file.name} exceeds 25 MB limit.`)
      }
      return {
        name: file.name,
        sizeBytes: file.size,
        mimeType: file.type || 'text/plain',
        url: URL.createObjectURL(file),
      }
    })

    setStagedFiles([...stagedFiles, ...newAttachments])
  }

  const handleTurnIn = async () => {
    if (stagedFiles.length === 0 && !pastedCode.trim()) {
      error('Work required', 'Please attach at least one code file or paste your solution.')
      return
    }

    setIsSubmitting(true)
    info('Evaluating submission', 'Batchwise AI is analyzing code against the rubric parameters...')

    try {
      const attachments: Attachment[] = stagedFiles.map((f, i) => ({
        id: `att-sub-${Date.now()}-${i}`,
        name: f.name,
        mimeType: f.mimeType,
        sizeBytes: f.sizeBytes,
        url: f.url,
      }))

      await store.submitAssignment(
        assignment.id,
        currentStudentId,
        attachments,
        pastedCode.trim() || undefined
      )

      success('Assignment turned in!', 'Submission recorded and submitted for grading.')
      setStagedFiles([])
      setPastedCode('')
    } catch (err: any) {
      error('Submission failed', err?.message || 'Error saving work.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUnsubmit = () => {
    if (!studentSubmission) return
    if (studentSubmission.status === 'returned') {
      error('Cannot unsubmit', 'Grading has already been released by the teacher.')
      return
    }
    store.unsubmitAssignment(studentSubmission.id)
    success('Assignment unsubmitted', 'You can now update and resubmit your work.')
  }

  const handleRequestRecheck = () => {
    if (!studentSubmission || !recheckReason.trim()) return
    store.requestRecheck(studentSubmission.id, recheckReason.trim())
    setShowRecheckModal(false)
    setRecheckReason('')
    success('Re-check requested', 'Your request has been added to the teacher review queue.')
  }

  const handleRegradeAll = async () => {
    setIsRegradingAll(true)
    info('Re-grading in progress', 'Running AI evaluation pipeline on all submissions...')
    try {
      const count = await store.regradeAll(assignment.id)
      success('Re-grading complete', `Re-evaluated ${count} submissions. Existing teacher overrides preserved.`)
    } catch (err) {
      error('Re-grading failed', 'Could not complete AI re-evaluation.')
    } finally {
      setIsRegradingAll(false)
    }
  }

  const handleReturnAllReviewed = () => {
    const count = store.returnAllReviewed(assignment.id)
    if (count > 0) {
      success('Released grades', `Returned evaluated marks to ${count} students.`)
    } else {
      info('No drafts to release', 'All graded submissions have already been returned.')
    }
  }

  const handleSaveEdit = () => {
    store.updateAssignment(assignment.id, {
      title: editTitle,
      instructions: editInstructions,
      dueAt: editDueAt,
      allowLate: editAllowLate,
      latePenaltyPerDay: editLatePenalty,
    })
    setShowEditModal(false)
    success('Assignment updated', 'Changes have been saved.')
  }

  // Filtered submissions list
  const filteredSubmissions = assignmentSubmissions.filter((sub) => {
    const student = students.find((s) => s.id === sub.studentId)
    const nameMatch = !searchStudent || student?.name.toLowerCase().includes(searchStudent.toLowerCase())
    if (!nameMatch) return false

    if (submissionFilter === 'needs_review') {
      return sub.status === 'graded_draft' || sub.status === 'submitted' || sub.status === 'resubmit_requested' || sub.aiResult?.confidence === 'low'
    }
    if (submissionFilter === 'late') return sub.status === 'late' || (sub.aiResult?.latePenalty ?? 0) > 0
    if (submissionFilter === 'returned') return sub.status === 'returned'
    if (submissionFilter === 'recheck') return sub.status === 'resubmit_requested'
    return true
  })

  return (
    <div className="w-full space-y-6">
      {/* Top Header / Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <Link
              to={`/classroom/${currentClass.id}`}
              className="hover:text-text flex items-center gap-1 text-accent"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {currentClass.name}
            </Link>
            <span>/</span>
            <span className="text-text font-medium">Assignment</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <h1 className="text-xl font-semibold text-text">{assignment.title}</h1>
            <span
              className={cn(
                'text-xs px-2.5 py-0.5 rounded-control font-medium uppercase tracking-wider',
                assignment.checkingLevel === 'easy'
                  ? 'bg-success/15 text-success border border-success/30'
                  : assignment.checkingLevel === 'medium'
                  ? 'bg-accent/15 text-accent border border-accent/30'
                  : 'bg-warning/15 text-warning border border-warning/30'
              )}
            >
              {assignment.checkingLevel} Checking
            </span>
            <span
              className={cn(
                'text-xs px-2 py-0.5 rounded-control font-medium',
                assignment.status === 'published'
                  ? 'bg-surface-sunken border border-border text-text'
                  : 'bg-warning/15 text-warning border border-warning/30'
              )}
            >
              {assignment.status.toUpperCase()}
            </span>
            {assignment.releaseMode === 'auto_release' && (
              <span className="text-xs px-2 py-0.5 rounded-control bg-accent/10 border border-accent/20 text-accent">
                Auto-Release AI Marks
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-text-muted pt-0.5">
            <span className="flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" /> Max marks: <strong className="text-text">{assignment.maxMarks}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Due:{' '}
              <strong className={cn(isDuePast ? 'text-danger' : 'text-text')}>
                {new Date(assignment.dueAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}{' '}
                ·{' '}
                {new Date(assignment.dueAt).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
                IST
              </strong>
            </span>
            {assignment.allowLate && (
              <span className="text-text-muted">
                Late allowed (-{assignment.latePenaltyPerDay} marks/day)
              </span>
            )}
          </div>
        </div>

        {/* Header Action Buttons */}
        {isTeacherOrAdmin && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<RefreshCw className={cn('w-3.5 h-3.5', isRegradingAll && 'animate-spin')} />}
              onClick={handleRegradeAll}
              disabled={isRegradingAll}
            >
              {isRegradingAll ? 'Re-grading...' : 'Re-grade all'}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Edit className="w-3.5 h-3.5" />}
              onClick={() => setShowEditModal(true)}
            >
              Edit assignment
            </Button>
            {assignmentSubmissions.some((s) => s.status === 'graded_draft') && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<FileCheck className="w-3.5 h-3.5" />}
                onClick={handleReturnAllReviewed}
              >
                Release reviewed grades
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Checking Level Banner */}
      <div className="p-3.5 rounded-card border border-border bg-surface-sunken flex items-start gap-3">
        <HelpCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
        <div className="text-xs space-y-0.5">
          <div className="font-medium text-text">
            {checkingLevelExplanations[assignment.checkingLevel].label} applied
          </div>
          <div className="text-text-muted">
            {checkingLevelExplanations[assignment.checkingLevel].desc}
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* TEACHER VIEW: METRICS & SUBMISSIONS LIST */}
      {/* ==================================================================== */}
      {isTeacherOrAdmin && (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
            <div className="p-3.5 rounded-card border border-border bg-surface text-left">
              <span className="text-xs text-text-muted">Assigned</span>
              <div className="mt-1 text-2xl font-semibold text-text tabular-nums">
                {totalAssigned}
              </div>
              <span className="text-[11px] text-text-muted">Students enrolled</span>
            </div>

            <div className="p-3.5 rounded-card border border-border bg-surface text-left">
              <span className="text-xs text-text-muted">Turned in</span>
              <div className="mt-1 text-2xl font-semibold text-accent tabular-nums">
                {turnedInCount}
              </div>
              <span className="text-[11px] text-text-muted">
                {Math.round((turnedInCount / totalAssigned) * 100)}% completion
              </span>
            </div>

            <div className="p-3.5 rounded-card border border-border bg-surface text-left">
              <span className="text-xs text-text-muted">Graded & Returned</span>
              <div className="mt-1 text-2xl font-semibold text-success tabular-nums">
                {returnedCount}
              </div>
              <span className="text-[11px] text-text-muted">Released to students</span>
            </div>

            <div className="p-3.5 rounded-card border border-border bg-surface text-left">
              <span className="text-xs text-text-muted">Average score</span>
              <div className="mt-1 text-2xl font-semibold text-text tabular-nums">
                {avgMarks}{' '}
                <span className="text-xs font-normal text-text-muted">/ {assignment.maxMarks}</span>
              </div>
              <span className="text-[11px] text-text-muted">Evaluated submissions</span>
            </div>

            <div className="p-3.5 rounded-card border border-border bg-surface text-left">
              <span className="text-xs text-text-muted">Flags & Alerts</span>
              <div
                className={cn(
                  'mt-1 text-2xl font-semibold tabular-nums',
                  flaggedCount > 0 ? 'text-warning' : 'text-text-muted'
                )}
              >
                {flaggedCount}
              </div>
              <span className="text-[11px] text-text-muted">Needs manual review</span>
            </div>
          </div>

          {/* Submissions Management Section */}
          <div className="rounded-card border border-border bg-surface p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-text">Student submissions</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-surface-sunken text-text-muted border border-border">
                  {assignmentSubmissions.length}
                </span>
              </div>

              {/* Filter Pills */}
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  placeholder="Search student..."
                  value={searchStudent}
                  onChange={(e) => setSearchStudent(e.target.value)}
                  className="bg-surface-sunken border border-border rounded-control px-2.5 py-1 text-xs text-text outline-none focus:border-accent w-40"
                />

                <select
                  value={submissionFilter}
                  onChange={(e) => setSubmissionFilter(e.target.value as any)}
                  className="bg-surface-sunken border border-border rounded-control px-2.5 py-1 text-xs text-text outline-none focus:border-accent"
                >
                  <option value="all">All statuses</option>
                  <option value="needs_review">Needs review</option>
                  <option value="late">Late only</option>
                  <option value="returned">Returned</option>
                  <option value="recheck">Re-check requested</option>
                </select>
              </div>
            </div>

            {/* Submissions Table */}
            {filteredSubmissions.length === 0 ? (
              <div className="p-8 text-center text-text-muted text-xs space-y-1">
                <FileCheck className="w-8 h-8 mx-auto text-text-muted/50 mb-1" />
                <p>No student submissions found matching the criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-surface-sunken text-text-muted border-b border-border uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="px-3.5 py-2.5 font-medium">Student</th>
                      <th className="px-3 py-2.5 font-medium">Status</th>
                      <th className="px-3 py-2.5 font-medium">Submitted</th>
                      <th className="px-3 py-2.5 font-medium">Marks</th>
                      <th className="px-3 py-2.5 font-medium">AI Confidence & Flags</th>
                      <th className="px-3.5 py-2.5 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredSubmissions.map((sub) => {
                      const student = students.find((s) => s.id === sub.studentId)
                      const isGradedDraft = sub.status === 'graded_draft'
                      const isReturned = sub.status === 'returned'
                      const isGrading = sub.status === 'grading'

                      return (
                        <tr key={sub.id} className="hover:bg-surface-sunken/50 transition-colors">
                          <td className="px-3.5 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-control bg-surface-sunken border border-border text-text font-medium flex items-center justify-center shrink-0">
                                {student?.avatar || sub.studentName?.slice(0, 2).toUpperCase() || 'ST'}
                              </div>
                              <div>
                                <div className="font-medium text-text">
                                  {sub.studentName || student?.name || sub.studentId}
                                </div>
                                <div className="text-[11px] text-text-muted truncate max-w-[150px]">
                                  {student?.email || 'Attempt ' + sub.attempt}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-3 py-3">
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
                                  : sub.status === 'grading'
                                  ? 'bg-surface-sunken text-accent animate-pulse'
                                  : 'bg-surface-sunken text-text-muted border border-border'
                              )}
                            >
                              {sub.status.replace('_', ' ')}
                            </span>
                          </td>

                          <td className="px-3 py-3 text-text-muted whitespace-nowrap">
                            {sub.submittedAt ? (
                              <div className="space-y-0.5">
                                <div>
                                  {new Date(sub.submittedAt).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                  })}{' '}
                                  ·{' '}
                                  {new Date(sub.submittedAt).toLocaleTimeString('en-IN', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </div>
                                {sub.status === 'late' && (
                                  <span className="text-[10px] text-warning font-medium">Late submission</span>
                                )}
                              </div>
                            ) : (
                              'Not submitted'
                            )}
                          </td>

                          <td className="px-3 py-3 whitespace-nowrap">
                            {sub.finalMarks !== undefined ? (
                              <div className="font-semibold text-text">
                                {sub.finalMarks}{' '}
                                <span className="text-[11px] font-normal text-text-muted">
                                  / {assignment.maxMarks}
                                </span>
                              </div>
                            ) : sub.aiResult ? (
                              <div className="text-text font-medium">
                                AI: {sub.aiResult.awarded}{' '}
                                <span className="text-[11px] text-text-muted">
                                  / {assignment.maxMarks}
                                </span>
                              </div>
                            ) : isGrading ? (
                              <span className="text-accent">Grading...</span>
                            ) : (
                              <span className="text-text-muted">—</span>
                            )}
                          </td>

                          <td className="px-3 py-3">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {sub.flagReason && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning/15 text-warning border border-warning/30 flex items-center gap-1">
                                  <AlertTriangle className="w-2.5 h-2.5" />
                                  {sub.flagReason}
                                </span>
                              )}
                              {sub.status === 'resubmit_requested' && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-danger/15 text-danger border border-danger/30">
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

                          <td className="px-3.5 py-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() =>
                                  navigate(
                                    `/classroom/${currentClass.id}/assignments/${assignment.id}/submissions/${sub.id}`
                                  )
                                }
                              >
                                {isReturned ? 'View' : 'Review & Grade'}
                              </Button>
                              {isGradedDraft && (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => {
                                    store.returnSubmission(sub.id)
                                    success('Marks released', `Returned evaluation to student.`)
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
            )}
          </div>

          {/* Assignment Description, Attachments & Teacher Reference Solution */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 rounded-card border border-border bg-surface p-5 space-y-4">
              <h3 className="text-sm font-semibold text-text">Instructions</h3>
              <div className="text-xs text-text leading-relaxed whitespace-pre-wrap font-sans bg-surface-sunken p-4 rounded-control border border-border">
                {assignment.instructions}
              </div>

              {assignment.attachments.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-medium text-text">Teacher resources & attachments</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {assignment.attachments.map((file) => (
                      <div
                        key={file.id}
                        className="p-2.5 rounded-control border border-border bg-surface-sunken flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Paperclip className="w-3.5 h-3.5 text-accent shrink-0" />
                          <span className="truncate text-text">{file.name}</span>
                        </div>
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-accent hover:underline text-[11px] shrink-0 ml-2"
                        >
                          View
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Teacher Only Reference Solution */}
              {assignment.referenceSolution && (
                <div className="p-4 rounded-control border border-border bg-surface-sunken space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-text">
                    <Lock className="w-3.5 h-3.5 text-warning" />
                    <span>Teacher Reference Solution</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-warning/15 text-warning border border-warning/30 font-normal">
                      Teacher only — never shown to students
                    </span>
                  </div>
                  <pre className="text-xs font-mono text-text bg-surface p-3 rounded border border-border overflow-x-auto whitespace-pre-wrap">
                    {assignment.referenceSolution}
                  </pre>
                </div>
              )}
            </div>

            {/* Rubric Criteria List */}
            <div className="lg:col-span-4 rounded-card border border-border bg-surface p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <h3 className="text-xs font-semibold text-text">Marking Rubric</h3>
                <span className="text-[11px] text-text-muted">
                  {assignment.rubric.length} parameters
                </span>
              </div>

              <div className="space-y-2.5">
                {assignment.rubric.map((crit, idx) => (
                  <div
                    key={crit.id}
                    className="p-3 rounded-control border border-border bg-surface-sunken space-y-1.5 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium text-text">
                        {idx + 1}. {crit.title}
                      </span>
                      <span className="text-[11px] text-danger font-semibold shrink-0">
                        -{crit.deductIfMissing}
                      </span>
                    </div>

                    {crit.description && (
                      <p className="text-[11px] text-text-muted leading-snug">{crit.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px]">
                      <span className="px-1.5 py-0.5 rounded bg-surface border border-border text-text-muted capitalize">
                        {crit.type.replace('_', ' ')}
                      </span>
                      {crit.partialAllowed ? (
                        <span className="px-1.5 py-0.5 rounded bg-accent/10 border border-accent/20 text-accent">
                          Partial credit allowed
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-surface border border-border text-text-muted">
                          Full deduction on error
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* STUDENT VIEW: INSTRUCTIONS, RUBRIC & WORK SUBMISSION BOX */}
      {/* ==================================================================== */}
      {isStudent && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Instructions, Attachments & Rubric (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="rounded-card border border-border bg-surface p-5 space-y-4">
              <h3 className="text-sm font-semibold text-text">Instructions</h3>
              <div className="text-xs text-text leading-relaxed whitespace-pre-wrap font-sans bg-surface-sunken p-4 rounded-control border border-border">
                {assignment.instructions}
              </div>

              {assignment.attachments.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-medium text-text">Reference files & materials</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {assignment.attachments.map((file) => (
                      <div
                        key={file.id}
                        className="p-2.5 rounded-control border border-border bg-surface-sunken flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Paperclip className="w-3.5 h-3.5 text-accent shrink-0" />
                          <span className="truncate text-text">{file.name}</span>
                        </div>
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-accent hover:underline text-[11px] shrink-0 ml-2"
                        >
                          Download
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Rubric Criteria (No reference solution shown to student) */}
            <div className="rounded-card border border-border bg-surface p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-semibold text-text">Rubric & evaluation parameters</h3>
                  <p className="text-xs text-text-muted">
                    Your code will be evaluated against each parameter below.
                  </p>
                </div>
                <span className="text-xs text-text-muted">
                  Sum of max deductions: {assignment.maxMarks}
                </span>
              </div>

              <div className="space-y-2.5">
                {assignment.rubric.map((crit, idx) => (
                  <div
                    key={crit.id}
                    className="p-3.5 rounded-control border border-border bg-surface-sunken space-y-1.5 text-xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-text">
                          {idx + 1}. {crit.title}
                        </span>
                        {crit.description && (
                          <p className="text-[11px] text-text-muted">{crit.description}</p>
                        )}
                      </div>
                      <span className="text-xs font-semibold text-danger shrink-0">
                        -{crit.deductIfMissing} marks if missing
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px]">
                      <span className="px-2 py-0.5 rounded bg-surface border border-border text-text-muted capitalize">
                        Type: {crit.type.replace('_', ' ')}
                      </span>
                      {crit.partialAllowed ? (
                        <span className="px-2 py-0.5 rounded bg-accent/10 border border-accent/20 text-accent">
                          Partial marks credit eligible
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-surface border border-border text-text-muted">
                          Strict requirement
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: "Your Work" Box (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-card border border-border bg-surface p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <h3 className="text-sm font-semibold text-text">Your work</h3>
                <span
                  className={cn(
                    'text-xs px-2.5 py-0.5 rounded-control font-medium capitalize',
                    studentSubmission?.status === 'returned'
                      ? 'bg-success/15 text-success border border-success/30'
                      : studentSubmission?.status === 'submitted' || studentSubmission?.status === 'late'
                      ? 'bg-accent/15 text-accent border border-accent/30'
                      : studentSubmission?.status === 'grading'
                      ? 'bg-surface-sunken text-accent animate-pulse'
                      : studentSubmission?.status === 'resubmit_requested'
                      ? 'bg-danger/15 text-danger border border-danger/30'
                      : 'bg-surface-sunken text-text-muted border border-border'
                  )}
                >
                  {studentSubmission?.status
                    ? studentSubmission.status.replace('_', ' ')
                    : 'Assigned'}
                </span>
              </div>

              {/* State 1: Returned - Show Final Score & Deduction Breakdown */}
              {studentSubmission?.status === 'returned' && (
                <div className="space-y-4">
                  {/* Hero Score Box */}
                  <div className="p-4 rounded-control bg-surface-sunken border border-border text-center space-y-1">
                    <span className="text-xs text-text-muted">Final Grade</span>
                    <div className="text-3xl font-semibold text-text tabular-nums">
                      {studentSubmission.finalMarks ?? studentSubmission.aiResult?.awarded}{' '}
                      <span className="text-sm font-normal text-text-muted">
                        / {assignment.maxMarks}
                      </span>
                    </div>
                    <span className="text-[11px] text-success font-medium">
                      Returned by {studentSubmission.returnedBy || 'Teacher'}
                    </span>
                  </div>

                  {/* Deduction breakdown */}
                  {studentSubmission.aiResult && (
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-text">Deduction breakdown:</div>
                      {studentSubmission.aiResult.deductions.length === 0 ? (
                        <div className="p-2.5 rounded bg-success/10 border border-success/20 text-xs text-success flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Full marks awarded! No rubric deductions.</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {studentSubmission.aiResult.deductions.map((ded, i) => (
                            <div
                              key={i}
                              className="p-3 rounded-control border border-danger/20 bg-danger/5 text-xs space-y-1.5"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className="font-medium text-danger">{ded.title}</span>
                                <span className="font-semibold text-danger shrink-0">
                                  -{ded.marksCut} marks
                                </span>
                              </div>
                              <p className="text-[11px] text-text">{ded.reason}</p>
                              {ded.evidence && (
                                <div className="text-[10px] font-mono bg-surface p-1.5 rounded border border-border text-text-muted">
                                  {ded.evidence}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Late penalty if any */}
                      {studentSubmission.aiResult.latePenalty > 0 && (
                        <div className="p-2.5 rounded bg-warning/10 border border-warning/20 text-xs text-warning flex items-center justify-between">
                          <span>Late submission penalty:</span>
                          <span className="font-semibold">
                            -{studentSubmission.aiResult.latePenalty} marks
                          </span>
                        </div>
                      )}

                      {/* Strengths */}
                      {studentSubmission.aiResult.strengths?.length > 0 && (
                        <div className="p-3 rounded-control bg-surface-sunken border border-border text-xs space-y-1">
                          <span className="font-medium text-text">Strengths:</span>
                          <ul className="list-disc list-inside space-y-0.5 text-text-muted text-[11px]">
                            {studentSubmission.aiResult.strengths.map((str, idx) => (
                              <li key={idx}>{str}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Improvements */}
                      {studentSubmission.aiResult.improvements?.length > 0 && (
                        <div className="p-3 rounded-control bg-surface-sunken border border-border text-xs space-y-1">
                          <span className="font-medium text-text">Areas to improve:</span>
                          <ul className="list-disc list-inside space-y-0.5 text-text-muted text-[11px]">
                            {studentSubmission.aiResult.improvements.map((imp, idx) => (
                              <li key={idx}>{imp}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Teacher Comment */}
                      {studentSubmission.teacherComment && (
                        <div className="p-3 rounded-control bg-accent/5 border border-accent/20 text-xs space-y-1">
                          <span className="font-medium text-accent">Teacher feedback:</span>
                          <p className="text-text text-[11px] leading-relaxed">
                            "{studentSubmission.teacherComment}"
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Request Re-check Button */}
                  <Button
                    variant="secondary"
                    className="w-full"
                    leftIcon={<HelpCircle className="w-3.5 h-3.5" />}
                    onClick={() => setShowRecheckModal(true)}
                  >
                    Request re-check
                  </Button>
                </div>
              )}

              {/* State 2: Submitted / Graded Draft / Grading */}
              {studentSubmission &&
                studentSubmission.status !== 'returned' &&
                studentSubmission.status !== 'assigned' && (
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-control bg-surface-sunken border border-border space-y-2 text-xs">
                      <div className="flex items-center gap-2 text-text font-medium">
                        <CheckCircle2 className="w-4 h-4 text-success" />
                        <span>Work turned in successfully</span>
                      </div>
                      <div className="text-[11px] text-text-muted">
                        Submitted at:{' '}
                        {new Date(studentSubmission.submittedAt || '').toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        IST (Attempt {studentSubmission.attempt})
                      </div>
                    </div>

                    {/* Submitted files list */}
                    {studentSubmission.files.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[11px] text-text-muted">Submitted files:</span>
                        {studentSubmission.files.map((file) => (
                          <div
                            key={file.id}
                            className="p-2 rounded border border-border bg-surface-sunken flex items-center justify-between text-xs"
                          >
                            <span className="truncate text-text font-mono text-[11px]">{file.name}</span>
                            <span className="text-[10px] text-text-muted">
                              {Math.round(file.sizeBytes / 1024)} KB
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {studentSubmission.status === 'grading' ? (
                      <div className="p-3 rounded bg-accent/10 border border-accent/20 text-xs text-accent flex items-center gap-2 animate-pulse">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>AI evaluation in progress...</span>
                      </div>
                    ) : (
                      <div className="p-3 rounded bg-surface-sunken border border-border text-xs text-text-muted">
                        Grading is awaiting teacher review. You will receive an in-app notification when marks are released.
                      </div>
                    )}

                    {/* Unsubmit option (allowed before release) */}
                    <Button
                      variant="secondary"
                      className="w-full text-danger hover:border-danger/40"
                      leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                      onClick={handleUnsubmit}
                    >
                      Unsubmit work
                    </Button>
                  </div>
                )}

              {/* State 3: Not Turned In (Assigned or Resubmit Requested) */}
              {(!studentSubmission ||
                studentSubmission.status === 'assigned' ||
                studentSubmission.status === 'resubmit_requested') && (
                <div className="space-y-4">
                  {studentSubmission?.status === 'resubmit_requested' && (
                    <div className="p-3 rounded-control bg-warning/15 border border-warning/30 text-xs text-warning space-y-1">
                      <div className="font-semibold flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" /> Resubmission requested
                      </div>
                      <p className="text-[11px]">{studentSubmission.teacherComment || studentSubmission.recheckReason}</p>
                    </div>
                  )}

                  {isDuePast && (
                    <div
                      className={cn(
                        'p-2.5 rounded text-xs flex items-center gap-2',
                        assignment.allowLate
                          ? 'bg-warning/10 text-warning border border-warning/20'
                          : 'bg-danger/10 text-danger border border-danger/20'
                      )}
                    >
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {assignment.allowLate
                          ? `Due date has passed. Submission will be marked Late (-${assignment.latePenaltyPerDay} marks/day).`
                          : 'Due date has passed. Late submissions are not accepted.'}
                      </span>
                    </div>
                  )}

                  {/* File Upload Zone */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-text block">
                      Upload solution files (max 5 files, 25MB each)
                    </label>
                    <label className="border-2 border-dashed border-border hover:border-accent rounded-control p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-surface-sunken">
                      <Upload className="w-5 h-5 text-accent mb-1" />
                      <span className="text-xs font-medium text-text">Choose code or doc files</span>
                      <span className="text-[11px] text-text-muted mt-0.5">
                        .java, .py, .js, .cpp, .c, .txt, .pdf, .docx, images
                      </span>
                      <input
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                        accept=".java,.py,.js,.jsx,.ts,.tsx,.cpp,.c,.h,.txt,.pdf,.docx,image/*"
                      />
                    </label>

                    {/* Staged files list */}
                    {stagedFiles.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        {stagedFiles.map((file, idx) => (
                          <div
                            key={idx}
                            className="p-2 rounded border border-border bg-surface-sunken flex items-center justify-between text-xs"
                          >
                            <span className="truncate text-text font-mono text-[11px]">{file.name}</span>
                            <button
                              type="button"
                              onClick={() => setStagedFiles(stagedFiles.filter((_, i) => i !== idx))}
                              className="text-text-muted hover:text-danger p-0.5"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Code Snippet / Text paste area */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-text block">
                      Or paste solution code directly
                    </label>
                    <textarea
                      rows={5}
                      value={pastedCode}
                      onChange={(e) => setPastedCode(e.target.value)}
                      placeholder="// Paste Java source code or execution logs here..."
                      className="w-full bg-surface-sunken border border-border rounded-control p-2.5 text-xs text-text font-mono outline-none focus:border-accent"
                    />
                  </div>

                  {/* Turn in Button */}
                  <Button
                    variant="primary"
                    className="w-full"
                    disabled={
                      (isDuePast && !assignment.allowLate) ||
                      isSubmitting ||
                      (stagedFiles.length === 0 && !pastedCode.trim())
                    }
                    onClick={handleTurnIn}
                  >
                    {isSubmitting ? 'Evaluating with AI...' : 'Turn in assignment'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* EDIT ASSIGNMENT MODAL (TEACHER ONLY) */}
      {/* ==================================================================== */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-card p-6 w-full max-w-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="text-base font-semibold text-text">Edit assignment</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-text-muted hover:text-text"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {assignmentSubmissions.length > 0 && (
              <div className="p-3 rounded-control bg-warning/15 border border-warning/30 text-xs text-warning space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> Submissions already exist
                </div>
                <p className="text-[11px]">
                  Rubric criteria cannot be modified because {assignmentSubmissions.length} student submission(s) have been received. You can adjust due dates and instructions. Use "Re-grade all" if you need to rerun AI checking.
                </p>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-text font-medium block mb-1">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-surface-sunken border border-border rounded-control px-3 py-1.5 text-text outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="text-text font-medium block mb-1">Instructions</label>
                <textarea
                  rows={4}
                  value={editInstructions}
                  onChange={(e) => setEditInstructions(e.target.value)}
                  className="w-full bg-surface-sunken border border-border rounded-control p-2.5 text-text outline-none focus:border-accent font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-text font-medium block mb-1">Due date & time</label>
                  <input
                    type="datetime-local"
                    value={editDueAt.slice(0, 16)}
                    onChange={(e) => setEditDueAt(e.target.value)}
                    className="w-full bg-surface-sunken border border-border rounded-control px-2.5 py-1.5 text-text outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="text-text font-medium block mb-1">Late penalty per day</label>
                  <input
                    type="number"
                    min={0}
                    max={assignment.maxMarks}
                    value={editLatePenalty}
                    onChange={(e) => setEditLatePenalty(Number(e.target.value))}
                    className="w-full bg-surface-sunken border border-border rounded-control px-2.5 py-1.5 text-text outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editAllowLate"
                  checked={editAllowLate}
                  onChange={(e) => setEditAllowLate(e.target.checked)}
                  className="rounded border-border text-accent focus:ring-accent"
                />
                <label htmlFor="editAllowLate" className="text-text cursor-pointer">
                  Allow late submissions past deadline
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
              <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveEdit}>
                Save changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* REQUEST RE-CHECK MODAL (STUDENT ONLY) */}
      {/* ==================================================================== */}
      {showRecheckModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-card p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="text-base font-semibold text-text">Request re-check</h3>
              <button
                onClick={() => setShowRecheckModal(false)}
                className="text-text-muted hover:text-text"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-text-muted">
                Explain specifically which rubric deduction you would like the teacher to review and why:
              </p>
              <textarea
                rows={4}
                value={recheckReason}
                onChange={(e) => setRecheckReason(e.target.value)}
                placeholder="e.g., I implemented the custom exception in class FileReaderException.java line 12, please review."
                className="w-full bg-surface-sunken border border-border rounded-control p-2.5 text-text outline-none focus:border-accent"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
              <Button variant="secondary" onClick={() => setShowRecheckModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                disabled={!recheckReason.trim()}
                onClick={handleRequestRecheck}
              >
                Submit request
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
