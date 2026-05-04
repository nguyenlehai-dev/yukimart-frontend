<script setup lang="ts">
import { hereSideBanners } from '../configs'
</script>

<template>
  <div class="ym-side-banners" role="list">
    <RouterLink
      v-for="(banner, idx) in hereSideBanners"
      :key="banner.id"
      :to="banner.link"
      class="ym-side-banners__item"
      role="listitem"
      :aria-label="`Banner khuyến mãi ${idx + 1}`"
    >
      <img :src="banner.image" alt="" loading="lazy" decoding="async" />
    </RouterLink>
  </div>
</template>
