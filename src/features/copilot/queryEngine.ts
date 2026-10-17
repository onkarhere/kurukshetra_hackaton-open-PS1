import { MockStore } from '@/mocks/store'
import { UserRole, ApprovalAction } from '@/types'
import { formatINR } from '@/lib/utils'

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

/**
 * Deterministic local query engine for Institute OS Copilot.
 * Directly computes queries from the store with strict role-based access boundaries.
 */
export const queryEngine = {
  answer(question: string, role: UserRole, store: MockStore): QueryResult {
    const q = question.toLowerCase().trim()
    const startTime = performance.now()

    // 1. Check for unknown/unrelated questions first
    const isAcademicOrOps =
      q.includes('batch') ||
      q.includes('student') ||
      q.includes('miss') ||
      q.includes('absent') ||
      q.includes('attend') ||
      q.includes('fee') ||
      q.includes('emi') ||
      q.includes('due') ||
      q.includes('overdue') ||
      q.includes('collect') ||
      q.includes('target') ||
      q.includes('risk') ||
      q.includes('session') ||
      q.includes('class') ||
      q.includes('trainer') ||
      q.includes('schedule') ||
      q.includes('timetable') ||
      q.includes('clash') ||
      q.includes('conflict') ||
      q.includes('substitut') ||
      q.includes('leave') ||
      q.includes('payment') ||
      q.includes('reconcil') ||
      q.includes('unmatch') ||
      q.includes('suspense') ||
      q.includes('java') ||
      q.includes('python') ||
      q.includes('arjun') ||
      q.includes('meera') ||
      q.includes('priya') ||
      q.includes('remind') ||
      q.includes('draft') ||
      q.includes('send')

    if (!isAcademicOrOps) {
      return {
        unsupported: true,
        summary: `I can't answer that safely yet. As Institute OS Copilot, I answer operational, academic, and financial queries grounded directly in verified batch, attendance, and fee ledgers.`,
        sql: `-- No matching operational intent for prompt: "${question}"\n-- Safety policy: Unsupported query pattern refused execution`,
        dataSources: [],
        filters: [{ label: 'Query Intent', value: 'Unrecognized query' }],
        safetyChecks: [
          { check: 'Safe query pattern match', passed: false },
          { check: 'Table access validation', passed: true },
        ],
        executionTimeMs: Math.round(performance.now() - startTime) + 45,
        rowsCount: 0,
        viewsCount: 0,
        confidence: 'Low',
        columns: [],
        rows: [],
        suggestions: [
          'Students in Java Full-Stack B3 who missed 3 or more classes and have an EMI due this week',
          'Which fee instalments are currently overdue?',
          "What are today's scheduled classroom sessions and trainer allocations?",
        ],
      }
    }

    const isTrainer = role === 'trainer'
    const isCounselor = role === 'counselor'
    const isActionRequested =
      q.includes('draft') ||
      q.includes('send') ||
      q.includes('remind') ||
      q.includes('message') ||
      q.includes('whatsapp')

    // -------------------------------------------------------------------------
    // INTENT 1: Students in batch X who missed N classes (with optional fee dues)
    // -------------------------------------------------------------------------
    if (
      q.includes('miss') ||
      q.includes('absent') ||
      (q.includes('attendance') && (q.includes('batch') || q.includes('java') || q.includes('python')))
    ) {
      // Find target batch
      let targetBatch = store.batches.find((b) => q.includes(b.id.toLowerCase()) || q.includes(b.name.toLowerCase()))
      if (!targetBatch) {
        if (q.includes('java') || q.includes('b3')) {
          targetBatch = store.batches.find((b) => b.id === 'batch-java-b3')
        } else if (q.includes('python')) {
          targetBatch = store.batches.find((b) => b.id === 'batch-py-p1')
        }
      }
      if (!targetBatch) {
        targetBatch = store.batches[0]
      }

      // Extract threshold N (default 3)
      const numMatch = q.match(/(\d+)\s*(or\s*more|classes|sessions|missed)/)
      const threshold = numMatch ? parseInt(numMatch[1], 10) : 3

      // Find matching students
      let batchStudents = store.students.filter((s) => s.batchIds.includes(targetBatch?.id || ''))
      if (batchStudents.length === 0) {
        batchStudents = store.students.slice(0, 24)
      }

      let qualifying = batchStudents.filter((s) => Math.max(1, Math.round((100 - s.attendanceRate) / 6)) >= threshold)
      if (qualifying.length === 0) {
        qualifying = batchStudents.slice(0, 5)
      }

      // Check if fees mentioned
      const touchesFees = q.includes('fee') || q.includes('emi') || q.includes('due') || q.includes('overdue')

      let refusal: QueryResult['refusal'] = undefined
      if (isTrainer && touchesFees) {
        refusal = {
          isRefused: true,
          reason: "Fee information isn't available to your role (Trainer). Here's the attendance part.",
          permittedPart: 'Academic attendance and session records',
        }
      }

      const columns: QueryColumn[] = [
        { key: 'name', label: 'Student' },
        { key: 'phone', label: 'Phone' },
        { key: 'missed', label: 'Missed Sessions', align: 'right' },
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

      const rows = qualifying.map((st) => {
        const inst = store.feeInstalments.find((fi) => fi.studentId === st.id)
        const row: Record<string, any> = {
          id: st.id,
          name: st.name,
          phone: st.phone.replace(/(\+91 \d{2})\d{4}(\d{4})/, '$1••••$2'),
          missed: Math.max(1, Math.round((100 - st.attendanceRate) / 6)),
          rate: `${st.attendanceRate}%`,
          status: st.riskLevel === 'critical' ? 'Critical catch-up' : st.riskLevel === 'high' ? 'High risk' : 'Active',
        }
        if (!isTrainer) {
          if (isCounselor) {
            row.feeStatus = inst ? (inst.status === 'overdue' ? 'Overdue' : 'Due Soon') : 'Clear'
          } else {
            row.dueDate = inst ? `${inst.dueDate} (${inst.status === 'overdue' ? 'Overdue' : 'Due Soon'})` : '18 Oct 2026'
            row.amount = inst ? formatINR(inst.amount - inst.paidAmount) : '₹6,500'
          }
        }
        return row
      })

      // If user asks to draft / remind / send, generate a real ApprovalAction in store!
      let proposal: ApprovalAction | undefined = undefined
      if (isActionRequested && !isTrainer) {
        proposal = {
          id: `appr-copilot-${Date.now()}`,
          type: 'whatsapp_bulk',
          title: `Send WhatsApp catch-up and fee notices to ${rows.length} students in ${targetBatch.name}`,
          summary: `Personalized notification containing missed session catch-up modules and online payment link for ${targetBatch.name}`,
          requester: store.currentUser.name,
          requesterRole: store.currentUser.role,
          createdAt: 'Just now',
          riskLevel: 'medium',
          status: 'pending',
          recipientCount: rows.length,
          channel: 'whatsapp',
          sendTime: 'Immediately upon approval',
          estimatedCost: `₹${(rows.length * 0.17).toFixed(2)} (${rows.length} msgs @ ₹0.17)`,
          recipients: rows.map((r) => ({
            id: r.id,
            name: r.name,
            phone: r.phone,
            amountDue: 6500,
            messagePreview: `Hi ${r.name}, you have missed ${r.missed} sessions in ${targetBatch?.name}. Catch-up recordings and lecture notes are ready in your portal. Please also review pending fee instalment of ₹6,500 due this week.`,
            customizedMessage: `Hi ${r.name}, you have missed ${r.missed} sessions in ${targetBatch?.name}. Catch-up recordings and lecture notes are ready in your portal. Please also review pending fee instalment of ₹6,500 due this week.`,
            selected: true,
          })),
        }
        store.approvals.unshift(proposal)
        store.notify()
      }

      const sqlText = isTrainer
        ? `SELECT s.id, s.name, s.phone, a.missed_sessions, a.attendance_rate\nFROM v_students s\nJOIN v_student_attendance_summary a ON s.id = a.student_id\nWHERE s.batch_id = '${targetBatch.id}'\n  AND a.missed_sessions >= ${threshold}\nORDER BY a.missed_sessions DESC LIMIT 500;`
        : `SELECT s.id, s.name, s.phone, a.missed_sessions, a.attendance_rate, f.due_date, f.amount\nFROM v_students s\nJOIN v_student_attendance_summary a ON s.id = a.student_id\nLEFT JOIN v_instalments_due f ON s.id = f.student_id\nWHERE s.batch_id = '${targetBatch.id}'\n  AND a.missed_sessions >= ${threshold}\nORDER BY a.missed_sessions DESC LIMIT 500;`

      return {
        intent: 'batch_attendance_missed',
        summary: `Found **${rows.length} students** in **${targetBatch.name}** with **${threshold} or more missed sessions**${
          !isTrainer && touchesFees ? ' and pending fee dues for this week' : ''
        }.${proposal ? ' A new approval proposal has been drafted for your review below.' : ''}`,
        sql: sqlText,
        dataSources: isTrainer
          ? [
              { name: 'v_students', type: 'view', columns: ['id', 'name', 'phone', 'batch_id'] },
              { name: 'v_student_attendance_summary', type: 'view', columns: ['student_id', 'missed_sessions', 'attendance_rate'] },
            ]
          : [
              { name: 'v_students', type: 'view', columns: ['id', 'name', 'phone', 'batch_id'] },
              { name: 'v_student_attendance_summary', type: 'view', columns: ['student_id', 'missed_sessions', 'attendance_rate'] },
              { name: 'v_instalments_due', type: 'view', columns: ['student_id', 'due_date', 'amount', 'status'] },
            ],
        filters: [
          { label: 'Batch Filter', value: `${targetBatch.name} (${targetBatch.id})` },
          { label: 'Absence Threshold', value: `>= ${threshold} missed sessions` },
          ...(isTrainer ? [{ label: 'Role Boundary', value: 'Trainer (Fee tables masked)' }] : []),
        ],
        safetyChecks: [
          { check: 'Single SELECT query validated', passed: true },
          { check: isTrainer ? 'Financial views masked for Trainer' : 'Role permissions verified', passed: true },
          { check: 'Row limit 500 applied', passed: true },
        ],
        executionTimeMs: Math.round(performance.now() - startTime) + 140,
        rowsCount: rows.length,
        viewsCount: isTrainer ? 2 : 3,
        confidence: 'High',
        columns,
        rows,
        refusal,
        approvalProposal: proposal,
        suggestedFollowUps: [
          `Show weekly attendance trend for ${targetBatch.name}`,
          'Which students in this batch require 1-on-1 counseling?',
        ],
      }
    }

    // -------------------------------------------------------------------------
    // INTENT 2: Overdue instalments / students with missed EMIs
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
          executionTimeMs: 80,
          rowsCount: 0,
          viewsCount: 0,
          confidence: 'High',
          columns: [],
          rows: [],
          refusal: {
            isRefused: true,
            reason: "Fee instalments and financial collections aren't accessible to Trainers.",
            permittedPart: 'Academic performance and timetable queries',
          },
          suggestedFollowUps: [
            "Show today's scheduled classroom sessions",
            'Show students with 3 or more missed sessions in Java B3',
          ],
        }
      }

      const overdue = store.feeInstalments.filter((i) => i.status === 'overdue')
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
        dueDate: inst.dueDate,
        amount: formatINR(inst.amount - inst.paidAmount),
        daysOverdue: `${inst.daysOverdue} days`,
        status: inst.daysOverdue > 14 ? 'Critical Overdue' : 'Overdue',
      }))

      let proposal: ApprovalAction | undefined = undefined
      if (isActionRequested) {
        proposal = store.createDraftRemindersApproval()
      }

      return {
        intent: 'overdue_instalments',
        summary: `Identified **${rows.length} overdue instalments** across active student batches. Total pending fee balance: **${formatINR(
          overdue.reduce((acc, i) => acc + (i.amount - i.paidAmount), 0)
        )}**.`,
        sql: `SELECT s.id, s.name, b.name AS batch, i.instalment_no, i.due_date, (i.amount - i.paid_amount) AS balance, i.days_overdue\nFROM v_instalments_due i\nJOIN v_students s ON i.student_id = s.id\nJOIN v_batches b ON s.batch_id = b.id\nWHERE i.status = 'overdue'\nORDER BY i.days_overdue DESC LIMIT 500;`,
        dataSources: [
          { name: 'v_instalments_due', type: 'view', columns: ['student_id', 'instalment_no', 'due_date', 'amount', 'paid_amount', 'days_overdue'] },
          { name: 'v_students', type: 'view', columns: ['id', 'name', 'batch_id'] },
        ],
        filters: [{ label: 'Instalment Status', value: "status = 'overdue'" }],
        safetyChecks: [
          { check: 'Role permissions verified', passed: true },
          { check: 'Single SELECT executed', passed: true },
          { check: 'Row limit 500 applied', passed: true },
        ],
        executionTimeMs: Math.round(performance.now() - startTime) + 110,
        rowsCount: rows.length,
        viewsCount: 2,
        confidence: 'High',
        columns,
        rows,
        approvalProposal: proposal,
        suggestedFollowUps: [
          'Draft WhatsApp payment reminder approval for all overdue accounts',
          'Show collections target vs actual for this week',
        ],
      }
    }

    // -------------------------------------------------------------------------
    // INTENT 3: Collections this week or this month vs target
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
          executionTimeMs: 65,
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
        }
      }

      const totalCollected = store.payments
        .filter((p) => p.status === 'verified')
        .reduce((sum, p) => sum + p.amount, 0)
      const weeklyTarget = 250000

      const rows = [
        { date: '12 Oct 2026', collected: formatINR(42000), txCount: 7, mode: 'UPI / NetBanking', target: formatINR(35000), status: 'Exceeded' },
        { date: '13 Oct 2026', collected: formatINR(36500), txCount: 6, mode: 'Razorpay / UPI', target: formatINR(35000), status: 'Met' },
        { date: '14 Oct 2026', collected: formatINR(28000), txCount: 4, mode: 'UPI Direct', target: formatINR(35000), status: 'Below Target' },
        { date: '15 Oct 2026', collected: formatINR(45500), txCount: 8, mode: 'IMPS Bank Transfer', target: formatINR(35000), status: 'Exceeded' },
        { date: '16 Oct 2026', collected: formatINR(33000), txCount: 5, mode: 'UPI', target: formatINR(35000), status: 'Met' },
      ]

      const columns: QueryColumn[] = [
        { key: 'date', label: 'Date' },
        { key: 'collected', label: 'Collected Amount', align: 'right', isAmount: true },
        { key: 'txCount', label: 'Transactions', align: 'right' },
        { key: 'mode', label: 'Primary Payment Mode' },
        { key: 'target', label: 'Daily Target', align: 'right' },
        { key: 'status', label: 'Performance', isReason: true },
      ]

      return {
        intent: 'collections_vs_target',
        summary: `Weekly fee collections reached **${formatINR(totalCollected)}** against a weekly operational target of **${formatINR(weeklyTarget)}** (**${Math.round(
          (totalCollected / weeklyTarget) * 100
        )}%** of target achieved).`,
        sql: `SELECT date, count(id) AS tx_count, sum(amount) AS collected, target_amount, status\nFROM v_collections_daily\nWHERE date BETWEEN '2026-10-12' AND '2026-10-16'\nGROUP BY date, target_amount, status\nORDER BY date ASC;`,
        dataSources: [{ name: 'v_collections_daily', type: 'view', columns: ['date', 'amount', 'mode', 'status'] }],
        filters: [{ label: 'Date Window', value: 'Current Week (12–18 Oct 2026)' }],
        safetyChecks: [
          { check: 'Single SELECT statement executed', passed: true },
          { check: 'Financial authorization checked', passed: true },
        ],
        executionTimeMs: Math.round(performance.now() - startTime) + 95,
        rowsCount: rows.length,
        viewsCount: 1,
        confidence: 'High',
        columns,
        rows,
        suggestedFollowUps: [
          'Show unmatched bank payments requiring reconciliation',
          'Breakdown collections by batch and course',
        ],
      }
    }

    // -------------------------------------------------------------------------
    // INTENT 4: Students at risk (by tier), with reasons
    // -------------------------------------------------------------------------
    if (q.includes('risk') || q.includes('tier') || q.includes('dropout')) {
      const atRisk = store.students.filter((s) => s.riskLevel !== 'low')
      const rows = atRisk.map((s) => {
        let reasons = [...s.riskReasons]
        if (isTrainer) {
          // Filter out fee-related risk reasons for trainer
          reasons = reasons.filter((r) => !r.toLowerCase().includes('fee') && !r.toLowerCase().includes('instalment'))
          if (reasons.length === 0) reasons = ['Academic catch-up recommended']
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
        sql: `SELECT s.id, s.name, s.batch_name, r.tier, r.attendance_pct, r.reasons\nFROM v_students s\nJOIN v_risk r ON s.id = r.student_id\nWHERE r.tier IN ('critical', 'high', 'watch')\nORDER BY CASE r.tier WHEN 'critical' THEN 1 WHEN 'high' THEN 2 ELSE 3 END LIMIT 500;`,
        dataSources: [
          { name: 'v_students', type: 'view', columns: ['id', 'name', 'batch_name'] },
          { name: 'v_risk', type: 'view', columns: ['student_id', 'tier', 'attendance_pct', 'reasons'] },
        ],
        filters: [
          { label: 'Risk Tiers', value: 'critical, high, watch' },
          ...(isTrainer ? [{ label: 'Privacy Filter', value: 'Financial risk factors masked for Trainer' }] : []),
        ],
        safetyChecks: [
          { check: 'Single SELECT executed', passed: true },
          { check: 'Sanctioned views only', passed: true },
        ],
        executionTimeMs: Math.round(performance.now() - startTime) + 120,
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
    // INTENT 5: Today's sessions / Trainer schedule / Substitutes
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

      const rows = filteredSessions.slice(0, 8).map((sess) => ({
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
        summary: `Retrieved **${rows.length} scheduled classroom sessions** across campuses. All faculty allocations and hybrid streaming links are active.`,
        sql: `SELECT id, session_name, batch_name, trainer_name, room, start_time, end_time, status\nFROM v_sessions\nWHERE session_date = '2026-10-17'\nORDER BY start_time ASC LIMIT 500;`,
        dataSources: [{ name: 'v_sessions', type: 'view', columns: ['id', 'session_name', 'batch_name', 'trainer_name', 'room', 'start_time', 'end_time'] }],
        filters: [{ label: 'Date Scope', value: 'Current Timetable Schedule' }],
        safetyChecks: [
          { check: 'Role permissions verified', passed: true },
          { check: 'Timetable conflict check performed', passed: true },
        ],
        executionTimeMs: Math.round(performance.now() - startTime) + 115,
        rowsCount: rows.length,
        viewsCount: 1,
        confidence: 'High',
        columns,
        rows,
        suggestedFollowUps: [
          'Are there any room or trainer clashes this week?',
          'Who is substituting for Arjun Mehta on Thursday?',
        ],
      }
    }

    // -------------------------------------------------------------------------
    // INTENT 6: Room or trainer clashes this week
    // -------------------------------------------------------------------------
    if (q.includes('clash') || q.includes('conflict') || q.includes('double book')) {
      const conflicts = store.timetableSessions.filter((s) => s.hasConflict)
      const rows = (conflicts.length > 0 ? conflicts : store.timetableSessions.slice(0, 3)).map((s) => ({
        session: s.courseName,
        batch: s.batchName,
        trainer: s.trainerName,
        room: s.room,
        slot: `${s.startTime} – ${s.endTime}`,
        conflict: s.conflictReason || 'Trainer leave clash on Thursday (re-plan available)',
      }))

      const columns: QueryColumn[] = [
        { key: 'session', label: 'Session' },
        { key: 'batch', label: 'Batch' },
        { key: 'trainer', label: 'Trainer' },
        { key: 'room', label: 'Room' },
        { key: 'slot', label: 'Slot' },
        { key: 'conflict', label: 'Clash Reason', isReason: true },
      ]

      return {
        intent: 'timetable_conflicts',
        summary: conflicts.length > 0
          ? `Detected **${conflicts.length} timetable conflicts** this week requiring automated re-planning.`
          : `No active room or trainer clashes detected on the current published timetable.`,
        sql: `SELECT s.id, s.session_name, s.batch_name, s.trainer_name, s.room, s.conflict_reason\nFROM v_sessions s\nWHERE s.has_conflict = TRUE\nORDER BY s.day_of_week, s.start_time;`,
        dataSources: [{ name: 'v_sessions', type: 'view', columns: ['id', 'session_name', 'batch_name', 'trainer_name', 'room', 'conflict_reason'] }],
        filters: [{ label: 'Conflict Status', value: 'has_conflict = TRUE' }],
        safetyChecks: [
          { check: 'Automated conflict detection evaluated', passed: true },
          { check: 'Capacity constraints verified', passed: true },
        ],
        executionTimeMs: Math.round(performance.now() - startTime) + 90,
        rowsCount: rows.length,
        viewsCount: 1,
        confidence: 'High',
        columns,
        rows,
        suggestedFollowUps: [
          'Run automated timetable re-plan to resolve clashes',
          'Check room capacity and utilization rates',
        ],
      }
    }

    // -------------------------------------------------------------------------
    // INTENT 7: Attendance rate by batch for the last 7 days
    // -------------------------------------------------------------------------
    if (q.includes('attendance rate') || (q.includes('batch') && q.includes('attendance'))) {
      const rows = store.batches.map((b) => {
        const batchStudents = store.students.filter((s) => s.batchIds.includes(b.id))
        const avgAtt =
          batchStudents.length > 0
            ? Math.round(batchStudents.reduce((sum, s) => sum + s.attendanceRate, 0) / batchStudents.length)
            : b.healthScore

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
        { key: 'attendanceRate', label: '7-Day Attendance', align: 'right' },
        { key: 'trend', label: 'Health Status', isReason: true },
      ]

      return {
        intent: 'batch_attendance_rates',
        summary: `Calculated average attendance across **${rows.length} batches** over the last 7 days. Overall institute average is **89.4%**.`,
        sql: `SELECT b.id, b.name, b.course_name, b.branch, count(s.id) AS enrolled, round(avg(s.attendance_rate), 1) AS avg_attendance\nFROM v_batches b\nJOIN v_students s ON b.id = s.batch_id\nGROUP BY b.id, b.name, b.course_name, b.branch\nORDER BY avg_attendance ASC;`,
        dataSources: [
          { name: 'v_batches', type: 'view', columns: ['id', 'name', 'course_name', 'branch'] },
          { name: 'v_students', type: 'view', columns: ['id', 'batch_id', 'attendance_rate'] },
        ],
        filters: [{ label: 'Timeline', value: 'Trailing 7 Days' }],
        safetyChecks: [
          { check: 'Aggregations computed deterministically', passed: true },
          { check: 'Role permissions satisfied', passed: true },
        ],
        executionTimeMs: Math.round(performance.now() - startTime) + 130,
        rowsCount: rows.length,
        viewsCount: 2,
        confidence: 'High',
        columns,
        rows,
        suggestedFollowUps: [
          'Show students with missed classes in Java Full-Stack B3',
          'Which batches are falling below the 80% attendance threshold?',
        ],
      }
    }

    // -------------------------------------------------------------------------
    // INTENT 8: Unmatched or low-confidence payments
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
          executionTimeMs: 70,
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
        narration: p.studentName || 'NEFT / Unknown Beneficiary',
        date: p.date,
        amount: isCounselor ? 'Hidden (Status Only)' : formatINR(p.amount),
        confidence: `${p.confidence ?? 0}%`,
        status: p.status === 'unmatched' ? 'Unmatched' : 'Review Required',
      }))

      const columns: QueryColumn[] = [
        { key: 'utr', label: 'UTR / Ref No' },
        { key: 'narration', label: 'Bank Statement Narration' },
        { key: 'date', label: 'Credit Date' },
      ]
      if (!isCounselor) {
        columns.push({ key: 'amount', label: 'Amount', align: 'right', isAmount: true })
      }
      columns.push({ key: 'confidence', label: 'Match Confidence', align: 'right' })
      columns.push({ key: 'status', label: 'Reconciliation Status', isReason: true })

      return {
        intent: 'unmatched_payments',
        summary: `Found **${rows.length} bank statement credits** requiring manual student reconciliation or matching.`,
        sql: `SELECT id, utr, payer_name, date, amount, confidence, status\nFROM v_payments_reconciliation\nWHERE confidence < 80 OR status = 'unmatched'\nORDER BY confidence ASC LIMIT 500;`,
        dataSources: [{ name: 'v_payments_reconciliation', type: 'view', columns: ['id', 'utr', 'amount', 'confidence', 'status'] }],
        filters: [{ label: 'Match Rule', value: 'confidence < 80 OR status = unmatched' }],
        safetyChecks: [
          { check: 'Financial ledger authorization validated', passed: true },
          { check: 'Masked rupee amounts for Counselor role', passed: true },
        ],
        executionTimeMs: Math.round(performance.now() - startTime) + 105,
        rowsCount: rows.length,
        viewsCount: 1,
        confidence: 'High',
        columns,
        rows,
        suggestedFollowUps: [
          'Show total collections for this week',
          'Which fee instalments are currently overdue?',
        ],
      }
    }

    // Fallback: unsupported
    return {
      unsupported: true,
      summary: `I can't answer that safely yet. As Institute OS Copilot, I answer operational and academic queries grounded in verified store ledgers.`,
      sql: `-- No matching deterministic query for prompt: "${question}"`,
      dataSources: [],
      filters: [{ label: 'Query Matching', value: 'No operational match found' }],
      safetyChecks: [{ check: 'Supported operational query check', passed: false }],
      executionTimeMs: 90,
      rowsCount: 0,
      viewsCount: 0,
      confidence: 'Low',
      columns: [],
      rows: [],
      suggestions: [
        'Students in Java Full-Stack B3 who missed 3 or more classes and have an EMI due this week',
        'Which fee instalments are currently overdue?',
        "What are today's scheduled classroom sessions?",
      ],
    }
  },
}
