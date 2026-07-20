import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from './AuthProvider'
import type { UserRole } from '../lib/authStore'

type Props = {
  children: ReactNode
  /** Role yang diizinkan; jika tidak cocok → ke beranda */
  allow: UserRole | UserRole[]
}

export default function RequireAuth({ children, allow }: Props) {
  const user = useAuth()
  const location = useLocation()
  const roles = Array.isArray(allow) ? allow : [allow]

  if (!user) {
    return (
      <Navigate to="/login" replace state={{ from: location.pathname }} />
    )
  }

  if (!roles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return children
}
