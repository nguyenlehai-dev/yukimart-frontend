<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getProductDetailById, getRelatedProductsFor, getSameBrandProductsFor } from '../configs'
import ProductGallery from '../components/ProductGallery.vue'
import ProductInfo from '../components/ProductInfo.vue'
import ProductTabs from '../components/ProductTabs.vue'
import ProductSidebar from '../components/ProductSidebar.vue'

const route = useRoute()

const productId = computed(() => Number(route.params.id))
const product = computed(() => getProductDetailById(productId.value))
const related = computed(() => getRelatedProductsFor(productId.value))
const sameBrand = computed(() => getSameBrandProductsFor(productId.value))

// Scroll lên đầu khi đổi sản phẩm, tôn trọng prefers-reduced-motion
watch(productId, () => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
})
</script>

<template>
  <div class="ym-pdp">
    <!-- Breadcrumb -->
    <div class="ym-pdp__breadcrumb">
      <div class="container">
        <nav class="ym-pdp__breadcrumb-nav" aria-label="Đường dẫn">
          <ol class="ym-pdp__breadcrumb-list">
            <li
              v-for="(crumb, i) in product.categoryPath"
              :key="i"
              class="ym-pdp__breadcrumb-item"
            >
              <RouterLink
                :to="i === 0 ? '/' : '#'"
                class="ym-pdp__breadcrumb-link"
              >
                {{ crumb }}
              </RouterLink>
              <i v-if="i < product.categoryPath.length - 1 || product.name" class="ri-arrow-right-s-line" aria-hidden="true"></i>
            </li>
            <li class="ym-pdp__breadcrumb-item">
              <span class="ym-pdp__breadcrumb-current" aria-current="page">{{ product.name }}</span>
            </li>
          </ol>
        </nav>
      </div>
    </div>

    <!-- Main layout: Left (gallery+info+tabs) + Right (sidebar) -->
    <div class="container">
      <div class="ym-pdp__layout">
        <!-- Left column: gallery + info + tabs -->
        <div class="ym-pdp__left">
          <!-- Top: gallery + info side by side -->
          <div class="ym-pdp__top">
            <ProductGallery :key="product.id" :product="product" />
            <ProductInfo :key="product.id" :product="product" />
          </div>

          <!-- Tabs immediately below -->
          <ProductTabs :key="product.id" :product="product" />
        </div>

        <!-- Right sidebar -->
        <aside class="ym-pdp__right" aria-label="Sản phẩm liên quan">
          <ProductSidebar
            :product="product"
            :related-products="related"
            :same-brand-products="sameBrand"
          />
        </aside>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ym-pdp__breadcrumb-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}
.ym-pdp__breadcrumb-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
</style>
