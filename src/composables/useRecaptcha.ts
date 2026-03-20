/**
 * Composable tích hợp Google reCAPTCHA v2 — dạng Checkbox.
 *
 * Hiện widget "Tôi không phải robot" trong form auth.
 * User phải check vào → mới được submit.
 *
 * Script api.js đã được load từ index.html.
 */

import { ref } from 'vue'

const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || ''

export function useRecaptchaCheckbox(containerId: string) {
  const token = ref('')
  const isVerified = ref(false)
  let widgetId: number | null = null

  /**
   * Render checkbox widget vào container.
   * Gọi sau khi DOM đã sẵn sàng (onMounted hoặc nextTick).
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

      // Xóa widget cũ nếu có
      container.innerHTML = ''

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

  const isEnabled = !!SITE_KEY

  return {
    token,
    isVerified,
    isEnabled,
    render,
    reset,
  }
}
