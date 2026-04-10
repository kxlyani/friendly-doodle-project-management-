import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { projectApi, normaliseProjects } from '../api/project.api'
import { taskApi } from '../api/task.api'
import { CheckSquare, Calendar, Tag } from 'lucide-react'
import Badge from '../components/ui/Badge'
import Avatar from '../components/ui/Avatar'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

function formatDate(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  const isOverdue = d < new Date() 
  return { label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }), isOverdue }
}

export default function MyTasks() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [onlyMine, setOnlyMine] = useState(false)

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const projectsRes = await projectApi.getProjects()
        const raw = projectsRes.data?.data ?? projectsRes.data ?? []
        const projects = normaliseProjects(Array.isArray(raw) ? raw : [])

        const taskArrays = await Promise.all(
          projects
            .filter((p) => p._id || p.id)
            .map((p) => {
              const pid = p._id || p.id
              return taskApi.getTasks(pid)
                .then((r) => {
                  const tasks = r.data?.data ?? r.data ?? []
                  const arr = Array.isArray(tasks) ? tasks : []
                  return arr.map((t) => ({ ...t, projectName: p.name, projectId: pid }))
                })
                .catch(() => [])
            })
        )
        setTasks(taskArrays.flat())
      } catch {
        toast.error('Failed to load tasks')
      } finally {
        setLoading(false)
      }
    }
    fetchTasks()
  }, [])

  const filtered = tasks
    .filter((t) => statusFilter === 'all' || t.status === statusFilter)
    .filter((t) => {
      if (!onlyMine) return true
      const assignedId = t.assignedTo?._id || t.assignedTo
      return assignedId === (user?._id || user?.id)
    })

  const myCount = tasks.filter((t) => {
    const assignedId = t.assignedTo?._id || t.assignedTo
    return assignedId === (user?._id || user?.id)
  }).length

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-start justify-between mb-8 animate-fadeIn">
        <div>
          <h1 className="font-display text-3xl text-camp-text-primary">All Tasks</h1>
          <p className="text-camp-text-secondary mt-1">{tasks.length} tasks across all projects</p>
        </div>

        <div className="flex flex-col items-end gap-2">
          {/* Status filter */}
          <div className="flex gap-1 bg-white rounded-xl p-1 shadow-card">
            {['all', 'to_do', 'in_progress', 'done'].map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                  statusFilter === f
                    ? 'bg-camp-green text-white'
                    : 'text-camp-text-secondary hover:text-camp-text-primary'
                }`}
              >
                {f.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          {/* Assigned to me toggle */}
          <button
            onClick={() => setOnlyMine((v) => !v)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
              onlyMine
                ? 'bg-camp-green text-white border-camp-green'
                : 'bg-white text-camp-text-secondary border-gray-200 hover:border-camp-green hover:text-camp-green'
            }`}
          >
            <CheckSquare size={12} />
            Assigned to me
            <span className={`px-1.5 py-0.5 rounded-md text-xs font-semibold ${
              onlyMine ? 'bg-white/20 text-white' : 'bg-camp-bg text-camp-text-muted'
            }`}>
              {myCount}
            </span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={CheckSquare}
            title="No tasks found"
            description={onlyMine ? "No tasks are assigned to you" : "No tasks match this filter"}
          />
        </div>
      ) : (
        <div className="space-y-3 stagger-children">
          {filtered.map((task) => {
            const due = formatDate(task.dueDate)
            return (
              <div key={task._id} className="card hover:shadow-card-hover transition-shadow animate-fadeIn">
                <div className="flex items-start gap-4">
                  <div className={`mt-1 w-3 h-3 rounded-full flex-shrink-0 ${
                    task.status === 'done' ? 'bg-green-400' :
                    task.status === 'in_progress' ? 'bg-blue-400' : 'bg-gray-200'
                  }`} />
                  <div className="flex-1 min-w-0">
                    {/* Title row */}
                    <div className="flex items-start justify-between gap-3">
                      <p className={`font-medium text-sm ${task.status === 'done' ? 'line-through text-camp-text-muted' : 'text-camp-text-primary'}`}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {task.priority && (
                          <Badge variant={task.priority} label={task.priority} />
                        )}
                        <Badge variant={task.status} label={task.status?.replace(/_/g, ' ')} />
                      </div>
                    </div>

                    {task.description && (
                      <p className="text-xs text-camp-text-secondary mt-1 line-clamp-2">{task.description}</p>
                    )}

                    {/* Meta row */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3">
                      <Link
                        to={`/projects/${task.projectId}`}
                        className="text-xs text-camp-green hover:underline font-medium"
                      >
                        {task.projectName}
                      </Link>

                      {task.assignedTo && (
                        <div className="flex items-center gap-1.5">
                          <Avatar name={task.assignedTo?.fullName || task.assignedTo?.username || 'U'} size="xs" />
                          <span className="text-xs text-camp-text-muted">
                            {task.assignedTo?.fullName || task.assignedTo?.username}
                          </span>
                        </div>
                      )}

                      {due && (
                        <div className={`flex items-center gap-1 text-xs ${due.isOverdue && task.status !== 'done' ? 'text-red-500' : 'text-camp-text-muted'}`}>
                          <Calendar size={11} />
                          {due.label}
                          {due.isOverdue && task.status !== 'done' && <span className="font-medium"> · Overdue</span>}
                        </div>
                      )}

                      {task.subtasks?.length > 0 && (
                        <span className="text-xs text-camp-text-muted">
                          {task.subtasks.filter((s) => s.isCompleted).length}/{task.subtasks.length} subtasks
                        </span>
                      )}
                    </div>

                    {/* Tags */}
                    {task.tags?.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <Tag size={11} className="text-camp-text-muted flex-shrink-0" />
                        {task.tags.map((tag) => (
                          <span key={tag} className="text-xs bg-camp-bg text-camp-text-secondary px-2 py-0.5 rounded-lg">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
