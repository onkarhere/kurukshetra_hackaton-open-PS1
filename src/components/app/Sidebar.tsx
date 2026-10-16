import React, { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  Sparkles,
  LayoutDashboard,
  CheckCheck,
  CalendarDays,
  ClipboardCheck,
  Video,
  GraduationCap,
  Activity,
  UserCog,
  BookOpen,
  Layers,
  Award,
  IndianRupee,
  Landmark,
  BarChart3,
  MessageSquare,
  ScrollText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  LogOut,
} from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { UserRole } from '@/types'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  to: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number | string
  isAi?: boolean
  allowedRoles?: UserRole[]
}

interface NavGroup {
  title?: string
  items: NavItem[]
}

export const Sidebar: React.FC = () => {
  const { role, unreadApprovalsCount, setCopilotOpen } = useApp()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('batchwise-sidebar-collapsed') === 'true'
  })

  useEffect(() => {
    localStorage.setItem('batchwise-sidebar-collapsed', String(collapsed))
  }, [collapsed])

  const navGroups: NavGroup[] = [
    {
      items: [
        {
          label: 'AI Copilot',
          to: '/copilot',
          icon: Sparkles,
          isAi: true,
        },
        {
          label: 'Home',
          to: '/',
          icon: LayoutDashboard,
        },
        {
          label: 'Approvals',
          to: '/approvals',
          icon: CheckCheck,
          badge: unreadApprovalsCount > 0 ? unreadApprovalsCount : undefined,
          allowedRoles: ['owner', 'admin', 'counselor', 'accounts'],
        },
      ],
    },
    {
      title: 'OPERATE',
      items: [
        {
          label: 'Timetable',
          to: '/timetable',
          icon: CalendarDays,
          allowedRoles: ['owner', 'admin', 'trainer', 'counselor'],
        },
        {
          label: 'Sessions & Attendance',
          to: '/attendance',
          icon: ClipboardCheck,
          allowedRoles: ['owner', 'admin', 'trainer', 'counselor'],
        },
        {
          label: 'Recordings',
          to: '/recordings',
          icon: Video,
          allowedRoles: ['owner', 'admin', 'trainer', 'student'],
        },
      ],
    },
    {
      title: 'PEOPLE',
      items: [
        {
          label: 'Students',
          to: '/students',
          icon: GraduationCap,
          allowedRoles: ['owner', 'admin', 'trainer', 'counselor'],
        },
        {
          label: 'Risk board',
          to: '/risk',
          icon: Activity,
          allowedRoles: ['owner', 'admin', 'trainer', 'counselor'],
        },
        {
          label: 'Trainers',
          to: '/trainers',
          icon: UserCog,
          allowedRoles: ['owner', 'admin'],
        },
      ],
    },
    {
      title: 'ACADEMICS',
      items: [
        {
          label: 'Courses',
          to: '/courses',
          icon: BookOpen,
          allowedRoles: ['owner', 'admin', 'trainer', 'counselor'],
        },
        {
          label: 'Batches',
          to: '/batches',
          icon: Layers,
          allowedRoles: ['owner', 'admin', 'trainer', 'counselor'],
        },
        {
          label: 'Certificates',
          to: '/certificates',
          icon: Award,
          allowedRoles: ['owner', 'admin', 'counselor'],
        },
      ],
    },
    {
      title: 'MONEY',
      items: [
        {
          label: 'Fees & EMIs',
          to: '/fees',
          icon: IndianRupee,
          allowedRoles: ['owner', 'admin', 'accounts', 'counselor'],
        },
        {
          label: 'Payments & Reconcile',
          to: '/payments',
          icon: Landmark,
          allowedRoles: ['owner', 'admin', 'accounts'],
        },
      ],
    },
    {
      title: 'INSIGHTS',
      items: [
        {
          label: 'Analytics',
          to: '/analytics',
          icon: BarChart3,
          allowedRoles: ['owner', 'admin'],
        },
        {
          label: 'Messages',
          to: '/messages',
          icon: MessageSquare,
          allowedRoles: ['owner', 'admin', 'counselor'],
        },
      ],
    },
    {
      title: 'GOVERN',
      items: [
        {
          label: 'Audit log',
          to: '/audit',
          icon: ScrollText,
          allowedRoles: ['owner', 'admin'],
        },
        {
          label: 'Settings',
          to: '/settings',
          icon: Settings,
          allowedRoles: ['owner', 'admin'],
        },
      ],
    },
  ]

  // Filter based on role: Trainer must NEVER see money UI
  const filteredGroups = navGroups
    .map((grp) => ({
      ...grp,
      items: grp.items.filter((item) => {
        if (!item.allowedRoles) return true
        return item.allowedRoles.includes(role)
      }),
    }))
    .filter((grp) => grp.items.length > 0)

  return (
    <aside
      className={cn(
        'h-screen bg-surface border-r border-border flex flex-col justify-between transition-all duration-200 select-none z-30 shrink-0 sticky top-0',
        collapsed ? 'w-16' : 'w-[248px]'
      )}
    >
      {/* Top Brand & Institute Header */}
      <div>
        <div className="h-14 px-3.5 border-b border-border flex items-center justify-between">
          {!collapsed ? (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                BW
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-xs tracking-tight text-fg truncate">
                  CodeCraft Academy
                </div>
                <div className="text-[10px] text-fg-muted font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
                  Pune · Operations
                </div>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs mx-auto">
              BW
            </div>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 text-fg-muted hover:text-fg hover:bg-surface-2 rounded-btn transition-colors shrink-0"
            title={collapsed ? 'Expand sidebar' : 'Collapse to icon rail'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation list */}
        <nav className="p-2 space-y-4 overflow-y-auto max-h-[calc(100vh-140px)]">
          {filteredGroups.map((grp, gIdx) => (
            <div key={gIdx} className="space-y-0.5">
              {grp.title && !collapsed && (
                <div className="px-2.5 py-1 text-[10px] font-mono font-semibold text-fg-muted uppercase tracking-wider">
                  {grp.title}
                </div>
              )}
              {grp.items.map((item) => {
                const Icon = item.icon
                const isActive =
                  item.to === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(item.to)

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive: linkActive }) =>
                      cn(
                        'flex items-center gap-2.5 px-2.5 py-2 rounded-btn text-xs font-medium transition-colors relative group',
                        linkActive || isActive
                          ? item.isAi
                            ? 'bg-ai/10 text-ai font-semibold'
                            : 'bg-primary/10 text-primary font-semibold'
                          : item.isAi
                          ? 'text-ai hover:bg-ai/5'
                          : 'text-fg-muted hover:text-fg hover:bg-surface-2'
                      )
                    }
                  >
                    <Icon
                      className={cn(
                        'w-4 h-4 shrink-0 transition-transform group-hover:scale-105',
                        item.isAi ? 'text-ai' : ''
                      )}
                    />

                    {!collapsed && <span className="truncate flex-1">{item.label}</span>}

                    {!collapsed && item.badge !== undefined && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-primary text-white">
                        {item.badge}
                      </span>
                    )}

                    {collapsed && item.badge !== undefined && (
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
                    )}
                  </NavLink>
                )
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Footer / User Card */}
      <div className="p-2 border-t border-border bg-surface-2/30">
        <NavLink
          to="/me"
          className="flex items-center gap-2.5 p-2 rounded-btn hover:bg-surface-2 transition-colors"
          title="Account profile"
        >
          <div className="w-7 h-7 rounded-full bg-primary/20 text-primary font-bold text-xs flex items-center justify-center shrink-0">
            {role.substring(0, 2).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-fg capitalize truncate">
                {role === 'trainer'
                  ? 'Arjun Mehta'
                  : role === 'counselor'
                  ? 'Snehal Kulkarni'
                  : role === 'accounts'
                  ? 'Sunita Accounts'
                  : 'Rajesh Sharma'}
              </div>
              <div className="text-[10px] text-fg-muted font-mono uppercase tracking-wider">
                {role}
              </div>
            </div>
          )}
        </NavLink>
      </div>
    </aside>
  )
}
