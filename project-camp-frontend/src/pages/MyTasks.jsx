import { useEffect, useState } from 'react'
import { projectApi, normaliseProjects } from '../api/project.api'
import { taskApi } from '../api/task.api'
import { CheckSquare, Filter } from 'lucide-react'
import Badge from '../components/ui/Badge'
import Avatar from '../components/ui/Avatar'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function MyTasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

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

  const filtered = filter === 'all' ? tasks : tasks.filter((t) => t.status === filter)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8 animate-fadeIn">
        <div>
          <h1 className="font-display text-3xl text-camp-text-primary">All Tasks</h1>
          <p className="text-camp-text-secondary mt-1">{tasks.length} tasks across all projects</p>
        </div>

        {/* Filter */}
        <div className="flex gap-1 bg-white rounded-xl p-1 shadow-card">
          {['all', 'to_do', 'in_progress', 'done'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                filter === f
                  ? 'bg-camp-green text-white'
                  : 'text-camp-text-secondary hover:text-camp-text-primary'
              }`}
            >
              {f.replace('_', ' ')}
            </button>
          ))}
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
            description="You don't have any tasks matching this filter"
          />
        </div>
      ) : (
        <div className="space-y-3 stagger-children">
          {filtered.map((task) => (
            <div key={task._id} className="card hover:shadow-card-hover transition-shadow animate-fadeIn">
              <div className="flex items-start gap-4">
                <div className={`mt-1 w-3 h-3 rounded-full flex-shrink-0 ${
                  task.status === 'done' ? 'bg-green-400' :
                  task.status === 'in_progress' ? 'bg-blue-400' : 'bg-gray-200'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className={`font-medium text-sm ${task.status === 'done' ? 'line-through text-camp-text-muted' : 'text-camp-text-primary'}`}>
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-xs text-camp-text-secondary mt-1 line-clamp-2">{task.description}</p>
                      )}
                    </div>
                    <Badge variant={task.status} label={task.status?.replace('_', ' ')} />
                  </div>
                  <div className="flex items-center gap-4 mt-3">
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
                    {task.subtasks?.length > 0 && (
                      <span className="text-xs text-camp-text-muted">
                        {task.subtasks.filter((s) => s.isCompleted).length}/{task.subtasks.length} subtasks
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}