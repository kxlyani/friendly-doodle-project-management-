import axios from 'axios'

const BASE_URL = '/api/v1'

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Track if we're refreshing to avoid loops
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

// These endpoints returning 401 means the user simply isn't authenticated —
// no point trying to silently refresh a token that doesn't exist yet.
// Attempting refresh here causes the double-401 loop visible on the register page.
const SKIP_REFRESH_URLS = [
  '/auth/refresh-token',
  '/auth/login',
  '/auth/register',
  '/auth/current-user', // initial session check on app load
]

// Response interceptor — handle 401 and token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    const shouldSkipRefresh = SKIP_REFRESH_URLS.some((u) =>
      originalRequest.url?.includes(u)
    )

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !shouldSkipRefresh
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then(() => axiosInstance(originalRequest))
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        await axiosInstance.post('/auth/refresh-token')
        processQueue(null)
        return axiosInstance(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        // Clear auth state — redirect to login
        window.dispatchEvent(new CustomEvent('auth:logout'))
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default axiosInstance