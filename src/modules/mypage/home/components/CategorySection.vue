<script setup lang="ts">
import { ref } from 'vue'
import type { CategorySectionData } from '../configs'
import ProductCard from './ProductCard.vue'

const props = defineProps<{
  section: CategorySectionData
}>()

const activeTab = ref(0)
</script>

<template>
  <section class="ym-cat-section">
    <div class="container">
      <!-- Header -->
      <div class="ym-cat-section__header" :style="{ borderBottomColor: section.color }">
        <h2 class="ym-cat-section__title" :style="{ color: section.color }">{{ section.title }}</h2>
        <div class="ym-cat-section__tabs">
          <button
            v-for="(tab, idx) in section.subTabs"
            :key="idx"
            class="ym-cat-section__tab"
            :class="{ 'ym-cat-section__tab--active': activeTab === idx }"
            :style="activeTab === idx ? { color: section.color, borderBottomColor: section.color } : {}"
            @click="activeTab = idx"
          >
            {{ tab }}
          </button>
          <a href="#" class="ym-cat-section__tab-more" :style="{ color: section.color }">
            + Xem thêm
          </a>
        </div>
      </div>

      <div class="ym-cat-section__body">
        <!-- Promo image column (tall left banner) -->
        <div v-if="section.promoImage" class="ym-cat-section__promo">
          <a href="#" class="ym-cat-section__promo-link">
            <img :src="section.promoImage" :alt="section.title" />
          </a>
          <div class="ym-cat-section__tags">
            <span v-for="tag in section.tags" :key="tag" class="ym-cat-section__tag">{{ tag }}</span>
          </div>
        </div>

        <!-- Middle: banners + products -->
        <div class="ym-cat-section__main">
          <!-- Banners row -->
          <div class="ym-cat-section__banners">
            <div
              v-for="(banner, idx) in section.banners"
              :key="idx"
              class="ym-cat-section__banner"
            >
              <img :src="banner.image" :alt="banner.title" class="ym-cat-section__banner-img" />
              <div class="ym-cat-section__banner-overlay">
                <strong>{{ banner.title }}</strong>
                <span>{{ banner.subtitle }}</span>
                <RouterLink :to="banner.link" class="ym-cat-section__banner-link" :style="{ color: section.color }">
                  Mua ngay <i class="ri-arrow-right-line"></i>
                </RouterLink>
              </div>
            </div>
          </div>

          <!-- Products -->
          <div class="ym-cat-section__products">
            <div class="ym-cat-section__products-header">
              <span class="ym-cat-section__products-label" :style="{ color: section.color }">
                <i class="ri-star-fill"></i> Nổi bật và bán chạy
              </span>
              <a href="#" class="ym-cat-section__products-more" :style="{ background: section.color }">
                + Xem thêm <i class="ri-arrow-right-s-line"></i>
              </a>
            </div>
            <div class="ym-cat-section__products-grid">
              <ProductCard
                v-for="product in section.products"
                :key="product.id"
                :product="product"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
