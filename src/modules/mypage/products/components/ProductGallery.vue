<script setup lang="ts">
import { ref } from 'vue'
import type { ProductDetail } from '../models/Product'

const props = defineProps<{
  product: ProductDetail
}>()

const selectedImageIndex = ref(0)

function selectImage(index: number) {
  selectedImageIndex.value = index
}

function onThumbKey(e: KeyboardEvent, index: number) {
  if (e.key === 'ArrowRight') {
    e.preventDefault()
    selectedImageIndex.value = (index + 1) % props.product.images.length
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault()
    selectedImageIndex.value = (index - 1 + props.product.images.length) % props.product.images.length
  }
}
</script>

<template>
  <div class="ym-pdp-gallery">
    <!-- Main image -->
    <div class="ym-pdp-gallery__main">
      <img
        :src="product.images[selectedImageIndex]"
        :alt="`${product.name} - ảnh ${selectedImageIndex + 1}`"
        loading="eager"
        decoding="async"
        class="ym-pdp-gallery__main-img"
      />
    </div>

    <!-- Thumbnails -->
    <div
      class="ym-pdp-gallery__thumbs"
      role="tablist"
      aria-label="Chọn ảnh sản phẩm"
    >
      <button
        v-for="(img, i) in product.images"
        :key="i"
        type="button"
        role="tab"
        :aria-selected="i === selectedImageIndex"
        :aria-label="`Ảnh ${i + 1} / ${product.images.length}`"
        :tabindex="i === selectedImageIndex ? 0 : -1"
        :class="['ym-pdp-gallery__thumb', { 'ym-pdp-gallery__thumb--active': i === selectedImageIndex }]"
        @click="selectImage(i)"
        @keydown="onThumbKey($event, i)"
      >
        <img
          :src="img"
          :alt="`${product.name} - thumbnail ${i + 1}`"
          loading="lazy"
          decoding="async"
        />
      </button>
    </div>

    <!-- Customer images -->
    <div v-if="product.customerImages.length" class="ym-pdp-gallery__customer">
      <p class="ym-pdp-gallery__customer-label">Hình ảnh thực tế từ khách hàng</p>
      <div class="ym-pdp-gallery__customer-list" role="list">
        <img
          v-for="(img, i) in product.customerImages"
          :key="i"
          :src="img"
          :alt="`Ảnh khách hàng ${i + 1}`"
          loading="lazy"
          decoding="async"
          class="ym-pdp-gallery__customer-img"
          role="listitem"
        />
      </div>
    </div>
  </div>
</template>
