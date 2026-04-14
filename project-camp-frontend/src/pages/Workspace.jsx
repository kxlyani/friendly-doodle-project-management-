import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { projectApi, normaliseProjects } from '../api/project.api'
import { taskApi } from '../api/task.api'
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
    <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-5 flex items-center gap-4">
      <div
        className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center flex-shrink-0`}
      >
        <Icon size={20} className="text-white" />
      </div>
      <div>
        {loading ? (
          <div className="w-10 h-7 bg-camp-bg rounded animate-pulse" />
        ) : (
          <p className="text-2xl font-semibold text-camp-text-primary">
            {value}
          </p>
        )}
        <p className="text-xs text-camp-text-secondary font-medium">{label}</p>
      </div>
    </div>
  )
}

function ProjectOverviewCard({ project }) {
  const statusStages = [
    'Initiated',
    'In Planning',
    'In Development',
    'Testing',
    'Delivered',
  ]
  const progress = Math.min(Math.max(project.progress || 40, 0), 100)
  const stageIdx = Math.floor((progress / 100) * (statusStages.length - 1))

  return (
    <div className="bg-camp-green rounded-3xl p-6 text-white overflow-hidden relative">
      <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/5 rounded-full" />
      <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-white/5 rounded-full" />

      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-white/60 text-xs font-medium uppercase tracking-wider mb-1">
              Project overview
            </p>
            <h3 className="font-display text-xl text-white">{project.name}</h3>
            <p className="text-white/70 text-sm mt-1 line-clamp-2">
              {project.description}
            </p>
          </div>
          <Link
            to={`/projects/${project._id}`}
            className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
          >
            <ArrowRight size={14} className="text-white" />
          </Link>
        </div>

        <div className="mt-6">
          <div className="flex justify-between mb-2">
            {statusStages.map((stage, i) => (
              <span
                key={stage}
                className={`text-xs font-medium ${
                  i <= stageIdx ? 'text-white' : 'text-white/40'
                }`}
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

        {typeof project.members === 'number' && project.members > 0 && (
          <div className="flex items-center gap-2 mt-4">
            <Users size={14} className="text-white/60" />
            <span className="text-white/60 text-xs">
              {project.members} member{project.members !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

function RecentTaskCard({ task }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-camp-bg transition-colors">
      <div
        className={`w-2 h-2 rounded-full flex-shrink-0 ${
          task.status === 'done'
            ? 'bg-green-400'
            : task.status === 'in_progress'
              ? 'bg-blue-400'
              : 'bg-gray-300'
        }`}
      />
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium truncate ${
            task.status === 'done'
              ? 'line-through text-camp-text-muted'
              : 'text-camp-text-primary'
          }`}
        >
          {task.title}
        </p>
      </div>
      <Badge variant={task.status} label={task.status?.replace(/_/g, ' ')} />
    </div>
  )
}

export default function Workspace() {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [recentTasks, setRecentTasks] = useState([])
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [loadingTasks, setLoadingTasks] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await projectApi.getProjects()
        const raw = res.data?.data || res.data || []
        const projectList = normaliseProjects(Array.isArray(raw) ? raw : [])
        if (!mounted) return
        setProjects(projectList)

        const validProjects = projectList.filter((p) => p?._id)
        if (validProjects.length) {
          setLoadingTasks(true)
          const taskPromises = validProjects.slice(0, 3).map((p) =>
            taskApi
              .getTasks(p._id)
              .then((r) => {
                const tasks = r.data?.data || r.data || []
                return Array.isArray(tasks) ? tasks : []
              })
              .catch(() => []),
          )
          const taskArrays = await Promise.all(taskPromises)
          if (!mounted) return
          setRecentTasks(taskArrays.flat().slice(0, 6))
        }
      } catch {
        toast.error('Failed to load workspace data')
      } finally {
        if (mounted) {
          setLoadingProjects(false)
          setLoadingTasks(false)
        }
      }
    })()

    return () => {
      mounted = false
    }
  }, [])

  const completedTasks = useMemo(
    () => recentTasks.filter((t) => t.status === 'done').length,
    [recentTasks],
  )
  const inProgressTasks = useMemo(
    () => recentTasks.filter((t) => t.status === 'in_progress').length,
    [recentTasks],
  )

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-camp-text-primary">
            Welcome back, {user?.fullName?.split(' ')[0] || user?.username}
          </h1>
          <p className="text-camp-text-secondary mt-1">
            System role:{' '}
            <span className="text-camp-text-primary font-medium">
              {user?.systemRole || 'user'}
            </span>
          </p>
        </div>
        <Link to="/projects" className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          New Project
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={FolderOpen}
          label="Total Projects"
          value={projects.length}
          color="bg-camp-green"
          loading={loadingProjects}
        />
        <StatCard
          icon={CheckSquare}
          label="Tasks Done"
          value={completedTasks}
          color="bg-blue-500"
          loading={loadingTasks}
        />
        <StatCard
          icon={Clock}
          label="In Progress"
          value={inProgressTasks}
          color="bg-orange-400"
          loading={loadingTasks}
        />
        <StatCard
          icon={Users}
          label="Collaborators"
          value={0}
          color="bg-purple-500"
          loading={loadingProjects}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl text-camp-text-primary">
              Active Projects
            </h2>
            <Link
              to="/projects"
              className="text-sm text-camp-green hover:underline font-medium flex items-center gap-1"
            >
              View all <ArrowRight size={14} />
            </Link>
          </div>

          {loadingProjects ? (
            <div className="bg-white rounded-2xl shadow-card border border-gray-100 flex items-center justify-center h-48">
              <Spinner size="lg" />
            </div>
          ) : projects.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-card border border-gray-100 flex flex-col items-center justify-center h-48 text-center">
              <FolderOpen size={32} className="text-camp-text-muted mb-3" />
              <p className="font-semibold text-camp-text-primary">
                No projects yet
              </p>
              <p className="text-sm text-camp-text-secondary mt-1 mb-4">
                Create your first project to get started
              </p>
              <Link to="/projects" className="btn-primary">
                Go to Projects
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {projects.slice(0, 2).map((project) => (
                <ProjectOverviewCard key={project._id} project={project} />
              ))}
              {projects.length > 2 && (
                <Link
                  to="/projects"
                  className="block bg-white rounded-2xl shadow-card border border-gray-100 text-center py-4 text-sm text-camp-green font-medium hover:shadow-card-hover transition-shadow"
                >
                  View {projects.length - 2} more projects →
                </Link>
              )}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl text-camp-text-primary">
              Recent Tasks
            </h2>
            <Link
              to="/tasks"
              className="text-sm text-camp-green hover:underline font-medium"
            >
              All tasks
            </Link>
          </div>

          <div className="bg-white rounded-2xl shadow-card border border-gray-100">
            {loadingTasks ? (
              <div className="flex items-center justify-center py-8">
                <Spinner />
              </div>
            ) : recentTasks.length === 0 ? (
              <div className="text-center py-8">
                <CheckSquare
                  size={28}
                  className="text-camp-text-muted mx-auto mb-2"
                />
                <p className="text-sm text-camp-text-secondary">No tasks yet</p>
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {recentTasks.map((task) => (
                  <RecentTaskCard key={task._id || task.id} task={task} />
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 bg-camp-green/5 border border-camp-green/10 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={14} className="text-camp-green" />
              <p className="text-xs font-semibold text-camp-green uppercase tracking-wider">
                Tip
              </p>
            </div>
            <p className="text-xs text-camp-text-secondary">
              System admins see the Admin dashboard. Project managers can create
              tasks and notes inside projects. Members can work on tasks and
              subtasks.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

