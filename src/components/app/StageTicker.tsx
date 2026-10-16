import React from 'react'
import { Sparkles, Check, Loader2 } from 'lucide-react'
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
  { id: 'finding_data', label: 'Finding data views' },
  { id: 'checking_safety', label: 'Checking safety checks' },
  { id: 'running_query', label: 'Running analytical query' },
  { id: 'writing_answer', label: 'Synthesizing response' },
]

export const StageTicker: React.FC<StageTickerProps> = ({ currentStage, className }) => {
  if (currentStage === 'completed') return null

  const stageIndex = STAGES.findIndex((s) => s.id === currentStage)
  const activeStage = STAGES[stageIndex] || STAGES[0]

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-ai/30 bg-ai/5 text-ai text-xs font-mono shadow-sm animate-fade-in select-none',
        className
      )}
    >
      <Loader2 className="w-3.5 h-3.5 animate-spin text-ai" />
      <div className="flex items-center gap-1.5">
        <span className="font-semibold text-fg">Step {stageIndex + 1}/5:</span>
        <span className="text-ai animate-pulse">{activeStage.label}…</span>
      </div>
    </div>
  )
}
