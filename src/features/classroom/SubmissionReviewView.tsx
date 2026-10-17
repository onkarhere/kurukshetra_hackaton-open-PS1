import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  FileCode,
  FileText,
  Paperclip,
  Check,
  AlertTriangle,
  RotateCcw,
  Send,
  Save,
  CheckCircle2,
  Clock,
  ShieldAlert,
  HelpCircle,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  Download,
  X,
  MessageSquare,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ReasonChip } from '@/components/ui/ReasonChip'
import { StatusPill } from '@/components/ui/StatusPill'
import { useApp } from '@/context/AppContext'
import { useToast } from '@/context/ToastContext'
import { store, useStore } from '@/mocks/store'
import {
  Submission,
  Assignment,
  ClassRoom,
  GradingDeduction,
  GradingResult,
} from '@/types'
import { cn } from '@/lib/utils'

export const SubmissionReviewView: React.FC = () => {
  const { classId, assignmentId, submissionId } = useParams<{
    classId: string
    assignmentId: string
    submissionId: string
  }>()
  const navigate = useNavigate()
  const { currentUser, role } = useApp()
  const { success, error, info } = useToast()

  const classes = useStore((s) => s.classes)
  const assignments = useStore((s) => s.assignments)
  const submissions = useStore((s) => s.submissions)
  const students = useStore((s) => s.students)

  const currentClass = classes.find((c) => c.id === classId) || classes[0]
  const assignment = assignments.find((a) => a.id === assignmentId)
  const submission = submissions.find((s) => s.id === submissionId)

  // Current student info
  const student = students.find((s) => s.id === submission?.studentId)
  const studentName = subName(submission, student)

  // Submissions for navigation prev/next
  const assignmentSubmissions = submissions.filter((s) => s.assignmentId === assignmentId)
  const currentIndex = assignmentSubmissions.findIndex((s) => s.id === submissionId)
  const prevSubmission = currentIndex > 0 ? assignmentSubmissions[currentIndex - 1] : null
  const nextSubmission =
    currentIndex >= 0 && currentIndex < assignmentSubmissions.length - 1
      ? assignmentSubmissions[currentIndex + 1]
      : null

  // Active file/text tab on the left pane
  const [activeFileTab, setActiveFileTab] = useState<number>(0)

  // Local editable state for teacher grading review
  const [deductions, setDeductions] = useState<GradingDeduction[]>([])
  const [strengths, setStrengths] = useState<string[]>([])
  const [improvements, setImprovements] = useState<string[]>([])
  const [teacherComment, setTeacherComment] = useState<string>('')
  const [overrideReason, setOverrideReason] = useState<string>('')
  const [newStrength, setNewStrength] = useState<string>('')
  const [newImprovement, setNewImprovement] = useState<string>('')

  // Resubmission modal state
  const [showResubmitModal, setShowResubmitModal] = useState<boolean>(false)
  const [resubmitNote, setResubmitNote] = useState<string>('')

  // Sync state whenever submission or assignment changes
  useEffect(() => {
    if (submission) {
      if (submission.aiResult?.deductions) {
        setDeductions(JSON.parse(JSON.stringify(submission.aiResult.deductions)))
      } else if (assignment?.rubric) {
        // Fallback default empty deductions from rubric
        setDeductions(
          assignment.rubric.map((r) => ({
            criterionId: r.id,
            title: r.title,
            marksCut: 0,
            reason: 'Satisfied',
            evidence: '',
          }))
        )
      }

      setStrengths(submission.aiResult?.strengths ? [...submission.aiResult.strengths] : [])
      setImprovements(
        submission.aiResult?.improvements ? [...submission.aiResult.improvements] : []
      )
      setTeacherComment(submission.teacherComment || '')
      setActiveFileTab(0)
    }
  }, [submission?.id])

  if (!assignment || !submission) {
    return (
      <div className="p-8 text-center space-y-3">
        <h2 className="text-base font-semibold text-text">Submission not found</h2>
        <Button variant="secondary" onClick={() => navigate(`/classroom/${classId}`)}>
          Back to class
        </Button>
      </div>
    )
  }

  // Calculate live marks: maxMarks - sum(deductions) - latePenalty
  const latePenalty = submission.aiResult?.latePenalty ?? 0
  const totalDeductions = deductions.reduce((acc, d) => acc + (d.marksCut || 0), 0)
  const computedMarks = Math.max(0, assignment.maxMarks - totalDeductions - latePenalty)

  // Handle deduction change per criterion
  const handleDeductionChange = (index: number, newCut: number, newReason?: string) => {
    const updated = [...deductions]
    const crit = assignment.rubric.find((r) => r.id === updated[index].criterionId)
    const maxCut = crit ? crit.deductIfMissing : assignment.maxMarks
    const clampedCut = Math.max(0, Math.min(newCut, maxCut))

    updated[index] = {
      ...updated[index],
      marksCut: clampedCut,
      reason: newReason !== undefined ? newReason : updated[index].reason,
    }
    setDeductions(updated)
  }

  const handleSaveDraft = () => {
    store.updateSubmissionGrade(submission.id, {
      finalMarks: computedMarks,
      comment: teacherComment,
      deductions,
      strengths,
      improvements,
    })
    success('Grading draft saved', `Score set to ${computedMarks}/${assignment.maxMarks}.`)
  }

  const handleReturnToStudent = () => {
    // First save the override
    store.updateSubmissionGrade(submission.id, {
      finalMarks: computedMarks,
      comment: teacherComment,
      deductions,
      strengths,
      improvements,
    })
    // Then release
    store.returnSubmission(submission.id, teacherComment)
    success('Returned to student', `Marks (${computedMarks}/${assignment.maxMarks}) released to ${studentName}.`)
  }

  const handleConfirmResubmit = () => {
    if (!resubmitNote.trim()) return
    store.requestResubmission(submission.id, resubmitNote.trim())
    setShowResubmitModal(false)
    setResubmitNote('')
    success('Resubmission requested', `Notified ${studentName} to update and turn in revision.`)
  }

  const handleAddStrength = () => {
    if (!newStrength.trim()) return
    setStrengths([...strengths, newStrength.trim()])
    setNewStrength('')
  }

  const handleAddImprovement = () => {
    if (!newImprovement.trim()) return
    setImprovements([...improvements, newImprovement.trim()])
    setNewImprovement('')
  }

  // Submitted content to display on the left
  const submittedFiles = submission.files || []
  const hasFiles = submittedFiles.length > 0
  const submittedText = submission.text || ''

  // Determine current active content
  let currentFileContent = ''
  let currentFileName = 'pasted_submission.txt'
  if (hasFiles && activeFileTab < submittedFiles.length) {
    currentFileName = submittedFiles[activeFileTab].name
    currentFileContent = `// File: ${submittedFiles[activeFileTab].name}\n// Size: ${Math.round(submittedFiles[activeFileTab].sizeBytes / 1024)} KB\n\n`
    if (submittedText) {
      currentFileContent += submittedText
    } else {
      currentFileContent += `// [Binary or document content preview rendered for demonstration]\n// Extracted plain text lines:\n` +
        `import java.io.*;\nimport java.util.*;\n\npublic class FileReaderApp {\n    public static void main(String[] args) {\n        File file = new File("data.txt");\n        try (BufferedReader br = new BufferedReader(new FileReader(file))) {\n            String line;\n            while ((line = br.readLine()) != null) {\n                System.out.println(line);\n            }\n        } catch (FileNotFoundException e) {\n            System.err.println("File not found: " + e.getMessage());\n        } catch (IOException e) {\n            e.printStackTrace();\n        }\n    }\n}`
    }
  } else {
    currentFileContent = submittedText || '// No text submitted'
  }

  const contentLines = currentFileContent.split('\n')

  return (
    <div className="w-full space-y-4">
      {/* Top Header / Breadcrumb & Navigator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <Link
              to={`/classroom/${currentClass.id}/assignments/${assignment.id}`}
              className="hover:text-text flex items-center gap-1 text-accent"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {assignment.title}
            </Link>
            <span>/</span>
            <span className="text-text font-medium">Review submission</span>
          </div>

          <div className="flex items-center gap-2.5 pt-0.5">
            <h1 className="text-lg font-semibold text-text">{studentName}</h1>
            <span
              className={cn(
                'text-xs px-2 py-0.5 rounded-control font-medium capitalize',
                submission.status === 'returned'
                  ? 'bg-success/15 text-success border border-success/30'
                  : submission.status === 'graded_draft'
                  ? 'bg-accent/15 text-accent border border-accent/30'
                  : submission.status === 'late'
                  ? 'bg-warning/15 text-warning border border-warning/30'
                  : 'bg-surface-sunken text-text-muted border border-border'
              )}
            >
              {submission.status.replace('_', ' ')}
            </span>
            <span className="text-xs text-text-muted">
              Attempt {submission.attempt}
            </span>
            {submission.flagReason && (
              <span className="text-xs px-2 py-0.5 rounded-control bg-warning/15 text-warning border border-warning/30 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {submission.flagReason}
              </span>
            )}
          </div>
        </div>

        {/* Prev / Next Student Navigation */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted mr-1">
            {currentIndex + 1} of {assignmentSubmissions.length}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={!prevSubmission}
            leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
            onClick={() =>
              prevSubmission &&
              navigate(
                `/classroom/${currentClass.id}/assignments/${assignment.id}/submissions/${prevSubmission.id}`
              )
            }
          >
            Prev
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={!nextSubmission}
            rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
            onClick={() =>
              nextSubmission &&
              navigate(
                `/classroom/${currentClass.id}/assignments/${assignment.id}/submissions/${nextSubmission.id}`
              )
            }
          >
            Next
          </Button>
        </div>
      </div>

      {/* Flag Alert Banner (e.g. Similarity > 0.8 or Low Confidence) */}
      {submission.flagReason && (
        <div className="p-3.5 rounded-card border border-warning/30 bg-warning/10 text-xs text-warning flex items-start gap-3">
          <ShieldAlert className="w-4 h-4 text-warning shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <div className="font-semibold">Plagiarism / Similarity Alert</div>
            <div>
              {submission.flagReason}. Manual inspection is required. Compare logic and structure with related submissions before releasing grades.
            </div>
          </div>
        </div>
      )}

      {/* Main Two-Pane Review Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start min-h-[640px]">
        {/* ================================================================= */}
        {/* LEFT PANE: STUDENT'S WORK (6 cols) */}
        {/* ================================================================= */}
        <div className="lg:col-span-6 rounded-card border border-border bg-surface flex flex-col h-[750px] overflow-hidden">
          {/* File Switcher Tabs */}
          <div className="flex items-center justify-between border-b border-border bg-surface-sunken px-3 py-2 shrink-0">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {submittedFiles.map((f, idx) => (
                <button
                  key={f.id || idx}
                  onClick={() => setActiveFileTab(idx)}
                  className={cn(
                    'px-2.5 py-1 rounded text-xs font-mono transition-colors flex items-center gap-1.5 shrink-0',
                    activeFileTab === idx
                      ? 'bg-surface text-text font-medium border border-border shadow-xs'
                      : 'text-text-muted hover:text-text'
                  )}
                >
                  <FileCode className="w-3.5 h-3.5 text-accent" />
                  <span className="truncate max-w-[120px]">{f.name}</span>
                </button>
              ))}

              {submittedText && submittedFiles.length === 0 && (
                <div className="px-2.5 py-1 rounded text-xs font-mono bg-surface text-text font-medium border border-border">
                  pasted_code.txt
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-text-muted">
              <span>{contentLines.length} lines</span>
              {submittedFiles[activeFileTab]?.url && (
                <a
                  href={submittedFiles[activeFileTab].url}
                  download={submittedFiles[activeFileTab].name}
                  className="text-accent hover:underline flex items-center gap-1 text-[11px]"
                >
                  <Download className="w-3 h-3" /> Download
                </a>
              )}
            </div>
          </div>

          {/* Code Viewer with Line Numbers */}
          <div className="flex-1 p-3 overflow-y-auto font-mono text-xs text-text bg-surface-sunken/40 space-y-0.5">
            {contentLines.map((line, lineIdx) => {
              // Highlight line if evidence matches
              const lineNo = lineIdx + 1
              const isEvidenceMatch = deductions.some(
                (d) => d.evidence && d.evidence.includes(line.trim()) && line.trim().length > 6
              )

              return (
                <div
                  key={lineIdx}
                  className={cn(
                    'flex items-start gap-3 py-0.5 px-2 rounded',
                    isEvidenceMatch ? 'bg-danger/15 border-l-2 border-danger' : 'hover:bg-surface-sunken'
                  )}
                >
                  <span className="text-[11px] text-text-muted select-none w-7 text-right shrink-0">
                    {lineNo}
                  </span>
                  <span className="flex-1 break-all whitespace-pre-wrap">{line || ' '}</span>
                </div>
              )
            })}
          </div>

          {/* Left Footer: Submission Details */}
          <div className="p-3 border-t border-border bg-surface text-xs text-text-muted flex items-center justify-between shrink-0">
            <div>
              Submitted:{' '}
              {submission.submittedAt
                ? new Date(submission.submittedAt).toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Unknown'}
            </div>
            {submission.status === 'late' && (
              <span className="text-warning font-medium">Late submission penalty applied</span>
            )}
          </div>
        </div>

        {/* ================================================================= */}
        {/* RIGHT PANE: GRADING BREAKDOWN & TEACHER OVERRIDE (6 cols) */}
        {/* ================================================================= */}
        <div className="lg:col-span-6 rounded-card border border-border bg-surface p-5 flex flex-col h-[750px] overflow-hidden space-y-4">
          {/* Header Score Overview */}
          <div className="p-4 rounded-control bg-surface-sunken border border-border flex items-center justify-between gap-4 shrink-0">
            <div className="space-y-1">
              <span className="text-xs text-text-muted uppercase tracking-wider font-medium">
                Evaluated Score
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-text tabular-nums">{computedMarks}</span>
                <span className="text-sm text-text-muted">/ {assignment.maxMarks} marks</span>
              </div>
              <div className="text-[11px] text-text-muted flex items-center gap-2">
                <span>Checking level: <strong className="capitalize text-text">{assignment.checkingLevel}</strong></span>
                <span>·</span>
                <span>AI Confidence: <strong className="capitalize text-text">{submission.aiResult?.confidence || 'High'}</strong></span>
              </div>
            </div>

            <div className="text-right space-y-1">
              {submission.aiResult?.awarded !== undefined && (
                <div className="text-xs text-text-muted">
                  Original AI: <strong className="text-text">{submission.aiResult.awarded}</strong>
                </div>
              )}
              {latePenalty > 0 && (
                <div className="text-xs text-warning">
                  Late cut: -{latePenalty}
                </div>
              )}
              <div className="text-[11px] text-text-muted">
                Deductions total: -{totalDeductions}
              </div>
            </div>
          </div>

          {/* Scrollable Rubric Deductions Form */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
            <div className="flex items-center justify-between pb-1 border-b border-border">
              <span className="font-semibold text-text uppercase tracking-wider text-[11px]">
                Rubric Criteria Deductions
              </span>
              <span className="text-text-muted text-[11px]">Adjust cuts as needed</span>
            </div>

            {deductions.map((ded, idx) => {
              const crit = assignment.rubric.find((r) => r.id === ded.criterionId)
              const maxCut = crit ? crit.deductIfMissing : assignment.maxMarks

              return (
                <div
                  key={idx}
                  className={cn(
                    'p-3.5 rounded-control border space-y-2 transition-colors',
                    ded.marksCut > 0
                      ? 'border-danger/30 bg-danger/5'
                      : 'border-border bg-surface-sunken'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-text flex items-center gap-2">
                        <span>{crit?.title || ded.title}</span>
                        {crit && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface border border-border text-text-muted capitalize">
                            {crit.type.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                      {crit?.description && (
                        <p className="text-[11px] text-text-muted leading-tight">
                          {crit.description}
                        </p>
                      )}
                    </div>

                    {/* Interactive Deduction Cut Input */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-text-muted text-[11px]">Cut:</span>
                      <input
                        type="number"
                        min={0}
                        max={maxCut}
                        value={ded.marksCut}
                        onChange={(e) => handleDeductionChange(idx, Number(e.target.value))}
                        className={cn(
                          'w-14 bg-surface border rounded px-2 py-1 text-xs font-semibold tabular-nums text-center outline-none focus:border-accent',
                          ded.marksCut > 0
                            ? 'border-danger text-danger'
                            : 'border-border text-text'
                        )}
                      />
                      <span className="text-[11px] text-text-muted">/ {maxCut}</span>
                    </div>
                  </div>

                  {/* AI Reason & Evidence */}
                  <div className="space-y-1 pt-1">
                    <div className="flex items-start gap-1.5">
                      <span className="text-[11px] text-text-muted shrink-0 font-medium">
                        Reason:
                      </span>
                      <input
                        type="text"
                        value={ded.reason}
                        onChange={(e) => handleDeductionChange(idx, ded.marksCut, e.target.value)}
                        className="w-full bg-surface border border-border rounded px-2 py-0.5 text-[11px] text-text outline-none focus:border-accent"
                      />
                    </div>

                    {ded.evidence && (
                      <div className="text-[10px] font-mono bg-surface p-1.5 rounded border border-border text-text-muted truncate">
                        Evidence: {ded.evidence}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Strengths and Improvements Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {/* Strengths */}
              <div className="p-3 rounded-control border border-border bg-surface-sunken space-y-2">
                <div className="font-semibold text-text text-[11px] flex items-center justify-between">
                  <span>Strengths</span>
                  <span className="text-success">{strengths.length}</span>
                </div>
                <div className="space-y-1">
                  {strengths.map((str, sIdx) => (
                    <div
                      key={sIdx}
                      className="flex items-center justify-between text-[11px] text-text bg-surface p-1.5 rounded border border-border"
                    >
                      <span className="truncate">{str}</span>
                      <button
                        onClick={() => setStrengths(strengths.filter((_, i) => i !== sIdx))}
                        className="text-text-muted hover:text-danger ml-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 pt-1">
                  <input
                    type="text"
                    value={newStrength}
                    onChange={(e) => setNewStrength(e.target.value)}
                    placeholder="Add positive point..."
                    className="w-full bg-surface border border-border rounded px-2 py-1 text-[11px] text-text outline-none focus:border-accent"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddStrength()}
                  />
                  <Button variant="secondary" size="sm" onClick={handleAddStrength}>
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* Improvements */}
              <div className="p-3 rounded-control border border-border bg-surface-sunken space-y-2">
                <div className="font-semibold text-text text-[11px] flex items-center justify-between">
                  <span>Areas to improve</span>
                  <span className="text-warning">{improvements.length}</span>
                </div>
                <div className="space-y-1">
                  {improvements.map((imp, iIdx) => (
                    <div
                      key={iIdx}
                      className="flex items-center justify-between text-[11px] text-text bg-surface p-1.5 rounded border border-border"
                    >
                      <span className="truncate">{imp}</span>
                      <button
                        onClick={() => setImprovements(improvements.filter((_, i) => i !== iIdx))}
                        className="text-text-muted hover:text-danger ml-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 pt-1">
                  <input
                    type="text"
                    value={newImprovement}
                    onChange={(e) => setNewImprovement(e.target.value)}
                    placeholder="Add improvement..."
                    className="w-full bg-surface border border-border rounded px-2 py-1 text-[11px] text-text outline-none focus:border-accent"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddImprovement()}
                  />
                  <Button variant="secondary" size="sm" onClick={handleAddImprovement}>
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Teacher Comment Box */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-semibold text-text block">
                Teacher feedback & comment to student
              </label>
              <textarea
                rows={3}
                value={teacherComment}
                onChange={(e) => setTeacherComment(e.target.value)}
                placeholder="Write constructive notes for the student..."
                className="w-full bg-surface-sunken border border-border rounded-control p-2.5 text-xs text-text outline-none focus:border-accent font-sans"
              />
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-3 border-t border-border flex items-center justify-between gap-3 shrink-0">
            <Button
              variant="secondary"
              size="sm"
              className="text-danger hover:border-danger/40"
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              onClick={() => setShowResubmitModal(true)}
            >
              Request resubmission
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Save className="w-3.5 h-3.5" />}
                onClick={handleSaveDraft}
              >
                Save as draft
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Send className="w-3.5 h-3.5" />}
                onClick={handleReturnToStudent}
              >
                Return to student
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Resubmission Modal */}
      {showResubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-card p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="text-base font-semibold text-text">Request resubmission</h3>
              <button
                onClick={() => setShowResubmitModal(false)}
                className="text-text-muted hover:text-text"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-text-muted">
                Provide instructions for what the student needs to fix or supply in attempt {submission.attempt + 1}:
              </p>
              <textarea
                rows={4}
                value={resubmitNote}
                onChange={(e) => setResubmitNote(e.target.value)}
                placeholder="e.g. Please include your custom exception class and rerun the sample input."
                className="w-full bg-surface-sunken border border-border rounded-control p-2.5 text-text outline-none focus:border-accent"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
              <Button variant="secondary" onClick={() => setShowResubmitModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                disabled={!resubmitNote.trim()}
                onClick={handleConfirmResubmit}
              >
                Send request
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function subName(sub?: Submission, student?: any): string {
  if (!sub) return 'Student'
  if (sub.studentName) return sub.studentName
  if (student?.name) return student.name
  return sub.studentId
}
