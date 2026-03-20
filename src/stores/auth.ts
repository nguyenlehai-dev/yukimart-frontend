import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '../services/api'
import { getErrorMessage } from '../helpers/apiHelper'

export interface User {
  id: number
  name: string
  email: string
  role?: string // 'retail' | 'wholesale' | 'admin'
}

export const useAuthStore = defineStore('auth', () => {
  // ── State ──
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref('')
  const initialized = ref(false) // đánh dấu đã gọi /me chưa

  // ── Getters ──
  const isLoggedIn = computed(() => !!user.value)
  const userName = computed(() => user.value?.name || '')
  const userRole = computed(() => user.value?.role || 'retail')
  const isWholesale = computed(() => user.value?.role === 'wholesale')

  // ── Khởi tạo: gọi /me để kiểm tra đã đăng nhập chưa ──
  // Cookie httpOnly do BE quản lý, FE chỉ gọi /me để lấy user
  async function hydrate() {
    if (initialized.value) return
    try {
      const res = await authApi.me()
      if (res.data.success && res.data.data?.user) {
        user.value = res.data.data.user
      }
    } catch {
      // 401 = chưa đăng nhập, không cần xử lý gì
      user.value = null
    } finally {
      initialized.value = true
    }
  }

  // ── Đăng nhập ──
  async function login(email: string, password: string, recaptchaToken: string = ''): Promise<boolean> {
    loading.value = true
    error.value = ''
    try {
      const res = await authApi.login({ email, password, recaptcha_token: recaptchaToken })
      if (res.data.success) {
        // BE đã set cookie httpOnly, chỉ cần lưu user info
        user.value = res.data.data?.user
        return true
      }
      error.value = 'Đăng nhập thất bại'
      return false
    } catch (err: any) {
      if (err.response?.status === 401) {
        error.value = 'Email hoặc mật khẩu không đúng'
      } else {
        error.value = getErrorMessage(err)
      }
      return false
    } finally {
      loading.value = false
    }
  }

  // ── Đăng ký ──
  async function register(data: {
    name: string
    email: string
    password: string
    password_confirmation: string
    recaptcha_token?: string
  }): Promise<boolean> {
    loading.value = true
    error.value = ''
    try {
      const res = await authApi.register(data)
      if (res.data.success) {
        // BE đã set cookie httpOnly + trả user info
        if (res.data.data?.user) {
          user.value = res.data.data.user
        }
        return true
      }
      error.value = 'Đăng ký thất bại'
      return false
    } catch (err: any) {
      if (err.response?.status === 422) {
        // Lỗi validation từ BE
        const messages = err.response.data?.errors
        if (messages) {
          const firstError = Object.values(messages).flat()[0]
          error.value = firstError as string
        } else {
          error.value = err.response.data?.message || 'Thông tin không hợp lệ'
        }
      } else {
        error.value = getErrorMessage(err)
      }
      return false
    } finally {
      loading.value = false
    }
  }

  // ── Đăng xuất ──
  async function logout() {
    try {
      await authApi.logout()
      // BE đã xóa cookie httpOnly
    } catch {
      // Bỏ qua lỗi API khi logout
    } finally {
      user.value = null
    }
  }

  // Gọi /me khi store được tạo
  hydrate()

  return {
    // State
    user,
    loading,
    error,
    initialized,
    // Getters
    isLoggedIn,
    userName,
    userRole,
    isWholesale,
    // Actions
    login,
    register,
    logout,
    hydrate,
  }
})
