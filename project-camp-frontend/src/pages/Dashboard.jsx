import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { projectApi, normaliseProjects } from '../api/project.api'
import { taskApi } from '../api/task.api'
import { Link } from 'react-router-dom'
import {
  FolderOpen,
  CheckSquare,
  Users,
  TrendingUp,
  Plus,
  ArrowRight,
  Calendar,
  Clock,
} from 'lucide-react'
import Badge from '../components/ui/Badge'
import Spinner from '../components/ui/Spinner'
import toast from 'react-hot-toast'

function StatCard({ icon: Icon, label, value, color, loading }) {
  return (
    <div className="card flex items-center gap-4 hover:shadow-card-hover transition-shadow duration-200 cursor-default">
      <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center flex-shrink-0`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        {loading ? (
          <div className="w-8 h-6 bg-camp-bg rounded animate-pulse" />
        ) : (
          <p className="text-2xl font-display text-camp-text-primary">{value}</p>
        )}
        <p className="text-xs text-camp-text-secondary font-medium">{label}</p>
      </div>
    </div>
  )
}

function ProjectOverviewCard({ project }) {
  const statusStages = ['Initiated', 'In Planning', 'In Development', 'Testing', 'Delivered']
  const progress = Math.min(Math.max(project.progress || 40, 0), 100)
  const stageIdx = Math.floor((progress / 100) * (statusStages.length - 1))
  // Support both _id and id field names
  const projectId = project._id || project.id

  return (
    <div className="bg-camp-green rounded-3xl p-6 text-white overflow-hidden relative">
      <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/5 rounded-full" />
      <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-white/5 rounded-full" />

      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-white/60 text-xs font-medium uppercase tracking-wider mb-1">Project overview</p>
            <h3 className="font-display text-xl text-white">{project.name}</h3>
            <p className="text-white/70 text-sm mt-1 line-clamp-2">{project.description}</p>
          </div>
          <Link
            to={`/projects/${projectId}`}
            className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
          >
            <ArrowRight size={14} className="text-white" />
          </Link>
        </div>

        {/* Progress pipeline */}
        <div className="mt-6">
          <div className="flex justify-between mb-2">
            {statusStages.map((stage, i) => (
              <span
                key={stage}
                className={`text-xs font-medium ${i <= stageIdx ? 'text-white' : 'text-white/40'}`}
              >
                {stage}
              </span>
            ))}
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-300 rounded-full transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-3">
            <span className="text-white/70 text-xs">{progress}% complete</span>
            {project.dueDate && (
              <div className="flex items-center gap-1.5 text-white/70 text-xs">
                <Calendar size={12} />
                <span>Due {new Date(project.dueDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Members count */}
        {(typeof project.members === 'number' ? project.members : 0) > 0 && (
          <div className="flex items-center gap-2 mt-4">
            <Users size={14} className="text-white/60" />
            <span className="text-white/60 text-xs">{project.members} member{project.members !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function RecentTaskCard({ task }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-camp-bg transition-colors">
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
        task.status === 'done' ? 'bg-green-400' :
        task.status === 'in_progress' ? 'bg-blue-400' : 'bg-gray-300'
      }`} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${
          task.status === 'done' ? 'line-through text-camp-text-muted' : 'text-camp-text-primary'
        }`}>
          {task.title}
        </p>
      </div>
      <Badge variant={task.status} label={task.status?.replace('_', ' ')} />
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [recentTasks, setRecentTasks] = useState([])
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [loadingTasks, setLoadingTasks] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await projectApi.getProjects()
        const raw = res.data?.data || res.data || []
        const projectList = normaliseProjects(Array.isArray(raw) ? raw : [])
        setProjects(projectList)

        // Only fetch tasks for projects that have a valid id
        const validProjects = projectList.filter((p) => p._id || p.id)
        if (validProjects.length > 0) {
          setLoadingTasks(true)
          const taskPromises = validProjects.slice(0, 3).map((p) => {
            const pid = p._id || p.id
            return taskApi.getTasks(pid)
              .then((r) => {
                const tasks = r.data?.data || r.data || []
                return Array.isArray(tasks) ? tasks : []
              })
              .catch(() => [])
          })
          const taskArrays = await Promise.all(taskPromises)
          setRecentTasks(taskArrays.flat().slice(0, 6))
        }
      } catch (err) {
        toast.error('Failed to load dashboard data')
      } finally {
        setLoadingProjects(false)
        setLoadingTasks(false)
      }
    }

    fetchData()
  }, [])

  const completedTasks = recentTasks.filter((t) => t.status === 'done').length
  const inProgressTasks = recentTasks.filter((t) => t.status === 'in_progress').length
  const collaboratorCount = [...new Set(
    projects.flatMap((p) => {
      // members is a count number from aggregation — can't extract IDs from it
      return []
    })
  )].length

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 animate-fadeIn">
        <div>
          <h1 className="font-display text-3xl text-camp-text-primary">
            Good morning, {user?.fullName?.split(' ')[0] || user?.username}
          </h1>
          <p className="text-camp-text-secondary mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link to="/projects" className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          New Project
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { icon: FolderOpen, label: 'Total Projects', value: projects.length, color: 'bg-camp-green', loading: loadingProjects },
          { icon: CheckSquare, label: 'Tasks Done', value: completedTasks, color: 'bg-blue-500', loading: loadingTasks },
          { icon: Clock, label: 'In Progress', value: inProgressTasks, color: 'bg-orange-400', loading: loadingTasks },
          { icon: Users, label: 'Collaborators', value: collaboratorCount, color: 'bg-purple-500', loading: loadingProjects },
        ].map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Project Overview */}
        <div className="col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl text-camp-text-primary">Active Projects</h2>
            <Link to="/projects" className="text-sm text-camp-green hover:underline font-medium flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>

          {loadingProjects ? (
            <div className="card flex items-center justify-center h-48">
              <Spinner size="lg" />
            </div>
          ) : projects.length === 0 ? (
            <div className="card flex flex-col items-center justify-center h-48 text-center">
              <FolderOpen size={32} className="text-camp-text-muted mb-3" />
              <p className="font-semibold text-camp-text-primary">No projects yet</p>
              <p className="text-sm text-camp-text-secondary mt-1 mb-4">Create your first project to get started</p>
              <Link to="/projects" className="btn-primary">Go to Projects</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {projects.slice(0, 2).map((project) => {
                const pid = project._id || project.id
                return <ProjectOverviewCard key={pid} project={project} />
              })}
              {projects.length > 2 && (
                <Link
                  to="/projects"
                  className="block card text-center text-sm text-camp-green font-medium hover:shadow-card-hover transition-shadow"
                >
                  View {projects.length - 2} more projects →
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Recent Tasks */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl text-camp-text-primary">Recent Tasks</h2>
            <Link to="/tasks" className="text-sm text-camp-green hover:underline font-medium">
              All tasks
            </Link>
          </div>

          <div className="card">
            {loadingTasks ? (
              <div className="flex items-center justify-center py-8">
                <Spinner />
              </div>
            ) : recentTasks.length === 0 ? (
              <div className="text-center py-8">
                <CheckSquare size={28} className="text-camp-text-muted mx-auto mb-2" />
                <p className="text-sm text-camp-text-secondary">No tasks yet</p>
              </div>
            ) : (
              <div className="space-y-1">
                {recentTasks.map((task) => {
                  const tid = task._id || task.id
                  return <RecentTaskCard key={tid} task={task} />
                })}
              </div>
            )}
          </div>

          <div className="mt-4 bg-camp-green/5 border border-camp-green/10 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={14} className="text-camp-green" />
              <p className="text-xs font-semibold text-camp-green uppercase tracking-wider">Tip</p>
            </div>
            <p className="text-xs text-camp-text-secondary">
              Admins manage everything, project admins handle tasks, and members can mark subtasks complete.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}