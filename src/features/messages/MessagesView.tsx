import React, { useState } from 'react'
import {
  MessageSquare,
  Send,
  Clock,
  CheckCircle2,
  AlertOctagon,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/context/ToastContext'
import { cn } from '@/lib/utils'

interface MessageRecord {
  id: string
  recipient: string
  phone: string
  channel: 'WhatsApp' | 'SMS' | 'Email'
  content: string
  sentAt: string
  status: 'delivered' | 'read' | 'queued' | 'failed'
}

export const MessagesView: React.FC = () => {
  const { success } = useToast()
  const [activeTab, setActiveTab] = useState<'outbox' | 'templates'>('outbox')

  const outbox: MessageRecord[] = [
    {
      id: 'msg-01',
      recipient: 'Priya Nair',
      phone: '+91 98201 55432',
      channel: 'WhatsApp',
      content: 'Hi Priya, your EMI of ₹6,500 for Java Full-Stack B3 (Kothrud) was due on 04 Oct. Please clear it online: codecraft.ac.in/pay',
      sentAt: '16 Oct 10:30 IST',
      status: 'read',
    },
    {
      id: 'msg-02',
      recipient: 'Rohan Kulkarni',
      phone: '+91 98450 11988',
      channel: 'WhatsApp',
      content: 'Hi Rohan, your 2nd EMI of ₹6,500 for Java Full-Stack B3 (Kothrud) is 18 days overdue. Please settle this today.',
      sentAt: '16 Oct 10:30 IST',
      status: 'delivered',
    },
    {
      id: 'msg-03',
      recipient: 'Devendra Joshi',
      phone: '+91 98902 44781',
      channel: 'WhatsApp',
      content: 'Hi Devendra, friendly reminder that your EMI of ₹6,500 for Java Full-Stack B3 (Kothrud) is due tomorrow.',
      sentAt: '16 Oct 10:30 IST',
      status: 'delivered',
    },
    {
      id: 'msg-04',
      recipient: 'Amit Sane',
      phone: '+91 97631 88920',
      channel: 'WhatsApp',
      content: 'Hi Amit, your EMI of ₹6,500 for Java Full-Stack B3 (Kothrud) is due on 17 Oct. Pay online: codecraft.ac.in/pay',
      sentAt: '16 Oct 10:30 IST',
      status: 'queued',
    },
  ]

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

  const renderStatus = (status: string) => {
    switch (status) {
      case 'read':
        return (
          <span className="inline-flex items-center gap-1 text-accent text-xs">
            <CheckCircle2 className="w-3.5 h-3.5" /> Read
          </span>
        )
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 text-success text-xs">
            <CheckCircle2 className="w-3.5 h-3.5" /> Delivered
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
          onClick={() => success('New broadcast composer launched.')}
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
                    <div>{msg.recipient}</div>
                    <div className="font-mono text-[10px] text-text-muted">{msg.phone}</div>
                  </td>
                  <td className="px-3 text-text-muted">{msg.channel}</td>
                  <td className="px-3 text-text max-w-md truncate">{msg.content}</td>
                  <td className="px-3 text-text-muted text-[11px] tabular-nums whitespace-nowrap">
                    {msg.sentAt}
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
    </div>
  )
}
