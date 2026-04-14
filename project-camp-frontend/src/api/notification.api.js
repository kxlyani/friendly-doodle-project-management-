import axiosInstance from './axios'

export const notificationApi = {
  /**
   * GET /api/v1/notifications
   * Query params: page, limit, unreadOnly (boolean)
   */
  getNotifications: (params = {}) =>
    axiosInstance.get('/notifications', { params }),

  /**
   * GET /api/v1/notifications/unread-count
   * Returns { count: number } — used for the bell badge poll.
   */
  getUnreadCount: () =>
    axiosInstance.get('/notifications/unread-count'),

  /**
   * PATCH /api/v1/notifications/read-all
   * Marks every notification for the current user as read.
   */
  markAllRead: () =>
    axiosInstance.patch('/notifications/read-all'),

  /**
   * PATCH /api/v1/notifications/:id/read
   * Marks a single notification as read.
   */
  markRead: (id) =>
    axiosInstance.patch(`/notifications/${id}/read`),

  /**
   * DELETE /api/v1/notifications/:id
   * Dismisses (permanently deletes) a single notification.
   */
  dismiss: (id) =>
    axiosInstance.delete(`/notifications/${id}`),
}
