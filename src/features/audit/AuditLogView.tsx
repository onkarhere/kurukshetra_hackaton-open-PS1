import React, { useState } from 'react'
import {
  ScrollText,
  User,
  Sparkles,
  Cpu,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Code2,
  X,
  GitCompare,
} from 'lucide-react'
import { store } from '@/mocks/store'
import { AuditLogEntry } from '@/types'
import { SqlBlock } from '@/components/ui/SqlBlock'
import { Button } from '@/components/ui/Button'

export const AuditLogView: React.FC = () => {
  const [logs] = useState<AuditLogEntry[]>([...store.auditLogs])
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(store.auditLogs[0])
  const [actorFilter, setActorFilter] = useState<'all' | 'User' | 'AI' | 'System'>('all')

  const filteredLogs = logs.filter((l) => {
    if (actorFilter === 'all') return true
    return l.actorType === actorFilter
  })

  return (
    <div className="space-y-4 animate-fade-in select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-fg">Immutable Audit Trail</h1>
          <p className="text-xs text-fg-muted mt-0.5">
            Full compliance provenance · Every AI prompt, SQL query, user approval & timetable change tracked
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={actorFilter}
            onChange={(e) => setActorFilter(e.target.value as any)}
            className="bg-surface-2 border border-border text-fg rounded-btn px-2.5 py-1.5 text-xs outline-none focus:border-primary"
          >
            <option value="all">All Actors</option>
            <option value="AI">AI Copilot & Autonomous Agents</option>
            <option value="User">Manual Staff Actions</option>
            <option value="System">System & Scheduled Crons</option>
          </select>
        </div>
      </div>

      {/* Main Layout: Dense Audit Table (7 cols) + Detail / Replay Drawer (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Dense Table */}
        <div className="lg:col-span-7 rounded-card border border-border bg-surface overflow-x-auto shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-2 border-b border-border text-[11px] font-semibold text-fg-muted uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Actor</th>
                <th className="py-2.5 px-3">Action Performed</th>
                <th className="py-2.5 px-3">Entity</th>
                <th className="py-2.5 px-3 text-right">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredLogs.map((log) => {
                const isSelected = selectedLog?.id === log.id
                return (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-primary/5' : 'hover:bg-surface-2/50'
                    }`}
                  >
                    <td className="py-2.5 px-3 font-mono text-[11px] text-fg-muted">
                      {log.timestamp}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold font-mono ${
                          log.actorType === 'AI'
                            ? 'bg-ai/10 text-ai border border-ai/20'
                            : log.actorType === 'User'
                            ? 'bg-primary/10 text-primary border border-primary/20'
                            : 'bg-surface-2 text-fg-muted border border-border'
                        }`}
                      >
                        {log.actorType === 'AI' && <Sparkles className="w-2.5 h-2.5" />}
                        {log.actorType === 'User' && <User className="w-2.5 h-2.5" />}
                        {log.actorType === 'System' && <Cpu className="w-2.5 h-2.5" />}
                        {log.actorName}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-fg truncate max-w-[200px]">
                      {log.action}
                    </td>
                    <td className="py-2.5 px-3 text-fg-muted">{log.entity}</td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-success">
                        <CheckCircle2 className="w-3 h-3" />
                        Success
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Detail / Replay Pane */}
        <div className="lg:col-span-5">
          {selectedLog ? (
            <div className="p-4 rounded-card border border-border bg-surface space-y-4 shadow-sm sticky top-20">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <h3 className="text-xs font-semibold text-fg flex items-center gap-1.5">
                  <ScrollText className="w-3.5 h-3.5 text-primary" />
                  Audit Event Details
                </h3>
                <span className="text-[11px] font-mono text-fg-muted">{selectedLog.id}</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-border">
                  <span className="text-fg-muted">Actor</span>
                  <span className="font-semibold text-fg">
                    {selectedLog.actorName} ({selectedLog.actorType})
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border">
                  <span className="text-fg-muted">Client IP / Origin</span>
                  <span className="font-mono text-fg">{selectedLog.ipAddress}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border">
                  <span className="text-fg-muted">Target Entity ID</span>
                  <span className="font-mono text-fg">{selectedLog.entityId}</span>
                </div>
              </div>

              {/* AI REPLAY VIEW */}
              {selectedLog.aiReplay && (
                <div className="space-y-2.5 pt-2">
                  <div className="text-[10px] uppercase font-mono font-bold text-ai flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-ai" />
                    AI Execution Provenance & Replay
                  </div>

                  <div className="p-3 rounded-btn bg-surface-2 border border-border space-y-2 text-xs">
                    <div>
                      <div className="text-[10px] text-fg-muted font-mono uppercase">User Prompt</div>
                      <div className="font-medium text-fg mt-0.5">{selectedLog.aiReplay.prompt}</div>
                    </div>

                    <div>
                      <div className="text-[10px] text-fg-muted font-mono uppercase">Idempotent SQL</div>
                      <SqlBlock sql={selectedLog.aiReplay.sql} className="mt-1" />
                    </div>

                    <div className="pt-1 text-[11px] text-fg-muted flex items-center justify-between">
                      <span>Rows retrieved: {selectedLog.aiReplay.rowsCount}</span>
                      <span className="font-semibold text-primary">{selectedLog.aiReplay.approver}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* JSON DIFF VIEW */}
              {selectedLog.changes && (
                <div className="space-y-2 pt-2">
                  <div className="text-[10px] uppercase font-mono font-bold text-fg-muted flex items-center gap-1">
                    <GitCompare className="w-3.5 h-3.5" />
                    Before & After JSON Diff
                  </div>
                  <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                    <div className="p-2.5 rounded bg-danger/10 border border-danger/30 text-danger">
                      <div className="font-bold text-[10px] uppercase mb-1">Before:</div>
                      <pre>{JSON.stringify(selectedLog.changes.before, null, 2)}</pre>
                    </div>
                    <div className="p-2.5 rounded bg-success/10 border border-success/30 text-success">
                      <div className="font-bold text-[10px] uppercase mb-1">After:</div>
                      <pre>{JSON.stringify(selectedLog.changes.after, null, 2)}</pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-fg-muted border border-border rounded-card bg-surface">
              Select an audit log row to inspect change metadata.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
