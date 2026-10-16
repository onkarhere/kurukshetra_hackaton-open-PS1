import React, { useState } from 'react'
import {
  MessageSquare,
  Send,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  FileText,
  Filter,
} from 'lucide-react'
import { StatusPill } from '@/components/ui/StatusPill'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/context/ToastContext'

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
      content: 'Hi Priya, your EMI of ₹6,500 for Java Full-Stack B3 was due on 04 Oct. Please clear it online: codecraft.ac.in/pay',
      sentAt: '16 Oct 10:30 IST',
      status: 'read',
    },
    {
      id: 'msg-02',
      recipient: 'Rohan Kulkarni',
      phone: '+91 98450 11988',
      channel: 'WhatsApp',
      content: 'Hi Rohan, your 2nd EMI of ₹6,500 for Java Full-Stack B3 is 18 days overdue. Please settle this today.',
      sentAt: '16 Oct 10:30 IST',
      status: 'delivered',
    },
    {
      id: 'msg-03',
      recipient: 'Devendra Joshi',
      phone: '+91 98902 44781',
      channel: 'WhatsApp',
      content: 'Hi Devendra, friendly reminder that your EMI of ₹6,500 for Java Full-Stack B3 is due tomorrow.',
      sentAt: '16 Oct 10:30 IST',
      status: 'delivered',
    },
    {
      id: 'msg-04',
      recipient: 'Amit Sane',
      phone: '+91 97631 88920',
      channel: 'WhatsApp',
      content: 'Hi Amit, your EMI of ₹6,500 for Java Full-Stack B3 is due on 17 Oct. Pay online: codecraft.ac.in/pay',
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

  return (
    <div className="space-y-4 animate-fade-in select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-fg">Communications & Outbox</h1>
          <p className="text-xs text-fg-muted mt-0.5">
            Automated WhatsApp reminders, SMS broadcasts & delivery audit logs
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => success('New broadcast composer launched.')}
          leftIcon={<Send className="w-3.5 h-3.5" />}
        >
          New Broadcast
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border text-xs font-medium">
        <button
          onClick={() => setActiveTab('outbox')}
          className={`py-2 px-3 border-b-2 transition-colors ${
            activeTab === 'outbox'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-fg-muted hover:text-fg'
          }`}
        >
          Message Outbox ({outbox.length})
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`py-2 px-3 border-b-2 transition-colors ${
            activeTab === 'templates'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-fg-muted hover:text-fg'
          }`}
        >
          Notification Templates ({templates.length})
        </button>
      </div>

      {/* Outbox View */}
      {activeTab === 'outbox' && (
        <div className="rounded-card border border-border bg-surface overflow-x-auto shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-2 border-b border-border text-[11px] font-semibold text-fg-muted uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Recipient</th>
                <th className="py-2.5 px-3">Channel</th>
                <th className="py-2.5 px-3">Message Content</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Delivery Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {outbox.map((msg) => (
                <tr key={msg.id} className="hover:bg-surface-2/40 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-fg">
                    <div>{msg.recipient}</div>
                    <div className="font-mono text-[11px] text-fg-muted">{msg.phone}</div>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-mono text-primary font-medium">{msg.channel}</span>
                  </td>
                  <td className="py-2.5 px-3 text-fg leading-relaxed max-w-md">
                    {msg.content}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-fg-muted text-[11px]">
                    {msg.sentAt}
                  </td>
                  <td className="py-2.5 px-3">
                    <StatusPill status={msg.status} size="sm" />
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
              className="p-4 rounded-card border border-border bg-surface space-y-3 shadow-sm hover:border-primary/40 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-fg">{tmpl.title}</span>
                <span className="text-[10px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                  {tmpl.channel}
                </span>
              </div>

              <p className="text-xs text-fg-muted leading-relaxed font-sans bg-surface-2 p-2.5 rounded-btn border border-border">
                {tmpl.body}
              </p>

              <div className="space-y-1">
                <div className="text-[10px] font-mono uppercase text-fg-muted font-semibold">
                  Variables:
                </div>
                <div className="flex flex-wrap gap-1">
                  {tmpl.variables.map((v, idx) => (
                    <span
                      key={idx}
                      className="px-1.5 py-0.5 rounded bg-ai/10 text-ai text-[10px] font-mono"
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
