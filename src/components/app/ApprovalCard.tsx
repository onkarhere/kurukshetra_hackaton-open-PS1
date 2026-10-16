import React, { useState } from 'react'
import {
  CheckCheck,
  X,
  Edit3,
  Send,
  Clock,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  GitCompare,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ReasonChip } from '@/components/ui/ReasonChip'
import { ApprovalAction } from '@/types'
import { store } from '@/mocks/store'
import { useToast } from '@/context/ToastContext'
import { cn } from '@/lib/utils'

interface ApprovalCardProps {
  approval: ApprovalAction
  onApproved?: () => void
  onRejected?: () => void
  compact?: boolean
}

export const ApprovalCard: React.FC<ApprovalCardProps> = ({
  approval,
  onApproved,
  onRejected,
  compact = false,
}) => {
  const { success } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [expandedRecipientId, setExpandedRecipientId] = useState<string | null>(null)
  const [selectedChannel, setSelectedChannel] = useState(approval.channel || 'whatsapp')
  const [isMorphed, setIsMorphed] = useState(approval.status === 'approved')

  const selectedRecipients = approval.recipients?.filter((r) => r.selected) || []
  const selectedCount = selectedRecipients.length

  const handleApprove = () => {
    store.approveProposal(approval.id)
    setIsMorphed(true)
    success('Action Approved & Executed', `${approval.title} has been dispatched.`)
    onApproved?.()
  }

  const handleReject = () => {
    store.rejectProposal(approval.id)
    onRejected?.()
  }

  const toggleRecipientSelect = (id: string) => {
    store.toggleRecipient(approval.id, id)
  }

  const handleMessageChange = (recipientId: string, val: string) => {
    store.updateRecipientMessage(approval.id, recipientId, val)
  }

  // Morphed State (spring animation to tick list)
  if (isMorphed || approval.status === 'approved') {
    return (
      <div className="rounded-card border border-success/30 bg-success/5 p-4 transition-all duration-300 animate-scale-in">
        <div className="flex items-center justify-between pb-3 border-b border-success/20">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-success/20 text-success flex items-center justify-center">
              <CheckCheck className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-fg">Action Approved & Dispatched</div>
              <div className="text-[11px] text-fg-muted">
                Approved by {approval.approvedBy || 'Owner'} · Just now
              </div>
            </div>
          </div>
          <span className="text-[11px] font-mono text-success font-medium">STATUS: 200 OK</span>
        </div>

        {approval.recipients && (
          <div className="mt-3 space-y-2">
            <div className="text-[11px] font-medium text-fg-muted uppercase tracking-wider">
              Dispatched Delivery Receipts ({approval.recipients.length})
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {approval.recipients.map((rec) => (
                <div
                  key={rec.id}
                  className="flex items-center justify-between py-1.5 px-2.5 rounded-btn bg-surface border border-success/20 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                    <span className="font-medium text-fg">{rec.name}</span>
                    <span className="text-fg-muted font-mono text-[11px]">{rec.phone}</span>
                  </div>
                  <span className="text-[11px] text-success font-medium flex items-center gap-1">
                    Delivered
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {approval.diff && (
          <div className="mt-3 space-y-2">
            <div className="text-[11px] font-medium text-fg-muted uppercase tracking-wider">
              Timetable Changes Applied
            </div>
            <div className="space-y-1.5 text-xs text-fg">
              {approval.diff.map((d, i) => (
                <div key={i} className="p-2 rounded bg-surface border border-success/20">
                  <div className="font-medium text-success">✓ {d.after}</div>
                  <ReasonChip reason={d.reason} variant="neutral" className="mt-1" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Rejected State
  if (approval.status === 'rejected') {
    return (
      <div className="rounded-card border border-border bg-surface-2 p-4 opacity-75">
        <div className="flex items-center gap-2 text-xs font-medium text-danger">
          <X className="w-4 h-4" />
          <span>Action Proposal Rejected</span>
        </div>
        <p className="text-xs text-fg-muted mt-1">{approval.title}</p>
      </div>
    )
  }

  // Active Pending Proposal
  return (
    <div
      className={cn(
        'rounded-card border border-ai/30 bg-surface shadow-hover transition-all overflow-hidden',
        compact ? 'p-3' : 'p-4'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-border">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono uppercase tracking-wider text-ai font-semibold bg-ai/10 px-2 py-0.5 rounded-full border border-ai/20">
              Proposed Action
            </span>
            <span
              className={cn(
                'text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1',
                approval.riskLevel === 'high'
                  ? 'bg-danger/10 text-danger border-danger/30'
                  : approval.riskLevel === 'medium'
                  ? 'bg-warning/10 text-warning border-warning/30'
                  : 'bg-surface-2 text-fg-muted border-border'
              )}
            >
              <ShieldAlert className="w-2.5 h-2.5" />
              {approval.riskLevel} risk
            </span>
          </div>
          <h4 className="text-sm font-semibold text-fg mt-1.5">{approval.title}</h4>
          <p className="text-xs text-fg-muted mt-0.5">{approval.summary}</p>
        </div>
        <div className="text-[11px] text-fg-muted shrink-0 text-right">
          <div>{approval.requester}</div>
          <div className="text-[10px] text-fg-muted/70">{approval.createdAt}</div>
        </div>
      </div>

      {/* WhatsApp / Message Recipients List */}
      {approval.recipients && (
        <div className="mt-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-fg-muted">
              Recipients ({selectedCount} of {approval.recipients.length} selected)
            </span>
            <div className="flex items-center gap-2">
              <label className="text-[11px] text-fg-muted flex items-center gap-1">
                Channel:
                <select
                  value={selectedChannel}
                  onChange={(e) => setSelectedChannel(e.target.value as any)}
                  className="bg-surface-2 border border-border text-fg rounded px-1.5 py-0.5 text-xs outline-none focus:border-primary"
                >
                  <option value="whatsapp">WhatsApp</option>
                  <option value="sms">SMS</option>
                  <option value="email">Email</option>
                </select>
              </label>
            </div>
          </div>

          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {approval.recipients.map((rec) => {
              const isExpanded = expandedRecipientId === rec.id
              return (
                <div
                  key={rec.id}
                  className="rounded-btn border border-border bg-surface-2/60 p-2.5 text-xs transition-colors hover:bg-surface-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rec.selected}
                        onChange={() => toggleRecipientSelect(rec.id)}
                        className="rounded border-border text-primary focus:ring-primary w-3.5 h-3.5"
                      />
                      <span className="font-medium text-fg">{rec.name}</span>
                      <span className="text-fg-muted font-mono text-[11px]">{rec.phone}</span>
                    </label>

                    <div className="flex items-center gap-2">
                      {rec.amountDue && (
                        <span className="text-xs font-mono font-medium text-amber-600 dark:text-amber-400">
                          Due: ₹{rec.amountDue.toLocaleString('en-IN')}
                        </span>
                      )}
                      <button
                        onClick={() => setExpandedRecipientId(isExpanded ? null : rec.id)}
                        className="text-fg-muted hover:text-fg p-0.5 rounded flex items-center gap-0.5 text-[11px]"
                      >
                        {isExpanded ? (
                          <>
                            Less <ChevronUp className="w-3 h-3" />
                          </>
                        ) : (
                          <>
                            Preview <ChevronDown className="w-3 h-3" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-2.5 pt-2 border-t border-border">
                      <label className="block text-[10px] text-fg-muted mb-1 font-mono uppercase">
                        Message Content (Variables highlighted)
                      </label>
                      <textarea
                        value={rec.customizedMessage || rec.messagePreview}
                        onChange={(e) => handleMessageChange(rec.id, e.target.value)}
                        rows={3}
                        className="w-full bg-surface border border-border rounded-btn p-2 text-xs font-sans text-fg focus:outline-none focus:border-ai leading-relaxed resize-none"
                      />
                      <div className="flex items-center justify-between text-[10px] text-fg-muted mt-1">
                        <span>Variables: {'{first_name}'}, {'{amount}'}, {'{due_date}'}</span>
                        <span className="font-mono">{(rec.customizedMessage || rec.messagePreview).length} chars</span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Delivery & Quiet Hours Meta */}
          <div className="flex items-center justify-between text-[11px] text-fg-muted bg-surface-2 px-3 py-2 rounded-btn border border-border">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-warning" />
              <span>{approval.sendTime || 'Queued for delivery'}</span>
            </div>
            <div className="font-mono text-fg">{approval.estimatedCost || 'Est. cost: ₹0.85'}</div>
          </div>
        </div>
      )}

      {/* Timetable Diff Details */}
      {approval.diff && (
        <div className="mt-3.5 space-y-2">
          <div className="text-xs font-medium text-fg-muted">Planned Changes & Conflicts Resolved</div>
          <div className="space-y-2">
            {approval.diff.map((d, i) => (
              <div key={i} className="p-2.5 rounded-btn bg-surface-2 border border-border text-xs space-y-1">
                <div className="text-fg-muted line-through font-mono text-[11px]">Old: {d.before}</div>
                <div className="text-fg font-medium flex items-center gap-1.5 font-mono text-[11px]">
                  <GitCompare className="w-3.5 h-3.5 text-ai shrink-0" />
                  <span>New: {d.after}</span>
                </div>
                <ReasonChip reason={d.reason} variant="warning" className="mt-1" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Controls: Reject, Edit, Approve */}
      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={handleReject} className="text-danger hover:text-danger hover:bg-danger/10">
          Reject Proposal
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            leftIcon={<Edit3 className="w-3.5 h-3.5" />}
          >
            {isEditing ? 'Done Editing' : 'Edit Draft'}
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleApprove}
            disabled={approval.recipients ? selectedCount === 0 : false}
            leftIcon={<Send className="w-3.5 h-3.5" />}
            className="bg-primary hover:bg-primary-hover shadow-sm"
          >
            {approval.recipients ? `Approve & Send (${selectedCount})` : 'Approve & Apply'}
          </Button>
        </div>
      </div>
    </div>
  )
}
