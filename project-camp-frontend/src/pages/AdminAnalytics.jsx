import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { adminApi } from '../api/admin.api'

function Card({ title, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-5">
      <p className="text-sm font-medium text-camp-text-primary">{title}</p>
      <div className="mt-4">{children}</div>
    </div>
  )
}

function BarRow({ label, value, max }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <div className="w-28 text-sm text-camp-text-secondary">{label}</div>
      <div className="flex-1 h-2 bg-camp-bg rounded-full overflow-hidden">
        <div className="h-full bg-camp-green" style={{ width: `${pct}%` }} />
      </div>
      <div className="w-10 text-right text-sm text-camp-text-primary font-medium">
        {value}
      </div>
    </div>
  )
}

export default function AdminAnalytics() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await adminApi.analyticsOverview()
        const d = res.data?.data || res.data
        if (mounted) setData(d || null)
      } catch {
        toast.error('Failed to load analytics')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const statusRows = useMemo(() => {
    const m = data?.tasksByStatus || {}
    return [
      { key: 'to_do', label: 'To do', value: Number(m.to_do || 0) },
      { key: 'in_progress', label: 'In progress', value: Number(m.in_progress || 0) },
      { key: 'done', label: 'Done', value: Number(m.done || 0) },
    ]
  }, [data])

  const priorityRows = useMemo(() => {
    const m = data?.tasksByPriority || {}
    return [
      { key: 'low', label: 'Low', value: Number(m.low || 0) },
      { key: 'medium', label: 'Medium', value: Number(m.medium || 0) },
      { key: 'high', label: 'High', value: Number(m.high || 0) },
      { key: 'urgent', label: 'Urgent', value: Number(m.urgent || 0) },
    ]
  }, [data])

  const maxStatus = Math.max(...statusRows.map((r) => r.value), 0)
  const maxPriority = Math.max(...priorityRows.map((r) => r.value), 0)

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-camp-text-primary">
          Analytics
        </h1>
        <p className="text-sm text-camp-text-secondary mt-1">
          System-level insights.
        </p>
      </div>

      {loading ? (
        <div className="text-camp-text-secondary text-sm">Loading…</div>
      ) : !data ? (
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-5 text-sm text-camp-text-secondary">
          No analytics data available.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card title="Projects created">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-camp-text-secondary">Last 7 days</span>
                <span className="text-camp-text-primary font-medium">
                  {data.projectsCreated?.last7d ?? 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-camp-text-secondary">Last 30 days</span>
                <span className="text-camp-text-primary font-medium">
                  {data.projectsCreated?.last30d ?? 0}
                </span>
              </div>
            </div>
          </Card>

          <Card title="Overdue tasks">
            <p className="text-3xl font-semibold text-camp-text-primary">
              {data.overdueTasks ?? 0}
            </p>
            <p className="text-sm text-camp-text-secondary mt-1">
              Tasks with a due date in the past and not done.
            </p>
          </Card>

          <Card title="Tasks by status">
            <div className="space-y-3">
              {statusRows.map((r) => (
                <BarRow key={r.key} label={r.label} value={r.value} max={maxStatus} />
              ))}
            </div>
          </Card>

          <div className="lg:col-span-3">
            <Card title="Tasks by priority">
              <div className="space-y-3">
                {priorityRows.map((r) => (
                  <BarRow key={r.key} label={r.label} value={r.value} max={maxPriority} />
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

