import React, { useState } from 'react'
import {
  Database,
  Filter,
  ShieldCheck,
  Code2,
  X,
  CheckCircle2,
  Layers,
  Clock,
  Sparkles,
} from 'lucide-react'
import { SqlBlock } from '@/components/ui/SqlBlock'
import { cn } from '@/lib/utils'

interface EvidencePanelProps {
  sql?: string
  dataSources?: { name: string; type: 'view' | 'table'; columns: string[] }[]
  filters?: { label: string; value: string }[]
  safetyChecks?: { check: string; passed: boolean }[]
  executionTimeMs?: number
  rowsCount?: number
  viewsCount?: number
  confidence?: 'High' | 'Medium' | 'Low'
  onClose?: () => void
  className?: string
}

export const EvidencePanel: React.FC<EvidencePanelProps> = ({
  sql,
  dataSources = [],
  filters = [],
  safetyChecks = [],
  executionTimeMs = 312,
  rowsCount = 5,
  viewsCount = 3,
  confidence = 'High',
  onClose,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<'sql' | 'sources' | 'filters' | 'safety'>('sql')

  return (
    <div
      className={cn(
        'w-full max-w-[380px] bg-surface border-l border-border flex flex-col h-full text-fg select-none',
        className
      )}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between p-3.5 border-b border-border bg-surface-2/50">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-ai/10 border border-ai/20 flex items-center justify-center text-ai">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-fg flex items-center gap-1.5">
              Evidence & Verification
            </h3>
            <p className="text-[10px] font-mono text-fg-muted">
              ◷ {executionTimeMs} ms · {rowsCount} rows · {viewsCount} views · {confidence} confidence
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-fg-muted hover:text-fg p-1 rounded-btn hover:bg-surface-2 transition-colors"
            aria-label="Close evidence panel"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-border px-2 bg-surface text-xs font-medium">
        <button
          onClick={() => setActiveTab('sql')}
          className={cn(
            'flex items-center gap-1.5 py-2.5 px-3 border-b-2 transition-all text-xs',
            activeTab === 'sql'
              ? 'border-ai text-ai font-semibold'
              : 'border-transparent text-fg-muted hover:text-fg'
          )}
        >
          <Code2 className="w-3.5 h-3.5" />
          SQL
        </button>

        <button
          onClick={() => setActiveTab('sources')}
          className={cn(
            'flex items-center gap-1.5 py-2.5 px-3 border-b-2 transition-all text-xs',
            activeTab === 'sources'
              ? 'border-ai text-ai font-semibold'
              : 'border-transparent text-fg-muted hover:text-fg'
          )}
        >
          <Database className="w-3.5 h-3.5" />
          Data Sources ({dataSources.length})
        </button>

        <button
          onClick={() => setActiveTab('filters')}
          className={cn(
            'flex items-center gap-1.5 py-2.5 px-3 border-b-2 transition-all text-xs',
            activeTab === 'filters'
              ? 'border-ai text-ai font-semibold'
              : 'border-transparent text-fg-muted hover:text-fg'
          )}
        >
          <Filter className="w-3.5 h-3.5" />
          Filters ({filters.length})
        </button>

        <button
          onClick={() => setActiveTab('safety')}
          className={cn(
            'flex items-center gap-1.5 py-2.5 px-3 border-b-2 transition-all text-xs',
            activeTab === 'safety'
              ? 'border-ai text-ai font-semibold'
              : 'border-transparent text-fg-muted hover:text-fg'
          )}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Safety
        </button>
      </div>

      {/* Content Area */}
      <div className="p-3.5 flex-1 overflow-y-auto space-y-3.5 text-xs">
        {/* Tab 1: SQL */}
        {activeTab === 'sql' && (
          <div className="space-y-2">
            <div className="text-[11px] text-fg-muted">
              Auto-generated SQL query executed against read-only analytics replicas:
            </div>
            {sql ? (
              <SqlBlock sql={sql} />
            ) : (
              <div className="p-4 text-center text-fg-muted">No SQL execution for this response.</div>
            )}
            <div className="text-[10px] text-fg-muted/80 bg-surface-2 p-2 rounded border border-border">
              Guaranteed idempotent & read-only. Row-level security automatically injected for current role.
            </div>
          </div>
        )}

        {/* Tab 2: Data Sources */}
        {activeTab === 'sources' && (
          <div className="space-y-2.5">
            <div className="text-[11px] text-fg-muted">
              Database views and tables accessed to construct this result:
            </div>
            {dataSources.map((ds, i) => (
              <div key={i} className="p-2.5 rounded-btn bg-surface-2 border border-border space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-semibold text-fg flex items-center gap-1.5">
                    <Database className="w-3 h-3 text-primary" />
                    {ds.name}
                  </span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-surface border border-border text-fg-muted">
                    {ds.type}
                  </span>
                </div>
                <div className="text-[11px] text-fg-muted">
                  Columns used: <span className="font-mono text-fg">{ds.columns.join(', ')}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Filters applied */}
        {activeTab === 'filters' && (
          <div className="space-y-2.5">
            <div className="text-[11px] text-fg-muted">
              Inferred context, temporal parameters, and permission bounds:
            </div>
            {filters.map((f, i) => (
              <div key={i} className="p-2.5 rounded-btn bg-surface-2 border border-border space-y-0.5">
                <div className="text-[10px] font-mono text-ai font-semibold uppercase tracking-wider">
                  {f.label}
                </div>
                <div className="text-xs font-mono text-fg">{f.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 4: Safety checks */}
        {activeTab === 'safety' && (
          <div className="space-y-2.5">
            <div className="text-[11px] text-fg-muted">
              Deterministic verification checks evaluated prior to query execution:
            </div>
            <div className="space-y-2">
              {safetyChecks.map((sc, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 p-2 rounded-btn bg-surface-2 border border-border"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
                  <span className="text-xs text-fg">{sc.check}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
