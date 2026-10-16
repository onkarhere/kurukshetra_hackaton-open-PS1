import React from 'react'
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Laptop,
  AlertOctagon,
  ShieldAlert,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { AttendanceStatus, FeeStatus, RiskLevel } from '@/types'

export type StatusType = AttendanceStatus | FeeStatus | RiskLevel | 'active' | 'completed' | 'verified' | 'unmatched' | 'needs_review'

interface StatusPillProps {
  status: StatusType | string
  label?: string
  className?: string
  size?: 'sm' | 'md'
}

export const StatusPill: React.FC<StatusPillProps> = ({
  status,
  label,
  className,
  size = 'md',
}) => {
  const normalized = status.toLowerCase()

  // Attendance
  if (normalized === 'present') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full font-medium border bg-success/10 text-success border-success/30',
          size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs',
          className
        )}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-success shrink-0" />
        {label || 'Present'}
      </span>
    )
  }
  if (normalized === 'partial') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full font-medium border bg-warning/10 text-warning border-warning/30',
          size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs',
          className
        )}
      >
        <span className="text-[10px] shrink-0 leading-none">◐</span>
        {label || 'Partial'}
      </span>
    )
  }
  if (normalized === 'late') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full font-medium border bg-warning/10 text-warning border-warning/30',
          size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs',
          className
        )}
      >
        <Clock className="w-3 h-3 shrink-0" />
        {label || 'Late'}
      </span>
    )
  }
  if (normalized === 'absent') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full font-medium border bg-danger/10 text-danger border-danger/30',
          size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs',
          className
        )}
      >
        <span className="w-1.5 h-1.5 rounded-full border border-danger shrink-0" />
        {label || 'Absent'}
      </span>
    )
  }
  if (normalized === 'online') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full font-medium border bg-info/10 text-info border-info/30',
          size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs',
          className
        )}
      >
        <span className="text-[10px] shrink-0 leading-none text-info">◆</span>
        {label || 'Online'}
      </span>
    )
  }
  if (normalized === 'excused') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full font-medium border bg-surface-2 text-fg-muted border-border',
          size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs',
          className
        )}
      >
        <HelpCircle className="w-3 h-3 shrink-0" />
        {label || 'Excused'}
      </span>
    )
  }

  // Fees
  if (normalized === 'paid' || normalized === 'verified') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full font-medium border bg-success/10 text-success border-success/30',
          size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs',
          className
        )}
      >
        <CheckCircle2 className="w-3 h-3 shrink-0" />
        {label || 'Paid'}
      </span>
    )
  }
  if (normalized === 'due_soon' || normalized === 'partially_paid' || normalized === 'needs_review') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full font-medium border bg-warning/10 text-warning border-warning/30',
          size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs',
          className
        )}
      >
        <Clock className="w-3 h-3 shrink-0" />
        {label || (normalized === 'due_soon' ? 'Due soon' : normalized === 'partially_paid' ? 'Partially paid' : 'Needs review')}
      </span>
    )
  }
  if (normalized === 'overdue' || normalized === 'unmatched') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full font-medium border bg-danger/10 text-danger border-danger/30',
          size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs',
          className
        )}
      >
        <AlertTriangle className="w-3 h-3 shrink-0" />
        {label || (normalized === 'overdue' ? 'Overdue' : 'Unmatched')}
      </span>
    )
  }
  if (normalized === 'waived') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full font-medium border bg-surface-2 text-fg-muted border-border',
          size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs',
          className
        )}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-fg-muted/40 shrink-0" />
        {label || 'Waived'}
      </span>
    )
  }

  // Risk Tiers
  if (normalized === 'critical') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full font-semibold border bg-danger/15 text-danger border-danger/40',
          size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs',
          className
        )}
      >
        <ShieldAlert className="w-3 h-3 shrink-0 text-danger animate-pulse" />
        {label || 'Critical'}
      </span>
    )
  }
  if (normalized === 'high') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full font-medium border bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
          size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs',
          className
        )}
      >
        <AlertTriangle className="w-3 h-3 shrink-0" />
        {label || 'High Risk'}
      </span>
    )
  }
  if (normalized === 'watch') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full font-medium border bg-warning/10 text-warning border-warning/30',
          size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs',
          className
        )}
      >
        <Clock className="w-3 h-3 shrink-0" />
        {label || 'Watch'}
      </span>
    )
  }
  if (normalized === 'low') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full font-medium border bg-surface-2 text-fg-muted border-border',
          size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs',
          className
        )}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-fg-muted/40 shrink-0" />
        {label || 'Low Risk'}
      </span>
    )
  }

  // Fallback
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium border bg-surface-2 text-fg-muted border-border',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs',
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-fg-muted/40 shrink-0" />
      {label || status}
    </span>
  )
}
