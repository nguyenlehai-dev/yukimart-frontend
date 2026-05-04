<script setup lang="ts">
import { ref, computed } from 'vue'
import { formatPrice } from '@/modules/mypage/home/configs'
import { useAdminDataStore } from '../stores/adminData'
import ShopImportExport from '../components/ShopImportExport.vue'

const store = useAdminDataStore()
const period = ref<'7d' | '30d' | 'mtd' | 'ytd'>('30d')

const revenueData = computed(() => {
  const days = period.value === '7d' ? 7 : period.value === '30d' ? 30 : period.value === 'mtd' ? 4 : 5
  return Array.from({ length: days }, (_, i) => ({
    label: period.value === 'ytd' ? ['T1', 'T2', 'T3', 'T4', 'T5'][i] : `${i + 1}/5`,
    revenue: 5_000_000 + Math.floor(Math.random() * 25_000_000),
  }))
})
const maxRevenue = computed(() => Math.max(...revenueData.value.map((d) => d.revenue)))

const summary = computed(() => {
  const total = revenueData.value.reduce((s, d) => s + d.revenue, 0)
  return {
    revenue: total,
    orders: 128 + (period.value === 'ytd' ? 1280 : 0),
    avgOrder: Math.round(total / 128),
    refund: Math.round(total * 0.04),
  }
})

const topProducts = computed(() => [...store.products]
  .filter((p) => p.status === 'active')
  .slice(0, 5)
  .map((p, idx) => ({
    name: p.name,
    image: p.image,
    sold: 50 + idx * 18,
    revenue: p.salePrice * (50 + idx * 18),
  })))

const channels = ref([
  { name: 'Website', icon: 'ri-global-line', orders: 86, revenue: 124_000_000, color: '#326e51' },
  { name: 'Tại cửa hàng (POS)', icon: 'ri-store-2-line', orders: 32, revenue: 65_000_000, color: '#2563eb' },
  { name: 'Shopee', icon: 'ri-shopping-bag-line', orders: 18, revenue: 38_000_000, color: '#ee4d2d' },
  { name: 'Facebook', icon: 'ri-facebook-circle-line', orders: 12, revenue: 22_500_000, color: '#1877f2' },
])
</script>

<template>
  <div class="ym-page">
    <header class="ym-page__header">
      <div><h1>Báo cáo bán hàng</h1><p>Doanh thu, đơn hàng và sản phẩm bán chạy</p></div>
      <div class="ym-page__actions">
        <div class="ym-tabs" style="border: none">
          <button v-for="p in [{ k: '7d', l: '7 ngày' }, { k: '30d', l: '30 ngày' }, { k: 'mtd', l: 'Tháng này' }, { k: 'ytd', l: 'Năm nay' }]" :key="p.k" type="button" :class="['ym-tabs__item', { 'is-active': period === p.k }]" @click="period = p.k as typeof period">{{ p.l }}</button>
        </div>
        <ShopImportExport entity="reports-sales" label="báo cáo bán hàng" />
      </div>
    </header>

    <section class="ym-mini-stats">
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Doanh thu</p><p class="ym-mini-stat__value" style="color: #326e51">{{ formatPrice(summary.revenue) }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Số đơn</p><p class="ym-mini-stat__value">{{ summary.orders }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Giá trị TB / đơn</p><p class="ym-mini-stat__value">{{ formatPrice(summary.avgOrder) }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Hoàn trả</p><p class="ym-mini-stat__value" style="color: #d0021b">{{ formatPrice(summary.refund) }}</p></article>
    </section>

    <div class="ym-grid">
      <section class="ym-card ym-card--span">
        <div class="ym-card__header"><h2>Doanh thu theo thời gian</h2></div>
        <div class="ym-card__body">
          <div class="ym-chart">
            <div v-for="(d, idx) in revenueData" :key="idx" class="ym-chart__bar">
              <div class="ym-chart__bar-fill" :style="{ height: `${(d.revenue / maxRevenue) * 100}%` }">
                <span class="ym-chart__value">{{ Math.round(d.revenue / 1_000_000) }}M</span>
              </div>
              <span class="ym-chart__label">{{ d.label }}</span>
            </div>
          </div>
        </div>
      </section>

      <section class="ym-card">
        <div class="ym-card__header"><h2>Top sản phẩm bán chạy</h2></div>
        <ul class="ym-top-list">
          <li v-for="(p, idx) in topProducts" :key="idx" class="ym-top-item">
            <span class="ym-top-rank">{{ idx + 1 }}</span>
            <img :src="p.image" :alt="p.name" />
            <div>
              <strong>{{ p.name }}</strong>
              <small>Bán {{ p.sold }} · <span style="color: #326e51">{{ formatPrice(p.revenue) }}</span></small>
            </div>
          </li>
        </ul>
      </section>

      <section class="ym-card ym-card--span">
        <div class="ym-card__header"><h2>Doanh thu theo kênh bán</h2></div>
        <div class="ym-channels">
          <article v-for="c in channels" :key="c.name" class="ym-channel">
            <span class="ym-channel__icon" :style="{ background: c.color + '22', color: c.color }"><i :class="c.icon"></i></span>
            <div class="ym-channel__info">
              <strong>{{ c.name }}</strong>
              <p>{{ c.orders }} đơn · <span style="color: #326e51">{{ formatPrice(c.revenue) }}</span></p>
            </div>
            <div class="ym-channel__bar">
              <div class="ym-channel__bar-fill" :style="{ width: `${(c.revenue / 124_000_000) * 100}%`, background: c.color }"></div>
            </div>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped src="./_admin-shared.css"></style>
<style scoped>
.ym-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; }
@media (max-width: 1024px) { .ym-grid { grid-template-columns: 1fr; } }
.ym-card--span { grid-column: 1 / -1; }
.ym-card__header { padding: 14px 18px; border-bottom: 1px solid #f1f3f5; }
.ym-card__header h2 { margin: 0; font-size: 15px; font-weight: 600; }
.ym-card__body { padding: 16px; }

.ym-chart { display: flex; gap: 4px; align-items: flex-end; height: 240px; padding: 16px 0; }
.ym-chart__bar { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; height: 100%; }
.ym-chart__bar-fill { width: 100%; max-width: 50px; background: linear-gradient(180deg, #44a273 0%, #326e51 100%); border-radius: 6px 6px 0 0; position: relative; min-height: 4px; transition: height 0.3s; }
.ym-chart__value { position: absolute; top: -22px; left: 50%; transform: translateX(-50%); font-size: 11px; color: #4b5563; font-weight: 600; white-space: nowrap; }
.ym-chart__label { font-size: 11px; color: #9ca3af; }

.ym-top-list { list-style: none; margin: 0; padding: 0; }
.ym-top-item { display: flex; align-items: center; gap: 10px; padding: 10px 18px; border-bottom: 1px solid #f1f3f5; }
.ym-top-item:last-child { border-bottom: none; }
.ym-top-rank { width: 26px; height: 26px; border-radius: 6px; background: #f3f4f6; color: #4b5563; font-weight: 600; font-size: 12px; display: inline-flex; align-items: center; justify-content: center; }
.ym-top-item:nth-child(1) .ym-top-rank { background: #fef3c7; color: #92400e; }
.ym-top-item:nth-child(2) .ym-top-rank { background: #e5e7eb; }
.ym-top-item:nth-child(3) .ym-top-rank { background: #fde6d3; color: #9a3412; }
.ym-top-item img { width: 36px; height: 36px; object-fit: contain; padding: 2px; background: #fafbfc; border-radius: 6px; border: 1px solid #f1f3f5; }
.ym-top-item div { flex: 1; min-width: 0; }
.ym-top-item strong { display: block; font-size: 13px; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ym-top-item small { font-size: 11px; color: #6b7280; }

.ym-channels { padding: 12px 18px; display: flex; flex-direction: column; gap: 12px; }
.ym-channel { display: grid; grid-template-columns: 44px 1fr 200px; gap: 12px; align-items: center; }
.ym-channel__icon { width: 44px; height: 44px; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; font-size: 22px; }
.ym-channel__info strong { display: block; font-size: 14px; color: #111827; }
.ym-channel__info p { margin: 2px 0 0; font-size: 12px; color: #6b7280; }
.ym-channel__bar { height: 8px; background: #f3f4f6; border-radius: 4px; overflow: hidden; }
.ym-channel__bar-fill { height: 100%; transition: width 0.4s; }
</style>
