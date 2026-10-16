import React, { useState } from 'react'
import {
  Check,
  X,
  Edit3,
  Send,
  Clock,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  GitCompare,
  Lock,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ReasonChip } from '@/components/ui/ReasonChip'
import { ApprovalAction } from '@/types'
import { store } from '@/mocks/store'
import { useToast } from '@/context/ToastContext'
import { cn, formatINR } from '@/lib/utils'

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
  const [isApproved, setIsApproved] = useState(approval.status === 'approved')

  const selectedRecipients = approval.recipients?.filter((r) => r.selected) || []
  const selectedCount = selectedRecipients.length

  const handleApprove = () => {
    store.approveProposal(approval.id)
    setIsApproved(true)
    success('Action approved', `${approval.title} dispatched.`)
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

  // Approved State (Clean state change, no bouncing)
  if (isApproved || approval.status === 'approved') {
    return (
      <div className="rounded-card border border-border bg-surface p-4 text-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-success" strokeWidth={1.5} />
            <div>
              <div className="font-medium text-text">Action approved and dispatched</div>
              <div className="text-text-muted text-[11px]">
                Approved by {approval.approvedBy || 'Owner'} · Today
              </div>
            </div>
          </div>
          <span className="text-[11px] font-mono text-text-muted">Status: 200 OK</span>
        </div>

        {approval.recipients && (
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {approval.recipients.map((rec) => (
              <div
                key={rec.id}
                className="flex items-center justify-between py-1.5 px-2.5 rounded-control bg-surface-sunken border border-border text-xs"
              >
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-success" strokeWidth={1.5} />
                  <span className="text-text">{rec.name}</span>
                  <span className="text-text-muted font-mono text-[11px]">{rec.phone}</span>
                </div>
                <span className="text-text-muted text-[11px]">Delivered</span>
              </div>
            ))}
          </div>
        )}

        {approval.diff && (
          <div className="space-y-1.5 text-xs text-text">
            {approval.diff.map((d, i) => (
              <div key={i} className="p-2 rounded-control bg-surface-sunken border border-border">
                <div className="font-normal text-text">{d.after}</div>
                <ReasonChip reason={d.reason} variant="neutral" className="mt-1" />
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Rejected State
  if (approval.status === 'rejected') {
    return (
      <div className="rounded-card border border-border bg-surface-sunken p-4 text-xs">
        <div className="flex items-center gap-2 font-medium text-text-muted">
          <X className="w-4 h-4 text-danger" strokeWidth={1.5} />
          <span>Proposal rejected</span>
        </div>
        <p className="text-text-muted mt-1">{approval.title}</p>
      </div>
    )
  }

  // Active Pending Proposal
  return (
    <div
      className={cn(
        'rounded-card border border-border bg-surface overflow-hidden',
        compact ? 'p-3' : 'p-4'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-text-muted bg-surface-sunken border border-border px-1.5 py-0.5 rounded-control">
              Action proposed
            </span>
            <span className="text-xs text-text-muted">
              {approval.riskLevel === 'high'
                ? 'High risk'
                : approval.riskLevel === 'medium'
                ? 'Medium risk'
                : 'Low risk'}
            </span>
          </div>
          <h4 className="text-sm font-semibold text-text mt-1.5">{approval.title}</h4>
          <p className="text-xs text-text-muted mt-0.5">{approval.summary}</p>
        </div>
        <div className="text-xs text-text-muted shrink-0 text-right">
          <div>{approval.requester}</div>
          <div className="text-[11px] text-text-muted">{approval.createdAt}</div>
        </div>
      </div>

      {/* Recipients List */}
      {approval.recipients && (
        <div className="mt-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>
              Recipients ({selectedCount} of {approval.recipients.length} selected)
            </span>
            <div className="flex items-center gap-2">
              <label className="text-xs text-text-muted flex items-center gap-1">
                Channel:
                <select
                  value={selectedChannel}
                  onChange={(e) => setSelectedChannel(e.target.value as any)}
                  className="bg-surface-sunken border border-border-strong text-text rounded-control px-2 py-0.5 text-xs outline-none focus:border-accent"
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
                  className="rounded-control border border-border bg-surface-sunken p-2.5 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rec.selected}
                        onChange={() => toggleRecipientSelect(rec.id)}
                        className="rounded-control border-border-strong text-accent focus:ring-accent w-3.5 h-3.5"
                      />
                      <span className="font-medium text-text">{rec.name}</span>
                      <span className="text-text-muted font-mono text-[11px]">{rec.phone}</span>
                    </label>

                    <div className="flex items-center gap-2">
                      {rec.amountDue && (
                        <span className="text-xs text-text tnum">
                          {formatINR(rec.amountDue)}
                        </span>
                      )}
                      <button
                        onClick={() => setExpandedRecipientId(isExpanded ? null : rec.id)}
                        className="text-text-muted hover:text-text p-0.5 rounded text-xs flex items-center gap-0.5"
                      >
                        {isExpanded ? (
                          <>
                            Less <ChevronUp className="w-3 h-3" strokeWidth={1.5} />
                          </>
                        ) : (
                          <>
                            Edit <ChevronDown className="w-3 h-3" strokeWidth={1.5} />
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-2.5 pt-2 border-t border-border">
                      <label className="block text-[11px] text-text-muted mb-1 font-mono">
                        Draft message text
                      </label>
                      <textarea
                        value={rec.customizedMessage || rec.messagePreview}
                        onChange={(e) => handleMessageChange(rec.id, e.target.value)}
                        rows={3}
                        className="w-full bg-surface border border-border-strong rounded-control p-2 text-xs font-sans text-text focus:outline-none focus:border-accent leading-relaxed resize-none"
                      />
                      <div className="flex items-center justify-between text-[11px] text-text-muted mt-1 font-mono">
                        <span>Variables: {`{first_name}`}, {`{amount}`}, {`{due_date}`}</span>
                        <span>{(rec.customizedMessage || rec.messagePreview).length} chars</span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Delivery & Quiet Hours Meta */}
          <div className="flex items-center justify-between text-xs text-text-muted bg-surface-sunken px-3 py-2 rounded-control border border-border">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-text-muted" strokeWidth={1.5} />
              <span>{approval.sendTime || 'Queued for delivery'}</span>
            </div>
            <div className="text-text tnum">{approval.estimatedCost || 'Est. cost: ₹0.85'}</div>
          </div>
        </div>
      )}

      {/* Timetable Diff Details */}
      {approval.diff && (
        <div className="mt-3.5 space-y-2">
          <div className="text-xs text-text-muted">Planned adjustments</div>
          <div className="space-y-2">
            {approval.diff.map((d, i) => (
              <div key={i} className="p-2.5 rounded-control bg-surface-sunken border border-border text-xs space-y-1">
                <div className="text-text-muted line-through font-mono text-[11px]">Old: {d.before}</div>
                <div className="text-text font-normal flex items-center gap-1.5 font-mono text-[11px]">
                  <GitCompare className="w-3.5 h-3.5 text-accent shrink-0" strokeWidth={1.5} />
                  <span>New: {d.after}</span>
                </div>
                <ReasonChip reason={d.reason} variant="neutral" className="mt-1" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Controls: EXACTLY ONE primary button per card */}
      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={handleReject} className="text-danger hover:text-danger hover:bg-danger-subtle">
          Reject
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? 'Done' : 'Edit details'}
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleApprove}
            disabled={approval.recipients ? selectedCount === 0 : false}
          >
            {approval.recipients ? `Approve and send (${selectedCount})` : 'Approve and apply'}
          </Button>
        </div>
      </div>
    </div>
  )
}
