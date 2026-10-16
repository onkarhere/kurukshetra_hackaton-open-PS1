import React from 'react'
import { Navigate, useLocation, Outlet } from 'react-router-dom'
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

  // If student tries to access admin dashboard, redirect to student portal
  if (role === 'student' && !location.pathname.startsWith('/s')) {
    return <Navigate to="/s" replace />
  }

  // If specific roles are required and user role is not permitted
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />
  }

  return children ? <>{children}</> : <Outlet />
}
