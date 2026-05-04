<script setup lang="ts">
import HeroBanner from '../components/HeroBanner.vue'
import CategorySidebar from '../components/CategorySidebar.vue'
import SideBanners from '../components/SideBanners.vue'
import PolicyBadges from '../components/PolicyBadges.vue'
import FeaturedBrands from '../components/FeaturedBrands.vue'
import CategorySection from '../components/CategorySection.vue'
import { useAdminDataStore } from '@/modules/admin/stores/adminData'

const store = useAdminDataStore()
</script>

<template>
  <div class="ym-home">
    <!-- Hero Area: Sidebar + Banner + Side Banners + Policy -->
    <section class="ym-home__hero">
      <div class="container ym-home__hero-inner">
        <CategorySidebar />
        <HeroBanner />
        <SideBanners />
        <PolicyBadges />
      </div>
    </section>

    <!-- Featured Brands -->
    <FeaturedBrands />

    <!-- Category Sections -->
    <CategorySection
      v-for="section in store.shopSections"
      :key="section.id"
      :section="section"
    />
  </div>
</template>
