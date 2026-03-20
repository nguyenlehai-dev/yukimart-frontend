/**
 * Composable tích hợp Google reCAPTCHA v2 — dạng Checkbox.
 *
 * Hiện widget "Tôi không phải robot" trong form auth.
 * User phải check vào → mới được submit.
 *
 * Đã fix: tracking widget state để tránh lỗi "already rendered".
 */

import { ref } from 'vue'

const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || ''

export function useRecaptchaCheckbox(containerId: string) {
  const token = ref('')
  const isVerified = ref(false)
  let widgetId: number | null = null
  let isRendered = false

  /**
   * Render checkbox widget vào container.
   * Nếu đã render rồi → chỉ reset, không render lại.
   */
  function render() {
    if (!SITE_KEY) return

    const grc = (window as any).grecaptcha
    if (!grc) {
      console.warn('reCAPTCHA chưa load')
      return
    }

    grc.ready(() => {
      const container = document.getElementById(containerId)
      if (!container) return

      // Đã render rồi → chỉ reset
      if (isRendered && widgetId !== null) {
        try {
          grc.reset(widgetId)
          token.value = ''
          isVerified.value = false
        } catch {
          // Widget bị xóa khỏi DOM → render lại
          isRendered = false
          widgetId = null
        }
      }

      // Chưa render → render mới
      if (!isRendered) {
        // Xóa nội dung cũ
        container.innerHTML = ''

        try {
          widgetId = grc.render(containerId, {
            sitekey: SITE_KEY,
            callback: (response: string) => {
              token.value = response
              isVerified.value = true
            },
            'expired-callback': () => {
              token.value = ''
              isVerified.value = false
            },
            'error-callback': () => {
              token.value = ''
              isVerified.value = false
            },
            theme: 'light',
            size: 'normal',
          })
          isRendered = true
        } catch (e) {
          console.warn('reCAPTCHA render error:', e)
        }
      }
    })
  }

  /**
   * Reset checkbox về trạng thái ban đầu.
   */
  function reset() {
    token.value = ''
    isVerified.value = false

    const grc = (window as any).grecaptcha
    if (grc && widgetId !== null) {
      try {
        grc.reset(widgetId)
      } catch {
        // Widget có thể đã bị xóa
      }
    }
  }

  /**
   * Destroy widget — gọi khi modal đóng hoàn toàn.
   * Cho phép render lại khi modal mở lần sau.
   */
  function destroy() {
    token.value = ''
    isVerified.value = false
    widgetId = null
    isRendered = false

    const container = document.getElementById(containerId)
    if (container) {
      container.innerHTML = ''
    }
  }

  const isEnabled = !!SITE_KEY

  return {
    token,
    isVerified,
    isEnabled,
    render,
    reset,
    destroy,
  }
}
