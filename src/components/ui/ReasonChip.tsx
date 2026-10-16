import React from 'react'
import { Info, AlertTriangle, AlertCircle, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ReasonChipProps {
  reason: string
  variant?: 'neutral' | 'warning' | 'danger' | 'info'
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
    neutral: 'bg-surface-sunken text-text-muted border-border',
    warning: 'bg-warning-subtle text-warning border-border',
    danger: 'bg-danger-subtle text-danger border-border',
    info: 'bg-info-subtle text-info border-border',
  }

  const defaultIcon = () => {
    if (icon) return icon
    switch (variant) {
      case 'warning':
        return <AlertTriangle className="w-3 h-3 shrink-0" strokeWidth={1.5} />
      case 'danger':
        return <AlertCircle className="w-3 h-3 shrink-0" strokeWidth={1.5} />
      case 'info':
        return <Info className="w-3 h-3 shrink-0" strokeWidth={1.5} />
      default:
        return <HelpCircle className="w-3 h-3 shrink-0 text-text-muted" strokeWidth={1.5} />
    }
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-control text-xs font-normal border leading-tight select-none max-w-full truncate',
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
