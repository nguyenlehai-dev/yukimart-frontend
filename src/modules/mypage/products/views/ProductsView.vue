<script setup lang="ts">
import { onMounted } from 'vue'
import { useProductStore } from '../stores/products'
import ProductCard from '../components/ProductCard.vue'

const store = useProductStore()

onMounted(() => {
  store.fetchProducts()
})
</script>

<template>
  <div>
    <div class="page-header">
      <div class="container">
        <h1>🛒 {{ $t('products.title') }}</h1>
      </div>
    </div>

    <section class="section">
      <div class="container">
        <!-- Loading -->
        <div v-if="store.loading" class="loading">
          <div class="spinner"></div>
          <p style="margin-top: 1rem; color: var(--color-text-muted);">{{ $t('common.loading') }}</p>
        </div>

        <!-- Error -->
        <div v-else-if="store.error" style="text-align: center; padding: 2rem;">
          <p style="color: var(--color-secondary);">{{ store.error }}</p>
          <AppButton variant="primary" style="margin-top: 1rem;" @click="store.fetchProducts()">
            Thử lại
          </AppButton>
        </div>

        <!-- Products Grid -->
        <div v-else class="grid grid-3">
          <ProductCard
            v-for="product in store.products"
            :key="product.id"
            :product="product"
          />
        </div>

        <!-- Empty -->
        <div v-if="!store.loading && !store.error && store.products.length === 0" style="text-align: center; padding: 3rem;">
          <p style="font-size: 3rem;">📦</p>
          <p style="color: var(--color-text-muted);">{{ $t('common.no_data') }}</p>
        </div>
      </div>
    </section>
  </div>
</template>
