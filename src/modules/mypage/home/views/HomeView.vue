<script setup lang="ts">
import HeroBanner from '../components/HeroBanner.vue'
import CategorySidebar from '../components/CategorySidebar.vue'
import SideBanners from '../components/SideBanners.vue'
import PolicyBadges from '../components/PolicyBadges.vue'
import HotDeals from '../components/HotDeals.vue'
import FeaturedBrands from '../components/FeaturedBrands.vue'
import CategorySection from '../components/CategorySection.vue'
import SuggestedProducts from '../components/SuggestedProducts.vue'
import { categorySections } from '../configs'
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

    <!-- Hot Deals -->
    <HotDeals />

    <!-- Featured Brands -->
    <FeaturedBrands />

    <!-- Category Sections -->
    <CategorySection
      v-for="section in categorySections"
      :key="section.id"
      :section="section"
    />

    <!-- Gợi ý dành riêng cho bạn -->
    <SuggestedProducts />
  </div>
</template>
