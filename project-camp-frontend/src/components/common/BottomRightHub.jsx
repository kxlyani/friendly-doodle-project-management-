import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  MessageSquare,
  X,
  CheckCheck,
  ExternalLink,
  Trash2,
  Send,
  UserPlus,
} from 'lucide-react'
import { useNotifications } from '../../context/NotificationContext'
import { notificationApi } from '../../api/notification.api'
import { chatApi } from '../../api/chat.api'
import EmptyState from '../ui/EmptyState'
import Spinner from '../ui/Spinner'
import toast from 'react-hot-toast'

const TABS = {
  NOTIFICATIONS: 'notifications',
  CHAT: 'chat',
}

function StartChatModal({
  open,
  users,
  loading,
  search,
  setSearch,
  selectedUserId,
  setSelectedUserId,
  onClose,
  onCreate,
}) {
  if (!open) return null

  return (
    <div className="absolute bottom-20 right-0 w-[340px] max-w-[calc(100vw-3rem)] bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <p className="text-sm font-semibold text-camp-text-primary">Start chat</p>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-camp-bg text-camp-text-muted"
          title="Close"
        >
          <X size={14} />
        </button>
      </div>

      <div className="p-4 space-y-3">
        <input
          className="input w-full"
          placeholder="Search user by name/email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {loading ? (
          <div className="py-4 flex justify-center">
            <Spinner size="sm" />
          </div>
        ) : (
          <select
            className="input w-full"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
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

      <div className="px-4 pb-4 flex justify-end gap-2">
        <button className="btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button
          className="btn-primary"
          onClick={onCreate}
          disabled={!selectedUserId || loading}
        >
          Start
        </button>
      </div>
    </div>
  )
}

export default function BottomRightHub() {
  const navigate = useNavigate()
  const { unreadCount, decrementUnread, clearUnread, refresh } = useNotifications()

  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState(TABS.NOTIFICATIONS)

  // Notifications panel state
  const [loadingNotifs, setLoadingNotifs] = useState(false)
  const [notifs, setNotifs] = useState([])
  const [markingAll, setMarkingAll] = useState(false)

  // Chat panel state (persisted REST, no realtime)
  const [loadingConvos, setLoadingConvos] = useState(false)
  const [convos, setConvos] = useState([])
  const [activeConvoId, setActiveConvoId] = useState(null)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [messages, setMessages] = useState([])
  const [messageText, setMessageText] = useState('')
  const [startChatOpen, setStartChatOpen] = useState(false)
  const [chatUsers, setChatUsers] = useState([])
  const [loadingChatUsers, setLoadingChatUsers] = useState(false)
  const [chatUserSearch, setChatUserSearch] = useState('')
  const [selectedChatUserId, setSelectedChatUserId] = useState('')

  const rootRef = useRef(null)

  const toggleOpen = () => setOpen((v) => !v)
  const close = () => setOpen(false)

  const fetchNotifs = useCallback(async () => {
    setLoadingNotifs(true)
    try {
      const res = await notificationApi.getNotifications({ page: 1, limit: 10 })
      const data = res.data?.data
      setNotifs(data?.notifications ?? [])
    } catch {
      toast.error('Failed to load notifications')
    } finally {
      setLoadingNotifs(false)
    }
  }, [])

  const fetchConversations = useCallback(async () => {
    setLoadingConvos(true)
    try {
      const res = await chatApi.getConversations()
      const data = res.data?.data || res.data
      const list = Array.isArray(data) ? data : []
      setConvos(list)
      if (!activeConvoId && list.length) setActiveConvoId(list[0]._id)
    } catch {
      toast.error('Failed to load conversations')
    } finally {
      setLoadingConvos(false)
    }
  }, [activeConvoId])

  const fetchMessages = useCallback(
    async (conversationId) => {
      if (!conversationId) return
      setLoadingMsgs(true)
      try {
        const res = await chatApi.getMessages(conversationId, { limit: 30 })
        const data = res.data?.data || res.data
        setMessages(data?.messages || [])
      } catch {
        toast.error('Failed to load messages')
      } finally {
        setLoadingMsgs(false)
      }
    },
    [],
  )

  const fetchChatUsers = useCallback(async (q = '') => {
    setLoadingChatUsers(true)
    try {
      const res = await chatApi.getUsers(q || undefined)
      const data = res.data?.data || res.data
      setChatUsers(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Failed to load users')
      setChatUsers([])
    } finally {
      setLoadingChatUsers(false)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    refresh()
    fetchNotifs()
    if (tab === TABS.CHAT) fetchConversations()
  }, [open, fetchNotifs, refresh])

  useEffect(() => {
    if (!open) return
    if (tab !== TABS.CHAT) return
    fetchConversations()
  }, [open, tab, fetchConversations])

  useEffect(() => {
    if (!open) return
    if (tab !== TABS.CHAT) return
    if (!activeConvoId) return
    fetchMessages(activeConvoId)
  }, [open, tab, activeConvoId, fetchMessages])

  useEffect(() => {
    if (!startChatOpen) return
    const id = window.setTimeout(() => {
      fetchChatUsers(chatUserSearch.trim())
    }, 250)
    return () => window.clearTimeout(id)
  }, [startChatOpen, chatUserSearch, fetchChatUsers])

  useEffect(() => {
    if (!open) return
    if (tab !== TABS.CHAT) return
    if (!activeConvoId) return

    const id = window.setInterval(() => fetchMessages(activeConvoId), 12_000)
    return () => window.clearInterval(id)
  }, [open, tab, activeConvoId, fetchMessages])

  // Close on outside click + Esc
  useEffect(() => {
    if (!open) return

    const onMouseDown = (e) => {
      const el = rootRef.current
      if (!el) return
      if (!el.contains(e.target)) close()
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') close()
    }

    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const resolveLink = useCallback((link) => {
    if (!link) return null
    const { entityType, projectId } = link
    if (!projectId) return null
    if (entityType === 'task' || entityType === 'note' || entityType === 'subtask') {
      return `/projects/${projectId}`
    }
    if (entityType === 'project') return `/projects/${projectId}`
    return `/projects/${projectId}`
  }, [])

  const handleMarkRead = async (notif) => {
    if (notif.isRead) return
    try {
      await notificationApi.markRead(notif._id)
      setNotifs((prev) => prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n)))
      decrementUnread()
    } catch {
      toast.error('Failed to mark as read')
    }
  }

  const handleDismiss = async (notif) => {
    try {
      await notificationApi.dismiss(notif._id)
      if (!notif.isRead) decrementUnread()
      setNotifs((prev) => prev.filter((n) => n._id !== notif._id))
    } catch {
      toast.error('Failed to dismiss')
    }
  }

  const handleMarkAllRead = async () => {
    setMarkingAll(true)
    try {
      await notificationApi.markAllRead()
      setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })))
      clearUnread()
      toast.success('All notifications marked as read')
    } catch {
      toast.error('Failed to mark all as read')
    } finally {
      setMarkingAll(false)
    }
  }

  const unreadInPanel = useMemo(() => notifs.filter((n) => !n.isRead).length, [notifs])

  return (
    <div ref={rootRef} className="fixed bottom-6 right-6 z-50">
      {open ? (
        <div
          id="bottom-right-hub-panel"
          className="w-[380px] max-w-[calc(100vw-3rem)] bg-white rounded-3xl shadow-card border border-gray-100 overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  tab === TABS.NOTIFICATIONS
                    ? 'bg-camp-green text-white border-camp-green'
                    : 'bg-white text-camp-text-secondary border-gray-200 hover:border-camp-green hover:text-camp-green'
                }`}
                onClick={() => setTab(TABS.NOTIFICATIONS)}
              >
                Notifications
              </button>
              <button
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  tab === TABS.CHAT
                    ? 'bg-camp-green text-white border-camp-green'
                    : 'bg-white text-camp-text-secondary border-gray-200 hover:border-camp-green hover:text-camp-green'
                }`}
                onClick={() => setTab(TABS.CHAT)}
              >
                Chat
              </button>
            </div>
            <button
              onClick={close}
              className="p-2 rounded-xl hover:bg-camp-bg text-camp-text-muted hover:text-camp-text-primary transition-colors"
              title="Close"
            >
              <X size={16} />
            </button>
          </div>

          {tab === TABS.NOTIFICATIONS ? (
            <>
              <div className="px-4 py-3 flex items-center justify-between">
                <p className="text-xs text-camp-text-muted">
                  {unreadInPanel > 0 ? `${unreadInPanel} unread` : 'Up to date'}
                </p>
                <div className="flex items-center gap-2">
                  {unreadInPanel > 0 ? (
                    <button
                      onClick={handleMarkAllRead}
                      disabled={markingAll}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white border border-gray-200 text-camp-text-secondary hover:border-camp-green hover:text-camp-green transition-all"
                    >
                      {markingAll ? <Spinner size="sm" /> : <CheckCheck size={13} />}
                      Mark all
                    </button>
                  ) : null}
                  <button
                    onClick={() => {
                      close()
                      navigate('/notifications')
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium bg-white border border-gray-200 text-camp-text-secondary hover:border-camp-green hover:text-camp-green transition-all"
                  >
                    View all
                  </button>
                </div>
              </div>

              <div className="max-h-[420px] overflow-y-auto px-2 pb-2">
                {loadingNotifs ? (
                  <div className="flex justify-center py-10">
                    <Spinner />
                  </div>
                ) : notifs.length === 0 ? (
                  <div className="px-3">
                    <EmptyState
                      icon={Bell}
                      title="No notifications"
                      description="You’ll see updates here."
                    />
                  </div>
                ) : (
                  <div className="space-y-2 px-2">
                    {notifs.map((notif) => {
                      const hasLink = !!resolveLink(notif.link)
                      const timeStr = new Date(notif.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })

                      return (
                        <div
                          key={notif._id}
                          className={`group bg-white border border-gray-100 rounded-2xl py-3 px-3 flex items-start gap-3 transition-all ${
                            !notif.isRead ? 'border-l-4 border-l-camp-green' : 'border-l-4 border-l-transparent'
                          }`}
                        >
                          <div className="mt-1.5 flex-shrink-0">
                            <div className={`w-2 h-2 rounded-full ${notif.isRead ? 'bg-gray-200' : 'bg-camp-green'}`} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm leading-snug ${
                                notif.isRead ? 'text-camp-text-secondary' : 'text-camp-text-primary font-medium'
                              }`}
                            >
                              {notif.message}
                            </p>
                            <p className="text-xs text-camp-text-muted mt-1">{timeStr}</p>
                          </div>

                          <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            {hasLink ? (
                              <button
                                onClick={async () => {
                                  if (!notif.isRead) await handleMarkRead(notif)
                                  const route = resolveLink(notif.link)
                                  if (route) {
                                    close()
                                    navigate(route)
                                  }
                                }}
                                className="p-1.5 hover:bg-camp-bg rounded-lg text-camp-text-muted hover:text-camp-green transition-colors"
                                title="Go to item"
                              >
                                <ExternalLink size={13} />
                              </button>
                            ) : null}
                            {!notif.isRead ? (
                              <button
                                onClick={() => handleMarkRead(notif)}
                                className="p-1.5 hover:bg-camp-bg rounded-lg text-camp-text-muted hover:text-camp-green transition-colors"
                                title="Mark as read"
                              >
                                <CheckCheck size={13} />
                              </button>
                            ) : null}
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
                )}
              </div>
            </>
          ) : (
            <div className="h-[520px] flex flex-col sm:flex-row">
              {/* Conversations */}
              <div className="sm:w-44 sm:border-r border-gray-100 p-3 overflow-y-auto">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-camp-text-muted uppercase tracking-wider">
                    Chats
                  </p>
                  <button
                    className="p-1.5 rounded-lg hover:bg-camp-bg text-camp-text-muted hover:text-camp-green"
                    title="Start chat"
                    onClick={async () => {
                      setStartChatOpen(true)
                      setSelectedChatUserId('')
                      setChatUserSearch('')
                      await fetchChatUsers('')
                    }}
                  >
                    <UserPlus size={14} />
                  </button>
                </div>

                {loadingConvos ? (
                  <div className="py-6 flex justify-center">
                    <Spinner size="sm" />
                  </div>
                ) : convos.length === 0 ? (
                  <p className="text-xs text-camp-text-muted mt-3">No chats yet.</p>
                ) : (
                  <div className="space-y-1">
                    {convos.map((c) => (
                      <button
                        key={c._id}
                        onClick={() => setActiveConvoId(c._id)}
                        className={`w-full text-left px-2 py-2 rounded-xl text-xs transition-colors ${
                          c._id === activeConvoId
                            ? 'bg-camp-green text-white'
                            : 'hover:bg-camp-bg text-camp-text-secondary'
                        }`}
                      >
                        <div className="font-semibold truncate">
                          {(c.participants || []).slice(0, 2).map((p) => p.fullName || p.username).join(', ') || 'Conversation'}
                        </div>
                        <div className={`mt-0.5 truncate ${c._id === activeConvoId ? 'text-white/80' : 'text-camp-text-muted'}`}>
                          {c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleDateString() : '—'}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-camp-bg/50">
                  {loadingMsgs ? (
                    <div className="py-10 flex justify-center">
                      <Spinner />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="p-3">
                      <EmptyState
                        icon={MessageSquare}
                        title="No messages"
                        description="Send a message to start the conversation."
                      />
                    </div>
                  ) : (
                    messages.map((m) => (
                      <div key={m._id} className="bg-white border border-gray-100 rounded-2xl px-3 py-2">
                        <div className="text-xs text-camp-text-muted">
                          {m.sender?.fullName || m.sender?.username || 'User'} ·{' '}
                          {m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </div>
                        <div className="text-sm text-camp-text-primary mt-1 whitespace-pre-wrap break-words">
                          {m.text}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <form
                  className="p-3 border-t border-gray-100 flex gap-2 bg-white"
                  onSubmit={async (e) => {
                    e.preventDefault()
                    const text = messageText.trim()
                    if (!text || !activeConvoId) return
                    setMessageText('')

                    try {
                      await chatApi.sendMessage(activeConvoId, { text })
                      await fetchMessages(activeConvoId)
                    } catch {
                      toast.error('Failed to send message')
                    }
                  }}
                >
                  <input
                    className="input flex-1"
                    placeholder="Type a message…"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                  />
                  <button className="btn-primary" type="submit" title="Send">
                    <Send size={16} />
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      ) : null}

      <StartChatModal
        open={open && tab === TABS.CHAT && startChatOpen}
        users={chatUsers}
        loading={loadingChatUsers}
        search={chatUserSearch}
        setSearch={setChatUserSearch}
        selectedUserId={selectedChatUserId}
        setSelectedUserId={setSelectedChatUserId}
        onClose={() => {
          setStartChatOpen(false)
          setSelectedChatUserId('')
          setChatUserSearch('')
        }}
        onCreate={async () => {
          if (!selectedChatUserId) return
          try {
            const res = await chatApi.createConversation({
              participantIds: [selectedChatUserId],
            })
            const convo = res.data?.data || res.data
            await fetchConversations()
            if (convo?._id) setActiveConvoId(convo._id)
            setStartChatOpen(false)
            setSelectedChatUserId('')
            setChatUserSearch('')
            toast.success('Conversation ready')
          } catch {
            toast.error('Failed to create conversation')
          }
        }}
      />

      <button
        onClick={toggleOpen}
        className="absolute bottom-0 right-0 w-14 h-14 rounded-2xl bg-camp-green text-white shadow-green flex items-center justify-center hover:opacity-95 transition-opacity focus:outline-none focus:ring-4 focus:ring-camp-green/20"
        aria-label="Open notifications and chat"
        aria-expanded={open}
        aria-controls="bottom-right-hub-panel"
      >
        <div className="relative">
          {tab === TABS.CHAT ? <MessageSquare size={20} /> : <Bell size={20} />}
          {unreadCount > 0 ? (
            <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          ) : null}
        </div>
      </button>
    </div>
  )
}

