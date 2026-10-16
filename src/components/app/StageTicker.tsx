import React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type TickerStage =
  | 'understanding'
  | 'finding_data'
  | 'checking_safety'
  | 'running_query'
  | 'writing_answer'
  | 'completed'

interface StageTickerProps {
  currentStage: TickerStage
  className?: string
}

export const STAGES: { id: TickerStage; label: string }[] = [
  { id: 'understanding', label: 'Understanding query' },
  { id: 'finding_data', label: 'Locating records' },
  { id: 'checking_safety', label: 'Evaluating permissions' },
  { id: 'running_query', label: 'Executing read-only query' },
  { id: 'writing_answer', label: 'Formatting results' },
]

export const StageTicker: React.FC<StageTickerProps> = ({ currentStage, className }) => {
  if (currentStage === 'completed') return null

  const stageIndex = STAGES.findIndex((s) => s.id === currentStage)
  const activeStage = STAGES[stageIndex] || STAGES[0]

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-2.5 py-1 rounded-control border border-border bg-surface-sunken text-text-muted text-xs font-mono select-none',
        className
      )}
    >
      <Loader2 className="w-3 h-3 animate-spin text-text-muted" strokeWidth={1.5} />
      <span>{activeStage.label}…</span>
    </div>
  )
}
