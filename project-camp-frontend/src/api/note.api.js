import axiosInstance from './axios'

export const noteApi = {
  getNotes: (projectId) => axiosInstance.get(`/notes/${projectId}`),

  createNote: (projectId, data) =>
    axiosInstance.post(`/notes/${projectId}`, data),

  getNote: (projectId, noteId) =>
    axiosInstance.get(`/notes/${projectId}/n/${noteId}`),

  updateNote: (projectId, noteId, data) =>
    axiosInstance.put(`/notes/${projectId}/n/${noteId}`, data),

  deleteNote: (projectId, noteId) =>
    axiosInstance.delete(`/notes/${projectId}/n/${noteId}`),
}
