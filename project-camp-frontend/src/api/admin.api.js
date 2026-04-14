import axiosInstance from './axios'

export const adminApi = {
  stats: () => axiosInstance.get('/admin/stats'),
  users: (q) => axiosInstance.get('/admin/users', { params: q ? { q } : {} }),
  projects: (q) => axiosInstance.get('/admin/projects', { params: q ? { q } : {} }),
  updateUserRole: (userId, systemRole) =>
    axiosInstance.patch(`/admin/users/${userId}/role`, { systemRole }),
}

