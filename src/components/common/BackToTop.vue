<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const show = ref(false)

function checkScroll() {
  show.value = window.scrollY > 400
}

function scrollToTop() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({
    top: 0,
    behavior: reduce ? 'auto' : 'smooth',
  })
}

onMounted(() => {
  window.addEventListener('scroll', checkScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', checkScroll)
})
</script>

<template>
  <Transition name="fade">
    <button
      v-show="show"
      type="button"
      class="ym-back-to-top"
      aria-label="Lên đầu trang"
      @click="scrollToTop"
    >
      <i class="ri-arrow-up-line" aria-hidden="true"></i>
    </button>
  </Transition>
</template>
