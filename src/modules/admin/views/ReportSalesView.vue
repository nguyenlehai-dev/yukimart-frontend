<script setup lang="ts">
import { ref, computed } from 'vue'
import { formatPrice } from '@/modules/mypage/home/configs'
import { useAdminDataStore } from '../stores/adminData'
import { useImportedAs } from '../composables/useImportedAs'
import ShopImportExport from '../components/ShopImportExport.vue'

interface OrderRow {
  id: number
  total: number
  status: string
  createdAt: string // ISO
  itemsDetail: { id: number; name: string; quantity: number; price: number; image?: string }[]
}

const store = useAdminDataStore()
const period = ref<'7d' | '30d' | 'mtd' | 'ytd'>('30d')

// Lấy đơn hàng thật từ BE.
const importedOrders = useImportedAs<OrderRow>('orders', {
  total: ['total', 'tong_tien', 'thanh_tien'],
  status: ['status', 'trang_thai'],
  createdAt: ['created_at', 'createdAt', 'ngay_tao'],
  itemsDetail: ['items_detail', 'lines'],
}, (raw, m) => ({
  id: Number(raw.id),
  total: Number(m.total ?? 0),
  status: String(m.status ?? ''),
  createdAt: String(m.createdAt ?? ''),
  itemsDetail: Array.isArray(m.itemsDetail) ? m.itemsDetail as any[] : [],
}))

// Đơn hợp lệ: không bao gồm cancelled.
const validOrders = computed(() =>
  importedOrders.items.value.filter((o) => o.status !== 'cancelled'),
)
// Đơn bị huỷ — dùng cho thống kê "Hoàn trả" (chưa có module sales-returns đầy đủ).
const cancelledOrders = computed(() =>
  importedOrders.items.value.filter((o) => o.status === 'cancelled'),
)

function periodStart(): Date {
  const now = new Date()
  if (period.value === '7d') {
    const d = new Date(now); d.setDate(d.getDate() - 6); d.setHours(0, 0, 0, 0); return d
  }
  if (period.value === '30d') {
    const d = new Date(now); d.setDate(d.getDate() - 29); d.setHours(0, 0, 0, 0); return d
  }
  if (period.value === 'mtd') {
    return new Date(now.getFullYear(), now.getMonth(), 1)
  }
  return new Date(now.getFullYear(), 0, 1)
}

const inPeriod = computed(() => {
  const start = periodStart().getTime()
  const end = Date.now()
  return validOrders.value.filter((o) => {
    const t = Date.parse(o.createdAt)
    if (isNaN(t)) return false
    return t >= start && t <= end
  })
})

// Build chuỗi điểm doanh thu theo bucket (ngày hoặc tháng).
const revenueData = computed(() => {
  const start = periodStart()
  const today = new Date()
  if (period.value === 'ytd') {
    // Aggregate theo tháng
    const buckets = Array.from({ length: today.getMonth() + 1 }, (_, i) => ({
      label: `T${i + 1}`,
      revenue: 0,
    }))
    for (const o of inPeriod.value) {
      const d = new Date(o.createdAt)
      if (isNaN(d.getTime())) continue
      const mi = d.getMonth()
      if (buckets[mi]) buckets[mi].revenue += o.total
    }
    return buckets
  }
  const days = period.value === '7d' ? 7 : period.value === '30d' ? 30 : Math.max(1, today.getDate())
  const buckets: { label: string; revenue: number; key: string }[] = []
  for (let i = 0; i < days; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    const key = d.toISOString().slice(0, 10)
    buckets.push({ label: `${d.getDate()}/${d.getMonth() + 1}`, revenue: 0, key })
  }
  for (const o of inPeriod.value) {
    const key = o.createdAt.slice(0, 10)
    const b = buckets.find((x) => x.key === key)
    if (b) b.revenue += o.total
  }
  return buckets.map(({ label, revenue }) => ({ label, revenue }))
})

const maxRevenue = computed(() => Math.max(1, ...revenueData.value.map((d) => d.revenue)))

const summary = computed(() => {
  const total = inPeriod.value.reduce((s, o) => s + o.total, 0)
  const count = inPeriod.value.length
  // Refund = tổng đơn bị huỷ trong period (gần đúng — sẽ thay bằng module
  // sales-returns khi có).
  const start = periodStart().getTime()
  const refund = cancelledOrders.value
    .filter((o) => {
      const t = Date.parse(o.createdAt)
      return !isNaN(t) && t >= start
    })
    .reduce((s, o) => s + o.total, 0)
  return {
    revenue: total,
    orders: count,
    avgOrder: count > 0 ? Math.round(total / count) : 0,
    refund,
  }
})

// Top sản phẩm bán chạy: aggregate items_detail từ đơn trong period.
const topProducts = computed(() => {
  const map = new Map<number, { id: number; name: string; image: string; sold: number; revenue: number }>()
  for (const o of inPeriod.value) {
    for (const it of o.itemsDetail) {
      const id = Number(it.id)
      if (!id) continue
      const existing = map.get(id)
      if (existing) {
        existing.sold += Number(it.quantity || 0)
        existing.revenue += Number(it.price || 0) * Number(it.quantity || 0)
      } else {
        map.set(id, {
          id,
          name: String(it.name || ''),
          image: String(it.image || ''),
          sold: Number(it.quantity || 0),
          revenue: Number(it.price || 0) * Number(it.quantity || 0),
        })
      }
    }
  }
  return Array.from(map.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
    .map((p) => ({
      ...p,
      image: p.image || store.products.find((sp) => sp.id === p.id)?.image || '',
    }))
})

// Doanh thu theo kênh: hiện tại mọi đơn từ checkout đều là Website.
const channels = computed(() => {
  const websiteOrders = inPeriod.value.length
  const websiteRevenue = inPeriod.value.reduce((s, o) => s + o.total, 0)
  return [
    { name: 'Website', icon: 'ri-global-line', orders: websiteOrders, revenue: websiteRevenue, color: '#326e51' },
  ]
})
const maxChannelRevenue = computed(() => Math.max(1, ...channels.value.map((c) => c.revenue)))
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
          <div v-if="revenueData.every((d) => d.revenue === 0)" class="ym-chart-empty">
            Chưa có dữ liệu doanh thu trong khoảng này.
          </div>
          <div v-else class="ym-chart">
            <div v-for="(d, idx) in revenueData" :key="idx" class="ym-chart__bar">
              <div class="ym-chart__bar-fill" :style="{ height: `${(d.revenue / maxRevenue) * 100}%` }">
                <span v-if="d.revenue > 0" class="ym-chart__value">{{ d.revenue >= 1_000_000 ? `${Math.round(d.revenue / 1_000_000)}M` : `${Math.round(d.revenue / 1_000)}K` }}</span>
              </div>
              <span class="ym-chart__label">{{ d.label }}</span>
            </div>
          </div>
        </div>
      </section>

      <section class="ym-card">
        <div class="ym-card__header"><h2>Top sản phẩm bán chạy</h2></div>
        <ul class="ym-top-list">
          <li v-for="(p, idx) in topProducts" :key="p.id" class="ym-top-item">
            <span class="ym-top-rank">{{ idx + 1 }}</span>
            <img :src="p.image || ''" :alt="p.name" />
            <div>
              <strong>{{ p.name }}</strong>
              <small>Bán {{ p.sold }} · <span style="color: #326e51">{{ formatPrice(p.revenue) }}</span></small>
            </div>
          </li>
          <li v-if="!topProducts.length" class="ym-top-empty">Chưa có đơn nào trong khoảng này.</li>
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
              <div class="ym-channel__bar-fill" :style="{ width: `${(c.revenue / maxChannelRevenue) * 100}%`, background: c.color }"></div>
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
.ym-chart-empty { padding: 60px 16px; text-align: center; color: #9ca3af; font-size: 14px; }

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
.ym-top-empty { padding: 24px; text-align: center; color: #9ca3af; font-size: 13px; }

.ym-channels { padding: 12px 18px; display: flex; flex-direction: column; gap: 12px; }
.ym-channel { display: grid; grid-template-columns: 44px 1fr 200px; gap: 12px; align-items: center; }
.ym-channel__icon { width: 44px; height: 44px; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; font-size: 22px; }
.ym-channel__info strong { display: block; font-size: 14px; color: #111827; }
.ym-channel__info p { margin: 2px 0 0; font-size: 12px; color: #6b7280; }
.ym-channel__bar { height: 8px; background: #f3f4f6; border-radius: 4px; overflow: hidden; }
.ym-channel__bar-fill { height: 100%; transition: width 0.4s; }
</style>
