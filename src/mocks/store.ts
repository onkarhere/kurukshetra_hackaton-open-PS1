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
  StudentRegistration,
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
import {
  generateWeek,
  replan,
  ReplanDiffItem,
  ReplanEvent,
  detectConflicts,
  ROOM_CAPACITIES,
} from '@/features/timetable/scheduler'

const STORAGE_KEY = 'batchwise_store_v2'

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

  // Student self-registration and admission approvals
  studentRegistrations: StudentRegistration[] = []

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
    this.seedDynamicRelativeData()
    this.computeRiskScores()
  }

  // Unified audit logger helper (Section 7)
  audit(params: {
    action: string
    entity: string
    entityId: string
    before?: Record<string, any>
    after?: Record<string, any>
    actorType?: 'User' | 'AI' | 'System'
    actorName?: string
    actorRole?: string
    outcome?: 'success' | 'failure' | 'pending'
    aiReplay?: {
      prompt: string
      sql: string
      rowsCount: number
      proposal?: string
      approver?: string
      result?: string
    }
  }): AuditLogEntry {
    const entry: AuditLogEntry = {
      id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp:
        new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST',
      actorType: params.actorType || (this.currentUser ? 'User' : 'System'),
      actorName: params.actorName || this.currentUser?.name || 'System',
      actorRole: params.actorRole || this.currentUser?.role || 'system',
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      outcome: params.outcome || 'success',
      ipAddress: '122.170.14.92',
      changes:
        params.before || params.after
          ? {
              before: params.before || {},
              after: params.after || {},
            }
          : undefined,
      aiReplay: params.aiReplay
        ? {
            prompt: params.aiReplay.prompt,
            sql: params.aiReplay.sql,
            rowsCount: params.aiReplay.rowsCount,
            proposal: params.aiReplay.proposal || 'None',
            approver: params.aiReplay.approver,
            result: params.aiReplay.result || '',
          }
        : undefined,
    }
    this.auditLogs.unshift(entry)
    this.notify()
    return entry
  }

  // Dynamic relative data seeder (Section 1d)
  seedDynamicRelativeData(now = new Date()) {
    const day = now.getDay()
    const diffToMon = (day === 0 ? -6 : 1) - day
    const monday = new Date(now)
    monday.setDate(now.getDate() + diffToMon)
    monday.setHours(0, 0, 0, 0)

    const fmt = (d: Date) => {
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const dt = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${dt}`
    }

    // 1. Ensure 6 past completed sessions for Java Full-Stack B3 (batch-java-b3)
    const pastOffsets = [
      { id: 'sess-jb3-p1', days: -14, dayOfWeek: 1, startTime: '19:00', endTime: '21:00' },
      { id: 'sess-jb3-p2', days: -12, dayOfWeek: 3, startTime: '19:00', endTime: '21:00' },
      { id: 'sess-jb3-p3', days: -10, dayOfWeek: 5, startTime: '19:00', endTime: '21:00' },
      { id: 'sess-jb3-p4', days: -7, dayOfWeek: 1, startTime: '19:00', endTime: '21:00' },
      { id: 'sess-jb3-p5', days: -5, dayOfWeek: 3, startTime: '19:00', endTime: '21:00' },
      { id: 'sess-jb3-p6', days: -3, dayOfWeek: 5, startTime: '19:00', endTime: '21:00' },
    ]

    pastOffsets.forEach((po) => {
      const sessDate = new Date(monday.getTime() + po.days * 86400000)
      const dateStr = fmt(sessDate)
      const existing = this.timetableSessions.find((s) => s.id === po.id)
      if (!existing) {
        this.timetableSessions.unshift({
          id: po.id,
          batchId: 'batch-java-b3',
          batchName: 'Java Full-Stack B3 (Kothrud)',
          courseName: 'Java Full-Stack Developer',
          trainerId: 'tr-arjun',
          trainerName: 'Arjun Mehta',
          room: 'Room 3',
          branch: 'Kothrud',
          date: dateStr,
          dayOfWeek: po.dayOfWeek,
          startTime: po.startTime,
          endTime: po.endTime,
          isOnline: true,
          isLocked: true,
          status: 'completed',
        })
      } else {
        existing.date = dateStr
        existing.status = 'completed'
      }
    })

    // 2. Ensure real attendance records for the 6 completed sessions
    // Priya (4 absent): absent in p1, p2, p4, p6
    // Rohan (4 absent): absent in p2, p3, p5, p6
    // Devendra (3 absent): absent in p3, p4, p5
    // Amit (3 absent): absent in p1, p3, p6
    // Sunita (3 absent): absent in p2, p4, p5
    const studentAbsences: Record<string, string[]> = {
      'std-priya-01': ['sess-jb3-p1', 'sess-jb3-p2', 'sess-jb3-p4', 'sess-jb3-p6'],
      'std-rohan-02': ['sess-jb3-p2', 'sess-jb3-p3', 'sess-jb3-p5', 'sess-jb3-p6'],
      'std-devendra-03': ['sess-jb3-p3', 'sess-jb3-p4', 'sess-jb3-p5'],
      'std-amit-04': ['sess-jb3-p1', 'sess-jb3-p3', 'sess-jb3-p6'],
      'std-sunita-05': ['sess-jb3-p2', 'sess-jb3-p4', 'sess-jb3-p5'],
    }

    pastOffsets.forEach((po) => {
      Object.keys(studentAbsences).forEach((stId) => {
        const student = this.students.find((s) => s.id === stId)
        if (!student) return
        const isAbsent = studentAbsences[stId].includes(po.id)
        const recId = `att-rel-${po.id}-${stId}`
        const existingIdx = this.attendanceRecords.findIndex(
          (r) => (r.sessionId === po.id && r.studentId === stId) || r.id === recId
        )
        const rec: AttendanceRecord = {
          id: recId,
          sessionId: po.id,
          studentId: stId,
          studentName: student.name,
          status: isAbsent ? 'absent' : 'present',
          method: isAbsent ? 'manual' : 'qr',
          checkInTime: isAbsent ? undefined : '19:02 IST',
        }
        if (existingIdx >= 0) {
          this.attendanceRecords[existingIdx] = rec
        } else {
          this.attendanceRecords.unshift(rec)
        }
      })
    })

    // 3. Ensure fee instalments for the 5 students in current week
    const currentWeekDues = [
      {
        id: 'fee-inst-priya-cw',
        studentId: 'std-priya-01',
        studentName: 'Priya Nair',
        sequence: 'EMI 3 of 6',
        amount: 8000,
        dueDayOffset: 3, // Thursday
        status: 'due_soon' as const,
      },
      {
        id: 'fee-inst-rohan-cw',
        studentId: 'std-rohan-02',
        studentName: 'Rohan Kulkarni',
        sequence: 'EMI 3 of 6',
        amount: 8000,
        dueDayOffset: 4, // Friday
        status: 'due_soon' as const,
      },
      {
        id: 'fee-inst-devendra-cw',
        studentId: 'std-devendra-03',
        studentName: 'Devendra Joshi',
        sequence: 'EMI 3 of 6',
        amount: 7500,
        dueDayOffset: 2, // Wednesday
        status: 'due_soon' as const,
      },
      {
        id: 'fee-inst-amit-cw',
        studentId: 'std-amit-04',
        studentName: 'Amit Sane',
        sequence: 'EMI 3 of 6',
        amount: 7500,
        dueDayOffset: 1, // Tuesday
        status: 'due_soon' as const,
      },
      {
        id: 'fee-inst-sunita-cw',
        studentId: 'std-sunita-05',
        studentName: 'Sunita Rao',
        sequence: 'EMI 3 of 6',
        amount: 6500,
        dueDayOffset: 5, // Saturday
        status: 'due_soon' as const,
      },
    ]

    currentWeekDues.forEach((cwd) => {
      const dueDate = new Date(monday.getTime() + cwd.dueDayOffset * 86400000)
      const dueDateStr = fmt(dueDate)
      const existingIdx = this.feeInstalments.findIndex(
        (f) => f.id === cwd.id || (f.studentId === cwd.studentId && f.sequence === cwd.sequence)
      )
      const inst: FeeInstalment = {
        id: cwd.id,
        studentId: cwd.studentId,
        studentName: cwd.studentName,
        batchName: 'Java Full-Stack B3 (Kothrud)',
        sequence: cwd.sequence,
        dueDate: dueDateStr,
        amount: cwd.amount,
        paidAmount: 0,
        status: cwd.status,
        daysOverdue: 0,
      }
      if (existingIdx >= 0) {
        this.feeInstalments[existingIdx] = inst
      } else {
        this.feeInstalments.unshift(inst)
      }
    })

    // Rohan's 2nd overdue EMI (18 days overdue)
    const rohanOverdueDueDate = new Date(now.getTime() - 18 * 86400000)
    const rohanOverdueStr = fmt(rohanOverdueDueDate)
    const rohanOverdueIdx = this.feeInstalments.findIndex(
      (f) => f.id === 'fee-inst-rohan-overdue' || (f.studentId === 'std-rohan-02' && f.sequence === 'EMI 2 of 6')
    )
    const rohanOverdueInst: FeeInstalment = {
      id: 'fee-inst-rohan-overdue',
      studentId: 'std-rohan-02',
      studentName: 'Rohan Kulkarni',
      batchName: 'Java Full-Stack B3 (Kothrud)',
      sequence: 'EMI 2 of 6',
      dueDate: rohanOverdueStr,
      amount: 6500,
      paidAmount: 0,
      status: 'overdue',
      daysOverdue: 18,
      isSecondMissed: true,
    }
    if (rohanOverdueIdx >= 0) {
      this.feeInstalments[rohanOverdueIdx] = rohanOverdueInst
    } else {
      this.feeInstalments.unshift(rohanOverdueInst)
    }
  }

  // Real-time batch strength computation (Section 3)
  getBatchStrength(batchId: string): {
    enrolled: number
    capacity: number
    inRoom: number
    online: number
    onlineSeatLimit: number
    roomCapacity: number
  } {
    const batch = this.batches.find(
      (b) => b.id === batchId || b.code === batchId || b.name === batchId
    )
    const roomCap = batch?.room
      ? ROOM_CAPACITIES[batch.room] || batch.capacity || 30
      : batch?.capacity || 30
    const onlineLimit =
      batch?.onlineSeatLimit ??
      (batch?.mode === 'online' ? 100 : batch?.mode === 'hybrid' ? 15 : 0)
    const totalCapacity = roomCap + onlineLimit

    const enrolledStudents = this.students.filter(
      (s) =>
        batch &&
        (s.batchIds.includes(batch.id) || s.batchNames?.includes(batch.name))
    )
    const enrolled =
      enrolledStudents.length > 0 ? enrolledStudents.length : batch?.enrolledCount || 0

    let onlineCount = 0
    if (batch?.mode === 'online') {
      onlineCount = enrolled
    } else if (batch?.mode === 'hybrid') {
      const explicitOnline = enrolledStudents.filter(
        (s: any) => s.attendancePreference === 'online' || s.mode === 'online'
      ).length
      onlineCount =
        explicitOnline > 0
          ? explicitOnline
          : Math.min(onlineLimit, Math.max(4, Math.round(enrolled * 0.2)))
    } else {
      onlineCount = 0
    }
    const inRoom = Math.max(0, enrolled - onlineCount)

    return {
      enrolled,
      capacity: batch?.capacity || totalCapacity,
      inRoom,
      online: onlineCount,
      onlineSeatLimit: onlineLimit,
      roomCapacity: roomCap,
    }
  }

  // Dynamic Risk Flag computation with real numerical evidence (Section 6)
  computeRiskScores() {
    const settings = this.settings || { minAttendanceThreshold: 75, criticalRiskThreshold: 50 }

    this.students.forEach((student) => {
      // 1. Attendance Analysis
      const studentRecords = this.attendanceRecords
        .filter((r) => r.studentId === student.id)
        .sort((a, b) => (b.checkInTime || '').localeCompare(a.checkInTime || ''))

      const totalSessions = studentRecords.length
      const presentSessions = studentRecords.filter(
        (r) => r.status === 'present' || r.status === 'online'
      ).length

      let consecutiveAbsences = 0
      for (let i = 0; i < Math.min(5, studentRecords.length); i++) {
        if (studentRecords[i].status === 'absent') {
          consecutiveAbsences++
        } else {
          break
        }
      }

      const computedRate =
        totalSessions > 0
          ? Math.round((presentSessions / totalSessions) * 100)
          : student.attendanceRate || 85
      student.attendanceRate = computedRate

      // 2. Classroom Assignments Analysis
      const studentSubs = this.submissions.filter((s) => s.studentId === student.id)
      const lateSubs = studentSubs.filter((s) => s.status === 'late').length
      const missingSubs = studentSubs.filter((s) => s.status === 'assigned').length

      // 3. Fee Instalments Analysis
      const overdueInstalments = this.feeInstalments.filter(
        (fi) => fi.studentId === student.id && fi.status === 'overdue'
      )
      const dueSoonInstalments = this.feeInstalments.filter(
        (fi) => fi.studentId === student.id && fi.status === 'due_soon'
      )

      const maxDaysOverdue =
        overdueInstalments.length > 0
          ? Math.max(...overdueInstalments.map((fi) => fi.daysOverdue || 0))
          : 0
      const totalOverdueAmount = overdueInstalments.reduce(
        (sum, fi) => sum + (fi.amount - (fi.paidAmount || 0)),
        0
      )

      // 4. Calculate Risk Score
      let score = 0
      const reasons: string[] = []

      if (computedRate < settings.criticalRiskThreshold) {
        score += 45
      } else if (computedRate < settings.minAttendanceThreshold) {
        score += 25
      } else if (computedRate < 80) {
        score += 15
      }

      if (totalSessions >= 3) {
        reasons.push(
          `Attended ${presentSessions} of last ${totalSessions} sessions (${computedRate}%)`
        )
      } else if (computedRate < 80) {
        reasons.push(`Current attendance rate is ${computedRate}%`)
      }

      if (consecutiveAbsences >= 2) {
        score += consecutiveAbsences * 6
        reasons.push(`${consecutiveAbsences} consecutive class absences`)
      }

      if (missingSubs > 0 || lateSubs > 0) {
        score += missingSubs * 10 + lateSubs * 5
        reasons.push(
          `${missingSubs > 0 ? `${missingSubs} assignment(s) missing` : ''}${
            missingSubs > 0 && lateSubs > 0 ? ', ' : ''
          }${lateSubs > 0 ? `${lateSubs} assignment(s) submitted late` : ''}`
        )
      }

      if (overdueInstalments.length >= 2) {
        score += 35 + Math.min(20, Math.floor(maxDaysOverdue / 2))
        reasons.push(
          `2nd missed EMI (${formatINR(totalOverdueAmount)} overdue by ${maxDaysOverdue} days)`
        )
        student.feeStatus = 'overdue'
      } else if (overdueInstalments.length === 1) {
        score += 20 + Math.min(15, Math.floor(maxDaysOverdue / 2))
        const inst = overdueInstalments[0]
        reasons.push(
          `EMI ${inst.sequence} overdue by ${inst.daysOverdue} days (${formatINR(inst.amount - inst.paidAmount)})`
        )
        student.feeStatus = 'overdue'
      } else if (dueSoonInstalments.length > 0) {
        const inst = dueSoonInstalments[0]
        reasons.push(
          `EMI ${inst.sequence} (${formatINR(inst.amount - inst.paidAmount)}) due on ${inst.dueDate}`
        )
        student.feeStatus = 'due_soon'
      } else {
        student.feeStatus = 'paid'
      }

      const finalScore = Math.min(100, Math.max(5, score))
      student.riskScore = finalScore
      if (finalScore >= 75) {
        student.riskLevel = 'critical'
      } else if (finalScore >= 50) {
        student.riskLevel = 'high'
      } else if (finalScore >= 25) {
        student.riskLevel = 'watch'
      } else {
        student.riskLevel = 'low'
        if (reasons.length === 0) {
          reasons.push('Consistently punctual and regular attendance')
        }
      }

      student.riskReasons = reasons.slice(0, 3)
    })
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

      // Rehydrate persisted student registrations
      const savedRegistrations = localStorage.getItem('batchwise_student_registrations')
      if (savedRegistrations) {
        try {
          this.studentRegistrations = JSON.parse(savedRegistrations)
        } catch {
          this.studentRegistrations = []
        }
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
        if (parsed.studentRegistrations) this.studentRegistrations = parsed.studentRegistrations
      }
    } catch (e) {
      console.warn('Failed to rehydrate store from localStorage', e)
    }
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem('batchwise_student_registrations', JSON.stringify(this.studentRegistrations))
      const stateToSave = {
        selectedBranch: this.selectedBranch,
        courses: this.courses,
        trainers: this.trainers,
        batches: this.batches,
        students: this.students,
        studentRegistrations: this.studentRegistrations,
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
    } else if (this.currentUser.role === 'student') {
      this.copilotMessages = [
        {
          id: `seed-student-${Date.now()}`,
          sender: 'assistant',
          timestamp: 'Just now',
          content: "Hi Priya! I'm your Student Copilot. Ask me about your attendance, today's lecture schedule, or pending assignments.",
          suggestedFollowUps: [
            "What's my attendance?",
            "What lecture do I have today?",
            "What assignments are pending?",
          ],
        },
      ]
    } else {
      this.copilotMessages = [mockSeedCopilotMessage]
    }

    this.notify()
  }

  login(user: User) {
    // Check if user has an existing student registration
    const userEmail = (user.email || '').trim().toLowerCase()
    const existingReg = this.studentRegistrations.find(
      (r) => r.email.toLowerCase() === userEmail
    )

    if (user.role === 'student') {
      if (user.approvalStatus === 'approved') {
        user.hasCompletedOnboarding = true
        user.approvalStatus = 'approved'
      } else if (existingReg) {
        user.hasCompletedOnboarding = true
        user.approvalStatus = existingReg.status
        user.name = existingReg.name
        user.branch = existingReg.branch
        user.studentProfile = {
          name: existingReg.name,
          className: existingReg.className,
          branch: existingReg.branch,
          rollNo: existingReg.rollNo,
          phone: existingReg.phone,
          email: existingReg.email,
          submittedAt: existingReg.submittedAt,
        }
      } else {
        // Check if user is an existing seeded mock student (like Priya Nair)
        const seededStudent = this.students.find(
          (s) => s.email.toLowerCase() === userEmail || s.id === user.id
        )
        if (seededStudent) {
          user.hasCompletedOnboarding = true
          user.approvalStatus = 'approved'
          user.name = seededStudent.name
          user.branch = seededStudent.branch
        } else {
          // Brand new student login: first time!
          user.hasCompletedOnboarding = false
          user.approvalStatus = 'pending'
        }
      }
    } else {
      // Non-student roles (trainer, owner, counselor, accounts) are automatically approved
      user.hasCompletedOnboarding = true
      user.approvalStatus = 'approved'
    }

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
          content: "Hi Priya! I'm your Student Copilot. Ask me about your attendance, today's lecture schedule, or pending assignments.",
          suggestedFollowUps: [
            "What's my attendance?",
            "What lecture do I have today?",
            "What assignments are pending?",
          ],
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
    if (!item || item.status !== 'pending') return false

    // Role safety check: Only owner, admin, counselor, accounts can approve fee reminders
    const isFeeApproval =
      item.type === 'whatsapp_bulk' &&
      (item.title?.toLowerCase().includes('fee') ||
        item.title?.toLowerCase().includes('emi') ||
        item.summary?.toLowerCase().includes('fee') ||
        item.summary?.toLowerCase().includes('emi') ||
        item.recipients?.some((r) => r.amountDue && r.amountDue > 0))

    const feeAllowedRoles = ['owner', 'admin', 'counselor', 'accounts']
    if (isFeeApproval && !feeAllowedRoles.includes(this.currentUser.role)) {
      this.audit({
        action: `Approval blocked: role '${this.currentUser.role}' not permitted to approve fee reminders`,
        entity: item.type,
        entityId: item.id,
        outcome: 'failure',
      })
      return false
    }

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
          status: 'sent',
          approvalId: item.id,
          createdAt:
            new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST',
        }
        createdMessages.push(outboxMsg)
        this.messages.unshift(outboxMsg)
      })

      resultSummary = `Dispatched ${createdMessages.length} message(s) via ${item.channel || 'WhatsApp'}.`
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
        const certNo = `CC-2026-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.floor(
          1000 + Math.random() * 9000
        )}`
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
    }

    // 4. student_registration admission approval by Head (Trainer / Owner)
    else if (item.type === 'student_registration') {
      const headAllowedRoles = ['trainer', 'owner', 'admin']
      if (!headAllowedRoles.includes(this.currentUser.role)) {
        this.audit({
          action: `Approval blocked: role '${this.currentUser.role}' not permitted to approve student admissions. Requires Head (Trainer or Owner).`,
          entity: item.type,
          entityId: item.id,
          outcome: 'failure',
        })
        return false
      }

      const reg = item.studentRegistration
      if (reg) {
        reg.status = 'approved'
        reg.approvedBy = `${this.currentUser.name} (${this.currentUser.role === 'trainer' ? 'Trainer' : 'Owner'})`
        reg.approvedAt = new Date().toISOString()

        // Also update in this.studentRegistrations
        const targetReg = this.studentRegistrations.find(
          (r) => r.id === reg.id || r.email.toLowerCase() === reg.email.toLowerCase()
        )
        if (targetReg) {
          targetReg.status = 'approved'
          targetReg.approvedBy = reg.approvedBy
          targetReg.approvedAt = reg.approvedAt
        }

        // Enroll student into active students directory if not already there
        const matchingBatch = this.batches.find(
          (b) => b.name === reg.className || b.code === reg.className
        )
        const batchId = matchingBatch?.id || 'batch-java-b3'
        const batchName = matchingBatch?.name || reg.className
        const existingStudent = this.students.find(
          (s) => s.email.toLowerCase() === reg.email.toLowerCase() || s.id === reg.studentId
        )
        if (!existingStudent) {
          const newStudent: Student = {
            id: reg.studentId,
            name: reg.name,
            email: reg.email,
            phone: reg.phone,
            branch: reg.branch,
            batchIds: [batchId],
            batchNames: [batchName],
            attendanceRate: 100,
            feeStatus: 'paid',
            riskLevel: 'low',
            riskScore: 5,
            riskReasons: ['Newly admitted student · Head verified'],
            lastSeen: 'Just now',
            enrolledAt: new Date().toISOString().split('T')[0],
          }
          this.students.unshift(newStudent)
        }

        // If the student is currently logged in, update their session
        if (this.currentUser.email.toLowerCase() === reg.email.toLowerCase()) {
          this.currentUser.approvalStatus = 'approved'
          if (typeof window !== 'undefined') {
            localStorage.setItem('batchwise_auth_user', JSON.stringify(this.currentUser))
          }
        }

        if (typeof window !== 'undefined') {
          localStorage.setItem('batchwise_student_registrations', JSON.stringify(this.studentRegistrations))
        }
      }
      resultSummary = `Approved student registration for ${item.studentRegistration?.name || 'student'}. Dashboard unlocked.`
    } else {
      resultSummary = `Action ${item.title} completed successfully.`
    }

    // Write audit log entry
    this.audit({
      action: `Approved: ${item.title}`,
      entity: item.type,
      entityId: item.id,
      outcome: 'success',
      before: { status: 'pending' },
      after: {
        status: 'approved',
        result: resultSummary,
        approver: this.currentUser.name,
        count: item.recipients?.filter((r) => r.selected !== false).length || 0,
        approvalId: item.id,
      },
    })

    // Update copilot message proposal if matching
    const msg = this.copilotMessages.find((m) => m.approvalProposal?.id === id)
    if (msg && msg.approvalProposal) {
      msg.approvalProposal.status = 'approved'
    }

    this.saveToStorage()
    this.notify()
    return true
  }

  rejectProposal(id: string, reason?: string) {
    const item = this.approvals.find((a) => a.id === id)
    if (!item || item.status !== 'pending') return

    item.status = 'rejected'
    item.approvedBy = this.currentUser.name

    if (item.type === 'student_registration' && item.studentRegistration) {
      item.studentRegistration.status = 'rejected'
      item.studentRegistration.rejectionReason = reason || 'Rejected by Head'
      const targetReg = this.studentRegistrations.find(
        (r) => r.id === item.studentRegistration?.id || r.email.toLowerCase() === item.studentRegistration?.email.toLowerCase()
      )
      if (targetReg) {
        targetReg.status = 'rejected'
        targetReg.rejectionReason = reason || 'Rejected by Head'
      }
      if (this.currentUser.email.toLowerCase() === item.studentRegistration.email.toLowerCase()) {
        this.currentUser.approvalStatus = 'rejected'
        if (typeof window !== 'undefined') {
          localStorage.setItem('batchwise_auth_user', JSON.stringify(this.currentUser))
        }
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('batchwise_student_registrations', JSON.stringify(this.studentRegistrations))
      }
    }

    this.audit({
      action: `Rejected: ${item.title}${reason ? ` (Reason: ${reason})` : ''}`,
      entity: item.type,
      entityId: item.id,
      outcome: 'success',
      before: { status: 'pending' },
      after: { status: 'rejected', reason: reason || 'Rejected by user', approver: this.currentUser.name },
    })

    const msg = this.copilotMessages.find((m) => m.approvalProposal?.id === id)
    if (msg && msg.approvalProposal) {
      msg.approvalProposal.status = 'rejected'
    }

    this.saveToStorage()
    this.notify()
  }

  // Student self-registration on first login
  submitStudentRegistration(data: {
    name: string
    className: string
    branch: Branch
    rollNo: string
    phone: string
    email: string
  }) {
    const regId = `reg-${Date.now()}`
    const studentId = this.currentUser.id || `std-${Date.now()}`
    const submittedAt = new Date().toISOString()

    const reg: StudentRegistration = {
      id: regId,
      studentId,
      name: data.name,
      className: data.className,
      branch: data.branch,
      rollNo: data.rollNo,
      phone: data.phone,
      email: data.email,
      status: 'pending',
      submittedAt,
    }

    // Upsert registration
    const existingIndex = this.studentRegistrations.findIndex(
      (r) => r.email.toLowerCase() === data.email.toLowerCase()
    )
    if (existingIndex >= 0) {
      this.studentRegistrations[existingIndex] = reg
    } else {
      this.studentRegistrations.unshift(reg)
    }

    // Upsert approval proposal
    const existingApprovalIndex = this.approvals.findIndex(
      (a) =>
        a.type === 'student_registration' &&
        a.studentRegistration?.email.toLowerCase() === data.email.toLowerCase() &&
        a.status === 'pending'
    )
    const approval: ApprovalAction = {
      id: `appr-reg-${Date.now()}`,
      type: 'student_registration',
      title: `Student Admission: ${data.name}`,
      summary: `New student registration for ${data.className} (${data.branch} branch). Roll No: ${data.rollNo}, Phone: ${data.phone}. Awaiting Head review.`,
      requester: data.name,
      requesterRole: 'student',
      createdAt: 'Just now',
      riskLevel: 'medium',
      status: 'pending',
      studentRegistration: reg,
    }
    if (existingApprovalIndex >= 0) {
      this.approvals[existingApprovalIndex] = approval
    } else {
      this.approvals.unshift(approval)
    }

    // Update current user state
    this.currentUser.name = data.name
    this.currentUser.branch = data.branch
    this.currentUser.hasCompletedOnboarding = true
    this.currentUser.approvalStatus = 'pending'
    this.currentUser.studentProfile = {
      ...data,
      submittedAt,
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('batchwise_student_registrations', JSON.stringify(this.studentRegistrations))
      localStorage.setItem('batchwise_auth_user', JSON.stringify(this.currentUser))
    }

    this.audit({
      action: `Submitted student registration for ${data.name}`,
      entity: 'student_registration',
      entityId: regId,
      outcome: 'success',
      after: { student: data.name, class: data.className, branch: data.branch, rollNo: data.rollNo },
    })

    this.saveToStorage()
    this.notify()
    return reg
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
        const existing = this.attendanceRecords[idx]
        // In-room check-in takes precedence over online
        if (
          (existing.method === 'qr' || existing.method === 'manual') &&
          existing.status === 'present' &&
          rec.method === 'online_import'
        ) {
          return
        }
        this.attendanceRecords[idx] = rec
      } else {
        this.attendanceRecords.push(rec)
      }
    })
    this.computeRiskScores()
    this.audit({
      action: `Recorded session attendance for ${records.length} attendee(s)`,
      entity: 'attendance',
      entityId: records[0]?.sessionId || 'bulk',
      after: { count: records.length },
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
      this.audit({
        action: `Added counseling note for student ${student.name}`,
        entity: 'student',
        entityId: student.id,
      })
      this.notify()
    }
  }

  reconcilePayment(paymentId: string) {
    const payment = this.payments.find((p) => p.id === paymentId)
    if (payment) {
      payment.status = 'verified'
      payment.confidence = 100
      payment.reconcileReasons = [`Verified by ${this.currentUser.name}`]
      this.audit({
        action: `Reconciled bank payment ${payment.receiptNo} (${formatINR(payment.amount)}) for ${payment.studentName}`,
        entity: 'payment',
        entityId: payment.id,
        before: { status: 'needs_review' },
        after: { status: 'verified', confidence: 100 },
      })
      this.computeRiskScores()
      this.notify()
    }
  }

  updateTrainerAvailability(trainerId: string, availability: Record<string, boolean[]>) {
    const trainer = this.trainers.find((t) => t.id === trainerId)
    if (trainer) {
      trainer.availability = availability
      this.audit({
        action: `Updated weekly availability schedule for ${trainer.name}`,
        entity: 'trainer',
        entityId: trainer.id,
      })
      this.notify()
    }
  }

  approveTrainerLeave(trainerId: string, leaveId: string) {
    const trainer = this.trainers.find((t) => t.id === trainerId)
    if (trainer) {
      const leave = trainer.leaveRequests.find((l) => l.id === leaveId)
      if (leave) {
        leave.status = 'approved'
        this.audit({
          action: `Approved leave request for ${trainer.name} on ${leave.date}`,
          entity: 'trainer_leave',
          entityId: leave.id,
          before: { status: 'pending' },
          after: { status: 'approved' },
        })
        this.notify()
      }
    }
  }

  addCopilotMessage(msg: CopilotMessage) {
    this.copilotMessages.push(msg)
    if (msg.sender === 'assistant' && msg.query) {
      this.audit({
        action: `Copilot query: "${msg.query}"`,
        entity: 'copilot',
        entityId: msg.id,
        actorType: 'AI',
        actorName: 'Batchwise Copilot',
        actorRole: this.currentUser?.role,
        aiReplay: {
          prompt: msg.query,
          sql: msg.sql || '-- Deterministic query executed',
          rowsCount: msg.rowsCount ?? (msg.tableData?.length || 0),
          proposal: msg.approvalProposal ? msg.approvalProposal.title : 'None',
          approver: this.currentUser?.name,
          result: msg.content.slice(0, 160),
        },
        after: {
          query: msg.query,
          refused: Boolean(msg.refusal?.isRefused),
          rowsCount: msg.rowsCount ?? 0,
        },
      })
    }
    this.notify()
  }

  setCopilotFeedback(messageId: string, feedback: 'up' | 'down') {
    const msg = this.copilotMessages.find((m) => m.id === messageId)
    if (msg) {
      msg.feedback = feedback
      this.audit({
        action: `Submitted Copilot response feedback (${feedback === 'up' ? 'Helpful' : 'Not helpful'})`,
        entity: 'copilot',
        entityId: messageId,
        after: { feedback },
      })
      this.notify()
    }
  }

  revokeCertificate(certId: string) {
    const cert = this.certificates.find((c) => c.id === certId || c.certificateNo === certId)
    if (cert) {
      cert.status = 'revoked'
      this.audit({
        action: `Revoked certificate: ${cert.certificateNo} issued to ${cert.studentName}`,
        entity: 'certificate',
        entityId: cert.id,
        before: { status: 'valid' },
        after: { status: 'revoked' },
      })
      this.notify()
    }
  }

  acknowledgeRisk(studentId: string, by: string) {
    if (!this.riskAcknowledgements) {
      this.riskAcknowledgements = {}
    }
    const isAcknowledging = !this.riskAcknowledgements[studentId]
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
    this.audit({
      action: `${isAcknowledging ? 'Acknowledged' : 'Cleared acknowledgement for'} student ${studentId} academic risk`,
      entity: 'risk',
      entityId: studentId,
      after: { acknowledged: isAcknowledging, by },
    })
    this.notify()
  }

  updateSettings(newSettings: Partial<InstituteSettings>) {
    const before = { ...this.settings }
    this.settings = { ...this.settings, ...newSettings }
    this.audit({
      action: 'Updated institute settings and risk/attendance thresholds',
      entity: 'settings',
      entityId: 'inst-settings',
      before,
      after: this.settings,
    })
    this.computeRiskScores()
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
      this.audit({
        action: `Reassigned batch ${batch.name} room from ${oldRoom} to ${newRoom}`,
        entity: 'batch',
        entityId: batch.id,
        before: { room: oldRoom },
        after: { room: newRoom },
      })
      this.notify()
    }
  }

  addBatch(newBatch: Batch) {
    this.batches.unshift(newBatch)
    const replanResult = replan(
      { type: 'new_batch', batchId: newBatch.id },
      this.timetableSessions,
      this.trainers,
      this.batches,
      this.settings
    )
    this.audit({
      action: `Created new academic batch: ${newBatch.name} (${newBatch.code})`,
      entity: 'batch',
      entityId: newBatch.id,
      after: newBatch,
    })
    this.notify()
    return replanResult
  }

  applyReplan(diff: ReplanDiffItem[], updatedSessions: TimetableSession[]) {
    const beforeCount = this.timetableSessions.length
    this.timetableSessions = updatedSessions
    this.audit({
      action: `Applied timetable replan (${diff.length} changes)`,
      entity: 'timetable',
      entityId: `replan-${Date.now()}`,
      before: { sessionCount: beforeCount },
      after: { sessionCount: updatedSessions.length, diffCount: diff.length },
    })
    this.notify()
  }

  addTimetableSession(newSession: TimetableSession) {
    this.timetableSessions.unshift(newSession)
    this.audit({
      action: `Manually added lecture: ${newSession.batchName} (${newSession.startTime}–${newSession.endTime}, ${newSession.room})`,
      entity: 'timetable',
      entityId: newSession.id,
      after: newSession,
    })
    this.notify()
  }

  updateTimetableSession(sessionId: string, updates: Partial<TimetableSession>) {
    const idx = this.timetableSessions.findIndex((s) => s.id === sessionId)
    if (idx !== -1) {
      const before = { ...this.timetableSessions[idx] }
      this.timetableSessions[idx] = { ...this.timetableSessions[idx], ...updates }
      this.audit({
        action: `Manually updated lecture: ${this.timetableSessions[idx].batchName}`,
        entity: 'timetable',
        entityId: sessionId,
        before,
        after: this.timetableSessions[idx],
      })
      this.notify()
    }
  }

  deleteTimetableSession(sessionId: string) {
    const sess = this.timetableSessions.find((s) => s.id === sessionId)
    if (sess) {
      this.timetableSessions = this.timetableSessions.filter((s) => s.id !== sessionId)
      this.audit({
        action: `Deleted lecture: ${sess.batchName} (${sess.startTime}–${sess.endTime}, ${sess.room})`,
        entity: 'timetable',
        entityId: sessionId,
        before: sess,
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
      const before = { status: p.status, reconcileReasons: p.reconcileReasons }
      p.status = 'verified'
      p.reconcileReasons = ['Marked as Non-fee transaction (vendor/refund/miscellaneous)']
      this.audit({
        action: `Marked payment ${paymentId} (${formatINR(p.amount)}) as non-fee`,
        entity: 'payment',
        entityId: paymentId,
        before,
        after: { status: p.status, reconcileReasons: p.reconcileReasons },
      })
      this.computeRiskScores()
      this.notify()
    }
  }

  matchPaymentManually(paymentId: string, studentId: string) {
    const p = this.payments.find((x) => x.id === paymentId)
    const s = this.students.find((x) => x.id === studentId)
    if (p && s) {
      const before = { studentId: p.studentId, studentName: p.studentName, status: p.status }
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
      this.audit({
        action: `Manually matched payment ${paymentId} (${formatINR(p.amount)}) to student ${s.name}`,
        entity: 'payment',
        entityId: paymentId,
        before,
        after: { studentId: s.id, studentName: s.name, status: 'verified', instPaid: inst?.paidAmount },
      })
      this.computeRiskScores()
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

/**
 * Returns role-sanitized risk reasons for a student.
 * Trainers see financial factors replaced by 'Non-academic factor — counselor informed'.
 */
export function getStudentRiskReasons(student: Student, role: UserRole): string[] {
  const reasons =
    student.riskReasons && student.riskReasons.length > 0
      ? student.riskReasons
      : ['Regular academic attendance']

  if (role === 'trainer') {
    return reasons.map((r) => {
      const lower = r.toLowerCase()
      if (
        lower.includes('emi') ||
        lower.includes('fee') ||
        lower.includes('₹') ||
        lower.includes('overdue') ||
        lower.includes('instalment')
      ) {
        return 'Non-academic factor — counselor informed'
      }
      return r
    })
  }
  return reasons
}
