import React from 'react'
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KpiCardProps {
  label: string
  value: string | number
  delta?: {
    value: string
    isPositive?: boolean
    isNeutral?: boolean
  }
  sparklineData?: number[]
  sparklineColor?: string
  subtext?: string
  onClick?: () => void
  className?: string
  icon?: React.ReactNode
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  delta,
  sparklineData,
  sparklineColor = 'var(--primary)',
  subtext,
  onClick,
  className,
  icon,
}) => {
  // Generate SVG sparkline path
  const renderSparkline = () => {
    if (!sparklineData || sparklineData.length < 2) return null
    const min = Math.min(...sparklineData)
    const max = Math.max(...sparklineData)
    const range = max - min || 1
    const width = 64
    const height = 24
    const points = sparklineData
      .map((val, i) => {
        const x = (i / (sparklineData.length - 1)) * width
        const y = height - ((val - min) / range) * (height - 4) - 2
        return `${x.toFixed(1)},${y.toFixed(1)}`
      })
      .join(' ')

    return (
      <svg width={width} height={height} className="overflow-visible shrink-0 opacity-80">
        <polyline
          fill="none"
          stroke={sparklineColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    )
  }

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={cn(
        'p-4 rounded-card border border-border bg-surface transition-all select-none',
        onClick
          ? 'cursor-pointer hover:border-text-muted/40 hover:shadow-hover active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-primary'
          : '',
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-fg-muted uppercase tracking-wider truncate">
          {label}
        </span>
        {icon && <div className="text-fg-muted">{icon}</div>}
      </div>

      <div className="mt-2 flex items-baseline justify-between gap-3">
        <div className="text-2xl font-bold font-mono tracking-tight text-fg tnum">
          {value}
        </div>
        {renderSparkline()}
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2">
        {delta && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 text-[11px] font-semibold font-mono px-1.5 py-0.5 rounded border leading-none',
              delta.isNeutral
                ? 'bg-surface-2 text-fg-muted border-border'
                : delta.isPositive
                ? 'bg-success/10 text-success border-success/20'
                : 'bg-danger/10 text-danger border-danger/20'
            )}
          >
            {delta.isNeutral ? (
              <Minus className="w-3 h-3" />
            ) : delta.isPositive ? (
              <ArrowUpRight className="w-3 h-3" />
            ) : (
              <ArrowDownRight className="w-3 h-3" />
            )}
            {delta.value}
          </span>
        )}

        {subtext && <span className="text-[11px] text-fg-muted truncate">{subtext}</span>}
      </div>
    </div>
  )
}
