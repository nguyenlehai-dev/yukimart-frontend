<script setup lang="ts">
import { hereSideBanners } from '../configs'
</script>

<template>
  <div class="ym-side-banners">
    <a
      v-for="banner in hereSideBanners"
      :key="banner.id"
      :href="banner.link"
      class="ym-side-banners__item"
    >
      <img :src="banner.image" alt="" />
    </a>
  </div>
</template>
