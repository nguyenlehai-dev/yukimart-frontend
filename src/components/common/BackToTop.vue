<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const show = ref(false)

const checkScroll = () => {
  show.value = window.scrollY > 400
}

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

onMounted(() => {
  window.addEventListener('scroll', checkScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', checkScroll)
})
</script>

<template>
  <Transition name="fade">
    <button 
      v-show="show" 
      class="ym-back-to-top" 
      @click="scrollToTop"
      aria-label="Back to top"
    >
      <i class="ri-arrow-up-line"></i>
    </button>
  </Transition>
</template>
