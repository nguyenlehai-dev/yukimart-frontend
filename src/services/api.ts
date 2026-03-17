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

// API functions
export const productApi = {
  getAll: (params?: Record<string, any>) => api.get('/products', { params }),
  getById: (id: number) => api.get(`/products/${id}`),
  create: (data: Record<string, any>) => api.post('/products', data),
  update: (id: number, data: Record<string, any>) => api.put(`/products/${id}`, data),
  delete: (id: number) => api.delete(`/products/${id}`),
}

export const authApi = {
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  register: (data: Record<string, any>) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
}

export const healthApi = {
  check: () => api.get('/health'),
}
