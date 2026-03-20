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

// Scroll to top khi chuyển sản phẩm
watch(productId, () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
})
</script>

<template>
  <div class="ym-pdp">
    <!-- Breadcrumb -->
    <div class="ym-pdp__breadcrumb">
      <div class="container">
        <nav class="ym-pdp__breadcrumb-nav">
          <RouterLink
            v-for="(crumb, i) in product.categoryPath"
            :key="i"
            :to="i === 0 ? '/' : '#'"
            class="ym-pdp__breadcrumb-link"
          >
            {{ crumb }}
            <i v-if="i < product.categoryPath.length - 1" class="ri-arrow-right-s-line"></i>
          </RouterLink>
          <span class="ym-pdp__breadcrumb-current">{{ product.name }}</span>
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
        <div class="ym-pdp__right">
          <ProductSidebar
            :product="product"
            :related-products="related"
            :same-brand-products="sameBrand"
          />
        </div>
      </div>
    </div>
  </div>
</template>
