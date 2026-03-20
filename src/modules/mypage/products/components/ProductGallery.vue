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
</script>

<template>
  <div class="ym-pdp-gallery">
    <!-- Main image -->
    <div class="ym-pdp-gallery__main">
      <img
        :src="product.images[selectedImageIndex]"
        :alt="product.name"
        class="ym-pdp-gallery__main-img"
      />
    </div>

    <!-- Thumbnails -->
    <div class="ym-pdp-gallery__thumbs">
      <button
        v-for="(img, i) in product.images"
        :key="i"
        :class="['ym-pdp-gallery__thumb', { 'ym-pdp-gallery__thumb--active': i === selectedImageIndex }]"
        @click="selectImage(i)"
      >
        <img :src="img" :alt="`${product.name} - ${i + 1}`" />
      </button>
    </div>

    <!-- Customer images -->
    <div v-if="product.customerImages.length" class="ym-pdp-gallery__customer">
      <p class="ym-pdp-gallery__customer-label">Hình ảnh thực tế từ khách hàng</p>
      <div class="ym-pdp-gallery__customer-list">
        <img
          v-for="(img, i) in product.customerImages"
          :key="i"
          :src="img"
          :alt="`Ảnh khách hàng ${i + 1}`"
          class="ym-pdp-gallery__customer-img"
        />
      </div>
    </div>
  </div>
</template>
