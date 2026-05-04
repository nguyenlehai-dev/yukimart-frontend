<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import logoImg from '../../assets/images/logo/logo.png'

const logoRef = ref<HTMLElement>()
const isHidden = ref(false)
const clampedTop = ref<number | null>(null)

function updateLogoPosition() {
  const el = logoRef.value
  if (!el) return

  const img = el.querySelector('img') as HTMLElement
  if (!img) return

  const logoHeight = img.offsetHeight
  const vh = window.innerHeight

  // Header bottom (topbar + header + nav)
  const nav = document.querySelector('.ym-nav') as HTMLElement
  const headerBottom = nav ? nav.getBoundingClientRect().bottom : 120

  // Footer top
  const footer = document.querySelector('.ym-footer') as HTMLElement
  const footerTop = footer ? footer.getBoundingClientRect().top : vh

  // Giữa viewport
  const center = vh / 2 - logoHeight / 2
  const minTop = headerBottom + 10
  const maxTop = footerTop - logoHeight - 10

  // Không đủ chỗ → ẩn
  if (maxTop < minTop) {
    isHidden.value = true
    return
  }
  isHidden.value = false

  // Chỉ clamp khi cần — không thay đổi nếu đang ở giữa
  if (center < minTop) {
    clampedTop.value = minTop
  } else if (center > maxTop) {
    clampedTop.value = maxTop
  } else {
    clampedTop.value = null // Dùng CSS mặc định (50%)
  }
}

let ticking = false
function onScroll() {
  if (!ticking) {
    ticking = true
    requestAnimationFrame(() => {
      updateLogoPosition()
      ticking = false
    })
  }
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll, { passive: true })
  setTimeout(updateLogoPosition, 200)
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
})
</script>

<template>
  <div>
    <!-- Logo bên trái -->
    <div
      ref="logoRef"
      class="ym-floating-logo"
      :class="{ 'ym-floating-logo--hidden': isHidden }"
      :style="clampedTop !== null ? { top: clampedTop + 'px', transform: 'none' } : {}"
    >
      <img :src="logoImg" alt="" aria-hidden="true" />
    </div>

    <!-- Nút liên hệ bên phải -->
    <div class="ym-floating-actions">
      <a
        href="https://www.facebook.com/yukimartofficial"
        target="_blank"
        rel="noopener noreferrer"
        class="ym-floating-actions__btn ym-floating-actions__btn--fb"
        aria-label="Mở Facebook YukiMart trong tab mới"
      >
        <i class="ri-facebook-fill" aria-hidden="true"></i>
      </a>
      <a href="mailto:yukimart524@gmail.com" class="ym-floating-actions__btn ym-floating-actions__btn--mail" aria-label="Gửi email cho YukiMart">
        <i class="ri-mail-fill" aria-hidden="true"></i>
      </a>
      <a href="tel:0933738798" class="ym-floating-actions__btn ym-floating-actions__btn--phone" aria-label="Gọi hotline YukiMart">
        <i class="ri-phone-fill" aria-hidden="true"></i>
      </a>
    </div>
  </div>
</template>
