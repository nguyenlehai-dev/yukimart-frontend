<script setup lang="ts">
import { featuredBrands } from '../configs'
</script>

<template>
  <section class="ym-featured-brands">
    <div class="container">
      <div class="ym-featured-brands__header">
        <h2 class="ym-featured-brands__title">THƯƠNG HIỆU NỔI BẬT</h2>
        <a href="/products?brands" class="ym-featured-brands__more">Xem thêm <i class="ri-arrow-right-s-line"></i></a>
      </div>
      <div class="ym-featured-brands__grid">
        <a
          v-for="brand in featuredBrands"
          :key="brand.id"
          href="#"
          class="ym-featured-brands__item"
        >
          <img :src="brand.logo" :alt="brand.name" class="ym-featured-brands__logo-img" />
        </a>
      </div>
    </div>
  </section>
</template>
