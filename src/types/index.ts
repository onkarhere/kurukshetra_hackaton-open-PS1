export type UserRole = 'owner' | 'admin' | 'trainer' | 'counselor' | 'accounts' | 'student'

export type Branch = 'Kothrud' | 'Baner'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
  branch: Branch | 'All'
}

export type AttendanceStatus = 'present' | 'partial' | 'late' | 'absent' | 'excused' | 'online'

export type FeeStatus = 'paid' | 'due_soon' | 'overdue' | 'partially_paid' | 'waived'

export type RiskLevel = 'low' | 'watch' | 'high' | 'critical'

export interface Student {
  id: string
  name: string
  email: string
  phone: string
  branch: Branch
  batchIds: string[]
  batchNames: string[]
  attendanceRate: number
  feeStatus: FeeStatus
  riskLevel: RiskLevel
  riskScore: number
  riskReasons: string[]
  lastSeen: string
  enrolledAt: string
  avatar?: string
  notes?: StudentNote[]
  instalments?: FeeInstalment[]
}

export interface StudentNote {
  id: string
  author: string
  authorRole: string
  content: string
  createdAt: string
}

export interface Trainer {
  id: string
  name: string
  email: string
  phone: string
  qualifications: string[]
  specialization: string[]
  branches: Branch[]
  weeklyHours: number
  maxWeeklyHours: number
  availability: Record<string, boolean[]> // day -> 48 half-hour slots
  rating: number
  activeBatches: number
  payRate?: number // owner only
  leaveRequests: LeaveRequest[]
}

export interface LeaveRequest {
  id: string
  date: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
}

export interface Course {
  id: string
  code: string
  title: string
  category: string
  mode: 'offline' | 'online' | 'hybrid'
  durationWeeks: number
  totalHours: number
  activeBatchesCount: number
  fees: number
  syllabus: {
    module: string
    hours: number
    topics: string[]
  }[]
  completionRules: {
    minAttendancePercent: number
    minAssignmentsPercent: number
    minAssessmentScore: number
  }
}

export interface Batch {
  id: string
  code: string
  name: string
  courseId: string
  courseName: string
  branch: Branch
  trainerId: string
  trainerName: string
  room: string
  mode: 'offline' | 'online' | 'hybrid'
  schedulePattern: string // e.g. "Mon, Wed, Fri · 19:00 - 21:00"
  daysOfWeek: number[] // 0 = Sun, 1 = Mon ...
  startTime: string // "19:00"
  endTime: string // "21:00"
  capacity: number
  enrolledCount: number
  onlineSeatLimit: number
  startDate: string
  endDate: string
  progress: number // 0-100%
  healthScore: number // 0-100
  currentModule: string
}

export interface TimetableSession {
  id: string
  batchId: string
  batchName: string
  courseName: string
  trainerId: string
  trainerName: string
  room: string
  branch: Branch
  date: string // YYYY-MM-DD
  dayOfWeek: number // 1 = Mon .. 7 = Sun
  startTime: string // "19:00"
  endTime: string // "21:00"
  isOnline: boolean
  isLocked: boolean
  hasConflict?: boolean
  conflictReason?: string
  status: 'scheduled' | 'live' | 'completed' | 'cancelled'
}

export interface FeeInstalment {
  id: string
  studentId: string
  studentName: string
  batchName: string
  sequence: string // "3 of 6"
  dueDate: string
  amount: number
  paidAmount: number
  status: FeeStatus
  daysOverdue: number
  isSecondMissed?: boolean
  paidDate?: string
  receiptNo?: string
  paymentMethod?: string
}

export interface PaymentRecord {
  id: string
  receiptNo: string
  studentName: string
  studentId: string
  amount: number
  date: string
  method: 'UPI' | 'Bank Transfer' | 'Card' | 'Cash'
  utrNo: string
  status: 'verified' | 'needs_review' | 'unmatched'
  instalmentId?: string
  confidence?: number
  reconcileReasons?: string[]
}

export interface ApprovalAction {
  id: string
  type: 'whatsapp_bulk' | 'timetable_replan' | 'cert_issue' | 'fee_waiver' | 'schedule_change'
  title: string
  summary: string
  requester: string
  requesterRole: string
  createdAt: string
  riskLevel: 'low' | 'medium' | 'high'
  status: 'pending' | 'approved' | 'rejected'
  recipientCount?: number
  recipients?: {
    id: string
    name: string
    phone: string
    amountDue?: number
    messagePreview: string
    customizedMessage?: string
    selected: boolean
  }[]
  diff?: {
    before: string
    after: string
    reason: string
  }[]
  channel?: 'whatsapp' | 'sms' | 'email'
  sendTime?: string
  estimatedCost?: string
  approvedAt?: string
  approvedBy?: string
}

export interface CopilotMessage {
  id: string
  sender: 'user' | 'assistant'
  timestamp: string
  content: string
  query?: string
  stage?: 'understanding' | 'finding_data' | 'checking_safety' | 'running_query' | 'writing_answer' | 'completed'
  sql?: string
  dataSources?: { name: string; type: 'view' | 'table'; columns: string[] }[]
  filters?: { label: string; value: string }[]
  safetyChecks?: { check: string; passed: boolean }[]
  executionTimeMs?: number
  rowsCount?: number
  viewsCount?: number
  confidence?: 'High' | 'Medium' | 'Low'
  tableData?: Record<string, any>[]
  columns?: { key: string; label: string; align?: 'left' | 'right' | 'center'; isReason?: boolean; isAmount?: boolean }[]
  chartData?: { label: string; value: number }[]
  chartType?: 'bar' | 'line' | 'pie'
  approvalProposal?: ApprovalAction
  refusal?: {
    isRefused: boolean
    reason: string
    permittedPart?: string
  }
  suggestedFollowUps?: string[]
  feedback?: 'up' | 'down'
}

export interface AuditLogEntry {
  id: string
  timestamp: string
  actorType: 'User' | 'AI' | 'System'
  actorName: string
  actorRole?: string
  action: string
  entity: string
  entityId: string
  outcome: 'success' | 'failure' | 'pending'
  ipAddress: string
  changes?: {
    before: Record<string, any>
    after: Record<string, any>
  }
  aiReplay?: {
    prompt: string
    sql: string
    rowsCount: number
    proposal: string
    approver?: string
    result: string
  }
}

export interface Certificate {
  id: string
  certificateNo: string
  studentId: string
  studentName: string
  courseName: string
  batchName: string
  issueDate: string
  grade: string
  status: 'valid' | 'revoked'
  verificationUrl: string
  attendanceRate: number
  score: number
  skills: string[]
}

export interface Recording {
  id: string
  title: string
  batchName: string
  courseName: string
  trainerName: string
  date: string
  duration: string
  thumbnailUrl: string
  videoUrl: string
  aiSummary: string
  chapters: { time: string; title: string }[]
  attendanceCount: number
}

export interface OutboxMessage {
  id: string
  channel: 'whatsapp' | 'sms' | 'email'
  to: string
  studentId?: string
  studentName?: string
  body: string
  status: 'queued' | 'sent' | 'delivered' | 'failed'
  approvalId?: string
  createdAt: string
}

export interface InstituteSettings {
  instituteName: string
  minAttendanceThreshold: number
  criticalRiskThreshold: number
  lateToleranceMinutes: number
  quietHoursStart: string
  quietHoursEnd: string
  disableExternalLLMs: boolean
  autoSmsWaivers: boolean
}

export interface AttendanceRecord {
  id: string
  sessionId: string
  studentId: string
  studentName?: string
  status: AttendanceStatus
  method: 'qr' | 'manual' | 'online_import'
  checkInTime?: string
}

export type RiskAcknowledgement = Record<string, { by: string; at: string }>

// --- CLASSROOM MODULE TYPES ---
export type Year = 'FE' | 'SE' | 'TE' | 'BE' | string

export interface Attachment {
  id: string
  name: string
  mimeType: string
  sizeBytes: number
  url: string
}

export interface ClassRoom {
  id: string
  name: string
  subject: string
  year: Year
  division: string
  batchId: string
  teacherIds: string[]
  code: string
  archived: boolean
}

export interface Note {
  id: string
  classId: string
  title: string
  description?: string
  topic?: string
  files: Attachment[]
  links: string[]
  uploadedBy: string
  uploadedAt: string
  pinned: boolean
}

export type CheckingLevel = 'easy' | 'medium' | 'hard'

export interface RubricCriterion {
  id: string
  title: string
  description?: string
  type: 'must_include' | 'concept' | 'keyword' | 'format' | 'correctness'
  keywords?: string[]
  deductIfMissing: number
  partialAllowed: boolean
}

export interface Assignment {
  id: string
  classId: string
  title: string
  instructions: string
  attachments: Attachment[]
  maxMarks: number
  dueAt: string
  allowLate: boolean
  latePenaltyPerDay: number
  checkingLevel: CheckingLevel
  rubric: RubricCriterion[]
  referenceSolution?: string
  releaseMode: 'teacher_review' | 'auto_release'
  status: 'draft' | 'published' | 'closed'
  createdBy: string
  createdAt: string
}

export type SubmissionStatus =
  | 'assigned'
  | 'submitted'
  | 'late'
  | 'grading'
  | 'graded_draft'
  | 'returned'
  | 'resubmit_requested'

export interface GradingDeduction {
  criterionId: string
  title: string
  marksCut: number
  reason: string
  evidence?: string
}

export interface GradingResult {
  level: CheckingLevel
  maxMarks: number
  awarded: number
  deductions: GradingDeduction[]
  latePenalty: number
  strengths: string[]
  improvements: string[]
  confidence: 'high' | 'medium' | 'low'
  needsHumanReview: boolean
  model: string
  gradedAt: string
}

export interface Submission {
  id: string
  assignmentId: string
  studentId: string
  studentName?: string
  files: Attachment[]
  text?: string
  submittedAt?: string
  status: SubmissionStatus
  attempt: number
  aiResult?: GradingResult
  finalMarks?: number
  teacherComment?: string
  returnedAt?: string
  returnedBy?: string
  flagReason?: string
  recheckReason?: string
}

export interface ClassComment {
  id: string
  authorId: string
  authorName: string
  authorRole: UserRole
  content: string
  createdAt: string
  isPrivate?: boolean
}

export interface StreamPost {
  id: string
  classId: string
  type: 'announcement' | 'note' | 'assignment'
  title: string
  content?: string
  authorName: string
  authorRole: UserRole
  createdAt: string
  comments?: ClassComment[]
  refId?: string
}

