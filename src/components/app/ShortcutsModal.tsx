import React from 'react'
import { X, Command, Keyboard } from 'lucide-react'
import { useApp } from '@/context/AppContext'

export const ShortcutsModal: React.FC = () => {
  const { shortcutsOpen, setShortcutsOpen } = useApp()

  if (!shortcutsOpen) return null

  const shortcutGroups = [
    {
      group: 'Navigation',
      items: [
        { keys: ['G', 'H'], desc: 'Go to Home / Dashboard' },
        { keys: ['G', 'S'], desc: 'Go to Students directory' },
        { keys: ['G', 'B'], desc: 'Go to Batches' },
        { keys: ['G', 'T'], desc: 'Go to Timetable & Scheduling' },
        { keys: ['G', 'F'], desc: 'Go to Fees & EMIs (Owner/Admin)' },
        { keys: ['G', 'A'], desc: 'Go to Approvals Inbox' },
      ],
    },
    {
      group: 'Copilot & Actions',
      items: [
        { keys: ['⌘', 'K'], desc: 'Open Command Palette' },
        { keys: ['⌘', 'J'], desc: 'Toggle Copilot Assistant Drawer' },
        { keys: ['⌘', '↵'], desc: 'Submit AI query or form' },
        { keys: ['R'], desc: 'Re-plan timetable / simulate leave' },
        { keys: ['A', 'Y'], desc: 'Approve focused proposal' },
        { keys: ['C'], desc: 'Create new entity' },
        { keys: ['?'], desc: 'Show this keyboard shortcuts sheet' },
      ],
    },
    {
      group: 'Tables & Selection',
      items: [
        { keys: ['/'], desc: 'Focus search or filter bar' },
        { keys: ['J', 'K'], desc: 'Navigate rows down / up' },
        { keys: ['X'], desc: 'Toggle row checkbox selection' },
        { keys: ['Esc'], desc: 'Close open drawer or modal' },
      ],
    },
  ]

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in select-none"
      onClick={() => setShortcutsOpen(false)}
    >
      <div
        className="w-full max-w-lg bg-surface border border-border rounded-modal shadow-modal p-6 text-fg overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-semibold">Keyboard Shortcuts</h3>
          </div>
          <button
            onClick={() => setShortcutsOpen(false)}
            className="text-fg-muted hover:text-fg p-1 rounded-btn transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 space-y-5 max-h-[460px] overflow-y-auto pr-1">
          {shortcutGroups.map((grp, i) => (
            <div key={i} className="space-y-2">
              <div className="text-[11px] font-mono uppercase tracking-wider text-fg-muted font-semibold">
                {grp.group}
              </div>
              <div className="space-y-1.5">
                {grp.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-1.5 px-2 rounded-btn bg-surface-2/60 text-xs"
                  >
                    <span className="text-fg-muted">{item.desc}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((k, kIdx) => (
                        <span
                          key={kIdx}
                          className="px-1.5 py-0.5 rounded bg-surface border border-border font-mono text-[11px] text-fg font-semibold shadow-sm"
                        >
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
