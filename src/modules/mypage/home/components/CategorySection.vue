<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import type { CategorySectionData } from '../configs'
import ProductCard from './ProductCard.vue'

const props = defineProps<{
  section: CategorySectionData
}>()

const VISIBLE_COUNT = 5 // số subtab hiển thị tối đa, phần còn lại nằm trong dropdown
const PER_PAGE = 12 // SP/trang trên grid section trang chủ
// activeTab: '__all__' = tất cả, hoặc tên subtab cụ thể
const activeTab = ref<string>('__all__')
const moreOpen = ref(false)
const moreRef = ref<HTMLDivElement | null>(null)
const page = ref(1)

const visibleSubTabs = computed(() => (props.section.subTabs || []).slice(0, VISIBLE_COUNT))
const overflowSubTabs = computed(() => (props.section.subTabs || []).slice(VISIBLE_COUNT))

function selectTab(name: string) {
  activeTab.value = name
  moreOpen.value = false
}

function isOverflowActive(): boolean {
  return overflowSubTabs.value.includes(activeTab.value)
}

// Match SP với subtab: tìm tên subtab trong category path "A>>B>>C" (segment) hoặc
// fallback chứa substring (case-insensitive).
function productMatchesSubtab(product: any, subTabName: string): boolean {
  const cat = String(product.category || '').trim()
  if (!cat) return false
  const segments = cat.split(/\s*>>\s*|\s*\/\s*|\s*->\s*/)
  const tabLower = subTabName.toLowerCase()
  if (segments.some((s) => s.toLowerCase() === tabLower)) return true
  return cat.toLowerCase().includes(tabLower)
}

const filteredProducts = computed(() => {
  if (activeTab.value === '__all__') return props.section.products
  return (props.section.products || []).filter((p: any) => productMatchesSubtab(p, activeTab.value))
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredProducts.value.length / PER_PAGE)))
const paginatedProducts = computed(() =>
  filteredProducts.value.slice((page.value - 1) * PER_PAGE, page.value * PER_PAGE),
)
// Reset về trang 1 khi đổi subtab
watch(activeTab, () => { page.value = 1 })

// Tạo dãy trang hiển thị: 1 ... (current-1) current (current+1) ... last
const visiblePages = computed<(number | '…')[]>(() => {
  const total = totalPages.value
  const cur = page.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | '…')[] = [1]
  if (cur > 3) pages.push('…')
  for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) pages.push(i)
  if (cur < total - 2) pages.push('…')
  pages.push(total)
  return pages
})

function goPage(p: number) {
  if (p < 1 || p > totalPages.value || p === page.value) return
  page.value = p
}

// Đóng dropdown khi click ngoài
function onDocClick(e: MouseEvent) {
  if (!moreOpen.value) return
  if (moreRef.value && !moreRef.value.contains(e.target as Node)) {
    moreOpen.value = false
  }
}
onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))
</script>

<template>
  <section class="ym-cat-section">
    <div class="container">
      <!-- Header -->
      <div class="ym-cat-section__header" :style="{ borderBottomColor: section.color }">
        <h2 class="ym-cat-section__title" :style="{ color: section.color }">{{ section.title }}</h2>
        <div class="ym-cat-section__tabs" role="tablist" :aria-label="`Lọc ${section.title}`">
          <!-- Tab "Tất cả" mặc định -->
          <button
            type="button"
            role="tab"
            :aria-selected="activeTab === '__all__'"
            class="ym-cat-section__tab"
            :class="{ 'ym-cat-section__tab--active': activeTab === '__all__' }"
            :style="activeTab === '__all__' ? { color: section.color, borderBottomColor: section.color } : {}"
            @click="selectTab('__all__')"
          >
            Tất cả
          </button>
          <!-- Subtabs hiển thị trong nhóm 5 đầu tiên -->
          <button
            v-for="(tab, idx) in visibleSubTabs"
            :key="idx"
            type="button"
            role="tab"
            :aria-selected="activeTab === tab"
            class="ym-cat-section__tab"
            :class="{ 'ym-cat-section__tab--active': activeTab === tab }"
            :style="activeTab === tab ? { color: section.color, borderBottomColor: section.color } : {}"
            @click="selectTab(tab)"
          >
            {{ tab }}
          </button>
          <!-- Xem thêm: chỉ hiện khi có subtab tràn -->
          <div v-if="overflowSubTabs.length" ref="moreRef" class="ym-cat-section__more">
            <button
              type="button"
              class="ym-cat-section__tab-more"
              :class="{ 'ym-cat-section__tab--active': isOverflowActive() }"
              :style="isOverflowActive() ? { color: section.color, borderBottomColor: section.color } : { color: section.color }"
              @click="moreOpen = !moreOpen"
              :aria-expanded="moreOpen"
              :aria-haspopup="true"
            >
              + Xem thêm <i class="ri-arrow-down-s-line" :style="{ transform: moreOpen ? 'rotate(180deg)' : '' }"></i>
            </button>
            <div v-if="moreOpen" class="ym-cat-section__more-menu" role="menu">
              <button
                v-for="tab in overflowSubTabs"
                :key="tab"
                type="button"
                role="menuitem"
                class="ym-cat-section__more-item"
                :class="{ 'is-active': activeTab === tab }"
                :style="activeTab === tab ? { color: section.color } : {}"
                @click="selectTab(tab)"
              >
                {{ tab }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="ym-cat-section__body">
        <!-- Promo image column -->
        <div v-if="section.promoImage" class="ym-cat-section__promo">
          <RouterLink to="/products" class="ym-cat-section__promo-link" :aria-label="`Xem ${section.title}`">
            <img :src="section.promoImage" :alt="section.title || ''" loading="lazy" decoding="async" />
          </RouterLink>
          <div class="ym-cat-section__tags" role="list">
            <span v-for="tag in section.tags" :key="tag" class="ym-cat-section__tag" role="listitem">{{ tag }}</span>
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
              <img :src="banner.image" :alt="banner.title || ''" loading="lazy" decoding="async" class="ym-cat-section__banner-img" />
              <div class="ym-cat-section__banner-overlay">
                <strong>{{ banner.title }}</strong>
                <span>{{ banner.subtitle }}</span>
                <RouterLink :to="banner.link" class="ym-cat-section__banner-link" :style="{ color: section.color }" :aria-label="`Mua ngay ${banner.title}`">
                  Mua ngay <i class="ri-arrow-right-line" aria-hidden="true"></i>
                </RouterLink>
              </div>
            </div>
          </div>

          <!-- Products -->
          <div class="ym-cat-section__products">
            <div class="ym-cat-section__products-header">
              <span class="ym-cat-section__products-label" :style="{ color: section.color }">
                <i class="ri-star-fill" aria-hidden="true"></i>
                <span v-if="activeTab === '__all__'">Nổi bật và bán chạy</span>
                <span v-else>{{ activeTab }} ({{ filteredProducts.length }} SP)</span>
              </span>
              <RouterLink :to="`/products?cat=${encodeURIComponent(activeTab === '__all__' ? section.title : activeTab)}`" class="ym-cat-section__products-more" :style="{ background: section.color }" :aria-label="`Xem thêm sản phẩm ${section.title}`">
                + Xem thêm <i class="ri-arrow-right-s-line" aria-hidden="true"></i>
              </RouterLink>
            </div>
            <div v-if="filteredProducts.length" class="ym-cat-section__products-grid" role="list">
              <ProductCard
                v-for="product in paginatedProducts"
                :key="product.id"
                :product="product"
                role="listitem"
              />
            </div>
            <div v-else class="ym-cat-section__products-empty">
              Chưa có sản phẩm trong danh mục "{{ activeTab }}".
            </div>

            <nav v-if="totalPages > 1" class="ym-cat-pager" aria-label="Phân trang sản phẩm">
              <button type="button" class="ym-cat-pager__btn" :disabled="page === 1" @click="goPage(page - 1)" aria-label="Trang trước">
                <i class="ri-arrow-left-s-line"></i>
              </button>
              <button
                v-for="(p, idx) in visiblePages"
                :key="idx"
                type="button"
                :class="['ym-cat-pager__btn', { 'is-active': p === page, 'is-ellipsis': p === '…' }]"
                :disabled="p === '…'"
                :style="p === page ? { background: section.color, borderColor: section.color, color: '#fff' } : {}"
                @click="typeof p === 'number' && goPage(p)"
              >
                {{ p }}
              </button>
              <button type="button" class="ym-cat-pager__btn" :disabled="page === totalPages" @click="goPage(page + 1)" aria-label="Trang sau">
                <i class="ri-arrow-right-s-line"></i>
              </button>
              <span class="ym-cat-pager__info">
                {{ (page - 1) * PER_PAGE + 1 }}–{{ Math.min(page * PER_PAGE, filteredProducts.length) }} / {{ filteredProducts.length }}
              </span>
            </nav>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.ym-cat-section__more { position: relative; display: inline-block; }
.ym-cat-section__tab-more {
  background: none; border: none; padding: 8px 12px; cursor: pointer;
  font-size: 14px; font-weight: 500; border-bottom: 2px solid transparent;
  display: inline-flex; align-items: center; gap: 4px;
}
.ym-cat-section__tab-more i { transition: transform 0.15s; }
.ym-cat-section__more-menu {
  position: absolute; top: calc(100% + 4px); right: 0;
  min-width: 220px; max-height: 360px; overflow-y: auto;
  background: #fff; border: 1px solid #e5e7eb; border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  padding: 6px; z-index: 50;
}
.ym-cat-section__more-item {
  display: block; width: 100%; padding: 8px 12px; text-align: left;
  background: none; border: none; cursor: pointer; border-radius: 4px;
  font-size: 14px; color: #374151; transition: background 0.1s;
}
.ym-cat-section__more-item:hover { background: #f3f4f6; }
.ym-cat-section__more-item.is-active { font-weight: 600; background: #f9fafb; }
.ym-cat-section__products-empty {
  padding: 32px 16px; text-align: center; color: #9ca3af; font-size: 14px;
  background: #f9fafb; border-radius: 8px;
}
.ym-cat-pager {
  display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
  margin-top: 16px; padding: 8px 0;
}
.ym-cat-pager__btn {
  min-width: 36px; height: 36px; padding: 0 10px;
  background: #fff; border: 1px solid #e5e7eb; border-radius: 6px;
  font-size: 14px; color: #374151; cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}
.ym-cat-pager__btn:hover:not(:disabled):not(.is-ellipsis) {
  background: #f3f4f6; border-color: #d1d5db;
}
.ym-cat-pager__btn.is-active { font-weight: 600; }
.ym-cat-pager__btn.is-ellipsis { border: none; cursor: default; background: transparent; }
.ym-cat-pager__btn:disabled { opacity: 0.5; cursor: not-allowed; }
.ym-cat-pager__info { margin-left: auto; font-size: 13px; color: #6b7280; }
@media (max-width: 600px) {
  .ym-cat-pager__info { width: 100%; margin-left: 0; text-align: center; }
}
</style>
