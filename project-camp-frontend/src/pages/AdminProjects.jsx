import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { adminApi } from '../api/admin.api'

export default function AdminProjects() {
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState([])

  const filteredQ = useMemo(() => q.trim(), [q])

  const fetchProjects = async () => {
    setLoading(true)
    try {
      const res = await adminApi.projects(filteredQ || undefined)
      const data = res.data?.data || res.data
      setProjects(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const archive = async (projectId) => {
    try {
      await adminApi.archiveProject(projectId)
      toast.success('Project archived')
      fetchProjects()
    } catch {
      toast.error('Failed to archive project')
    }
  }

  const restore = async (projectId) => {
    try {
      await adminApi.restoreProject(projectId)
      toast.success('Project restored')
      fetchProjects()
    } catch {
      toast.error('Failed to restore project')
    }
  }

  const transfer = async (projectId) => {
    const newOwnerUserId = window.prompt('New owner userId?')
    if (!newOwnerUserId) return
    try {
      await adminApi.transferOwnership(projectId, newOwnerUserId)
      toast.success('Ownership transferred')
      fetchProjects()
    } catch {
      toast.error('Failed to transfer ownership')
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-camp-text-primary">
            Projects
          </h1>
          <p className="text-sm text-camp-text-secondary mt-1">
            Archive/restore and transfer ownership.
          </p>
        </div>
        <button className="btn-secondary" onClick={fetchProjects}>
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-4 mb-4">
        <div className="flex gap-3">
          <input
            className="input flex-1"
            placeholder="Search projects by name/description…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button className="btn-primary" onClick={fetchProjects}>
            Search
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 text-xs font-semibold text-camp-text-muted uppercase tracking-wider grid grid-cols-12 gap-3">
          <div className="col-span-5">Project</div>
          <div className="col-span-3">Created</div>
          <div className="col-span-2">Archived</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-camp-text-secondary">Loading…</div>
        ) : projects.length === 0 ? (
          <div className="p-6 text-sm text-camp-text-secondary">No projects.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {projects.map((p) => (
              <div
                key={p._id}
                className="px-4 py-3 grid grid-cols-12 gap-3 items-center"
              >
                <div className="col-span-5">
                  <p className="text-sm font-medium text-camp-text-primary">
                    {p.name}
                  </p>
                  <p className="text-xs text-camp-text-muted line-clamp-1">
                    {p.description || '—'}
                  </p>
                </div>
                <div className="col-span-3 text-sm text-camp-text-secondary">
                  {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}
                </div>
                <div className="col-span-2 text-sm text-camp-text-secondary">
                  {p.archivedAt ? 'Yes' : 'No'}
                </div>
                <div className="col-span-2 flex justify-end gap-2">
                  {p.archivedAt ? (
                    <button className="btn-secondary" onClick={() => restore(p._id)}>
                      Restore
                    </button>
                  ) : (
                    <button className="btn-secondary" onClick={() => archive(p._id)}>
                      Archive
                    </button>
                  )}
                  <button className="btn-primary" onClick={() => transfer(p._id)}>
                    Transfer
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

