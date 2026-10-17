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
} from '@/types'
import { formatINR } from '@/lib/utils'

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
