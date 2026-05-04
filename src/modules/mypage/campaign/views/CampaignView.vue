<script setup lang="ts">
import { onMounted, ref } from 'vue'
import api from '@/services/api'
import { campaignBanners as fallbackBanners, type CampaignBanner } from '../configs'

const campaignBanners = ref<CampaignBanner[]>(fallbackBanners)

onMounted(async () => {
  try {
    const res = await api.get('/shop/promotions/public')
    const data = res.data.data || []
    if (data.length) {
      campaignBanners.value = data.map((item: any, idx: number) => ({
        id: item.id,
        title: item.title,
        image: item.image || fallbackBanners[idx % fallbackBanners.length]?.image || '',
        link: item.link || '/campaign/wow',
      }))
    }
  } catch {
    campaignBanners.value = fallbackBanners
  }
})
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
      <div class="ym-campaign__grid" role="list">
        <RouterLink
          v-for="banner in campaignBanners"
          :key="banner.id"
          :to="banner.link"
          class="ym-campaign__item"
          role="listitem"
          :aria-label="banner.title"
        >
          <div class="ym-campaign__img-wrap">
            <img
              :src="banner.image"
              :alt="banner.title || ''"
              loading="lazy"
              decoding="async"
              class="ym-campaign__img"
            />
          </div>
          <p class="ym-campaign__caption">{{ banner.title }}</p>
        </RouterLink>
      </div>
    </div>
  </div>
</template>
