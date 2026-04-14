import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { adminApi } from '../api/admin.api'

function TransferOwnershipModal({
  open,
  projectName,
  users,
  loading,
  value,
  onChange,
  onClose,
  onConfirm,
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-camp-text-primary">
            Transfer ownership
          </h2>
          <p className="text-sm text-camp-text-secondary mt-1">
            Select the new owner for{' '}
            <span className="font-medium text-camp-text-primary">
              {projectName}
            </span>
            .
          </p>
        </div>

        <div className="p-5">
          {loading ? (
            <p className="text-sm text-camp-text-secondary">Loading users…</p>
          ) : (
            <select
              className="input w-full"
              value={value}
              onChange={(e) => onChange(e.target.value)}
            >
              <option value="">Select a user…</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {(u.fullName || u.username) + (u.email ? ` • ${u.email}` : '')}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="p-5 pt-0 flex justify-end gap-3">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" disabled={!value || loading} onClick={onConfirm}>
            Transfer
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminProjects() {
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState([])
  const [transferModalOpen, setTransferModalOpen] = useState(false)
  const [transferProject, setTransferProject] = useState(null)
  const [transferUsers, setTransferUsers] = useState([])
  const [transferUsersLoading, setTransferUsersLoading] = useState(false)
  const [newOwnerUserId, setNewOwnerUserId] = useState('')

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

  const openTransfer = async (project) => {
    setTransferProject(project)
    setNewOwnerUserId('')
    setTransferModalOpen(true)

    setTransferUsersLoading(true)
    try {
      const res = await adminApi.users()
      const data = res.data?.data || res.data
      setTransferUsers(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Failed to load users')
      setTransferUsers([])
    } finally {
      setTransferUsersLoading(false)
    }
  }

  const closeTransfer = () => {
    setTransferModalOpen(false)
    setTransferProject(null)
    setNewOwnerUserId('')
    setTransferUsers([])
    setTransferUsersLoading(false)
  }

  const confirmTransfer = async () => {
    if (!transferProject?._id || !newOwnerUserId) return
    try {
      await adminApi.transferOwnership(transferProject._id, newOwnerUserId)
      toast.success('Ownership transferred')
      closeTransfer()
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
                  <button className="btn-primary" onClick={() => openTransfer(p)}>
                    Transfer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <TransferOwnershipModal
        open={transferModalOpen}
        projectName={transferProject?.name || 'project'}
        users={transferUsers}
        loading={transferUsersLoading}
        value={newOwnerUserId}
        onChange={setNewOwnerUserId}
        onClose={closeTransfer}
        onConfirm={confirmTransfer}
      />
    </div>
  )
}

