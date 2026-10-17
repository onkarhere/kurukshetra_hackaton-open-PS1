import { UserRole } from '@/types'

export const ROUTE_ROLES: Record<string, UserRole[]> = {
  '/': ['owner', 'admin', 'trainer', 'counselor', 'accounts', 'student'],
  '/setup': ['owner', 'admin'],
  '/copilot': ['owner', 'admin', 'trainer', 'counselor', 'accounts', 'student'],
  '/approvals': ['owner', 'admin', 'trainer', 'counselor', 'accounts'],
  '/timetable': ['owner', 'admin', 'trainer', 'counselor'],
  '/sessions': ['owner', 'admin', 'trainer', 'counselor'],
  '/attendance': ['owner', 'admin', 'trainer', 'counselor'],
  '/recordings': ['owner', 'admin', 'trainer', 'student'],
  '/students': ['owner', 'admin', 'counselor', 'accounts', 'trainer'],
  '/risk': ['owner', 'admin', 'trainer', 'counselor'],
  '/trainers': ['owner', 'admin'],
  '/courses': ['owner', 'admin', 'counselor', 'trainer'],
  '/batches': ['owner', 'admin', 'trainer', 'counselor'],
  '/certificates': ['owner', 'admin', 'trainer', 'counselor'],
  '/fees': ['owner', 'admin', 'accounts'],
  '/payments': ['owner', 'admin', 'accounts'],
  '/payments/reconcile': ['owner', 'admin', 'accounts'],
  '/analytics': ['owner', 'admin'],
  '/messages': ['owner', 'admin', 'counselor', 'accounts'],
  '/audit': ['owner', 'admin', 'accounts'],
  '/settings': ['owner', 'admin'],
  '/me': ['owner', 'admin', 'trainer', 'counselor', 'accounts', 'student'],
  '/s': ['student', 'owner', 'admin'],
  '/classroom': ['owner', 'admin', 'trainer', 'student'],
  '/classroom/review': ['owner', 'admin', 'trainer'],
}

/**
 * Checks whether a given role is allowed to access a route path.
 */
export function canAccess(role: UserRole, path: string): boolean {
  const cleanPath = path.split('?')[0].replace(/\/+$/, '') || '/'

  // Exact match
  if (ROUTE_ROLES[cleanPath]) {
    return ROUTE_ROLES[cleanPath].includes(role)
  }

  // Parameterized routes check
  if (cleanPath.startsWith('/classroom/review')) {
    return ROUTE_ROLES['/classroom/review'].includes(role)
  }
  if (cleanPath.includes('/submissions/')) {
    return ['owner', 'admin', 'trainer'].includes(role)
  }
  if (cleanPath.startsWith('/classroom/')) {
    return ROUTE_ROLES['/classroom'].includes(role)
  }
  if (cleanPath.startsWith('/s/') || cleanPath === '/s') {
    return ROUTE_ROLES['/s'].includes(role)
  }
  if (cleanPath.startsWith('/sessions/')) {
    return ROUTE_ROLES['/sessions'].includes(role)
  }
  if (cleanPath.startsWith('/students/')) {
    return ROUTE_ROLES['/students'].includes(role)
  }
  if (cleanPath.startsWith('/batches/')) {
    return ROUTE_ROLES['/batches'].includes(role)
  }
  if (cleanPath.startsWith('/trainers/')) {
    return ROUTE_ROLES['/trainers'].includes(role)
  }
  if (cleanPath.startsWith('/settings/')) {
    return ROUTE_ROLES['/settings'].includes(role)
  }

  // Public paths
  if (cleanPath === '/login' || cleanPath.startsWith('/verify/')) {
    return true
  }

  // Default fallback for unspecified sub-routes: check base segment
  const baseSegment = '/' + cleanPath.split('/')[1]
  if (ROUTE_ROLES[baseSegment]) {
    return ROUTE_ROLES[baseSegment].includes(role)
  }

  return true
}

/**
 * Trainer role must NEVER see any fee information, ₹ amounts, or financial reasons.
 */
export function canSeeFees(role: UserRole): boolean {
  return role !== 'trainer'
}

/**
 * Counselor may see fee STATUS (Paid/Due/Overdue) but never rupee amounts.
 * Only owner, admin, and accounts may see rupee amounts.
 */
export function canSeeFeeAmounts(role: UserRole): boolean {
  return role === 'owner' || role === 'admin' || role === 'accounts'
}
