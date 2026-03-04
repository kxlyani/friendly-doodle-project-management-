import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { projectApi, getProjectId, normaliseProjects } from '../api/project.api'
import { Plus, FolderOpen, Users, ArrowRight, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import Spinner from '../components/ui/Spinner'
import Modal from '../components/ui/Modal'
import ConfirmModal from '../components/ui/ConfirmModal'
import EmptyState from '../components/ui/EmptyState'
import { useAuth } from '../context/AuthContext'

function ProjectCard({ project, onDelete, currentUser }) {
  const pid = getProjectId(project)
  // currentUserRole is set by normaliseProjects from the aggregation's `role` field
  const isAdmin = project.currentUserRole === 'admin'

  return (
    <div className="card hover:shadow-card-hover transition-all duration-200 group relative animate-fadeIn">
      <div className="h-1.5 bg-camp-green rounded-t-full -mt-6 -mx-6 mb-4 opacity-70" />

      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-camp-text-primary text-lg group-hover:text-camp-green transition-colors truncate">
            {project.name}
          </h3>
          <p className="text-camp-text-secondary text-sm mt-1 line-clamp-2">
            {project.description || 'No description'}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(project) }}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-red-50 hover:text-red-500 text-camp-text-muted transition-colors opacity-0 group-hover:opacity-100"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 mt-4">
        <div className="flex items-center gap-1.5 text-camp-text-muted text-xs">
          <Users size={13} />
          <span>{typeof project.members === 'number' ? project.members : (project.memberCount ?? 0)} members</span>
        </div>
      </div>

      <Link
        to={`/projects/${pid}`}
        className="mt-4 flex items-center justify-between p-3 bg-camp-bg rounded-xl text-sm font-medium text-camp-text-primary hover:text-camp-green hover:bg-camp-green/5 transition-colors"
      >
        <span>Open project</span>
        <ArrowRight size={14} />
      </Link>
    </div>
  )
}

function CreateProjectModal({ isOpen, onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await projectApi.createProject(form)
      // Handle various response shapes
      const project = res.data?.data?.project || res.data?.data || res.data
      toast.success('Project created!')
      onCreated(project)
      onClose()
      setForm({ name: '', description: '' })
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create project')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Project">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-medium text-camp-text-secondary mb-1.5 block uppercase tracking-wider">
            Project Name
          </label>
          <input
            className="input"
            placeholder="My Awesome Project"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-camp-text-secondary mb-1.5 block uppercase tracking-wider">
            Description
          </label>
          <textarea
            className="input resize-none"
            rows={3}
            placeholder="What's this project about?"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </div>
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
            {loading && <Spinner size="sm" />}
            Create Project
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default function Projects() {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await projectApi.getProjects()
        const raw = res.data?.data ?? res.data ?? []
        const list = normaliseProjects(Array.isArray(raw) ? raw : [])
        setProjects(list)
      } catch {
        toast.error('Failed to load projects')
      } finally {
        setLoading(false)
      }
    }
    fetchProjects()
  }, [])

  const handleCreated = (project) => {
    if (project && getProjectId(project)) {
      setProjects((prev) => [project, ...prev])
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const pid = getProjectId(deleteTarget)
    setDeleting(true)
    try {
      await projectApi.deleteProject(pid)
      setProjects((prev) => prev.filter((p) => getProjectId(p) !== pid))
      toast.success('Project deleted')
      setDeleteTarget(null)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete project')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8 animate-fadeIn">
        <div>
          <h1 className="font-display text-3xl text-camp-text-primary">Projects</h1>
          <p className="text-camp-text-secondary mt-1">{projects.length} total projects</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          New Project
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : projects.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={FolderOpen}
            title="No projects yet"
            description="Create your first project to start organising your team's work"
            action={
              <button onClick={() => setShowCreate(true)} className="btn-primary">
                Create Project
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-5">
          {projects.map((project) => {
            const pid = getProjectId(project)
            return (
              <ProjectCard
                key={pid || Math.random()}
                project={project}
                onDelete={setDeleteTarget}
                currentUser={user}
              />
            )
          })}
        </div>
      )}

      <CreateProjectModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={handleCreated}
      />

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Project"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
      />
    </div>
  )
}