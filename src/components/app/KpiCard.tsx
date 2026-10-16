import React from 'react'
import { cn } from '@/lib/utils'

export interface KpiCardProps {
  label: string
  value: string | number
  target?: string
  trend?: string | { value: string; isPositive?: boolean; isNeutral?: boolean }
  delta?: { value: string; isPositive?: boolean; isNeutral?: boolean }
  trendPositive?: boolean | null // null for neutral
  subtext?: string
  onClick?: () => void
  className?: string
  icon?: React.ReactNode
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  target,
  trend,
  delta,
  trendPositive = null,
  subtext,
  onClick,
  className,
  icon,
}) => {
  const deltaObj = typeof trend === 'object' ? trend : delta
  const trendText = typeof trend === 'string' ? trend : deltaObj?.value
  const isPos =
    trendPositive !== null
      ? trendPositive
      : deltaObj
      ? deltaObj.isNeutral
        ? null
        : deltaObj.isPositive ?? null
      : null
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={cn(
        'p-4 rounded-card border border-border bg-surface transition-colors select-none text-left',
        onClick ? 'cursor-pointer hover:bg-surface-sunken' : '',
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-normal text-text-muted truncate">
          {label}
        </span>
        {icon && <div className="text-text-muted">{icon}</div>}
      </div>

      <div className="mt-2 flex items-baseline justify-between gap-2">
        <div className="text-2xl font-medium tracking-tight text-text tnum">
          {value}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-xs text-text-muted">
        {trendText && (
          <span
            className={cn(
              'font-normal',
              isPos === true
                ? 'text-success'
                : isPos === false
                ? 'text-danger'
                : 'text-text-muted'
            )}
          >
            {trendText}
          </span>
        )}
        {target && <span className="text-text-muted ml-auto">{target}</span>}
        {subtext && !target && <span className="text-text-muted ml-auto">{subtext}</span>}
      </div>
    </div>
  )
}
