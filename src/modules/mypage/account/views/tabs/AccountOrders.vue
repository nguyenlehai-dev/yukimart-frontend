<script setup lang="ts">
import { ref, computed } from 'vue'

interface Order {
  id: string
  date: string
  items: number
  total: number
  status: 'pending' | 'processing' | 'shipping' | 'completed' | 'cancelled'
  paymentMethod: string
  details: {
    name: string
    quantity: number
    price: number
    image: string
  }[]
}

// ── Mock Data ──
const orders = ref<Order[]>([
  {
    id: '#YM-1025-AX8',
    date: '15 Thg 10, 2026',
    items: 3,
    total: 850000,
    status: 'completed',
    paymentMethod: 'Thanh toán COD',
    details: [
      { name: 'Kem Chống Nắng La Roche-Posay Anthelios 50ml', quantity: 1, price: 350000, image: 'https://hasaki.vn/images/graphics/no-image.jpg' },
      { name: 'Nước Tẩy Trang L\'Oreal 3 in 1 Micellar Water', quantity: 2, price: 250000, image: 'https://hasaki.vn/images/graphics/no-image.jpg' }
    ]
  },
  {
    id: '#YM-1042-BY9',
    date: '18 Thg 10, 2026',
    items: 1,
    total: 1250000,
    status: 'shipping',
    paymentMethod: 'VNPAY',
    details: [
      { name: 'Serum Phục Hồi Da B5 Giảm Khuyết Điểm', quantity: 1, price: 1250000, image: 'https://hasaki.vn/images/graphics/no-image.jpg' }
    ]
  },
  {
    id: '#YM-1055-CZ1',
    date: '20 Thg 10, 2026',
    items: 2,
    total: 450000,
    status: 'processing',
    paymentMethod: 'Ví Momo',
    details: [
      { name: 'Sữa Rửa Mặt CeraVe Hydrating', quantity: 1, price: 350000, image: 'https://hasaki.vn/images/graphics/no-image.jpg' },
      { name: 'Bông Tẩy Trang Silcot 82 Miếng', quantity: 1, price: 100000, image: 'https://hasaki.vn/images/graphics/no-image.jpg' }
    ]
  }
])

// ── State ──
const statusFilter = ref('all')
const expandedOrder = ref<string | null>(null)

// ── Logic ──
const filteredOrders = computed(() => {
  if (statusFilter.value === 'all') return orders.value
  return orders.value.filter(o => o.status === statusFilter.value)
})

function formatCurrency(val: number) {
  return val.toLocaleString('vi-VN') + ' đ'
}

function getStatusProp(status: string) {
  const map: Record<string, { label: string, colorClass: string, icon: string }> = {
    pending: { label: 'Chờ thanh toán', colorClass: 'ym-soft-badge--warning', icon: 'ri-time-line' },
    processing: { label: 'Đang chuẩn bị hàng', colorClass: 'ym-soft-badge--info', icon: 'ri-box-3-line' },
    shipping: { label: 'Đang giao hàng', colorClass: 'ym-soft-badge--primary', icon: 'ri-truck-line' },
    completed: { label: 'Giao hàng thành công', colorClass: 'ym-soft-badge--success', icon: 'ri-checkbox-circle-line' },
    cancelled: { label: 'Đã hủy', colorClass: 'ym-soft-badge--secondary', icon: 'ri-close-circle-line' },
  }
  return map[status] || { label: status, colorClass: 'ym-soft-badge--secondary', icon: 'ri-information-line' }
}

function toggleOrder(id: string) {
  expandedOrder.value = expandedOrder.value === id ? null : id
}
</script>

<template>
  <div class="ym-acc-orders-tab">
    <div class="ym-acc-section-header">
      <h2 class="ym-acc-section-title">Lịch sử đơn hàng</h2>
      <p class="ym-acc-section-desc">Theo dõi tiến trình và quản lý các đơn hàng đã đặt</p>
    </div>

    <!-- Soft Underline Tabs -->
    <div class="ym-acc-tabs-wrap">
      <div class="ym-acc-tabs">
        <button class="ym-acc-tab" :class="{ 'ym-acc-tab--active': statusFilter === 'all' }" @click="statusFilter = 'all'">Tất cả</button>
        <button class="ym-acc-tab" :class="{ 'ym-acc-tab--active': statusFilter === 'processing' }" @click="statusFilter = 'processing'">Đang chờ xử lý</button>
        <button class="ym-acc-tab" :class="{ 'ym-acc-tab--active': statusFilter === 'shipping' }" @click="statusFilter = 'shipping'">Phân phối & Giao</button>
        <button class="ym-acc-tab" :class="{ 'ym-acc-tab--active': statusFilter === 'completed' }" @click="statusFilter = 'completed'">Hoàn tất</button>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="filteredOrders.length === 0" class="ym-acc-empty">
      <div class="ym-acc-empty__icon"><i class="ri-inbox-line"></i></div>
      <h4 class="ym-acc-empty__title">Không tìm thấy đơn hàng</h4>
      <p class="ym-acc-empty__desc">Có vẻ như bạn chưa có đơn đặt hàng nào trong trạng thái này.</p>
      <RouterLink to="/" class="ym-btn ym-btn--primary mt-3">Tiếp tục mua sắm</RouterLink>
    </div>

    <!-- Order List -->
    <div v-else class="ym-acc-order-list">
      <div 
        v-for="order in filteredOrders" 
        :key="order.id" 
        class="ym-modern-order"
        :class="{ 'ym-modern-order--open': expandedOrder === order.id }"
      >
        <!-- Card Header (Always Visible) -->
        <div class="ym-modern-order__head" @click="toggleOrder(order.id)">
          <div class="ym-modern-order__id-block">
            <div class="ym-modern-order__icon"><i class="ri-shopping-bag-3-line"></i></div>
            <div class="ym-modern-order__id-text">
              <strong>{{ order.id }}</strong>
              <span>{{ order.date }}</span>
            </div>
          </div>
          
          <div class="ym-modern-order__status-block">
            <span class="ym-soft-badge" :class="getStatusProp(order.status).colorClass">
              <i :class="getStatusProp(order.status).icon"></i>
              {{ getStatusProp(order.status).label }}
            </span>
            <div class="ym-modern-order__chevron">
              <i class="ri-arrow-down-s-line"></i>
            </div>
          </div>
        </div>

        <!-- Order Summary Row -->
        <div class="ym-modern-order__summary">
          <div class="ym-mo-stat">
            <span class="ym-mo-stat__label">Sản phẩm</span>
            <span class="ym-mo-stat__val">{{ order.items }} món</span>
          </div>
          <div class="ym-mo-stat">
            <span class="ym-mo-stat__label">Tổng thanh toán</span>
            <span class="ym-mo-stat__val ym-mo-stat__val--highlight">{{ formatCurrency(order.total) }}</span>
          </div>
          <div class="ym-mo-stat">
            <span class="ym-mo-stat__label">Phương thức</span>
            <span class="ym-mo-stat__val">{{ order.paymentMethod }}</span>
          </div>
          <div class="ym-mo-actions" v-if="order.status === 'completed'">
            <button class="ym-btn ym-btn--outline ym-btn--sm">Đánh giá</button>
            <button class="ym-btn ym-btn--primary ym-btn--sm">Mua lại</button>
          </div>
        </div>

        <!-- Details Accordion -->
        <div class="ym-modern-order__details-wrap" :class="{ 'ym-modern-order__details-wrap--open': expandedOrder === order.id }">
          <div class="ym-modern-order__inner-details">
            <h5 class="ym-mo-details-title">Chi tiết sản phẩm</h5>
            <div class="ym-mo-items">
              <div v-for="(item, idx) in order.details" :key="idx" class="ym-mo-item">
                <img :src="item.image" :alt="item.name" class="ym-mo-item__img" />
                <div class="ym-mo-item__info">
                  <span class="ym-mo-item__name">{{ item.name }}</span>
                  <div class="ym-mo-item__price-row">
                    <span class="ym-mo-item__qty">Số lượng: {{ item.quantity }}</span>
                    <strong class="ym-mo-item__price">{{ formatCurrency(item.price) }}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
