<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from '../composables/useToast'
import { useAdminDataStore } from '../stores/adminData'
import { useShopBusinessStore } from '../stores/shopBusiness'
import { formatPrice } from '@/modules/mypage/home/configs'

const router = useRouter()
const toast = useToast()
const store = useAdminDataStore()
const business = useShopBusinessStore()

const quickActions = [
  { icon: 'ri-add-circle-line', label: 'Thêm sản phẩm', to: '/admin/products' },
  { icon: 'ri-file-list-3-line', label: 'Tạo đơn hàng', to: '/admin/orders' },
  { icon: 'ri-coupon-line', label: 'Tạo khuyến mãi', action: 'promo' },
  { icon: 'ri-bar-chart-2-line', label: 'Xem báo cáo', action: 'report' },
  { icon: 'ri-truck-line', label: 'Quản lý vận chuyển', to: '/admin/settings' },
  { icon: 'ri-customer-service-2-line', label: 'Hỗ trợ khách hàng', to: '/admin/customers' },
]

function runAction(item: { to?: string; action?: string; label: string }) {
  if (item.to) router.push(item.to)
  else toast.info(item.label, 'Tính năng sắp ra mắt.')
}

function exportReport() {
  toast.success('Đang xuất báo cáo', 'Báo cáo sẽ được gửi qua email khi hoàn tất.')
}

interface Stat {
  key: string
  label: string
  value: string
  delta: number
  icon: string
  tone: 'green' | 'orange' | 'blue' | 'pink'
}

interface RecentOrder {
  id: string
  customer: string
  total: number
  status: 'pending' | 'processing' | 'completed' | 'cancelled'
  createdAt: string
}

interface TopProduct {
  id: number
  name: string
  sold: number
  revenue: number
  image?: string
}

const stats = computed<Stat[]>(() => [
  { key: 'revenue', label: 'Doanh thu', value: formatPrice(business.totalRevenue), delta: 12.4, icon: 'ri-money-dollar-circle-line', tone: 'green' },
  { key: 'orders', label: 'Đơn hàng', value: String(business.orders.length), delta: 8.1, icon: 'ri-shopping-bag-3-line', tone: 'orange' },
  { key: 'customers', label: 'Khách hàng', value: String(business.customers.length), delta: -2.3, icon: 'ri-user-add-line', tone: 'blue' },
  { key: 'products', label: 'Sản phẩm', value: `${store.activeProducts.length}/${store.productCount}`, delta: 0, icon: 'ri-archive-2-line', tone: 'pink' },
])

const recentOrders = computed<RecentOrder[]>(() => business.orders.slice(0, 5).map((o) => ({
  id: o.code,
  customer: o.customerName,
  total: o.total,
  status: o.status === 'shipping' ? 'processing' : o.status as any,
  createdAt: o.createdAt,
})))

const topProducts = computed<TopProduct[]>(() => {
  // Lấy top 5 sản phẩm có giá trị tồn cao nhất làm proxy cho "bán chạy"
  return [...store.products]
    .filter((p) => p.status === 'active')
    .sort((a, b) => (b.salePrice * (100 - b.stock)) - (a.salePrice * (100 - a.stock)))
    .slice(0, 5)
    .map((p, idx) => ({
      id: p.id,
      name: p.name,
      sold: 50 + idx * 18 + (p.id % 30),
      revenue: p.salePrice * (50 + idx * 18 + (p.id % 30)),
      image: p.image,
    }))
})

const statusMap = {
  pending: { label: 'Chờ xử lý', tone: 'warning' },
  processing: { label: 'Đang giao', tone: 'info' },
  completed: { label: 'Hoàn thành', tone: 'success' },
  cancelled: { label: 'Đã huỷ', tone: 'danger' },
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value) + ' ₫'
}
</script>

<template>
  <div class="ym-dashboard">
    <header class="ym-dashboard__header">
      <div>
        <h1 class="ym-dashboard__title">Dashboard</h1>
        <p class="ym-dashboard__subtitle">Tổng quan hoạt động kinh doanh hôm nay</p>
      </div>
      <div class="ym-dashboard__actions">
        <button type="button" class="ym-dashboard__btn ym-dashboard__btn--ghost">
          <i class="ri-calendar-line"></i> Hôm nay
        </button>
        <button type="button" class="ym-dashboard__btn ym-dashboard__btn--primary" @click="exportReport">
          <i class="ri-download-2-line"></i> Xuất báo cáo
        </button>
      </div>
    </header>

    <!-- Stat cards -->
    <section class="ym-dashboard__stats">
      <article
        v-for="stat in stats"
        :key="stat.key"
        :class="['ym-stat', `ym-stat--${stat.tone}`]"
      >
        <div class="ym-stat__icon">
          <i :class="stat.icon"></i>
        </div>
        <div class="ym-stat__body">
          <p class="ym-stat__label">{{ stat.label }}</p>
          <p class="ym-stat__value">{{ stat.value }}</p>
          <p :class="['ym-stat__delta', stat.delta >= 0 ? 'is-up' : 'is-down']">
            <i :class="stat.delta >= 0 ? 'ri-arrow-up-line' : 'ri-arrow-down-line'"></i>
            {{ Math.abs(stat.delta) }}% so với hôm qua
          </p>
        </div>
      </article>
    </section>

    <div class="ym-dashboard__grid">
      <!-- Recent orders -->
      <section class="ym-card ym-card--span-2">
        <header class="ym-card__header">
          <h2>Đơn hàng gần đây</h2>
          <RouterLink to="/admin/orders" class="ym-card__link">Xem tất cả <i class="ri-arrow-right-s-line"></i></RouterLink>
        </header>
        <div class="ym-table-wrap">
          <table class="ym-table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th class="is-right">Tổng tiền</th>
                <th>Trạng thái</th>
                <th>Thời gian</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="order in recentOrders" :key="order.id">
                <td><strong>{{ order.id }}</strong></td>
                <td>{{ order.customer }}</td>
                <td class="is-right">{{ formatCurrency(order.total) }}</td>
                <td>
                  <span :class="['ym-tag', `ym-tag--${statusMap[order.status]?.tone || 'neutral'}`]">
                    {{ statusMap[order.status]?.label || order.status }}
                  </span>
                </td>
                <td class="ym-table__muted">{{ order.createdAt }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Top products -->
      <section class="ym-card">
        <header class="ym-card__header">
          <h2>Sản phẩm bán chạy</h2>
          <RouterLink to="/admin/products" class="ym-card__link">Chi tiết <i class="ri-arrow-right-s-line"></i></RouterLink>
        </header>
        <ul class="ym-top-list">
          <li v-for="(product, idx) in topProducts" :key="product.id" class="ym-top-list__item">
            <span class="ym-top-list__rank">{{ idx + 1 }}</span>
            <img v-if="product.image" :src="product.image" :alt="product.name" class="ym-top-list__thumb" loading="lazy" />
            <div class="ym-top-list__info">
              <p class="ym-top-list__name">{{ product.name }}</p>
              <p class="ym-top-list__meta">
                Đã bán {{ product.sold }} ·
                <strong>{{ formatCurrency(product.revenue) }}</strong>
              </p>
            </div>
          </li>
        </ul>
      </section>
    </div>

    <!-- Quick actions -->
    <section class="ym-card">
      <header class="ym-card__header">
        <h2>Thao tác nhanh</h2>
      </header>
      <div class="ym-quick-actions">
        <button v-for="item in quickActions" :key="item.label" type="button" class="ym-quick-action" @click="runAction(item)">
          <i :class="item.icon"></i>
          <span>{{ item.label }}</span>
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.ym-dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.ym-dashboard__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  flex-wrap: wrap;
}
.ym-dashboard__title {
  font-size: 24px;
  font-weight: 700;
  margin: 0;
  color: #111827;
}
.ym-dashboard__subtitle {
  margin: 4px 0 0;
  color: #6b7280;
  font-size: 14px;
}
.ym-dashboard__actions {
  display: flex;
  gap: 8px;
}
.ym-dashboard__btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  background: #fff;
  color: #1f2937;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.ym-dashboard__btn:hover {
  background: #f9fafb;
}
.ym-dashboard__btn--primary {
  background: #326e51;
  color: #fff;
  border-color: #326e51;
}
.ym-dashboard__btn--primary:hover {
  background: #285a42;
}

/* Stats */
.ym-dashboard__stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}
.ym-stat {
  background: #fff;
  border-radius: 12px;
  padding: 18px;
  display: flex;
  align-items: flex-start;
  gap: 14px;
  border: 1px solid #e5e7eb;
}
.ym-stat__icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}
.ym-stat--green .ym-stat__icon { background: #e8f0ec; color: #326e51; }
.ym-stat--orange .ym-stat__icon { background: #fff1e6; color: #ff6600; }
.ym-stat--blue .ym-stat__icon { background: #e6f0ff; color: #2563eb; }
.ym-stat--pink .ym-stat__icon { background: #fde6f0; color: #e91e63; }

.ym-stat__body { flex: 1; min-width: 0; }
.ym-stat__label { margin: 0; font-size: 13px; color: #6b7280; }
.ym-stat__value { margin: 4px 0; font-size: 22px; font-weight: 700; color: #111827; }
.ym-stat__delta {
  margin: 0;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.ym-stat__delta.is-up { color: #16a34a; }
.ym-stat__delta.is-down { color: #d0021b; }

/* Grid */
.ym-dashboard__grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}
@media (max-width: 1024px) {
  .ym-dashboard__grid {
    grid-template-columns: 1fr;
  }
}

/* Card */
.ym-card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  padding: 18px 20px;
}
.ym-card--span-2 { /* default 2/3 col on desktop */ }
.ym-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.ym-card__header h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}
.ym-card__link {
  font-size: 13px;
  color: #326e51;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
}

/* Table */
.ym-table-wrap { overflow-x: auto; }
.ym-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
.ym-table th,
.ym-table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #f1f3f5;
}
.ym-table th {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  background: #fafbfc;
}
.ym-table tbody tr:hover { background: #fafbfc; }
.ym-table .is-right { text-align: right; }
.ym-table__muted { color: #6b7280; }

.ym-tag {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
}
.ym-tag--success { background: #dcfce7; color: #166534; }
.ym-tag--warning { background: #fef3c7; color: #92400e; }
.ym-tag--info { background: #dbeafe; color: #1e40af; }
.ym-tag--danger { background: #fee2e2; color: #991b1b; }

/* Top list */
.ym-top-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.ym-top-list__item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #f1f3f5;
}
.ym-top-list__item:last-child { border-bottom: none; }
.ym-top-list__rank {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  background: #f3f4f6;
  color: #4b5563;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.ym-top-list__item:nth-child(1) .ym-top-list__rank { background: #fef3c7; color: #92400e; }
.ym-top-list__item:nth-child(2) .ym-top-list__rank { background: #e5e7eb; color: #1f2937; }
.ym-top-list__item:nth-child(3) .ym-top-list__rank { background: #fde6d3; color: #9a3412; }
.ym-top-list__thumb {
  width: 36px; height: 36px;
  object-fit: contain; padding: 2px;
  background: #fafbfc; border: 1px solid #f1f3f5;
  border-radius: 6px; flex-shrink: 0;
}
.ym-top-list__info { flex: 1; min-width: 0; }
.ym-top-list__name {
  margin: 0;
  font-size: 14px;
  color: #111827;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ym-top-list__meta {
  margin: 2px 0 0;
  font-size: 12px;
  color: #6b7280;
}

/* Quick actions */
.ym-quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 10px;
}
.ym-quick-action {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px;
  background: #fafbfc;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  color: #1f2937;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}
.ym-quick-action:hover {
  background: #e8f0ec;
  border-color: #326e51;
  color: #326e51;
}
.ym-quick-action i {
  font-size: 20px;
  color: #326e51;
}
</style>
