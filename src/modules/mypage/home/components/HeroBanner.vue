<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { heroBanners } from '../configs'

const activeSlide = ref(0)
const isPaused = ref(false)
let intervalId: ReturnType<typeof setInterval> | null = null

const prefersReducedMotion = computed(() =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches,
)

function startAutoSlide() {
  if (prefersReducedMotion.value) return
  stopAutoSlide()
  intervalId = setInterval(() => {
    if (isPaused.value) return
    activeSlide.value = (activeSlide.value + 1) % heroBanners.length
  }, 4000)
}

function stopAutoSlide() {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}

function goToSlide(index: number) {
  activeSlide.value = index
  startAutoSlide()
}

function prevSlide() {
  activeSlide.value = (activeSlide.value - 1 + heroBanners.length) % heroBanners.length
  startAutoSlide()
}

function nextSlide() {
  activeSlide.value = (activeSlide.value + 1) % heroBanners.length
  startAutoSlide()
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowLeft') {
    e.preventDefault()
    prevSlide()
  } else if (e.key === 'ArrowRight') {
    e.preventDefault()
    nextSlide()
  }
}

onMounted(() => startAutoSlide())
onUnmounted(() => stopAutoSlide())
</script>

<template>
  <section
    class="ym-hero-banner"
    role="region"
    aria-roledescription="carousel"
    aria-label="Banner khuyến mãi"
    @mouseenter="isPaused = true"
    @mouseleave="isPaused = false"
    @focusin="isPaused = true"
    @focusout="isPaused = false"
    @keydown="onKeydown"
  >
    <div class="ym-hero-banner__track" aria-live="polite" aria-atomic="false">
      <div
        v-for="(banner, index) in heroBanners"
        :key="banner.id"
        class="ym-hero-banner__slide"
        :class="{ 'ym-hero-banner__slide--active': activeSlide === index }"
        role="group"
        aria-roledescription="slide"
        :aria-label="`Slide ${index + 1} / ${heroBanners.length}`"
        :aria-hidden="activeSlide !== index"
        :inert="activeSlide !== index ? '' : undefined"
      >
        <img
          :src="banner.image"
          :alt="banner.title"
          :loading="index === 0 ? 'eager' : 'lazy'"
          decoding="async"
        />
      </div>
    </div>

    <!-- Dot indicators -->
    <div class="ym-hero-banner__dots" role="tablist" aria-label="Chọn slide">
      <button
        v-for="(banner, index) in heroBanners"
        :key="banner.id"
        type="button"
        role="tab"
        :aria-label="`Slide ${index + 1}`"
        :aria-selected="activeSlide === index"
        :tabindex="activeSlide === index ? 0 : -1"
        class="ym-hero-banner__dot"
        :class="{ 'ym-hero-banner__dot--active': activeSlide === index }"
        @click="goToSlide(index)"
      />
    </div>

    <!-- Nav arrows -->
    <button
      type="button"
      class="ym-hero-banner__arrow ym-hero-banner__arrow--prev"
      aria-label="Slide trước"
      @click="prevSlide"
    >
      <i class="ri-arrow-left-s-line" aria-hidden="true"></i>
    </button>
    <button
      type="button"
      class="ym-hero-banner__arrow ym-hero-banner__arrow--next"
      aria-label="Slide sau"
      @click="nextSlide"
    >
      <i class="ri-arrow-right-s-line" aria-hidden="true"></i>
    </button>
  </section>
</template>
