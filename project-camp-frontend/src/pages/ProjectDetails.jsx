import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { projectApi } from '../api/project.api'
import { taskApi } from '../api/task.api'
import { noteApi } from '../api/note.api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import {
  Plus, Users, FileText, CheckSquare, Trash2, Edit2, ArrowLeft,
  ChevronDown, ChevronUp, Upload, Paperclip, X, Calendar, Tag,
  Activity, ArrowRight, RefreshCw
} from 'lucide-react'
import Spinner from '../components/ui/Spinner'
import Modal from '../components/ui/Modal'
import ConfirmModal from '../components/ui/ConfirmModal'
import Avatar from '../components/ui/Avatar'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'

// ─── Task Form Modal ───────────────────────────────────────────────────────────
const EMPTY_TASK_FORM = { title: '', description: '', status: 'to_do', priority: 'medium', assignedTo: '', dueDate: '', tags: '' }

function TaskModal({ isOpen, onClose, projectId, members, onSaved, task }) {
  const [form, setForm] = useState(EMPTY_TASK_FORM)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'to_do',
        priority: task.priority || 'medium',
        assignedTo: task.assignedTo?._id || task.assignedTo || '',
        // Format ISO date to YYYY-MM-DD for the date input
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : '',
        // Backend stores tags as an array; join for the text input
        tags: Array.isArray(task.tags) ? task.tags.join(', ') : (task.tags || ''),
      })
    } else {
      setForm(EMPTY_TASK_FORM)
    }
  }, [task, isOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      // Convert comma-separated tags string → array; send null dueDate to clear it
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        dueDate: form.dueDate || null,
        assignedTo: form.assignedTo || undefined,
      }
      if (task) {
        const res = await taskApi.updateTask(projectId, task._id, payload)
        onSaved(res.data?.data, 'update')
        toast.success('Task updated')
      } else {
        const res = await taskApi.createTask(projectId, payload)
        onSaved(res.data?.data, 'create')
        toast.success('Task created')
      }
      onClose()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save task')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={task ? 'Edit Task' : 'Create Task'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-medium text-camp-text-secondary mb-1.5 block uppercase tracking-wider">Title</label>
          <input className="input" placeholder="Task title" required value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
        </div>
        <div>
          <label className="text-xs font-medium text-camp-text-secondary mb-1.5 block uppercase tracking-wider">Description</label>
          <textarea className="input resize-none" rows={3} placeholder="Task description"
            value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-camp-text-secondary mb-1.5 block uppercase tracking-wider">Status</label>
            <select className="input" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
              <option value="to_do">Todo</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-camp-text-secondary mb-1.5 block uppercase tracking-wider">Priority</label>
            <select className="input" value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-camp-text-secondary mb-1.5 block uppercase tracking-wider">Assign To</label>
            <select className="input" value={form.assignedTo} onChange={(e) => setForm((f) => ({ ...f, assignedTo: e.target.value }))}>
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.user?._id} value={m.user?._id}>
                  {m.user?.fullName || m.user?.username}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-camp-text-secondary mb-1.5 block uppercase tracking-wider">Due Date</label>
            <input
              className="input"
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-camp-text-secondary mb-1.5 block uppercase tracking-wider">
            Tags <span className="normal-case font-normal text-camp-text-muted">(comma-separated)</span>
          </label>
          <input
            className="input"
            placeholder="e.g. frontend, bug, v2"
            value={form.tags}
            onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
          />
        </div>
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
            {loading && <Spinner size="sm" />}
            {task ? 'Update Task' : 'Create Task'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Note Form Modal ───────────────────────────────────────────────────────────
function NoteModal({ isOpen, onClose, projectId, onSaved, note }) {
  const [form, setForm] = useState({ title: '', content: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setForm(note ? { title: note.title || '', content: note.content || '' } : { title: '', content: '' })
  }, [note, isOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (note) {
        const res = await noteApi.updateNote(projectId, note._id, form)
        onSaved(res.data?.data, 'update')
        toast.success('Note updated')
      } else {
        const res = await noteApi.createNote(projectId, form)
        onSaved(res.data?.data, 'create')
        toast.success('Note created')
      }
      onClose()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save note')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={note ? 'Edit Note' : 'Create Note'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-medium text-camp-text-secondary mb-1.5 block uppercase tracking-wider">Title</label>
          <input className="input" placeholder="Note title" required value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
        </div>
        <div>
          <label className="text-xs font-medium text-camp-text-secondary mb-1.5 block uppercase tracking-wider">Content</label>
          <textarea className="input resize-none" rows={5} placeholder="Write your note... Use @username to mention a team member"
            value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} />
          {form.content && /@\w+/.test(form.content) && (
            <p className="text-xs text-camp-green mt-1.5 flex items-center gap-1">
              <span>✓</span> Mentioned users will be notified
            </p>
          )}
        </div>
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
            {loading && <Spinner size="sm" />}
            {note ? 'Update' : 'Create Note'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Add Member Modal ──────────────────────────────────────────────────────────
function AddMemberModal({ isOpen, onClose, projectId, onAdded }) {
  const [form, setForm] = useState({ email: '', role: 'user' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await projectApi.addMember(projectId, form)
      onAdded(res.data?.data)
      toast.success('Member added')
      onClose()
      setForm({ email: '', role: 'user' })
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to add member')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Member" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-medium text-camp-text-secondary mb-1.5 block uppercase tracking-wider">Email</label>
          <input className="input" type="email" placeholder="member@example.com" required
            value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
        </div>
        <div>
          <label className="text-xs font-medium text-camp-text-secondary mb-1.5 block uppercase tracking-wider">Role</label>
          <select className="input" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
            <option value="user">Member</option>
            <option value="project_admin">Project Admin</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
            {loading && <Spinner size="sm" />}
            Add Member
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function formatDueDate(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  return {
    label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
    isOverdue: d < new Date(),
  }
}

// ─── Task Card ─────────────────────────────────────────────────────────────────
function TaskCard({
  task,
  projectId,
  members,
  onUpdate,
  onDelete,
  userRole,
  currentUserId,
  requireTaskCompletionApproval,
}) {
  const [expanded, setExpanded] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [newSubtask, setNewSubtask] = useState('')
  const [addingSubtask, setAddingSubtask] = useState(false)
  const [reviewingCompletion, setReviewingCompletion] = useState(false)

  const canManage = userRole === 'admin' || userRole === 'project_admin'
  const isAssignedToCurrentUser =
    (task.assignedTo?._id || task.assignedTo) === currentUserId
  const canRequestCompletion =
    !canManage &&
    isAssignedToCurrentUser &&
    task.status !== 'done' &&
    task.status !== 'completion_requested'

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await taskApi.deleteTask(projectId, task._id)
      onDelete(task._id)
      toast.success('Task deleted')
    } catch {
      toast.error('Failed to delete task')
    } finally {
      setDeleting(false)
    }
  }

  const handleAddSubtask = async (e) => {
    e.preventDefault()
    if (!newSubtask.trim()) return
    setAddingSubtask(true)
    try {
      const res = await taskApi.createSubtask(projectId, task._id, { title: newSubtask })
      const updatedTask = { ...task, subtasks: [...(task.subtasks || []), res.data?.data] }
      onUpdate(updatedTask)
      setNewSubtask('')
      toast.success('Subtask added')
    } catch {
      toast.error('Failed to add subtask')
    } finally {
      setAddingSubtask(false)
    }
  }

  const handleSubtaskToggle = async (subtask) => {
    try {
      const res = await taskApi.updateSubtask(projectId, subtask._id, {
        isCompleted: !subtask.isCompleted,
      })
      const updatedSubtasks = task.subtasks.map((s) =>
        s._id === subtask._id ? { ...s, isCompleted: !s.isCompleted } : s
      )
      onUpdate({ ...task, subtasks: updatedSubtasks })
    } catch {
      toast.error('Failed to update subtask')
    }
  }

  const completedCount = task.subtasks?.filter((s) => s.isCompleted).length || 0
  const totalCount = task.subtasks?.length || 0

  const requestCompletion = async () => {
    try {
      const res = await taskApi.requestCompletion(projectId, task._id)
      onUpdate(res.data?.data || task)
      toast.success(
        requireTaskCompletionApproval
          ? 'Completion request sent for review'
          : 'Task marked as done',
      )
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to submit completion')
    }
  }

  const reviewCompletion = async (decision) => {
    setReviewingCompletion(true)
    try {
      const comment =
        decision === 'rejected'
          ? window.prompt('Optional rejection comment:', '') || ''
          : ''
      const res = await taskApi.reviewCompletion(projectId, task._id, {
        decision,
        ...(comment ? { comment } : {}),
      })
      onUpdate(res.data?.data || task)
      toast.success(
        decision === 'approved'
          ? 'Completion approved'
          : 'Completion rejected',
      )
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to review completion')
    } finally {
      setReviewingCompletion(false)
    }
  }

  return (
    <>
      <div className="border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 w-3 h-3 rounded-full flex-shrink-0 ${
              task.status === 'done' ? 'bg-green-400' :
              task.status === 'in_progress' ? 'bg-blue-400' : 'bg-gray-200'
            }`} />
            <div className="flex-1 min-w-0">
              {/* Title + badges + actions */}
              <div className="flex items-start justify-between gap-2">
                <p className={`font-medium text-sm ${task.status === 'done' ? 'line-through text-camp-text-muted' : 'text-camp-text-primary'}`}>
                  {task.title}
                </p>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {task.priority && (
                    <Badge variant={task.priority} label={task.priority} />
                  )}
                  <Badge variant={task.status} label={task.status?.replace(/_/g, ' ')} />
                  {canManage && (
                    <>
                      <button onClick={() => setShowEdit(true)} className="p-1.5 hover:bg-camp-bg rounded-lg text-camp-text-muted hover:text-camp-green transition-colors">
                        <Edit2 size={12} />
                      </button>
                      <button onClick={() => setShowDeleteConfirm(true)} className="p-1.5 hover:bg-red-50 rounded-lg text-camp-text-muted hover:text-red-500 transition-colors">
                        <Trash2 size={12} />
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                {canRequestCompletion && (
                  <button
                    onClick={requestCompletion}
                    className="text-xs px-2.5 py-1 rounded-lg bg-camp-green/10 text-camp-green hover:bg-camp-green/20"
                  >
                    {requireTaskCompletionApproval ? 'Request Completion' : 'Mark Done'}
                  </button>
                )}
                {canManage && task.status === 'completion_requested' && (
                  <>
                    <button
                      onClick={() => reviewCompletion('approved')}
                      disabled={reviewingCompletion}
                      className="text-xs px-2.5 py-1 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-60"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => reviewCompletion('rejected')}
                      disabled={reviewingCompletion}
                      className="text-xs px-2.5 py-1 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-60"
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>

              {task.description && (
                <p className="text-xs text-camp-text-secondary mt-1 line-clamp-2">{task.description}</p>
              )}

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2">
                {task.assignedTo && (
                  <div className="flex items-center gap-1.5">
                    <Avatar name={task.assignedTo?.fullName || task.assignedTo?.username || 'U'} size="xs" />
                    <span className="text-xs text-camp-text-muted">
                      {task.assignedTo?.fullName || task.assignedTo?.username}
                    </span>
                  </div>
                )}
                {task.dueDate && (() => {
                  const d = new Date(task.dueDate)
                  const isOverdue = d < new Date() && task.status !== 'done'
                  return (
                    <div className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-500' : 'text-camp-text-muted'}`}>
                      <Calendar size={11} />
                      {d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      {isOverdue && <span className="font-medium"> · Overdue</span>}
                    </div>
                  )
                })()}
                {totalCount > 0 && (
                  <span className="text-xs text-camp-text-muted">
                    {completedCount}/{totalCount} subtasks
                  </span>
                )}
                <button
                  onClick={() => setExpanded((e) => !e)}
                  className="ml-auto text-xs text-camp-text-muted hover:text-camp-green flex items-center gap-1 transition-colors"
                >
                  {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  {expanded ? 'Less' : 'Details'}
                </button>
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

        {/* Subtasks */}
        {expanded && (
          <div className="border-t border-gray-100 p-4 bg-camp-bg/40">
            <p className="text-xs font-semibold text-camp-text-secondary uppercase tracking-wider mb-3">Subtasks</p>
            {task.subtasks?.length === 0 ? (
              <p className="text-xs text-camp-text-muted mb-3">No subtasks yet</p>
            ) : (
              <ul className="space-y-2 mb-3">
                {task.subtasks?.map((s) => (
                  <li key={s._id} className="flex items-center gap-2">
                    <button
                      onClick={() => handleSubtaskToggle(s)}
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        s.isCompleted ? 'bg-camp-green border-camp-green' : 'border-gray-300 hover:border-camp-green'
                      }`}
                    >
                      {s.isCompleted && <span className="text-white text-xs">✓</span>}
                    </button>
                    <span className={`text-xs ${s.isCompleted ? 'line-through text-camp-text-muted' : 'text-camp-text-primary'}`}>
                      {s.title}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {canManage && (
              <form onSubmit={handleAddSubtask} className="flex gap-2">
                <input
                  className="input flex-1 text-xs py-2"
                  placeholder="Add subtask..."
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                />
                <button type="submit" disabled={addingSubtask} className="btn-primary py-2 px-3 text-xs">
                  {addingSubtask ? <Spinner size="sm" /> : <Plus size={12} />}
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      <TaskModal
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        projectId={projectId}
        members={members}
        task={task}
        onSaved={(updated) => onUpdate(updated)}
      />

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Task"
        message={`Delete "${task.title}"? This will also remove all subtasks.`}
      />
    </>
  )
}

// ─── Activity Log ──────────────────────────────────────────────────────────────

const ACTION_LABELS = {
  project_created:      { label: 'created project',        color: 'text-camp-green' },
  project_updated:      { label: 'updated project',        color: 'text-blue-600' },
  project_deleted:      { label: 'deleted project',        color: 'text-red-500' },
  member_added:         { label: 'added member',           color: 'text-camp-green' },
  member_removed:       { label: 'removed member',         color: 'text-red-500' },
  member_role_updated:  { label: 'changed role of',        color: 'text-purple-600' },
  task_created:         { label: 'created task',           color: 'text-camp-green' },
  task_updated:         { label: 'updated task',           color: 'text-blue-600' },
  task_deleted:         { label: 'deleted task',           color: 'text-red-500' },
  task_assigned:        { label: 'assigned task',          color: 'text-indigo-600' },
  task_status_changed:  { label: 'changed status of',      color: 'text-yellow-600' },
  task_completion_requested: { label: 'requested completion for', color: 'text-amber-600' },
  task_completion_approved: { label: 'approved completion for', color: 'text-green-600' },
  task_completion_rejected: { label: 'rejected completion for', color: 'text-red-600' },
  subtask_created:      { label: 'added subtask to',       color: 'text-camp-green' },
  subtask_updated:      { label: 'updated subtask in',     color: 'text-blue-600' },
  subtask_deleted:      { label: 'deleted subtask from',   color: 'text-red-500' },
  note_created:         { label: 'added note',             color: 'text-camp-green' },
  note_deleted:         { label: 'deleted note',           color: 'text-red-500' },
}

const ENTITY_TYPE_OPTIONS = [
  { value: '', label: 'All types' },
  { value: 'task', label: 'Tasks' },
  { value: 'subtask', label: 'Subtasks' },
  { value: 'member', label: 'Members' },
  { value: 'note', label: 'Notes' },
  { value: 'project', label: 'Project' },
]

const ACTION_OPTIONS = [
  { value: '', label: 'All actions' },
  { value: 'task_created', label: 'Task created' },
  { value: 'task_updated', label: 'Task updated' },
  { value: 'task_deleted', label: 'Task deleted' },
  { value: 'task_assigned', label: 'Task assigned' },
  { value: 'task_status_changed', label: 'Status changed' },
  { value: 'task_completion_requested', label: 'Completion requested' },
  { value: 'task_completion_approved', label: 'Completion approved' },
  { value: 'task_completion_rejected', label: 'Completion rejected' },
  { value: 'subtask_created', label: 'Subtask created' },
  { value: 'subtask_updated', label: 'Subtask updated' },
  { value: 'subtask_deleted', label: 'Subtask deleted' },
  { value: 'member_added', label: 'Member added' },
  { value: 'member_removed', label: 'Member removed' },
  { value: 'member_role_updated', label: 'Role changed' },
  { value: 'note_created', label: 'Note created' },
  { value: 'note_deleted', label: 'Note deleted' },
  { value: 'project_created', label: 'Project created' },
  { value: 'project_updated', label: 'Project updated' },
]

function ActivityMetadata({ action, metadata }) {
  if (!metadata || Object.keys(metadata).length === 0) return null
  if (action === 'task_status_changed' && metadata.from && metadata.to) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-camp-text-muted ml-1">
        <Badge variant={metadata.from} label={metadata.from.replace(/_/g, ' ')} />
        <ArrowRight size={10} className="text-camp-text-muted" />
        <Badge variant={metadata.to} label={metadata.to.replace(/_/g, ' ')} />
      </span>
    )
  }
  if (action === 'member_role_updated' && metadata.newRole) {
    return (
      <span className="text-xs text-camp-text-muted ml-1">
        {'\u2192'} <Badge variant={metadata.newRole} label={metadata.newRole.replace(/_/g, ' ')} />
      </span>
    )
  }
  if ((action === 'subtask_created' || action === 'subtask_updated' || action === 'subtask_deleted') && metadata.parentTaskTitle) {
    return (
      <span className="text-xs text-camp-text-muted ml-1">
        (in <span className="font-medium text-camp-text-secondary">"{metadata.parentTaskTitle}"</span>)
      </span>
    )
  }
  return null
}

function ActivityLogPanel({ projectId, members }) {
  const [logs, setLogs] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [filters, setFilters] = useState({ action: '', entityType: '', actorId: '' })

  const fetchLogs = useCallback(async (page, append) => {
    if (page === 1) setLoading(true)
    else setLoadingMore(true)
    try {
      const params = { page, limit: 20, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) }
      const res = await projectApi.getActivityLog(projectId, params)
      const data = res.data?.data
      const newLogs = data?.logs ?? []
      setLogs((prev) => append ? [...prev, ...newLogs] : newLogs)
      setPagination(data?.pagination ?? null)
    } catch {
      toast.error('Failed to load activity log')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [projectId, filters])

  useEffect(() => {
    fetchLogs(1, false)
  }, [fetchLogs])

  const handleLoadMore = () => {
    if (pagination?.hasNextPage) fetchLogs(pagination.page + 1, true)
  }

  return (
    <div>
      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 mb-5">
        <select className="input py-1.5 text-xs w-auto" value={filters.action}
          onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value }))}>
          {ACTION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select className="input py-1.5 text-xs w-auto" value={filters.entityType}
          onChange={(e) => setFilters((f) => ({ ...f, entityType: e.target.value }))}>
          {ENTITY_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select className="input py-1.5 text-xs w-auto" value={filters.actorId}
          onChange={(e) => setFilters((f) => ({ ...f, actorId: e.target.value }))}>
          <option value="">All members</option>
          {members.map((m) => (
            <option key={m.user?._id} value={m.user?._id}>
              {m.user?.fullName || m.user?.username}
            </option>
          ))}
        </select>
        {(filters.action || filters.entityType || filters.actorId) && (
          <button onClick={() => setFilters({ action: '', entityType: '', actorId: '' })}
            className="text-xs text-camp-text-muted hover:text-red-500 flex items-center gap-1 transition-colors px-2">
            <X size={12} /> Clear filters
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : logs.length === 0 ? (
        <div className="card">
          <EmptyState icon={Activity} title="No activity yet"
            description="Actions on tasks, members, and notes will appear here" />
        </div>
      ) : (
        <>
          <div className="space-y-0">
            {logs.map((log, i) => {
              const actionMeta = ACTION_LABELS[log.action] ?? { label: log.action, color: 'text-camp-text-secondary' }
              const actorName = log.actor?.fullName || log.actor?.username || 'Someone'
              const timeStr = new Date(log.createdAt).toLocaleString(undefined, {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
              })
              const isLast = i === logs.length - 1
              return (
                <div key={log._id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-camp-bg flex items-center justify-center flex-shrink-0 mt-1 border border-gray-100">
                      <Avatar name={actorName} src={log.actor?.avatar?.url} size="xs" />
                    </div>
                    {!isLast && <div className="w-px flex-1 bg-gray-100 mt-1 min-h-[1.5rem]" />}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="text-sm text-camp-text-primary leading-snug">
                      <span className="font-semibold">{actorName}</span>
                      {' '}
                      <span className={`font-medium ${actionMeta.color}`}>{actionMeta.label}</span>
                      {' '}
                      <span className="font-medium text-camp-text-primary">"{log.entity?.name}"</span>
                      <ActivityMetadata action={log.action} metadata={log.metadata} />
                    </p>
                    <p className="text-xs text-camp-text-muted mt-0.5">{timeStr}</p>
                  </div>
                </div>
              )
            })}
          </div>
          {pagination?.hasNextPage && (
            <div className="flex justify-center mt-4">
              <button onClick={handleLoadMore} disabled={loadingMore}
                className="btn-secondary flex items-center gap-2 text-sm">
                {loadingMore ? <Spinner size="sm" /> : <RefreshCw size={14} />}
                Load more
              </button>
            </div>
          )}
          {pagination && (
            <p className="text-center text-xs text-camp-text-muted mt-3">
              Showing {logs.length} of {pagination.total} events
            </p>
          )}
        </>
      )}
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
const TABS = ['Tasks', 'Notes', 'Members', 'Activity']

export default function ProjectDetails() {
  const { projectId } = useParams()
  const { user } = useAuth()
  const [project, setProject] = useState(null)
  const [members, setMembers] = useState([])
  const [tasks, setTasks] = useState([])
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('Tasks')
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [editNote, setEditNote] = useState(null)
  const [deleteNote, setDeleteNote] = useState(null)
  const [deletingNote, setDeletingNote] = useState(false)
  const [removeMemberTarget, setRemoveMemberTarget] = useState(null)
  const [removingMember, setRemovingMember] = useState(false)

  const currentMember = members.find((m) => (m.user?._id || m.user?.id) === (user?._id || user?.id))
  const userRole = currentMember?.role || 'member'
  const canManage = userRole === 'admin' || userRole === 'project_admin'
  const isAdmin = userRole === 'admin'

  useEffect(() => {
    if (!projectId || projectId === 'undefined') {
      console.error('[ProjectDetails] Invalid projectId:', projectId)
      setLoading(false)
      toast.error('Invalid project URL')
      return
    }

    const fetchAll = async () => {
      try {
        const [pRes, mRes, tRes, nRes] = await Promise.all([
          projectApi.getProject(projectId),
          projectApi.getMembers(projectId),
          taskApi.getTasks(projectId),
          noteApi.getNotes(projectId),
        ])

        // Log once to confirm response shapes
        // console.log('[ProjectDetails] responses:', {
        //   project: pRes.data,
        //   members: mRes.data,
        //   tasks: tRes.data,
        //   notes: nRes.data,
        // })

        // Normalise arrays — handle both res.data.data[] and res.data[]
        const toArray = (res) => {
          const d = res.data?.data ?? res.data
          if (Array.isArray(d)) return d
          if (d && typeof d === 'object') return Object.values(d).find(Array.isArray) || []
          return []
        }
        const toSingle = (res) => res.data?.data ?? res.data ?? null

        setProject(toSingle(pRes))
        setMembers(toArray(mRes))
        setTasks(toArray(tRes))
        setNotes(toArray(nRes))
      } catch (err) {
        console.error('[ProjectDetails] fetch error:', err)
        toast.error('Failed to load project')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [projectId])

  const handleTaskSaved = (task, action) => {
    if (action === 'update') {
      setTasks((prev) => prev.map((t) => (t._id === task._id ? task : t)))
    } else {
      setTasks((prev) => [task, ...prev])
    }
  }

  const handleTaskUpdate = (task) => {
    setTasks((prev) => prev.map((t) => (t._id === task._id ? task : t)))
  }

  const handleTaskDelete = (taskId) => {
    setTasks((prev) => prev.filter((t) => t._id !== taskId))
  }

  const handleNoteSaved = (note, action) => {
    if (action === 'update') {
      setNotes((prev) => prev.map((n) => (n._id === note._id ? note : n)))
    } else {
      setNotes((prev) => [note, ...prev])
    }
  }

  const handleNoteDelete = async () => {
    setDeletingNote(true)
    try {
      await noteApi.deleteNote(projectId, deleteNote._id)
      setNotes((prev) => prev.filter((n) => n._id !== deleteNote._id))
      toast.success('Note deleted')
      setDeleteNote(null)
    } catch {
      toast.error('Failed to delete note')
    } finally {
      setDeletingNote(false)
    }
  }

  const handleMemberAdded = (data) => {
    setMembers((prev) => [...prev, data])
  }

  const handleRemoveMember = async () => {
    setRemovingMember(true)
    try {
      await projectApi.removeMember(projectId, removeMemberTarget.user?._id)
      setMembers((prev) => prev.filter((m) => m.user?._id !== removeMemberTarget.user?._id))
      toast.success('Member removed')
      setRemoveMemberTarget(null)
    } catch {
      toast.error('Failed to remove member')
    } finally {
      setRemovingMember(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 animate-fadeIn">
        <Link to="/projects" className="btn-ghost flex items-center gap-1.5">
          <ArrowLeft size={16} />
          Back
        </Link>
      </div>

      <div className="flex items-start justify-between mb-8 animate-fadeIn">
        <div>
          <h1 className="font-display text-3xl text-camp-text-primary">{project?.name}</h1>
          <p className="text-camp-text-secondary mt-1 max-w-2xl">{project?.description}</p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'Tasks' && canManage && (
            <button onClick={() => setShowTaskModal(true)} className="btn-primary flex items-center gap-2">
              <Plus size={16} />
              Add Task
            </button>
          )}
          {activeTab === 'Notes' && isAdmin && (
            <button onClick={() => setShowNoteModal(true)} className="btn-primary flex items-center gap-2">
              <Plus size={16} />
              Add Note
            </button>
          )}
          {activeTab === 'Members' && isAdmin && (
            <button onClick={() => setShowMemberModal(true)} className="btn-primary flex items-center gap-2">
              <Plus size={16} />
              Add Member
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-2xl p-1 shadow-card mb-6 w-fit animate-fadeIn">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === tab
                ? 'bg-camp-green text-white shadow-green'
                : 'text-camp-text-secondary hover:text-camp-text-primary'
            }`}
          >
            {tab}
            {tab !== 'Activity' && (
              <span className={`ml-1.5 text-xs ${activeTab === tab ? 'text-white/70' : 'text-camp-text-muted'}`}>
                {tab === 'Tasks' ? tasks.length : tab === 'Notes' ? notes.length : members.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="animate-fadeIn">
        {/* Tasks */}
        {activeTab === 'Tasks' && (
          tasks.length === 0 ? (
            <div className="card">
              <EmptyState icon={CheckSquare} title="No tasks yet" description="Create a task to start organizing work"
                action={canManage ? <button onClick={() => setShowTaskModal(true)} className="btn-primary">Add Task</button> : null} />
            </div>
          ) : (
            <div className="space-y-3 stagger-children">
              {tasks.map((task) => (
                <div key={task._id} className="animate-fadeIn">
                  <TaskCard task={task} projectId={projectId} members={members}
                    onUpdate={handleTaskUpdate}
                    onDelete={handleTaskDelete}
                    userRole={userRole}
                    currentUserId={user?._id || user?.id}
                    requireTaskCompletionApproval={Boolean(project?.requireTaskCompletionApproval)}
                  />
                </div>
              ))}
            </div>
          )
        )}

        {/* Notes */}
        {activeTab === 'Notes' && (
          notes.length === 0 ? (
            <div className="card">
              <EmptyState icon={FileText} title="No notes yet" description="Add project notes to keep important information"
                action={isAdmin ? <button onClick={() => setShowNoteModal(true)} className="btn-primary">Add Note</button> : null} />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 stagger-children">
              {notes.map((note) => (
                <div key={note._id} className="card animate-fadeIn group">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-camp-text-primary">{note.title}</h3>
                    {isAdmin && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditNote(note); setShowNoteModal(true) }}
                          className="p-1.5 hover:bg-camp-bg rounded-lg text-camp-text-muted hover:text-camp-green transition-colors">
                          <Edit2 size={12} />
                        </button>
                        <button onClick={() => setDeleteNote(note)}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-camp-text-muted hover:text-red-500 transition-colors">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-camp-text-secondary whitespace-pre-wrap">{note.content}</p>
                  <p className="text-xs text-camp-text-muted mt-3">
                    {note.createdAt ? new Date(note.createdAt).toLocaleDateString() : ''}
                  </p>
                </div>
              ))}
            </div>
          )
        )}

        {/* Members */}
        {activeTab === 'Members' && (
          <div className="card">
            {members.length === 0 ? (
              <EmptyState icon={Users} title="No members" description="Add team members to collaborate"
                action={isAdmin ? <button onClick={() => setShowMemberModal(true)} className="btn-primary">Add Member</button> : null} />
            ) : (
              <ul className="divide-y divide-gray-100">
                {members.map((m) => (
                  <li key={m.user?._id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0 group">
                    <Avatar name={m.user?.fullName || m.user?.username || 'U'} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-camp-text-primary">
                        {m.user?.fullName || m.user?.username}
                        {m.user?._id === user?._id && (
                          <span className="ml-2 text-xs text-camp-text-muted">(you)</span>
                        )}
                      </p>
                      <p className="text-xs text-camp-text-muted">{m.user?.email}</p>
                    </div>
                    <Badge variant={m.role} label={m.role?.replace('_', ' ')} />
                    {isAdmin && m.user?._id !== user?._id && (
                      <button
                        onClick={() => setRemoveMemberTarget(m)}
                        className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-50 rounded-xl text-camp-text-muted hover:text-red-500 transition-all"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Activity */}
        {activeTab === 'Activity' && (
          <ActivityLogPanel projectId={projectId} members={members} />
        )}
      </div>

      {/* Modals */}
      <TaskModal isOpen={showTaskModal} onClose={() => setShowTaskModal(false)}
        projectId={projectId} members={members} onSaved={handleTaskSaved} task={null} />

      <NoteModal isOpen={showNoteModal && !editNote} onClose={() => setShowNoteModal(false)}
        projectId={projectId} onSaved={handleNoteSaved} note={null} />

      <NoteModal isOpen={showNoteModal && !!editNote} onClose={() => { setShowNoteModal(false); setEditNote(null) }}
        projectId={projectId} onSaved={handleNoteSaved} note={editNote} />

      <AddMemberModal isOpen={showMemberModal} onClose={() => setShowMemberModal(false)}
        projectId={projectId} onAdded={handleMemberAdded} />

      <ConfirmModal isOpen={!!deleteNote} onClose={() => setDeleteNote(null)}
        onConfirm={handleNoteDelete} loading={deletingNote}
        title="Delete Note" message={`Delete "${deleteNote?.title}"?`} />

      <ConfirmModal isOpen={!!removeMemberTarget} onClose={() => setRemoveMemberTarget(null)}
        onConfirm={handleRemoveMember} loading={removingMember}
        title="Remove Member"
        message={`Remove ${removeMemberTarget?.user?.fullName || removeMemberTarget?.user?.username} from this project?`} />
    </div>
  )
}