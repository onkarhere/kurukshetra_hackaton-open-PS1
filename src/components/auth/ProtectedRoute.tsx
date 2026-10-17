import React from 'react'
import { Navigate, useLocation, Outlet, Link } from 'react-router-dom'
import { ShieldAlert, ArrowLeft } from 'lucide-react'
import { useApp } from '@/context/AppContext'

interface ProtectedRouteProps {
  children?: React.ReactNode
  allowedRoles?: string[]
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, role } = useApp()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // P0-3: If unauthorized, show "You don't have access to this page" panel with a link home (not a silent redirect)
  if (allowedRoles && !allowedRoles.includes(role)) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-14 h-14 rounded-full bg-danger/10 text-danger flex items-center justify-center mb-4">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-semibold text-text">You don't have access to this page</h2>
        <p className="text-xs text-text-muted mt-1.5 max-w-sm leading-relaxed">
          Your current role (<strong>{role}</strong>) does not have authorization to view this resource. Contact an administrator to adjust permissions.
        </p>
        <Link
          to={role === 'student' ? '/s' : '/'}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-control bg-surface border border-border hover:bg-surface-sunken transition-colors text-text shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to {role === 'student' ? 'Student Portal' : 'Dashboard'}</span>
        </Link>
      </div>
    )
  }

  return children ? <>{children}</> : <Outlet />
}
