import React, { useState } from 'react'
import {
  CheckCheck,
  Calendar,
  MessageSquare,
  DollarSign,
  Layers,
} from 'lucide-react'
import { ApprovalCard } from '@/components/app/ApprovalCard'
import { ReasonChip } from '@/components/ui/ReasonChip'
import { store } from '@/mocks/store'
import { ApprovalAction } from '@/types'
import { cn } from '@/lib/utils'

export const ApprovalsView: React.FC = () => {
  const [approvals, setApprovals] = useState<ApprovalAction[]>([...store.approvals])
  const [selectedApprovalId, setSelectedApprovalId] = useState<string>(
    store.approvals[0]?.id || ''
  )
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const filtered = approvals.filter((a) => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false
    if (typeFilter !== 'all' && a.type !== typeFilter) return false
    return true
  })

  const selectedApproval =
    approvals.find((a) => a.id === selectedApprovalId) || filtered[0]

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'whatsapp_bulk':
        return <MessageSquare className="w-3.5 h-3.5 text-text-muted" />
      case 'timetable_replan':
        return <Calendar className="w-3.5 h-3.5 text-text-muted" />
      case 'fee_waiver':
        return <DollarSign className="w-3.5 h-3.5 text-text-muted" />
      default:
        return <Layers className="w-3.5 h-3.5 text-text-muted" />
    }
  }

  const pendingCount = approvals.filter((a) => a.status === 'pending').length

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <h1 className="text-xl font-semibold text-text">Approvals</h1>
          <p className="text-xs text-text-muted mt-0.5">
            {pendingCount === 1 ? '1 approval waiting' : `${pendingCount} approvals waiting`} · Explicit review required before outbound dispatch or schedule change
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-surface border border-border text-text rounded-control px-2.5 py-1.5 text-xs outline-none focus:border-accent"
          >
            <option value="pending">Pending review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="all">All statuses</option>
          </select>
        </div>
      </div>

      {/* Two-Pane Inbox Layout */}
      {filtered.length === 0 ? (
        <div className="p-8 text-center rounded-card border border-border bg-surface space-y-2">
          <div className="w-10 h-10 rounded-full bg-surface-sunken border border-border text-text-muted flex items-center justify-center mx-auto">
            <CheckCheck className="w-5 h-5 text-success" />
          </div>
          <h3 className="text-sm font-semibold text-text">No approvals waiting</h3>
          <p className="text-xs text-text-muted max-w-sm mx-auto">
            All proposed actions, notifications, and timetable adjustments have been processed.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[520px]">
          {/* Left List (5 cols) */}
          <div className="lg:col-span-5 rounded-card border border-border bg-surface p-2 space-y-2 overflow-y-auto max-h-[640px]">
            <div className="px-2 py-1 text-[11px] font-medium text-text-muted uppercase tracking-wider border-b border-border">
              Action proposals ({filtered.length})
            </div>

            <div className="space-y-1.5">
              {filtered.map((item) => {
                const isSelected = selectedApproval?.id === item.id
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedApprovalId(item.id)}
                    className={cn(
                      'p-3 rounded-control border text-xs cursor-pointer transition-colors space-y-1.5',
                      isSelected
                        ? 'border-border-strong bg-surface-sunken'
                        : 'border-border bg-surface hover:bg-surface-sunken/50'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(item.type)}
                        <span className="font-medium text-text truncate max-w-[210px]">
                          {item.title}
                        </span>
                      </div>
                      <span className="text-[10px] text-text-muted shrink-0 tabular-nums">
                        {item.createdAt}
                      </span>
                    </div>

                    <p className="text-[11px] text-text-muted line-clamp-2 leading-relaxed">
                      {item.summary}
                    </p>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-text-muted truncate">
                        By {item.requester}
                      </span>
                      <ReasonChip reason={`${item.riskLevel} risk`} variant="neutral" />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right Detail Pane (7 cols) */}
          <div className="lg:col-span-7">
            {selectedApproval ? (
              <div className="sticky top-20">
                <ApprovalCard
                  approval={selectedApproval}
                  onApproved={() => setApprovals([...store.approvals])}
                  onRejected={() => setApprovals([...store.approvals])}
                />
              </div>
            ) : (
              <div className="p-8 text-center text-text-muted border border-border rounded-card bg-surface">
                Select an approval proposal from the left pane to inspect details.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
