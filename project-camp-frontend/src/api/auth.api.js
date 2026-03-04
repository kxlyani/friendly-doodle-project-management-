import axiosInstance from './axios'

export const authApi = {
  register: (data) => axiosInstance.post('/auth/register', data),

  login: (data) => axiosInstance.post('/auth/login', data),

  logout: () => axiosInstance.post('/auth/logout'),

  getCurrentUser: () => axiosInstance.get('/auth/current-user'),

  changePassword: (data) => axiosInstance.post('/auth/change-password', data),

  refreshToken: () => axiosInstance.post('/auth/refresh-token'),


  forgotPassword: (data) => axiosInstance.post('/auth/forgot-password', data),

  resetPassword: (resetToken, data) =>
    axiosInstance.post(`/auth/reset-password/${resetToken}`, data),

  resendEmailVerification: () =>
    axiosInstance.get('/auth/resend-email-verification'),
}