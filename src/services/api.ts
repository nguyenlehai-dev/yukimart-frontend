import axios from 'axios'

const TOKEN_KEY = 'ym_access_token'
const ORG_KEY = 'ym_organization_id'
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

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
  baseURL: API_BASE_URL,
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

// Retry GET request idempotent khi mạng chập chờn (network error / 502/503/504).
// Tối đa 2 retry với backoff 300ms → 900ms. Không retry POST/PUT/DELETE để
// tránh duplicate side-effect.
const MAX_RETRIES = 2
const RETRY_BACKOFF_MS = [300, 900]

function shouldRetry(error: any): boolean {
  const cfg = error.config
  if (!cfg) return false
  const method = String(cfg.method || 'get').toLowerCase()
  if (method !== 'get' && method !== 'head') return false
  // Network error (no response) hoặc gateway 502/503/504 hoặc timeout.
  if (!error.response) return true
  const code = error.response.status
  return code === 502 || code === 503 || code === 504
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Retry trước, nếu vẫn fail thì rơi vào logic 401 dưới.
    const cfg = error.config || {}
    cfg.__retryCount = (cfg.__retryCount as number | undefined) ?? 0
    if (shouldRetry(error) && cfg.__retryCount < MAX_RETRIES) {
      const delay = RETRY_BACKOFF_MS[cfg.__retryCount] ?? 1500
      cfg.__retryCount++
      await new Promise((r) => setTimeout(r, delay))
      return api.request(cfg)
    }

    if (error.response?.status === 401) {
      const reqUrl = String(error.config?.url || '')
      // /user là endpoint hydrate — 401 ở đây là bình thường khi token hết hạn,
      // router guard sẽ tự xử lý điều hướng. Không hard-redirect tránh "văng
      // ra trang chủ" khi reload trang admin.
      const isHydrate = reqUrl.endsWith('/user') || reqUrl.endsWith('user')
      setAuthToken(null)
      if (
        !isHydrate
        && window.location.pathname !== '/'
        && !window.location.pathname.startsWith('/products')
      ) {
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

// ── Tài khoản cá nhân — mọi endpoint trả về dữ liệu của user đang đăng nhập ──
export const accountApi = {
  orders: (params?: { limit?: number }) => api.get('/account/orders', { params }),
  createOrder: (payload: Record<string, any>) => api.post('/account/orders', payload),
  activities: (params?: { limit?: number }) => api.get('/account/activities', { params }),
  purchaseHistory: (params?: { limit?: number }) => api.get('/account/purchase-history', { params }),
  invoices: (params?: { limit?: number }) => api.get('/account/invoices', { params }),
}
