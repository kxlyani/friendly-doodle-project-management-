import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { adminApi } from '../api/admin.api'

export default function AdminAudit() {
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState([])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const res = await adminApi.audit()
      const data = res.data?.data || res.data
      setLogs(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  return (
    <div className="p-6">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-camp-text-primary">
            Audit
          </h1>
          <p className="text-sm text-camp-text-secondary mt-1">
            Admin actions across the system.
          </p>
        </div>
        <button className="btn-secondary" onClick={fetchLogs}>
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 text-xs font-semibold text-camp-text-muted uppercase tracking-wider grid grid-cols-12 gap-3">
          <div className="col-span-3">When</div>
          <div className="col-span-3">Actor</div>
          <div className="col-span-3">Action</div>
          <div className="col-span-3">Target</div>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-camp-text-secondary">Loading…</div>
        ) : logs.length === 0 ? (
          <div className="p-6 text-sm text-camp-text-secondary">No logs.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {logs.map((l) => (
              <div
                key={l._id}
                className="px-4 py-3 grid grid-cols-12 gap-3 items-center"
              >
                <div className="col-span-3 text-sm text-camp-text-secondary">
                  {l.createdAt ? new Date(l.createdAt).toLocaleString() : '—'}
                </div>
                <div className="col-span-3 text-sm text-camp-text-secondary">
                  {l.actor?.email || l.actor?.username || '—'}
                </div>
                <div className="col-span-3 text-sm text-camp-text-secondary">
                  {String(l.action || '').replace(/_/g, ' ')}
                </div>
                <div className="col-span-3 text-sm text-camp-text-secondary truncate">
                  {l.target?.type}: {l.target?.label}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

