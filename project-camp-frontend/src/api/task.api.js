import axiosInstance from './axios'

export const taskApi = {
  // Tasks
  getTasks: (projectId) => axiosInstance.get(`/tasks/${projectId}`),

  createTask: (projectId, data) =>
    axiosInstance.post(`/tasks/${projectId}`, data),

  getTask: (projectId, taskId) =>
    axiosInstance.get(`/tasks/${projectId}/t/${taskId}`),

  updateTask: (projectId, taskId, data) =>
    axiosInstance.put(`/tasks/${projectId}/t/${taskId}`, data),

  deleteTask: (projectId, taskId) =>
    axiosInstance.delete(`/tasks/${projectId}/t/${taskId}`),

  // File attachment upload (multipart/form-data)
  uploadTaskFiles: (projectId, taskId, formData) =>
    axiosInstance.post(`/tasks/${projectId}/t/${taskId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // Subtasks
  createSubtask: (projectId, taskId, data) =>
    axiosInstance.post(`/tasks/${projectId}/t/${taskId}/subtasks`, data),

  updateSubtask: (projectId, subTaskId, data) =>
    axiosInstance.put(`/tasks/${projectId}/st/${subTaskId}`, data),

  deleteSubtask: (projectId, subTaskId) =>
    axiosInstance.delete(`/tasks/${projectId}/st/${subTaskId}`),
}
