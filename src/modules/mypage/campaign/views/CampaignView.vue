<script setup lang="ts">
import { campaignBanners } from '../configs'
</script>

<template>
  <div class="ym-campaign">
    <div class="container">
      <!-- Page Header -->
      <div class="ym-campaign__header">
        <h1 class="ym-campaign__title">
          <i class="ri-megaphone-line"></i>
          CHƯƠNG TRÌNH KHUYẾN MÃI
        </h1>
        <p class="ym-campaign__subtitle">Những ưu đãi hấp dẫn nhất đang chờ bạn!</p>
      </div>

      <!-- Banners Grid -->
      <div class="ym-campaign__grid">
        <RouterLink
          v-for="banner in campaignBanners"
          :key="banner.id"
          :to="banner.link"
          class="ym-campaign__item"
        >
          <div class="ym-campaign__img-wrap">
            <img :src="banner.image" :alt="banner.title" class="ym-campaign__img" />
          </div>
          <p class="ym-campaign__caption">{{ banner.title }}</p>
        </RouterLink>
      </div>
    </div>
  </div>
</template>
