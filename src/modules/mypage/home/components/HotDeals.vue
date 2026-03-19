<script setup lang="ts">
import { hotDealProducts } from '../configs'
import ProductCard from './ProductCard.vue'
</script>

<template>
  <section class="ym-hot-deals">
    <div class="container">
      <div class="ym-hot-deals__header">
        <h2 class="ym-hot-deals__title">
          <i class="ri-fire-fill"></i>
          DEAL HOT ĐANG DIỄN RA
        </h2>
        <a href="/products?deal=hot" class="ym-hot-deals__more">Xem thêm <i class="ri-arrow-right-s-line"></i></a>
      </div>
      <div class="ym-hot-deals__grid">
        <ProductCard
          v-for="product in hotDealProducts"
          :key="product.id"
          :product="product"
        />
      </div>
    </div>
  </section>
</template>
