import { useEffect, useState } from 'react'

export default function AdminAnalytics() {
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Placeholder v1: backend analytics endpoint can be wired later.
    setLoading(false)
  }, [])

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-camp-text-primary">
          Analytics
        </h1>
        <p className="text-sm text-camp-text-secondary mt-1">
          System-level insights (v1).
        </p>
      </div>

      {loading ? (
        <div className="text-camp-text-secondary text-sm">Loading…</div>
      ) : (
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-5 text-sm text-camp-text-secondary">
          Add charts here once `GET /api/v1/admin/analytics/overview` is enabled.
        </div>
      )}
    </div>
  )
}

