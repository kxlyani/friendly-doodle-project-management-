import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { adminApi } from '../api/admin.api'

export default function AdminUsers() {
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState([])

  const filteredQ = useMemo(() => q.trim(), [q])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await adminApi.users(filteredQ || undefined)
      const data = res.data?.data || res.data
      setUsers(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setRole = async (userId, systemRole) => {
    try {
      await adminApi.updateUserRole(userId, systemRole)
      toast.success('Role updated')
      fetchUsers()
    } catch (e) {
      toast.error('Failed to update role')
    }
  }

  const impersonate = async (userId) => {
    const reason = window.prompt('Reason for impersonation?') || ''
    try {
      await adminApi.impersonate({ userId, reason, ttlMinutes: 30 })
      toast.success('Impersonation started')
      window.location.href = '/workspace'
    } catch {
      toast.error('Failed to start impersonation')
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-camp-text-primary">
            Users
          </h1>
          <p className="text-sm text-camp-text-secondary mt-1">
            Manage system roles and start break-glass impersonation.
          </p>
        </div>
        <button className="btn-secondary" onClick={fetchUsers}>
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-4 mb-4">
        <div className="flex gap-3">
          <input
            className="input flex-1"
            placeholder="Search by username, email, full name…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button className="btn-primary" onClick={fetchUsers}>
            Search
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 text-xs font-semibold text-camp-text-muted uppercase tracking-wider grid grid-cols-12 gap-3">
          <div className="col-span-4">User</div>
          <div className="col-span-4">Email</div>
          <div className="col-span-2">Role</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-camp-text-secondary">Loading…</div>
        ) : users.length === 0 ? (
          <div className="p-6 text-sm text-camp-text-secondary">No users.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {users.map((u) => (
              <div
                key={u._id}
                className="px-4 py-3 grid grid-cols-12 gap-3 items-center"
              >
                <div className="col-span-4">
                  <p className="text-sm font-medium text-camp-text-primary">
                    {u.fullName || u.username}
                  </p>
                  <p className="text-xs text-camp-text-muted">{u.username}</p>
                </div>
                <div className="col-span-4 text-sm text-camp-text-secondary truncate">
                  {u.email}
                </div>
                <div className="col-span-2 text-sm text-camp-text-secondary">
                  {u.systemRole}
                </div>
                <div className="col-span-2 flex justify-end gap-2">
                  {u.systemRole !== 'system_admin' ? (
                    <button
                      className="btn-secondary"
                      onClick={() => setRole(u._id, 'system_admin')}
                    >
                      Make admin
                    </button>
                  ) : (
                    <button
                      className="btn-secondary"
                      onClick={() => setRole(u._id, 'user')}
                    >
                      Make user
                    </button>
                  )}
                  <button className="btn-primary" onClick={() => impersonate(u._id)}>
                    Impersonate
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

