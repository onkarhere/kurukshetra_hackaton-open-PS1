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
import { queryEngine } from './queryEngine'
import { exportToCsv } from '@/lib/exportCsv'

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
  const [sortField, setSortField] = useState<string>('missed')
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

  const handleSort = (field: string) => {
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

      if (sortField === 'missed' || typeof aVal === 'number') {
        aVal = Number(aVal) || 0
        bVal = Number(bVal) || 0
      } else if (sortField === 'amount' || sortField === 'collected') {
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
    setTimeout(() => setActiveStage('finding_data'), 250)
    setTimeout(() => setActiveStage('checking_safety'), 500)
    setTimeout(() => setActiveStage('running_query'), 750)
    setTimeout(() => setActiveStage('writing_answer'), 1000)

    setTimeout(() => {
      setActiveStage('completed')
      setIsGenerating(false)

      const result = queryEngine.answer(queryText, role, store)

      const responseMsg: CopilotMessage = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        timestamp: 'Just now',
        query: queryText,
        content: result.summary,
        stage: 'completed',
        sql: result.sql,
        dataSources: result.dataSources,
        filters: result.filters,
        safetyChecks: result.safetyChecks,
        executionTimeMs: result.executionTimeMs,
        rowsCount: result.rowsCount,
        viewsCount: result.viewsCount,
        confidence: result.confidence,
        tableData: result.rows,
        columns: result.columns,
        approvalProposal: result.approvalProposal,
        refusal: result.refusal,
        suggestedFollowUps: result.suggestedFollowUps || result.suggestions,
      }

      setMessages((prev) => [...prev, responseMsg])
      setSelectedMessageId(responseMsg.id)
      store.addCopilotMessage(responseMsg)
    }, 1300)
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
                  {msg.tableData && msg.tableData.length > 0 && (() => {
                    const displayColumns =
                      msg.columns && msg.columns.length > 0
                        ? msg.columns
                        : Object.keys(msg.tableData[0] || {})
                            .filter((k) => k !== 'id' && k !== 'phone')
                            .map((k) => ({
                              key: k,
                              label: k.charAt(0).toUpperCase() + k.slice(1).replace(/([A-Z])/g, ' $1'),
                              align: typeof msg.tableData![0][k] === 'number' ? ('right' as const) : ('left' as const),
                              isReason:
                                k.toLowerCase().includes('status') ||
                                k.toLowerCase().includes('tier') ||
                                k.toLowerCase().includes('reason') ||
                                k.toLowerCase().includes('trend') ||
                                k.toLowerCase().includes('conflict'),
                            }))

                    return (
                      <div className="rounded-card border border-border bg-surface overflow-hidden">
                        <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-surface-sunken/40 text-[11px] text-text-muted">
                          <span>
                            {msg.tableData.length} records returned
                          </span>
                          <button
                            onClick={() => {
                              const colsToExport = displayColumns.map((c) => ({ key: c.key, label: c.label }))
                              exportToCsv(
                                `copilot_results_${Date.now()}.csv`,
                                colsToExport,
                                msg.tableData!
                              )
                              success('Exported query results to CSV')
                            }}
                            className="hover:text-text flex items-center gap-1 font-medium transition-colors"
                          >
                            <Download className="w-3 h-3" />
                            <span>CSV</span>
                          </button>
                        </div>

                        <div className="overflow-x-auto max-h-56">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-surface-sunken border-b border-border text-[11px] text-text-muted sticky top-0">
                              <tr>
                                {displayColumns.map((col) => (
                                  <th
                                    key={col.key}
                                    onClick={() => handleSort(col.key)}
                                    className={cn(
                                      'py-1.5 px-2.5 font-medium cursor-pointer hover:text-text select-none',
                                      col.align === 'right' && 'text-right'
                                    )}
                                  >
                                    <span
                                      className={cn(
                                        'inline-flex items-center gap-1',
                                        col.align === 'right' && 'justify-end'
                                      )}
                                    >
                                      {col.label}
                                      {sortField === col.key ? (
                                        sortDirection === 'asc' ? (
                                          <ArrowUp className="w-3 h-3" />
                                        ) : (
                                          <ArrowDown className="w-3 h-3" />
                                        )
                                      ) : (
                                        <ArrowUpDown className="w-2.5 h-2.5 opacity-40" />
                                      )}
                                    </span>
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {sortedRows.map((row, rIdx) => (
                                <tr key={rIdx} className="hover:bg-surface-sunken/40">
                                  {displayColumns.map((col) => (
                                    <td
                                      key={col.key}
                                      className={cn(
                                        'py-2 px-2.5 text-text',
                                        col.align === 'right' && 'text-right tabular-nums',
                                        col.key === 'name' || col.key === 'studentName'
                                          ? 'font-medium'
                                          : 'font-normal'
                                      )}
                                    >
                                      {col.isReason ? (
                                        <ReasonChip
                                          reason={String(row[col.key] || '')}
                                          variant={
                                            String(row[col.key]).toLowerCase().includes('critical') ||
                                            String(row[col.key]).toLowerCase().includes('danger') ||
                                            String(row[col.key]).toLowerCase().includes('clash')
                                              ? 'danger'
                                              : String(row[col.key]).toLowerCase().includes('high') ||
                                                String(row[col.key]).toLowerCase().includes('overdue') ||
                                                String(row[col.key]).toLowerCase().includes('review') ||
                                                String(row[col.key]).toLowerCase().includes('moderate')
                                              ? 'warning'
                                              : 'neutral'
                                          }
                                        />
                                      ) : (
                                        <>
                                          {row[col.key]}
                                          {col.key === 'name' && row.phone && (
                                            <div className="text-[10px] text-text-muted font-mono">
                                              {row.phone}
                                            </div>
                                          )}
                                        </>
                                      )}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )
                  })()}

                  {/* Actions requiring approval render as ApprovalCard directly under answer */}
                  {msg.approvalProposal && (
                    <div className="pt-1">
                      <ApprovalCard approval={msg.approvalProposal} />
                    </div>
                  )}

                  {/* Metadata line & actions with direct Evidence button */}
                  <div className="flex items-center justify-between text-[11px] text-text-muted pt-1">
                    <div className="flex items-center gap-1.5 font-mono">
                      <span>{msg.executionTimeMs || 312} ms</span>
                      <span>·</span>
                      <span>{msg.rowsCount || (msg.tableData ? msg.tableData.length : 0)} rows</span>
                      <span>·</span>
                      <span>{msg.confidence || 'High'} confidence</span>
                      <span>·</span>
                      <button
                        onClick={() => {
                          setSelectedMessageId(msg.id)
                          setActiveTab('evidence')
                        }}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-sunken border border-border text-text hover:bg-surface text-[11px] font-sans transition-colors cursor-pointer"
                        title="View SQL query and audit safety provenance"
                      >
                        <ShieldCheck className="w-3 h-3 text-accent" />
                        <span>Evidence</span>
                      </button>
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
                        onClick={() => {
                          store.setCopilotFeedback(msg.id, 'up')
                          setMessages([...store.copilotMessages])
                          success('Feedback noted: Helpful')
                        }}
                        className={cn(
                          'p-1 rounded-control transition-colors',
                          msg.feedback === 'up'
                            ? 'text-success bg-success/10 font-bold'
                            : 'hover:text-text text-text-muted'
                        )}
                        aria-label="Helpful"
                      >
                        <ThumbsUp className={cn('w-3.5 h-3.5', msg.feedback === 'up' && 'fill-current')} />
                      </button>
                      <button
                        onClick={() => {
                          store.setCopilotFeedback(msg.id, 'down')
                          setMessages([...store.copilotMessages])
                          success('Feedback noted: Not helpful')
                        }}
                        className={cn(
                          'p-1 rounded-control transition-colors',
                          msg.feedback === 'down'
                            ? 'text-danger bg-danger/10 font-bold'
                            : 'hover:text-text text-text-muted'
                        )}
                        aria-label="Not helpful"
                      >
                        <ThumbsDown className={cn('w-3.5 h-3.5', msg.feedback === 'down' && 'fill-current')} />
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

          {/* Student Quick Action Prompts */}
          {role === 'student' && (
            <div className="px-3 pt-2 pb-1 flex flex-wrap items-center gap-1.5 border-t border-border bg-surface-sunken/40">
              <span className="text-[10px] text-text-muted font-medium mr-0.5">Quick ask:</span>
              {[
                "What's my attendance?",
                "What lecture do I have today?",
                "What assignments are pending?",
              ].map((promptText) => (
                <button
                  key={promptText}
                  type="button"
                  onClick={() => handleSend(promptText)}
                  className="px-2 py-0.5 rounded-control border border-border bg-surface hover:bg-surface-sunken text-[11px] text-text transition-colors text-left hover:border-accent"
                >
                  {promptText}
                </button>
              ))}
            </div>
          )}

          {/* Composer */}
          <div className="p-3 border-t border-border bg-surface">
            <div className="border border-border-strong rounded-control bg-surface focus-within:border-accent transition-colors">
              <textarea
                ref={inputRef}
                rows={2}
                placeholder={
                  role === 'student'
                    ? "Ask about your attendance, today's lecture, or pending assignments… (⌘↵ to send)"
                    : "Ask about students, schedule, or fees… (⌘↵ to send)"
                }
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
