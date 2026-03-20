<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  categoryMenuItems,
  hotDealProducts,
  categorySections,
  suggestedProducts,
  formatPrice,
  type Product,
} from '@/modules/mypage/home/configs'

const route = useRoute()

// ── Collect ALL products from every source ──
const allProducts = computed<Product[]>(() => {
  const map = new Map<number, Product>()
  const addAll = (list: Product[]) => list.forEach(p => map.set(p.id, p))
  addAll(hotDealProducts)
  categorySections.forEach(s => addAll(s.products))
  addAll(suggestedProducts)
  return Array.from(map.values())
})

// ── Sidebar categories from menu ──
const sidebarCategories = computed(() =>
  categoryMenuItems.map(c => ({ id: c.id, name: c.name, link: c.link }))
)

// ── Unique brands from all products ──
const allBrands = computed(() => {
  const brandSet = new Set<string>()
  allProducts.value.forEach(p => brandSet.add(p.brand))
  return Array.from(brandSet).sort()
})

// ── Filter state ──
const selectedCategory = ref<string>('')
const selectedBrands = ref<string[]>([])
const priceFrom = ref<number | null>(null)
const priceTo = ref<number | null>(null)
const sortBy = ref('newest')
const currentPage = ref(1)
const perPage = 20 // 4 rows × 5 columns

// ── Determine page title from route query ──
const pageTitle = computed(() => {
  const q = route.query
  if (q.deal === 'hot') return 'Deal Hấp Dẫn'
  if (q.cat) {
    const cat = categoryMenuItems.find(c => c.link.includes(q.cat as string))
    return cat ? cat.name : 'Sản Phẩm'
  }
  if ('bestseller' in q) return 'Sản Phẩm Bán Chạy'
  if ('new' in q) return 'Hàng Mới Về'
  if ('clinic' in q) return 'Clinic & Spa'
  return 'Tất Cả Sản Phẩm'
})

// ── Filtered & sorted products (all) ──
const allFilteredSorted = computed(() => {
  let list = [...allProducts.value]

  // Category filter
  if (selectedCategory.value) {
    const cat = categoryMenuItems.find(c => c.link.includes(selectedCategory.value))
    if (cat) {
      const section = categorySections.find(s => s.title.toLowerCase().includes(cat.name.toLowerCase().split(' ')[0]))
      if (section) {
        const ids = new Set(section.products.map(p => p.id))
        list = list.filter(p => ids.has(p.id) || p.category.toLowerCase().includes(cat.name.toLowerCase().split(' ')[0]))
      }
    }
  }

  // Brand filter
  if (selectedBrands.value.length > 0) {
    list = list.filter(p => selectedBrands.value.includes(p.brand))
  }

  // Price filter
  if (priceFrom.value !== null) {
    list = list.filter(p => p.salePrice >= priceFrom.value!)
  }
  if (priceTo.value !== null) {
    list = list.filter(p => p.salePrice <= priceTo.value!)
  }

  // Sort
  switch (sortBy.value) {
    case 'bestseller':
      list.sort((a, b) => b.stock - a.stock)
      break
    case 'price-asc':
      list.sort((a, b) => a.salePrice - b.salePrice)
      break
    case 'price-desc':
      list.sort((a, b) => b.salePrice - a.salePrice)
      break
    default: // newest - by id desc
      list.sort((a, b) => b.id - a.id)
  }

  return list
})

// ── Pagination ──
const totalFiltered = computed(() => allFilteredSorted.value.length)
const totalPages = computed(() => Math.ceil(totalFiltered.value / perPage))

const filteredProducts = computed(() => {
  const start = (currentPage.value - 1) * perPage
  return allFilteredSorted.value.slice(start, start + perPage)
})

const totalProducts = computed(() => allProducts.value.length)

function goToPage(page: number) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

// Reset to page 1 when filters change
watch([selectedCategory, selectedBrands, priceFrom, priceTo, sortBy], () => {
  currentPage.value = 1
})

function toggleBrand(brand: string) {
  const idx = selectedBrands.value.indexOf(brand)
  if (idx >= 0) selectedBrands.value.splice(idx, 1)
  else selectedBrands.value.push(brand)
}

function applyPrice() {
  // already reactive
}

function selectCategory(catLink: string) {
  const params = new URLSearchParams(catLink.split('?')[1] || '')
  selectedCategory.value = params.get('cat') || ''
}

function clearFilters() {
  selectedCategory.value = ''
  selectedBrands.value = []
  priceFrom.value = null
  priceTo.value = null
}

// Brand count
function brandCount(brand: string) {
  return allProducts.value.filter(p => p.brand === brand).length
}

// Mobile filter toggle
const showFilter = ref(false)
</script>

<template>
  <div class="ym-plp">
    <!-- Breadcrumb -->
    <div class="ym-plp__breadcrumb">
      <div class="container">
        <RouterLink to="/">Trang chủ</RouterLink>
        <i class="ri-arrow-right-s-line"></i>
        <span>{{ pageTitle }}</span>
      </div>
    </div>

    <div class="container ym-plp__layout">
      <!-- Mobile filter toggle -->
      <div class="ym-plp__filter-toggle-wrap">
        <button class="ym-plp__filter-toggle" @click="showFilter = !showFilter">
          <i class="ri-filter-3-line"></i> Bộ lọc
        </button>
      </div>

      <!-- Overlay -->
      <div v-if="showFilter" class="ym-plp__overlay" @click="showFilter = false"></div>

      <!-- Sidebar -->
      <aside class="ym-plp__sidebar" :class="{ 'ym-plp__sidebar--open': showFilter }">
        <!-- Categories -->
        <div class="ym-plp__filter-group">
          <h4 class="ym-plp__filter-title">DANH MỤC</h4>
          <ul class="ym-plp__cat-list">
            <li
              v-for="cat in sidebarCategories"
              :key="cat.id"
              class="ym-plp__cat-item"
              :class="{ 'ym-plp__cat-item--active': cat.link.includes(selectedCategory) && selectedCategory }"
              @click="selectCategory(cat.link)"
            >
              {{ cat.name }}
              <i class="ri-arrow-right-s-line"></i>
            </li>
          </ul>
        </div>

        <!-- Price Range -->
        <div class="ym-plp__filter-group">
          <h4 class="ym-plp__filter-title">KHOẢNG GIÁ</h4>
          <div class="ym-plp__price-inputs">
            <input v-model.number="priceFrom" type="number" placeholder="₫ TỪ" />
            <span>-</span>
            <input v-model.number="priceTo" type="number" placeholder="₫ ĐẾN" />
          </div>
          <button class="ym-plp__price-btn" @click="applyPrice">Áp dụng</button>
        </div>

        <!-- Brands -->
        <div class="ym-plp__filter-group">
          <h4 class="ym-plp__filter-title">THƯƠNG HIỆU</h4>
          <ul class="ym-plp__brand-list">
            <li v-for="brand in allBrands" :key="brand" class="ym-plp__brand-item">
              <label>
                <input
                  type="checkbox"
                  :checked="selectedBrands.includes(brand)"
                  @change="toggleBrand(brand)"
                />
                {{ brand }}<span class="ym-plp__brand-count">({{ brandCount(brand) }})</span>
              </label>
            </li>
          </ul>
        </div>

        <!-- Clear filters -->
        <button v-if="selectedCategory || selectedBrands.length || priceFrom || priceTo" class="ym-plp__clear-btn" @click="clearFilters">
          <i class="ri-close-line"></i> Xóa bộ lọc
        </button>
      </aside>

      <!-- Main content -->
      <main class="ym-plp__main">
        <!-- Header -->
        <div class="ym-plp__header">
          <h1 class="ym-plp__title">{{ pageTitle }} <span class="ym-plp__count">({{ totalProducts }} sản phẩm)</span></h1>
        </div>

        <!-- Sort bar -->
        <div class="ym-plp__sort-bar">
          <div class="ym-plp__sort-tabs">
            <button :class="{ active: sortBy === 'newest' }" @click="sortBy = 'newest'">Mới nhất</button>
            <button :class="{ active: sortBy === 'bestseller' }" @click="sortBy = 'bestseller'">Bán chạy</button>
            <button :class="{ active: sortBy === 'price-asc' }" @click="sortBy = 'price-asc'">Giá thấp đến cao</button>
            <button :class="{ active: sortBy === 'price-desc' }" @click="sortBy = 'price-desc'">Giá cao đến thấp</button>
          </div>
          <div class="ym-plp__sort-display">
            Hiển thị {{ perPage }} / trang
          </div>
        </div>

        <!-- Product grid -->
        <div class="ym-plp__grid">
          <RouterLink
            v-for="product in filteredProducts"
            :key="product.id"
            :to="`/products/${product.id}`"
            class="ym-plp__product"
          >
            <div class="ym-plp__product-img-wrap">
              <span v-if="product.discount" class="ym-plp__product-badge">-{{ product.discount }}%</span>
              <img :src="product.image" :alt="product.name" class="ym-plp__product-img" />
            </div>
            <div class="ym-plp__product-info">
              <span class="ym-plp__product-brand">{{ product.brand }}</span>
              <h3 class="ym-plp__product-name">{{ product.name }}</h3>
              <div class="ym-plp__product-prices">
                <span v-if="product.originalPrice !== product.salePrice" class="ym-plp__product-original">{{ formatPrice(product.originalPrice) }}</span>
                <span class="ym-plp__product-sale">{{ formatPrice(product.salePrice) }}</span>
              </div>
            </div>
          </RouterLink>
        </div>

        <!-- Empty state -->
        <div v-if="filteredProducts.length === 0" class="ym-plp__empty">
          <i class="ri-search-line"></i>
          <p>Không tìm thấy sản phẩm phù hợp</p>
          <button class="ym-plp__clear-btn" @click="clearFilters">Xóa bộ lọc</button>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="ym-plp__pagination">
          <button
            class="ym-plp__page-btn"
            :disabled="currentPage === 1"
            @click="goToPage(currentPage - 1)"
          >
            <i class="ri-arrow-left-s-line"></i>
          </button>
          <button
            v-for="page in totalPages"
            :key="page"
            class="ym-plp__page-btn"
            :class="{ 'ym-plp__page-btn--active': page === currentPage }"
            @click="goToPage(page)"
          >
            {{ page }}
          </button>
          <button
            class="ym-plp__page-btn"
            :disabled="currentPage === totalPages"
            @click="goToPage(currentPage + 1)"
          >
            <i class="ri-arrow-right-s-line"></i>
          </button>
        </div>
      </main>
    </div>
  </div>
</template>
