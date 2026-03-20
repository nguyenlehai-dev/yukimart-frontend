import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  // Gửi cookie httpOnly tự động theo mỗi request
  withCredentials: true,
})

// Response interceptor — xử lý lỗi 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // BE trả 401 = chưa đăng nhập hoặc token hết hạn
      // Không cần clear localStorage vì không dùng nữa
      // Chỉ reload nếu đang ở trang cần auth
      if (window.location.pathname !== '/') {
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
  me: () => api.get('/auth/me'),
  updateAvatar: (formData: FormData) => api.post('/auth/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
}

export const healthApi = {
  check: () => api.get('/health'),
}
