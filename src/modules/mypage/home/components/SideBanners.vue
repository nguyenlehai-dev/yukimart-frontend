<script setup lang="ts">
import { hereSideBanners } from '../configs'
</script>

<template>
  <div class="ym-side-banners">
    <RouterLink
      v-for="banner in hereSideBanners"
      :key="banner.id"
      :to="banner.link"
      class="ym-side-banners__item"
    >
      <img :src="banner.image" alt="" />
    </RouterLink>
  </div>
</template>
