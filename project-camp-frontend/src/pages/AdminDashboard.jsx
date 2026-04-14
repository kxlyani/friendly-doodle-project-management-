import { useEffect, useState } from 'react'
import { adminApi } from '../api/admin.api'
import toast from 'react-hot-toast'

function StatCard({ label, value }) {
  return (
    <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-5">
      <p className="text-sm text-camp-text-secondary">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-camp-text-primary">{value}</p>
    </div>
  )
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ users: 0, projects: 0, tasks: 0 })

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await adminApi.stats()
        const data = res.data?.data || res.data
        if (mounted && data) setStats(data)
      } catch (e) {
        toast.error('Failed to load admin stats')
      } finally {
        if (mounted) setLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-camp-text-primary">Admin</h1>
        <p className="text-sm text-camp-text-secondary mt-1">
          Global overview of users, projects, and tasks.
        </p>
      </div>

      {loading ? (
        <div className="text-camp-text-secondary text-sm">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard label="Users" value={stats.users} />
          <StatCard label="Projects" value={stats.projects} />
          <StatCard label="Tasks" value={stats.tasks} />
        </div>
      )}
    </div>
  )
}

