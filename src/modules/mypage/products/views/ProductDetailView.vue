<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import type { ProductDetail, RelatedProduct } from '../models/Product'
import { productsApi } from '../services/productsApi'
import ProductGallery from '../components/ProductGallery.vue'
import ProductInfo from '../components/ProductInfo.vue'
import ProductTabs from '../components/ProductTabs.vue'
import ProductSidebar from '../components/ProductSidebar.vue'

const route = useRoute()

const product = ref<ProductDetail | null>(null)
const related = ref<RelatedProduct[]>([])
const sameBrand = ref<RelatedProduct[]>([])
const loading = ref(false)
const notFound = ref(false)

async function loadProduct(id: number) {
  if (!id || Number.isNaN(id)) {
    product.value = null
    notFound.value = true
    return
  }
  loading.value = true
  notFound.value = false
  try {
    const detail = await productsApi.detail(id)
    if (!detail) {
      product.value = null
      notFound.value = true
      return
    }
    product.value = detail

    // Tải related/same-brand song song — không chặn render trang chính.
    const [rel, sb] = await Promise.all([
      productsApi.related(id, detail.category),
      productsApi.sameBrand(id, detail.brand),
    ])
    related.value = rel
    sameBrand.value = sb
  } finally {
    loading.value = false
  }
}

watch(() => Number(route.params.id), (id) => {
  loadProduct(id)
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
}, { immediate: false })

onMounted(() => {
  loadProduct(Number(route.params.id))
})
</script>

<template>
  <div class="ym-pdp">
    <div v-if="loading && !product" class="ym-pdp__state">
      <p>Đang tải sản phẩm...</p>
    </div>

    <div v-else-if="notFound" class="ym-pdp__state ym-pdp__state--empty">
      <p>Không tìm thấy sản phẩm.</p>
      <RouterLink to="/" class="ym-pdp__state-link">Quay lại trang chủ</RouterLink>
    </div>

    <template v-else-if="product">
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
    </template>
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
.ym-pdp__state {
  padding: 60px 20px;
  text-align: center;
  color: #6b7280;
}
.ym-pdp__state--empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.ym-pdp__state-link {
  color: #326e51;
  text-decoration: underline;
}
</style>
