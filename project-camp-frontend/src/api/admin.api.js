import axiosInstance from './axios'

export const adminApi = {
  stats: () => axiosInstance.get('/admin/stats'),
  users: (q) => axiosInstance.get('/admin/users', { params: q ? { q } : {} }),
  projects: (q) => axiosInstance.get('/admin/projects', { params: q ? { q } : {} }),
  updateUserRole: (userId, systemRole) =>
    axiosInstance.patch(`/admin/users/${userId}/role`, { systemRole }),

  audit: (params = {}) => axiosInstance.get('/admin/audit', { params }),
  archiveProject: (projectId) =>
    axiosInstance.patch(`/admin/projects/${projectId}/archive`),
  restoreProject: (projectId) =>
    axiosInstance.patch(`/admin/projects/${projectId}/restore`),
  transferOwnership: (projectId, newOwnerUserId) =>
    axiosInstance.patch(`/admin/projects/${projectId}/transfer-ownership`, {
      newOwnerUserId,
    }),

  impersonate: ({ userId, reason, ttlMinutes }) =>
    axiosInstance.post('/admin/impersonate', { userId, reason, ttlMinutes }),
  stopImpersonation: () => axiosInstance.post('/admin/impersonate/stop'),
  impersonationStatus: () => axiosInstance.get('/admin/impersonate/status'),
}

