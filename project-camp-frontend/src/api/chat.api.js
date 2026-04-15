import axiosInstance from './axios'

export const chatApi = {
  getUsers: (q) => axiosInstance.get('/chat/users', { params: q ? { q } : {} }),
  getConversations: () => axiosInstance.get('/chat/conversations'),
  createConversation: (data) => axiosInstance.post('/chat/conversations', data),
  getMessages: (conversationId, params = {}) =>
    axiosInstance.get(`/chat/conversations/${conversationId}/messages`, { params }),
  sendMessage: (conversationId, data) =>
    axiosInstance.post(`/chat/conversations/${conversationId}/messages`, data),
}

