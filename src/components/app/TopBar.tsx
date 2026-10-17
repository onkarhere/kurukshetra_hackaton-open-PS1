import React, { useState, useRef, useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import {
  Search,
  Bell,
  Sun,
  Moon,
  Building2,
  ChevronDown,
  User,
  Shield,
  Check,
  Command,
  LogOut,
} from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { useTheme } from '@/context/ThemeContext'
import { UserRole, Branch } from '@/types'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { isSupabaseConfigured } from '@/lib/supabase'

export const TopBar: React.FC = () => {
  const {
    role,
    setRole,
    branch,
    setBranch,
    toggleCopilot,
    setCommandPaletteOpen,
    unreadApprovalsCount,
    logout,
  } = useApp()
  const { resolvedTheme, toggleTheme } = useTheme()
  const location = useLocation()

  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false)
  const [branchMenuOpen, setBranchMenuOpen] = useState(false)
  const avatarRef = useRef<HTMLDivElement>(null)
  const branchRef = useRef<HTMLDivElement>(null)

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

  const pathnames = location.pathname.split('/').filter((x) => x)
  const breadcrumbNameMap: Record<string, string> = {
    approvals: 'Approvals',
    timetable: 'Timetable',
    attendance: 'Sessions & attendance',
    recordings: 'Recordings',
    students: 'Students',
    risk: 'Risk',
    trainers: 'Trainers',
    courses: 'Courses',
    batches: 'Batches',
    certificates: 'Certificates',
    fees: 'Fees & EMIs',
    payments: 'Payments',
    analytics: 'Analytics',
    messages: 'Messages',
    audit: 'Audit log',
    settings: 'Settings',
    setup: 'Setup',
    me: 'Profile',
  }

  const allRoles: { id: UserRole; label: string; desc: string }[] = [
    { id: 'owner', label: 'Owner (Rajesh Sharma)', desc: 'Full institute operations' },
    { id: 'admin', label: 'Admin (System Admin)', desc: 'Academic and operations coordinator' },
    { id: 'trainer', label: 'Trainer (Arjun Mehta)', desc: 'Zero fee visibility' },
    { id: 'counselor', label: 'Counselor (Snehal K.)', desc: 'Student risk and attendance' },
    { id: 'accounts', label: 'Accounts (Sunita A.)', desc: 'Dues and reconciliation' },
    { id: 'student', label: 'Student (Priya Nair)', desc: 'Student portal view' },
  ]

  const branches: (Branch | 'All')[] = ['All', 'Kothrud', 'Baner']

  return (
    <header className="h-[52px] border-b border-border bg-surface px-4 flex items-center justify-between gap-4 sticky top-0 z-20 select-none">
      {/* Left: Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs min-w-0">
        <Link to="/" className="text-text-muted hover:text-text transition-colors">
          Home
        </Link>
        {pathnames.map((value, index) => {
          const to = `/${pathnames.slice(0, index + 1).join('/')}`
          const isLast = index === pathnames.length - 1
          const title = breadcrumbNameMap[value] || value

          return (
            <React.Fragment key={to}>
              <span className="text-border" aria-hidden="true">/</span>
              {isLast ? (
                <span className="font-medium text-text truncate" aria-current="page">
                  {title}
                </span>
              ) : (
                <Link to={to} className="text-text-muted hover:text-text transition-colors truncate">
                  {title}
                </Link>
              )}
            </React.Fragment>
          )
        })}
      </nav>

      {/* Centre: Search field "Search or ask… ⌘K" */}
      <div className="flex-1 max-w-md hidden md:block">
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-control bg-surface-sunken border border-border text-xs text-text-muted hover:text-text hover:border-border-strong transition-colors"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-text-muted" strokeWidth={1.5} />
            <span>Search or ask…</span>
          </div>
          <kbd className="font-mono text-[11px] text-text-muted">⌘K</kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {!isSupabaseConfigured && (
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-surface-sunken text-text-muted border border-border">
            Demo data
          </span>
        )}

        {/* Branch Switcher */}
        <div className="relative" ref={branchRef}>
          <button
            onClick={() => setBranchMenuOpen(!branchMenuOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-control bg-surface hover:bg-surface-sunken border border-border text-xs font-normal text-text transition-colors"
            title="Branch scope"
          >
            <Building2 className="w-3.5 h-3.5 text-text-muted" strokeWidth={1.5} />
            <span>{branch === 'All' ? 'All branches' : branch}</span>
            <ChevronDown className="w-3 h-3 text-text-muted" strokeWidth={1.5} />
          </button>

          {branchMenuOpen && (
            <div className="absolute right-0 mt-1 w-44 rounded-card border border-border bg-surface shadow-popover py-1 z-50 text-xs">
              <div className="px-3 py-1 text-[11px] text-text-muted">Pune branches</div>
              {branches.map((b) => (
                <button
                  key={b}
                  onClick={() => {
                    setBranch(b)
                    setBranchMenuOpen(false)
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-left hover:bg-surface-sunken text-text transition-colors"
                >
                  <span>{b === 'All' ? 'All branches' : `${b} campus`}</span>
                  {branch === b && <Check className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Neutral "Ask" Button (⌘J) */}
        <Button
          variant="secondary"
          size="sm"
          onClick={toggleCopilot}
          leftIcon={<Command className="w-3.5 h-3.5 text-text-muted" strokeWidth={1.5} />}
          rightIcon={<kbd className="font-mono text-[10px] text-text-muted ml-0.5">⌘J</kbd>}
        >
          Ask
        </Button>

        {/* Notifications */}
        <Link
          to="/approvals"
          className="relative p-1.5 text-text-muted hover:text-text hover:bg-surface-sunken rounded-control transition-colors"
          title="Approvals and alerts"
          aria-label="Approvals and alerts"
        >
          <Bell className="w-4 h-4" strokeWidth={1.5} />
          {unreadApprovalsCount > 0 && (
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-danger" />
          )}
        </Link>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-1.5 text-text-muted hover:text-text hover:bg-surface-sunken rounded-control transition-colors"
          title={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
          aria-label="Toggle theme"
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="w-4 h-4" strokeWidth={1.5} />
          ) : (
            <Moon className="w-4 h-4" strokeWidth={1.5} />
          )}
        </button>

        {/* Avatar Menu with Demo Role Switcher */}
        <div className="relative" ref={avatarRef}>
          <button
            onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}
            className="flex items-center gap-1 p-1 rounded-control hover:bg-surface-sunken transition-colors"
            aria-label="User account and role menu"
          >
            <div className="w-6 h-6 rounded-full bg-surface-sunken border border-border text-text font-medium text-xs flex items-center justify-center">
              {role.substring(0, 2).toUpperCase()}
            </div>
            <ChevronDown className="w-3 h-3 text-text-muted" strokeWidth={1.5} />
          </button>

          {avatarMenuOpen && (
            <div className="absolute right-0 mt-1 w-64 rounded-card border border-border bg-surface shadow-popover py-2 z-50 text-xs">
              <div className="px-3 pb-2 border-b border-border">
                <div className="font-medium text-text">CodeCraft Academy</div>
                <div className="text-[11px] text-text-muted font-mono">Role: {role}</div>
              </div>

              {/* Demo Role Switcher */}
              <div className="py-1 px-1">
                <div className="px-2 pb-1 text-[11px] text-text-muted font-medium flex items-center gap-1">
                  <Shield className="w-3 h-3 text-text-muted" strokeWidth={1.5} />
                  Demo role switcher
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
                        'w-full flex items-start gap-2 px-2 py-1.5 rounded-control text-left transition-colors',
                        isCurrent ? 'bg-surface-sunken font-medium text-text' : 'hover:bg-surface-sunken text-text-muted'
                      )}
                    >
                      <span className="w-3.5 h-3.5 rounded-full border border-border-strong flex items-center justify-center shrink-0 mt-0.5">
                        {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-accent" />}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs text-text">{r.label}</div>
                        <div className="text-[11px] text-text-muted">{r.desc}</div>
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="pt-1 border-t border-border px-1 space-y-0.5">
                <Link
                  to="/settings"
                  onClick={() => setAvatarMenuOpen(false)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-control hover:bg-surface-sunken text-text transition-colors"
                >
                  <User className="w-3.5 h-3.5 text-text-muted" strokeWidth={1.5} />
                  <span>Settings</span>
                </Link>
                <button
                  onClick={() => {
                    setAvatarMenuOpen(false)
                    logout()
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-control hover:bg-surface-sunken text-danger transition-colors text-left"
                >
                  <LogOut className="w-3.5 h-3.5 text-danger" strokeWidth={1.5} />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
