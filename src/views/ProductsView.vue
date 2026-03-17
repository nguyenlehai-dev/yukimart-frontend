<script setup lang="ts">
import { onMounted } from 'vue'
import { useProductStore } from '@/stores/products'

const store = useProductStore()

onMounted(() => {
  store.fetchProducts()
})

function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price)
}
</script>

<template>
  <div>
    <div class="page-header">
      <div class="container">
        <h1>🛒 Sản phẩm</h1>
      </div>
    </div>

    <section class="section">
      <div class="container">
        <!-- Loading -->
        <div v-if="store.loading" class="loading">
          <div class="spinner"></div>
        </div>

        <!-- Error -->
        <div v-else-if="store.error" style="text-align: center; padding: 2rem;">
          <p style="color: var(--color-secondary);">{{ store.error }}</p>
          <button class="btn btn-primary" style="margin-top: 1rem;" @click="store.fetchProducts()">
            Thử lại
          </button>
        </div>

        <!-- Products Grid -->
        <div v-else class="grid grid-3">
          <RouterLink
            v-for="product in store.products"
            :key="product.id"
            :to="`/products/${product.id}`"
            class="card"
          >
            <div class="card-image" :style="{ background: `url(${product.image}) center/cover` }"></div>
            <div class="card-body">
              <span class="card-category">{{ product.category }}</span>
              <h3 class="card-title">{{ product.name }}</h3>
              <p style="color: var(--color-text-muted); margin-bottom: 0.75rem; font-size: 0.9rem;">
                {{ product.description }}
              </p>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span class="card-price">{{ formatPrice(product.price) }}</span>
                <span class="badge">Còn {{ product.stock }} sản phẩm</span>
              </div>
            </div>
          </RouterLink>
        </div>

        <!-- Empty -->
        <div v-if="!store.loading && !store.error && store.products.length === 0" style="text-align: center; padding: 3rem;">
          <p style="font-size: 3rem;">📦</p>
          <p style="color: var(--color-text-muted);">Chưa có sản phẩm nào</p>
        </div>
      </div>
    </section>
  </div>
</template>
