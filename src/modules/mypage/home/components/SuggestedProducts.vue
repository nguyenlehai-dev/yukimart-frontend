<script setup lang="ts">
import { suggestedProducts } from '../configs'
import ProductCard from './ProductCard.vue'
</script>

<template>
  <section class="ym-suggestions">
    <div class="container">
      <h2 class="ym-suggestions__title">
        <i class="ri-heart-line"></i> GỢI Ý DÀNH RIÊNG CHO BẠN
      </h2>
      <div class="ym-suggestions__grid">
        <ProductCard
          v-for="product in suggestedProducts"
          :key="product.id"
          :product="product"
        />
      </div>
    </div>
  </section>
</template>
