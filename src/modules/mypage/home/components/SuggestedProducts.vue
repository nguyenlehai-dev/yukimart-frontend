<script setup lang="ts">
import ProductCard from './ProductCard.vue'
import { useAdminDataStore } from '@/modules/admin/stores/adminData'

const store = useAdminDataStore()
</script>

<template>
  <section class="ym-suggestions">
    <div class="container">
      <h2 class="ym-suggestions__title">
        <i class="ri-heart-line" aria-hidden="true"></i> GỢI Ý DÀNH RIÊNG CHO BẠN
      </h2>
      <div class="ym-suggestions__grid" role="list">
        <ProductCard
          v-for="product in store.suggested"
          :key="product.id"
          :product="product"
          role="listitem"
        />
      </div>
    </div>
  </section>
</template>
