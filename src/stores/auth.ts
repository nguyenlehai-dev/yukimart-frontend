import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi, getAuthToken, setAuthToken, setOrganizationId } from '../services/api'
import { getErrorMessage } from '../helpers/apiHelper'

export interface User {
  id: number
  name: string
  email: string
  role?: string // 'retail' | 'wholesale' | 'admin'
  roles?: string[] // tên các role Spatie gán cho user (vd: ['Super Admin', 'Admin'])
  is_super_admin?: boolean // true khi user có role 'Super Admin'
  avatar?: string // user avatar image
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
  // Super Admin = quyền truy cập trang /admin (UserResource trả về cờ này từ BE)
  const isSuperAdmin = computed(() => !!user.value?.is_super_admin)

  // ── Khởi tạo: gọi /me nếu có token trong localStorage ──
  // Share in-flight promise để router guard / nhiều caller cùng đợi 1 request /me,
  // tránh race khi F5 trên /admin (guard chạy trước khi /me kịp resolve).
  let hydratePromise: Promise<void> | null = null
  function hydrate(): Promise<void> {
    if (initialized.value) return Promise.resolve()
    if (hydratePromise) return hydratePromise
    hydratePromise = (async () => {
      if (!getAuthToken()) {
        initialized.value = true
        return
      }
      try {
        const res = await authApi.me()
        if (res.data.success && res.data.data?.user) {
          user.value = res.data.data.user
        } else {
          setAuthToken(null)
        }
      } catch {
        // 401 = token hết hạn → xoá token (interceptor đã làm)
        user.value = null
      } finally {
        initialized.value = true
      }
    })()
    return hydratePromise
  }

  // update avatar via API
  async function updateAvatar(file: File): Promise<boolean> {
    loading.value = true
    error.value = ''
    try {
      const formData = new FormData()
      formData.append('avatar', file)
      const res = await authApi.updateAvatar(formData)
      if (res.data.success && res.data.data?.user) {
        user.value = res.data.data.user
        return true
      }
      return false
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Cập nhật ảnh đại diện thất bại'
      return false
    } finally {
      loading.value = false
    }
  }

  // ── Đăng nhập ──
  async function login(email: string, password: string, recaptchaToken: string = ''): Promise<boolean> {
    loading.value = true
    error.value = ''
    try {
      const res = await authApi.login({ email, password, recaptcha_token: recaptchaToken })
      if (res.data.success && res.data.data?.access_token) {
        setAuthToken(res.data.data.access_token)
        // Lưu organization id (BE yêu cầu header X-Organization-Id cho mọi request)
        const orgId = res.data.data.current_organization_id
          ?? res.data.data.available_organizations?.[0]?.id
          ?? null
        setOrganizationId(orgId)
        user.value = res.data.data.user
        return true
      }
      error.value = res.data.message || 'Đăng nhập thất bại'
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
        if (res.data.data?.access_token) {
          setAuthToken(res.data.data.access_token)
          if (res.data.data?.user) {
            user.value = res.data.data.user
          }
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
    } catch {
      // Bỏ qua lỗi API khi logout — vẫn xoá local state
    } finally {
      setAuthToken(null)
      setOrganizationId(null)
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
    isSuperAdmin,
    // Actions
    login,
    register,
    logout,
    hydrate,
    updateAvatar
  }
})
