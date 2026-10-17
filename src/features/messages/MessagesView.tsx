import React, { useState } from 'react'
import {
  Send,
  Clock,
  CheckCircle2,
  AlertOctagon,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/context/ToastContext'
import { cn } from '@/lib/utils'
import { store, useStore } from '@/mocks/store'
import { ApprovalAction } from '@/types'

export const MessagesView: React.FC = () => {
  const { success, error: toastError } = useToast()
  const outbox = useStore((s) => s.messages)
  const batches = useStore((s) => s.batches)
  const students = useStore((s) => s.students)
  const instalments = useStore((s) => s.feeInstalments)

  const [activeTab, setActiveTab] = useState<'outbox' | 'templates'>('outbox')
  const [showBroadcastModal, setShowBroadcastModal] = useState(false)

  // Broadcast modal form state
  const [targetAudience, setTargetAudience] = useState<'all' | 'batch' | 'risk_critical' | 'overdue_emi'>('batch')
  const [selectedBatchId, setSelectedBatchId] = useState(batches[0]?.id || '')
  const [channel, setChannel] = useState<'whatsapp' | 'sms' | 'email'>('whatsapp')
  const [customText, setCustomText] = useState('')

  const templates = [
    {
      id: 'tmpl-1',
      title: 'EMI Due Soon Reminder',
      channel: 'WhatsApp',
      body: 'Hi {first_name}, friendly reminder that your instalment of {amount} for {batch_name} is due on {due_date}. Pay securely: {pay_link}',
      variables: ['first_name', 'amount', 'batch_name', 'due_date', 'pay_link'],
    },
    {
      id: 'tmpl-2',
      title: 'Absenteeism Catch-up Alert',
      channel: 'WhatsApp',
      body: 'Hi {first_name}, we missed you in {batch_name} today! Catch up with the recording here: {recording_link}. Reach out to faculty {trainer_name} if you have doubts.',
      variables: ['first_name', 'batch_name', 'recording_link', 'trainer_name'],
    },
    {
      id: 'tmpl-3',
      title: 'Timetable Change Notification',
      channel: 'SMS',
      body: 'Batchwise Alert: Your class {batch_name} has been rescheduled to {new_time} in {new_room}. Please check portal for details.',
      variables: ['batch_name', 'new_time', 'new_room'],
    },
  ]

  const handleCreateBroadcast = () => {
    let targetStudents = students

    if (targetAudience === 'batch') {
      targetStudents = students.filter((s) => s.batchIds.includes(selectedBatchId))
    } else if (targetAudience === 'risk_critical') {
      targetStudents = students.filter((s) => s.riskLevel === 'critical' || s.riskLevel === 'high')
    } else if (targetAudience === 'overdue_emi') {
      const overdueIds = new Set(instalments.filter((i) => i.status === 'overdue').map((i) => i.studentId))
      targetStudents = students.filter((s) => overdueIds.has(s.id))
    }

    if (targetStudents.length === 0) {
      toastError('No recipients', 'No students match the chosen criteria.')
      return
    }

    const messageTemplate = customText.trim() || 'Hello {name}, this is an important academic update from CodeCraft Academy.'

    const newApproval: ApprovalAction = {
      id: `appr-${Date.now()}`,
      type: 'whatsapp_bulk',
      title: `Broadcast to ${targetStudents.length} students (${targetAudience})`,
      summary: `Automated ${channel} message dispatch to ${targetStudents.length} recipients`,
      requester: store.currentUser.name,
      requesterRole: store.currentUser.role,
      createdAt: 'Just now',
      riskLevel: targetStudents.length > 20 ? 'high' : 'medium',
      status: 'pending',
      recipientCount: targetStudents.length,
      channel,
      sendTime: 'Immediately upon approval',
      estimatedCost: `₹${(targetStudents.length * 0.17).toFixed(2)}`,
      recipients: targetStudents.map((st) => ({
        id: st.id,
        name: st.name,
        phone: st.phone,
        messagePreview: messageTemplate.replace('{name}', st.name),
        customizedMessage: messageTemplate.replace('{name}', st.name),
        selected: true,
      })),
    }

    store.approvals.unshift(newApproval)
    store.notify()

    setShowBroadcastModal(false)
    setCustomText('')
    success('Broadcast staged for approval', `Created approval for ${targetStudents.length} recipients.`)
  }

  const renderStatus = (status: string) => {
    switch (status) {
      case 'read':
        return (
          <span className="inline-flex items-center gap-1 text-accent text-xs">
            <CheckCircle2 className="w-3.5 h-3.5" /> Read
          </span>
        )
      case 'delivered':
      case 'sent':
        return (
          <span className="inline-flex items-center gap-1 text-success text-xs">
            <CheckCircle2 className="w-3.5 h-3.5" /> {status === 'sent' ? 'Sent' : 'Delivered'}
          </span>
        )
      case 'queued':
        return (
          <span className="inline-flex items-center gap-1 text-text-muted text-xs">
            <Clock className="w-3.5 h-3.5" /> Queued
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 text-danger text-xs">
            <AlertOctagon className="w-3.5 h-3.5" /> Failed
          </span>
        )
    }
  }

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <h1 className="text-xl font-semibold text-text">Messages</h1>
          <p className="text-xs text-text-muted mt-0.5">
            Outbound WhatsApp dispatches, automated reminder delivery, and template management
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowBroadcastModal(true)}
          leftIcon={<Send className="w-3.5 h-3.5" />}
        >
          New broadcast
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border text-xs font-medium">
        <button
          onClick={() => setActiveTab('outbox')}
          className={cn(
            'py-2 px-3 border-b-2 transition-colors',
            activeTab === 'outbox'
              ? 'border-accent text-text font-semibold'
              : 'border-transparent text-text-muted hover:text-text'
          )}
        >
          Outbox ({outbox.length})
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={cn(
            'py-2 px-3 border-b-2 transition-colors',
            activeTab === 'templates'
              ? 'border-accent text-text font-semibold'
              : 'border-transparent text-text-muted hover:text-text'
          )}
        >
          Notification templates ({templates.length})
        </button>
      </div>

      {/* Outbox View */}
      {activeTab === 'outbox' && (
        <div className="rounded-card border border-border bg-surface overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-sunken border-b border-border text-[11px] font-medium text-text-muted sticky top-0">
              <tr>
                <th className="py-2 px-3">Recipient</th>
                <th className="py-2 px-3">Channel</th>
                <th className="py-2 px-3">Message</th>
                <th className="py-2 px-3">Sent time (IST)</th>
                <th className="py-2 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {outbox.map((msg) => (
                <tr key={msg.id} className="hover:bg-surface-sunken/40 h-10 transition-colors">
                  <td className="px-3 font-medium text-text">
                    <div>{msg.studentName || 'Student'}</div>
                    <div className="font-mono text-[10px] text-text-muted">{msg.to}</div>
                  </td>
                  <td className="px-3 text-text-muted uppercase text-[10px] font-mono">{msg.channel}</td>
                  <td className="px-3 text-text max-w-md truncate">{msg.body}</td>
                  <td className="px-3 text-text-muted text-[11px] tabular-nums whitespace-nowrap">
                    {msg.createdAt}
                  </td>
                  <td className="px-3 whitespace-nowrap">
                    {renderStatus(msg.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Templates View */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {templates.map((tmpl) => (
            <div
              key={tmpl.id}
              className="p-4 rounded-card border border-border bg-surface space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-xs text-text">{tmpl.title}</span>
                <span className="text-[10px] font-mono text-text-muted border border-border px-1.5 py-0.5 rounded bg-surface-sunken">
                  {tmpl.channel}
                </span>
              </div>

              <p className="text-xs text-text-muted leading-relaxed font-sans bg-surface-sunken p-2.5 rounded-control border border-border">
                {tmpl.body}
              </p>

              <div className="space-y-1">
                <div className="text-[10px] uppercase font-medium text-text-muted">
                  Variables:
                </div>
                <div className="flex flex-wrap gap-1">
                  {tmpl.variables.map((v, idx) => (
                    <span
                      key={idx}
                      className="px-1.5 py-0.5 rounded border border-border bg-surface text-text-muted text-[10px] font-mono"
                    >
                      {`{${v}}`}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Broadcast Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface border border-border rounded-dialog shadow-dialog p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-semibold text-text">Compose new broadcast</h3>
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="text-text-muted hover:text-text p-1"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-text-muted mb-1">
                  Target Audience
                </label>
                <select
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 rounded-control border border-border bg-surface text-text text-xs outline-none"
                >
                  <option value="batch">Specific Batch</option>
                  <option value="risk_critical">Academic Risk (Critical & High)</option>
                  <option value="overdue_emi">Overdue Fee Accounts</option>
                  <option value="all">All Enrolled Students</option>
                </select>
              </div>

              {targetAudience === 'batch' && (
                <div>
                  <label className="block text-[11px] font-medium text-text-muted mb-1">
                    Select Batch
                  </label>
                  <select
                    value={selectedBatchId}
                    onChange={(e) => setSelectedBatchId(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-control border border-border bg-surface text-text text-xs outline-none"
                  >
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.enrolledCount} students)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-medium text-text-muted mb-1">
                  Delivery Channel
                </label>
                <div className="flex items-center gap-2">
                  {(['whatsapp', 'sms', 'email'] as const).map((ch) => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => setChannel(ch)}
                      className={cn(
                        'flex-1 py-1.5 rounded-control border text-xs capitalize transition-colors',
                        channel === ch
                          ? 'border-accent bg-accent/10 text-accent font-medium'
                          : 'border-border bg-surface text-text-muted hover:text-text'
                      )}
                    >
                      {ch}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-text-muted mb-1">
                  Message Content (supports {'{name}'})
                </label>
                <textarea
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Hi {name}, friendly reminder that class starts at 19:00 IST today in Room 3."
                  rows={3}
                  className="w-full px-2.5 py-1.5 rounded-control border border-border bg-surface text-text text-xs outline-none focus:border-accent resize-none font-sans"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBroadcastModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleCreateBroadcast}
                leftIcon={<Send className="w-3.5 h-3.5" />}
              >
                Stage for approval
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
