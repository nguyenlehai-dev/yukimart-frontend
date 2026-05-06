<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { formatPrice, type Product } from '@/modules/mypage/home/configs'
import { useAdminDataStore } from '@/modules/admin/stores/adminData'

const route = useRoute()
const router = useRouter()
const store = useAdminDataStore()

const categoryMenuItems = computed(() => store.customerMenu)
const allProducts = computed<Product[]>(() => store.publicProducts as unknown as Product[])

// Sidebar categories từ admin menu — đảm bảo đồng bộ với cấu hình hiển thị/active.
const sidebarCategories = computed(() =>
  categoryMenuItems.value.map((c) => ({ id: c.id, name: c.name, link: c.link })),
)

const allBrands = computed(() => {
  if (store.publicBrandFacets.length) return store.publicBrandFacets.map((item) => item.brand)
  return Array.from(new Set(allProducts.value.map((p) => p.brand))).filter(Boolean).sort()
})

// ── Filter state ──
// `selectedCategorySlug` đồng bộ với URL (?cat=slug) cho phép share/bookmark.
// `selectedCategoryName` là tên Tiếng Việt thật, dùng để query BE — BE so sánh
// bằng ILIKE trên column `category` chứa text "Hỗ Trợ Sức Khỏe>>...".
const selectedCategorySlug = ref<string>('')
const selectedCategoryName = ref<string>('')
const selectedBrands = ref<string[]>([])
const priceFrom = ref<number | null>(null)
const priceTo = ref<number | null>(null)
const sortBy = ref<'newest' | 'bestseller' | 'price-asc' | 'price-desc'>('newest')
const currentPage = ref(1)
const perPage = 20
const loadingProducts = ref(false)

// Map sort key của UI sang định dạng BE chấp nhận. BE chỉ hỗ trợ `price:asc/desc`,
// `name:asc/desc`, `created_at:asc/desc` (default = orderByDesc id = "mới nhất").
// `bestseller` BE chưa có → tạm fallback theo "mới nhất".
function mapSort(key: typeof sortBy.value): string | undefined {
  switch (key) {
    case 'price-asc': return 'price:asc'
    case 'price-desc': return 'price:desc'
    case 'newest':
    case 'bestseller':
    default: return undefined
  }
}

function findCategoryNameBySlug(slug: string): string {
  if (!slug) return ''
  // 1. Lookup từ customerMenu (root categories có slug + name).
  const fromMenu = categoryMenuItems.value.find((c) => c.link.includes(`cat=${slug}`))
  if (fromMenu) return fromMenu.name
  // 2. Fallback: tìm trong toàn bộ categories đã load.
  const fromAll = store.categories.find((c) => c.slug === slug)
  return fromAll?.name || ''
}

// ── Title ──
const pageTitle = computed(() => {
  const q = route.query
  if (q.deal === 'hot') return 'Deal Hấp Dẫn'
  if (q.cat) {
    return selectedCategoryName.value || (typeof q.cat === 'string' ? q.cat : 'Sản Phẩm')
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

// Tạo dãy số trang compact: luôn có 1, totalPages, và 1-2 trang quanh current.
// Chèn '...' giữa các đoạn không liền nhau. Tránh render hàng trăm nút khi
// totalPages lớn (vd 100+ trang).
type PageItem = number | '...'
const pageItems = computed<PageItem[]>(() => {
  const total = totalPages.value
  const cur = currentPage.value
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  const items: PageItem[] = [1]
  const start = Math.max(2, cur - 1)
  const end = Math.min(total - 1, cur + 1)
  if (start > 2) items.push('...')
  for (let p = start; p <= end; p++) items.push(p)
  if (end < total - 1) items.push('...')
  items.push(total)
  return items
})

async function fetchServerProducts() {
  loadingProducts.value = true
  try {
    await store.fetchPublicProducts({
      page: currentPage.value,
      per_page: perPage,
      // Gửi tên Tiếng Việt khi đã resolve được, fallback gửi slug — BE sẽ ILIKE.
      category: selectedCategoryName.value || selectedCategorySlug.value || undefined,
      brand: selectedBrands.value.length ? selectedBrands.value.join(',') : undefined,
      min_price: priceFrom.value ?? undefined,
      max_price: priceTo.value ?? undefined,
      sort: mapSort(sortBy.value),
      deal: route.query.deal === 'hot' ? 'hot' : undefined,
    })
  } finally {
    loadingProducts.value = false
  }
}

// Đẩy filter lên URL để F5/share/back-forward giữ nguyên trạng thái.
function syncFiltersToRoute() {
  const query: Record<string, string> = {}
  if (selectedCategorySlug.value) query.cat = selectedCategorySlug.value
  if (selectedBrands.value.length) query.brand = selectedBrands.value.join(',')
  if (priceFrom.value != null) query.min_price = String(priceFrom.value)
  if (priceTo.value != null) query.max_price = String(priceTo.value)
  if (sortBy.value !== 'newest') query.sort = sortBy.value
  if (route.query.deal === 'hot') query.deal = 'hot'
  router.replace({ path: '/products', query })
}

function syncFiltersFromRoute() {
  const cat = route.query.cat
  selectedCategorySlug.value = typeof cat === 'string' ? cat : ''
  selectedCategoryName.value = findCategoryNameBySlug(selectedCategorySlug.value)

  const brand = route.query.brand
  selectedBrands.value = typeof brand === 'string' && brand.trim()
    ? brand.split(',').map((s) => s.trim()).filter(Boolean)
    : []

  const min = route.query.min_price
  const max = route.query.max_price
  priceFrom.value = typeof min === 'string' && min !== '' ? Number(min) : null
  priceTo.value = typeof max === 'string' && max !== '' ? Number(max) : null

  const sort = route.query.sort
  sortBy.value = (typeof sort === 'string' && ['newest', 'bestseller', 'price-asc', 'price-desc'].includes(sort)
    ? sort
    : 'newest') as typeof sortBy.value
}

function toggleBrand(brand: string) {
  const idx = selectedBrands.value.indexOf(brand)
  if (idx >= 0) selectedBrands.value.splice(idx, 1)
  else selectedBrands.value.push(brand)
  currentPage.value = 1
  syncFiltersToRoute()
}

function applyPrice() {
  currentPage.value = 1
  syncFiltersToRoute()
  fetchServerProducts()
}

function selectCategory(cat: { id: number; name: string; link: string }) {
  const params = new URLSearchParams(cat.link.split('?')[1] || '')
  const slug = params.get('cat') || ''
  // Toggle: click lại danh mục đang chọn để bỏ filter.
  if (slug && slug === selectedCategorySlug.value) {
    selectedCategorySlug.value = ''
    selectedCategoryName.value = ''
  } else {
    selectedCategorySlug.value = slug
    selectedCategoryName.value = cat.name
  }
  currentPage.value = 1
  syncFiltersToRoute()
}

function setSort(key: typeof sortBy.value) {
  sortBy.value = key
  currentPage.value = 1
  syncFiltersToRoute()
}

function clearFilters() {
  selectedCategorySlug.value = ''
  selectedCategoryName.value = ''
  selectedBrands.value = []
  priceFrom.value = null
  priceTo.value = null
  sortBy.value = 'newest'
  currentPage.value = 1
  syncFiltersToRoute()
}

function brandKey(brand: string) {
  return brand.trim().toLowerCase()
}

function brandCount(brand: string) {
  return store.publicBrandFacets.find((item) => item.brand === brand)?.count
    || allProducts.value.filter((p) => brandKey(p.brand) === brandKey(brand)).length
}

// Mobile filter toggle
const showFilter = ref(false)
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && showFilter.value) showFilter.value = false
}

// Khi store đã load catalog, slug → name có thể resolve được muộn → re-fetch.
watch(() => store.customerMenu.length, () => {
  if (selectedCategorySlug.value && !selectedCategoryName.value) {
    selectedCategoryName.value = findCategoryNameBySlug(selectedCategorySlug.value)
    fetchServerProducts()
  }
})

watch(() => route.query, () => {
  syncFiltersFromRoute()
  currentPage.value = 1
  fetchServerProducts()
}, { deep: true })

watch(currentPage, fetchServerProducts)

onMounted(async () => {
  document.addEventListener('keydown', onKeydown)
  // Đảm bảo customerMenu/categories đã load để resolve slug → name. fetchCatalogData
  // dùng cache nội bộ nên gọi an toàn không tốn request thừa.
  await store.fetchCatalogData().catch(() => {})
  syncFiltersFromRoute()
  fetchServerProducts()
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
.ym-plp__loading {
  padding: 40px 20px;
  text-align: center;
  color: #6b7280;
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
              :class="{ 'ym-plp__cat-item--active': selectedCategorySlug && cat.link.includes(`cat=${selectedCategorySlug}`) }"
            >
              <button
                type="button"
                class="ym-plp__cat-btn"
                :aria-current="selectedCategorySlug && cat.link.includes(`cat=${selectedCategorySlug}`) ? 'true' : undefined"
                @click="selectCategory(cat)"
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
          v-if="selectedCategorySlug || selectedBrands.length || priceFrom || priceTo || sortBy !== 'newest'"
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
            <button type="button" :class="{ active: sortBy === 'newest' }" :aria-pressed="sortBy === 'newest'" @click="setSort('newest')">Mới nhất</button>
            <button type="button" :class="{ active: sortBy === 'bestseller' }" :aria-pressed="sortBy === 'bestseller'" @click="setSort('bestseller')">Bán chạy</button>
            <button type="button" :class="{ active: sortBy === 'price-asc' }" :aria-pressed="sortBy === 'price-asc'" @click="setSort('price-asc')">Giá thấp đến cao</button>
            <button type="button" :class="{ active: sortBy === 'price-desc' }" :aria-pressed="sortBy === 'price-desc'" @click="setSort('price-desc')">Giá cao đến thấp</button>
          </div>
          <div class="ym-plp__sort-display" aria-live="polite">
            Hiển thị {{ filteredProducts.length }} / {{ totalFiltered }}
          </div>
        </div>

        <!-- Loading skeleton state -->
        <div v-if="loadingProducts && filteredProducts.length === 0" class="ym-plp__loading" role="status">
          <p>Đang tải sản phẩm...</p>
        </div>

        <!-- Product grid -->
        <div v-else-if="filteredProducts.length" class="ym-plp__grid" role="list">
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

        <!-- Empty state khi đã load xong nhưng không có sản phẩm. -->
        <div v-else class="ym-plp__empty" role="status">
          <i class="ri-search-line" aria-hidden="true"></i>
          <p>Không tìm thấy sản phẩm phù hợp</p>
          <button type="button" class="ym-plp__clear-btn" @click="clearFilters">Xóa bộ lọc</button>
        </div>

        <!-- Pagination -->
        <nav v-if="totalPages > 1" class="ym-plp__pagination" aria-label="Phân trang">
          <button
            type="button"
            class="ym-plp__page-btn ym-plp__page-btn--nav"
            aria-label="Trang trước"
            :disabled="currentPage === 1"
            @click="goToPage(currentPage - 1)"
          >
            <i class="ri-arrow-left-s-line" aria-hidden="true"></i>
          </button>

          <template v-for="(item, idx) in pageItems" :key="idx">
            <span v-if="item === '...'" class="ym-plp__page-ellipsis" aria-hidden="true">…</span>
            <button
              v-else
              type="button"
              class="ym-plp__page-btn"
              :class="{ 'ym-plp__page-btn--active': item === currentPage }"
              :aria-label="`Trang ${item}`"
              :aria-current="item === currentPage ? 'page' : undefined"
              @click="goToPage(item)"
            >
              {{ item }}
            </button>
          </template>

          <button
            type="button"
            class="ym-plp__page-btn ym-plp__page-btn--nav"
            aria-label="Trang sau"
            :disabled="currentPage === totalPages"
            @click="goToPage(currentPage + 1)"
          >
            <i class="ri-arrow-right-s-line" aria-hidden="true"></i>
          </button>

          <span class="ym-plp__page-info">
            Trang <strong>{{ currentPage }}</strong> / {{ totalPages }}
          </span>
        </nav>
      </main>
    </div>
  </div>
</template>
