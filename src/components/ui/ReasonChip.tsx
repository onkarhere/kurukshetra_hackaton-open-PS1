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
    neutral: 'bg-peach-strong text-ink-muted border-border-peach',
    warning: 'bg-[rgba(138,83,0,0.12)] text-[#8A5300] border-[rgba(138,83,0,0.35)]',
    danger: 'bg-[rgba(163,18,63,0.12)] text-[#A3123F] border-[rgba(163,18,63,0.35)]',
    info: 'bg-[rgba(31,87,133,0.12)] text-[#1F5785] border-[rgba(31,87,133,0.35)]',
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
