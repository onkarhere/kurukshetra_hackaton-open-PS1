import React, { useState, useRef, useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import {
  Search,
  Sparkles,
  Bell,
  Sun,
  Moon,
  Building2,
  ChevronDown,
  User,
  Shield,
  Check,
  Keyboard,
  HelpCircle,
} from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { useTheme } from '@/context/ThemeContext'
import { UserRole, Branch } from '@/types'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

export const TopBar: React.FC = () => {
  const {
    role,
    setRole,
    branch,
    setBranch,
    toggleCopilot,
    setCommandPaletteOpen,
    setShortcutsOpen,
    unreadApprovalsCount,
  } = useApp()
  const { resolvedTheme, toggleTheme } = useTheme()
  const location = useLocation()

  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false)
  const [branchMenuOpen, setBranchMenuOpen] = useState(false)
  const avatarRef = useRef<HTMLDivElement>(null)
  const branchRef = useRef<HTMLDivElement>(null)

  // Close menus on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarMenuOpen(false)
      }
      if (branchRef.current && !branchRef.current.contains(e.target as Node)) {
        setBranchMenuOpen(false)
      }
    }
    window.addEventListener('mousedown', handleClick)
    return () => window.removeEventListener('mousedown', handleClick)
  }, [])

  // Dynamic breadcrumbs
  const pathnames = location.pathname.split('/').filter((x) => x)
  const breadcrumbNameMap: Record<string, string> = {
    copilot: 'AI Copilot',
    approvals: 'Approvals Inbox',
    timetable: 'Timetable',
    attendance: 'Sessions & Attendance',
    recordings: 'Recordings',
    students: 'Students',
    risk: 'Risk Board',
    trainers: 'Trainers',
    courses: 'Courses',
    batches: 'Batches',
    certificates: 'Certificates',
    fees: 'Fees & EMIs',
    payments: 'Payments & Reconcile',
    analytics: 'Analytics',
    messages: 'Messages',
    audit: 'Audit Log',
    settings: 'Settings',
    setup: 'Onboarding Setup',
    me: 'Profile',
  }

  const allRoles: { id: UserRole; label: string; desc: string }[] = [
    { id: 'owner', label: 'Owner (Rajesh Sharma)', desc: 'Full unrestricted institute control' },
    { id: 'admin', label: 'Admin (System Admin)', desc: 'Operations & academic manager' },
    { id: 'trainer', label: 'Trainer (Arjun Mehta)', desc: 'Strictly zero financial/fee access' },
    { id: 'counselor', label: 'Counselor (Snehal K.)', desc: 'Student risk & admissions follow-up' },
    { id: 'accounts', label: 'Accounts (Sunita A.)', desc: 'Dues, reconciliation & collections' },
    { id: 'student', label: 'Student (Priya Nair)', desc: 'Mobile-first student portal view' },
  ]

  const branches: (Branch | 'All')[] = ['All', 'Kothrud', 'Baner']

  return (
    <header className="h-14 border-b border-border bg-surface px-4 flex items-center justify-between gap-4 sticky top-0 z-20 select-none">
      {/* Left: Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-xs min-w-0">
        <Link to="/" className="text-fg-muted hover:text-fg font-medium transition-colors">
          Home
        </Link>
        {pathnames.map((value, index) => {
          const to = `/${pathnames.slice(0, index + 1).join('/')}`
          const isLast = index === pathnames.length - 1
          const title = breadcrumbNameMap[value] || value

          return (
            <React.Fragment key={to}>
              <span className="text-border">/</span>
              {isLast ? (
                <span className="font-semibold text-fg truncate capitalize">{title}</span>
              ) : (
                <Link to={to} className="text-fg-muted hover:text-fg transition-colors truncate capitalize">
                  {title}
                </Link>
              )}
            </React.Fragment>
          )
        })}
      </div>

      {/* Centre: Search field "Search or ask... ⌘K" */}
      <div className="flex-1 max-w-md hidden md:block">
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-btn bg-surface-2 border border-border text-xs text-fg-muted hover:text-fg hover:border-text-muted/40 transition-all shadow-sm"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-fg-muted" />
            <span>Search or ask Copilot…</span>
          </div>
          <kbd className="font-mono text-[10px] bg-surface border border-border px-1.5 py-0.5 rounded text-fg-muted shadow-sm">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Branch Switcher */}
        <div className="relative" ref={branchRef}>
          <button
            onClick={() => setBranchMenuOpen(!branchMenuOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-btn bg-surface-2 hover:bg-surface border border-border text-xs font-medium text-fg transition-colors"
            title="Switch Branch Filter"
          >
            <Building2 className="w-3.5 h-3.5 text-primary" />
            <span>{branch === 'All' ? 'All Branches' : branch}</span>
            <ChevronDown className="w-3 h-3 text-fg-muted" />
          </button>

          {branchMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-44 rounded-card border border-border bg-surface shadow-popover py-1 z-50 animate-scale-in text-xs">
              <div className="px-3 py-1 text-[10px] uppercase font-mono text-fg-muted font-semibold">
                Pune Campus
              </div>
              {branches.map((b) => (
                <button
                  key={b}
                  onClick={() => {
                    setBranch(b)
                    setBranchMenuOpen(false)
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-left hover:bg-surface-2 text-fg transition-colors"
                >
                  <span>{b === 'All' ? 'All Branches (Kothrud & Baner)' : `${b} Campus`}</span>
                  {branch === b && <Check className="w-3.5 h-3.5 text-primary" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Ask Copilot Button (violet outline, ⌘J) */}
        <Button
          variant="ai"
          size="sm"
          onClick={toggleCopilot}
          className="shadow-sm"
          rightIcon={
            <kbd className="hidden sm:inline font-mono text-[10px] bg-ai/10 border border-ai/30 px-1 rounded ml-1 text-ai">
              ⌘J
            </kbd>
          }
        >
          Ask Copilot
        </Button>

        {/* Notifications Bell */}
        <Link
          to="/approvals"
          className="relative p-2 text-fg-muted hover:text-fg hover:bg-surface-2 rounded-btn transition-colors"
          title="Approvals and alerts"
        >
          <Bell className="w-4 h-4" />
          {unreadApprovalsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-danger animate-pulse" />
          )}
        </Link>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 text-fg-muted hover:text-fg hover:bg-surface-2 rounded-btn transition-colors"
          title={`Switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} mode`}
          aria-label="Toggle theme"
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="w-4 h-4 text-warning" />
          ) : (
            <Moon className="w-4 h-4 text-fg-muted" />
          )}
        </button>

        {/* Shortcuts Button */}
        <button
          onClick={() => setShortcutsOpen(true)}
          className="p-2 text-fg-muted hover:text-fg hover:bg-surface-2 rounded-btn transition-colors hidden sm:block"
          title="Keyboard shortcuts (?)"
        >
          <Keyboard className="w-4 h-4" />
        </button>

        {/* Avatar Menu with DEMO ROLE SWITCHER */}
        <div className="relative" ref={avatarRef}>
          <button
            onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}
            className="flex items-center gap-1.5 pl-1 pr-1.5 py-1 rounded-btn hover:bg-surface-2 transition-colors border border-transparent hover:border-border"
          >
            <div className="w-7 h-7 rounded-full bg-primary/20 text-primary font-bold text-xs flex items-center justify-center border border-primary/30">
              {role.substring(0, 2).toUpperCase()}
            </div>
            <ChevronDown className="w-3 h-3 text-fg-muted" />
          </button>

          {avatarMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-72 rounded-card border border-border bg-surface shadow-popover py-2 z-50 animate-scale-in text-xs">
              <div className="px-3 pb-2 border-b border-border">
                <div className="font-semibold text-fg">CodeCraft Academy</div>
                <div className="text-[11px] text-fg-muted font-mono">Current role: {role}</div>
              </div>

              {/* DEMO ROLE SWITCHER */}
              <div className="py-2 px-1">
                <div className="px-2.5 pb-1 text-[10px] font-mono uppercase tracking-wider text-primary font-bold flex items-center gap-1">
                  <Shield className="w-3 h-3 text-primary" />
                  Demo Role Switcher
                </div>
                <div className="text-[10px] text-fg-muted px-2.5 pb-1.5">
                  Test role-based access & permissions instantly:
                </div>
                {allRoles.map((r) => {
                  const isCurrent = role === r.id
                  return (
                    <button
                      key={r.id}
                      onClick={() => {
                        setRole(r.id)
                        setAvatarMenuOpen(false)
                      }}
                      className={cn(
                        'w-full flex items-start gap-2.5 px-2.5 py-1.5 rounded-btn text-left transition-colors',
                        isCurrent ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-surface-2 text-fg'
                      )}
                    >
                      <div className="w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5">
                        {isCurrent && <div className="w-2 h-2 rounded-full bg-primary" />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs leading-tight">{r.label}</div>
                        <div className="text-[10px] text-fg-muted font-normal leading-tight">
                          {r.desc}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="pt-2 border-t border-border px-1">
                <Link
                  to="/settings"
                  onClick={() => setAvatarMenuOpen(false)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-btn hover:bg-surface-2 text-fg transition-colors"
                >
                  <User className="w-3.5 h-3.5 text-fg-muted" />
                  <span>Account & Institute Settings</span>
                </Link>
                <Link
                  to="/login"
                  onClick={() => setAvatarMenuOpen(false)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-btn hover:bg-surface-2 text-danger transition-colors"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-danger" />
                  <span>Logout / Switch User</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
