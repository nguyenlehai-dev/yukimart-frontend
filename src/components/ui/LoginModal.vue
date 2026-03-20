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

// Register fields
const regName = ref('')
const regEmail = ref('')
const regPassword = ref('')
const regConfirmPassword = ref('')

// Local error (validation before API)
const localError = ref('')
// Register success message
const regSuccess = ref('')

function close() {
  emit('update:modelValue', false)
  resetForms()
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
  loginRecaptcha.reset()
  registerRecaptcha.reset()
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
    // Reset reCAPTCHA khi login thất bại
    loginRecaptcha.reset()
    // Render lại widget sau 100ms
    setTimeout(() => loginRecaptcha.render(), 100)
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
    registerRecaptcha.reset()
    setTimeout(() => registerRecaptcha.render(), 100)
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

// Render lại khi chuyển tab
watch(activeTab, async () => {
  localError.value = ''
  regSuccess.value = ''
  authStore.error = ''

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
        <div class="ym-auth-modal">
          <!-- Close button -->
          <button class="ym-auth-modal__close" @click="close">&times;</button>

          <div class="ym-auth-modal__inner">
            <!-- ═══ Left: Form side ═══ -->
            <div class="ym-auth-modal__form-side">
              <!-- Logo -->
              <div class="ym-auth-modal__logo">
                <div class="ym-auth-modal__logo-icon">
                  <i class="ri-leaf-line"></i>
                </div>
                <h4>Chào mừng đến YukiMart</h4>
              </div>

              <!-- Tab switcher -->
              <div class="ym-auth-modal__tabs">
                <button
                  :class="['ym-auth-modal__tab', { active: activeTab === 'login' }]"
                  @click="activeTab = 'login'"
                >
                  Đăng nhập
                </button>
                <button
                  :class="['ym-auth-modal__tab', { active: activeTab === 'register' }]"
                  @click="activeTab = 'register'"
                >
                  Đăng ký
                </button>
              </div>

              <!-- Success message -->
              <p v-if="regSuccess" class="ym-auth-modal__success">
                <i class="ri-check-line"></i> {{ regSuccess }}
              </p>

              <!-- ── Login form ── -->
              <form
                v-if="activeTab === 'login'"
                class="ym-auth-modal__form"
                @submit.prevent="handleLogin"
              >
                <p v-if="localError || authStore.error" class="ym-auth-modal__error">
                  {{ localError || authStore.error }}
                </p>

                <div class="ym-auth-modal__field">
                  <label for="auth-login-email">Tên tài khoản hoặc email</label>
                  <input
                    id="auth-login-email"
                    v-model="email"
                    type="text"
                    placeholder="Nhập email hoặc số điện thoại"
                    :disabled="authStore.loading"
                  />
                </div>

                <div class="ym-auth-modal__field">
                  <label for="auth-login-password">Mật khẩu</label>
                  <input
                    id="auth-login-password"
                    v-model="password"
                    type="password"
                    placeholder="Nhập mật khẩu"
                    :disabled="authStore.loading"
                  />
                </div>

                <div class="ym-auth-modal__options">
                  <label class="ym-auth-modal__remember">
                    <input v-model="rememberMe" type="checkbox" />
                    Ghi nhớ đăng nhập
                  </label>
                  <a href="#" class="ym-auth-modal__forgot">Quên mật khẩu?</a>
                </div>

                <!-- ✅ reCAPTCHA checkbox -->
                <div class="ym-auth-modal__recaptcha">
                  <div id="recaptcha-login"></div>
                </div>

                <button
                  type="submit"
                  class="ym-auth-modal__submit"
                  :disabled="authStore.loading"
                >
                  <span v-if="authStore.loading" class="ym-auth-modal__spinner"></span>
                  {{ authStore.loading ? 'Đang xử lý...' : 'Đăng nhập' }}
                </button>

                <p class="ym-auth-modal__switch">
                  Bạn chưa có tài khoản?
                  <a href="#" @click.prevent="activeTab = 'register'">Đăng ký ngay</a>
                </p>
              </form>

              <!-- ── Register form ── -->
              <form
                v-else
                class="ym-auth-modal__form"
                @submit.prevent="handleRegister"
              >
                <p v-if="localError || authStore.error" class="ym-auth-modal__error">
                  {{ localError || authStore.error }}
                </p>

                <div class="ym-auth-modal__field">
                  <label for="auth-reg-name">Họ và tên</label>
                  <input
                    id="auth-reg-name"
                    v-model="regName"
                    type="text"
                    placeholder="Nhập họ và tên"
                    :disabled="authStore.loading"
                  />
                </div>

                <div class="ym-auth-modal__field">
                  <label for="auth-reg-email">Địa chỉ email</label>
                  <input
                    id="auth-reg-email"
                    v-model="regEmail"
                    type="email"
                    placeholder="Nhập địa chỉ email"
                    :disabled="authStore.loading"
                  />
                </div>

                <div class="ym-auth-modal__field">
                  <label for="auth-reg-password">Mật khẩu</label>
                  <input
                    id="auth-reg-password"
                    v-model="regPassword"
                    type="password"
                    placeholder="Tạo mật khẩu (ít nhất 6 ký tự)"
                    :disabled="authStore.loading"
                  />
                </div>

                <div class="ym-auth-modal__field">
                  <label for="auth-reg-confirm">Xác nhận mật khẩu</label>
                  <input
                    id="auth-reg-confirm"
                    v-model="regConfirmPassword"
                    type="password"
                    placeholder="Nhập lại mật khẩu"
                    :disabled="authStore.loading"
                  />
                </div>

                <p class="ym-auth-modal__privacy">
                  Dữ liệu của bạn sẽ được sử dụng để hỗ trợ trải nghiệm trên website,
                  quản lý truy cập tài khoản và các mục đích khác theo
                  <a href="#">chính sách riêng tư</a>.
                </p>

                <!-- ✅ reCAPTCHA checkbox -->
                <div class="ym-auth-modal__recaptcha">
                  <div id="recaptcha-register"></div>
                </div>

                <button
                  type="submit"
                  class="ym-auth-modal__submit"
                  :disabled="authStore.loading"
                >
                  <span v-if="authStore.loading" class="ym-auth-modal__spinner"></span>
                  {{ authStore.loading ? 'Đang xử lý...' : 'Đăng ký' }}
                </button>

                <p class="ym-auth-modal__switch">
                  Đã có tài khoản?
                  <a href="#" @click.prevent="activeTab = 'login'">Đăng nhập</a>
                </p>
              </form>
            </div>

            <!-- ═══ Right: Branding side ═══ -->
            <div class="ym-auth-modal__brand-side">
              <div class="ym-auth-modal__brand-content">
                <i class="ri-shield-check-line ym-auth-modal__brand-icon"></i>
                <h4>Mua sắm an toàn & tiện lợi</h4>
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
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
