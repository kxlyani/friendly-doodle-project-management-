import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-camp-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-camp-green border-t-transparent rounded-full animate-spin" />
          <p className="text-camp-text-secondary text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />
}
