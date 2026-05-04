import axios from 'axios'

const TOKEN_KEY = 'ym_access_token'
const ORG_KEY = 'ym_organization_id'

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setAuthToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export function getOrganizationId(): string | null {
  return localStorage.getItem(ORG_KEY)
}

export function setOrganizationId(id: string | number | null) {
  if (id != null) localStorage.setItem(ORG_KEY, String(id))
  else localStorage.removeItem(ORG_KEY)
}

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// Request interceptor — gắn Bearer token + Organization Id
api.interceptors.request.use((config) => {
  config.headers = config.headers || {}
  const token = getAuthToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  const orgId = getOrganizationId()
  if (orgId) {
    config.headers['X-Organization-Id'] = orgId
  }
  return config
})

// Response interceptor — xử lý lỗi 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token hết hạn hoặc không hợp lệ → xoá token
      setAuthToken(null)
      // Chỉ điều hướng về home nếu đang ở trang cần auth
      if (window.location.pathname !== '/' && !window.location.pathname.startsWith('/products')) {
        window.location.href = '/'
      }
    }
    return Promise.reject(error)
  }
)

export default api

// ── API xác thực ──
export const authApi = {
  login: (data: { email: string; password: string; recaptcha_token?: string }) => api.post('/auth/login', data),
  register: (data: Record<string, any>) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/user'),
  updateAvatar: (formData: FormData) => api.post('/auth/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
}

export const healthApi = {
  check: () => api.get('/health'),
}
