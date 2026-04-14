import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RoleRoute({ requireSystemAdmin = false }) {
  const { user, loading } = useAuth()

  if (loading) return <Outlet />

  if (!user) return <Navigate to="/login" replace />

  if (requireSystemAdmin && user.systemRole !== 'system_admin') {
    return <Navigate to="/workspace" replace />
  }

  return <Outlet />
}

