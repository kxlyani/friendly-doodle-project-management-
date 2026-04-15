import axiosInstance from './axios'

export const taskApi = {
  // Tasks
  getTasks: (projectId, params = {}) => axiosInstance.get(`/tasks/${projectId}`, { params }),
  getMyDashboard: (params = {}) => axiosInstance.get('/tasks/dashboard/me', { params }),

  // Accepts a plain object for JSON, or a FormData instance when attachments are included.
  // The backend createTask route uses upload.array("attachments") so multipart is supported.
  createTask: (projectId, data) => {
    const isFormData = data instanceof FormData
    return axiosInstance.post(`/tasks/${projectId}`, data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    })
  },

  getTask: (projectId, taskId) =>
    axiosInstance.get(`/tasks/${projectId}/t/${taskId}`),

  updateTask: (projectId, taskId, data) =>
    axiosInstance.put(`/tasks/${projectId}/t/${taskId}`, data),

  requestCompletion: (projectId, taskId) =>
    axiosInstance.post(`/tasks/${projectId}/t/${taskId}/request-completion`),

  reviewCompletion: (projectId, taskId, data) =>
    axiosInstance.post(`/tasks/${projectId}/t/${taskId}/review-completion`, data),

  deleteTask: (projectId, taskId) =>
    axiosInstance.delete(`/tasks/${projectId}/t/${taskId}`),

  // Subtasks
  createSubtask: (projectId, taskId, data) =>
    axiosInstance.post(`/tasks/${projectId}/t/${taskId}/subtasks`, data),

  updateSubtask: (projectId, subTaskId, data) =>
    axiosInstance.put(`/tasks/${projectId}/st/${subTaskId}`, data),

  deleteSubtask: (projectId, subTaskId) =>
    axiosInstance.delete(`/tasks/${projectId}/st/${subTaskId}`),
}
