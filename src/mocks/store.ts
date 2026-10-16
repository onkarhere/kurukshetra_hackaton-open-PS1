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
} from '@/types'

class MockStore {
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

  // Listeners for reactivity
  private listeners: Set<() => void> = new Set()

  subscribe(listener: () => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  notify() {
    this.listeners.forEach((fn) => fn())
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
    } else if (role === 'accounts') {
      this.currentUser.name = 'Sunita Accounts'
      this.currentUser.email = 'accounts@codecraft.ac.in'
    } else if (role === 'student') {
      this.currentUser.name = 'Priya Nair'
      this.currentUser.email = 'priya.nair@gmail.com'
    } else {
      this.currentUser.name = 'Rajesh Sharma'
      this.currentUser.email = 'rajesh@codecraft.ac.in'
      this.copilotMessages = [mockSeedCopilotMessage]
    }
    this.notify()
  }

  setBranch(branch: Branch | 'All') {
    this.selectedBranch = branch
    this.notify()
  }

  approveProposal(id: string) {
    const item = this.approvals.find((a) => a.id === id)
    if (item) {
      item.status = 'approved'
      item.approvedAt = new Date().toISOString()
      item.approvedBy = this.currentUser.name
      
      // Add audit log
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
      })

      // Update copilot message proposal if matching
      const msg = this.copilotMessages.find((m) => m.approvalProposal?.id === id)
      if (msg && msg.approvalProposal) {
        msg.approvalProposal.status = 'approved'
      }

      this.notify()
    }
  }

  rejectProposal(id: string) {
    const item = this.approvals.find((a) => a.id === id)
    if (item) {
      item.status = 'rejected'
      const msg = this.copilotMessages.find((m) => m.approvalProposal?.id === id)
      if (msg && msg.approvalProposal) {
        msg.approvalProposal.status = 'rejected'
      }
      this.notify()
    }
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

  simulateArjunLeave() {
    // Re-plan sessions to eliminate conflicts
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

  addCopilotMessage(msg: CopilotMessage) {
    this.copilotMessages.push(msg)
    this.notify()
  }
}

export const store = new MockStore()
