import React, { useState, useRef, useEffect } from 'react'
import {
  Command,
  Send,
  Lock,
  Download,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  ShieldCheck,
  Table as TableIcon,
  FileText,
} from 'lucide-react'
import { StageTicker, TickerStage } from '@/components/app/StageTicker'
import { EvidencePanel } from '@/components/app/EvidencePanel'
import { ApprovalCard } from '@/components/app/ApprovalCard'
import { Button } from '@/components/ui/Button'
import { ReasonChip } from '@/components/ui/ReasonChip'
import { useApp } from '@/context/AppContext'
import { useToast } from '@/context/ToastContext'
import { store } from '@/mocks/store'
import { CopilotMessage } from '@/types'
import { cn } from '@/lib/utils'

interface CopilotViewProps {
  pageContext?: string
  isDrawer?: boolean
  onCloseDrawer?: () => void
}

type SortField = 'name' | 'phone' | 'missed' | 'instalment' | 'dueDate' | 'amount' | 'risk'

export const CopilotView: React.FC<CopilotViewProps> = ({
  pageContext = 'Context: Operations',
  isDrawer = false,
  onCloseDrawer,
}) => {
  const { role, pendingAskQuery, setPendingAskQuery } = useApp()
  const { success } = useToast()

  const [messages, setMessages] = useState<CopilotMessage[]>([...store.copilotMessages])
  const [inputValue, setInputValue] = useState('')
  const [activeStage, setActiveStage] = useState<TickerStage>('completed')
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState<'answer' | 'evidence'>('answer')
  const [selectedMessageId, setSelectedMessageId] = useState<string>(
    store.copilotMessages[0]?.id || ''
  )
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Sort state for result table
  const [sortField, setSortField] = useState<SortField>('missed')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Sync with store
  useEffect(() => {
    const unsub = store.subscribe(() => {
      setMessages([...store.copilotMessages])
    })
    return () => {
      unsub()
    }
  }, [])

  // Auto-scroll on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, activeStage])

  // Handle query forwarded from Command Palette
  useEffect(() => {
    if (pendingAskQuery) {
      handleSend(pendingAskQuery)
      setPendingAskQuery(null)
    }
  }, [pendingAskQuery])

  const selectedMessage =
    messages.find((m) => m.id === selectedMessageId) || messages[messages.length - 1]

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
    success('Copied to clipboard')
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getSortedTableData = (data: any[] = []) => {
    return [...data].sort((a, b) => {
      let aVal = a[sortField]
      let bVal = b[sortField]

      if (sortField === 'missed') {
        aVal = Number(aVal) || 0
        bVal = Number(bVal) || 0
      } else if (sortField === 'amount') {
        aVal = Number(String(aVal).replace(/[^0-9]/g, '')) || 0
        bVal = Number(String(bVal).replace(/[^0-9]/g, '')) || 0
      } else {
        aVal = String(aVal || '').toLowerCase()
        bVal = String(bVal || '').toLowerCase()
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }

  const handleSend = (textToSend?: string) => {
    const queryText = (textToSend || inputValue).trim()
    if (!queryText || isGenerating) return

    const userMsg: CopilotMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      timestamp: 'Just now',
      content: queryText,
    }

    setMessages((prev) => [...prev, userMsg])
    setInputValue('')
    setIsGenerating(true)
    setActiveTab('answer')

    // Progression of stages with neutral StageTicker
    setActiveStage('understanding')
    setTimeout(() => setActiveStage('finding_data'), 500)
    setTimeout(() => setActiveStage('checking_safety'), 1000)
    setTimeout(() => setActiveStage('running_query'), 1500)
    setTimeout(() => setActiveStage('writing_answer'), 2000)

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
            content: `I analyzed attendance ledgers and outstanding fees for **Java Full-Stack B3 (Kothrud)**.\n\nFound **5 students** with 3 or more missed sessions and an EMI due or overdue for the week of **12–18 Oct 2026**. An action has been prepared below for your review.`,
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
              'Show attendance trend for Java Full-Stack B3 (Kothrud) over last 6 weeks',
            ],
          }

      setMessages((prev) => [...prev, responseMsg])
      setSelectedMessageId(responseMsg.id)
      store.addCopilotMessage(responseMsg)
    }, 2500)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full w-full bg-surface text-text overflow-hidden select-none">
      {/* Sheet Top Bar: 52px */}
      <div className="h-[52px] px-4 border-b border-border bg-surface flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Command className="w-4 h-4 text-text-muted" />
          <h2 className="text-xs font-semibold text-text">Ask</h2>
          <span className="text-[11px] text-text-muted truncate max-w-[180px]">
            {pageContext}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="flex items-center rounded-control border border-border p-0.5 bg-surface-sunken">
            <button
              onClick={() => setActiveTab('answer')}
              className={cn(
                'px-2 py-0.5 text-xs rounded-control transition-colors font-medium',
                activeTab === 'answer'
                  ? 'bg-surface text-text shadow-xs'
                  : 'text-text-muted hover:text-text'
              )}
            >
              Answer
            </button>
            <button
              onClick={() => setActiveTab('evidence')}
              className={cn(
                'px-2 py-0.5 text-xs rounded-control transition-colors font-medium flex items-center gap-1',
                activeTab === 'evidence'
                  ? 'bg-surface text-text shadow-xs'
                  : 'text-text-muted hover:text-text'
              )}
            >
              <ShieldCheck className="w-3 h-3 text-text-muted" />
              Evidence
            </button>
          </div>

          {onCloseDrawer && (
            <button
              onClick={onCloseDrawer}
              className="p-1.5 text-text-muted hover:text-text rounded-control hover:bg-surface-sunken transition-colors ml-1"
              aria-label="Close sheet"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Main Body */}
      {activeTab === 'evidence' ? (
        <div className="flex-1 overflow-y-auto">
          {selectedMessage ? (
            <EvidencePanel
              sql={selectedMessage.sql}
              dataSources={selectedMessage.dataSources}
              filters={selectedMessage.filters}
              safetyChecks={selectedMessage.safetyChecks}
              executionTimeMs={selectedMessage.executionTimeMs}
              rowsCount={selectedMessage.rowsCount}
              viewsCount={selectedMessage.viewsCount}
              confidence={selectedMessage.confidence}
              className="max-w-none border-l-0"
            />
          ) : (
            <div className="p-4 text-xs text-text-muted">No evidence available for this item.</div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Messages Thread */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => {
              if (msg.sender === 'user') {
                return (
                  <div key={msg.id} className="flex justify-end">
                    <div className="max-w-[85%] rounded-card bg-surface-sunken border border-border px-3.5 py-2 text-xs text-text leading-relaxed">
                      {msg.content}
                    </div>
                  </div>
                )
              }

              const isRefused = msg.refusal?.isRefused
              const sortedRows = getSortedTableData(msg.tableData)

              return (
                <div
                  key={msg.id}
                  onClick={() => setSelectedMessageId(msg.id)}
                  className="space-y-3"
                >
                  {/* Refusal Card: neutral grey with lock glyph */}
                  {isRefused && (
                    <div className="rounded-card border border-border bg-surface-sunken p-3 flex items-start gap-2.5">
                      <Lock className="w-4 h-4 text-text-muted shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <div className="font-medium text-text">Access boundary</div>
                        <div className="text-text-muted mt-0.5 leading-snug">
                          {msg.refusal?.reason}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Prose answer */}
                  <div className="text-xs text-text leading-relaxed whitespace-pre-line">
                    {msg.content}
                  </div>

                  {/* Sortable Result Table */}
                  {msg.tableData && msg.tableData.length > 0 && (
                    <div className="rounded-card border border-border bg-surface overflow-hidden">
                      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-surface-sunken/40 text-[11px] text-text-muted">
                        <span>
                          {msg.tableData.length} records returned
                        </span>
                        <button
                          onClick={() => success('Exporting CSV...')}
                          className="hover:text-text flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" />
                          <span>CSV</span>
                        </button>
                      </div>

                      <div className="overflow-x-auto max-h-56">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-surface-sunken border-b border-border text-[11px] text-text-muted sticky top-0">
                            <tr>
                              <th
                                onClick={() => handleSort('name')}
                                className="py-1.5 px-2.5 font-medium cursor-pointer hover:text-text"
                              >
                                <span className="inline-flex items-center gap-1">
                                  Student
                                  {sortField === 'name' ? (
                                    sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                  ) : (
                                    <ArrowUpDown className="w-2.5 h-2.5 opacity-50" />
                                  )}
                                </span>
                              </th>
                              <th
                                onClick={() => handleSort('missed')}
                                className="py-1.5 px-2.5 font-medium cursor-pointer hover:text-text text-right"
                              >
                                <span className="inline-flex items-center gap-1 justify-end">
                                  Missed
                                  {sortField === 'missed' ? (
                                    sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                  ) : (
                                    <ArrowUpDown className="w-2.5 h-2.5 opacity-50" />
                                  )}
                                </span>
                              </th>
                              {role !== 'trainer' && (
                                <th
                                  onClick={() => handleSort('amount')}
                                  className="py-1.5 px-2.5 font-medium cursor-pointer hover:text-text text-right"
                                >
                                  <span className="inline-flex items-center gap-1 justify-end">
                                    Due
                                    {sortField === 'amount' ? (
                                      sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                    ) : (
                                      <ArrowUpDown className="w-2.5 h-2.5 opacity-50" />
                                    )}
                                  </span>
                                </th>
                              )}
                              <th className="py-1.5 px-2.5 font-medium">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {sortedRows.map((row, rIdx) => (
                              <tr key={rIdx} className="hover:bg-surface-sunken/40">
                                <td className="py-2 px-2.5 font-medium text-text">
                                  {row.name}
                                  <div className="text-[10px] text-text-muted font-mono">
                                    {row.phone}
                                  </div>
                                </td>
                                <td className="py-2 px-2.5 text-right tabular-nums text-text font-normal">
                                  {row.missed}
                                </td>
                                {role !== 'trainer' && (
                                  <td className="py-2 px-2.5 text-right tabular-nums font-medium text-text">
                                    {row.amount}
                                  </td>
                                )}
                                <td className="py-2 px-2.5">
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

                  {/* Actions requiring approval render as ApprovalCard */}
                  {msg.approvalProposal && role !== 'trainer' && (
                    <div className="pt-1">
                      <ApprovalCard approval={msg.approvalProposal} />
                    </div>
                  )}

                  {/* Metadata line & actions */}
                  <div className="flex items-center justify-between text-[11px] text-text-muted pt-1">
                    <div className="flex items-center gap-1.5 font-mono">
                      <span>{msg.executionTimeMs || 312} ms</span>
                      <span>·</span>
                      <span>{msg.rowsCount || 5} rows</span>
                      <span>·</span>
                      <span>{msg.confidence || 'High'} confidence</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCopyText(msg.id, msg.content)}
                        className="p-1 hover:text-text rounded-control"
                        aria-label="Copy answer"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-success" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => success('Feedback noted')}
                        className="p-1 hover:text-text rounded-control"
                        aria-label="Helpful"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => success('Feedback noted')}
                        className="p-1 hover:text-text rounded-control"
                        aria-label="Not helpful"
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Plain text follow-up suggestions */}
                  {msg.suggestedFollowUps && (
                    <div className="pt-1 flex flex-wrap gap-1.5">
                      {msg.suggestedFollowUps.map((chip, cIdx) => (
                        <button
                          key={cIdx}
                          onClick={() => handleSend(chip)}
                          className="px-2 py-1 rounded-control border border-border bg-surface hover:bg-surface-sunken text-xs text-text-muted hover:text-text transition-colors text-left"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Stage Ticker progression */}
            {isGenerating && (
              <div className="py-2">
                <StageTicker currentStage={activeStage} />
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Composer */}
          <div className="p-3 border-t border-border bg-surface">
            <div className="border border-border-strong rounded-control bg-surface focus-within:border-accent transition-colors">
              <textarea
                ref={inputRef}
                rows={2}
                placeholder="Ask about students, schedule, or fees… (⌘↵ to send)"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-transparent p-2.5 text-xs text-text outline-none resize-none placeholder:text-text-muted font-sans"
              />

              <div className="flex items-center justify-between px-2.5 py-1.5 border-t border-border bg-surface-sunken/30 text-[11px] text-text-muted">
                <span className="font-mono text-[10px]">⌘↵ to send</span>
                <Button
                  variant="primary"
                  size="xs"
                  onClick={() => handleSend()}
                  disabled={!inputValue.trim() || isGenerating}
                >
                  <Send className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
