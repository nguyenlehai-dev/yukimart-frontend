<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { formatPrice, type Product } from '@/modules/mypage/home/configs'
import { useAdminDataStore } from '@/modules/admin/stores/adminData'

const route = useRoute()
const store = useAdminDataStore()

// Đồng bộ menu categories với admin (active + showOnMenu)
const categoryMenuItems = computed(() => store.customerMenu)

// Trang danh sách dùng API phân trang để không kéo toàn bộ sản phẩm về trình duyệt.
const allProducts = computed<Product[]>(() =>
  store.publicProducts as unknown as Product[]
)

// ── Sidebar categories from menu (đồng bộ admin) ──
const sidebarCategories = computed(() =>
  categoryMenuItems.value.map(c => ({ id: c.id, name: c.name, link: c.link }))
)

// ── Unique brands from all products ──
const allBrands = computed(() => {
  if (store.publicBrandFacets.length) return store.publicBrandFacets.map((item) => item.brand)
  return Array.from(new Set(allProducts.value.map((p) => p.brand))).sort()
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
    const cat = categoryMenuItems.value.find(c => c.link.includes(q.cat as string))
    return cat ? cat.name : 'Sản Phẩm'
  }
  if (q.brand) return `Thương hiệu ${q.brand}`
  if ('brands' in q) return 'Thương Hiệu'
  if ('bestseller' in q) return 'Sản Phẩm Bán Chạy'
  if ('new' in q) return 'Hàng Mới Về'
  if ('clinic' in q) return 'Clinic & Spa'
  return 'Tất Cả Sản Phẩm'
})

// ── Pagination ──
const totalFiltered = computed(() => store.publicProductMeta.total)
const totalPages = computed(() => store.publicProductMeta.lastPage)
const filteredProducts = computed(() => allProducts.value)
const totalProducts = computed(() => totalFiltered.value)

function goToPage(page: number) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

async function fetchServerProducts() {
  await store.fetchPublicProducts({
    page: currentPage.value,
    per_page: perPage,
    cat: selectedCategory.value || undefined,
    brand: selectedBrands.value.length ? selectedBrands.value.join(',') : undefined,
    min_price: priceFrom.value ?? undefined,
    max_price: priceTo.value ?? undefined,
    sort: sortBy.value,
    deal: route.query.deal === 'hot' ? 'hot' : undefined,
  })
}

// Reset về trang 1 khi bộ lọc đổi, dữ liệu được lấy từ server.
watch(() => [selectedCategory.value, selectedBrands.value.join('|'), priceFrom.value, priceTo.value, sortBy.value], () => {
  currentPage.value = 1
  fetchServerProducts()
})

watch(currentPage, fetchServerProducts)

watch(() => route.query, () => {
  syncFiltersFromRoute()
  currentPage.value = 1
  fetchServerProducts()
})

function brandKey(brand: string) {
  return brand.trim().toLowerCase()
}

function syncFiltersFromRoute() {
  const cat = route.query.cat
  selectedCategory.value = typeof cat === 'string' ? cat : ''

  const brand = route.query.brand
  selectedBrands.value = typeof brand === 'string' && brand.trim() ? [brand.trim()] : []
}

function toggleBrand(brand: string) {
  const idx = selectedBrands.value.indexOf(brand)
  if (idx >= 0) selectedBrands.value.splice(idx, 1)
  else selectedBrands.value.push(brand)
}

function applyPrice() {
  currentPage.value = 1
  fetchServerProducts()
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
  return store.publicBrandFacets.find((item) => item.brand === brand)?.count
    || allProducts.value.filter(p => brandKey(p.brand) === brandKey(brand)).length
}

// Mobile filter toggle
const showFilter = ref(false)

// Đóng bằng Esc
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && showFilter.value) showFilter.value = false
}
onMounted(() => {
  syncFiltersFromRoute()
  fetchServerProducts()
  document.addEventListener('keydown', onKeydown)
})
onUnmounted(() => document.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
.ym-plp__cat-btn {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  color: inherit;
  cursor: pointer;
  text-align: left;
}
.ym-plp__cat-btn:focus { outline: none; }
.ym-plp__cat-btn:focus-visible {
  outline: 2px solid var(--color-primary, #326e51);
  outline-offset: 2px;
  border-radius: 4px;
}
</style>

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
        <button
          type="button"
          class="ym-plp__filter-toggle"
          :aria-expanded="showFilter"
          aria-controls="ym-plp-sidebar"
          @click="showFilter = !showFilter"
        >
          <i class="ri-filter-3-line" aria-hidden="true"></i> Bộ lọc
        </button>
      </div>

      <!-- Overlay -->
      <div v-if="showFilter" class="ym-plp__overlay" @click="showFilter = false" aria-hidden="true"></div>

      <!-- Sidebar -->
      <aside id="ym-plp-sidebar" class="ym-plp__sidebar" :class="{ 'ym-plp__sidebar--open': showFilter }" aria-label="Bộ lọc sản phẩm">
        <!-- Categories -->
        <div class="ym-plp__filter-group">
          <h2 class="ym-plp__filter-title">DANH MỤC</h2>
          <ul class="ym-plp__cat-list" role="list">
            <li
              v-for="cat in sidebarCategories"
              :key="cat.id"
              class="ym-plp__cat-item"
              :class="{ 'ym-plp__cat-item--active': cat.link.includes(selectedCategory) && selectedCategory }"
            >
              <button
                type="button"
                class="ym-plp__cat-btn"
                :aria-current="cat.link.includes(selectedCategory) && selectedCategory ? 'true' : undefined"
                @click="selectCategory(cat.link)"
              >
                {{ cat.name }}
                <i class="ri-arrow-right-s-line" aria-hidden="true"></i>
              </button>
            </li>
          </ul>
        </div>

        <!-- Price Range -->
        <fieldset class="ym-plp__filter-group">
          <legend class="ym-plp__filter-title">KHOẢNG GIÁ</legend>
          <div class="ym-plp__price-inputs">
            <label for="ym-plp-price-from" class="visually-hidden">Giá từ</label>
            <input id="ym-plp-price-from" v-model.number="priceFrom" type="number" min="0" inputmode="numeric" placeholder="₫ TỪ" />
            <span aria-hidden="true">-</span>
            <label for="ym-plp-price-to" class="visually-hidden">Giá đến</label>
            <input id="ym-plp-price-to" v-model.number="priceTo" type="number" min="0" inputmode="numeric" placeholder="₫ ĐẾN" />
          </div>
          <button type="button" class="ym-plp__price-btn" @click="applyPrice">Áp dụng</button>
        </fieldset>

        <!-- Brands -->
        <fieldset class="ym-plp__filter-group">
          <legend class="ym-plp__filter-title">THƯƠNG HIỆU</legend>
          <ul class="ym-plp__brand-list" role="list">
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
        </fieldset>

        <!-- Clear filters -->
        <button
          v-if="selectedCategory || selectedBrands.length || priceFrom || priceTo"
          type="button"
          class="ym-plp__clear-btn"
          @click="clearFilters"
        >
          <i class="ri-close-line" aria-hidden="true"></i> Xóa bộ lọc
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
          <div class="ym-plp__sort-tabs" role="group" aria-label="Sắp xếp sản phẩm">
            <button type="button" :class="{ active: sortBy === 'newest' }" :aria-pressed="sortBy === 'newest'" @click="sortBy = 'newest'">Mới nhất</button>
            <button type="button" :class="{ active: sortBy === 'bestseller' }" :aria-pressed="sortBy === 'bestseller'" @click="sortBy = 'bestseller'">Bán chạy</button>
            <button type="button" :class="{ active: sortBy === 'price-asc' }" :aria-pressed="sortBy === 'price-asc'" @click="sortBy = 'price-asc'">Giá thấp đến cao</button>
            <button type="button" :class="{ active: sortBy === 'price-desc' }" :aria-pressed="sortBy === 'price-desc'" @click="sortBy = 'price-desc'">Giá cao đến thấp</button>
          </div>
          <div class="ym-plp__sort-display" aria-live="polite">
            Hiển thị {{ filteredProducts.length }} / {{ totalFiltered }}
          </div>
        </div>

        <!-- Product grid -->
        <div class="ym-plp__grid" role="list">
          <RouterLink
            v-for="product in filteredProducts"
            :key="product.id"
            :to="`/products/${product.id}`"
            class="ym-plp__product"
            role="listitem"
            :aria-label="product.name"
          >
            <div class="ym-plp__product-img-wrap">
              <span v-if="product.discount" class="ym-plp__product-badge" :aria-label="`Giảm ${product.discount}%`">-{{ product.discount }}%</span>
              <img
                :src="product.image"
                :alt="product.name || ''"
                loading="lazy"
                decoding="async"
                class="ym-plp__product-img"
              />
            </div>
            <div class="ym-plp__product-info">
              <span class="ym-plp__product-brand">{{ product.brand }}</span>
              <h3 class="ym-plp__product-name">{{ product.name }}</h3>
              <div class="ym-plp__product-prices">
                <span v-if="product.originalPrice !== product.salePrice" class="ym-plp__product-original" :aria-label="`Giá gốc ${formatPrice(product.originalPrice)}`">{{ formatPrice(product.originalPrice) }}</span>
                <span class="ym-plp__product-sale" :aria-label="`Giá bán ${formatPrice(product.salePrice)}`">{{ formatPrice(product.salePrice) }}</span>
              </div>
            </div>
          </RouterLink>
        </div>

        <!-- Empty state -->
        <div v-if="filteredProducts.length === 0" class="ym-plp__empty" role="status">
          <i class="ri-search-line" aria-hidden="true"></i>
          <p>Không tìm thấy sản phẩm phù hợp</p>
          <button type="button" class="ym-plp__clear-btn" @click="clearFilters">Xóa bộ lọc</button>
        </div>

        <!-- Pagination -->
        <nav v-if="totalPages > 1" class="ym-plp__pagination" aria-label="Phân trang">
          <button
            type="button"
            class="ym-plp__page-btn"
            aria-label="Trang trước"
            :disabled="currentPage === 1"
            @click="goToPage(currentPage - 1)"
          >
            <i class="ri-arrow-left-s-line" aria-hidden="true"></i>
          </button>
          <button
            v-for="page in totalPages"
            :key="page"
            type="button"
            class="ym-plp__page-btn"
            :class="{ 'ym-plp__page-btn--active': page === currentPage }"
            :aria-label="`Trang ${page}`"
            :aria-current="page === currentPage ? 'page' : undefined"
            @click="goToPage(page)"
          >
            {{ page }}
          </button>
          <button
            type="button"
            class="ym-plp__page-btn"
            aria-label="Trang sau"
            :disabled="currentPage === totalPages"
            @click="goToPage(currentPage + 1)"
          >
            <i class="ri-arrow-right-s-line" aria-hidden="true"></i>
          </button>
        </nav>
      </main>
    </div>
  </div>
</template>
