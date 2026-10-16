import React from 'react'
import { X, Keyboard } from 'lucide-react'
import { useApp } from '@/context/AppContext'

export const ShortcutsModal: React.FC = () => {
  const { shortcutsOpen, setShortcutsOpen } = useApp()

  if (!shortcutsOpen) return null

  const shortcutGroups = [
    {
      group: 'Navigation',
      items: [
        { keys: ['G', 'H'], desc: 'Go to Home' },
        { keys: ['G', 'A'], desc: 'Go to Approvals' },
        { keys: ['G', 'T'], desc: 'Go to Timetable' },
        { keys: ['G', 'S'], desc: 'Go to Students' },
        { keys: ['G', 'B'], desc: 'Go to Batches' },
        { keys: ['G', 'F'], desc: 'Go to Fees & EMIs (Owner/Accounts only)' },
      ],
    },
    {
      group: 'Command bar & actions',
      items: [
        { keys: ['⌘', 'K'], desc: 'Open command bar' },
        { keys: ['⌘', 'J'], desc: 'Ask (opens query sheet)' },
        { keys: ['⌘', '↵'], desc: 'Submit query or form' },
        { keys: ['R'], desc: 'Re-plan timetable / simulate leave' },
        { keys: ['?'], desc: 'Show keyboard shortcuts' },
      ],
    },
    {
      group: 'Tables & navigation',
      items: [
        { keys: ['/'], desc: 'Focus search or filter' },
        { keys: ['J', 'K'], desc: 'Navigate rows down / up' },
        { keys: ['X'], desc: 'Toggle row selection' },
        { keys: ['Esc'], desc: 'Close dialog or sheet' },
      ],
    },
  ]

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 select-none"
      onClick={() => setShortcutsOpen(false)}
    >
      <div
        className="w-full max-w-lg bg-surface border border-border rounded-dialog shadow-[0_16px_48px_rgba(0,0,0,0.16)] p-6 text-text overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-text-muted" />
            <h3 className="text-sm font-semibold text-text">Keyboard shortcuts</h3>
          </div>
          <button
            onClick={() => setShortcutsOpen(false)}
            className="text-text-muted hover:text-text p-1 rounded-control transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 space-y-5 max-h-[460px] overflow-y-auto pr-1">
          {shortcutGroups.map((grp, i) => (
            <div key={i} className="space-y-2">
              <div className="text-xs font-medium text-text-muted">
                {grp.group}
              </div>
              <div className="space-y-1">
                {grp.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-1.5 px-2.5 rounded-control bg-surface-sunken text-xs"
                  >
                    <span className="text-text-muted">{item.desc}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((k, kIdx) => (
                        <span
                          key={kIdx}
                          className="px-1.5 py-0.5 rounded-control bg-surface border border-border font-mono text-[11px] text-text font-normal"
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
