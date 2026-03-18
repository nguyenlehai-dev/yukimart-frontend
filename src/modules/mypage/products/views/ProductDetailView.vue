<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useProductStore } from '../stores/products'
import { useProductFormat } from '../composables/useProductFormat'

const route = useRoute()
const store = useProductStore()
const { formatPrice, isInStock } = useProductFormat()

onMounted(() => {
  const id = Number(route.params.id)
  store.fetchProduct(id)
})
</script>

<template>
  <div>
    <div class="page-header">
      <div class="container">
        <RouterLink to="/products" style="color: var(--color-text-muted); margin-bottom: 0.5rem; display: inline-block;">
          ← Quay lại danh sách
        </RouterLink>
        <h1>Chi tiết sản phẩm</h1>
      </div>
    </div>

    <section class="section">
      <div class="container">
        <div v-if="store.loading" class="loading">
          <div class="spinner"></div>
        </div>

        <div v-else-if="store.currentProduct" style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
          <div>
            <img
              :src="store.currentProduct.image"
              :alt="store.currentProduct.name"
              style="width: 100%; border-radius: var(--radius-lg); background: var(--color-bg-hover); min-height: 300px;"
            />
          </div>
          <div>
            <span class="badge" style="margin-bottom: 1rem;">{{ store.currentProduct.category }}</span>
            <h2 style="font-size: 1.75rem; margin-bottom: 1rem;">{{ store.currentProduct.name }}</h2>
            <p style="color: var(--color-text-muted); margin-bottom: 1.5rem;">{{ store.currentProduct.description }}</p>
            <p class="card-price" style="font-size: 2rem; margin-bottom: 1.5rem;">
              {{ formatPrice(store.currentProduct.price) }}
            </p>
            <p style="margin-bottom: 1.5rem;">
              <span v-if="isInStock(store.currentProduct.stock)" style="color: var(--color-success);">✓ Còn hàng</span>
              <span v-else style="color: var(--color-secondary);">✗ Hết hàng</span>
              <span style="color: var(--color-text-muted);"> ({{ store.currentProduct.stock }} sản phẩm)</span>
            </p>
            <button class="btn btn-primary" style="width: 100%;">
              🛒 Thêm vào giỏ hàng
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
