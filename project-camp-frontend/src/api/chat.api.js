import axiosInstance from './axios'

export const chatApi = {
  getConversations: () => axiosInstance.get('/chat/conversations'),
  createConversation: (data) => axiosInstance.post('/chat/conversations', data),
  getMessages: (conversationId, params = {}) =>
    axiosInstance.get(`/chat/conversations/${conversationId}/messages`, { params }),
  sendMessage: (conversationId, data) =>
    axiosInstance.post(`/chat/conversations/${conversationId}/messages`, data),
}

