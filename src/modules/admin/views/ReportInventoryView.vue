<script setup lang="ts">
import { computed } from 'vue'
import { formatPrice } from '@/modules/mypage/home/configs'
import { useAdminDataStore } from '../stores/adminData'
import ShopImportExport from '../components/ShopImportExport.vue'

const store = useAdminDataStore()

const stats = computed(() => ({
  sku: store.products.length,
  totalStock: store.products.reduce((s, p) => s + p.stock, 0),
  totalValue: store.totalStockValue,
  outOfStock: store.outOfStock.length,
  lowStock: store.lowStock.length,
  averageDays: 18,
}))

const byCategory = computed(() => {
  const map: Record<string, { qty: number; value: number; count: number }> = {}
  for (const p of store.products) {
    if (!map[p.category]) map[p.category] = { qty: 0, value: 0, count: 0 }
    map[p.category].qty += p.stock
    map[p.category].value += p.stock * p.cost
    map[p.category].count += 1
  }
  return Object.entries(map).map(([cat, d]) => ({ category: cat, ...d })).sort((a, b) => b.value - a.value).slice(0, 8)
})
const maxValue = computed(() => Math.max(1, ...byCategory.value.map((c) => c.value)))

const lowStockItems = computed(() => store.lowStock.slice(0, 10))
const outOfStockItems = computed(() => store.outOfStock.slice(0, 10))
</script>

<template>
  <div class="ym-page">
    <header class="ym-page__header">
      <div><h1>Báo cáo tồn kho</h1><p>Phân tích tồn kho theo danh mục, cảnh báo sắp hết</p></div>
      <div class="ym-page__actions"><ShopImportExport entity="inventory-history" label="lịch sử tồn kho" /></div>
    </header>

    <section class="ym-mini-stats">
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Số SKU</p><p class="ym-mini-stat__value">{{ stats.sku }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Tổng tồn</p><p class="ym-mini-stat__value">{{ stats.totalStock.toLocaleString('vi-VN') }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Giá trị tồn</p><p class="ym-mini-stat__value" style="color: #326e51">{{ formatPrice(stats.totalValue) }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Sắp hết</p><p class="ym-mini-stat__value" style="color: #92400e">{{ stats.lowStock }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Hết hàng</p><p class="ym-mini-stat__value" style="color: #d0021b">{{ stats.outOfStock }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Số ngày tồn TB</p><p class="ym-mini-stat__value">{{ stats.averageDays }}</p></article>
    </section>

    <div class="ym-grid">
      <section class="ym-card ym-card--span">
        <div class="ym-card__header"><h2>Giá trị tồn theo danh mục</h2></div>
        <div class="ym-card__body">
          <div v-for="c in byCategory" :key="c.category" class="ym-cat-row">
            <span class="ym-cat-name">{{ c.category }}</span>
            <span class="ym-cat-meta">{{ c.count }} SP · {{ c.qty }} đv</span>
            <div class="ym-cat-bar"><div class="ym-cat-bar-fill" :style="{ width: `${(c.value / maxValue) * 100}%` }"></div></div>
            <strong class="ym-cat-value">{{ formatPrice(c.value) }}</strong>
          </div>
        </div>
      </section>

      <section class="ym-card">
        <div class="ym-card__header"><h2 style="color: #d0021b">Hết hàng ({{ outOfStockItems.length }})</h2></div>
        <ul class="ym-alert-list">
          <li v-for="p in outOfStockItems" :key="p.id" class="ym-alert-item">
            <img :src="p.image" :alt="p.name" />
            <div>
              <strong>{{ p.name }}</strong>
              <small>{{ p.sku }}</small>
            </div>
            <span class="ym-tag ym-tag--danger">0 đv</span>
          </li>
          <li v-if="!outOfStockItems.length" style="padding: 24px; text-align: center; color: #9ca3af; font-size: 13px">Không có sản phẩm nào hết hàng. ✨</li>
        </ul>
      </section>

      <section class="ym-card">
        <div class="ym-card__header"><h2 style="color: #92400e">Sắp hết ({{ lowStockItems.length }})</h2></div>
        <ul class="ym-alert-list">
          <li v-for="p in lowStockItems" :key="p.id" class="ym-alert-item">
            <img :src="p.image" :alt="p.name" />
            <div>
              <strong>{{ p.name }}</strong>
              <small>{{ p.sku }} · Định mức {{ p.threshold }}</small>
            </div>
            <span class="ym-tag ym-tag--warning">{{ p.stock }} đv</span>
          </li>
          <li v-if="!lowStockItems.length" style="padding: 24px; text-align: center; color: #9ca3af; font-size: 13px">Tất cả sản phẩm đủ hàng. 👍</li>
        </ul>
      </section>
    </div>
  </div>
</template>

<style scoped src="./_admin-shared.css"></style>
<style scoped>
.ym-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.ym-card--span { grid-column: 1 / -1; }
.ym-card__header { padding: 14px 18px; border-bottom: 1px solid #f1f3f5; }
.ym-card__header h2 { margin: 0; font-size: 15px; font-weight: 600; }
.ym-card__body { padding: 16px; }

.ym-cat-row { display: grid; grid-template-columns: 200px 130px 1fr 140px; gap: 12px; align-items: center; padding: 8px 0; }
.ym-cat-name { font-weight: 500; color: #111827; font-size: 14px; }
.ym-cat-meta { font-size: 12px; color: #6b7280; }
.ym-cat-bar { height: 10px; background: #f3f4f6; border-radius: 5px; overflow: hidden; }
.ym-cat-bar-fill { height: 100%; background: linear-gradient(90deg, #44a273 0%, #326e51 100%); transition: width 0.4s; }
.ym-cat-value { text-align: right; color: #326e51; font-size: 14px; }

.ym-alert-list { list-style: none; margin: 0; padding: 0; max-height: 400px; overflow-y: auto; }
.ym-alert-item { display: flex; align-items: center; gap: 10px; padding: 10px 18px; border-bottom: 1px solid #f1f3f5; }
.ym-alert-item:last-child { border-bottom: none; }
.ym-alert-item img { width: 36px; height: 36px; object-fit: contain; padding: 2px; background: #fafbfc; border: 1px solid #f1f3f5; border-radius: 6px; }
.ym-alert-item div { flex: 1; min-width: 0; }
.ym-alert-item strong { display: block; font-size: 13px; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ym-alert-item small { font-size: 11px; color: #6b7280; }

@media (max-width: 1024px) { .ym-grid { grid-template-columns: 1fr; } }
</style>
