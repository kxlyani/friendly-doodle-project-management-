import { useEffect, useState } from 'react'
import { projectApi, normaliseProjects } from '../api/project.api'
import { noteApi } from '../api/note.api'
import { FileText } from 'lucide-react'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function Notes() {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const projectsRes = await projectApi.getProjects()
        const raw = projectsRes.data?.data ?? projectsRes.data ?? []
        const projects = normaliseProjects(Array.isArray(raw) ? raw : [])

        const noteArrays = await Promise.all(
          projects
            .filter((p) => p._id || p.id)
            .map((p) => {
              const pid = p._id || p.id
              return noteApi.getNotes(pid)
                .then((r) => {
                  const notes = r.data?.data ?? r.data ?? []
                  const arr = Array.isArray(notes) ? notes : []
                  return arr.map((n) => ({ ...n, projectName: p.name, projectId: pid }))
                })
                .catch(() => [])
            })
        )
        setNotes(noteArrays.flat())
      } catch {
        toast.error('Failed to load notes')
      } finally {
        setLoading(false)
      }
    }
    fetchNotes()
  }, [])

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8 animate-fadeIn">
        <div>
          <h1 className="font-display text-3xl text-camp-text-primary">Notes</h1>
          <p className="text-camp-text-secondary mt-1">{notes.length} notes across all projects</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : notes.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={FileText}
            title="No notes yet"
            description="Notes are created per project by project admins. Go to a project to add notes."
            action={<Link to="/projects" className="btn-primary">Go to Projects</Link>}
          />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-5 stagger-children">
          {notes.map((note) => (
            <div key={note._id} className="card animate-fadeIn group hover:shadow-card-hover transition-shadow">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-camp-green/10 rounded-xl flex items-center justify-center">
                  <FileText size={14} className="text-camp-green" />
                </div>
                <Link
                  to={`/projects/${note.projectId}`}
                  className="text-xs text-camp-green hover:underline font-medium"
                >
                  {note.projectName}
                </Link>
              </div>
              <h3 className="font-semibold text-camp-text-primary mb-2">{note.title}</h3>
              <p className="text-sm text-camp-text-secondary line-clamp-4">{note.content}</p>
              <p className="text-xs text-camp-text-muted mt-4">
                {note.createdAt ? new Date(note.createdAt).toLocaleDateString() : ''}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}