import { useSyncExternalStore } from 'react'
import {
  mockCurrentUser,
  mockCourses,
  mockTrainers,
  mockBatches,
  mockStudents,
  mockFeeInstalments,
  mockPayments,
  mockApprovals,
  mockTimetableSessions,
  mockSeedCopilotMessage,
  mockTrainerSeedRefusalMessage,
  mockAuditLogs,
  mockCertificates,
  mockRecordings,
  mockOutboxMessages,
  mockAttendanceRecords,
  mockSettings,
  mockRiskAcknowledgements,
  mockClassRooms,
  mockNotes,
  mockAssignments,
  mockSubmissions,
  mockStreamPosts,
} from './mockData'
import {
  User,
  UserRole,
  Branch,
  Student,
  Trainer,
  Batch,
  Course,
  FeeInstalment,
  PaymentRecord,
  ApprovalAction,
  TimetableSession,
  CopilotMessage,
  AuditLogEntry,
  Certificate,
  Recording,
  OutboxMessage,
  InstituteSettings,
  AttendanceRecord,
  ClassRoom,
  Note,
  Assignment,
  Submission,
  StreamPost,
  ClassComment,
  Attachment,
  GradingResult,
  GradingDeduction,
} from '@/types'
import { formatINR } from '@/lib/utils'
import { extractSubmissionText } from '@/features/classroom/grading/extractText'
import { checkSubmissionSimilarity } from '@/features/classroom/grading/similarity'
import { gradingService } from '@/features/classroom/grading/gradingService'

const STORAGE_KEY = 'batchwise_store_v1'

export class MockStore {
  // P0-2: Default isAuthenticated to false when nothing is saved
  isAuthenticated: boolean = false

  currentUser: User = { ...mockCurrentUser }
  selectedBranch: Branch | 'All' = 'All'
  courses: Course[] = [...mockCourses]
  trainers: Trainer[] = [...mockTrainers]
  batches: Batch[] = [...mockBatches]
  students: Student[] = [...mockStudents]
  feeInstalments: FeeInstalment[] = [...mockFeeInstalments]
  payments: PaymentRecord[] = [...mockPayments]
  approvals: ApprovalAction[] = [...mockApprovals]
  timetableSessions: TimetableSession[] = [...mockTimetableSessions]
  copilotMessages: CopilotMessage[] = [mockSeedCopilotMessage]
  auditLogs: AuditLogEntry[] = [...mockAuditLogs]
  certificates: Certificate[] = [...mockCertificates]
  recordings: Recording[] = [...mockRecordings]
  messages: OutboxMessage[] = [...mockOutboxMessages]
  riskAcknowledgements: Record<string, { by: string; at: string }> = { ...mockRiskAcknowledgements }
  settings: InstituteSettings = { ...mockSettings }
  attendanceRecords: AttendanceRecord[] = [...mockAttendanceRecords]
  sessionQrTokens: Record<string, { token: string; expiresAt: number }> = {}

  // Classroom slices
  classes: ClassRoom[] = [...mockClassRooms]
  notes: Note[] = [...mockNotes]
  assignments: Assignment[] = [...mockAssignments]
  submissions: Submission[] = [...mockSubmissions]
  streamPosts: StreamPost[] = [...mockStreamPosts]

  // Listeners for reactivity
  private listeners: Set<() => void> = new Set()

  constructor() {
    this.loadFromStorage()
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return

    try {
      // Check auth status
      const authStatus = localStorage.getItem('batchwise_auth_status')
      const authUser = localStorage.getItem('batchwise_auth_user')

      if (authStatus === 'true' && authUser) {
        this.isAuthenticated = true
        this.currentUser = JSON.parse(authUser)
      } else {
        this.isAuthenticated = false
      }

      // Rehydrate persisted store
      const savedData = localStorage.getItem(STORAGE_KEY)
      if (savedData) {
        const parsed = JSON.parse(savedData)
        if (parsed.courses) this.courses = parsed.courses
        if (parsed.trainers) this.trainers = parsed.trainers
        if (parsed.batches) this.batches = parsed.batches
        if (parsed.students) this.students = parsed.students
        if (parsed.feeInstalments) this.feeInstalments = parsed.feeInstalments
        if (parsed.payments) this.payments = parsed.payments
        if (parsed.approvals) this.approvals = parsed.approvals
        if (parsed.timetableSessions) this.timetableSessions = parsed.timetableSessions
        if (parsed.copilotMessages) this.copilotMessages = parsed.copilotMessages
        if (parsed.auditLogs) this.auditLogs = parsed.auditLogs
        if (parsed.certificates) this.certificates = parsed.certificates
        if (parsed.recordings) this.recordings = parsed.recordings
        if (parsed.messages) this.messages = parsed.messages
        if (parsed.riskAcknowledgements) this.riskAcknowledgements = parsed.riskAcknowledgements
        if (parsed.settings) this.settings = parsed.settings
        if (parsed.attendanceRecords) this.attendanceRecords = parsed.attendanceRecords
        if (parsed.selectedBranch) this.selectedBranch = parsed.selectedBranch
        if (parsed.classes) this.classes = parsed.classes
        if (parsed.notes) this.notes = parsed.notes
        if (parsed.assignments) this.assignments = parsed.assignments
        if (parsed.submissions) this.submissions = parsed.submissions
        if (parsed.streamPosts) this.streamPosts = parsed.streamPosts
      }
    } catch (e) {
      console.warn('Failed to rehydrate store from localStorage', e)
    }
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return

    try {
      const stateToSave = {
        selectedBranch: this.selectedBranch,
        courses: this.courses,
        trainers: this.trainers,
        batches: this.batches,
        students: this.students,
        feeInstalments: this.feeInstalments,
        payments: this.payments,
        approvals: this.approvals,
        timetableSessions: this.timetableSessions,
        copilotMessages: this.copilotMessages,
        auditLogs: this.auditLogs,
        certificates: this.certificates,
        recordings: this.recordings,
        messages: this.messages,
        riskAcknowledgements: this.riskAcknowledgements,
        settings: this.settings,
        attendanceRecords: this.attendanceRecords,
        classes: this.classes,
        notes: this.notes,
        assignments: this.assignments,
        submissions: this.submissions,
        streamPosts: this.streamPosts,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave))
    } catch (e) {
      console.warn('Failed to save store to localStorage', e)
    }
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  notify() {
    this.saveToStorage()
    this.listeners.forEach((fn) => fn())
  }

  resetDemo() {
    this.courses = [...mockCourses]
    this.trainers = [...mockTrainers]
    this.batches = [...mockBatches]
    this.students = [...mockStudents]
    this.feeInstalments = [...mockFeeInstalments]
    this.payments = [...mockPayments]
    this.approvals = [...mockApprovals]
    this.timetableSessions = [...mockTimetableSessions]
    this.auditLogs = [...mockAuditLogs]
    this.certificates = [...mockCertificates]
    this.recordings = [...mockRecordings]
    this.messages = [...mockOutboxMessages]
    this.riskAcknowledgements = { ...mockRiskAcknowledgements }
    this.settings = { ...mockSettings }
    this.attendanceRecords = [...mockAttendanceRecords]
    this.classes = [...mockClassRooms]
    this.notes = [...mockNotes]
    this.assignments = [...mockAssignments]
    this.submissions = [...mockSubmissions]
    this.streamPosts = [...mockStreamPosts]
    this.selectedBranch = 'All'

    // Reset copilot message based on role
    if (this.currentUser.role === 'trainer') {
      this.copilotMessages = [mockTrainerSeedRefusalMessage]
    } else {
      this.copilotMessages = [mockSeedCopilotMessage]
    }

    this.notify()
  }

  login(user: User) {
    this.currentUser = { ...user }
    this.isAuthenticated = true
    if (typeof window !== 'undefined') {
      localStorage.setItem('batchwise_auth_user', JSON.stringify(this.currentUser))
      localStorage.setItem('batchwise_auth_status', 'true')
    }
    this.notify()
  }

  logout() {
    this.isAuthenticated = false
    if (typeof window !== 'undefined') {
      localStorage.removeItem('batchwise_auth_user')
      localStorage.setItem('batchwise_auth_status', 'false')
    }
    this.notify()
  }

  setRole(role: UserRole) {
    this.currentUser.role = role
    if (role === 'trainer') {
      this.currentUser.name = 'Arjun Mehta'
      this.currentUser.email = 'arjun.mehta@codecraft.ac.in'
      this.copilotMessages = [mockTrainerSeedRefusalMessage]
    } else if (role === 'counselor') {
      this.currentUser.name = 'Snehal Kulkarni'
      this.currentUser.email = 'snehal@codecraft.ac.in'
      this.copilotMessages = [
        {
          id: `seed-counselor-${Date.now()}`,
          sender: 'assistant',
          timestamp: 'Just now',
          content: 'Hello Snehal. You can ask for attendance summaries, risk tiers, or student contact details.',
        },
      ]
    } else if (role === 'accounts') {
      this.currentUser.name = 'Sunita Accounts'
      this.currentUser.email = 'accounts@codecraft.ac.in'
      this.copilotMessages = [
        {
          id: `seed-accounts-${Date.now()}`,
          sender: 'assistant',
          timestamp: 'Just now',
          content: 'Hello Sunita. You can ask for fee collection summaries, overdue ageing, and UTR reconciliation status.',
        },
      ]
    } else if (role === 'student') {
      this.currentUser.name = 'Priya Nair'
      this.currentUser.email = 'priya.nair@gmail.com'
      this.copilotMessages = [
        {
          id: `seed-student-${Date.now()}`,
          sender: 'assistant',
          timestamp: 'Just now',
          content: 'Hi Priya! You can view your classes, check-in status, and syllabus catch-up recordings.',
        },
      ]
    } else {
      this.currentUser.name = 'Rajesh Sharma'
      this.currentUser.email = 'rajesh@codecraft.ac.in'
      this.copilotMessages = [mockSeedCopilotMessage]
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('batchwise_auth_user', JSON.stringify(this.currentUser))
    }
    this.notify()
  }

  setBranch(branch: Branch | 'All') {
    this.selectedBranch = branch
    this.notify()
  }

  // P0-5: Approvals execution
  approveProposal(id: string) {
    const item = this.approvals.find((a) => a.id === id)
    if (!item || item.status !== 'pending') return

    item.status = 'approved'
    item.approvedAt = new Date().toISOString()
    item.approvedBy = this.currentUser.name

    let resultSummary = ''

    // 1. send_message / whatsapp_bulk execution
    if (item.type === 'whatsapp_bulk' || (item.type as string) === 'send_message') {
      const selectedRecipients = item.recipients?.filter((r) => r.selected !== false) || []
      const createdMessages: OutboxMessage[] = []

      selectedRecipients.forEach((rec) => {
        const outboxMsg: OutboxMessage = {
          id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          channel: item.channel || 'whatsapp',
          to: rec.phone,
          studentId: rec.id,
          studentName: rec.name,
          body: rec.customizedMessage || rec.messagePreview,
          status: 'queued',
          approvalId: item.id,
          createdAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST',
        }
        createdMessages.push(outboxMsg)
        this.messages.unshift(outboxMsg)
      })

      resultSummary = `Queued ${createdMessages.length} message(s) for delivery.`

      // Simulate network delivery
      setTimeout(() => {
        createdMessages.forEach((m) => {
          m.status = 'sent'
        })
        this.notify()
      }, 1000)
    }

    // 2. timetable_replan / publish_timetable execution
    else if (item.type === 'timetable_replan' || (item.type as string) === 'publish_timetable') {
      if (item.diff && item.diff.length > 0) {
        // Clear conflicts on scheduled sessions
        this.timetableSessions = this.timetableSessions.map((s) => ({
          ...s,
          hasConflict: false,
          conflictReason: undefined,
        }))
      }
      resultSummary = `Published timetable re-plan with ${item.diff?.length || 0} change(s).`
    }

    // 3. cert_issue / generate_certificates execution
    else if (item.type === 'cert_issue' || (item.type as string) === 'generate_certificates') {
      const eligible = item.recipients?.filter((r) => r.selected !== false) || []
      eligible.forEach((r) => {
        const certNo = `CC-2026-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`
        const newCert: Certificate = {
          id: `cert-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          certificateNo: certNo,
          studentId: r.id,
          studentName: r.name,
          courseName: 'Java Full-Stack Developer',
          batchName: 'Java Full-Stack B3 (Kothrud)',
          issueDate: new Date().toISOString().split('T')[0],
          grade: 'A (Distinction)',
          status: 'valid',
          verificationUrl: `https://batchwise.codecraft.ac.in/verify/${certNo}`,
          attendanceRate: 88,
          score: 84,
          skills: ['Java OOP', 'Spring Boot', 'React & TypeScript', 'PostgreSQL'],
        }
        this.certificates.unshift(newCert)
      })
      resultSummary = `Issued ${eligible.length} accredited certificate(s).`
    } else {
      resultSummary = `Action ${item.title} completed successfully.`
    }

    // Write audit log entry
    this.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST',
      actorType: 'User',
      actorName: this.currentUser.name,
      actorRole: this.currentUser.role,
      action: `Approved: ${item.title}`,
      entity: item.type,
      entityId: item.id,
      outcome: 'success',
      ipAddress: '122.170.14.92',
      changes: {
        before: { status: 'pending' },
        after: { status: 'approved', result: resultSummary },
      },
    })

    // Update copilot message proposal if matching
    const msg = this.copilotMessages.find((m) => m.approvalProposal?.id === id)
    if (msg && msg.approvalProposal) {
      msg.approvalProposal.status = 'approved'
    }

    this.notify()
  }

  rejectProposal(id: string, reason?: string) {
    const item = this.approvals.find((a) => a.id === id)
    if (!item || item.status !== 'pending') return

    item.status = 'rejected'
    item.approvedBy = this.currentUser.name

    this.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST',
      actorType: 'User',
      actorName: this.currentUser.name,
      actorRole: this.currentUser.role,
      action: `Rejected: ${item.title}${reason ? ` (Reason: ${reason})` : ''}`,
      entity: item.type,
      entityId: item.id,
      outcome: 'success',
      ipAddress: '122.170.14.92',
      changes: {
        before: { status: 'pending' },
        after: { status: 'rejected', reason: reason || 'Rejected by user' },
      },
    })

    const msg = this.copilotMessages.find((m) => m.approvalProposal?.id === id)
    if (msg && msg.approvalProposal) {
      msg.approvalProposal.status = 'rejected'
    }

    this.notify()
  }

  updateRecipientMessage(approvalId: string, recipientId: string, newMsg: string) {
    const item = this.approvals.find((a) => a.id === approvalId)
    if (item && item.recipients) {
      const rec = item.recipients.find((r) => r.id === recipientId)
      if (rec) {
        rec.customizedMessage = newMsg
        this.notify()
      }
    }
  }

  toggleRecipient(approvalId: string, recipientId: string) {
    const item = this.approvals.find((a) => a.id === approvalId)
    if (item && item.recipients) {
      const rec = item.recipients.find((r) => r.id === recipientId)
      if (rec) {
        rec.selected = !rec.selected
        this.notify()
      }
    }
  }

  recordAttendance(records: AttendanceRecord[]) {
    records.forEach((rec) => {
      const idx = this.attendanceRecords.findIndex(
        (r) => r.sessionId === rec.sessionId && r.studentId === rec.studentId
      )
      if (idx >= 0) {
        this.attendanceRecords[idx] = rec
      } else {
        this.attendanceRecords.push(rec)
      }
    })
    this.notify()
  }

  addStudentNote(studentId: string, content: string) {
    const student = this.students.find((s) => s.id === studentId)
    if (student) {
      student.notes = student.notes || []
      student.notes.unshift({
        id: `note-${Date.now()}`,
        author: this.currentUser.name,
        authorRole: this.currentUser.role,
        content,
        createdAt: 'Just now',
      })
      this.notify()
    }
  }

  reconcilePayment(paymentId: string) {
    const payment = this.payments.find((p) => p.id === paymentId)
    if (payment) {
      payment.status = 'verified'
      payment.confidence = 100
      this.notify()
    }
  }

  updateTrainerAvailability(trainerId: string, availability: Record<string, boolean[]>) {
    const trainer = this.trainers.find((t) => t.id === trainerId)
    if (trainer) {
      trainer.availability = availability
      this.notify()
    }
  }

  approveTrainerLeave(trainerId: string, leaveId: string) {
    const trainer = this.trainers.find((t) => t.id === trainerId)
    if (trainer) {
      const leave = trainer.leaveRequests.find((l) => l.id === leaveId)
      if (leave) {
        leave.status = 'approved'
        this.notify()
      }
    }
  }

  addCopilotMessage(msg: CopilotMessage) {
    this.copilotMessages.push(msg)
    this.notify()
  }

  setCopilotFeedback(messageId: string, feedback: 'up' | 'down') {
    const msg = this.copilotMessages.find((m) => m.id === messageId)
    if (msg) {
      msg.feedback = feedback
      this.notify()
    }
  }

  revokeCertificate(certId: string) {
    const cert = this.certificates.find((c) => c.id === certId || c.certificateNo === certId)
    if (cert) {
      cert.status = 'revoked'
      this.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST',
        actorType: 'User',
        actorName: this.currentUser.name,
        actorRole: this.currentUser.role,
        action: `Revoked certificate: ${cert.certificateNo}`,
        entity: 'certificate',
        entityId: cert.id,
        outcome: 'success',
        ipAddress: '122.170.14.92',
      })
      this.notify()
    }
  }

  acknowledgeRisk(studentId: string, by: string) {
    if (!this.riskAcknowledgements) {
      this.riskAcknowledgements = {}
    }
    if (this.riskAcknowledgements[studentId]) {
      delete this.riskAcknowledgements[studentId]
    } else {
      this.riskAcknowledgements[studentId] = {
        by,
        at: new Date().toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        }),
      }
    }
    this.notify()
  }

  updateSettings(newSettings: Partial<InstituteSettings>) {
    this.settings = { ...this.settings, ...newSettings }
    this.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST',
      actorType: 'User',
      actorName: this.currentUser.name,
      actorRole: this.currentUser.role,
      action: 'Updated institute settings and risk/attendance thresholds',
      entity: 'settings',
      entityId: 'inst-settings',
      outcome: 'success',
      ipAddress: '122.170.14.92',
    })
    this.notify()
  }


  setSessionQrToken(sessionId: string, token: string) {
    if (!this.sessionQrTokens) this.sessionQrTokens = {}
    this.sessionQrTokens[sessionId] = { token, expiresAt: Date.now() + 45000 }
    this.notify()
  }

  verifySessionQrToken(sessionId: string, token: string): boolean {
    if (!this.sessionQrTokens || !this.sessionQrTokens[sessionId]) {
      return token.length >= 4
    }
    const entry = this.sessionQrTokens[sessionId]
    return entry.token === token && Date.now() <= entry.expiresAt
  }

  markRemainingAbsent(
    sessionId: string,
    unmarkedStudents: { id: string; name: string }[]
  ) {
    unmarkedStudents.forEach((st) => {
      const idx = this.attendanceRecords.findIndex(
        (r) => r.sessionId === sessionId && r.studentId === st.id
      )
      const rec: AttendanceRecord = {
        id: idx >= 0 ? this.attendanceRecords[idx].id : `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        sessionId,
        studentId: st.id,
        studentName: st.name,
        status: 'absent',
        method: 'manual',
      }
      if (idx >= 0) {
        this.attendanceRecords[idx] = rec
      } else {
        this.attendanceRecords.push(rec)
      }
    })
    this.notify()
  }

  finalizeSession(
    sessionId: string,
    attendees: {
      id: string
      name: string
      status: 'present' | 'absent' | 'online' | 'late'
      checkInTime?: string
      method?: string
    }[]
  ) {
    attendees.forEach((att) => {
      const idx = this.attendanceRecords.findIndex(
        (r) => r.sessionId === sessionId && r.studentId === att.id
      )
      const rec: AttendanceRecord = {
        id: idx >= 0 ? this.attendanceRecords[idx].id : `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        sessionId,
        studentId: att.id,
        studentName: att.name,
        status: att.status,
        method: att.method?.toLowerCase().includes('qr')
          ? 'qr'
          : att.method?.toLowerCase().includes('zoom')
          ? 'online_import'
          : 'manual',
        checkInTime: att.checkInTime || (att.status !== 'absent' ? '19:00 IST' : undefined),
      }
      if (idx >= 0) {
        this.attendanceRecords[idx] = rec
      } else {
        this.attendanceRecords.push(rec)
      }

      const student = this.students.find((s) => s.id === att.id)
      if (student) {
        if (att.status === 'present' || att.status === 'online') {
          student.attendanceRate = Math.min(100, Math.round(student.attendanceRate + 1))
        } else if (att.status === 'absent') {
          student.attendanceRate = Math.max(20, Math.round(student.attendanceRate - 2))
        }
        if (student.attendanceRate < (this.settings.criticalRiskThreshold || 50)) {
          student.riskLevel = 'critical'
        } else if (student.attendanceRate < (this.settings.minAttendanceThreshold || 75)) {
          student.riskLevel = 'high'
        } else if (student.attendanceRate < 80) {
          student.riskLevel = 'watch'
        } else {
          student.riskLevel = 'low'
        }
      }
    })

    const session = this.timetableSessions.find((s) => s.id === sessionId)
    if (session) {
      session.status = 'completed'
      const batch = this.batches.find((b) => b.id === session.batchId || b.name === session.batchName)
      if (batch) {
        const presentCount = attendees.filter((a) => a.status === 'present' || a.status === 'online').length
        batch.progress = Math.min(100, (batch.progress || 50) + 2)
        batch.healthScore = Math.round((presentCount / Math.max(1, attendees.length)) * 100)
      }
    }

    this.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST',
      actorType: 'User',
      actorName: this.currentUser.name,
      actorRole: this.currentUser.role,
      action: `Finalized session attendance: ${session?.batchName || sessionId}`,
      entity: 'session',
      entityId: sessionId,
      outcome: 'success',
      ipAddress: '122.170.14.92',
    })

    this.notify()
  }

  addRecording(recording: Recording) {
    this.recordings.unshift(recording)
    this.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST',
      actorType: 'User',
      actorName: this.currentUser.name,
      actorRole: this.currentUser.role,
      action: `Added lecture recording: ${recording.title}`,
      entity: 'recording',
      entityId: recording.id,
      outcome: 'success',
      ipAddress: '122.170.14.92',
    })
    this.notify()
  }

  addCourse(course: Course) {
    this.courses.unshift(course)
    this.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST',
      actorType: 'User',
      actorName: this.currentUser.name,
      actorRole: this.currentUser.role,
      action: `Created new course: ${course.title} (${course.code})`,
      entity: 'course',
      entityId: course.id,
      outcome: 'success',
      ipAddress: '122.170.14.92',
    })
    this.notify()
  }

  updateCourseCompletionRules(courseId: string, rules: Course['completionRules']) {
    const course = this.courses.find((c) => c.id === courseId)
    if (course) {
      course.completionRules = { ...course.completionRules, ...rules }
      this.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST',
        actorType: 'User',
        actorName: this.currentUser.name,
        actorRole: this.currentUser.role,
        action: `Updated completion criteria for course: ${course.title}`,
        entity: 'course',
        entityId: course.id,
        outcome: 'success',
        ipAddress: '122.170.14.92',
      })
      this.notify()
    }
  }

  reassignBatchRoom(batchId: string, newRoom: string) {
    const batch = this.batches.find((b) => b.id === batchId)
    if (batch) {
      const oldRoom = batch.room
      batch.room = newRoom
      this.timetableSessions.forEach((s) => {
        if (s.batchId === batchId || s.batchName === batch.name) {
          s.room = newRoom
        }
      })
      this.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST',
        actorType: 'User',
        actorName: this.currentUser.name,
        actorRole: this.currentUser.role,
        action: `Reassigned batch ${batch.name} room from ${oldRoom} to ${newRoom}`,
        entity: 'batch',
        entityId: batch.id,
        outcome: 'success',
        ipAddress: '122.170.14.92',
      })
      this.notify()
    }
  }

  createSendMessageApproval(
    title: string,
    summary: string,
    recipients: { id: string; name: string; phone: string; messagePreview: string }[],
    channel: 'whatsapp' | 'sms' = 'whatsapp'
  ): ApprovalAction {
    const newApproval: ApprovalAction = {
      id: `appr-msg-${Date.now()}`,
      type: 'whatsapp_bulk',
      title,
      summary,
      requester: this.currentUser.name,
      requesterRole: this.currentUser.role,
      createdAt: 'Just now',
      riskLevel: 'medium',
      status: 'pending',
      recipientCount: recipients.length,
      channel,
      sendTime: 'Scheduled during active hours',
      estimatedCost: `₹${(recipients.length * 0.17).toFixed(2)}`,
      recipients: recipients.map((r) => ({
        id: r.id,
        name: r.name,
        phone: r.phone,
        messagePreview: r.messagePreview,
        customizedMessage: r.messagePreview,
        selected: true,
      })),
    }
    this.approvals.unshift(newApproval)
    this.notify()
    return newApproval
  }

  createCertificateGenerationApproval(courseId: string): ApprovalAction {
    const course = this.courses.find((c) => c.id === courseId) || this.courses[0]
    const minAttendance = course?.completionRules?.minAttendancePercent || 75

    const eligibleRecipients: { id: string; name: string; phone: string; messagePreview: string; selected: boolean }[] = []

    this.students.forEach((s) => {
      if (s.attendanceRate >= minAttendance) {
        eligibleRecipients.push({
          id: s.id,
          name: s.name,
          phone: s.phone,
          messagePreview: `Eligible: attendance ${s.attendanceRate}% >= required ${minAttendance}%, assignments cleared.`,
          selected: true,
        })
      }
    })

    const newApproval: ApprovalAction = {
      id: `appr-cert-${Date.now()}`,
      type: 'cert_issue',
      title: `Generate completion certificates: ${course.title} (${eligibleRecipients.length} eligible)`,
      summary: `Evaluate cohort against completion criteria: min attendance ${minAttendance}%, assignments 70%, final score 60%.`,
      requester: this.currentUser.name,
      requesterRole: this.currentUser.role,
      createdAt: 'Just now',
      riskLevel: 'low',
      status: 'pending',
      recipientCount: eligibleRecipients.length,
      recipients: eligibleRecipients.map((r) => ({
        ...r,
        customizedMessage: r.messagePreview,
      })),
    }

    this.approvals.unshift(newApproval)
    this.notify()
    return newApproval
  }

  importPayments(newPayments: PaymentRecord[]) {
    let importedCount = 0
    newPayments.forEach((p) => {
      const existing = this.payments.find((ep) => ep.utrNo && ep.utrNo === p.utrNo)
      if (!existing) {
        this.payments.unshift(p)
        importedCount++
      }
    })
    this.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST',
      actorType: 'User',
      actorName: this.currentUser.name,
      actorRole: this.currentUser.role,
      action: `Imported bank statement with ${importedCount} new payment transaction(s)`,
      entity: 'payment',
      entityId: `stmt-${Date.now()}`,
      outcome: 'success',
      ipAddress: '122.170.14.92',
    })
    this.notify()
    return importedCount
  }

  markPaymentNonFee(paymentId: string) {
    const p = this.payments.find((x) => x.id === paymentId)
    if (p) {
      p.status = 'verified'
      p.reconcileReasons = ['Marked as Non-fee transaction (vendor/refund/miscellaneous)']
      this.notify()
    }
  }

  matchPaymentManually(paymentId: string, studentId: string) {
    const p = this.payments.find((x) => x.id === paymentId)
    const s = this.students.find((x) => x.id === studentId)
    if (p && s) {
      p.studentId = s.id
      p.studentName = s.name
      p.status = 'verified'
      p.confidence = 100
      p.reconcileReasons = [`Manually verified by ${this.currentUser.name}`]
      const inst = this.feeInstalments.find((i) => i.studentId === s.id && i.status !== 'paid')
      if (inst) {
        inst.paidAmount += p.amount
        if (inst.paidAmount >= inst.amount) {
          inst.status = 'paid'
        } else {
          inst.status = 'partially_paid'
        }
      }
      this.notify()
    }
  }

  createDraftRemindersApproval(): ApprovalAction {
    const overdue = this.feeInstalments.filter((i) => i.status === 'overdue')
    const newApproval: ApprovalAction = {
      id: `appr-${Date.now()}`,
      type: 'whatsapp_bulk',
      title: `Send WhatsApp reminders to ${overdue.length} overdue accounts`,
      summary: `Automated payment notifications with dynamic fee balances and payment links for ${overdue.length} overdue accounts`,
      requester: this.currentUser.name,
      requesterRole: this.currentUser.role,
      createdAt: 'Just now',
      riskLevel: 'medium',
      status: 'pending',
      recipientCount: overdue.length,
      channel: 'whatsapp',
      sendTime: 'Immediately upon approval',
      estimatedCost: `₹${(overdue.length * 0.17).toFixed(2)} (${overdue.length} msgs @ ₹0.17)`,
      recipients: overdue.map((inst) => ({
        id: inst.studentId,
        name: inst.studentName,
        phone: '+91 98' + Math.floor(10000000 + Math.random() * 90000000),
        amountDue: inst.amount - inst.paidAmount,
        messagePreview: `Hi ${inst.studentName}, your EMI of ${formatINR(inst.amount - inst.paidAmount)} for ${inst.batchName} is ${inst.daysOverdue} days overdue. Please clear it online: codecraft.ac.in/pay`,
        customizedMessage: `Hi ${inst.studentName}, your EMI of ${formatINR(inst.amount - inst.paidAmount)} for ${inst.batchName} is ${inst.daysOverdue} days overdue. Please clear it online: codecraft.ac.in/pay`,
        selected: true,
      })),
    }

    this.approvals.unshift(newApproval)
    this.notify()
    return newApproval
  }

  simulateArjunLeave() {
    this.timetableSessions = this.timetableSessions.map((s) => {
      if (s.id === 'sess-th1') {
        return {
          ...s,
          date: '2026-10-23',
          dayOfWeek: 5,
          startTime: '19:00',
          endTime: '21:00',
          room: 'Room 3',
          hasConflict: false,
          conflictReason: undefined,
        }
      }
      if (s.id === 'sess-th2') {
        return {
          ...s,
          trainerId: 'tr-meera',
          trainerName: 'Meera Rao',
          hasConflict: false,
          conflictReason: undefined,
        }
      }
      if (s.id === 'sess-m2') {
        return {
          ...s,
          hasConflict: false,
          conflictReason: undefined,
        }
      }
      return s
    })
    this.notify()
  }

  createTimetablePublishApproval(diff: { before: string; after: string; reason: string }[]): ApprovalAction {
    const newApproval: ApprovalAction = {
      id: `appr-${Date.now()}`,
      type: 'timetable_replan',
      title: `Publish schedule change (${diff.length} sessions reallocated)`,
      summary: `Automated re-plan resolving trainer leave and room clashes across academic timetable`,
      requester: this.currentUser.name,
      requesterRole: this.currentUser.role,
      createdAt: 'Just now',
      riskLevel: 'low',
      status: 'pending',
      diff,
    }

    this.approvals.unshift(newApproval)
    this.notify()
    return newApproval
  }

  // --- CLASSROOM MODULE ACTIONS ---

  createClass(cls: ClassRoom) {
    this.classes.unshift(cls)
    this.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST',
      actorType: 'User',
      actorName: this.currentUser.name,
      actorRole: this.currentUser.role,
      action: `Created academic classroom: ${cls.name} (Code: ${cls.code})`,
      entity: 'classroom',
      entityId: cls.id,
      outcome: 'success',
      ipAddress: '122.170.14.92',
    })
    this.notify()
  }

  archiveClass(id: string) {
    const cls = this.classes.find((c) => c.id === id)
    if (cls) {
      cls.archived = !cls.archived
      this.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST',
        actorType: 'User',
        actorName: this.currentUser.name,
        actorRole: this.currentUser.role,
        action: `${cls.archived ? 'Archived' : 'Restored'} classroom: ${cls.name}`,
        entity: 'classroom',
        entityId: cls.id,
        outcome: 'success',
        ipAddress: '122.170.14.92',
      })
      this.notify()
    }
  }

  addNote(note: Note, additionalClassIds?: string[]) {
    const targetClassIds = [note.classId, ...(additionalClassIds || [])]
    const createdNotes: Note[] = []

    targetClassIds.forEach((cId) => {
      const cls = this.classes.find((c) => c.id === cId)
      const newNote: Note = {
        ...note,
        id: cId === note.classId ? note.id : `note-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        classId: cId,
        uploadedAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      }
      this.notes.unshift(newNote)
      createdNotes.push(newNote)

      // Post notification to Stream
      this.streamPosts.unshift({
        id: `post-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        classId: cId,
        type: 'note',
        title: `New study material: ${note.title}`,
        content: note.description || `Uploaded lecture material with ${note.files.length} attachment(s).`,
        authorName: this.currentUser.name,
        authorRole: this.currentUser.role,
        createdAt: 'Just now',
        refId: newNote.id,
      })

      this.auditLogs.unshift({
        id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 4)}`,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST',
        actorType: 'User',
        actorName: this.currentUser.name,
        actorRole: this.currentUser.role,
        action: `Uploaded lecture notes "${note.title}" to ${cls?.name || cId}`,
        entity: 'notes',
        entityId: newNote.id,
        outcome: 'success',
        ipAddress: '122.170.14.92',
      })
    })

    this.notify()
    return createdNotes
  }

  updateNote(updated: Note) {
    const idx = this.notes.findIndex((n) => n.id === updated.id)
    if (idx >= 0) {
      this.notes[idx] = updated
      this.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST',
        actorType: 'User',
        actorName: this.currentUser.name,
        actorRole: this.currentUser.role,
        action: `Updated lecture notes: "${updated.title}"`,
        entity: 'notes',
        entityId: updated.id,
        outcome: 'success',
        ipAddress: '122.170.14.92',
      })
      this.notify()
    }
  }

  deleteNote(id: string) {
    const note = this.notes.find((n) => n.id === id)
    if (note) {
      this.notes = this.notes.filter((n) => n.id !== id)
      this.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST',
        actorType: 'User',
        actorName: this.currentUser.name,
        actorRole: this.currentUser.role,
        action: `Deleted lecture notes: "${note.title}"`,
        entity: 'notes',
        entityId: note.id,
        outcome: 'success',
        ipAddress: '122.170.14.92',
      })
      this.notify()
    }
  }

  togglePinNote(id: string) {
    const note = this.notes.find((n) => n.id === id)
    if (note) {
      note.pinned = !note.pinned
      this.notify()
    }
  }

  createAssignment(assignment: Assignment, publishToStream: boolean = true) {
    this.assignments.unshift(assignment)
    const cls = this.classes.find((c) => c.id === assignment.classId)

    if (publishToStream && assignment.status === 'published') {
      this.streamPosts.unshift({
        id: `post-${Date.now()}`,
        classId: assignment.classId,
        type: 'assignment',
        title: `New assignment: ${assignment.title}`,
        content: `Max marks: ${assignment.maxMarks}. Due on ${new Date(assignment.dueAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}. Please review rubric criteria.`,
        authorName: this.currentUser.name,
        authorRole: this.currentUser.role,
        createdAt: 'Just now',
        refId: assignment.id,
      })

      // Generate initial assigned submission placeholders for all students in linked batch
      if (cls) {
        const batchStudents = this.students.filter((s) => s.batchIds.includes(cls.batchId))
        batchStudents.forEach((st) => {
          const existing = this.submissions.find((s) => s.assignmentId === assignment.id && s.studentId === st.id)
          if (!existing) {
            this.submissions.push({
              id: `sub-${Date.now()}-${st.id}`,
              assignmentId: assignment.id,
              studentId: st.id,
              studentName: st.name,
              files: [],
              status: 'assigned',
              attempt: 1,
            })
          }
        })
      }
    }

    this.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST',
      actorType: 'User',
      actorName: this.currentUser.name,
      actorRole: this.currentUser.role,
      action: `Created assignment "${assignment.title}" in ${cls?.name || assignment.classId} (${assignment.rubric.length} rubric criteria)`,
      entity: 'assignment',
      entityId: assignment.id,
      outcome: 'success',
      ipAddress: '122.170.14.92',
    })

    this.notify()
    return assignment
  }

  updateAssignment(idOrAssignment: string | Assignment, partial?: Partial<Assignment>) {
    const targetId = typeof idOrAssignment === 'string' ? idOrAssignment : idOrAssignment.id
    const idx = this.assignments.findIndex((a) => a.id === targetId)
    if (idx >= 0) {
      if (typeof idOrAssignment === 'string' && partial) {
        this.assignments[idx] = { ...this.assignments[idx], ...partial }
      } else if (typeof idOrAssignment !== 'string') {
        this.assignments[idx] = idOrAssignment
      }
      const updated = this.assignments[idx]
      this.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST',
        actorType: 'User',
        actorName: this.currentUser.name,
        actorRole: this.currentUser.role,
        action: `Updated assignment configuration: "${updated.title}"`,
        entity: 'assignment',
        entityId: updated.id,
        outcome: 'success',
        ipAddress: '122.170.14.92',
      })
      this.notify()
    }
  }

  regradeAll(assignmentId: string) {
    const asg = this.assignments.find((a) => a.id === assignmentId)
    if (!asg) return

    const relatedSubs = this.submissions.filter((s) => s.assignmentId === assignmentId && s.status !== 'assigned')
    relatedSubs.forEach((sub) => {
      this.gradeSubmissionAI(sub.id, true)
    })

    this.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST',
      actorType: 'User',
      actorName: this.currentUser.name,
      actorRole: this.currentUser.role,
      action: `Re-graded all submissions for assignment: "${asg.title}" (${relatedSubs.length} candidate(s))`,
      entity: 'assignment',
      entityId: asg.id,
      outcome: 'success',
      ipAddress: '122.170.14.92',
    })
    this.notify()
  }

  async submitAssignment(assignmentId: string, studentId: string, files: Attachment[], text?: string) {
    const asg = this.assignments.find((a) => a.id === assignmentId)
    const student = this.students.find((s) => s.id === studentId) || this.currentUser

    let sub = this.submissions.find((s) => s.assignmentId === assignmentId && s.studentId === studentId)
    const submittedAt = new Date().toISOString()
    const isLate = asg ? new Date(submittedAt) > new Date(asg.dueAt) : false

    if (sub) {
      sub.files = files
      sub.text = text
      sub.submittedAt = submittedAt
      sub.status = isLate ? 'late' : 'submitted'
      sub.attempt = (sub.attempt || 1) + 1
      sub.finalMarks = undefined
      sub.teacherComment = undefined
    } else {
      sub = {
        id: `sub-${Date.now()}`,
        assignmentId,
        studentId,
        studentName: student.name,
        files,
        text,
        submittedAt,
        status: isLate ? 'late' : 'submitted',
        attempt: 1,
      }
      this.submissions.push(sub)
    }

    // Similarity check against existing submissions
    if (text) {
      const otherSubs = this.submissions.filter((s) => s.assignmentId === assignmentId && s.id !== sub!.id)
      const simCheck = checkSubmissionSimilarity(sub.id, text, otherSubs)
      if (simCheck.isSimilar) {
        sub.flagReason = simCheck.reason
      }
    }

    this.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST',
      actorType: 'User',
      actorName: student.name,
      actorRole: 'student',
      action: `Turned in assignment: "${asg?.title || assignmentId}" (Attempt ${sub.attempt})${isLate ? ' [LATE]' : ''}`,
      entity: 'submission',
      entityId: sub.id,
      outcome: 'success',
      ipAddress: '122.170.14.92',
    })

    if (isLate && student && 'riskReasons' in student && Array.isArray((student as Student).riskReasons)) {
      const studentObj = student as Student
      if (!studentObj.riskReasons.some((r: string) => r.toLowerCase().includes('late assignment'))) {
        studentObj.riskReasons.push(`Late assignment submission: ${asg?.title || 'Assignment'}`)
      }
    }

    this.notify()

    // Trigger AI grading immediately
    await this.gradeSubmissionAI(sub.id)
    return sub
  }

  unsubmitAssignment(submissionId: string) {
    const sub = this.submissions.find((s) => s.id === submissionId)
    if (sub && sub.status !== 'returned') {
      sub.status = 'assigned'
      sub.submittedAt = undefined
      sub.aiResult = undefined
      this.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST',
        actorType: 'User',
        actorName: this.currentUser.name,
        actorRole: 'student',
        action: `Unsubmitted assignment work: ${sub.id}`,
        entity: 'submission',
        entityId: sub.id,
        outcome: 'success',
        ipAddress: '122.170.14.92',
      })
      this.notify()
    }
  }

  async gradeSubmissionAI(submissionId: string, keepTeacherOverride: boolean = false) {
    const sub = this.submissions.find((s) => s.id === submissionId)
    if (!sub) return
    const asg = this.assignments.find((a) => a.id === sub.assignmentId)
    if (!asg) return

    sub.status = 'grading'
    this.notify()

    const extracted = await extractSubmissionText(sub.files, sub.text)
    let gradeResult: GradingResult

    if (extracted.isUnreadable) {
      gradeResult = {
        level: asg.checkingLevel,
        maxMarks: asg.maxMarks,
        awarded: 0,
        deductions: [
          {
            criterionId: 'unreadable',
            title: 'Unreadable Submission',
            marksCut: asg.maxMarks,
            reason: extracted.warning || 'Could not extract legible code or text from submitted files.',
          },
        ],
        latePenalty: 0,
        strengths: [],
        improvements: ['Resubmit legible source file or plain text code snippet.'],
        confidence: 'low',
        needsHumanReview: true,
        model: 'batchwise-grading-v2',
        gradedAt: new Date().toISOString(),
      }
    } else {
      gradeResult = await gradingService.grade(asg, extracted.text, sub.submittedAt)
    }

    sub.aiResult = gradeResult

    // If similarity flag exists, force human review
    if (sub.flagReason) {
      gradeResult.needsHumanReview = true
    }

    // Auto-release check
    const isAutoReleaseEligible =
      asg.releaseMode === 'auto_release' &&
      (asg.checkingLevel === 'easy' || asg.checkingLevel === 'medium') &&
      !gradeResult.needsHumanReview &&
      !sub.flagReason

    if (!keepTeacherOverride) {
      if (isAutoReleaseEligible) {
        sub.status = 'returned'
        sub.finalMarks = gradeResult.awarded
        sub.returnedAt = new Date().toISOString()
        sub.returnedBy = 'Batchwise AI Auto-Release'
      } else {
        sub.status = 'graded_draft'
      }
    } else {
      sub.status = 'graded_draft'
    }

    this.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST',
      actorType: 'System',
      actorName: 'Batchwise AI Grader',
      actorRole: 'admin',
      action: `AI Graded submission for ${sub.studentName || sub.studentId}: ${gradeResult.awarded}/${asg.maxMarks} marks (Checking Level: ${asg.checkingLevel})`,
      entity: 'submission',
      entityId: sub.id,
      outcome: 'success',
      ipAddress: '122.170.14.92',
    })

    this.notify()
  }

  updateSubmissionGrade(
    submissionId: string,
    override: {
      finalMarks: number
      comment?: string
      deductions?: GradingDeduction[]
      strengths?: string[]
      improvements?: string[]
    }
  ) {
    const sub = this.submissions.find((s) => s.id === submissionId)
    if (!sub) return
    const asg = this.assignments.find((a) => a.id === sub.assignmentId)

    const prevMarks = sub.finalMarks ?? sub.aiResult?.awarded ?? 0
    sub.finalMarks = override.finalMarks
    if (override.comment) sub.teacherComment = override.comment

    if (sub.aiResult) {
      if (override.deductions) sub.aiResult.deductions = override.deductions
      if (override.strengths) sub.aiResult.strengths = override.strengths
      if (override.improvements) sub.aiResult.improvements = override.improvements
    }

    this.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST',
      actorType: 'User',
      actorName: this.currentUser.name,
      actorRole: this.currentUser.role,
      action: `Teacher grade override for ${sub.studentName || sub.studentId}: AI ${prevMarks}/${asg?.maxMarks || 20} → Teacher ${override.finalMarks}/${asg?.maxMarks || 20}, reason: ${override.comment || 'Manual review adjustment'}`,
      entity: 'submission',
      entityId: sub.id,
      outcome: 'success',
      ipAddress: '122.170.14.92',
    })

    this.notify()
  }

  returnSubmission(submissionId: string, comment?: string) {
    const sub = this.submissions.find((s) => s.id === submissionId)
    if (!sub) return
    const asg = this.assignments.find((a) => a.id === sub.assignmentId)

    sub.status = 'returned'
    sub.returnedAt = new Date().toISOString()
    sub.returnedBy = this.currentUser.name
    if (sub.finalMarks === undefined) {
      sub.finalMarks = sub.aiResult?.awarded ?? asg?.maxMarks ?? 20
    }
    if (comment) sub.teacherComment = comment

    this.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST',
      actorType: 'User',
      actorName: this.currentUser.name,
      actorRole: this.currentUser.role,
      action: `Returned graded assignment "${asg?.title}" to ${sub.studentName || sub.studentId} (${sub.finalMarks}/${asg?.maxMarks} marks)`,
      entity: 'submission',
      entityId: sub.id,
      outcome: 'success',
      ipAddress: '122.170.14.92',
    })

    this.notify()
  }

  returnAllReviewed(assignmentId?: string) {
    let count = 0
    this.submissions.forEach((sub) => {
      if ((!assignmentId || sub.assignmentId === assignmentId) && sub.status === 'graded_draft') {
        sub.status = 'returned'
        sub.returnedAt = new Date().toISOString()
        sub.returnedBy = this.currentUser.name
        if (sub.finalMarks === undefined) {
          sub.finalMarks = sub.aiResult?.awarded ?? 15
        }
        count++
      }
    })

    this.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST',
      actorType: 'User',
      actorName: this.currentUser.name,
      actorRole: this.currentUser.role,
      action: `Bulk-returned ${count} evaluated submission(s) to students`,
      entity: 'submission',
      entityId: assignmentId || 'all',
      outcome: 'success',
      ipAddress: '122.170.14.92',
    })

    this.notify()
    return count
  }

  requestRecheck(submissionId: string, reason: string) {
    const sub = this.submissions.find((s) => s.id === submissionId)
    if (sub) {
      sub.status = 'resubmit_requested'
      sub.recheckReason = reason
      this.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST',
        actorType: 'User',
        actorName: this.currentUser.name,
        actorRole: 'student',
        action: `Requested re-check on assignment: "${reason}"`,
        entity: 'submission',
        entityId: sub.id,
        outcome: 'success',
        ipAddress: '122.170.14.92',
      })
      this.notify()
    }
  }

  requestResubmission(submissionId: string, reason: string) {
    const sub = this.submissions.find((s) => s.id === submissionId)
    if (sub) {
      sub.status = 'resubmit_requested'
      sub.teacherComment = reason
      this.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST',
        actorType: 'User',
        actorName: this.currentUser.name,
        actorRole: this.currentUser.role,
        action: `Requested student resubmission: "${reason}"`,
        entity: 'submission',
        entityId: sub.id,
        outcome: 'success',
        ipAddress: '122.170.14.92',
      })
      this.notify()
    }
  }

  addStreamPost(post: StreamPost) {
    this.streamPosts.unshift(post)
    this.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST',
      actorType: 'User',
      actorName: this.currentUser.name,
      actorRole: this.currentUser.role,
      action: `Posted announcement in classroom: "${post.title}"`,
      entity: 'classroom',
      entityId: post.classId,
      outcome: 'success',
      ipAddress: '122.170.14.92',
    })
    this.notify()
  }

  addCommentToPost(postId: string, comment: ClassComment) {
    const post = this.streamPosts.find((p) => p.id === postId)
    if (post) {
      if (!post.comments) post.comments = []
      post.comments.push(comment)
      this.notify()
    }
  }

  deleteComment(postId: string, commentId: string) {
    const post = this.streamPosts.find((p) => p.id === postId)
    if (post && post.comments) {
      post.comments = post.comments.filter((c) => c.id !== commentId)
      this.notify()
    }
  }
}


export const store = new MockStore()

/**
 * Reactive hook to subscribe to specific store slices with standard useSyncExternalStore.
 */
export function useStore<T>(selector: (state: MockStore) => T): T {
  return useSyncExternalStore(
    (callback) => store.subscribe(callback),
    () => selector(store),
    () => selector(store)
  )
}
