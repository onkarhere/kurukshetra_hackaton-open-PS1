import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Sparkles,
  UserPlus,
  Layers,
  ClipboardCheck,
  Calendar,
  CreditCard,
  GraduationCap,
  Award,
  ChevronRight,
  X,
} from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { store } from '@/mocks/store'

interface CommandItem {
  id: string
  label: string
  category: 'Commands' | 'Entities'
  shortcut?: string
  icon: React.ReactNode
  action: () => void
}

export const CommandPalette: React.FC = () => {
  const { commandPaletteOpen, setCommandPaletteOpen, setCopilotOpen } = useApp()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [commandPaletteOpen])

  if (!commandPaletteOpen) return null

  const commands: CommandItem[] = [
    {
      id: 'cmd-student-new',
      label: 'New Student Registration',
      category: 'Commands',
      shortcut: 'C S',
      icon: <UserPlus className="w-4 h-4 text-primary" />,
      action: () => {
        setCommandPaletteOpen(false)
        navigate('/students?action=new')
      },
    },
    {
      id: 'cmd-batch-new',
      label: 'Create New Batch',
      category: 'Commands',
      shortcut: 'C B',
      icon: <Layers className="w-4 h-4 text-primary" />,
      action: () => {
        setCommandPaletteOpen(false)
        navigate('/batches?action=new')
      },
    },
    {
      id: 'cmd-mark-attendance',
      label: 'Mark Session Attendance / Launch QR',
      category: 'Commands',
      shortcut: 'A',
      icon: <ClipboardCheck className="w-4 h-4 text-success" />,
      action: () => {
        setCommandPaletteOpen(false)
        navigate('/sessions/sess-m2')
      },
    },
    {
      id: 'cmd-gen-timetable',
      label: 'Generate Clash-Free Timetable',
      category: 'Commands',
      shortcut: 'R',
      icon: <Calendar className="w-4 h-4 text-warning" />,
      action: () => {
        setCommandPaletteOpen(false)
        navigate('/timetable')
      },
    },
    {
      id: 'cmd-view-approvals',
      label: 'View Pending Approvals Inbox',
      category: 'Commands',
      shortcut: 'G A',
      icon: <Layers className="w-4 h-4 text-ai" />,
      action: () => {
        setCommandPaletteOpen(false)
        navigate('/approvals')
      },
    },
  ]

  // Dynamic entities from store
  const entityItems: CommandItem[] = [
    ...store.students.slice(0, 4).map((s) => ({
      id: `ent-std-${s.id}`,
      label: `${s.name} (${s.batchNames[0] || 'Student'})`,
      category: 'Entities' as const,
      icon: <GraduationCap className="w-4 h-4 text-fg-muted" />,
      action: () => {
        setCommandPaletteOpen(false)
        navigate(`/students/${s.id}`)
      },
    })),
    ...store.batches.slice(0, 3).map((b) => ({
      id: `ent-batch-${b.id}`,
      label: `${b.name} · ${b.room}`,
      category: 'Entities' as const,
      icon: <Layers className="w-4 h-4 text-fg-muted" />,
      action: () => {
        setCommandPaletteOpen(false)
        navigate(`/batches/${b.id}`)
      },
    })),
    ...store.certificates.slice(0, 2).map((c) => ({
      id: `ent-cert-${c.id}`,
      label: `Certificate ${c.certificateNo} · ${c.studentName}`,
      category: 'Entities' as const,
      icon: <Award className="w-4 h-4 text-fg-muted" />,
      action: () => {
        setCommandPaletteOpen(false)
        navigate(`/verify/${c.certificateNo}`)
      },
    })),
  ]

  const filteredCommands = commands.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase())
  )
  const filteredEntities = entityItems.filter((e) =>
    e.label.toLowerCase().includes(query.toLowerCase())
  )

  const allItems = [...filteredCommands, ...filteredEntities]

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setCommandPaletteOpen(false)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev < allItems.length ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : allItems.length))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (selectedIndex === allItems.length || query.trim().length > 0 && selectedIndex >= allItems.length) {
        // Trigger Copilot with query
        setCommandPaletteOpen(false)
        setCopilotOpen(true)
      } else if (allItems[selectedIndex]) {
        allItems[selectedIndex].action()
      }
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-20 px-4 animate-fade-in select-none"
      onClick={() => setCommandPaletteOpen(false)}
    >
      <div
        className="w-full max-w-xl bg-surface border border-border rounded-modal shadow-modal overflow-hidden flex flex-col max-h-[520px]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 border-b border-border bg-surface-2/40">
          <Search className="w-4 h-4 text-fg-muted shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command, search students, batches, or ask Copilot..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            className="w-full bg-transparent py-3.5 text-sm text-fg outline-none placeholder:text-fg-muted"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="text-fg-muted hover:text-fg p-1 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <span className="text-[10px] font-mono uppercase text-fg-muted border border-border px-1.5 py-0.5 rounded">
              ESC
            </span>
          )}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-3">
          {filteredCommands.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-fg-muted font-mono">
                Commands
              </div>
              <div className="space-y-0.5">
                {filteredCommands.map((item, idx) => {
                  const isSelected = selectedIndex === idx
                  return (
                    <div
                      key={item.id}
                      onClick={item.action}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`flex items-center justify-between px-3 py-2 rounded-btn text-xs cursor-pointer transition-colors ${
                        isSelected ? 'bg-primary text-white' : 'hover:bg-surface-2 text-fg'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={isSelected ? 'text-white' : ''}>{item.icon}</span>
                        <span className="font-medium">{item.label}</span>
                      </div>
                      {item.shortcut && (
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-surface-2 text-fg-muted border border-border'
                          }`}
                        >
                          {item.shortcut}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {filteredEntities.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-fg-muted font-mono">
                Entities
              </div>
              <div className="space-y-0.5">
                {filteredEntities.map((item, idx) => {
                  const trueIdx = filteredCommands.length + idx
                  const isSelected = selectedIndex === trueIdx
                  return (
                    <div
                      key={item.id}
                      onClick={item.action}
                      onMouseEnter={() => setSelectedIndex(trueIdx)}
                      className={`flex items-center justify-between px-3 py-2 rounded-btn text-xs cursor-pointer transition-colors ${
                        isSelected ? 'bg-primary text-white' : 'hover:bg-surface-2 text-fg'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={isSelected ? 'text-white' : ''}>{item.icon}</span>
                        <span className="font-medium">{item.label}</span>
                      </div>
                      <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-fg-muted'}`} />
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Always Final Row: Ask Copilot */}
          <div className="pt-1 border-t border-border">
            <div
              onClick={() => {
                setCommandPaletteOpen(false)
                setCopilotOpen(true)
              }}
              onMouseEnter={() => setSelectedIndex(allItems.length)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-btn text-xs cursor-pointer border border-ai/30 transition-colors ${
                selectedIndex === allItems.length
                  ? 'bg-ai text-white'
                  : 'bg-ai/5 text-ai hover:bg-ai/10'
              }`}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span className="font-medium">
                  {query.trim()
                    ? `Ask Copilot: "${query}"`
                    : 'Ask Copilot anything about your institute…'}
                </span>
              </div>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                  selectedIndex === allItems.length ? 'bg-white/20 text-white' : 'bg-ai/15 text-ai'
                }`}
              >
                ↵
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
