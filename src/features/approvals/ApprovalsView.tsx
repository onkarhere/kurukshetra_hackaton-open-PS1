import React, { useState } from 'react'
import {
  CheckCheck,
  Filter,
  Layers,
  Sparkles,
  Calendar,
  MessageSquare,
  DollarSign,
  ShieldAlert,
  Inbox,
  CheckCircle2,
} from 'lucide-react'
import { ApprovalCard } from '@/components/app/ApprovalCard'
import { ReasonChip } from '@/components/ui/ReasonChip'
import { StatusPill } from '@/components/ui/StatusPill'
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
        return <MessageSquare className="w-4 h-4 text-ai" />
      case 'timetable_replan':
        return <Calendar className="w-4 h-4 text-primary" />
      case 'fee_waiver':
        return <DollarSign className="w-4 h-4 text-warning" />
      default:
        return <Layers className="w-4 h-4 text-fg-muted" />
    }
  }

  return (
    <div className="space-y-4 animate-fade-in select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-fg">Approvals Inbox</h1>
          <p className="text-xs text-fg-muted mt-0.5">
            Nothing happens without your explicit consent · AI proposed actions, timetable modifications & waivers
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-surface-2 border border-border text-fg rounded-btn px-2.5 py-1.5 text-xs outline-none focus:border-primary"
          >
            <option value="pending">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="all">All Statuses</option>
          </select>
        </div>
      </div>

      {/* Two-Pane Inbox Layout */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center rounded-card border border-border bg-surface space-y-3">
          <div className="w-12 h-12 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto">
            <CheckCheck className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-fg">All Clear! No Approvals Waiting</h3>
          <p className="text-xs text-fg-muted max-w-sm mx-auto">
            All AI operations, WhatsApp dispatches and timetable re-plans have been processed.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[550px]">
          {/* Left List (5 cols) */}
          <div className="lg:col-span-5 rounded-card border border-border bg-surface p-2 space-y-2 overflow-y-auto max-h-[640px] shadow-sm">
            <div className="px-2 py-1 text-[11px] font-mono text-fg-muted uppercase tracking-wider font-semibold border-b border-border">
              Action Proposals ({filtered.length})
            </div>

            <div className="space-y-1.5">
              {filtered.map((item) => {
                const isSelected = selectedApproval?.id === item.id
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedApprovalId(item.id)}
                    className={cn(
                      'p-3 rounded-btn border text-xs cursor-pointer transition-all space-y-1.5',
                      isSelected
                        ? 'border-primary/50 bg-primary/5 shadow-sm'
                        : 'border-border bg-surface hover:bg-surface-2'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(item.type)}
                        <span className="font-semibold text-fg truncate max-w-[210px]">
                          {item.title}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-fg-muted shrink-0">
                        {item.createdAt}
                      </span>
                    </div>

                    <p className="text-[11px] text-fg-muted line-clamp-2 leading-relaxed">
                      {item.summary}
                    </p>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-fg-muted font-mono truncate">
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
              <div className="p-8 text-center text-fg-muted border border-border rounded-card bg-surface">
                Select an approval proposal from the left pane to inspect recipients and parameters.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
