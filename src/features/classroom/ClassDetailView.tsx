import React, { useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  School,
  FileText,
  BookOpen,
  Users,
  BarChart2,
  Plus,
  Pin,
  Paperclip,
  ExternalLink,
  Trash2,
  Edit2,
  Copy,
  Check,
  Download,
  Eye,
  MessageSquare,
  AlertTriangle,
  Clock,
  Send,
  X,
  FileCheck,
  Upload,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useApp } from '@/context/AppContext'
import { useToast } from '@/context/ToastContext'
import { store, useStore } from '@/mocks/store'
import {
  ClassRoom,
  Note,
  Assignment,
  CheckingLevel,
  RubricCriterion,
  Attachment,
  StreamPost,
  ClassComment,
} from '@/types'
import { cn } from '@/lib/utils'
import { exportToCsv } from '@/lib/exportCsv'

export const ClassDetailView: React.FC = () => {
  const { classId } = useParams<{ classId: string }>()
  const { role, currentUser } = useApp()
  const { success, error } = useToast()
  const navigate = useNavigate()

  const classes = useStore((s) => s.classes)
  const notes = useStore((s) => s.notes)
  const assignments = useStore((s) => s.assignments)
  const submissions = useStore((s) => s.submissions)
  const streamPosts = useStore((s) => s.streamPosts)
  const trainers = useStore((s) => s.trainers)
  const batches = useStore((s) => s.batches)
  const students = useStore((s) => s.students)

  const currentClass = classes.find((c) => c.id === classId) || classes[0]
  const isTeacherOrAdmin = role === 'trainer' || role === 'owner' || role === 'admin'

  const [activeTab, setActiveTab] = useState<'stream' | 'notes' | 'assignments' | 'people' | 'grades'>('stream')
  const [copiedCode, setCopiedCode] = useState(false)

  // Stream state
  const [announcementText, setAnnouncementText] = useState('')
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({})

  // Notes state
  const [showUploadNoteModal, setShowUploadNoteModal] = useState(false)
  const [noteTitle, setNoteTitle] = useState('')
  const [noteTopic, setNoteTopic] = useState('')
  const [noteDesc, setNoteDesc] = useState('')
  const [noteLinks, setNoteLinks] = useState<string[]>([])
  const [newLinkInput, setNewLinkInput] = useState('')
  const [noteFiles, setNoteFiles] = useState<Attachment[]>([])
  const [multiClassIds, setMultiClassIds] = useState<string[]>([])
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null)
  const [topicFilter, setTopicFilter] = useState<string>('all')

  // Assignment Creation modal state
  const [showCreateAssignmentModal, setShowCreateAssignmentModal] = useState(false)
  const [asgTitle, setAsgTitle] = useState('')
  const [asgInstructions, setAsgInstructions] = useState('')
  const [asgMaxMarks, setAsgMaxMarks] = useState<number>(20)
  const [asgDueAt, setAsgDueAt] = useState('2026-10-25T23:59')
  const [asgAllowLate, setAsgAllowLate] = useState(true)
  const [asgLatePenalty, setAsgLatePenalty] = useState(2)
  const [asgLevel, setAsgLevel] = useState<CheckingLevel>('medium')
  const [asgReleaseMode, setAsgReleaseMode] = useState<'teacher_review' | 'auto_release'>('teacher_review')
  const [asgRefSolution, setAsgRefSolution] = useState('')
  const [asgAttachments, setAsgAttachments] = useState<Attachment[]>([])
  const asgFileInputRef = useRef<HTMLInputElement>(null)
  const [asgRubric, setAsgRubric] = useState<RubricCriterion[]>([
    {
      id: 'crit-1',
      title: 'try-with-resources',
      description: 'Auto-closes FileReader/BufferedReader resource cleanly without manual finally',
      type: 'must_include',
      deductIfMissing: 5,
      partialAllowed: false,
    },
    {
      id: 'crit-2',
      title: 'custom exception class',
      description: 'Defines and throws a domain-specific custom exception inheriting from Exception',
      type: 'must_include',
      deductIfMissing: 5,
      partialAllowed: false,
    },
    {
      id: 'crit-3',
      title: 'handles FileNotFoundException',
      description: 'Explicit catch block for missing files with helpful error message',
      type: 'correctness',
      deductIfMissing: 4,
      partialAllowed: true,
    },
    {
      id: 'crit-4',
      title: 'comments explaining logic',
      description: 'Clear inline or Javadoc comments explaining the file parsing and error propagation',
      type: 'format',
      deductIfMissing: 2,
      partialAllowed: true,
    },
    {
      id: 'crit-5',
      title: 'output screenshot / execution logs',
      description: 'Verified console output logs proving execution on sample input',
      type: 'format',
      deductIfMissing: 4,
      partialAllowed: false,
    },
  ])

  if (!currentClass) {
    return (
      <div className="p-8 text-center space-y-3">
        <h2 className="text-base font-semibold text-text">Classroom not found</h2>
        <Button variant="secondary" onClick={() => navigate('/classroom')}>
          Return to classes
        </Button>
      </div>
    )
  }

  const batch = batches.find((b) => b.id === currentClass.batchId)
  const classStudents = students.filter((s) => s.batchIds.includes(currentClass.batchId))
  const classTeachers = trainers.filter((t) => currentClass.teacherIds.includes(t.id))
  const classNotes = notes.filter((n) => n.classId === currentClass.id)
  const classAssignments = assignments.filter((a) => a.classId === currentClass.id)
  const classPosts = streamPosts.filter((p) => p.classId === currentClass.id)

  // Other classes taught by this teacher with same subject for multi-post option
  const otherSameSubjectClasses = classes.filter(
    (c) => c.id !== currentClass.id && c.subject === currentClass.subject
  )

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentClass.code)
    setCopiedCode(true)
    success('Join code copied', `Code: ${currentClass.code}`)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  // --- STREAM ACTIONS ---
  const handlePostAnnouncement = () => {
    if (!announcementText.trim()) return
    const newPost: StreamPost = {
      id: `post-${Date.now()}`,
      classId: currentClass.id,
      type: 'announcement',
      title: announcementText.slice(0, 60),
      content: announcementText,
      authorName: currentUser.name,
      authorRole: currentUser.role,
      createdAt: 'Just now',
      comments: [],
    }
    store.addStreamPost(newPost)
    setAnnouncementText('')
    success('Announcement published', 'Shared with all students in this class.')
  }

  const handleAddComment = (postId: string) => {
    const text = commentInputs[postId]?.trim()
    if (!text) return

    const newComment: ClassComment = {
      id: `comm-${Date.now()}`,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorRole: currentUser.role,
      content: text,
      createdAt: 'Just now',
    }
    store.addCommentToPost(postId, newComment)
    setCommentInputs((prev) => ({ ...prev, [postId]: '' }))
  }

  // --- NOTE ACTIONS ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const newAtts: Attachment[] = []
    for (let i = 0; i < files.length; i++) {
      const f = files[i]
      if (f.size > 25 * 1024 * 1024) {
        error('File too large', `${f.name} exceeds 25 MB limit.`)
        continue
      }
      newAtts.push({
        id: `att-${Date.now()}-${i}`,
        name: f.name,
        mimeType: f.type || 'application/octet-stream',
        sizeBytes: f.size,
        url: URL.createObjectURL(f),
      })
    }
    setNoteFiles((prev) => [...prev, ...newAtts])
  }

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault()
    if (!noteTitle.trim()) {
      error('Validation error', 'Please enter a note title.')
      return
    }

    const newNote: Note = {
      id: `note-${Date.now()}`,
      classId: currentClass.id,
      title: noteTitle.trim(),
      topic: noteTopic.trim() || undefined,
      description: noteDesc.trim() || undefined,
      files: noteFiles,
      links: noteLinks,
      uploadedBy: currentUser.name,
      uploadedAt: 'Just now',
      pinned: false,
    }

    store.addNote(newNote, multiClassIds)
    setShowUploadNoteModal(false)
    setNoteTitle('')
    setNoteTopic('')
    setNoteDesc('')
    setNoteFiles([])
    setNoteLinks([])
    setMultiClassIds([])
    success(
      'Study notes uploaded',
      multiClassIds.length > 0
        ? `Posted to ${currentClass.name} and ${multiClassIds.length} other class(es).`
        : `Published to ${currentClass.name}.`
    )
  }

  // --- ASSIGNMENT ACTIONS ---
  const sumDeductions = asgRubric.reduce((acc, curr) => acc + curr.deductIfMissing, 0)
  const isDeductionOverflow = sumDeductions > asgMaxMarks

  const applyRubricTemplate = (templateType: 'programming' | 'theory' | 'lab') => {
    if (templateType === 'programming') {
      setAsgRubric([
        { id: `crit-${Date.now()}-1`, title: 'try-with-resources', description: 'Resource cleanup without leaks', type: 'must_include', deductIfMissing: 5, partialAllowed: false },
        { id: `crit-${Date.now()}-2`, title: 'custom exception class', description: 'Domain-specific exception class', type: 'must_include', deductIfMissing: 5, partialAllowed: false },
        { id: `crit-${Date.now()}-3`, title: 'handles FileNotFoundException', description: 'Catch block with user guidance', type: 'correctness', deductIfMissing: 4, partialAllowed: true },
        { id: `crit-${Date.now()}-4`, title: 'comments explaining logic', description: 'Inline documentation', type: 'format', deductIfMissing: 2, partialAllowed: true },
        { id: `crit-${Date.now()}-5`, title: 'output screenshot / execution logs', description: 'Verified console output', type: 'format', deductIfMissing: 4, partialAllowed: false },
      ])
    } else if (templateType === 'theory') {
      setAsgRubric([
        { id: `crit-${Date.now()}-1`, title: 'core definition and principles', description: 'Accurate technical definition', type: 'concept', deductIfMissing: 8, partialAllowed: true },
        { id: `crit-${Date.now()}-2`, title: 'architectural diagram or flow', description: 'Structured visual/component flow', type: 'format', deductIfMissing: 6, partialAllowed: true },
        { id: `crit-${Date.now()}-3`, title: 'practical real-world example', description: 'Industrial use case illustration', type: 'must_include', deductIfMissing: 6, partialAllowed: false },
      ])
    } else {
      setAsgRubric([
        { id: `crit-${Date.now()}-1`, title: 'problem statement and objectives', description: 'Clear experimental objectives', type: 'format', deductIfMissing: 4, partialAllowed: true },
        { id: `crit-${Date.now()}-2`, title: 'implementation code', description: 'Source code matching algorithm', type: 'correctness', deductIfMissing: 8, partialAllowed: true },
        { id: `crit-${Date.now()}-3`, title: 'test cases & output verification', description: 'Edge case tests and results', type: 'must_include', deductIfMissing: 5, partialAllowed: false },
        { id: `crit-${Date.now()}-4`, title: 'conclusion and analysis', description: 'Time & space complexity insights', type: 'concept', deductIfMissing: 3, partialAllowed: true },
      ])
    }
  }

  const handleAsgFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const newAtts: Attachment[] = []
    for (let i = 0; i < files.length; i++) {
      const f = files[i]
      if (f.size > 25 * 1024 * 1024) {
        error('File too large', `${f.name} exceeds 25 MB limit.`)
        continue
      }
      newAtts.push({
        id: `att-asg-${Date.now()}-${i}`,
        name: f.name,
        mimeType: f.type || 'application/octet-stream',
        sizeBytes: f.size,
        url: URL.createObjectURL(f),
      })
    }
    setAsgAttachments((prev) => [...prev, ...newAtts])
    if (asgFileInputRef.current) asgFileInputRef.current.value = ''
    success('File attached', `${files.length} file(s) attached to assignment.`)
  }

  const handleRemoveAsgAttachment = (attId: string) => {
    setAsgAttachments((prev) => prev.filter((a) => a.id !== attId))
  }

  const handleCreateAssignment = (publishStatus: 'published' | 'draft') => {
    if (!asgTitle.trim()) {
      error('Validation error', 'Please provide an assignment title.')
      return
    }

    const newAsg: Assignment = {
      id: `asg-${Date.now()}`,
      classId: currentClass.id,
      title: asgTitle.trim(),
      instructions: asgInstructions.trim() || 'Complete the assignment following the rubric parameters.',
      attachments: asgAttachments,
      maxMarks: asgMaxMarks,
      dueAt: asgDueAt,
      allowLate: asgAllowLate,
      latePenaltyPerDay: asgLatePenalty,
      checkingLevel: asgLevel,
      rubric: asgRubric,
      referenceSolution: asgRefSolution.trim() || undefined,
      releaseMode: asgReleaseMode,
      status: publishStatus,
      createdBy: currentUser.name,
      createdAt: 'Just now',
    }

    store.createAssignment(newAsg, true)
    setShowCreateAssignmentModal(false)
    setAsgTitle('')
    setAsgInstructions('')
    setAsgRefSolution('')
    setAsgAttachments([])
    success(
      publishStatus === 'published' ? 'Assignment published' : 'Assignment saved as draft',
      `Rubric configured with ${newAsg.rubric.length} parameters and ${newAsg.attachments.length} attachment(s).`
    )
  }

  // --- GRADES MATRIX EXPORT ---
  const handleExportGrades = () => {
    const exportRows = classStudents.map((st) => {
      const row: Record<string, any> = {
        'Student ID': st.id,
        'Student Name': st.name,
        Email: st.email,
      }
      let totalAwarded = 0
      let countGraded = 0

      classAssignments.forEach((a) => {
        const sub = submissions.find((s) => s.assignmentId === a.id && s.studentId === st.id)
        if (sub && sub.status === 'returned') {
          const marks = sub.finalMarks ?? sub.aiResult?.awarded ?? 0
          row[a.title] = `${marks} / ${a.maxMarks}`
          totalAwarded += marks
          countGraded++
        } else if (sub && (sub.status === 'submitted' || sub.status === 'graded_draft')) {
          row[a.title] = 'Submitted (Pending Review)'
        } else if (sub && sub.status === 'late') {
          row[a.title] = 'Late'
        } else {
          row[a.title] = 'Missing'
        }
      })

      row['Average Marks'] = countGraded > 0 ? (totalAwarded / countGraded).toFixed(1) : '—'
      return row
    })

    exportToCsv(exportRows, `${currentClass.code}_grades_matrix.csv`)
    success('Grades matrix exported', `Downloaded ledger for ${classStudents.length} candidates.`)
  }

  // Topic filter options
  const topics = Array.from(new Set(classNotes.map((n) => n.topic).filter(Boolean))) as string[]

  const filteredNotes = classNotes
    .filter((n) => (topicFilter === 'all' ? true : n.topic === topicFilter))
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))

  return (
    <div className="space-y-4">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate('/classroom')}
          className="text-xs text-text-muted hover:text-text inline-flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to classrooms</span>
        </button>
      </div>

      {/* Classroom Header Banner */}
      <div className="p-5 rounded-card border border-border bg-surface space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-text-muted border border-border px-1.5 py-0.5 rounded bg-surface-sunken">
                {currentClass.year} · {currentClass.division}
              </span>
              <h1 className="text-xl font-semibold text-text">{currentClass.name}</h1>
            </div>
            <p className="text-xs text-text-muted mt-1">
              Subject: <strong className="text-text font-medium">{currentClass.subject}</strong> · Batch: {batch?.name || currentClass.batchId} ({batch?.branch} Campus)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCode}
              className="px-2.5 py-1.5 rounded-control bg-surface-sunken border border-border text-xs font-mono text-text hover:border-border-strong flex items-center gap-1.5 transition-colors"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5 text-text-muted" />}
              <span>Code: {currentClass.code}</span>
            </button>
          </div>
        </div>

        {/* Faculty & stats row */}
        <div className="flex items-center gap-4 text-xs text-text-muted pt-2 border-t border-border flex-wrap">
          <div>
            Faculty:{' '}
            <span className="text-text font-medium">
              {classTeachers.map((t) => t.name).join(', ')}
            </span>
          </div>
          <div>
            Students: <span className="tabular-nums font-medium text-text">{classStudents.length}</span>
          </div>
          <div>
            Published Notes: <span className="tabular-nums font-medium text-text">{classNotes.length}</span>
          </div>
          <div>
            Active Assignments: <span className="tabular-nums font-medium text-text">{classAssignments.length}</span>
          </div>
        </div>
      </div>

      {/* Sub-nav Tabs */}
      <div className="flex items-center gap-1 border-b border-border text-xs font-medium overflow-x-auto">
        <button
          onClick={() => setActiveTab('stream')}
          className={cn(
            'py-2 px-3 border-b-2 transition-colors whitespace-nowrap',
            activeTab === 'stream'
              ? 'border-accent text-accent font-semibold'
              : 'border-transparent text-text-muted hover:text-text'
          )}
        >
          Stream
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={cn(
            'py-2 px-3 border-b-2 transition-colors whitespace-nowrap',
            activeTab === 'notes'
              ? 'border-accent text-accent font-semibold'
              : 'border-transparent text-text-muted hover:text-text'
          )}
        >
          Notes ({classNotes.length})
        </button>
        <button
          onClick={() => setActiveTab('assignments')}
          className={cn(
            'py-2 px-3 border-b-2 transition-colors whitespace-nowrap',
            activeTab === 'assignments'
              ? 'border-accent text-accent font-semibold'
              : 'border-transparent text-text-muted hover:text-text'
          )}
        >
          Assignments ({classAssignments.length})
        </button>
        <button
          onClick={() => setActiveTab('people')}
          className={cn(
            'py-2 px-3 border-b-2 transition-colors whitespace-nowrap',
            activeTab === 'people'
              ? 'border-accent text-accent font-semibold'
              : 'border-transparent text-text-muted hover:text-text'
          )}
        >
          People ({classStudents.length})
        </button>
        {isTeacherOrAdmin && (
          <button
            onClick={() => setActiveTab('grades')}
            className={cn(
              'py-2 px-3 border-b-2 transition-colors whitespace-nowrap',
              activeTab === 'grades'
                ? 'border-accent text-accent font-semibold'
                : 'border-transparent text-text-muted hover:text-text'
            )}
          >
            Grades
          </button>
        )}
      </div>

      {/* --- TAB 1: STREAM --- */}
      {activeTab === 'stream' && (
        <div className="space-y-4">
          {/* Post announcement box (teachers/admin) */}
          {isTeacherOrAdmin && (
            <div className="p-4 rounded-card border border-border bg-surface space-y-3">
              <div className="text-xs font-medium text-text">Announce something to your class</div>
              <textarea
                rows={3}
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                placeholder="Share assignment hints, schedule updates, or lecture materials with your cohort…"
                className="w-full p-3 rounded-control bg-surface-sunken border border-border text-xs text-text focus:outline-none focus:border-border-strong resize-none placeholder:text-text-muted"
              />
              <div className="flex justify-end">
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!announcementText.trim()}
                  onClick={handlePostAnnouncement}
                  leftIcon={<Send className="w-3.5 h-3.5" />}
                >
                  Post announcement
                </Button>
              </div>
            </div>
          )}

          {/* Posts timeline */}
          <div className="space-y-3">
            {classPosts.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-border rounded-card bg-surface text-xs text-text-muted">
                No stream updates yet.
              </div>
            ) : (
              classPosts.map((post) => (
                <div key={post.id} className="p-4 rounded-card border border-border bg-surface space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-surface-sunken border border-border text-[10px] font-medium flex items-center justify-center text-text">
                        {post.authorName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-semibold text-text">{post.authorName}</span>
                        <span className="text-[10px] text-text-muted ml-1.5 uppercase font-mono">
                          ({post.authorRole})
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] text-text-muted">{post.createdAt}</span>
                  </div>

                  <div>
                    <h3 className="text-xs font-semibold text-text">{post.title}</h3>
                    {post.content && (
                      <p className="text-xs text-text-muted mt-1 leading-relaxed whitespace-pre-wrap">
                        {post.content}
                      </p>
                    )}
                  </div>

                  {post.refId && post.type === 'assignment' && (
                    <div className="pt-1">
                      <Button
                        variant="secondary"
                        size="xs"
                        onClick={() => navigate(`/classroom/${currentClass.id}/assignments/${post.refId}`)}
                        leftIcon={<BookOpen className="w-3 h-3" />}
                      >
                        View assignment & rubric
                      </Button>
                    </div>
                  )}

                  {/* Comments section */}
                  <div className="pt-3 border-t border-border space-y-2 text-xs">
                    {post.comments && post.comments.length > 0 && (
                      <div className="space-y-2">
                        {post.comments.map((comm) => (
                          <div key={comm.id} className="p-2.5 rounded-control bg-surface-sunken flex items-start justify-between gap-2">
                            <div>
                              <div className="font-medium text-text text-[11px]">
                                {comm.authorName}{' '}
                                <span className="text-text-muted font-normal text-[10px] ml-1">
                                  {comm.createdAt}
                                </span>
                              </div>
                              <p className="text-xs text-text-muted mt-0.5">{comm.content}</p>
                            </div>
                            {isTeacherOrAdmin && (
                              <button
                                onClick={() => store.deleteComment(post.id, comm.id)}
                                className="text-text-muted hover:text-danger p-0.5"
                                title="Delete comment"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add comment input */}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={commentInputs[post.id] || ''}
                        onChange={(e) =>
                          setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddComment(post.id)
                        }}
                        placeholder="Add a class comment…"
                        className="flex-1 px-3 py-1.5 rounded-control bg-surface-sunken border border-border text-xs text-text focus:outline-none focus:border-border-strong placeholder:text-text-muted"
                      />
                      <Button
                        variant="secondary"
                        size="xs"
                        onClick={() => handleAddComment(post.id)}
                      >
                        Post
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* --- TAB 2: NOTES --- */}
      {activeTab === 'notes' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Filter by Topic */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted">Topic:</span>
              <select
                value={topicFilter}
                onChange={(e) => setTopicFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-control bg-surface border border-border text-xs text-text focus:outline-none focus:border-border-strong"
              >
                <option value="all">All topics</option>
                {topics.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {isTeacherOrAdmin && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowUploadNoteModal(true)}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Upload notes
              </Button>
            )}
          </div>

          {filteredNotes.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-border rounded-card bg-surface space-y-2">
              <FileText className="w-8 h-8 text-text-muted mx-auto" />
              <h3 className="text-sm font-semibold text-text">No notes yet</h3>
              <p className="text-xs text-text-muted max-w-sm mx-auto">
                {isTeacherOrAdmin
                  ? 'Upload the first study material, slide deck, or code notes for this cohort.'
                  : 'Your instructors have not published lecture notes yet.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className={cn(
                    'p-4 rounded-card border bg-surface space-y-3 transition-colors flex flex-col justify-between',
                    note.pinned ? 'border-accent/40 bg-accent/5' : 'border-border'
                  )}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        {note.topic && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-surface-sunken border border-border text-text-muted">
                            {note.topic}
                          </span>
                        )}
                        <h3 className="text-sm font-semibold text-text">{note.title}</h3>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {note.pinned && (
                          <span className="text-[10px] text-accent flex items-center gap-1 font-medium bg-accent/10 px-1.5 py-0.5 rounded">
                            <Pin className="w-3 h-3" /> Pinned
                          </span>
                        )}
                        {isTeacherOrAdmin && (
                          <>
                            <button
                              onClick={() => store.togglePinNote(note.id)}
                              className="p-1 text-text-muted hover:text-text rounded-control"
                              title={note.pinned ? 'Unpin note' : 'Pin note to top'}
                            >
                              <Pin className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Delete notes "${note.title}"?`)) {
                                  store.deleteNote(note.id)
                                  success('Note deleted')
                                }
                              }}
                              className="p-1 text-text-muted hover:text-danger rounded-control"
                              title="Delete note"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {note.description && (
                      <p className="text-xs text-text-muted leading-relaxed line-clamp-3">
                        {note.description}
                      </p>
                    )}

                    {/* Files list */}
                    {note.files.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <div className="text-[11px] font-medium text-text-muted">Attachments:</div>
                        <div className="space-y-1">
                          {note.files.map((f) => (
                            <div
                              key={f.id}
                              className="p-2 rounded-control bg-surface-sunken border border-border flex items-center justify-between text-xs"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <Paperclip className="w-3.5 h-3.5 text-text-muted shrink-0" />
                                <span className="truncate text-text font-medium">{f.name}</span>
                                <span className="text-[10px] text-text-muted tabular-nums shrink-0">
                                  ({(f.sizeBytes / 1024 / 1024).toFixed(1)} MB)
                                </span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0 ml-2">
                                <button
                                  onClick={() => setPreviewAttachment(f)}
                                  className="p-1 text-accent hover:underline flex items-center gap-1 text-[11px]"
                                >
                                  <Eye className="w-3 h-3" /> Preview
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* External Links */}
                    {note.links.length > 0 && (
                      <div className="space-y-1 pt-1">
                        <div className="text-[11px] font-medium text-text-muted">External Links:</div>
                        {note.links.map((link, idx) => (
                          <a
                            key={idx}
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-accent hover:underline truncate max-w-full block"
                          >
                            <ExternalLink className="w-3 h-3 shrink-0" />
                            <span className="truncate">{link}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-text-muted">
                    <span>Uploaded by {note.uploadedBy}</span>
                    <span className="tabular-nums">{note.uploadedAt}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- TAB 3: ASSIGNMENTS --- */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-text-muted">
              {classAssignments.length} assignment(s) configured for this cohort
            </div>

            {isTeacherOrAdmin && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowCreateAssignmentModal(true)}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Create assignment
              </Button>
            )}
          </div>

          {classAssignments.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-border rounded-card bg-surface space-y-2">
              <BookOpen className="w-8 h-8 text-text-muted mx-auto" />
              <h3 className="text-sm font-semibold text-text">No assignments yet</h3>
              <p className="text-xs text-text-muted max-w-sm mx-auto">
                Create structured assignments with rubrics, checking levels, and automatic evaluation.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {classAssignments.map((asg) => {
                const asgSubs = submissions.filter((s) => s.assignmentId === asg.id)
                const submittedCount = asgSubs.filter((s) => s.status !== 'assigned').length
                const needsReviewCount = asgSubs.filter(
                  (s) => s.status === 'graded_draft' || s.status === 'resubmit_requested'
                ).length

                return (
                  <div
                    key={asg.id}
                    onClick={() => navigate(`/classroom/${currentClass.id}/assignments/${asg.id}`)}
                    className="p-4 rounded-card border border-border bg-surface hover:border-border-strong transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-text group-hover:underline">
                          {asg.title}
                        </h3>
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded text-[10px] font-medium uppercase font-mono',
                            asg.checkingLevel === 'hard'
                              ? 'bg-danger/10 text-danger border border-danger/20'
                              : asg.checkingLevel === 'medium'
                              ? 'bg-warning/10 text-warning border border-warning/20'
                              : 'bg-success/10 text-success border border-success/20'
                          )}
                        >
                          Level: {asg.checkingLevel}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-surface-sunken border border-border text-text-muted">
                          {asg.rubric.length} rubric criteria
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-text-muted">
                        <span>Max marks: <strong className="text-text tabular-nums">{asg.maxMarks}</strong></span>
                        <span>Due: <span className="tabular-nums">{new Date(asg.dueAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span></span>
                        <span>Mode: <strong className="text-text capitalize">{asg.releaseMode.replace('_', ' ')}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {isTeacherOrAdmin && (
                        <div className="text-right text-xs">
                          <div className="font-semibold text-text tabular-nums">
                            {submittedCount} / {classStudents.length} turned in
                          </div>
                          {needsReviewCount > 0 ? (
                            <div className="text-warning text-[11px] font-medium flex items-center justify-end gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              <span>{needsReviewCount} to review</span>
                            </div>
                          ) : (
                            <div className="text-success text-[11px]">All reviewed</div>
                          )}
                        </div>
                      )}

                      <Button variant="secondary" size="xs">
                        Open details
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* --- TAB 4: PEOPLE --- */}
      {activeTab === 'people' && (
        <div className="space-y-6">
          {/* Teachers Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-text uppercase tracking-wider">
              Faculty & Instructors ({classTeachers.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {classTeachers.map((t) => (
                <div key={t.id} className="p-3.5 rounded-card border border-border bg-surface flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surface-sunken border border-border text-sm font-medium flex items-center justify-center text-text">
                    {t.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-text">{t.name}</h4>
                    <p className="text-[11px] text-text-muted">{t.email} · {t.phone}</p>
                    <p className="text-[10px] text-text-muted mt-0.5">Specialization: {t.specialization.join(', ')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Students Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-text uppercase tracking-wider">
              Classmates & Enrolled Candidates ({classStudents.length})
            </h3>
            <div className="rounded-card border border-border bg-surface overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-sunken border-b border-border text-[11px] font-medium text-text-muted">
                  <tr>
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3">Email</th>
                    <th className="py-2.5 px-3">Enrolled At</th>
                    <th className="py-2.5 px-3 text-right">Attendance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {classStudents.map((st) => (
                    <tr key={st.id} className="hover:bg-surface-sunken/40 h-10 transition-colors">
                      <td className="px-3 font-medium text-text">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-surface-sunken border border-border text-[10px] font-medium flex items-center justify-center text-text">
                            {st.name.slice(0, 2).toUpperCase()}
                          </div>
                          <span>{st.name}</span>
                        </div>
                      </td>
                      <td className="px-3 text-text-muted">{st.email}</td>
                      <td className="px-3 text-text-muted tabular-nums">{st.enrolledAt}</td>
                      <td className="px-3 text-right tabular-nums font-medium text-text">
                        {st.attendanceRate}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 5: GRADES MATRIX (Teacher/Owner only) --- */}
      {activeTab === 'grades' && isTeacherOrAdmin && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-text">Cohorts Grade Ledger</h3>
              <p className="text-xs text-text-muted">
                Student submissions, evaluation scores, and class averages
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportGrades}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Export grades CSV
            </Button>
          </div>

          <div className="rounded-card border border-border bg-surface overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-sunken border-b border-border text-[11px] font-medium text-text-muted sticky top-0">
                <tr>
                  <th className="py-2.5 px-3 min-w-[180px]">Student</th>
                  {classAssignments.map((a) => (
                    <th key={a.id} className="py-2.5 px-3 text-right min-w-[140px]">
                      <div className="truncate max-w-[160px]" title={a.title}>{a.title}</div>
                      <div className="text-[10px] font-normal text-text-muted">Max: {a.maxMarks}</div>
                    </th>
                  ))}
                  <th className="py-2.5 px-3 text-right min-w-[100px]">Class Avg</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {classStudents.map((st) => {
                  let totalAwarded = 0
                  let countGraded = 0

                  return (
                    <tr key={st.id} className="hover:bg-surface-sunken/40 h-10 transition-colors">
                      <td className="px-3 font-medium text-text truncate">
                        {st.name}
                      </td>
                      {classAssignments.map((a) => {
                        const sub = submissions.find(
                          (s) => s.assignmentId === a.id && s.studentId === st.id
                        )

                        if (!sub || sub.status === 'assigned') {
                          return (
                            <td key={a.id} className="px-3 text-right text-text-muted text-[11px]">
                              Missing
                            </td>
                          )
                        }

                        if (sub.status === 'returned') {
                          const marks = sub.finalMarks ?? sub.aiResult?.awarded ?? 0
                          totalAwarded += marks
                          countGraded++
                          return (
                            <td key={a.id} className="px-3 text-right tabular-nums font-semibold text-text">
                              {marks}
                            </td>
                          )
                        }

                        return (
                          <td key={a.id} className="px-3 text-right text-warning text-[11px] font-medium">
                            {sub.status === 'late' ? 'Late' : 'Review needed'}
                          </td>
                        )
                      })}
                      <td className="px-3 text-right tabular-nums font-semibold text-accent">
                        {countGraded > 0 ? (totalAwarded / countGraded).toFixed(1) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upload Notes Modal */}
      {showUploadNoteModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowUploadNoteModal(false)}
        >
          <div
            className="w-full max-w-lg bg-surface border border-border rounded-dialog shadow-dialog p-5 text-text space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-sm font-semibold text-text">Upload study notes</h3>
                <p className="text-xs text-text-muted mt-0.5">
                  Publish lecture slides, lab manuals, or reference guides
                </p>
              </div>
              <button
                onClick={() => setShowUploadNoteModal(false)}
                className="text-text-muted hover:text-text p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNote} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-text-muted font-medium mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="e.g. Exception Handling & Custom Exceptions"
                  className="w-full px-3 py-2 rounded-control bg-surface-sunken border border-border text-text focus:outline-none focus:border-border-strong"
                />
              </div>

              <div>
                <label className="block text-text-muted font-medium mb-1">Topic (optional)</label>
                <input
                  type="text"
                  value={noteTopic}
                  onChange={(e) => setNoteTopic(e.target.value)}
                  placeholder="e.g. Exception Handling"
                  className="w-full px-3 py-2 rounded-control bg-surface-sunken border border-border text-text focus:outline-none focus:border-border-strong"
                />
              </div>

              <div>
                <label className="block text-text-muted font-medium mb-1">Description / Overview</label>
                <textarea
                  rows={2}
                  value={noteDesc}
                  onChange={(e) => setNoteDesc(e.target.value)}
                  placeholder="Summary of concepts covered in this material…"
                  className="w-full p-2.5 rounded-control bg-surface-sunken border border-border text-text focus:outline-none focus:border-border-strong resize-none"
                />
              </div>

              {/* File input (max 25 MB) */}
              <div>
                <label className="block text-text-muted font-medium mb-1">
                  Upload Files (PDF, DOCX, PPTX, Images · max 25 MB each)
                </label>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.docx,.pptx,image/*"
                  onChange={handleFileUpload}
                  className="w-full p-2 text-xs text-text-muted file:mr-3 file:py-1 file:px-2.5 file:rounded-control file:border-0 file:text-xs file:font-medium file:bg-surface file:text-text hover:file:bg-surface-sunken border border-border rounded-control bg-surface-sunken cursor-pointer"
                />
                {noteFiles.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {noteFiles.map((f) => (
                      <div key={f.id} className="flex items-center justify-between text-[11px] p-1.5 rounded bg-surface">
                        <span className="truncate">{f.name}</span>
                        <button
                          type="button"
                          onClick={() => setNoteFiles((prev) => prev.filter((item) => item.id !== f.id))}
                          className="text-danger hover:underline ml-2"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Links */}
              <div>
                <label className="block text-text-muted font-medium mb-1">Reference Links</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={newLinkInput}
                    onChange={(e) => setNewLinkInput(e.target.value)}
                    placeholder="https://docs.oracle.com/..."
                    className="flex-1 px-3 py-1.5 rounded-control bg-surface-sunken border border-border text-xs text-text focus:outline-none focus:border-border-strong"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="xs"
                    onClick={() => {
                      if (newLinkInput.trim()) {
                        setNoteLinks((prev) => [...prev, newLinkInput.trim()])
                        setNewLinkInput('')
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>
              </div>

              {/* Post to several classes (multi-select) */}
              {otherSameSubjectClasses.length > 0 && (
                <div className="p-3 rounded-control bg-surface-sunken border border-border space-y-2">
                  <div className="font-medium text-text">Post to several classes</div>
                  <p className="text-[11px] text-text-muted">
                    Publish this study material to other divisions taking {currentClass.subject}:
                  </p>
                  <div className="space-y-1.5">
                    {otherSameSubjectClasses.map((oc) => (
                      <label key={oc.id} className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={multiClassIds.includes(oc.id)}
                          onChange={() => {
                            setMultiClassIds((prev) =>
                              prev.includes(oc.id) ? prev.filter((id) => id !== oc.id) : [...prev, oc.id]
                            )
                          }}
                          className="rounded border-border-strong text-accent focus:ring-accent w-3.5 h-3.5"
                        />
                        <span className="text-text">{oc.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowUploadNoteModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                >
                  Upload & publish
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Assignment Modal with Rubric & Checking Level */}
      {showCreateAssignmentModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowCreateAssignmentModal(false)}
        >
          <div
            className="w-full max-w-2xl bg-surface border border-border rounded-dialog shadow-dialog p-5 text-text space-y-4 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-sm font-semibold text-text">Create assignment & rubric parameters</h3>
                <p className="text-xs text-text-muted mt-0.5">
                  Set instructions, automated checking rigor, and grading deductions
                </p>
              </div>
              <button
                onClick={() => setShowCreateAssignmentModal(false)}
                className="text-text-muted hover:text-text p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-text-muted font-medium mb-1">Assignment Title</label>
                <input
                  type="text"
                  required
                  value={asgTitle}
                  onChange={(e) => setAsgTitle(e.target.value)}
                  placeholder="e.g. File reader with exception handling"
                  className="w-full px-3 py-2 rounded-control bg-surface-sunken border border-border text-text focus:outline-none focus:border-border-strong"
                />
              </div>

              <div>
                <label className="block text-text-muted font-medium mb-1">Instructions (Markdown / Code)</label>
                <textarea
                  rows={3}
                  value={asgInstructions}
                  onChange={(e) => setAsgInstructions(e.target.value)}
                  placeholder="Specify problem statement, input requirements, edge cases…"
                  className="w-full p-2.5 rounded-control bg-surface-sunken border border-border text-text font-mono text-xs focus:outline-none focus:border-border-strong resize-none"
                />
              </div>

              {/* Attach Reference Material / Problem Files */}
              <div className="space-y-2 p-3 rounded-control bg-surface-sunken border border-border">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="block text-text font-medium">Attach Problem Statement / Starter Files</label>
                    <p className="text-[11px] text-text-muted mt-0.5">
                      Upload PDF, DOCX, ZIP, or Java/Python starter files (max 25 MB each)
                    </p>
                  </div>
                  <input
                    type="file"
                    ref={asgFileInputRef}
                    onChange={handleAsgFileUpload}
                    multiple
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() => asgFileInputRef.current?.click()}
                    leftIcon={<Upload className="w-3.5 h-3.5 text-accent" />}
                    className="shrink-0"
                  >
                    Upload file
                  </Button>
                </div>

                {asgAttachments.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-border">
                    {asgAttachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center justify-between p-2 rounded bg-surface border border-border text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="w-3.5 h-3.5 text-accent shrink-0" />
                          <span className="font-medium text-text truncate">{att.name}</span>
                          <span className="text-[10px] text-text-muted font-mono shrink-0">
                            {(att.sizeBytes / 1024).toFixed(1)} KB
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveAsgAttachment(att.id)}
                          className="text-text-muted hover:text-danger p-1 rounded"
                          title="Remove file"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-text-muted font-medium mb-1">Max Marks</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={asgMaxMarks}
                    onChange={(e) => setAsgMaxMarks(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-control bg-surface-sunken border border-border text-text focus:outline-none focus:border-border-strong tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-text-muted font-medium mb-1">Due Date (IST)</label>
                  <input
                    type="datetime-local"
                    value={asgDueAt}
                    onChange={(e) => setAsgDueAt(e.target.value)}
                    className="w-full px-3 py-2 rounded-control bg-surface-sunken border border-border text-text focus:outline-none focus:border-border-strong"
                  />
                </div>

                <div>
                  <label className="block text-text-muted font-medium mb-1">Late Penalty / Day (Marks)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    disabled={!asgAllowLate}
                    value={asgLatePenalty}
                    onChange={(e) => setAsgLatePenalty(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-control bg-surface-sunken border border-border text-text focus:outline-none focus:border-border-strong tabular-nums"
                  />
                </div>
              </div>

              {/* Segmented Control for Checking Level */}
              <div className="space-y-1.5 p-3 rounded-control bg-surface-sunken border border-border">
                <label className="block text-text font-medium">Checking Rigor (Level)</label>
                <div className="grid grid-cols-3 gap-1 p-1 rounded-control bg-surface border border-border text-xs">
                  {(['easy', 'medium', 'hard'] as CheckingLevel[]).map((lvl) => (
                    <button
                      type="button"
                      key={lvl}
                      onClick={() => setAsgLevel(lvl)}
                      className={cn(
                        'py-1.5 text-center font-medium rounded capitalize transition-colors',
                        asgLevel === lvl
                          ? 'bg-accent text-accent-fg shadow-xs'
                          : 'text-text-muted hover:text-text'
                      )}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>

                <div className="text-[11px] text-text-muted pt-1 leading-relaxed">
                  {asgLevel === 'easy' && (
                    <p>
                      <strong>Easy:</strong> Checks whether each criterion's idea is present in any reasonable form; gives partial credit generously; ignores small mistakes in wording and formatting.
                    </p>
                  )}
                  {asgLevel === 'medium' && (
                    <p>
                      <strong>Medium:</strong> Each criterion must be clearly present and mostly correct; partial credit for incomplete work; minor errors cost a small part of the criterion's marks.
                    </p>
                  )}
                  {asgLevel === 'hard' && (
                    <p>
                      <strong>Hard:</strong> Each criterion must be present, complete and correct; partial credit only when the teacher allowed it on that criterion; errors in logic or correctness cost the full criterion marks.
                    </p>
                  )}
                </div>
              </div>

              {/* Rubric Builder with Quick Templates */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-text">Marking Parameters (Rubric Criteria)</div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-text-muted">Template:</span>
                    <button
                      type="button"
                      onClick={() => applyRubricTemplate('programming')}
                      className="text-xs text-accent hover:underline font-medium"
                    >
                      Programming
                    </button>
                    <span className="text-border">·</span>
                    <button
                      type="button"
                      onClick={() => applyRubricTemplate('theory')}
                      className="text-xs text-accent hover:underline font-medium"
                    >
                      Theory
                    </button>
                    <span className="text-border">·</span>
                    <button
                      type="button"
                      onClick={() => applyRubricTemplate('lab')}
                      className="text-xs text-accent hover:underline font-medium"
                    >
                      Lab report
                    </button>
                  </div>
                </div>

                {/* Rubric criteria list */}
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {asgRubric.map((crit, idx) => (
                    <div key={crit.id} className="p-3 rounded-control border border-border bg-surface-sunken space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          value={crit.title}
                          onChange={(e) => {
                            const val = e.target.value
                            setAsgRubric((prev) =>
                              prev.map((c, i) => (i === idx ? { ...c, title: val } : c))
                            )
                          }}
                          placeholder="Criterion title"
                          className="flex-1 px-2.5 py-1 rounded bg-surface border border-border text-xs text-text font-medium"
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-text-muted">Cut</span>
                          <input
                            type="number"
                            min="1"
                            max={asgMaxMarks}
                            value={crit.deductIfMissing}
                            onChange={(e) => {
                              const val = Number(e.target.value)
                              setAsgRubric((prev) =>
                                prev.map((c, i) => (i === idx ? { ...c, deductIfMissing: val } : c))
                              )
                            }}
                            className="w-14 px-2 py-1 rounded bg-surface border border-border text-xs text-text tabular-nums text-right"
                          />
                          <span className="text-[11px] text-text-muted">marks</span>
                          <button
                            type="button"
                            onClick={() => setAsgRubric((prev) => prev.filter((_, i) => i !== idx))}
                            className="text-text-muted hover:text-danger p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 text-[11px] text-text-muted">
                        <select
                          value={crit.type}
                          onChange={(e) => {
                            const val = e.target.value as any
                            setAsgRubric((prev) =>
                              prev.map((c, i) => (i === idx ? { ...c, type: val } : c))
                            )
                          }}
                          className="px-2 py-0.5 rounded bg-surface border border-border text-[11px]"
                        >
                          <option value="must_include">Must Include</option>
                          <option value="concept">Concept</option>
                          <option value="correctness">Correctness</option>
                          <option value="format">Format / Style</option>
                          <option value="keyword">Keyword</option>
                        </select>

                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={crit.partialAllowed}
                            onChange={(e) => {
                              const checked = e.target.checked
                              setAsgRubric((prev) =>
                                prev.map((c, i) => (i === idx ? { ...c, partialAllowed: checked } : c))
                              )
                            }}
                            className="rounded border-border text-accent w-3 h-3"
                          />
                          <span>Allow partial marks</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Running total check & warning */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <Button
                    type="button"
                    variant="secondary"
                    size="xs"
                    onClick={() => {
                      setAsgRubric((prev) => [
                        ...prev,
                        {
                          id: `crit-${Date.now()}`,
                          title: 'New criterion',
                          description: '',
                          type: 'concept',
                          deductIfMissing: 2,
                          partialAllowed: true,
                        },
                      ])
                    }}
                    leftIcon={<Plus className="w-3 h-3" />}
                  >
                    Add criterion
                  </Button>

                  <div className="text-right">
                    <span className="text-text-muted">Total potential deductions: </span>
                    <strong className={cn('tabular-nums', isDeductionOverflow ? 'text-danger' : 'text-text')}>
                      {sumDeductions} / {asgMaxMarks} marks
                    </strong>
                    {isDeductionOverflow && (
                      <p className="text-[10px] text-danger mt-0.5">
                        Warning: Sum of deductions exceeds total max marks!
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Reference Solution (Teacher-only) */}
              <div>
                <label className="block text-text-muted font-medium mb-1">
                  Reference Solution (Teacher-only · Never shown to students)
                </label>
                <textarea
                  rows={2}
                  value={asgRefSolution}
                  onChange={(e) => setAsgRefSolution(e.target.value)}
                  placeholder="Optional model solution for comparative LLM grading alignment…"
                  className="w-full p-2.5 rounded-control bg-surface-sunken border border-border text-text font-mono text-xs focus:outline-none focus:border-border-strong resize-none"
                />
              </div>

              {/* Release Mode */}
              <div className="p-3 rounded-control bg-surface-sunken border border-border space-y-2">
                <div className="font-medium text-text">Release Mode</div>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="releaseMode"
                      value="teacher_review"
                      checked={asgReleaseMode === 'teacher_review'}
                      onChange={() => setAsgReleaseMode('teacher_review')}
                      className="text-accent"
                    />
                    <span>I review before students see marks (recommended)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="releaseMode"
                      value="auto_release"
                      checked={asgReleaseMode === 'auto_release'}
                      onChange={() => setAsgReleaseMode('auto_release')}
                      disabled={asgLevel === 'hard'}
                      className="text-accent"
                    />
                    <span className={asgLevel === 'hard' ? 'text-text-muted' : ''}>
                      Release AI marks automatically (Allowed for Easy and Medium; low-confidence still goes to review queue)
                    </span>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowCreateAssignmentModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => handleCreateAssignment('draft')}
                >
                  Save as draft
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => handleCreateAssignment('published')}
                >
                  Publish assignment
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attachment Preview Modal */}
      {previewAttachment && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPreviewAttachment(null)}
        >
          <div
            className="w-full max-w-3xl bg-surface border border-border rounded-dialog shadow-dialog overflow-hidden flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3.5 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold text-text">{previewAttachment.name}</h3>
                <span className="text-[10px] text-text-muted font-mono">{previewAttachment.mimeType}</span>
              </div>
              <button
                onClick={() => setPreviewAttachment(null)}
                className="text-text-muted hover:text-text p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-auto bg-surface-sunken flex items-center justify-center min-h-[300px]">
              {previewAttachment.mimeType.startsWith('image/') ? (
                <img
                  src={previewAttachment.url}
                  alt={previewAttachment.name}
                  className="max-h-full max-w-full object-contain rounded"
                />
              ) : (
                <div className="text-center space-y-3 p-6">
                  <FileText className="w-12 h-12 text-accent mx-auto" />
                  <div className="text-xs font-medium text-text">{previewAttachment.name}</div>
                  <p className="text-[11px] text-text-muted max-w-sm">
                    In mock environment, PDF documents and binaries can be viewed in browser tab or downloaded.
                  </p>
                  <a
                    href={previewAttachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-control bg-accent text-accent-fg text-xs font-medium"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Open full document
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
