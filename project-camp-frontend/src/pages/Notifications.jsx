import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { notificationApi } from '../api/notification.api'
import { useNotifications } from '../context/NotificationContext'
import { Bell, CheckCheck, Trash2, ExternalLink, RefreshCw } from 'lucide-react'
import Avatar from '../components/ui/Avatar'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import toast from 'react-hot-toast'

// Map entity type + projectId to a frontend route
function resolveLink(link) {
  if (!link) return null
  const { entityType, projectId } = link
  if (!projectId) return null
  if (entityType === 'task' || entityType === 'note' || entityType === 'subtask') {
    return `/projects/${projectId}`
  }
  if (entityType === 'project') {
    return `/projects/${projectId}`
  }
  return `/projects/${projectId}`
}

export default function Notifications() {
  const navigate = useNavigate()
  const { clearUnread, decrementUnread, refresh } = useNotifications()

  const [notifications, setNotifications] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [markingAll, setMarkingAll] = useState(false)

  const fetchNotifications = useCallback(async (page = 1, append = false) => {
    if (page === 1) setLoading(true)
    else setLoadingMore(true)
    try {
      const res = await notificationApi.getNotifications({
        page,
        limit: 20,
        ...(unreadOnly ? { unreadOnly: true } : {}),
      })
      const data = res.data?.data
      const newItems = data?.notifications ?? []
      setNotifications((prev) => append ? [...prev, ...newItems] : newItems)
      setPagination(data?.pagination ?? null)
    } catch {
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [unreadOnly])

  useEffect(() => {
    fetchNotifications(1, false)
  }, [fetchNotifications])

  // Refresh unread count badge in sidebar when this page mounts
  useEffect(() => {
    refresh()
  }, [refresh])

  const handleMarkRead = async (notif) => {
    if (notif.isRead) return
    try {
      await notificationApi.markRead(notif._id)
      setNotifications((prev) =>
        prev.map((n) => n._id === notif._id ? { ...n, isRead: true } : n)
      )
      decrementUnread()
    } catch {
      toast.error('Failed to mark as read')
    }
  }

  const handleDismiss = async (notif) => {
    try {
      await notificationApi.dismiss(notif._id)
      if (!notif.isRead) decrementUnread()
      setNotifications((prev) => prev.filter((n) => n._id !== notif._id))
      if (pagination) setPagination((p) => ({ ...p, total: p.total - 1 }))
    } catch {
      toast.error('Failed to dismiss notification')
    }
  }

  const handleMarkAllRead = async () => {
    setMarkingAll(true)
    try {
      await notificationApi.markAllRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      clearUnread()
      toast.success('All notifications marked as read')
    } catch {
      toast.error('Failed to mark all as read')
    } finally {
      setMarkingAll(false)
    }
  }

  const handleNavigate = async (notif) => {
    // Mark read first, then navigate
    if (!notif.isRead) await handleMarkRead(notif)
    const route = resolveLink(notif.link)
    if (route) navigate(route)
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 animate-fadeIn">
        <div>
          <h1 className="font-display text-3xl text-camp-text-primary">Notifications</h1>
          <p className="text-camp-text-secondary mt-1">
            {pagination ? `${pagination.total} total` : ''}
            {unreadCount > 0 ? ` · ${unreadCount} unread` : ''}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Unread filter toggle */}
          <button
            onClick={() => setUnreadOnly((v) => !v)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
              unreadOnly
                ? 'bg-camp-green text-white border-camp-green'
                : 'bg-white text-camp-text-secondary border-gray-200 hover:border-camp-green hover:text-camp-green'
            }`}
          >
            Unread only
          </button>

          {/* Mark all read */}
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white border border-gray-200 text-camp-text-secondary hover:border-camp-green hover:text-camp-green transition-all"
            >
              {markingAll ? <Spinner size="sm" /> : <CheckCheck size={13} />}
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-24"><Spinner size="lg" /></div>
      ) : notifications.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Bell}
            title={unreadOnly ? 'No unread notifications' : 'No notifications yet'}
            description={unreadOnly ? 'Switch to "All" to see your full history' : 'You\'ll be notified when tasks are assigned to you or you\'re mentioned in a note'}
            action={
              unreadOnly
                ? <button onClick={() => setUnreadOnly(false)} className="btn-secondary">Show all</button>
                : null
            }
          />
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {notifications.map((notif) => {
              const hasLink = !!resolveLink(notif.link)
              const timeStr = new Date(notif.createdAt).toLocaleString(undefined, {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
              })

              return (
                <div
                  key={notif._id}
                  className={`group card py-3.5 px-4 flex items-start gap-3 transition-all ${
                    !notif.isRead ? 'border-l-4 border-l-camp-green' : 'border-l-4 border-l-transparent'
                  }`}
                >
                  {/* Unread dot */}
                  <div className="mt-1.5 flex-shrink-0">
                    <div className={`w-2 h-2 rounded-full ${notif.isRead ? 'bg-gray-200' : 'bg-camp-green'}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${notif.isRead ? 'text-camp-text-secondary' : 'text-camp-text-primary font-medium'}`}>
                      {notif.message}
                    </p>
                    <p className="text-xs text-camp-text-muted mt-1">{timeStr}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {hasLink && (
                      <button
                        onClick={() => handleNavigate(notif)}
                        className="p-1.5 hover:bg-camp-bg rounded-lg text-camp-text-muted hover:text-camp-green transition-colors"
                        title="Go to item"
                      >
                        <ExternalLink size={13} />
                      </button>
                    )}
                    {!notif.isRead && (
                      <button
                        onClick={() => handleMarkRead(notif)}
                        className="p-1.5 hover:bg-camp-bg rounded-lg text-camp-text-muted hover:text-camp-green transition-colors"
                        title="Mark as read"
                      >
                        <CheckCheck size={13} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDismiss(notif)}
                      className="p-1.5 hover:bg-red-50 rounded-lg text-camp-text-muted hover:text-red-500 transition-colors"
                      title="Dismiss"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Load more */}
          {pagination?.hasNextPage && (
            <div className="flex justify-center mt-5">
              <button
                onClick={() => fetchNotifications(pagination.page + 1, true)}
                disabled={loadingMore}
                className="btn-secondary flex items-center gap-2 text-sm"
              >
                {loadingMore ? <Spinner size="sm" /> : <RefreshCw size={14} />}
                Load more
              </button>
            </div>
          )}

          {pagination && (
            <p className="text-center text-xs text-camp-text-muted mt-3">
              Showing {notifications.length} of {pagination.total}
            </p>
          )}
        </>
      )}
    </div>
  )
}
