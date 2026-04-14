import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { notificationApi } from '../api/notification.api'
import { useAuth } from './AuthContext'

const NotificationContext = createContext(null)

const POLL_INTERVAL_MS = 30_000

export function NotificationProvider({ children }) {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const intervalRef = useRef(null)

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return
    try {
      const res = await notificationApi.getUnreadCount()
      const count = res.data?.data?.count ?? 0
      setUnreadCount(count)
    } catch {
      // Swallow silently — a failed poll should never surface an error to the user
    }
  }, [user])

  useEffect(() => {
    if (!user) {
      setUnreadCount(0)
      return
    }
    // Fetch immediately on mount / login
    fetchUnreadCount()
    // Then poll every 30 s
    intervalRef.current = setInterval(fetchUnreadCount, POLL_INTERVAL_MS)
    return () => clearInterval(intervalRef.current)
  }, [user, fetchUnreadCount])

  // Called after marking one notification read
  const decrementUnread = useCallback(() => {
    setUnreadCount((n) => Math.max(0, n - 1))
  }, [])

  // Called after mark-all-read
  const clearUnread = useCallback(() => setUnreadCount(0), [])

  // Force an immediate re-poll (e.g. after navigating to the inbox)
  const refresh = useCallback(() => fetchUnreadCount(), [fetchUnreadCount])

  return (
    <NotificationContext.Provider value={{ unreadCount, decrementUnread, clearUnread, refresh }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider')
  return ctx
}
