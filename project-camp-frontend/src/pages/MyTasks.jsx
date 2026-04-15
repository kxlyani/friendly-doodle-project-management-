import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { projectApi, normaliseProjects } from '../api/project.api'
import { taskApi } from '../api/task.api'
import { CheckSquare, Calendar, Filter, Search, Tag } from 'lucide-react'
import Badge from '../components/ui/Badge'
import Avatar from '../components/ui/Avatar'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'

function formatDate(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  const isOverdue = d < new Date() 
  return { label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }), isOverdue }
}

export default function MyTasks() {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [stats, setStats] = useState({
    total: 0,
    to_do: 0,
    in_progress: 0,
    done: 0,
    overdueCount: 0,
    dueTodayCount: 0,
    byPriority: {},
  })
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    projectId: 'all',
    onlyMine: false,
    overdueOnly: false,
    search: '',
    from: '',
    to: '',
  })
  const [searchInput, setSearchInput] = useState('')
  const [selectedTaskId, setSelectedTaskId] = useState(null)

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const projectsRes = await projectApi.getProjects()
        const raw = projectsRes.data?.data ?? projectsRes.data ?? []
        const allProjects = normaliseProjects(Array.isArray(raw) ? raw : [])
        setProjects(allProjects)
      } catch {
        setProjects([])
      }
    }

    fetchProjects()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput.trim() }))
    }, 350)
    return () => clearTimeout(timer)
  }, [searchInput])

  const activeParams = useMemo(() => {
    const params = {}
    if (filters.status !== 'all') params.status = filters.status
    if (filters.priority !== 'all') params.priority = filters.priority
    if (filters.projectId !== 'all') params.projectIds = filters.projectId
    if (filters.onlyMine) params.onlyMine = true
    if (filters.overdueOnly) params.overdue = true
    if (filters.search) params.search = filters.search
    if (filters.from) params.from = filters.from
    if (filters.to) params.to = filters.to
    params.sortBy = 'dueDate'
    params.sortOrder = 'asc'
    return params
  }, [filters])

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true)
      try {
        const res = await taskApi.getMyDashboard(activeParams)
        const data = res.data?.data ?? {}
        const nextTasks = Array.isArray(data.tasks) ? data.tasks : []
        setTasks(nextTasks)
        setStats(data.stats || {
          total: 0,
          to_do: 0,
          in_progress: 0,
          done: 0,
          overdueCount: 0,
          dueTodayCount: 0,
          byPriority: {},
        })
        if (nextTasks.length && !nextTasks.find((task) => task._id === selectedTaskId)) {
          setSelectedTaskId(nextTasks[0]._id)
        }
      } catch {
        toast.error('Failed to load tasks')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [activeParams])

  const myCount = useMemo(() => {
    return tasks.filter((t) => {
      const assignedId = t.assignedTo?._id || t.assignedTo
      return assignedId === (user?._id || user?.id)
    }).length
  }, [tasks, user])

  const statusOptions = ['all', 'to_do', 'in_progress', 'done']
  const priorityOptions = ['all', 'low', 'medium', 'high', 'urgent']

  const calendarEvents = useMemo(() => {
    return tasks
      .filter((task) => task.dueDate)
      .map((task) => ({
        id: task._id,
        title: task.title,
        date: task.dueDate,
        extendedProps: {
          status: task.status,
          priority: task.priority,
          projectName: task.projectName,
        },
      }))
  }, [tasks])

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between animate-fadeIn">
        <div>
          <h1 className="font-display text-3xl text-camp-text-primary">My Task Dashboard</h1>
          <p className="text-camp-text-secondary mt-1">{stats.total} tasks matching current filters</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
        <div className="card">
          <p className="text-xs text-camp-text-muted">Total</p>
          <p className="text-2xl font-semibold text-camp-text-primary mt-1">{stats.total}</p>
        </div>
        <div className="card">
          <p className="text-xs text-camp-text-muted">To Do</p>
          <p className="text-2xl font-semibold text-camp-text-primary mt-1">{stats.to_do}</p>
        </div>
        <div className="card">
          <p className="text-xs text-camp-text-muted">In Progress</p>
          <p className="text-2xl font-semibold text-blue-600 mt-1">{stats.in_progress}</p>
        </div>
        <div className="card">
          <p className="text-xs text-camp-text-muted">Done</p>
          <p className="text-2xl font-semibold text-green-600 mt-1">{stats.done}</p>
        </div>
        <div className="card">
          <p className="text-xs text-camp-text-muted">Overdue</p>
          <p className="text-2xl font-semibold text-red-500 mt-1">{stats.overdueCount}</p>
        </div>
        <div className="card">
          <p className="text-xs text-camp-text-muted">Due Today</p>
          <p className="text-2xl font-semibold text-amber-600 mt-1">{stats.dueTodayCount}</p>
        </div>
      </div>

      <div className="card space-y-4">
        <div className="flex items-center gap-2 text-camp-text-secondary">
          <Filter size={15} />
          <p className="text-sm font-medium">Filters</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <label className="text-xs text-camp-text-muted">
            Status
            <select
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white"
            >
              {statusOptions.map((value) => (
                <option key={value} value={value}>
                  {value === 'all' ? 'All statuses' : value.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs text-camp-text-muted">
            Priority
            <select
              value={filters.priority}
              onChange={(e) => setFilters((prev) => ({ ...prev, priority: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white"
            >
              {priorityOptions.map((value) => (
                <option key={value} value={value}>
                  {value === 'all' ? 'All priorities' : value}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs text-camp-text-muted">
            Project
            <select
              value={filters.projectId}
              onChange={(e) => setFilters((prev) => ({ ...prev, projectId: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white"
            >
              <option value="all">All projects</option>
              {projects.map((project) => {
                const id = project._id || project.id
                return (
                  <option key={id} value={id}>
                    {project.name}
                  </option>
                )
              })}
            </select>
          </label>

          <label className="text-xs text-camp-text-muted">
            Search
            <span className="mt-1 flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 bg-white">
              <Search size={14} className="text-camp-text-muted" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Task title..."
                className="w-full text-sm outline-none bg-transparent text-camp-text-primary"
              />
            </span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <label className="text-xs text-camp-text-muted">
            From
            <input
              type="date"
              value={filters.from}
              onChange={(e) => setFilters((prev) => ({ ...prev, from: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white"
            />
          </label>
          <label className="text-xs text-camp-text-muted">
            To
            <input
              type="date"
              value={filters.to}
              onChange={(e) => setFilters((prev) => ({ ...prev, to: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white"
            />
          </label>
          <button
            onClick={() => setFilters((prev) => ({ ...prev, onlyMine: !prev.onlyMine }))}
            className={`h-[42px] self-end px-3 rounded-xl text-sm font-medium border transition-all ${
              filters.onlyMine
                ? 'bg-camp-green text-white border-camp-green'
                : 'bg-white text-camp-text-secondary border-gray-200 hover:border-camp-green hover:text-camp-green'
            }`}
          >
            Assigned to me ({myCount})
          </button>
          <button
            onClick={() => setFilters((prev) => ({ ...prev, overdueOnly: !prev.overdueOnly }))}
            className={`h-[42px] self-end px-3 rounded-xl text-sm font-medium border transition-all ${
              filters.overdueOnly
                ? 'bg-red-500 text-white border-red-500'
                : 'bg-white text-camp-text-secondary border-gray-200 hover:border-red-500 hover:text-red-500'
            }`}
          >
            Overdue only
          </button>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-camp-text-primary">Task Calendar</h2>
          <p className="text-xs text-camp-text-muted">{calendarEvents.length} dated tasks</p>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : (
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            height="auto"
            events={calendarEvents}
            eventClick={(info) => setSelectedTaskId(info.event.id)}
            dayMaxEvents
          />
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={CheckSquare}
            title="No tasks found"
            description={filters.onlyMine ? "No tasks are assigned to you" : "No tasks match this filter"}
          />
        </div>
      ) : (
        <div className="space-y-3 stagger-children">
          {tasks.map((task) => {
            const due = formatDate(task.dueDate)
            return (
              <div
                key={task._id}
                className={`card hover:shadow-card-hover transition-shadow animate-fadeIn ${
                  selectedTaskId === task._id ? 'ring-2 ring-camp-green/40' : ''
                }`}
              >
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
