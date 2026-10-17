import React, { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  CheckCheck,
  CalendarDays,
  ClipboardCheck,
  Video,
  Layers,
  GraduationCap,
  Activity,
  UserCog,
  BookOpen,
  Award,
  IndianRupee,
  Landmark,
  BarChart3,
  MessageSquare,
  ScrollText,
  Settings,
  ChevronLeft,
  ChevronRight,
  LucideIcon,
  School,
  FileCheck,
} from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { useStore } from '@/mocks/store'
import { UserRole } from '@/types'
import { cn } from '@/lib/utils'
import { canAccess } from '@/lib/permissions'

interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  badge?: number | string
  allowedRoles?: UserRole[]
}

interface NavGroup {
  title?: string
  items: NavItem[]
}

export const Sidebar: React.FC = () => {
  const { role, unreadApprovalsCount } = useApp()
  const submissions = useStore((s) => s.submissions)
  const submissionsWaitingCount = submissions.filter(
    (s) =>
      s.status === 'submitted' ||
      s.status === 'late' ||
      s.status === 'graded_draft' ||
      s.status === 'resubmit_requested'
  ).length
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('batchwise-sidebar-collapsed') === 'true'
  })

  useEffect(() => {
    localStorage.setItem('batchwise-sidebar-collapsed', String(collapsed))
  }, [collapsed])

  // Exact requested groups and order:
  // Today, Operations, People, Academics, Money, Reports, Admin
  const navGroups: NavGroup[] = [
    {
      title: 'Today',
      items: [
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
        {
          label: 'Timetable',
          to: '/timetable',
          icon: CalendarDays,
          allowedRoles: ['owner', 'admin', 'trainer', 'counselor'],
        },
      ],
    },
    {
      title: 'Operations',
      items: [
        {
          label: 'Sessions & attendance',
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
        {
          label: 'Batches',
          to: '/batches',
          icon: Layers,
          allowedRoles: ['owner', 'admin', 'trainer', 'counselor'],
        },
      ],
    },
    {
      title: 'People',
      items: [
        {
          label: 'Students',
          to: '/students',
          icon: GraduationCap,
          allowedRoles: ['owner', 'admin', 'trainer', 'counselor'],
        },
        {
          label: 'Risk',
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
      title: 'Academics',
      items: [
        {
          label: 'Courses',
          to: '/courses',
          icon: BookOpen,
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
      title: 'Classroom',
      items: [
        {
          label: 'Classes',
          to: '/classroom',
          icon: School,
          allowedRoles: ['owner', 'admin', 'trainer', 'student'],
        },
        {
          label: 'To review',
          to: '/classroom/review',
          icon: FileCheck,
          badge: submissionsWaitingCount > 0 ? submissionsWaitingCount : undefined,
          allowedRoles: ['owner', 'admin', 'trainer'],
        },
      ],
    },
    {
      title: 'Money',
      items: [
        {
          label: 'Fees & EMIs',
          to: '/fees',
          icon: IndianRupee,
          allowedRoles: ['owner', 'admin', 'accounts', 'counselor'],
        },
        {
          label: 'Payments',
          to: '/payments',
          icon: Landmark,
          allowedRoles: ['owner', 'admin', 'accounts'],
        },
      ],
    },
    {
      title: 'Reports',
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
      title: 'Admin',
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

  // Filter out items not allowed for role using central canAccess helper
  const filteredGroups = navGroups
    .map((grp) => ({
      ...grp,
      items: grp.items.filter((item) => canAccess(role, item.to)),
    }))
    .filter((grp) => grp.items.length > 0)

  return (
    <aside
      className={cn(
        'h-screen bg-[#F6E3D1] border-r border-[#D6B48A] flex flex-col justify-between transition-all select-none z-30 shrink-0 sticky top-0 text-[#1F1F1F]',
        collapsed ? 'w-14' : 'w-[240px]'
      )}
    >
      {/* Top Header */}
      <div>
        <div className="h-[52px] px-3 border-b border-[#DDBF9F] flex items-center justify-between">
          {!collapsed ? (
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-control bg-[#EBCDB1] border border-[#DDBF9F] flex items-center justify-center text-[#1F1F1F] font-medium text-xs shrink-0">
                IO
              </div>
              <div className="min-w-0">
                <div className="font-medium text-xs text-[#1F1F1F] truncate">
                  CodeCraft Academy
                </div>
              </div>
            </div>
          ) : (
            <div className="w-6 h-6 rounded-control bg-[#EBCDB1] border border-[#DDBF9F] flex items-center justify-center text-[#1F1F1F] font-medium text-xs mx-auto">
              IO
            </div>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 text-[#5C4636] hover:text-[#1F1F1F] hover:bg-[#EBCDB1] rounded-control transition-colors shrink-0"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
            ) : (
              <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
            )}
          </button>
        </div>

        {/* Scrollable Navigation List with Scroll Shadow */}
        <nav className="p-2 space-y-3.5 overflow-y-auto max-h-[calc(100vh-120px)] scroll-shadow-y">
          {filteredGroups.map((grp, gIdx) => (
            <div key={gIdx} className="space-y-0.5">
              {grp.title && !collapsed && (
                <div className="px-2 py-1 text-[11px] font-medium text-[#8A705E]">
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
                    className={cn(
                      'flex items-center gap-2 px-2 py-1.5 rounded-control text-xs transition-colors relative',
                      isActive
                        ? 'bg-[#D6B48A] text-[#1F1F1F] font-medium shadow-xs'
                        : 'text-[#1F1F1F] hover:bg-[#EBCDB1]'
                    )}
                  >
                    <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-[#1F1F1F]' : 'text-[#5C4636]')} strokeWidth={1.5} />

                    {!collapsed && <span className="truncate flex-1 text-[#1F1F1F]">{item.label}</span>}

                    {/* Pill only for counts */}
                    {!collapsed && item.badge !== undefined && (
                      <span className="px-1.5 py-0.2 rounded-full text-[11px] font-normal bg-[#EBCDB1] text-[#1F1F1F] border border-[#DDBF9F] tnum">
                        {item.badge}
                      </span>
                    )}

                    {collapsed && item.badge !== undefined && (
                      <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#1F1F1F]" />
                    )}
                  </NavLink>
                )
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* User Card */}
      <div className="p-2 border-t border-[#DDBF9F] bg-[#F6E3D1]">
        <NavLink
          to="/me"
          className="flex items-center gap-2 p-1.5 rounded-control hover:bg-[#EBCDB1] transition-colors"
          title="Account profile"
        >
          <div className="w-6 h-6 rounded-full bg-[#EBCDB1] border border-[#DDBF9F] text-[#1F1F1F] font-medium text-xs flex items-center justify-center shrink-0">
            {role.substring(0, 2).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="text-xs font-normal text-[#1F1F1F] truncate capitalize">
                {role === 'trainer'
                  ? 'Arjun Mehta'
                  : role === 'counselor'
                  ? 'Snehal Kulkarni'
                  : role === 'accounts'
                  ? 'Sunita Accounts'
                  : 'Rajesh Sharma'}
              </div>
              <div className="text-[11px] text-[#5C4636] truncate capitalize">
                {role}
              </div>
            </div>
          )}
        </NavLink>
      </div>
    </aside>
  )
}
