<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { heroBanners } from '../configs'

const activeSlide = ref(0)
let intervalId: ReturnType<typeof setInterval> | null = null

const startAutoSlide = () => {
  intervalId = setInterval(() => {
    activeSlide.value = (activeSlide.value + 1) % heroBanners.length
  }, 4000)
}

const stopAutoSlide = () => {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}

const goToSlide = (index: number) => {
  activeSlide.value = index
  stopAutoSlide()
  startAutoSlide()
}

const prevSlide = () => {
  activeSlide.value = (activeSlide.value - 1 + heroBanners.length) % heroBanners.length
  stopAutoSlide()
  startAutoSlide()
}

const nextSlide = () => {
  activeSlide.value = (activeSlide.value + 1) % heroBanners.length
  stopAutoSlide()
  startAutoSlide()
}

onMounted(() => startAutoSlide())
onUnmounted(() => stopAutoSlide())
</script>

<template>
  <div class="ym-hero-banner" @mouseenter="stopAutoSlide" @mouseleave="startAutoSlide">
    <div class="ym-hero-banner__track">
      <div
        v-for="(banner, index) in heroBanners"
        :key="banner.id"
        class="ym-hero-banner__slide"
        :class="{ 'ym-hero-banner__slide--active': activeSlide === index }"
      >
        <img :src="banner.image" :alt="banner.title" />
      </div>
    </div>

    <!-- Dot indicators -->
    <div class="ym-hero-banner__dots">
      <button
        v-for="(banner, index) in heroBanners"
        :key="banner.id"
        class="ym-hero-banner__dot"
        :class="{ 'ym-hero-banner__dot--active': activeSlide === index }"
        @click="goToSlide(index)"
      />
    </div>

    <!-- Nav arrows -->
    <button class="ym-hero-banner__arrow ym-hero-banner__arrow--prev" @click="prevSlide">
      <i class="ri-arrow-left-s-line"></i>
    </button>
    <button class="ym-hero-banner__arrow ym-hero-banner__arrow--next" @click="nextSlide">
      <i class="ri-arrow-right-s-line"></i>
    </button>
  </div>
</template>
