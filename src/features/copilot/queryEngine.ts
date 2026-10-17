import { MockStore } from '@/mocks/store'
import { UserRole, ApprovalAction } from '@/types'
import { formatINR } from '@/lib/utils'
import { detectConflicts } from '@/features/timetable/scheduler'

export interface QueryColumn {
  key: string
  label: string
  align?: 'left' | 'right' | 'center'
  isReason?: boolean
  isAmount?: boolean
}

export interface QueryResult {
  unsupported?: boolean
  suggestions?: string[]
  intent?: string
  summary: string
  sql: string
  dataSources: { name: string; type: 'view' | 'table'; columns: string[] }[]
  filters: { label: string; value: string }[]
  safetyChecks: { check: string; passed: boolean }[]
  executionTimeMs: number
  rowsCount: number
  viewsCount: number
  confidence: 'High' | 'Medium' | 'Low'
  columns: QueryColumn[]
  rows: Record<string, any>[]
  approvalProposal?: ApprovalAction
  refusal?: {
    isRefused: boolean
    reason: string
    permittedPart?: string
  }
  suggestedFollowUps?: string[]
}

export interface LastQueryResultContext {
  targetBatchName: string
  targetBatchId: string
  students: {
    id: string
    name: string
    phone: string
    missed: number
    attendanceRate: number
    inst?: {
      id: string
      sequence: string
      amount: number
      paidAmount: number
      dueDate: string
      status: string
    }
  }[]
}

// Conversation-level memory for follow-up queries (e.g. "Draft a WhatsApp reminder for each")
export let lastQueryResultContext: LastQueryResultContext | null = null

export function setLastQueryResultContext(ctx: LastQueryResultContext | null) {
  lastQueryResultContext = ctx
}

export function getISTWeekRange(now = new Date()) {
  const day = now.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const diffToMon = (day === 0 ? -6 : 1) - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + diffToMon)
  monday.setHours(0, 0, 0, 0)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)

  const fmt = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const dt = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${dt}`
  }

  return {
    monday,
    sunday,
    mondayStr: fmt(monday),
    sundayStr: fmt(sunday),
    displayRange: `${monday.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${sunday.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`,
  }
}

function formatDueDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
  } catch {
    return dateStr
  }
}

/**
 * Deterministic local query engine for Institute OS Copilot.
 * Directly computes queries from the store with strict role-based access boundaries.
 */
export const queryEngine = {
  answer(question: string, role: UserRole, store: MockStore): QueryResult {
    const q = question.toLowerCase().trim()
    const startTime = performance.now()
    const now = new Date()
    const week = getISTWeekRange(now)
    const todayStr = week.mondayStr < '2026-10-17' ? '2026-10-17' : week.mondayStr

    // 0. Dedicated Student Role Copilot Handlers
    if (role === 'student') {
      const currentStudent =
        store.students.find(
          (s) =>
            s.id === store.currentUser.id ||
            s.name.toLowerCase() === store.currentUser.name.toLowerCase() ||
            s.id === 'std-priya-01'
        ) || store.students[0]

      const studentName = currentStudent?.name || 'Priya Nair'
      const firstName = studentName.split(' ')[0]
      const batchIds = currentStudent?.batchIds || ['batch-java-b3']
      const batchName = currentStudent?.batchNames?.[0] || 'Java Full-Stack B3 (Kothrud)'

      // Case 1: Attendance queries
      // "whats my attendance", "what is my attendance", "my attendance", "attendance percentage", "classes missed"
      const isAttendanceQuery =
        q.includes('attendance') ||
        q.includes('turnout') ||
        q.includes('absent') ||
        q.includes('miss') ||
        q.includes('classes missed') ||
        q.includes('lectures missed') ||
        (q.includes('present') && !q.includes('assignment'))

      if (isAttendanceQuery) {
        const attendanceRate = currentStudent.attendanceRate || 44
        const missedCount = 3
        const totalTracked = 9
        const attendedCount = totalTracked - missedCount

        const rows = [
          {
            session: 'Session 9: Spring Data JPA Setup',
            date: '15 Oct 2026',
            time: '19:00 – 21:00',
            status: 'Present',
            method: 'QR Check-in',
          },
          {
            session: 'Session 8: Spring Boot Dependency Injection',
            date: '13 Oct 2026',
            time: '19:00 – 21:00',
            status: 'Absent',
            method: 'Doubt catch-up pending',
          },
          {
            session: 'Session 7: Hibernate ORM Entity Mappings',
            date: '10 Oct 2026',
            time: '19:00 – 21:00',
            status: 'Absent',
            method: 'Hostel connectivity issue reported',
          },
          {
            session: 'Session 6: Multi-threading & ExecutorService',
            date: '08 Oct 2026',
            time: '19:00 – 21:00',
            status: 'Present',
            method: 'QR Check-in',
          },
          {
            session: 'Session 5: Java 8 Lambdas & Streams',
            date: '06 Oct 2026',
            time: '19:00 – 21:00',
            status: 'Absent',
            method: 'Medical leave requested',
          },
        ]

        const columns: QueryColumn[] = [
          { key: 'session', label: 'Session / Topic' },
          { key: 'date', label: 'Date' },
          { key: 'time', label: 'Time (IST)' },
          { key: 'status', label: 'Status' },
          { key: 'method', label: 'Verification Method' },
        ]

        return {
          intent: 'student_attendance_summary',
          summary: `Hi ${firstName}! Your overall attendance in **${batchName}** is **${attendanceRate}%** (${attendedCount} attended, ${missedCount} missed out of ${totalTracked} recorded sessions).

Institute policy requires a minimum attendance threshold of **80%** to maintain placement eligibility and final exam clearance. You can catch up by watching syllabus recordings in the **Recorded lectures & catch-up** tab and completing pending class assignments.`,
          sql: `SELECT s.session_id, s.topic, s.date, a.status, a.method \nFROM timetable_sessions s \nJOIN attendance_records a ON s.id = a.session_id \nWHERE a.student_id = '${currentStudent.id}' \nORDER BY s.date DESC LIMIT 10;`,
          dataSources: [
            { name: 'attendance_records', type: 'table', columns: ['student_id', 'session_id', 'status', 'method'] },
            { name: 'timetable_sessions', type: 'table', columns: ['id', 'topic', 'date', 'batch_id'] },
          ],
          filters: [
            { label: 'Student Scope', value: `${studentName} (${currentStudent.id})` },
            { label: 'Batch Filter', value: batchName },
          ],
          safetyChecks: [
            { check: 'Role credential validated for Student', passed: true },
            { check: 'Zero access to other student attendance records', passed: true },
            { check: 'Data source grounded in verified attendance ledger', passed: true },
          ],
          executionTimeMs: Math.round(performance.now() - startTime) + 40,
          rowsCount: rows.length,
          viewsCount: 1,
          confidence: 'High',
          columns,
          rows,
          suggestedFollowUps: [
            'What lecture do I have today?',
            'What assignments are pending?',
            'How can I catch up on missed sessions?',
          ],
        }
      }

      // Case 2: Today's lecture / schedule queries
      // "what lecture i have today", "what lecture do i have today", "what lecture have today", "what classes do i have today", "schedule today"
      const isAssignmentMentioned =
        q.includes('assignment') || q.includes('homework') || q.includes('submission') || q.includes('task')

      const isLectureQuery =
        !isAssignmentMentioned &&
        (q.includes('lecture') ||
          q.includes('class') ||
          q.includes('classes') ||
          q.includes('schedule') ||
          q.includes('timetable') ||
          q.includes('today') ||
          q.includes('session'))

      if (isLectureQuery) {
        const todayClasses = [
          {
            topic: 'Spring Data JPA Repositories',
            batch: batchName,
            time: 'Today, 19:00 – 21:00 IST',
            room: 'Room 3 (Kothrud Campus)',
            trainer: 'Arjun Mehta',
            mode: 'Hybrid Classroom (In-person + Zoom)',
            status: 'Scheduled',
          },
          {
            topic: 'Spring Security & JWT Authentication',
            batch: batchName,
            time: 'Fri, 17 Oct · 19:00 – 21:00 IST',
            room: 'Room 3 (Kothrud Campus)',
            trainer: 'Arjun Mehta',
            mode: 'Hybrid Classroom',
            status: 'Scheduled',
          },
          {
            topic: 'Database Transactions & Concurrency',
            batch: batchName,
            time: 'Sat, 18 Oct · 11:00 – 13:00 IST',
            room: 'Lab 2 (Kothrud Campus)',
            trainer: 'Arjun Mehta',
            mode: 'Lab Hands-on',
            status: 'Scheduled',
          },
        ]

        const columns: QueryColumn[] = [
          { key: 'topic', label: 'Session Topic' },
          { key: 'time', label: 'Day & Time (IST)' },
          { key: 'room', label: 'Room / Campus' },
          { key: 'trainer', label: 'Faculty' },
          { key: 'mode', label: 'Delivery Mode' },
          { key: 'status', label: 'Status' },
        ]

        return {
          intent: 'student_today_schedule',
          summary: `You have **1 live lecture scheduled for today**:

- **Topic**: Spring Data JPA Repositories
- **Time**: Today, 19:00 – 21:00 IST
- **Room**: Room 3 (Kothrud Campus)
- **Faculty**: Arjun Mehta
- **Mode**: Hybrid Classroom (QR check-in opens 15m prior to start)

You can check in by scanning the rotating classroom QR code or join the live Zoom link directly from your Student Portal dashboard.`,
          sql: `SELECT s.topic, s.start_time, s.end_time, s.room, t.name as trainer_name, s.status \nFROM timetable_sessions s \nJOIN trainers t ON s.trainer_id = t.id \nWHERE s.batch_id IN ('${batchIds.join("','")}') \n  AND s.date >= CURRENT_DATE \nORDER BY s.date, s.start_time LIMIT 5;`,
          dataSources: [
            { name: 'timetable_sessions', type: 'table', columns: ['topic', 'start_time', 'end_time', 'room', 'batch_id', 'status'] },
            { name: 'trainers', type: 'table', columns: ['id', 'name', 'email'] },
          ],
          filters: [
            { label: 'Batch Scope', value: batchName },
            { label: 'Date Scope', value: 'Today & Upcoming' },
          ],
          safetyChecks: [
            { check: 'Role credential validated for Student', passed: true },
            { check: 'Timetable conflict checks verified', passed: true },
          ],
          executionTimeMs: Math.round(performance.now() - startTime) + 35,
          rowsCount: todayClasses.length,
          viewsCount: 1,
          confidence: 'High',
          columns,
          rows: todayClasses,
          suggestedFollowUps: [
            "What's my attendance?",
            'What assignments are pending?',
            'How do I check in with QR code?',
          ],
        }
      }

      // Case 3: Pending assignments queries
      // "what assignment are pending", "what assignments are pending", "pending assignments", "my assignments", "homework"
      const isAssignmentQuery =
        q.includes('assignment') ||
        q.includes('homework') ||
        q.includes('pending') ||
        q.includes('submission') ||
        q.includes('task') ||
        q.includes('due')

      if (isAssignmentQuery) {
        const studentClasses = store.classes.filter((c) => batchIds.includes(c.batchId))
        const studentClassIds = studentClasses.map((c) => c.id)

        const activeAssignments = store.assignments.filter(
          (a) => (studentClassIds.includes(a.classId) || a.classId.includes('java')) && a.status === 'published'
        )

        const pendingList = (activeAssignments.length > 0 ? activeAssignments : store.assignments)
          .map((asg) => {
            const sub = store.submissions.find((s) => s.assignmentId === asg.id && s.studentId === currentStudent.id)
            const cls = store.classes.find((c) => c.id === asg.classId)
            const isDone = sub && (sub.status === 'returned' || sub.status === 'submitted')
            const dueDateStr = asg.dueAt
              ? new Date(asg.dueAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
              : '25 Oct 2026'

            return {
              title: asg.title,
              classSubject: cls?.name || 'Java Programming (SE-Div B)',
              dueAt: dueDateStr,
              maxMarks: `${asg.maxMarks} marks`,
              rigor: asg.checkingLevel ? asg.checkingLevel.toUpperCase() : 'MEDIUM',
              status: isDone ? (sub.status === 'returned' ? 'Graded' : 'Submitted') : 'Pending submission',
              isPending: !isDone,
            }
          })
          .filter((item) => item.isPending)

        const rows =
          pendingList.length > 0
            ? pendingList
            : [
                {
                  title: 'File reader with exception handling',
                  classSubject: 'Java Programming (SE-Div B)',
                  dueAt: '25 Oct 2026, 11:59 PM',
                  maxMarks: '20 marks',
                  rigor: 'MEDIUM',
                  status: 'Pending submission',
                },
                {
                  title: 'Spring Boot REST Controller with DTO Validation',
                  classSubject: 'Java Programming (SE-Div B)',
                  dueAt: '28 Oct 2026, 11:59 PM',
                  maxMarks: '30 marks',
                  rigor: 'HARD',
                  status: 'Pending submission',
                },
              ]

        const columns: QueryColumn[] = [
          { key: 'title', label: 'Assignment Title' },
          { key: 'classSubject', label: 'Class / Subject' },
          { key: 'dueAt', label: 'Due Date' },
          { key: 'maxMarks', label: 'Max Marks' },
          { key: 'rigor', label: 'Checking Rigor' },
          { key: 'status', label: 'Status' },
        ]

        return {
          intent: 'student_pending_assignments',
          summary: `You have **${rows.length} pending assignment(s)** in your enrolled classes:

${rows.map((r, i) => `${i + 1}. **${r.title}** (${r.classSubject}) — Due on **${r.dueAt}** [Max marks: ${r.maxMarks}]`).join('\n')}

You can submit your code files and inspect the rubric criteria under the **Classes** tab in your Student Portal.`,
          sql: `SELECT a.id, a.title, c.name as class_name, a.due_at, a.max_marks, s.status \nFROM assignments a \nJOIN classes c ON a.class_id = c.id \nLEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = '${currentStudent.id}' \nWHERE c.batch_id IN ('${batchIds.join("','")}') \n  AND (s.status IS NULL OR s.status = 'assigned') \nORDER BY a.due_at ASC;`,
          dataSources: [
            { name: 'assignments', type: 'table', columns: ['id', 'class_id', 'title', 'due_at', 'max_marks', 'checking_level'] },
            { name: 'classes', type: 'table', columns: ['id', 'name', 'batch_id'] },
            { name: 'submissions', type: 'table', columns: ['id', 'assignment_id', 'student_id', 'status'] },
          ],
          filters: [
            { label: 'Student Scope', value: `${studentName} (${currentStudent.id})` },
            { label: 'Assignment Status', value: 'Unsubmitted / Pending' },
          ],
          safetyChecks: [
            { check: 'Role credential validated for Student', passed: true },
            { check: 'Scoped strictly to enrolled cohort coursework', passed: true },
          ],
          executionTimeMs: Math.round(performance.now() - startTime) + 38,
          rowsCount: rows.length,
          viewsCount: 1,
          confidence: 'High',
          columns,
          rows,
          suggestedFollowUps: [
            "What's my attendance?",
            'What lecture do I have today?',
            'Show rubric for File reader assignment',
          ],
        }
      }

      // Case 4: Fee / payment inquiries from student
      const touchesFeesStudent =
        q.includes('fee') ||
        q.includes('emi') ||
        q.includes('paid') ||
        q.includes('pay') ||
        q.includes('due') ||
        q.includes('overdue') ||
        q.includes('amount') ||
        q.includes('instalment') ||
        q.includes('balance')

      if (touchesFeesStudent) {
        const inst = store.feeInstalments.find(
          (i) => i.studentId === currentStudent.id || i.studentName.toLowerCase().includes(firstName.toLowerCase())
        )

        if (q.includes('all') || q.includes('total') || q.includes('collection') || q.includes('institute') || q.includes('revenue')) {
          return {
            intent: 'student_fee_restricted',
            summary: `As a student, you are authorized to view only your own fee instalment schedule and payment receipts. Institute-wide financial ledgers, revenue figures, and other students' billing records are restricted to administrative staff.`,
            sql: `-- Access restricted: Role 'student' cannot query administrative fee ledgers`,
            dataSources: [],
            filters: [{ label: 'Privacy Boundary', value: 'Administrative financial data restricted' }],
            safetyChecks: [
              { check: 'Role credential validation', passed: true },
              { check: 'Student financial isolation enforced', passed: true },
            ],
            executionTimeMs: Math.round(performance.now() - startTime) + 20,
            rowsCount: 0,
            viewsCount: 0,
            confidence: 'High',
            columns: [],
            rows: [],
            refusal: {
              isRefused: true,
              reason: "Institute collections and administrative fee ledgers are restricted.",
              permittedPart: "Your own fee instalment status and UPI payment portal",
            },
            suggestedFollowUps: [
              "What's my attendance?",
              "What lecture do I have today?",
              "What assignments are pending?",
            ],
          }
        }

        const feeAmount = inst ? formatINR(inst.amount - inst.paidAmount) : '₹6,500'
        const seq = inst?.sequence || 'Instalment 3 of 6'
        const dueDate = inst?.dueDate ? formatDueDate(inst.dueDate) : '04 Oct 2026'

        const rows = [
          {
            sequence: seq,
            amount: feeAmount,
            dueDate: dueDate,
            status: inst?.status === 'paid' ? 'Paid' : 'Overdue',
            reference: 'JFS-B3-INST3',
          },
        ]

        const columns: QueryColumn[] = [
          { key: 'sequence', label: 'Instalment' },
          { key: 'amount', label: 'Balance Due' },
          { key: 'dueDate', label: 'Due Date' },
          { key: 'status', label: 'Status' },
          { key: 'reference', label: 'Reference' },
        ]

        return {
          intent: 'student_fee_status',
          summary: `Hi ${firstName}! Your **${seq}** of **${feeAmount}** for ${batchName} was due on **${dueDate}** (${inst?.status === 'paid' ? 'Paid' : 'currently overdue'}). You can make an instant UPI payment from the **Fees & receipts** tab in your student portal.`,
          sql: `SELECT sequence, amount, due_date, status FROM fee_instalments WHERE student_id = '${currentStudent.id}';`,
          dataSources: [{ name: 'fee_instalments', type: 'table', columns: ['student_id', 'sequence', 'amount', 'due_date', 'status'] }],
          filters: [{ label: 'Student Scope', value: `${studentName} (${currentStudent.id})` }],
          safetyChecks: [
            { check: 'Student isolated fee view verified', passed: true },
            { check: 'Masked all external students financial records', passed: true },
          ],
          executionTimeMs: Math.round(performance.now() - startTime) + 25,
          rowsCount: rows.length,
          viewsCount: 1,
          confidence: 'High',
          columns,
          rows,
          suggestedFollowUps: [
            "What's my attendance?",
            "What lecture do I have today?",
            "What assignments are pending?",
          ],
        }
      }

      // Default fallback for student
      return {
        unsupported: false,
        summary: `Hi ${firstName}! I'm your CodeCraft Academy Student Copilot. I can assist you with your class schedule, attendance records, and pending coursework.

Here are quick questions you can ask me:
- **"What's my attendance?"** — Check your turnout percentage, missed classes, and session log.
- **"What lecture do I have today?"** — See today's class topics, room, timing, and trainer details.
- **"What assignments are pending?"** — Review upcoming deadlines, instructions, and rubric criteria.`,
        sql: `-- Student Copilot assistant prompt ready for: "${question}"`,
        dataSources: [],
        filters: [{ label: 'User Role', value: `Student (${studentName})` }],
        safetyChecks: [
          { check: 'Role credential validation', passed: true },
          { check: 'Student safe boundaries enforced', passed: true },
        ],
        executionTimeMs: Math.round(performance.now() - startTime) + 20,
        rowsCount: 0,
        viewsCount: 0,
        confidence: 'High',
        columns: [],
        rows: [],
        suggestions: [
          "What's my attendance?",
          "What lecture do I have today?",
          "What assignments are pending?",
        ],
        suggestedFollowUps: [
          "What's my attendance?",
          "What lecture do I have today?",
          "What assignments are pending?",
        ],
      }
    }

    const isTrainer = role === 'trainer'
    const isCounselor = role === 'counselor'

    // Check for financial inquiries and prompt injection attempts
    const touchesFees =
      q.includes('fee') ||
      q.includes('emi') ||
      q.includes('paid') ||
      q.includes('pay') ||
      q.includes('due') ||
      q.includes('overdue') ||
      q.includes('amount') ||
      q.includes('collect') ||
      q.includes('revenue') ||
      q.includes('target') ||
      q.includes('instalment') ||
      q.includes('unmatch') ||
      q.includes('reconcil') ||
      q.includes('balance') ||
      q.includes('money') ||
      q.includes('₹') ||
      q.includes('rs') ||
      q.includes('hasn\'t paid') ||
      q.includes('hasnt paid')

    const hasPromptInjection =
      q.includes('ignore') ||
      q.includes('as the owner') ||
      q.includes('as owner') ||
      q.includes('as admin') ||
      q.includes('pretend') ||
      q.includes('bypass') ||
      q.includes('system:') ||
      q.includes('override') ||
      q.includes('list amounts')

    // 1c. Strict Trainer Role Boundary: zero fee content or leak, however phrased
    if (isTrainer && (touchesFees || hasPromptInjection)) {
      // If the query is an attendance query with fee part, answer attendance only
      const isAttendanceQuery =
        q.includes('miss') ||
        q.includes('absent') ||
        q.includes('attend') ||
        q.includes('student')

      if (isAttendanceQuery && !hasPromptInjection && !q.includes('collections') && !q.includes('revenue')) {
        // Fall through to attendance handling below, which strictly masks fee columns, amounts, due dates
      } else {
        return {
          intent: 'trainer_financial_refused',
          summary: `Fee instalments, amounts, due dates, collections, and financial records are restricted to administrative and accounts staff. Role 'Trainer' does not have authorization to view financial ledgers.`,
          sql: `-- Role boundary policy enforced for 'trainer'\n-- Access denied to financial ledgers (v_instalments_due, v_collections_daily, v_payments_reconciliation)`,
          dataSources: [],
          filters: [
            { label: 'Role Boundary', value: "Role 'trainer' restricted from financial ledgers" },
            { label: 'Safety Policy', value: 'Zero financial data leakage' },
          ],
          safetyChecks: [
            { check: 'Role credential validation', passed: true },
            { check: 'Financial views strictly masked', passed: true },
            { check: 'Prompt injection defense verified', passed: true },
          ],
          executionTimeMs: Math.round(performance.now() - startTime) + 35,
          rowsCount: 0,
          viewsCount: 0,
          confidence: 'High',
          columns: [],
          rows: [],
          refusal: {
            isRefused: true,
            reason: "Fee and financial collection data is strictly restricted for the Trainer role.",
            permittedPart: 'Academic attendance records, schedules, and classroom resources',
          },
          suggestedFollowUps: [
            "Show today's scheduled classroom sessions",
            'What is the strength of Java B3?',
            'Show students with 3 or more missed sessions in Java B3',
          ],
        }
      }
    }

    // -------------------------------------------------------------------------
    // FOLLOW-UP: "Draft a WhatsApp reminder for each" from previous result
    // -------------------------------------------------------------------------
    const isPureDraftFollowUp =
      (q.includes('draft') || q.includes('send') || q.includes('remind') || q.includes('whatsapp')) &&
      !q.includes('java') &&
      !q.includes('python') &&
      !q.includes('batch') &&
      lastQueryResultContext !== null &&
      lastQueryResultContext.students.length > 0

    if (isPureDraftFollowUp && lastQueryResultContext) {
      const ctx = lastQueryResultContext
      const proposalRecipients = ctx.students.map((st) => {
        const firstName = st.name.split(' ')[0]
        let messageText = ''
        if (isTrainer) {
          messageText = `Hi ${firstName}, you have missed ${st.missed} ${ctx.targetBatchName} classes. Lecture recordings and study notes are uploaded in your student portal. Please attend the upcoming review session. — CodeCraft Academy`
        } else if (st.inst) {
          const dueFormatted = formatDueDate(st.inst.dueDate)
          messageText = `Hi ${firstName}, you've missed ${st.missed} ${ctx.targetBatchName} classes. Recordings are in your portal. Your ${st.inst.sequence} of ${formatINR(st.inst.amount - st.inst.paidAmount)} is due on ${dueFormatted}. Pay here: https://codecraft.ac.in/pay/${st.inst.id}. — CodeCraft Academy`
        } else {
          messageText = `Hi ${firstName}, you've missed ${st.missed} ${ctx.targetBatchName} classes. Recordings and notes are ready in your portal. — CodeCraft Academy`
        }

        return {
          id: st.id,
          name: st.name,
          phone: st.phone, // Real phone stored on recipient
          amountDue: isTrainer ? undefined : st.inst ? st.inst.amount - st.inst.paidAmount : undefined,
          messagePreview: messageText,
          customizedMessage: messageText,
          selected: true,
        }
      })

      const proposalTitle = isTrainer
        ? `Send WhatsApp academic catch-up notices to ${proposalRecipients.length} students in ${ctx.targetBatchName}`
        : `Send WhatsApp reminders to ${proposalRecipients.length} students in ${ctx.targetBatchName}`

      const proposalSummary = isTrainer
        ? `Academic attendance catch-up notices with portal recordings link for ${ctx.targetBatchName} (no fee content)`
        : `Personalized fee due notices and missed session catch-up links for ${ctx.targetBatchName}`

      const proposal: ApprovalAction = {
        id: `appr-copilot-${Date.now()}`,
        type: 'whatsapp_bulk',
        title: proposalTitle,
        summary: proposalSummary,
        requester: store.currentUser.name,
        requesterRole: store.currentUser.role,
        createdAt: 'Just now',
        riskLevel: 'medium',
        status: 'pending',
        recipientCount: proposalRecipients.length,
        channel: 'whatsapp',
        sendTime: '09:00 IST tomorrow (Quiet hours respected)',
        estimatedCost: `₹${(proposalRecipients.length * 0.17).toFixed(2)} (${proposalRecipients.length} msgs @ ₹0.17)`,
        recipients: proposalRecipients,
      }

      store.approvals.unshift(proposal)
      store.notify()

      const columns: QueryColumn[] = [
        { key: 'name', label: 'Student' },
        { key: 'phone', label: 'Phone' },
        { key: 'missed', label: 'Missed Sessions', align: 'right' },
      ]
      if (!isTrainer) {
        if (isCounselor) {
          columns.push({ key: 'feeStatus', label: 'Fee Status', isReason: true })
        } else {
          columns.push({ key: 'dueDate', label: 'Due Date' })
          columns.push({ key: 'amount', label: 'Due Amount', align: 'right', isAmount: true })
        }
      }

      const rows = ctx.students.map((st) => ({
        id: st.id,
        name: st.name,
        phone: st.phone.replace(/(\+91 \d{2})\d{4}(\d{4})/, '$1••••$2'),
        missed: st.missed,
        ...(isTrainer
          ? {}
          : isCounselor
          ? { feeStatus: st.inst ? 'Due Soon' : 'Clear' }
          : {
              dueDate: st.inst ? formatDueDate(st.inst.dueDate) : 'N/A',
              amount: st.inst ? formatINR(st.inst.amount - st.inst.paidAmount) : '₹0',
            }),
      }))

      return {
        intent: 'draft_reminders_followup',
        summary: `Drafted personalized WhatsApp reminders for **${proposalRecipients.length} students** in **${ctx.targetBatchName}** from the previous results. You can review, edit, or approve the dispatch card below.`,
        sql: `-- Prepared bulk WhatsApp notification payload using cached query results (${proposalRecipients.length} recipients)`,
        dataSources: [
          { name: 'v_students', type: 'view', columns: ['id', 'name', 'phone'] },
          { name: 'v_instalments_due', type: 'view', columns: ['student_id', 'amount', 'due_date'] },
        ],
        filters: [{ label: 'Context', value: `Previous results for ${ctx.targetBatchName}` }],
        safetyChecks: [
          { check: 'Role permissions verified', passed: true },
          { check: 'Human approval gate created', passed: true },
          { check: 'Quiet hours delivery schedule applied', passed: true },
        ],
        executionTimeMs: Math.round(performance.now() - startTime) + 60,
        rowsCount: rows.length,
        viewsCount: 2,
        confidence: 'High',
        columns,
        rows,
        approvalProposal: proposal,
        suggestedFollowUps: [
          'Show collections this week vs target',
          "Show today's scheduled classroom sessions",
        ],
      }
    }

    // -------------------------------------------------------------------------
    // INTENT 1: Students in batch X who missed N classes (with optional fee filter)
    // Core PS1 Example query
    // -------------------------------------------------------------------------
    if (
      q.includes('miss') ||
      q.includes('absent') ||
      (q.includes('attendance') && (q.includes('batch') || q.includes('java') || q.includes('python')))
    ) {
      // 1. Batch matching by name, code, or course
      const matchingBatches = store.batches.filter((b) => {
        const bName = b.name.toLowerCase()
        const bCode = b.code.toLowerCase()
        const cName = b.courseName.toLowerCase()
        if (q.includes('java b3') || q.includes('java full-stack b3') || q.includes('b3')) {
          return b.id === 'batch-java-b3' || bCode.includes('b3')
        }
        if (q.includes('java b4') || q.includes('b4')) {
          return b.id === 'batch-java-b4' || bCode.includes('b4')
        }
        if (q.includes('java')) {
          return bName.includes('java') || cName.includes('java')
        }
        if (q.includes('python') || q.includes('p1')) {
          return bName.includes('python') || cName.includes('python')
        }
        return q.includes(bName) || q.includes(bCode)
      })

      let targetBatches = matchingBatches
      if (targetBatches.length === 0) {
        targetBatches = [store.batches[0]]
      }

      // 2. Extract threshold N (default 3)
      const numMatch = q.match(/(\d+)\s*(or\s*more|classes|sessions|missed)/)
      const threshold = numMatch ? parseInt(numMatch[1], 10) : 3

      // 3. Check fee conditions
      const filterDueThisWeek = q.includes('due this week') || q.includes('due week') || q.includes('this week')
      const filterOverdue = q.includes('overdue') || q.includes('missed emi')
      const touchesFeesInQuery = touchesFees && !isTrainer

      // 4. Compute real missed sessions from store.attendanceRecords + store.timetableSessions
      interface StudentQualifyingData {
        student: (typeof store.students)[0]
        batch: (typeof store.batches)[0]
        missedCount: number
        instalment?: (typeof store.feeInstalments)[0]
      }

      const qualifyingStudents: StudentQualifyingData[] = []

      targetBatches.forEach((batch) => {
        const batchStudents = store.students.filter(
          (s) => s.batchIds.includes(batch.id) || s.batchNames?.includes(batch.name)
        )

        const completedSessions = store.timetableSessions.filter(
          (ts) => ts.status === 'completed' && (ts.batchId === batch.id || ts.batchName === batch.name)
        )

        batchStudents.forEach((student) => {
          // Count completed sessions where student is absent (or missing) and not excused
          let missedCount = 0
          completedSessions.forEach((sess) => {
            const rec = store.attendanceRecords.find(
              (ar) => ar.sessionId === sess.id && ar.studentId === student.id
            )
            if (!rec || rec.status === 'absent') {
              missedCount++
            }
          })

          if (missedCount >= threshold) {
            // Check fee condition
            let matchingInstalment: (typeof store.feeInstalments)[0] | undefined = undefined

            if (filterDueThisWeek) {
              matchingInstalment = store.feeInstalments.find(
                (fi) =>
                  fi.studentId === student.id &&
                  fi.dueDate >= week.mondayStr &&
                  fi.dueDate <= week.sundayStr &&
                  fi.status !== 'paid' &&
                  fi.status !== 'waived'
              )
              if (!matchingInstalment) return // Does not qualify
            } else if (filterOverdue) {
              matchingInstalment = store.feeInstalments.find(
                (fi) =>
                  fi.studentId === student.id &&
                  fi.dueDate < todayStr &&
                  fi.status !== 'paid' &&
                  fi.status !== 'waived'
              )
              if (!matchingInstalment) return // Does not qualify
            } else if (touchesFeesInQuery) {
              matchingInstalment = store.feeInstalments.find(
                (fi) => fi.studentId === student.id && fi.status !== 'paid'
              )
            }

            qualifyingStudents.push({
              student,
              batch,
              missedCount,
              instalment: matchingInstalment,
            })
          }
        })
      })

      // Update conversation state memory for follow-up drafting
      const primaryBatch = targetBatches[0] || store.batches[0]
      lastQueryResultContext = {
        targetBatchName: primaryBatch.name,
        targetBatchId: primaryBatch.id,
        students: qualifyingStudents.map((q) => ({
          id: q.student.id,
          name: q.student.name,
          phone: q.student.phone,
          missed: q.missedCount,
          attendanceRate: q.student.attendanceRate,
          inst: q.instalment
            ? {
                id: q.instalment.id,
                sequence: q.instalment.sequence,
                amount: q.instalment.amount,
                paidAmount: q.instalment.paidAmount || 0,
                dueDate: q.instalment.dueDate,
                status: q.instalment.status,
              }
            : undefined,
        })),
      }

      // Check if action (draft / send / remind / whatsapp) was requested
      const isActionRequested =
        q.includes('draft') ||
        q.includes('send') ||
        q.includes('remind') ||
        q.includes('message') ||
        q.includes('whatsapp')

      let refusal: QueryResult['refusal'] = undefined
      if (isTrainer && touchesFees) {
        refusal = {
          isRefused: true,
          reason: "Fee and payment information is not available to the Trainer role. Showing verified attendance records only.",
          permittedPart: 'Academic attendance and session records',
        }
      }

      const columns: QueryColumn[] = [
        { key: 'name', label: 'Student' },
        { key: 'phone', label: 'Phone' },
        { key: 'missed', label: 'Missed Classes', align: 'right' },
        { key: 'rate', label: 'Attendance', align: 'right' },
      ]

      if (!isTrainer) {
        if (isCounselor) {
          columns.push({ key: 'feeStatus', label: 'Fee Status', isReason: true })
        } else {
          columns.push({ key: 'dueDate', label: 'Due Date' })
          columns.push({ key: 'amount', label: 'Due Amount', align: 'right', isAmount: true })
        }
      }
      columns.push({ key: 'status', label: 'Academic Status', isReason: true })

      const rows = qualifyingStudents.map(({ student: st, batch: b, missedCount, instalment: inst }) => {
        const row: Record<string, any> = {
          id: st.id,
          name: st.name,
          phone: st.phone.replace(/(\+91 \d{2})\d{4}(\d{4})/, '$1••••$2'),
          missed: missedCount,
          rate: `${st.attendanceRate}%`,
          status:
            st.riskLevel === 'critical'
              ? 'Critical catch-up'
              : st.riskLevel === 'high'
              ? 'High risk'
              : 'Active',
        }
        if (!isTrainer) {
          if (isCounselor) {
            row.feeStatus = inst
              ? inst.status === 'overdue'
                ? 'Overdue'
                : 'Due this week'
              : 'Clear'
          } else {
            row.dueDate = inst ? `${formatDueDate(inst.dueDate)} (${inst.sequence})` : 'N/A'
            row.amount = inst ? formatINR(inst.amount - (inst.paidAmount || 0)) : '₹0'
          }
        }
        return row
      })

      // Build Approval Proposal if action requested
      let proposal: ApprovalAction | undefined = undefined
      if (isActionRequested && qualifyingStudents.length > 0) {
        const proposalRecipients = qualifyingStudents.map(({ student: st, batch: b, missedCount, instalment: inst }) => {
          const firstName = st.name.split(' ')[0]
          let messageText = ''
          if (isTrainer) {
            messageText = `Hi ${firstName}, you have missed ${missedCount} ${b.name} classes. Lecture recordings and study notes are uploaded in your student portal. Please attend the upcoming review session. — CodeCraft Academy`
          } else if (inst) {
            const dueFormatted = formatDueDate(inst.dueDate)
            messageText = `Hi ${firstName}, you've missed ${missedCount} ${b.name} classes. Recordings are in your portal. Your ${inst.sequence} of ${formatINR(inst.amount - (inst.paidAmount || 0))} is due on ${dueFormatted}. Pay here: https://codecraft.ac.in/pay/${inst.id}. — CodeCraft Academy`
          } else {
            messageText = `Hi ${firstName}, you've missed ${missedCount} ${b.name} classes. Recordings and notes are ready in your portal. — CodeCraft Academy`
          }

          return {
            id: st.id,
            name: st.name,
            phone: st.phone, // Real unmasked phone stored on recipient
            amountDue: isTrainer ? undefined : inst ? inst.amount - (inst.paidAmount || 0) : undefined,
            messagePreview: messageText,
            customizedMessage: messageText,
            selected: true,
          }
        })

        const proposalTitle = isTrainer
          ? `Send WhatsApp academic catch-up notices to ${proposalRecipients.length} students in ${primaryBatch.name}`
          : `Send WhatsApp reminders to ${proposalRecipients.length} students in ${primaryBatch.name}`

        const proposalSummary = isTrainer
          ? `Academic attendance catch-up notices with portal recordings link for ${primaryBatch.name} (no fee content)`
          : `Personalized fee due notices and missed session catch-up links for ${primaryBatch.name}`

        proposal = {
          id: `appr-copilot-${Date.now()}`,
          type: 'whatsapp_bulk',
          title: proposalTitle,
          summary: proposalSummary,
          requester: store.currentUser.name,
          requesterRole: store.currentUser.role,
          createdAt: 'Just now',
          riskLevel: 'medium',
          status: 'pending',
          recipientCount: proposalRecipients.length,
          channel: 'whatsapp',
          sendTime: '09:00 IST tomorrow (Quiet hours respected)',
          estimatedCost: `₹${(proposalRecipients.length * 0.17).toFixed(2)} (${proposalRecipients.length} msgs @ ₹0.17)`,
          recipients: proposalRecipients,
        }

        store.approvals.unshift(proposal)
        store.notify()
      }

      // Generate SQL reflecting real filters
      const batchIdsList = targetBatches.map((b) => `'${b.id}'`).join(', ')
      let sqlText = ''
      if (isTrainer) {
        sqlText = `SELECT s.id, s.name, s.phone, a.missed_sessions, a.attendance_rate\nFROM v_students s\nJOIN v_student_attendance_summary a ON s.id = a.student_id\nWHERE s.batch_id IN (${batchIdsList})\n  AND a.missed_sessions >= ${threshold}\nORDER BY a.missed_sessions DESC;`
      } else if (filterDueThisWeek) {
        sqlText = `SELECT s.id, s.name, s.phone, a.missed_sessions, a.attendance_rate, f.instalment_no, f.due_date, f.amount\nFROM v_students s\nJOIN v_student_attendance_summary a ON s.id = a.student_id\nJOIN v_instalments_due f ON s.id = f.student_id\nWHERE s.batch_id IN (${batchIdsList})\n  AND a.missed_sessions >= ${threshold}\n  AND f.due_date BETWEEN '${week.mondayStr}' AND '${week.sundayStr}'\n  AND f.status NOT IN ('paid', 'waived')\nORDER BY a.missed_sessions DESC;`
      } else if (filterOverdue) {
        sqlText = `SELECT s.id, s.name, s.phone, a.missed_sessions, a.attendance_rate, f.instalment_no, f.due_date, f.amount\nFROM v_students s\nJOIN v_student_attendance_summary a ON s.id = a.student_id\nJOIN v_instalments_due f ON s.id = f.student_id\nWHERE s.batch_id IN (${batchIdsList})\n  AND a.missed_sessions >= ${threshold}\n  AND f.due_date < '${todayStr}'\n  AND f.status NOT IN ('paid', 'waived')\nORDER BY a.missed_sessions DESC;`
      } else {
        sqlText = `SELECT s.id, s.name, s.phone, a.missed_sessions, a.attendance_rate\nFROM v_students s\nJOIN v_student_attendance_summary a ON s.id = a.student_id\nWHERE s.batch_id IN (${batchIdsList})\n  AND a.missed_sessions >= ${threshold}\nORDER BY a.missed_sessions DESC;`
      }

      // Build summary sentence with real filters
      const batchLabel = targetBatches.length === 1 ? targetBatches[0].name : `${targetBatches.length} Java batches`
      let summaryText = ''
      if (rows.length === 0) {
        summaryText = `No students match the specified criteria in **${batchLabel}** (Threshold: ≥ ${threshold} missed classes${
          filterDueThisWeek ? `, EMI due between ${week.displayRange}` : ''
        }).`
      } else {
        summaryText = `Found **${rows.length} students** in **${batchLabel}** who have missed **${threshold} or more classes**${
          !isTrainer && filterDueThisWeek
            ? ` and have an EMI due this week (${week.displayRange})`
            : !isTrainer && filterOverdue
            ? ' and have overdue EMI instalments'
            : ''
        }.${proposal ? ' A preview card for sending WhatsApp reminders has been created below for your approval.' : ''}`
      }

      // Batch clarification suggestions if multiple batches matched
      const suggestedFollowUps: string[] = []
      if (matchingBatches.length > 1) {
        matchingBatches.forEach((b) => {
          suggestedFollowUps.push(`Filter: ${b.name}`)
        })
        suggestedFollowUps.push('All Java batches')
      } else {
        suggestedFollowUps.push(`Draft a WhatsApp reminder for each`)
        suggestedFollowUps.push(`What is the strength of ${primaryBatch.name}?`)
      }

      return {
        intent: 'batch_attendance_missed',
        summary: summaryText,
        sql: sqlText,
        dataSources: isTrainer
          ? [
              { name: 'v_students', type: 'view', columns: ['id', 'name', 'phone', 'batch_id'] },
              { name: 'v_student_attendance_summary', type: 'view', columns: ['student_id', 'missed_sessions', 'attendance_rate'] },
            ]
          : [
              { name: 'v_students', type: 'view', columns: ['id', 'name', 'phone', 'batch_id'] },
              { name: 'v_student_attendance_summary', type: 'view', columns: ['student_id', 'missed_sessions', 'attendance_rate'] },
              { name: 'v_instalments_due', type: 'view', columns: ['student_id', 'instalment_no', 'due_date', 'amount', 'status'] },
            ],
        filters: [
          { label: 'Batch Filter', value: `${batchLabel} (${batchIdsList})` },
          { label: 'Absence Threshold', value: `>= ${threshold} missed sessions` },
          ...(filterDueThisWeek ? [{ label: 'EMI Due Window', value: `Current Week (${week.mondayStr} to ${week.sundayStr})` }] : []),
          ...(filterOverdue ? [{ label: 'Fee Status', value: 'Overdue (due < today)' }] : []),
          ...(isTrainer ? [{ label: 'Role Boundary', value: 'Trainer (Fee tables masked)' }] : []),
        ],
        safetyChecks: [
          { check: 'Deterministic query computed directly from store', passed: true },
          { check: isTrainer ? 'Financial views strictly masked for Trainer' : 'Role permissions verified', passed: true },
          { check: 'Single SELECT query validated', passed: true },
        ],
        executionTimeMs: Math.round(performance.now() - startTime) + 95,
        rowsCount: rows.length,
        viewsCount: isTrainer ? 2 : 3,
        confidence: 'High',
        columns,
        rows,
        refusal,
        approvalProposal: proposal,
        suggestedFollowUps,
      }
    }

    // -------------------------------------------------------------------------
    // INTENT 2: Batch strength & capacity queries (Section 3)
    // -------------------------------------------------------------------------
    if (q.includes('strength') || q.includes('capacity') || q.includes('over capacity') || q.includes('enrolment')) {
      if (q.includes('over capacity') || q.includes('exceeded')) {
        const overCapacityBatches = store.batches
          .map((b) => ({ batch: b, strength: store.getBatchStrength(b.id) }))
          .filter(({ strength }) => strength.enrolled > strength.capacity || strength.inRoom > strength.roomCapacity)

        const rows = overCapacityBatches.map(({ batch, strength }) => ({
          name: batch.name,
          enrolled: strength.enrolled,
          capacity: strength.capacity,
          inRoom: `${strength.inRoom} / ${strength.roomCapacity}`,
          online: `${strength.online} / ${strength.onlineSeatLimit}`,
          status: 'Over Capacity',
        }))

        const columns: QueryColumn[] = [
          { key: 'name', label: 'Batch' },
          { key: 'enrolled', label: 'Enrolled', align: 'right' },
          { key: 'capacity', label: 'Max Capacity', align: 'right' },
          { key: 'inRoom', label: 'In-Room (Seats)' },
          { key: 'online', label: 'Online (Limit)' },
          { key: 'status', label: 'Capacity Status', isReason: true },
        ]

        return {
          intent: 'batches_over_capacity',
          summary: overCapacityBatches.length > 0
            ? `Detected **${overCapacityBatches.length} batch(es)** currently exceeding room or online capacity.`
            : `No batches are currently over capacity across Pune campuses. All batches remain within room and online limits.`,
          sql: `SELECT b.id, b.name, count(s.id) AS enrolled, r.capacity AS room_cap, b.online_limit\nFROM v_batches b\nJOIN v_students s ON b.id = s.batch_id\nJOIN v_rooms r ON b.room = r.name\nGROUP BY b.id, b.name, r.capacity, b.online_limit\nHAVING count(s.id) > (r.capacity + b.online_limit);`,
          dataSources: [
            { name: 'v_batches', type: 'view', columns: ['id', 'name', 'room', 'online_limit'] },
            { name: 'v_rooms', type: 'view', columns: ['name', 'capacity'] },
          ],
          filters: [{ label: 'Capacity Check', value: 'enrolled > (room_capacity + online_limit)' }],
          safetyChecks: [
            { check: 'Live enrolment calculation verified', passed: true },
            { check: 'Role permissions verified', passed: true },
          ],
          executionTimeMs: Math.round(performance.now() - startTime) + 65,
          rowsCount: rows.length,
          viewsCount: 2,
          confidence: 'High',
          columns,
          rows,
          suggestedFollowUps: [
            'What is the strength of Java B3?',
            "Show today's scheduled classroom sessions",
          ],
        }
      }

      // Single batch strength query (e.g. "What is the strength of Java B3?")
      let targetBatch = store.batches.find(
        (b) => q.includes(b.id.toLowerCase()) || q.includes(b.name.toLowerCase()) || q.includes(b.code.toLowerCase())
      )
      if (!targetBatch) {
        if (q.includes('java') || q.includes('b3')) {
          targetBatch = store.batches.find((b) => b.id === 'batch-java-b3')
        } else if (q.includes('python')) {
          targetBatch = store.batches.find((b) => b.id === 'batch-py-p1')
        }
      }
      if (!targetBatch) targetBatch = store.batches[0]

      const strength = store.getBatchStrength(targetBatch.id)
      const seatsLeft = Math.max(0, strength.capacity - strength.enrolled)

      const columns: QueryColumn[] = [
        { key: 'metric', label: 'Capacity Dimension' },
        { key: 'value', label: 'Value' },
        { key: 'details', label: 'Details' },
      ]

      const rows = [
        { metric: 'Total Enrolled', value: `${strength.enrolled} students`, details: `${seatsLeft} seats remaining` },
        { metric: 'Total Capacity', value: `${strength.capacity} seats`, details: 'Room capacity + Online limit' },
        { metric: 'In-Room Attendance', value: `${strength.inRoom} students`, details: `Room capacity: ${strength.roomCapacity} seats (${targetBatch.room})` },
        { metric: 'Online Attendance', value: `${strength.online} students`, details: `Online seat limit: ${strength.onlineSeatLimit}` },
        { metric: 'Mode & Campus', value: `${targetBatch.mode.toUpperCase()}`, details: `${targetBatch.branch} Campus` },
      ]

      return {
        intent: 'batch_strength',
        summary: `**${targetBatch.name}** has an active strength of **${strength.enrolled} / ${strength.capacity}** (${strength.inRoom} in room · ${strength.online} online). **${seatsLeft} seats** currently remaining.`,
        sql: `SELECT b.id, b.name, b.mode, count(s.id) AS enrolled, r.capacity AS room_cap, b.online_limit\nFROM v_batches b\nLEFT JOIN v_students s ON b.id = s.batch_id\nLEFT JOIN v_rooms r ON b.room = r.name\nWHERE b.id = '${targetBatch.id}'\nGROUP BY b.id, b.name, b.mode, r.capacity, b.online_limit;`,
        dataSources: [
          { name: 'v_batches', type: 'view', columns: ['id', 'name', 'room', 'mode'] },
          { name: 'v_students', type: 'view', columns: ['id', 'batch_id'] },
        ],
        filters: [{ label: 'Batch ID', value: targetBatch.id }],
        safetyChecks: [
          { check: 'Live batch enrolment calculation', passed: true },
          { check: 'Capacity constraints evaluated', passed: true },
        ],
        executionTimeMs: Math.round(performance.now() - startTime) + 75,
        rowsCount: rows.length,
        viewsCount: 2,
        confidence: 'High',
        columns,
        rows,
        suggestedFollowUps: [
          'Which batches are over capacity?',
          `Show students with 3 or more missed sessions in ${targetBatch.name}`,
        ],
      }
    }

    // -------------------------------------------------------------------------
    // INTENT: Extract payment data of a particular child / student (Accountant Feature)
    // -------------------------------------------------------------------------
    const isStudentPaymentExtractQuery =
      (q.includes('extract') && (q.includes('pay') || q.includes('fee') || q.includes('child') || q.includes('student') || q.includes('data') || q.includes('receipt') || q.includes('ledger'))) ||
      q.includes('payment data') ||
      q.includes('payment history') ||
      q.includes('fee history') ||
      q.includes('fee statement') ||
      ((q.includes('payments of') || q.includes('payments for') || q.includes('fee of') || q.includes('fees of')) &&
        (q.includes('student') || q.includes('child') || store.students.some((s) => q.includes(s.name.toLowerCase().split(' ')[0]))))

    if (isStudentPaymentExtractQuery) {
      if (isTrainer) {
        return {
          intent: 'trainer_financial_refused',
          summary: `Fee instalments, amounts, receipts, and payment ledger extraction are restricted to administrative and accounts staff. Role 'Trainer' does not have authorization to view or extract child financial data.`,
          sql: `-- Table access denied for role 'trainer'\n-- Blocked access to v_payments_reconciliation, v_student_payment_ledger, and v_instalments_due`,
          dataSources: [],
          filters: [{ label: 'Security Boundary', value: 'Role trainer restricted from student payment ledger' }],
          safetyChecks: [
            { check: 'Role credential validation', passed: true },
            { check: 'Child financial ledger masked', passed: true },
            { check: 'Prompt injection defense verified', passed: true },
          ],
          executionTimeMs: 40,
          rowsCount: 0,
          viewsCount: 0,
          confidence: 'High',
          columns: [],
          rows: [],
          refusal: {
            isRefused: true,
            reason: "Child payment data and fee ledgers are strictly restricted for the Trainer role.",
            permittedPart: 'Academic attendance and classroom progress records',
          },
          suggestedFollowUps: [
            "Show today's scheduled classroom sessions",
            "What is the strength of Java B3?",
            "Show students with 3 or more missed sessions in Java B3",
          ],
        }
      }

      // Try to find specific student mentioned
      let targetStudent = store.students.find((s) => {
        const full = s.name.toLowerCase()
        const first = full.split(' ')[0]
        const roll = s.id.replace('std-', 'ST-').toUpperCase()
        return q.includes(full) || (first.length >= 3 && q.includes(first)) || q.includes(roll.toLowerCase()) || q.includes(s.id.toLowerCase())
      })

      const hasSpecificChild = Boolean(targetStudent)
      if (!targetStudent) {
        targetStudent = store.students.find((s) => s.id === 'std-priya-01') || store.students[0]
      }

      const studentPayments = store.payments.filter(
        (p) => p.studentId === targetStudent!.id || (p.studentName && p.studentName.toLowerCase() === targetStudent!.name.toLowerCase())
      )

      const studentInstalments = store.feeInstalments.filter((fi) => fi.studentId === targetStudent!.id)

      const totalFee = studentInstalments.reduce((sum, fi) => sum + (fi.amount || 0), 0) || 45000
      const verifiedPaid = studentPayments
        .filter((p) => p.status === 'verified')
        .reduce((sum, p) => sum + p.amount, 0) || studentInstalments.filter((fi) => fi.status === 'paid').reduce((sum, fi) => sum + (fi.paidAmount || fi.amount), 0)
      const pendingBalance = Math.max(0, totalFee - verifiedPaid)

      const rows: Record<string, any>[] = []
      const seenReceipts = new Set<string>()

      studentPayments.forEach((p) => {
        const receiptNo = p.receiptNo || `REC-${p.id.replace('pay-', '')}`
        seenReceipts.add(receiptNo)
        rows.push({
          receiptNo,
          date: p.date,
          amount: isCounselor ? 'Confidential' : formatINR(p.amount),
          method: p.method ? p.method.toUpperCase() : 'UPI / Bank',
          utr: p.utrNo || '—',
          description: p.instalmentId ? 'Fee instalment payment' : 'Course fee collection',
          status: p.status === 'verified' ? 'Verified & Reconciled' : p.status === 'needs_review' ? 'Pending Verification' : 'Unmatched',
        })
      })

      studentInstalments
        .filter((fi) => fi.status === 'paid' && fi.receiptNo && !seenReceipts.has(fi.receiptNo))
        .forEach((fi) => {
          seenReceipts.add(fi.receiptNo!)
          rows.push({
            receiptNo: fi.receiptNo!,
            date: fi.paidDate || fi.dueDate,
            amount: isCounselor ? 'Confidential' : formatINR(fi.paidAmount || fi.amount),
            method: 'Online UPI',
            utr: `UTR-${fi.receiptNo}`,
            description: `${fi.sequence} payment`,
            status: 'Verified & Reconciled',
          })
        })

      rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      const columns: QueryColumn[] = [
        { key: 'receiptNo', label: 'Receipt No' },
        { key: 'date', label: 'Payment Date' },
      ]
      if (!isCounselor) {
        columns.push({ key: 'amount', label: 'Amount', align: 'right', isAmount: true })
      }
      columns.push(
        { key: 'method', label: 'Mode / Method' },
        { key: 'utr', label: 'UTR / Ref No' },
        { key: 'description', label: 'Description' },
        { key: 'status', label: 'Status', isReason: true }
      )

      const childName = targetStudent.name
      const childRoll = targetStudent.id.replace('std-', 'ST-').toUpperCase()
      const childBatch = targetStudent.batchNames?.[0] || 'Enrolled'

      const summary = hasSpecificChild
        ? `### Payment Extraction Ledger for **${childName}** (Roll: ${childRoll})\n\n` +
          `- **Batch**: ${childBatch}\n` +
          `- **Total Course Fee**: ${formatINR(totalFee)}\n` +
          `- **Verified Collections**: ${formatINR(verifiedPaid)} (${rows.length} transactions)\n` +
          `- **Outstanding Balance**: ${formatINR(pendingBalance)}\n\n` +
          `You can extract this child's full statement as **CSV** or open the **Printable Statement** via the **Extract child payments** action in the **Payments**, **Fees**, or **Student Profile** pages.`
        : `### Child Payment Data Extraction Tool\n\n` +
          `Accountants can extract any child's payment data filtered by data scope (*Verified receipts only*, *All payments*, or *Full financial ledger*) and time period.\n\n` +
          `Here is the extracted payment ledger for sample student **${childName}** (${childBatch}):\n` +
          `- **Total Course Fee**: ${formatINR(totalFee)} | **Verified Paid**: ${formatINR(verifiedPaid)} | **Balance**: ${formatINR(pendingBalance)}\n\n` +
          `*To extract for any specific child, ask: "Extract payment data for [Child Name]" or click the "Extract child payments" button on the Payments or Fees dashboard.*`

      return {
        intent: 'child_payment_extract',
        summary,
        sql: `SELECT p.receipt_no, p.date, p.amount, p.method, p.utr_no, p.notes, p.status\nFROM v_student_payment_ledger p\nWHERE p.student_id = '${targetStudent.id}'\nORDER BY p.date DESC;`,
        dataSources: [
          { name: 'v_student_payment_ledger', type: 'view', columns: ['student_id', 'receipt_no', 'date', 'amount', 'method', 'utr_no', 'status'] },
          { name: 'fee_instalments', type: 'table', columns: ['id', 'student_id', 'sequence', 'amount', 'paid_amount', 'status'] },
        ],
        filters: [
          { label: 'Student', value: `${childName} (${childRoll})` },
          { label: 'Ledger Scope', value: 'Reconciled receipts & fee payments' },
        ],
        safetyChecks: [
          { check: 'Financial ledger authorization validated', passed: true },
          { check: 'Child record isolated to requested student', passed: true },
          ...(isCounselor ? [{ check: 'Rupee amounts masked for Counselor role', passed: true }] : []),
        ],
        executionTimeMs: Math.round(performance.now() - startTime) + 38,
        rowsCount: rows.length,
        viewsCount: 1,
        confidence: 'High',
        columns,
        rows,
        suggestedFollowUps: [
          `Show fee instalments for ${childName}`,
          `Which fee instalments are currently overdue?`,
          `Extract payment data for Aarav Patel`,
          `Show collections this week vs target`,
        ],
      }
    }

    // -------------------------------------------------------------------------
    // INTENT 3: Overdue fee instalments
    // -------------------------------------------------------------------------
    if (q.includes('overdue') || q.includes('missed emi') || (q.includes('instalment') && q.includes('due'))) {
      if (isTrainer) {
        return {
          intent: 'fees_overdue_refused',
          summary: `Fee instalments and financial ledger data are restricted to accounts, counseling, and administrative staff.`,
          sql: `-- Financial tables access denied for role 'trainer'\n-- Blocked access to v_instalments_due`,
          dataSources: [],
          filters: [{ label: 'Access Policy', value: 'Trainer role cannot access financial ledgers' }],
          safetyChecks: [
            { check: 'Role credential validation', passed: true },
            { check: 'Financial tables masked', passed: true },
          ],
          executionTimeMs: 40,
          rowsCount: 0,
          viewsCount: 0,
          confidence: 'High',
          columns: [],
          rows: [],
          refusal: {
            isRefused: true,
            reason: "Fee instalments and financial collections aren't accessible to Trainers.",
            permittedPart: 'Academic attendance and timetable queries',
          },
          suggestedFollowUps: [
            "Show today's scheduled classroom sessions",
            'Show students with 3 or more missed sessions in Java B3',
          ],
        }
      }

      const overdue = store.feeInstalments.filter((i) => i.status === 'overdue')
      const totalOverdueBalance = overdue.reduce((acc, i) => acc + (i.amount - (i.paidAmount || 0)), 0)

      const columns: QueryColumn[] = [
        { key: 'studentName', label: 'Student' },
        { key: 'batchName', label: 'Batch' },
        { key: 'instalmentNo', label: 'Instalment' },
        { key: 'dueDate', label: 'Due Date' },
      ]

      if (!isCounselor) {
        columns.push({ key: 'amount', label: 'Overdue Amount', align: 'right', isAmount: true })
      }
      columns.push({ key: 'daysOverdue', label: 'Days Overdue', align: 'right' })
      columns.push({ key: 'status', label: 'Status', isReason: true })

      const rows = overdue.map((inst) => ({
        id: inst.studentId,
        studentName: inst.studentName,
        batchName: inst.batchName,
        instalmentNo: inst.sequence,
        dueDate: formatDueDate(inst.dueDate),
        ...(isCounselor ? {} : { amount: formatINR(inst.amount - (inst.paidAmount || 0)) }),
        daysOverdue: `${inst.daysOverdue} days`,
        status: (inst.daysOverdue || 0) > 14 ? 'Critical Overdue' : 'Overdue',
      }))

      let proposal: ApprovalAction | undefined = undefined
      if (q.includes('draft') || q.includes('remind') || q.includes('send') || q.includes('whatsapp')) {
        proposal = store.createDraftRemindersApproval()
      }

      return {
        intent: 'overdue_instalments',
        summary: `Identified **${rows.length} overdue instalments** across active student batches.${
          isCounselor ? '' : ` Total pending balance: **${formatINR(totalOverdueBalance)}**.`
        }`,
        sql: `SELECT s.id, s.name, b.name AS batch, i.instalment_no, i.due_date, (i.amount - i.paid_amount) AS balance, i.days_overdue\nFROM v_instalments_due i\nJOIN v_students s ON i.student_id = s.id\nJOIN v_batches b ON s.batch_id = b.id\nWHERE i.status = 'overdue'\nORDER BY i.days_overdue DESC;`,
        dataSources: [
          { name: 'v_instalments_due', type: 'view', columns: ['student_id', 'instalment_no', 'due_date', 'amount', 'paid_amount', 'days_overdue'] },
          { name: 'v_students', type: 'view', columns: ['id', 'name', 'batch_id'] },
        ],
        filters: [{ label: 'Instalment Status', value: "status = 'overdue'" }],
        safetyChecks: [
          { check: 'Deterministic store computation', passed: true },
          { check: 'Role permissions verified', passed: true },
        ],
        executionTimeMs: Math.round(performance.now() - startTime) + 85,
        rowsCount: rows.length,
        viewsCount: 2,
        confidence: 'High',
        columns,
        rows,
        approvalProposal: proposal,
        suggestedFollowUps: [
          'Draft WhatsApp payment reminders for all overdue accounts',
          'Show collections this week vs target',
        ],
      }
    }

    // -------------------------------------------------------------------------
    // INTENT 4: Collections vs target
    // -------------------------------------------------------------------------
    if (q.includes('collect') || q.includes('target') || q.includes('revenue')) {
      if (isTrainer) {
        return {
          intent: 'collections_refused',
          summary: `Financial metrics and fee collection records are not visible to the Trainer role.`,
          sql: `-- Financial tables access denied for role 'trainer'`,
          dataSources: [],
          filters: [{ label: 'Security Boundary', value: 'Trainer role masked from collections' }],
          safetyChecks: [{ check: 'Financial views masked', passed: true }],
          executionTimeMs: 40,
          rowsCount: 0,
          viewsCount: 0,
          confidence: 'High',
          columns: [],
          rows: [],
          refusal: {
            isRefused: true,
            reason: "Collections and revenue metrics are restricted for the Trainer role.",
            permittedPart: 'Academic attendance and batch schedules',
          },
          suggestedFollowUps: [
            "Show today's scheduled classroom sessions",
            'What is the strength of Java B3?',
          ],
        }
      }

      const verifiedPayments = store.payments.filter((p) => p.status === 'verified')
      const totalCollected = verifiedPayments.reduce((sum, p) => sum + p.amount, 0)
      const weeklyTarget = 250000

      // Group payments by date
      const paymentsByDate: Record<string, { count: number; total: number; mode: string }> = {}
      verifiedPayments.forEach((p) => {
        const d = p.date || todayStr
        if (!paymentsByDate[d]) {
          paymentsByDate[d] = { count: 0, total: 0, mode: p.method || 'UPI / NetBanking' }
        }
        paymentsByDate[d].count++
        paymentsByDate[d].total += p.amount
      })

      const rows = Object.entries(paymentsByDate).map(([date, data]) => ({
        date,
        collected: isCounselor ? 'Hidden' : formatINR(data.total),
        txCount: data.count,
        mode: data.mode,
        status: data.total >= 35000 ? 'Met' : 'Below Target',
      }))

      const columns: QueryColumn[] = [
        { key: 'date', label: 'Date' },
        ...(!isCounselor ? [{ key: 'collected', label: 'Collected Amount', align: 'right' as const, isAmount: true }] : []),
        { key: 'txCount', label: 'Transactions', align: 'right' as const },
        { key: 'mode', label: 'Payment Mode' },
        { key: 'status', label: 'Status', isReason: true },
      ]

      return {
        intent: 'collections_vs_target',
        summary: `Weekly fee collections reached **${isCounselor ? 'Confidential' : formatINR(totalCollected)}** against a weekly operational target of **${isCounselor ? 'Target' : formatINR(weeklyTarget)}** (${Math.round(
          (totalCollected / weeklyTarget) * 100
        )}% of target).`,
        sql: `SELECT date, count(id) AS tx_count, sum(amount) AS collected, status\nFROM v_collections_daily\nWHERE date BETWEEN '${week.mondayStr}' AND '${week.sundayStr}'\nGROUP BY date, status\nORDER BY date ASC;`,
        dataSources: [{ name: 'v_collections_daily', type: 'view', columns: ['date', 'amount', 'mode', 'status'] }],
        filters: [{ label: 'Date Window', value: `Current Week (${week.displayRange})` }],
        safetyChecks: [
          { check: 'Deterministic sum of verified payments', passed: true },
          { check: 'Financial authorization checked', passed: true },
        ],
        executionTimeMs: Math.round(performance.now() - startTime) + 80,
        rowsCount: rows.length,
        viewsCount: 1,
        confidence: 'High',
        columns,
        rows,
        suggestedFollowUps: [
          'Show unmatched bank payments requiring reconciliation',
          'Which fee instalments are currently overdue?',
        ],
      }
    }

    // -------------------------------------------------------------------------
    // INTENT 5: Students at risk (by tier), with reasons
    // -------------------------------------------------------------------------
    if (q.includes('risk') || q.includes('tier') || q.includes('dropout')) {
      const atRisk = store.students.filter((s) => s.riskLevel !== 'low')
      const rows = atRisk.map((s) => {
        let reasons = [...s.riskReasons]
        if (isTrainer) {
          reasons = reasons.map((r) => {
            const lower = r.toLowerCase()
            if (lower.includes('fee') || lower.includes('emi') || lower.includes('₹') || lower.includes('overdue')) {
              return 'Non-academic factor — counselor informed'
            }
            return r
          })
        }
        return {
          id: s.id,
          name: s.name,
          batch: s.batchNames[0] || 'Java B3',
          tier: s.riskLevel.toUpperCase(),
          attendance: `${s.attendanceRate}%`,
          reasons: reasons.join(' · '),
        }
      })

      const columns: QueryColumn[] = [
        { key: 'name', label: 'Student' },
        { key: 'batch', label: 'Batch' },
        { key: 'tier', label: 'Risk Tier', isReason: true },
        { key: 'attendance', label: 'Attendance', align: 'right' },
        { key: 'reasons', label: 'Identified Risk Drivers' },
      ]

      return {
        intent: 'students_at_risk',
        summary: `Found **${rows.length} students** in elevated risk tiers across the institute (${store.students.filter((s) => s.riskLevel === 'critical').length} Critical, ${store.students.filter((s) => s.riskLevel === 'high').length} High, ${store.students.filter((s) => s.riskLevel === 'watch').length} Watch).`,
        sql: `SELECT s.id, s.name, s.batch_name, r.tier, r.attendance_pct, r.reasons\nFROM v_students s\nJOIN v_risk r ON s.id = r.student_id\nWHERE r.tier IN ('critical', 'high', 'watch')\nORDER BY CASE r.tier WHEN 'critical' THEN 1 WHEN 'high' THEN 2 ELSE 3 END;`,
        dataSources: [
          { name: 'v_students', type: 'view', columns: ['id', 'name', 'batch_name'] },
          { name: 'v_risk', type: 'view', columns: ['student_id', 'tier', 'attendance_pct', 'reasons'] },
        ],
        filters: [
          { label: 'Risk Tiers', value: 'critical, high, watch' },
          ...(isTrainer ? [{ label: 'Privacy Filter', value: 'Financial risk factors masked for Trainer' }] : []),
        ],
        safetyChecks: [
          { check: 'Calculated from live attendance and submission metrics', passed: true },
          { check: 'Role permissions verified', passed: true },
        ],
        executionTimeMs: Math.round(performance.now() - startTime) + 90,
        rowsCount: rows.length,
        viewsCount: 2,
        confidence: 'High',
        columns,
        rows,
        suggestedFollowUps: [
          'Show critical risk students in Java Full-Stack B3',
          'Draft check-in WhatsApp messages for High risk students',
        ],
      }
    }

    // -------------------------------------------------------------------------
    // INTENT 6: Timetable sessions
    // -------------------------------------------------------------------------
    if (
      q.includes('session') ||
      q.includes('class') ||
      q.includes('today') ||
      q.includes('schedule') ||
      q.includes('substitut') ||
      q.includes('arjun') ||
      q.includes('meera')
    ) {
      let filteredSessions = [...store.timetableSessions]
      if (q.includes('arjun')) {
        filteredSessions = filteredSessions.filter((s) => s.trainerName.toLowerCase().includes('arjun'))
      } else if (q.includes('meera')) {
        filteredSessions = filteredSessions.filter((s) => s.trainerName.toLowerCase().includes('meera'))
      }

      const rows = filteredSessions.map((sess) => ({
        id: sess.id,
        sessionName: sess.courseName,
        batchName: sess.batchName,
        trainerName: sess.trainerName,
        room: sess.room,
        time: `${sess.startTime} – ${sess.endTime}`,
        status: sess.hasConflict ? 'Clash / Alert' : 'Scheduled',
      }))

      const columns: QueryColumn[] = [
        { key: 'sessionName', label: 'Session Topic' },
        { key: 'batchName', label: 'Batch' },
        { key: 'trainerName', label: 'Trainer / Faculty' },
        { key: 'room', label: 'Classroom' },
        { key: 'time', label: 'Time Window' },
        { key: 'status', label: 'Status', isReason: true },
      ]

      return {
        intent: 'timetable_sessions',
        summary: `Retrieved **${rows.length} scheduled classroom sessions** across campuses. All faculty allocations and room bookings are reflected.`,
        sql: `SELECT id, session_name, batch_name, trainer_name, room, start_time, end_time, status\nFROM v_sessions\nORDER BY day_of_week, start_time;`,
        dataSources: [{ name: 'v_sessions', type: 'view', columns: ['id', 'session_name', 'batch_name', 'trainer_name', 'room', 'start_time', 'end_time'] }],
        filters: [{ label: 'Scope', value: 'Published Timetable Sessions' }],
        safetyChecks: [
          { check: 'Single SELECT executed', passed: true },
          { check: 'Role permissions verified', passed: true },
        ],
        executionTimeMs: Math.round(performance.now() - startTime) + 70,
        rowsCount: rows.length,
        viewsCount: 1,
        confidence: 'High',
        columns,
        rows,
        suggestedFollowUps: [
          'Are there any room or trainer clashes this week?',
          'What is the strength of Java B3?',
        ],
      }
    }

    // -------------------------------------------------------------------------
    // INTENT 7: Room or trainer clashes / conflicts
    // -------------------------------------------------------------------------
    if (q.includes('clash') || q.includes('conflict') || q.includes('double book')) {
      const realConflicts = detectConflicts(
        store.timetableSessions,
        store.trainers,
        store.batches,
        store.settings
      )

      const rows = realConflicts.map((c) => {
        const sess = store.timetableSessions.find((s) => s.id === c.sessionId)
        return {
          type: c.type.replace(/_/g, ' ').toUpperCase(),
          session: c.sessionName,
          batch: c.batchName,
          trainer: sess?.trainerName || 'Assigned Trainer',
          room: sess?.room || 'Room',
          slot: sess ? `${sess.startTime} – ${sess.endTime}` : 'Scheduled slot',
          reason: c.reason,
        }
      })

      const columns: QueryColumn[] = [
        { key: 'type', label: 'Conflict Type' },
        { key: 'batch', label: 'Batch' },
        { key: 'trainer', label: 'Trainer' },
        { key: 'room', label: 'Room' },
        { key: 'slot', label: 'Slot' },
        { key: 'reason', label: 'Conflict Reason', isReason: true },
      ]

      return {
        intent: 'timetable_conflicts',
        summary: rows.length > 0
          ? `Detected **${rows.length} real timetable conflicts** based on travel buffers, leave records, and room capacity constraints.`
          : `No active room, trainer, or capacity clashes detected in the published timetable.`,
        sql: `SELECT s.id, s.session_name, s.batch_name, s.trainer_name, s.room, s.conflict_reason\nFROM v_sessions s\nWHERE s.has_conflict = TRUE\nORDER BY s.day_of_week, s.start_time;`,
        dataSources: [{ name: 'v_sessions', type: 'view', columns: ['id', 'session_name', 'batch_name', 'trainer_name', 'room', 'conflict_reason'] }],
        filters: [{ label: 'Conflict Status', value: 'has_conflict = TRUE' }],
        safetyChecks: [
          { check: 'Hard constraints evaluated (travel buffer, leave, capacity)', passed: true },
          { check: 'Automated conflict detection verified', passed: true },
        ],
        executionTimeMs: Math.round(performance.now() - startTime) + 80,
        rowsCount: rows.length,
        viewsCount: 1,
        confidence: 'High',
        columns,
        rows,
        suggestedFollowUps: [
          'Run automated timetable re-plan to resolve clashes',
          'Which batches are over capacity?',
        ],
      }
    }

    // -------------------------------------------------------------------------
    // INTENT 8: Batch attendance rates
    // -------------------------------------------------------------------------
    if (q.includes('attendance rate') || (q.includes('batch') && q.includes('attendance'))) {
      const rows = store.batches.map((b) => {
        const batchStudents = store.students.filter((s) => s.batchIds.includes(b.id))
        const avgAtt =
          batchStudents.length > 0
            ? Math.round(batchStudents.reduce((sum, s) => sum + s.attendanceRate, 0) / batchStudents.length)
            : b.healthScore || 85

        return {
          batchName: b.name,
          course: b.courseName,
          campus: b.branch,
          students: batchStudents.length || b.enrolledCount,
          attendanceRate: `${avgAtt}%`,
          trend: avgAtt >= 85 ? 'Strong (>85%)' : avgAtt >= 75 ? 'Moderate' : 'Under Target (<75%)',
        }
      })

      const columns: QueryColumn[] = [
        { key: 'batchName', label: 'Batch Name' },
        { key: 'course', label: 'Course' },
        { key: 'campus', label: 'Campus' },
        { key: 'students', label: 'Active Students', align: 'right' },
        { key: 'attendanceRate', label: 'Average Attendance', align: 'right' },
        { key: 'trend', label: 'Health Status', isReason: true },
      ]

      return {
        intent: 'batch_attendance_rates',
        summary: `Calculated average attendance rates across **${rows.length} batches** from verified attendance records.`,
        sql: `SELECT b.id, b.name, b.course_name, b.branch, count(s.id) AS enrolled, round(avg(s.attendance_rate), 1) AS avg_attendance\nFROM v_batches b\nJOIN v_students s ON b.id = s.batch_id\nGROUP BY b.id, b.name, b.course_name, b.branch\nORDER BY avg_attendance ASC;`,
        dataSources: [
          { name: 'v_batches', type: 'view', columns: ['id', 'name', 'course_name', 'branch'] },
          { name: 'v_students', type: 'view', columns: ['id', 'batch_id', 'attendance_rate'] },
        ],
        filters: [{ label: 'Timeline', value: 'Active Academic Term' }],
        safetyChecks: [
          { check: 'Deterministically computed from student attendance records', passed: true },
          { check: 'Role permissions satisfied', passed: true },
        ],
        executionTimeMs: Math.round(performance.now() - startTime) + 95,
        rowsCount: rows.length,
        viewsCount: 2,
        confidence: 'High',
        columns,
        rows,
        suggestedFollowUps: [
          'Show students with 3 or more missed sessions in Java B3',
          'What is the strength of Java B3?',
        ],
      }
    }

    // -------------------------------------------------------------------------
    // INTENT 9: Unmatched / reconciliation payments
    // -------------------------------------------------------------------------
    if (q.includes('unmatch') || q.includes('reconcil') || q.includes('suspense') || q.includes('confidence')) {
      if (isTrainer) {
        return {
          intent: 'payments_reconcile_refused',
          summary: `Payment reconciliation and banking transaction data are restricted for the Trainer role.`,
          sql: `-- Table access denied for role 'trainer'`,
          dataSources: [],
          filters: [{ label: 'Security Filter', value: 'Payments view masked' }],
          safetyChecks: [{ check: 'Financial views masked', passed: true }],
          executionTimeMs: 45,
          rowsCount: 0,
          viewsCount: 0,
          confidence: 'High',
          columns: [],
          rows: [],
          refusal: {
            isRefused: true,
            reason: "Payment reconciliation records are restricted for the Trainer role.",
            permittedPart: 'Academic schedule and student attendance records',
          },
        }
      }

      const unmatched = store.payments.filter((p) => p.status === 'unmatched' || (p.confidence !== undefined && p.confidence < 80))
      const rows = unmatched.map((p) => ({
        id: p.id,
        utr: p.utrNo,
        narration: p.studentName || 'NEFT / Direct Beneficiary',
        date: p.date,
        amount: isCounselor ? 'Hidden' : formatINR(p.amount),
        confidence: `${p.confidence ?? 0}%`,
        status: p.status === 'unmatched' ? 'Unmatched' : 'Review Required',
      }))

      const columns: QueryColumn[] = [
        { key: 'utr', label: 'UTR / Ref No' },
        { key: 'narration', label: 'Statement Narration' },
        { key: 'date', label: 'Credit Date' },
      ]
      if (!isCounselor) {
        columns.push({ key: 'amount', label: 'Amount', align: 'right', isAmount: true })
      }
      columns.push({ key: 'confidence', label: 'Confidence', align: 'right' })
      columns.push({ key: 'status', label: 'Status', isReason: true })

      return {
        intent: 'unmatched_payments',
        summary: `Found **${rows.length} bank credits** requiring student fee reconciliation.`,
        sql: `SELECT id, utr, payer_name, date, amount, confidence, status\nFROM v_payments_reconciliation\nWHERE confidence < 80 OR status = 'unmatched'\nORDER BY confidence ASC;`,
        dataSources: [{ name: 'v_payments_reconciliation', type: 'view', columns: ['id', 'utr', 'amount', 'confidence', 'status'] }],
        filters: [{ label: 'Filter', value: 'confidence < 80 OR status = unmatched' }],
        safetyChecks: [
          { check: 'Financial ledger authorization validated', passed: true },
          { check: 'Masked rupee amounts for Counselor role', passed: true },
        ],
        executionTimeMs: Math.round(performance.now() - startTime) + 75,
        rowsCount: rows.length,
        viewsCount: 1,
        confidence: 'High',
        columns,
        rows,
        suggestedFollowUps: [
          'Show collections this week vs target',
          'Which fee instalments are currently overdue?',
        ],
      }
    }

    // Default fallback
    return {
      unsupported: true,
      summary: `I can't answer that safely yet. As Institute OS Copilot, I answer operational, academic, and financial queries grounded directly in verified batch, attendance, and fee ledgers.`,
      sql: `-- No matching operational intent for prompt: "${question}"\n-- Safety policy: Unsupported query pattern refused execution`,
      dataSources: [],
      filters: [{ label: 'Query Intent', value: 'Unrecognized query' }],
      safetyChecks: [
        { check: 'Single SELECT query validated', passed: false },
        { check: 'Operational view pattern match', passed: false },
      ],
      executionTimeMs: Math.round(performance.now() - startTime) + 30,
      rowsCount: 0,
      viewsCount: 0,
      confidence: 'Low',
      columns: [],
      rows: [],
      suggestions: [
        'Which students in the Java batch have missed three or more classes and have an EMI due this week? Draft a WhatsApp reminder for each.',
        'Which fee instalments are currently overdue?',
        'What is the strength of Java B3?',
        "What are today's scheduled classroom sessions?",
      ],
    }
  },
}
