import React from 'react'
import { Info, AlertTriangle, AlertCircle, Sparkles, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ReasonChipProps {
  reason: string
  variant?: 'neutral' | 'warning' | 'danger' | 'ai' | 'info'
  className?: string
  icon?: React.ReactNode
}

export const ReasonChip: React.FC<ReasonChipProps> = ({
  reason,
  variant = 'neutral',
  className,
  icon,
}) => {
  const variantStyles = {
    neutral: 'bg-surface-2 text-fg-muted border-border hover:border-text-muted/40',
    warning: 'bg-warning/10 text-amber-600 dark:text-amber-400 border-warning/30',
    danger: 'bg-danger/10 text-danger border-danger/30',
    ai: 'bg-ai/10 text-ai border-ai/30',
    info: 'bg-info/10 text-info border-info/30',
  }

  const defaultIcon = () => {
    if (icon) return icon
    switch (variant) {
      case 'warning':
        return <AlertTriangle className="w-3 h-3 shrink-0" />
      case 'danger':
        return <AlertCircle className="w-3 h-3 shrink-0" />
      case 'ai':
        return <Sparkles className="w-3 h-3 shrink-0 text-ai" />
      case 'info':
        return <Info className="w-3 h-3 shrink-0" />
      default:
        return <HelpCircle className="w-3 h-3 shrink-0 text-fg-muted" />
    }
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border leading-tight transition-colors select-none max-w-full truncate',
        variantStyles[variant],
        className
      )}
      title={reason}
    >
      {defaultIcon()}
      <span className="truncate">{reason}</span>
    </span>
  )
}
