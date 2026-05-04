<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useAdminDataStore } from '@/modules/admin/stores/adminData'

const store = useAdminDataStore()
const featuredBrands = computed(() => store.featuredBrands)

function syncBrands() {
  store.fetchBrands()
}

onMounted(() => {
  syncBrands()
  window.addEventListener('focus', syncBrands)
})
onUnmounted(() => window.removeEventListener('focus', syncBrands))
</script>

<template>
  <section class="ym-featured-brands" aria-labelledby="ym-featured-brands-title">
    <div class="container">
      <div class="ym-featured-brands__header">
        <h2 id="ym-featured-brands-title" class="ym-featured-brands__title">THƯƠNG HIỆU NỔI BẬT</h2>
        <RouterLink to="/products?brands" class="ym-featured-brands__more" aria-label="Xem thêm thương hiệu">
          Xem thêm <i class="ri-arrow-right-s-line" aria-hidden="true"></i>
        </RouterLink>
      </div>
      <div class="ym-featured-brands__grid" role="list">
        <RouterLink
          v-for="brand in featuredBrands"
          :key="brand.id"
          :to="brand.link || `/products?brand=${encodeURIComponent(brand.name)}`"
          class="ym-featured-brands__item"
          role="listitem"
          :aria-label="brand.name"
        >
          <img
            :src="brand.logo"
            :alt="brand.name || ''"
            loading="lazy"
            decoding="async"
            class="ym-featured-brands__logo-img"
          />
        </RouterLink>
      </div>
    </div>
  </section>
</template>
