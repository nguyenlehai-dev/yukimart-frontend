<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { useRecaptchaCheckbox } from '../../composables/useRecaptcha'

const authStore = useAuthStore()

// reCAPTCHA checkbox — 2 widget riêng cho login và register
const loginRecaptcha = useRecaptchaCheckbox('recaptcha-login')
const registerRecaptcha = useRecaptchaCheckbox('recaptcha-register')

const props = defineProps<{
  modelValue: boolean
  /** After login, redirect to this route */
  redirectTo?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'loggedIn'): void
}>()

type AuthTab = 'login' | 'register'
const activeTab = ref<AuthTab>('login')

// Login fields
const email = ref('')
const password = ref('')
const rememberMe = ref(false)
const showLoginPassword = ref(false)

// Register fields
const regName = ref('')
const regEmail = ref('')
const regPassword = ref('')
const regConfirmPassword = ref('')
const showRegPassword = ref(false)

// Local error (validation before API)
const localError = ref('')
// Register success message
const regSuccess = ref('')

function close() {
  emit('update:modelValue', false)
  resetForms()
  // Destroy reCAPTCHA widgets khi đóng modal
  // để cho phép render lại khi mở lần sau
  loginRecaptcha.destroy()
  registerRecaptcha.destroy()
}

function resetForms() {
  email.value = ''
  password.value = ''
  rememberMe.value = false
  regName.value = ''
  regEmail.value = ''
  regPassword.value = ''
  regConfirmPassword.value = ''
  localError.value = ''
  regSuccess.value = ''
  authStore.error = ''
}

async function handleLogin() {
  localError.value = ''
  authStore.error = ''

  if (!email.value || !password.value) {
    localError.value = 'Vui lòng nhập email và mật khẩu'
    return
  }

  // Kiểm tra reCAPTCHA checkbox đã check chưa
  if (loginRecaptcha.isEnabled && !loginRecaptcha.isVerified.value) {
    localError.value = 'Vui lòng xác minh reCAPTCHA'
    return
  }

  const success = await authStore.login(email.value, password.value, loginRecaptcha.token.value)
  if (success) {
    close()
    emit('loggedIn')
  } else {
    // Reset reCAPTCHA khi login thất bại (không render lại)
    loginRecaptcha.reset()
  }
}

async function handleRegister() {
  localError.value = ''
  authStore.error = ''
  regSuccess.value = ''

  if (!regName.value || !regEmail.value || !regPassword.value) {
    localError.value = 'Vui lòng điền đầy đủ thông tin'
    return
  }

  if (regPassword.value.length < 6) {
    localError.value = 'Mật khẩu phải có ít nhất 6 ký tự'
    return
  }

  if (regPassword.value !== regConfirmPassword.value) {
    localError.value = 'Mật khẩu xác nhận không khớp'
    return
  }

  // Kiểm tra reCAPTCHA
  if (registerRecaptcha.isEnabled && !registerRecaptcha.isVerified.value) {
    localError.value = 'Vui lòng xác minh reCAPTCHA'
    return
  }

  const success = await authStore.register({
    name: regName.value,
    email: regEmail.value,
    password: regPassword.value,
    password_confirmation: regConfirmPassword.value,
    recaptcha_token: registerRecaptcha.token.value,
  })

  if (success) {
    if (authStore.isLoggedIn) {
      close()
      emit('loggedIn')
    } else {
      regSuccess.value = 'Đăng ký thành công! Vui lòng đăng nhập.'
      activeTab.value = 'login'
      email.value = regEmail.value
    }
  } else {
    // Reset reCAPTCHA khi register thất bại (không render lại)
    registerRecaptcha.reset()
  }
}

// Render reCAPTCHA khi modal mở
watch(() => props.modelValue, async (isOpen) => {
  if (isOpen) {
    await nextTick()
    // Chờ DOM sẵn sàng rồi render
    setTimeout(() => {
      if (activeTab.value === 'login') {
        loginRecaptcha.render()
      } else {
        registerRecaptcha.render()
      }
    }, 200)
  }
})

// Render lại khi chuyển tab (chỉ khi modal đang mở)
watch(activeTab, async () => {
  localError.value = ''
  regSuccess.value = ''
  authStore.error = ''

  if (!props.modelValue) return

  await nextTick()
  setTimeout(() => {
    if (activeTab.value === 'login') {
      loginRecaptcha.render()
    } else {
      registerRecaptcha.render()
    }
  }, 200)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="ym-auth-overlay" @click.self="close">
        <div class="ym-auth-modal" role="dialog" aria-modal="true" aria-labelledby="ym-auth-title">
          <!-- Close button -->
          <button type="button" class="ym-auth-modal__close" aria-label="Đóng" @click="close">
            <i class="ri-close-line" aria-hidden="true"></i>
          </button>

          <div class="ym-auth-modal__inner">
            <!-- ═══ Left: Form side ═══ -->
            <div class="ym-auth-modal__form-side">
              <!-- Logo -->
              <div class="ym-auth-modal__logo">
                <div class="ym-auth-modal__logo-icon" aria-hidden="true">
                  <i class="ri-leaf-line"></i>
                </div>
                <h4 id="ym-auth-title">Chào mừng đến YukiMart</h4>
              </div>

              <!-- Tab switcher -->
              <div class="ym-auth-modal__tabs" role="tablist" aria-label="Chọn đăng nhập hoặc đăng ký">
                <button
                  type="button"
                  role="tab"
                  id="auth-tab-login"
                  aria-controls="auth-panel-login"
                  :aria-selected="activeTab === 'login'"
                  :tabindex="activeTab === 'login' ? 0 : -1"
                  :class="['ym-auth-modal__tab', { active: activeTab === 'login' }]"
                  @click="activeTab = 'login'"
                >
                  Đăng nhập
                </button>
                <button
                  type="button"
                  role="tab"
                  id="auth-tab-register"
                  aria-controls="auth-panel-register"
                  :aria-selected="activeTab === 'register'"
                  :tabindex="activeTab === 'register' ? 0 : -1"
                  :class="['ym-auth-modal__tab', { active: activeTab === 'register' }]"
                  @click="activeTab = 'register'"
                >
                  Đăng ký
                </button>
              </div>

              <!-- Success message -->
              <p v-if="regSuccess" class="ym-auth-modal__success" role="status">
                <i class="ri-check-line" aria-hidden="true"></i> {{ regSuccess }}
              </p>

              <!-- ── Login form ── -->
              <form
                v-if="activeTab === 'login'"
                id="auth-panel-login"
                role="tabpanel"
                aria-labelledby="auth-tab-login"
                class="ym-auth-modal__form"
                @submit.prevent="handleLogin"
              >
                <p v-if="localError || authStore.error" class="ym-auth-modal__error" role="alert">
                  {{ localError || authStore.error }}
                </p>

                <div class="ym-auth-modal__field">
                  <label for="auth-login-email">Tên tài khoản hoặc email</label>
                  <input
                    id="auth-login-email"
                    v-model="email"
                    type="text"
                    autocomplete="username"
                    placeholder="Nhập email hoặc số điện thoại"
                    :disabled="authStore.loading"
                    required
                  />
                </div>

                <div class="ym-auth-modal__field">
                  <label for="auth-login-password">Mật khẩu</label>
                  <div class="ym-auth-modal__password-wrap">
                    <input
                      id="auth-login-password"
                      v-model="password"
                      :type="showLoginPassword ? 'text' : 'password'"
                      autocomplete="current-password"
                      placeholder="Nhập mật khẩu"
                      :disabled="authStore.loading"
                      required
                    />
                    <button
                      type="button"
                      class="ym-auth-modal__password-toggle"
                      :aria-label="showLoginPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'"
                      :aria-pressed="showLoginPassword"
                      @click="showLoginPassword = !showLoginPassword"
                    >
                      <i :class="showLoginPassword ? 'ri-eye-off-line' : 'ri-eye-line'" aria-hidden="true"></i>
                    </button>
                  </div>
                </div>

                <div class="ym-auth-modal__options">
                  <label class="ym-auth-modal__remember">
                    <input v-model="rememberMe" type="checkbox" />
                    Ghi nhớ đăng nhập
                  </label>
                  <a href="/forgot-password" class="ym-auth-modal__forgot">Quên mật khẩu?</a>
                </div>

                <!-- ✅ reCAPTCHA checkbox -->
                <div class="ym-auth-modal__recaptcha">
                  <div id="recaptcha-login"></div>
                </div>

                <button
                  type="submit"
                  class="ym-auth-modal__submit"
                  :disabled="authStore.loading"
                  :aria-busy="authStore.loading || undefined"
                >
                  <span v-if="authStore.loading" class="ym-auth-modal__spinner" aria-hidden="true"></span>
                  {{ authStore.loading ? 'Đang xử lý...' : 'Đăng nhập' }}
                </button>

                <p class="ym-auth-modal__switch">
                  Bạn chưa có tài khoản?
                  <button type="button" class="ym-auth-modal__link" @click="activeTab = 'register'">Đăng ký ngay</button>
                </p>
              </form>

              <!-- ── Register form ── -->
              <form
                v-else
                id="auth-panel-register"
                role="tabpanel"
                aria-labelledby="auth-tab-register"
                class="ym-auth-modal__form"
                @submit.prevent="handleRegister"
              >
                <p v-if="localError || authStore.error" class="ym-auth-modal__error" role="alert">
                  {{ localError || authStore.error }}
                </p>

                <div class="ym-auth-modal__field">
                  <label for="auth-reg-name">Họ và tên</label>
                  <input
                    id="auth-reg-name"
                    v-model="regName"
                    type="text"
                    autocomplete="name"
                    placeholder="Nhập họ và tên"
                    :disabled="authStore.loading"
                    required
                  />
                </div>

                <div class="ym-auth-modal__field">
                  <label for="auth-reg-email">Địa chỉ email</label>
                  <input
                    id="auth-reg-email"
                    v-model="regEmail"
                    type="email"
                    autocomplete="email"
                    inputmode="email"
                    placeholder="Nhập địa chỉ email"
                    :disabled="authStore.loading"
                    required
                  />
                </div>

                <div class="ym-auth-modal__field">
                  <label for="auth-reg-password">Mật khẩu</label>
                  <div class="ym-auth-modal__password-wrap">
                    <input
                      id="auth-reg-password"
                      v-model="regPassword"
                      :type="showRegPassword ? 'text' : 'password'"
                      autocomplete="new-password"
                      placeholder="Tạo mật khẩu (ít nhất 6 ký tự)"
                      minlength="6"
                      :disabled="authStore.loading"
                      :aria-describedby="'auth-reg-password-hint'"
                      required
                    />
                    <button
                      type="button"
                      class="ym-auth-modal__password-toggle"
                      :aria-label="showRegPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'"
                      :aria-pressed="showRegPassword"
                      @click="showRegPassword = !showRegPassword"
                    >
                      <i :class="showRegPassword ? 'ri-eye-off-line' : 'ri-eye-line'" aria-hidden="true"></i>
                    </button>
                  </div>
                  <small id="auth-reg-password-hint" class="ym-auth-modal__hint">Tối thiểu 6 ký tự</small>
                </div>

                <div class="ym-auth-modal__field">
                  <label for="auth-reg-confirm">Xác nhận mật khẩu</label>
                  <input
                    id="auth-reg-confirm"
                    v-model="regConfirmPassword"
                    :type="showRegPassword ? 'text' : 'password'"
                    autocomplete="new-password"
                    placeholder="Nhập lại mật khẩu"
                    :disabled="authStore.loading"
                    required
                  />
                </div>

                <p class="ym-auth-modal__privacy">
                  Dữ liệu của bạn sẽ được sử dụng để hỗ trợ trải nghiệm trên website,
                  quản lý truy cập tài khoản và các mục đích khác theo
                  <a href="/privacy">chính sách riêng tư</a>.
                </p>

                <!-- ✅ reCAPTCHA checkbox -->
                <div class="ym-auth-modal__recaptcha">
                  <div id="recaptcha-register"></div>
                </div>

                <button
                  type="submit"
                  class="ym-auth-modal__submit"
                  :disabled="authStore.loading"
                  :aria-busy="authStore.loading || undefined"
                >
                  <span v-if="authStore.loading" class="ym-auth-modal__spinner" aria-hidden="true"></span>
                  {{ authStore.loading ? 'Đang xử lý...' : 'Đăng ký' }}
                </button>

                <p class="ym-auth-modal__switch">
                  Đã có tài khoản?
                  <button type="button" class="ym-auth-modal__link" @click="activeTab = 'login'">Đăng nhập</button>
                </p>
              </form>
            </div>

            <!-- ═══ Right: Branding side ═══ -->
            <aside class="ym-auth-modal__brand-side" aria-hidden="true">
              <div class="ym-auth-modal__brand-content">
                <i class="ri-shield-check-line ym-auth-modal__brand-icon"></i>
                <h4>Mua sắm an toàn &amp; tiện lợi</h4>
                <p>
                  YukiMart cam kết mang đến trải nghiệm mua sắm tuyệt vời với
                  hàng nghìn sản phẩm chính hãng, giao hàng nhanh chóng và
                  chính sách đổi trả linh hoạt.
                </p>
                <ul class="ym-auth-modal__brand-features">
                  <li><i class="ri-check-line"></i> Sản phẩm chính hãng 100%</li>
                  <li><i class="ri-check-line"></i> Giao hàng toàn quốc</li>
                  <li><i class="ri-check-line"></i> Đổi trả trong 30 ngày</li>
                  <li><i class="ri-check-line"></i> Thanh toán an toàn</li>
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
