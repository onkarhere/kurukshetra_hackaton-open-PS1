import React, { useState, useRef, useEffect } from 'react'
import {
  Sparkles,
  Send,
  Lock,
  Download,
  BarChart2,
  Table as TableIcon,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  Pin,
  Paperclip,
  Maximize2,
  Minimize2,
  ChevronRight,
  ShieldCheck,
  CornerDownLeft,
} from 'lucide-react'
import { StageTicker, TickerStage } from '@/components/app/StageTicker'
import { EvidencePanel } from '@/components/app/EvidencePanel'
import { ApprovalCard } from '@/components/app/ApprovalCard'
import { Button } from '@/components/ui/Button'
import { ReasonChip } from '@/components/ui/ReasonChip'
import { useApp } from '@/context/AppContext'
import { useToast } from '@/context/ToastContext'
import { store } from '@/mocks/store'
import { CopilotMessage, UserRole } from '@/types'
import { cn } from '@/lib/utils'

interface CopilotViewProps {
  pageContext?: string
  isDrawer?: boolean
  onCloseDrawer?: () => void
}

export const CopilotView: React.FC<CopilotViewProps> = ({
  pageContext = 'On: CodeCraft Academy Dashboard',
  isDrawer = false,
  onCloseDrawer,
}) => {
  const { role, currentUser } = useApp()
  const { success, error } = useToast()

  const [messages, setMessages] = useState<CopilotMessage[]>([...store.copilotMessages])
  const [inputValue, setInputValue] = useState('')
  const [activeStage, setActiveStage] = useState<TickerStage>('completed')
  const [isGenerating, setIsGenerating] = useState(false)
  const [showEvidence, setShowEvidence] = useState(!isDrawer)
  const [selectedMessageId, setSelectedMessageId] = useState<string>(
    store.copilotMessages[0]?.id || ''
  )
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [pinnedIds, setPinnedIds] = useState<string[]>([])
  const [activeViewMode, setActiveViewMode] = useState<Record<string, 'table' | 'chart'>>({})

  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Sync with store
  useEffect(() => {
    const unsub = store.subscribe(() => {
      setMessages([...store.copilotMessages])
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, activeStage])

  const selectedMessage =
    messages.find((m) => m.id === selectedMessageId) || messages[messages.length - 1]

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
    success('Copied to clipboard')
  }

  const togglePin = (id: string) => {
    if (pinnedIds.includes(id)) {
      setPinnedIds(pinnedIds.filter((p) => p !== id))
      success('Unpinned from dashboard')
    } else {
      setPinnedIds([...pinnedIds, id])
      success('Pinned to dashboard insights')
    }
  }

  const handleSend = (textToSend?: string) => {
    const queryText = (textToSend || inputValue).trim()
    if (!queryText || isGenerating) return

    // Add user message
    const userMsg: CopilotMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      timestamp: 'Just now',
      content: queryText,
    }

    setMessages((prev) => [...prev, userMsg])
    setInputValue('')
    setIsGenerating(true)

    // Stage Ticker progression
    setActiveStage('understanding')

    setTimeout(() => {
      setActiveStage('finding_data')
    }, 600)

    setTimeout(() => {
      setActiveStage('checking_safety')
    }, 1200)

    setTimeout(() => {
      setActiveStage('running_query')
    }, 1800)

    setTimeout(() => {
      setActiveStage('writing_answer')
    }, 2400)

    setTimeout(() => {
      setActiveStage('completed')
      setIsGenerating(false)

      const isTrainer = role === 'trainer'
      const responseMsg: CopilotMessage = isTrainer
        ? {
            id: `asst-${Date.now()}`,
            sender: 'assistant',
            timestamp: 'Just now',
            query: queryText,
            content: `I analyzed attendance records for **Java Full-Stack B3 (Kothrud)** based on your prompt: "${queryText}".`,
            stage: 'completed',
            refusal: {
              isRefused: true,
              reason: "Fee information isn't available to your role (Trainer). Here's the attendance part.",
              permittedPart: 'Academic attendance and session records',
            },
            sql: `SELECT s.id, s.name, a.missed_sessions, a.attendance_rate\nFROM v_active_students s\nJOIN v_attendance_summary a ON s.id = a.student_id\nWHERE s.batch_id = 'batch-java-b3'\n  AND a.missed_sessions >= 3\nORDER BY a.missed_sessions DESC LIMIT 500;`,
            dataSources: [
              { name: 'v_active_students', type: 'view', columns: ['id', 'name', 'phone', 'batch_id'] },
              { name: 'v_attendance_summary', type: 'view', columns: ['student_id', 'missed_sessions', 'attendance_rate'] },
            ],
            filters: [
              { label: 'Role Context', value: 'Trainer (Fee tables masked by security rule)' },
              { label: 'Batch Filter', value: "batch_id = 'batch-java-b3'" },
            ],
            safetyChecks: [
              { check: 'Single SELECT statement executed', passed: true },
              { check: 'Financial tables masked', passed: true },
              { check: 'Row limit 500 enforced', passed: true },
            ],
            executionTimeMs: 198,
            rowsCount: 5,
            viewsCount: 2,
            confidence: 'High',
            tableData: [
              { name: 'Priya Nair', phone: '+91 98••• ••432', missed: 5, rate: '44%', academicStatus: 'Critical catch-up' },
              { name: 'Rohan Kulkarni', phone: '+91 98••• ••988', missed: 4, rate: '62%', academicStatus: 'Remedial lab needed' },
              { name: 'Devendra Joshi', phone: '+91 98••• ••781', missed: 3, rate: '68%', academicStatus: 'Assignment 2 pending' },
              { name: 'Amit Sane', phone: '+91 97••• ••920', missed: 3, rate: '70%', academicStatus: 'Spring doubts' },
              { name: 'Sunita Rao', phone: '+91 98••• ••324', missed: 3, rate: '71%', academicStatus: 'Active' },
            ],
            suggestedFollowUps: [
              'Generate remedial assignment for Priya Nair',
              'Check lecture attendance on Zoom for Rohan',
            ],
          }
        : {
            id: `asst-${Date.now()}`,
            sender: 'assistant',
            timestamp: 'Just now',
            query: queryText,
            content: `I analyzed attendance ledgers and outstanding fees for **Java Full-Stack B3 (Kothrud)**.\n\nFound **5 students** with $\\ge 3$ missed sessions and an EMI due/overdue for the week of **12–18 Oct 2026**. An action has been prepared below for your review.`,
            stage: 'completed',
            sql: `SELECT s.id, s.name, s.phone, a.missed_sessions, f.due_date, f.amount\nFROM v_active_students s\nJOIN v_attendance_summary a ON s.id = a.student_id\nJOIN v_fee_instalments f ON s.id = f.student_id\nWHERE s.batch_id = 'batch-java-b3'\n  AND a.missed_sessions >= 3\n  AND f.due_date BETWEEN '2026-10-12' AND '2026-10-18'\nLIMIT 500;`,
            dataSources: [
              { name: 'v_active_students', type: 'view', columns: ['id', 'name', 'phone', 'batch_id'] },
              { name: 'v_attendance_summary', type: 'view', columns: ['student_id', 'missed_sessions'] },
              { name: 'v_fee_instalments', type: 'view', columns: ['student_id', 'due_date', 'amount', 'status'] },
            ],
            filters: [
              { label: 'Role Context', value: 'Owner (Unrestricted access)' },
              { label: 'Date Window', value: "'this week' = 12–18 Oct 2026" },
            ],
            safetyChecks: [
              { check: 'Single SELECT statement executed', passed: true },
              { check: 'Sanctioned views only', passed: true },
              { check: 'Row limit 500 enforced', passed: true },
            ],
            executionTimeMs: 312,
            rowsCount: 5,
            viewsCount: 3,
            confidence: 'High',
            tableData: [
              { name: 'Priya Nair', phone: '+91 98••• ••432', missed: 5, instalment: '3 of 6', dueDate: '12 Oct (Overdue)', amount: '₹6,500', risk: 'Critical' },
              { name: 'Rohan Kulkarni', phone: '+91 98••• ••988', missed: 4, instalment: '2 of 6', dueDate: '14 Oct (Overdue)', amount: '₹6,500', risk: 'Critical' },
              { name: 'Devendra Joshi', phone: '+91 98••• ••781', missed: 3, instalment: '3 of 6', dueDate: '16 Oct (Due soon)', amount: '₹6,500', risk: 'High' },
              { name: 'Amit Sane', phone: '+91 97••• ••920', missed: 3, instalment: '3 of 6', dueDate: '17 Oct (Due soon)', amount: '₹6,500', risk: 'High' },
              { name: 'Sunita Rao', phone: '+91 98••• ••324', missed: 3, instalment: '3 of 6', dueDate: '18 Oct (Due soon)', amount: '₹6,500', risk: 'Watch' },
            ],
            approvalProposal: store.approvals[0],
            suggestedFollowUps: [
              'Schedule a 1-on-1 counseling call for Priya Nair and Rohan Kulkarni',
              'Show attendance trend for Java Full-Stack B3 over last 6 weeks',
            ],
          }

      setMessages((prev) => [...prev, responseMsg])
      setSelectedMessageId(responseMsg.id)
      store.addCopilotMessage(responseMsg)
    }, 3000)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex h-full w-full bg-bg text-fg overflow-hidden relative">
      {/* Center Thread */}
      <div className="flex-1 flex flex-col h-full min-w-0 border-r border-border">
        {/* Thread Header */}
        <div className="h-12 px-4 border-b border-border bg-surface flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-ai/10 text-ai flex items-center justify-center font-bold">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-semibold text-xs text-fg">Operations Copilot</span>
              <span className="text-[11px] text-fg-muted ml-2 font-mono">{pageContext}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEvidence(!showEvidence)}
              className={cn(
                'text-xs font-medium px-2 py-1 rounded-btn border transition-colors flex items-center gap-1',
                showEvidence
                  ? 'bg-ai/10 border-ai/30 text-ai'
                  : 'bg-surface-2 border-border text-fg-muted hover:text-fg'
              )}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Evidence ({showEvidence ? 'Hide' : 'Show'})</span>
            </button>
            {onCloseDrawer && (
              <button
                onClick={onCloseDrawer}
                className="text-fg-muted hover:text-fg p-1 rounded-btn hover:bg-surface-2 transition-colors"
                aria-label="Close copilot drawer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {messages.map((msg) => {
            if (msg.sender === 'user') {
              return (
                <div key={msg.id} className="flex justify-end animate-fade-in">
                  <div className="max-w-xl rounded-card bg-primary text-white px-4 py-2.5 text-xs font-sans leading-relaxed shadow-sm">
                    {msg.content}
                  </div>
                </div>
              )
            }

            // Assistant Message
            const viewMode = activeViewMode[msg.id] || 'table'
            const isRefused = msg.refusal?.isRefused

            return (
              <div
                key={msg.id}
                onClick={() => setSelectedMessageId(msg.id)}
                className="flex items-start gap-3 animate-fade-in group"
              >
                <div className="w-7 h-7 rounded-lg bg-ai/10 border border-ai/20 text-ai flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <Sparkles className="w-4 h-4" />
                </div>

                <div className="flex-1 space-y-3 max-w-2xl min-w-0">
                  {/* Refusal Card if restricted role */}
                  {isRefused && (
                    <div className="rounded-card border border-border bg-surface-2 p-3 flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-border/60 flex items-center justify-center shrink-0 mt-0.5">
                        <Lock className="w-3.5 h-3.5 text-fg-muted" />
                      </div>
                      <div className="text-xs">
                        <div className="font-semibold text-fg">Role-based Access Boundary</div>
                        <div className="text-fg-muted mt-0.5">{msg.refusal?.reason}</div>
                      </div>
                    </div>
                  )}

                  {/* Prose */}
                  <div className="text-xs text-fg leading-relaxed prose prose-sm dark:prose-invert max-w-none">
                    {msg.content}
                  </div>

                  {/* Table Result Block */}
                  {msg.tableData && msg.tableData.length > 0 && (
                    <div className="rounded-card border border-border bg-surface overflow-hidden shadow-sm">
                      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-surface-2/40 text-[11px] font-medium">
                        <span className="text-fg-muted">
                          Result View ({msg.tableData.length} students matching criteria)
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() =>
                              setActiveViewMode({
                                ...activeViewMode,
                                [msg.id]: viewMode === 'table' ? 'chart' : 'table',
                              })
                            }
                            className="p-1 text-fg-muted hover:text-fg rounded hover:bg-surface-2"
                            title="Toggle Table/Chart"
                          >
                            {viewMode === 'table' ? (
                              <BarChart2 className="w-3.5 h-3.5" />
                            ) : (
                              <TableIcon className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => success('Exporting CSV download...')}
                            className="p-1 text-fg-muted hover:text-fg rounded hover:bg-surface-2"
                            title="Export CSV"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-surface-2/80 text-[11px] font-semibold text-fg-muted border-b border-border">
                            <tr>
                              <th className="py-2 px-3">Student</th>
                              <th className="py-2 px-3">Phone</th>
                              <th className="py-2 px-3">Missed</th>
                              {role !== 'trainer' && <th className="py-2 px-3">Instalment</th>}
                              {role !== 'trainer' && <th className="py-2 px-3">Due Date</th>}
                              {role !== 'trainer' && <th className="py-2 px-3">Amount</th>}
                              <th className="py-2 px-3">Risk Tier</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {msg.tableData.map((row, rIdx) => (
                              <tr key={rIdx} className="hover:bg-surface-2/50 transition-colors">
                                <td className="py-2 px-3 font-medium text-fg">{row.name}</td>
                                <td className="py-2 px-3 font-mono text-[11px] text-fg-muted">
                                  {row.phone}
                                </td>
                                <td className="py-2 px-3 font-mono text-danger font-semibold">
                                  {row.missed} sessions
                                </td>
                                {role !== 'trainer' && (
                                  <td className="py-2 px-3 text-fg-muted">{row.instalment}</td>
                                )}
                                {role !== 'trainer' && (
                                  <td className="py-2 px-3 font-medium text-amber-600 dark:text-amber-400">
                                    {row.dueDate}
                                  </td>
                                )}
                                {role !== 'trainer' && (
                                  <td className="py-2 px-3 font-mono font-bold text-fg">
                                    {row.amount}
                                  </td>
                                )}
                                <td className="py-2 px-3">
                                  <ReasonChip
                                    reason={row.risk || row.academicStatus}
                                    variant={
                                      row.risk === 'Critical'
                                        ? 'danger'
                                        : row.risk === 'High'
                                        ? 'warning'
                                        : 'neutral'
                                    }
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Inline Approval Card */}
                  {msg.approvalProposal && role !== 'trainer' && (
                    <div className="pt-1">
                      <ApprovalCard approval={msg.approvalProposal} />
                    </div>
                  )}

                  {/* Meta Row: time, rows, views, role, buttons */}
                  <div className="flex items-center justify-between text-[11px] font-mono text-fg-muted pt-1">
                    <div className="flex items-center gap-2">
                      <span>◷ {msg.executionTimeMs || 312} ms</span>
                      <span>·</span>
                      <span>{msg.rowsCount || 5} rows</span>
                      <span>·</span>
                      <span>{msg.viewsCount || 3} views</span>
                      <span>·</span>
                      <span className="text-ai font-semibold">{msg.confidence || 'High'} confidence</span>
                    </div>

                    <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleCopyText(msg.id, msg.content)}
                        className="p-1 hover:text-fg rounded"
                        title="Copy answer"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-success" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => togglePin(msg.id)}
                        className={cn(
                          'p-1 rounded transition-colors',
                          pinnedIds.includes(msg.id) ? 'text-primary' : 'hover:text-fg'
                        )}
                        title="Pin to Dashboard"
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => success('Feedback noted')}
                        className="p-1 hover:text-fg rounded"
                        title="Helpful"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => success('Feedback noted')}
                        className="p-1 hover:text-fg rounded"
                        title="Not helpful"
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Follow-up Suggestion Chips */}
                  {msg.suggestedFollowUps && (
                    <div className="pt-2 flex flex-wrap gap-1.5">
                      {msg.suggestedFollowUps.map((chip, cIdx) => (
                        <button
                          key={cIdx}
                          onClick={() => handleSend(chip)}
                          className="px-2.5 py-1 rounded-full border border-ai/25 bg-ai/5 text-ai hover:bg-ai/10 text-xs text-left transition-colors font-medium flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3 shrink-0" />
                          <span>{chip}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {/* Active Generation Stage Ticker */}
          {isGenerating && (
            <div className="flex items-center gap-3 animate-fade-in pl-10">
              <StageTicker currentStage={activeStage} />
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Composer Bar */}
        <div className="p-3 border-t border-border bg-surface">
          <div className="relative rounded-card border border-border bg-surface-2 focus-within:border-ai transition-colors">
            <textarea
              ref={inputRef}
              rows={2}
              placeholder="Ask anything about students, timetable, fees, or use /commands, @entities (⌘Enter to send)..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent p-3 text-xs text-fg outline-none resize-none placeholder:text-fg-muted font-sans"
            />

            <div className="flex items-center justify-between px-3 py-2 border-t border-border/40 text-[11px] text-fg-muted">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setInputValue((prev) => prev + '/students ')}
                  className="font-mono text-[10px] bg-surface border border-border px-1.5 py-0.5 rounded hover:text-fg"
                >
                  /students
                </button>
                {role !== 'trainer' && (
                  <button
                    type="button"
                    onClick={() => setInputValue((prev) => prev + '/fees ')}
                    className="font-mono text-[10px] bg-surface border border-border px-1.5 py-0.5 rounded hover:text-fg"
                  >
                    /fees
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setInputValue((prev) => prev + '/schedule ')}
                  className="font-mono text-[10px] bg-surface border border-border px-1.5 py-0.5 rounded hover:text-fg"
                >
                  /schedule
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-fg-muted hidden sm:inline">
                  ⌘↵ to send
                </span>
                <Button
                  variant="ai"
                  size="sm"
                  onClick={() => handleSend()}
                  disabled={!inputValue.trim() || isGenerating}
                  className="h-7 px-2.5 text-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Evidence Panel (360px) */}
      {showEvidence && selectedMessage && (
        <EvidencePanel
          sql={selectedMessage.sql}
          dataSources={selectedMessage.dataSources}
          filters={selectedMessage.filters}
          safetyChecks={selectedMessage.safetyChecks}
          executionTimeMs={selectedMessage.executionTimeMs}
          rowsCount={selectedMessage.rowsCount}
          viewsCount={selectedMessage.viewsCount}
          confidence={selectedMessage.confidence}
          onClose={() => setShowEvidence(false)}
        />
      )}
    </div>
  )
}
