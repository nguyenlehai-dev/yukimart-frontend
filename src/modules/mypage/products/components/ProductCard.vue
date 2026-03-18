<script setup lang="ts">
import type { Product } from '../models/Product'
import { useProductFormat } from '../composables/useProductFormat'

const props = defineProps<{
  product: Product
}>()

const { formatPrice, formatStock } = useProductFormat()
</script>

<template>
  <RouterLink :to="`/products/${product.id}`" class="card">
    <div class="card-image" :style="{ background: `url(${product.image}) center/cover` }"></div>
    <div class="card-body">
      <span class="card-category">{{ product.category }}</span>
      <h3 class="card-title">{{ product.name }}</h3>
      <p style="color: var(--color-text-muted); margin-bottom: 0.75rem; font-size: 0.9rem;">
        {{ product.description }}
      </p>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span class="card-price">{{ formatPrice(product.price) }}</span>
        <span class="badge">{{ formatStock(product.stock) }}</span>
      </div>
    </div>
  </RouterLink>
</template>
