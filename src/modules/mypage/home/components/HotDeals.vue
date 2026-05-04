<script setup lang="ts">
import ProductCard from './ProductCard.vue'
import { useAdminDataStore } from '@/modules/admin/stores/adminData'

const store = useAdminDataStore()
</script>

<template>
  <section class="ym-hot-deals" aria-labelledby="ym-hot-deals-title">
    <div class="container">
      <div class="ym-hot-deals__header">
        <h2 id="ym-hot-deals-title" class="ym-hot-deals__title">
          <i class="ri-fire-fill" aria-hidden="true"></i>
          DEAL HOT ĐANG DIỄN RA
        </h2>
        <RouterLink to="/products?deal=hot" class="ym-hot-deals__more" aria-label="Xem thêm deal hot">
          Xem thêm <i class="ri-arrow-right-s-line" aria-hidden="true"></i>
        </RouterLink>
      </div>
      <div class="ym-hot-deals__grid" role="list">
        <ProductCard
          v-for="product in store.hotDeals"
          :key="product.id"
          :product="product"
          role="listitem"
        />
      </div>
    </div>
  </section>
</template>
