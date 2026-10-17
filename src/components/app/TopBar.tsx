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
    <header className="h-[52px] border-b border-[#4F3B2E] bg-[#33251F] text-[#F8F4EF] px-4 flex items-center justify-between gap-4 sticky top-0 z-20 select-none">
      {/* Left: Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs min-w-0">
        <Link to="/" className="text-[#E3D2C1] hover:text-[#F8F4EF] transition-colors">
          Home
        </Link>
        {pathnames.map((value, index) => {
          const to = `/${pathnames.slice(0, index + 1).join('/')}`
          const isLast = index === pathnames.length - 1
          const title = breadcrumbNameMap[value] || value

          return (
            <React.Fragment key={to}>
              <span className="text-[#6B5040]" aria-hidden="true">/</span>
              {isLast ? (
                <span className="font-medium text-[#F8F4EF] truncate" aria-current="page">
                  {title}
                </span>
              ) : (
                <Link to={to} className="text-[#E3D2C1] hover:text-[#F8F4EF] transition-colors truncate">
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
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-control bg-[#4A3528] border border-[#6B5040] text-xs text-[#F8F4EF] hover:border-[#D6B48A] transition-colors"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-[#CDB9A6]" strokeWidth={1.5} />
            <span className="text-[#CDB9A6]">Search or ask…</span>
          </div>
          <kbd className="font-mono text-[11px] text-[#CDB9A6]">⌘K</kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {!isSupabaseConfigured && (
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#4A3528] text-[#CDB9A6] border border-[#6B5040]">
            Demo data
          </span>
        )}

        {/* Branch Switcher */}
        <div className="relative" ref={branchRef}>
          <button
            onClick={() => setBranchMenuOpen(!branchMenuOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-control bg-transparent hover:bg-[#4A3528] border border-[#D6B48A] text-xs font-normal text-[#F8F4EF] transition-colors"
            title="Branch scope"
          >
            <Building2 className="w-3.5 h-3.5 text-[#F8F4EF]" strokeWidth={1.5} />
            <span>{branch === 'All' ? 'All branches' : branch}</span>
            <ChevronDown className="w-3 h-3 text-[#E3D2C1]" strokeWidth={1.5} />
          </button>

          {branchMenuOpen && (
            <div className="absolute right-0 mt-1 w-44 rounded-card border border-[#D6B48A] bg-[#F6E3D1] shadow-popover py-1 z-50 text-xs text-[#1E140E]">
              <div className="px-3 py-1 text-[11px] text-[#5C4636]">Pune branches</div>
              {branches.map((b) => (
                <button
                  key={b}
                  onClick={() => {
                    setBranch(b)
                    setBranchMenuOpen(false)
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-left hover:bg-[#EBCDB1] text-[#1E140E] transition-colors"
                >
                  <span>{b === 'All' ? 'All branches' : `${b} campus`}</span>
                  {branch === b && <Check className="w-3.5 h-3.5 text-[#1F6B3A]" strokeWidth={1.5} />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Neutral "Ask" Button (⌘J) outlined in pearl-gold with ivory text */}
        <Button
          variant="secondary"
          size="sm"
          onClick={toggleCopilot}
          className="border-[#D6B48A] text-[#F8F4EF] bg-transparent hover:bg-[#4A3528]"
          leftIcon={<Command className="w-3.5 h-3.5 text-[#F8F4EF]" strokeWidth={1.5} />}
          rightIcon={<kbd className="font-mono text-[10px] text-[#E3D2C1] ml-0.5">⌘J</kbd>}
        >
          Ask
        </Button>

        {/* Notifications */}
        <Link
          to="/approvals"
          className="relative p-1.5 text-[#F8F4EF] hover:bg-[#4A3528] rounded-control transition-colors"
          title="Approvals and alerts"
          aria-label="Approvals and alerts"
        >
          <Bell className="w-4 h-4" strokeWidth={1.5} />
          {unreadApprovalsCount > 0 && (
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#A3123F]" />
          )}
        </Link>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-1.5 text-[#F8F4EF] hover:bg-[#4A3528] rounded-control transition-colors"
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
            className="flex items-center gap-1 p-1 rounded-control hover:bg-[#4A3528] transition-colors"
            aria-label="User account and role menu"
          >
            <div className="w-6 h-6 rounded-full bg-[#4A3528] border border-[#6B5040] text-[#F8F4EF] font-medium text-xs flex items-center justify-center">
              {role.substring(0, 2).toUpperCase()}
            </div>
            <ChevronDown className="w-3 h-3 text-[#E3D2C1]" strokeWidth={1.5} />
          </button>

          {avatarMenuOpen && (
            <div className="absolute right-0 mt-1 w-64 rounded-card border border-[#D6B48A] bg-[#F6E3D1] shadow-popover py-2 z-50 text-xs text-[#1E140E]">
              <div className="px-3 pb-2 border-b border-[#DDBF9F]">
                <div className="font-medium text-[#1E140E]">CodeCraft Academy</div>
                <div className="text-[11px] text-[#5C4636] font-mono">Role: {role}</div>
              </div>

              {/* Demo Role Switcher */}
              <div className="py-1 px-1">
                <div className="px-2 pb-1 text-[11px] text-[#5C4636] font-medium flex items-center gap-1">
                  <Shield className="w-3 h-3 text-[#5C4636]" strokeWidth={1.5} />
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
                        isCurrent ? 'bg-[#EBCDB1] font-medium text-[#1E140E]' : 'hover:bg-[#EBCDB1] text-[#1E140E]'
                      )}
                    >
                      <span className="w-3.5 h-3.5 rounded-full border border-[#9A7655] flex items-center justify-center shrink-0 mt-0.5">
                        {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-[#4A3528]" />}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs text-[#1E140E]">{r.label}</div>
                        <div className="text-[11px] text-[#5C4636]">{r.desc}</div>
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="pt-1 border-t border-[#DDBF9F] px-1 space-y-0.5">
                <Link
                  to="/settings"
                  onClick={() => setAvatarMenuOpen(false)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-control hover:bg-[#EBCDB1] text-[#1E140E] transition-colors"
                >
                  <User className="w-3.5 h-3.5 text-[#5C4636]" strokeWidth={1.5} />
                  <span>Settings</span>
                </Link>
                <button
                  onClick={() => {
                    setAvatarMenuOpen(false)
                    logout()
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-control hover:bg-[#EBCDB1] text-[#A3123F] transition-colors text-left"
                >
                  <LogOut className="w-3.5 h-3.5 text-[#A3123F]" strokeWidth={1.5} />
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
