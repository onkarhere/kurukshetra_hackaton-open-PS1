import React from 'react'
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  HelpCircle,
  AlertOctagon,
  ShieldAlert,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export type StatusType =
  | 'present'
  | 'partial'
  | 'late'
  | 'absent'
  | 'excused'
  | 'online'
  | 'paid'
  | 'due_soon'
  | 'overdue'
  | 'partially_paid'
  | 'waived'
  | 'critical'
  | 'high'
  | 'watch'
  | 'low'
  | 'verified'
  | 'unmatched'
  | 'needs_review'
  | 'active'
  | 'scheduled'
  | 'completed'

interface StatusIndicatorProps {
  status: StatusType | string
  label?: string
  className?: string
  asPill?: boolean // Only for counts!
}

export const StatusPill: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  className,
  asPill = false,
}) => {
  const s = status.toLowerCase()

  // Attendance
  if (s === 'present') {
    return (
      <span className={cn('inline-flex items-center gap-1.5 text-xs font-normal text-text', className)}>
        <span className="w-1.5 h-1.5 rounded-full bg-success shrink-0" aria-hidden="true" />
        <span>{label || 'Present'}</span>
      </span>
    )
  }
  if (s === 'partial') {
    return (
      <span className={cn('inline-flex items-center gap-1.5 text-xs font-normal text-warning', className)}>
        <span className="text-[11px] leading-none shrink-0" aria-hidden="true">◐</span>
        <span>{label || 'Partial'}</span>
      </span>
    )
  }
  if (s === 'late') {
    return (
      <span className={cn('inline-flex items-center gap-1.5 text-xs font-normal text-warning', className)}>
        <Clock className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
        <span>{label || 'Late'}</span>
      </span>
    )
  }
  if (s === 'absent') {
    return (
      <span className={cn('inline-flex items-center gap-1.5 text-xs font-normal text-danger', className)}>
        <span className="w-1.5 h-1.5 rounded-full border border-danger shrink-0" aria-hidden="true" />
        <span>{label || 'Absent'}</span>
      </span>
    )
  }
  if (s === 'online') {
    return (
      <span className={cn('inline-flex items-center gap-1.5 text-xs font-normal text-info', className)}>
        <span className="text-[10px] leading-none text-info shrink-0" aria-hidden="true">◆</span>
        <span>{label || 'Online'}</span>
      </span>
    )
  }
  if (s === 'excused') {
    return (
      <span className={cn('inline-flex items-center gap-1.5 text-xs font-normal text-text-muted', className)}>
        <HelpCircle className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
        <span>{label || 'Excused'}</span>
      </span>
    )
  }

  // Fees
  if (s === 'paid' || s === 'verified') {
    return (
      <span className={cn('inline-flex items-center gap-1.5 text-xs font-normal text-success', className)}>
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
        <span>{label || (s === 'verified' ? 'Verified' : 'Paid')}</span>
      </span>
    )
  }
  if (s === 'due_soon' || s === 'partially_paid' || s === 'needs_review') {
    return (
      <span className={cn('inline-flex items-center gap-1.5 text-xs font-normal text-warning', className)}>
        <Clock className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
        <span>{label || (s === 'due_soon' ? 'Due soon' : s === 'partially_paid' ? 'Partially paid' : 'Needs review')}</span>
      </span>
    )
  }
  if (s === 'overdue' || s === 'unmatched') {
    return (
      <span className={cn('inline-flex items-center gap-1.5 text-xs font-normal text-danger', className)}>
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
        <span>{label || (s === 'overdue' ? 'Overdue' : 'Unmatched')}</span>
      </span>
    )
  }
  if (s === 'waived') {
    return (
      <span className={cn('inline-flex items-center gap-1.5 text-xs font-normal text-text-muted', className)}>
        <span className="w-1.5 h-1.5 rounded-full bg-border-strong shrink-0" aria-hidden="true" />
        <span>{label || 'Waived'}</span>
      </span>
    )
  }

  // Risk Tiers: Critical, High, Watch, Low
  if (s === 'critical') {
    return (
      <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium text-danger', className)}>
        <ShieldAlert className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
        <span>{label || 'Critical'}</span>
      </span>
    )
  }
  if (s === 'high') {
    return (
      <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium text-warning', className)}>
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
        <span>{label || 'High'}</span>
      </span>
    )
  }
  if (s === 'watch') {
    return (
      <span className={cn('inline-flex items-center gap-1.5 text-xs font-normal text-warning', className)}>
        <Clock className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
        <span>{label || 'Watch'}</span>
      </span>
    )
  }
  if (s === 'low') {
    return (
      <span className={cn('inline-flex items-center gap-1.5 text-xs font-normal text-text-muted', className)}>
        <span className="w-1.5 h-1.5 rounded-full bg-border-strong shrink-0" aria-hidden="true" />
        <span>{label || 'Low'}</span>
      </span>
    )
  }

  // Generic status
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-normal text-text-muted', className)}>
      <span className="w-1.5 h-1.5 rounded-full bg-border-strong shrink-0" aria-hidden="true" />
      <span>{label || status}</span>
    </span>
  )
}
