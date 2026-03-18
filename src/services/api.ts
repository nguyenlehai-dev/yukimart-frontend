import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// Request interceptor - Add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('yukimart_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('yukimart_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

// Shared API functions (not module-specific)
export const authApi = {
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  register: (data: Record<string, any>) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
}

export const healthApi = {
  check: () => api.get('/health'),
}
