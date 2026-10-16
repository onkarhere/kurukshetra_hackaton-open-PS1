import React, { useState } from 'react'
import {
  ScrollText,
  User,
  Cpu,
  CheckCircle2,
  GitCompare,
  Code2,
} from 'lucide-react'
import { store } from '@/mocks/store'
import { AuditLogEntry } from '@/types'
import { SqlBlock } from '@/components/ui/SqlBlock'
import { cn } from '@/lib/utils'

export const AuditLogView: React.FC = () => {
  const [logs] = useState<AuditLogEntry[]>([...store.auditLogs])
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(store.auditLogs[0])
  const [actorFilter, setActorFilter] = useState<'all' | 'User' | 'AI' | 'System'>('all')

  const filteredLogs = logs.filter((l) => {
    if (actorFilter === 'all') return true
    return l.actorType === actorFilter
  })

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <h1 className="text-xl font-semibold text-text">Audit log</h1>
          <p className="text-xs text-text-muted mt-0.5">
            Immutable operational event ledger with SQL provenance, user approvals, and before/after diffs
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={actorFilter}
            onChange={(e) => setActorFilter(e.target.value as any)}
            className="bg-surface border border-border text-text rounded-control px-2.5 py-1.5 text-xs outline-none focus:border-accent"
          >
            <option value="all">All actors</option>
            <option value="User">Staff actions</option>
            <option value="AI">Copilot queries</option>
            <option value="System">System & automated crons</option>
          </select>
        </div>
      </div>

      {/* Main Layout: Dense Audit Table (7 cols) + Detail / Diff Drawer (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Table */}
        <div className="lg:col-span-7 rounded-card border border-border bg-surface overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-sunken border-b border-border text-[11px] font-medium text-text-muted sticky top-0">
              <tr>
                <th className="py-2 px-3">Timestamp (IST)</th>
                <th className="py-2 px-3">Actor</th>
                <th className="py-2 px-3">Action performed</th>
                <th className="py-2 px-3">Entity</th>
                <th className="py-2 px-3 text-right">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredLogs.map((log) => {
                const isSelected = selectedLog?.id === log.id
                return (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className={cn(
                      'cursor-pointer h-10 transition-colors',
                      isSelected ? 'bg-surface-sunken font-medium' : 'hover:bg-surface-sunken/40'
                    )}
                  >
                    <td className="px-3 font-mono text-[11px] text-text-muted tabular-nums whitespace-nowrap">
                      {log.timestamp}
                    </td>
                    <td className="px-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-border bg-surface text-[10px] font-mono text-text-muted">
                        {log.actorType === 'User' ? (
                          <User className="w-2.5 h-2.5" />
                        ) : log.actorType === 'AI' ? (
                          <Code2 className="w-2.5 h-2.5" />
                        ) : (
                          <Cpu className="w-2.5 h-2.5" />
                        )}
                        {log.actorName}
                      </span>
                    </td>
                    <td className="px-3 text-text truncate max-w-[200px]">
                      {log.action}
                    </td>
                    <td className="px-3 text-text-muted">{log.entity}</td>
                    <td className="px-3 text-right whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-[11px] text-success font-medium">
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

        {/* Detail / Diff Pane */}
        <div className="lg:col-span-5">
          {selectedLog ? (
            <div className="p-4 rounded-card border border-border bg-surface space-y-4 sticky top-20">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <h3 className="text-xs font-semibold text-text flex items-center gap-1.5">
                  <ScrollText className="w-3.5 h-3.5 text-text-muted" />
                  Event details
                </h3>
                <span className="text-[11px] font-mono text-text-muted">{selectedLog.id}</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-border">
                  <span className="text-text-muted">Actor</span>
                  <span className="font-medium text-text">
                    {selectedLog.actorName} ({selectedLog.actorType})
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border">
                  <span className="text-text-muted">Client origin</span>
                  <span className="font-mono text-text">{selectedLog.ipAddress}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border">
                  <span className="text-text-muted">Entity ID</span>
                  <span className="font-mono text-text">{selectedLog.entityId}</span>
                </div>
              </div>

              {/* Execution Provenance */}
              {selectedLog.aiReplay && (
                <div className="space-y-2 pt-2 border-t border-border">
                  <div className="text-[10px] uppercase font-semibold text-text-muted">
                    Query provenance
                  </div>

                  <div className="p-3 rounded-control bg-surface-sunken border border-border space-y-2 text-xs">
                    <div>
                      <div className="text-[10px] text-text-muted">Prompt:</div>
                      <div className="font-medium text-text mt-0.5">{selectedLog.aiReplay.prompt}</div>
                    </div>

                    <div>
                      <div className="text-[10px] text-text-muted mb-1">Idempotent SQL:</div>
                      <SqlBlock sql={selectedLog.aiReplay.sql} />
                    </div>

                    <div className="pt-1 text-[11px] text-text-muted flex items-center justify-between font-mono">
                      <span>Rows retrieved: {selectedLog.aiReplay.rowsCount}</span>
                      <span>Approved by: {selectedLog.aiReplay.approver}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* JSON Diff Drawer */}
              {selectedLog.changes && (
                <div className="space-y-2 pt-2 border-t border-border">
                  <div className="text-[10px] uppercase font-semibold text-text-muted flex items-center gap-1">
                    <GitCompare className="w-3.5 h-3.5" />
                    Before & after state diff
                  </div>
                  <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                    <div className="p-2.5 rounded-control bg-surface-sunken border border-border text-danger">
                      <div className="font-medium text-[10px] uppercase mb-1">Before:</div>
                      <pre className="overflow-x-auto text-[10px]">{JSON.stringify(selectedLog.changes.before, null, 2)}</pre>
                    </div>
                    <div className="p-2.5 rounded-control bg-surface-sunken border border-border text-success">
                      <div className="font-medium text-[10px] uppercase mb-1">After:</div>
                      <pre className="overflow-x-auto text-[10px]">{JSON.stringify(selectedLog.changes.after, null, 2)}</pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-text-muted border border-border rounded-card bg-surface">
              Select an audit log row to inspect change metadata.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
