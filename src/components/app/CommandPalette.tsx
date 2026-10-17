import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Command,
  UserPlus,
  Layers,
  ClipboardCheck,
  Calendar,
  GraduationCap,
  Award,
  ChevronRight,
  X,
  ArrowRight,
  CreditCard,
  Landmark,
} from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { store } from '@/mocks/store'
import { canAccess } from '@/lib/permissions'

interface CommandItem {
  id: string
  label: string
  category: 'Commands' | 'Entities'
  shortcut?: string
  path?: string
  icon: React.ReactNode
  action: () => void
}

export const CommandPalette: React.FC = () => {
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    setCopilotOpen,
    setPendingAskQuery,
    role,
  } = useApp()
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

  const suggestedQuestions = role === 'trainer'
    ? [
        'Which students in Java batch have missed 3 or more classes?',
        'Show room capacity clashes for next week',
        'Show attendance summary for Java Full-Stack B3 (Kothrud)',
      ]
    : [
        'Which students in Java batch have missed 3 or more classes and owe EMI?',
        'Show room capacity clashes for next week',
        'Who is Arjun Mehta substituting for on Thursday?',
        'Collections this week vs target in Kothrud branch',
      ]

  const rawCommands: CommandItem[] = [
    {
      id: 'cmd-student-new',
      label: 'New student registration',
      category: 'Commands',
      shortcut: 'C S',
      path: '/students',
      icon: <UserPlus className="w-4 h-4 text-text-muted" />,
      action: () => {
        setCommandPaletteOpen(false)
        navigate('/students?action=new')
      },
    },
    {
      id: 'cmd-batch-new',
      label: 'Create new batch',
      category: 'Commands',
      shortcut: 'C B',
      path: '/batches',
      icon: <Layers className="w-4 h-4 text-text-muted" />,
      action: () => {
        setCommandPaletteOpen(false)
        navigate('/batches?action=new')
      },
    },
    {
      id: 'cmd-mark-attendance',
      label: 'Mark session attendance',
      category: 'Commands',
      shortcut: 'A',
      path: '/attendance',
      icon: <ClipboardCheck className="w-4 h-4 text-text-muted" />,
      action: () => {
        setCommandPaletteOpen(false)
        navigate('/sessions/sess-m2')
      },
    },
    {
      id: 'cmd-gen-timetable',
      label: 'Generate timetable schedule',
      category: 'Commands',
      shortcut: 'R',
      path: '/timetable',
      icon: <Calendar className="w-4 h-4 text-text-muted" />,
      action: () => {
        setCommandPaletteOpen(false)
        navigate('/timetable')
      },
    },
    {
      id: 'cmd-fees-view',
      label: 'Fees & instalments ledger',
      category: 'Commands',
      shortcut: 'F',
      path: '/fees',
      icon: <CreditCard className="w-4 h-4 text-text-muted" />,
      action: () => {
        setCommandPaletteOpen(false)
        navigate('/fees')
      },
    },
    {
      id: 'cmd-payments-reconcile',
      label: 'Reconcile bank payments & UTR',
      category: 'Commands',
      shortcut: 'P',
      path: '/payments',
      icon: <Landmark className="w-4 h-4 text-text-muted" />,
      action: () => {
        setCommandPaletteOpen(false)
        navigate('/payments')
      },
    },
    {
      id: 'cmd-student-portal',
      label: 'My learning schedule & portal',
      category: 'Commands',
      shortcut: 'S',
      path: '/s',
      icon: <GraduationCap className="w-4 h-4 text-text-muted" />,
      action: () => {
        setCommandPaletteOpen(false)
        navigate('/s')
      },
    },
    {
      id: 'cmd-student-assignments',
      label: 'My assignments & submissions',
      category: 'Commands',
      shortcut: 'A',
      path: '/s',
      icon: <ClipboardCheck className="w-4 h-4 text-text-muted" />,
      action: () => {
        setCommandPaletteOpen(false)
        navigate('/s/assignments')
      },
    },
    {
      id: 'cmd-student-recordings',
      label: 'Lecture recordings',
      category: 'Commands',
      shortcut: 'R',
      path: '/recordings',
      icon: <Calendar className="w-4 h-4 text-text-muted" />,
      action: () => {
        setCommandPaletteOpen(false)
        navigate('/recordings')
      },
    },
    {
      id: 'cmd-student-classroom',
      label: 'Classroom & discussions',
      category: 'Commands',
      shortcut: 'C',
      path: '/classroom',
      icon: <Layers className="w-4 h-4 text-text-muted" />,
      action: () => {
        setCommandPaletteOpen(false)
        navigate('/classroom')
      },
    },
  ]

  // Filter commands by permissions
  const commands = rawCommands.filter((cmd) => (cmd.path ? canAccess(role, cmd.path) : true))

  // Dynamic entities from store filtered by permissions
  const rawEntityItems: CommandItem[] = [
    ...store.students.slice(0, 4).map((s) => ({
      id: `ent-std-${s.id}`,
      label: `${s.name} (${s.batchNames[0] || 'Student'})`,
      category: 'Entities' as const,
      path: `/students/${s.id}`,
      icon: <GraduationCap className="w-4 h-4 text-text-muted" />,
      action: () => {
        setCommandPaletteOpen(false)
        navigate(`/students/${s.id}`)
      },
    })),
    ...store.batches.slice(0, 3).map((b) => ({
      id: `ent-batch-${b.id}`,
      label: `${b.name} · ${b.room}`,
      category: 'Entities' as const,
      path: `/batches/${b.id}`,
      icon: <Layers className="w-4 h-4 text-text-muted" />,
      action: () => {
        setCommandPaletteOpen(false)
        navigate(`/batches/${b.id}`)
      },
    })),
    ...store.certificates.slice(0, 2).map((c) => ({
      id: `ent-cert-${c.id}`,
      label: `Certificate ${c.certificateNo} · ${c.studentName}`,
      category: 'Entities' as const,
      path: `/verify/${c.certificateNo}`,
      icon: <Award className="w-4 h-4 text-text-muted" />,
      action: () => {
        setCommandPaletteOpen(false)
        navigate(`/verify/${c.certificateNo}`)
      },
    })),
    ...(canAccess(role, '/payments')
      ? store.payments.slice(0, 3).map((p) => ({
          id: `ent-pay-${p.id}`,
          label: `Payment ${p.receiptNo} · ${p.studentName}`,
          category: 'Entities' as const,
          path: '/payments',
          icon: <Landmark className="w-4 h-4 text-text-muted" />,
          action: () => {
            setCommandPaletteOpen(false)
            navigate('/payments')
          },
        }))
      : []),
  ]

  const entityItems = rawEntityItems.filter((ent) => (ent.path ? canAccess(role, ent.path) : true))

  const filteredCommands = commands.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase())
  )
  const filteredEntities = entityItems.filter((e) =>
    e.label.toLowerCase().includes(query.toLowerCase())
  )

  const allItems = [...filteredCommands, ...filteredEntities]

  const triggerAsk = (askText: string) => {
    if (role === 'student') return
    setPendingAskQuery(askText)
    setCommandPaletteOpen(false)
    setCopilotOpen(true)
  }

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
      if (role === 'student') {
        if (allItems[selectedIndex]) {
          allItems[selectedIndex].action()
        }
        return
      }
      if (query.trim().length > 0 && selectedIndex >= allItems.length) {
        triggerAsk(query.trim())
      } else if (allItems[selectedIndex]) {
        allItems[selectedIndex].action()
      } else if (query.trim().length > 0) {
        triggerAsk(query.trim())
      }
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-start justify-center pt-20 px-4"
      onClick={() => setCommandPaletteOpen(false)}
    >
      <div
        className="w-full max-w-xl bg-surface border border-border rounded-dialog shadow-dialog overflow-hidden flex flex-col max-h-[520px]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 border-b border-border bg-surface-sunken/40">
          <Search className="w-4 h-4 text-text-muted shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search or ask a question… (Press ↵ to ask)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            className="w-full bg-transparent py-3.5 text-xs text-text outline-none placeholder:text-text-muted font-sans"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="text-text-muted hover:text-text p-1 rounded"
              aria-label="Clear input"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="font-mono text-[10px] text-text-muted border border-border px-1.5 py-0.5 rounded bg-surface">
              ESC
            </kbd>
          )}
        </div>

        {/* Suggested questions as plain text examples inside the bar (hidden for student) */}
        {!query && role !== 'student' && (
          <div className="px-4 py-3 border-b border-border bg-surface-sunken/30 text-xs">
            <span className="font-medium text-text-muted text-[11px]">Suggested questions:</span>
            <div className="mt-1.5 space-y-1">
              {suggestedQuestions.map((q, idx) => (
                <div
                  key={idx}
                  onClick={() => triggerAsk(q)}
                  className="text-text-muted hover:text-text cursor-pointer truncate flex items-center justify-between py-1 px-1.5 rounded hover:bg-surface-sunken transition-colors"
                >
                  <span className="truncate">{q}</span>
                  <ArrowRight className="w-3 h-3 text-text-muted shrink-0 ml-2" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-3">
          {filteredCommands.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-text-muted">
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
                      className={`flex items-center justify-between px-3 py-2 rounded-control text-xs cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-surface-sunken text-text'
                          : 'hover:bg-surface-sunken/60 text-text'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-text-muted">{item.icon}</span>
                        <span className="font-normal">{item.label}</span>
                      </div>
                      {item.shortcut && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface border border-border text-text-muted">
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
              <div className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-text-muted">
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
                      className={`flex items-center justify-between px-3 py-2 rounded-control text-xs cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-surface-sunken text-text'
                          : 'hover:bg-surface-sunken/60 text-text'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-text-muted">{item.icon}</span>
                        <span className="font-normal">{item.label}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-text-muted" />
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Ask row (hidden for student) */}
          {role !== 'student' && query.trim().length > 0 && (
            <div className="pt-1 border-t border-border">
              <div
                onClick={() => triggerAsk(query.trim())}
                onMouseEnter={() => setSelectedIndex(allItems.length)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-control text-xs cursor-pointer border border-border-strong transition-colors ${
                  selectedIndex === allItems.length
                    ? 'bg-surface-sunken text-text font-medium'
                    : 'bg-surface text-text hover:bg-surface-sunken'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Command className="w-4 h-4 text-text-muted shrink-0" />
                  <span className="truncate">
                    Ask: &quot;{query.trim()}&quot;
                  </span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-border text-text-muted">
                  ↵
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
