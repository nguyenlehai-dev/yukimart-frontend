<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import RowMenu from '../components/RowMenu.vue'
import Pagination from '../components/Pagination.vue'
import ShopImportExport from '../components/ShopImportExport.vue'
import { useToast } from '../composables/useToast'
import { useShopBusinessStore, type Shipment, type ShipmentStatus } from '../stores/shopBusiness'
import { useImportedAs } from '../composables/useImportedAs'
import { formatPrice } from '@/modules/mypage/home/configs'

const toast = useToast()
const router = useRouter()
const business = useShopBusinessStore()

const imported = useImportedAs<Shipment>('shipments', {
  trackingCode: ['ma_van_don', 'tracking_code', 'code'],
  orderId: ['order_id'],
  orderCode: ['ma_don_hang', 'order_code'],
  customerName: ['ten_khach_hang', 'khach_hang', 'customer_name'],
  partner: ['don_vi_van_chuyen', 'partner', 'doi_tac'],
  partnerCode: ['ma_doi_tac', 'partner_code'],
  fee: ['phi', 'fee'],
  cod: ['cod'],
  status: ['trang_thai', 'status'],
  updatedAt: ['ngay_cap_nhat', 'updated_at'],
}, (raw, m) => ({
  id: Number(raw.id),
  trackingCode: String(m.trackingCode ?? `VD${raw.id}`),
  orderId: Number(m.orderId ?? 0),
  orderCode: String(m.orderCode ?? ''),
  customerName: String(m.customerName ?? ''),
  partner: String(m.partner ?? 'GHN'),
  partnerCode: String(m.partnerCode ?? 'GHN'),
  fee: Number(m.fee ?? 0),
  cod: Number(m.cod ?? 0),
  status: (m.status ?? 'pending') as ShipmentStatus,
  updatedAt: String(m.updatedAt ?? ''),
}))
const allShipments = computed<Shipment[]>(() => imported.hasData.value ? imported.items.value : business.shipments)

const statusMap: Record<ShipmentStatus, { label: string; tone: string }> = {
  pending: { label: 'Chờ lấy hàng', tone: 'neutral' },
  picking: { label: 'Đang lấy', tone: 'warning' },
  shipping: { label: 'Đang giao', tone: 'info' },
  delivered: { label: 'Đã giao', tone: 'success' },
  failed: { label: 'Giao thất bại', tone: 'danger' },
  returned: { label: 'Hoàn về', tone: 'danger' },
}

const search = ref(''); const filterStatus = ref<'all' | ShipmentStatus>('all'); const filterPartner = ref('all')
const page = ref(1); const perPage = ref(5)
const partnerOptions = computed(() => ['all', ...new Set(allShipments.value.map((i) => i.partner))])

const filtered = computed(() => allShipments.value.filter((i) => {
  const q = search.value.trim().toLowerCase()
  return (!q || i.trackingCode.toLowerCase().includes(q) || i.orderCode.toLowerCase().includes(q) || i.customerName.toLowerCase().includes(q))
    && (filterStatus.value === 'all' || i.status === filterStatus.value)
    && (filterPartner.value === 'all' || i.partner === filterPartner.value)
}))
const paginated = computed(() => filtered.value.slice((page.value - 1) * perPage.value, page.value * perPage.value))
watch([search, filterStatus, filterPartner], () => { page.value = 1 })

const stats = computed(() => ({
  total: allShipments.value.length,
  shipping: allShipments.value.filter((i) => i.status === 'shipping' || i.status === 'picking').length,
  delivered: allShipments.value.filter((i) => i.status === 'delivered').length,
  failed: allShipments.value.filter((i) => i.status === 'failed' || i.status === 'returned').length,
}))

function syncStatus(s: Shipment) {
  // Mock đồng bộ trạng thái: chuyển sang trạng thái tiếp theo
  const next: Record<ShipmentStatus, ShipmentStatus> = {
    pending: 'picking', picking: 'shipping', shipping: 'delivered',
    delivered: 'delivered', failed: 'failed', returned: 'returned',
  }
  const old = s.status
  s.status = next[s.status]
  s.updatedAt = new Date().toLocaleString('vi-VN')
  if (old !== s.status) {
    toast.success('Đã đồng bộ', `${s.trackingCode}: ${old} → ${s.status}`)
    // Cập nhật trạng thái đơn hàng tương ứng
    const order = business.getOrder(s.orderId)
    if (order && s.status === 'delivered' && order.status !== 'completed') {
      order.status = 'completed'
    }
  }
}

function gotoOrder(_orderId: number) { router.push('/admin/orders') }

const rowMenu = (s: Shipment) => {
  const items: { key: string; label: string; icon: string; tone?: 'danger' }[] = [
    { key: 'order', label: 'Đi tới đơn', icon: 'ri-shopping-bag-line' },
    { key: 'sync', label: 'Đồng bộ trạng thái', icon: 'ri-refresh-line' },
    { key: 'track', label: 'Tra cứu lộ trình', icon: 'ri-route-line' },
    { key: 'print', label: 'In vận đơn', icon: 'ri-printer-line' },
    { key: 'cancel', label: 'Huỷ vận đơn', icon: 'ri-close-circle-line', tone: 'danger' },
  ]
  return items
}
function onAction(s: Shipment, key: string) {
  if (key === 'order') gotoOrder(s.orderId)
  else if (key === 'sync') syncStatus(s)
  else if (key === 'cancel') {
    business.shipments.splice(business.shipments.findIndex((x) => x.id === s.id), 1)
    const order = business.getOrder(s.orderId)
    if (order) order.shipmentId = null
    toast.success('Đã huỷ vận đơn', s.trackingCode)
  } else toast.info('Tính năng demo', s.trackingCode)
}

function syncAll() {
  for (const s of allShipments.value) syncStatus(s)
  toast.success('Đã đồng bộ tất cả vận đơn')
}
</script>

<template>
  <div class="ym-page">
    <header class="ym-page__header">
      <div>
        <h1>Vận đơn</h1>
        <p>Vận đơn được tạo từ Đơn hàng. Trạng thái đồng bộ về trạng thái đơn (delivered → completed).</p>
      </div>
      <div class="ym-page__actions">
        <ShopImportExport entity="shipments" id-field="code" label="vận đơn" @imported="imported.refresh" />
        <button type="button" class="ym-btn" @click="syncAll"><i class="ri-refresh-line"></i> Đồng bộ tất cả</button>
      </div>
    </header>

    <section class="ym-mini-stats">
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Tổng vận đơn</p><p class="ym-mini-stat__value">{{ stats.total }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Đang giao</p><p class="ym-mini-stat__value" style="color: #1e40af">{{ stats.shipping }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Đã giao</p><p class="ym-mini-stat__value" style="color: #166534">{{ stats.delivered }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Thất bại</p><p class="ym-mini-stat__value" style="color: #d0021b">{{ stats.failed }}</p></article>
    </section>

    <div class="ym-card">
      <div class="ym-toolbar">
        <div class="ym-search"><i class="ri-search-line"></i><input v-model="search" type="text" placeholder="Tìm theo mã VĐ, đơn, khách..." /></div>
        <div class="ym-toolbar__actions">
          <select v-model="filterPartner" class="ym-select"><option v-for="p in partnerOptions" :key="p" :value="p">{{ p === 'all' ? 'Tất cả đối tác' : p }}</option></select>
          <select v-model="filterStatus" class="ym-select"><option value="all">Tất cả</option><option v-for="(v, k) in statusMap" :key="k" :value="k">{{ v.label }}</option></select>
        </div>
      </div>
      <div class="ym-table-wrap">
        <table class="ym-table">
          <thead><tr><th>Mã vận đơn</th><th>Đơn hàng</th><th>Khách hàng</th><th>Đối tác</th><th class="is-right">Phí GH</th><th class="is-right">COD</th><th>Trạng thái</th><th>Cập nhật</th><th></th></tr></thead>
          <tbody>
            <tr v-for="s in paginated" :key="s.id">
              <td><strong>{{ s.trackingCode }}</strong></td>
              <td><a href="#" class="ym-link" @click.prevent="gotoOrder(s.orderId)"><i class="ri-shopping-bag-line"></i> {{ s.orderCode }}</a></td>
              <td>{{ s.customerName }}</td>
              <td>{{ s.partner }}</td>
              <td class="is-right is-muted">{{ formatPrice(s.fee) }}</td>
              <td class="is-right" :class="s.cod > 0 ? '' : 'is-muted'">{{ s.cod > 0 ? formatPrice(s.cod) : '—' }}</td>
              <td><span :class="['ym-tag', `ym-tag--${statusMap[s.status]?.tone || 'neutral'}`]">{{ statusMap[s.status]?.label || s.status }}</span></td>
              <td class="is-muted">{{ s.updatedAt }}</td>
              <td class="is-right"><RowMenu :items="rowMenu(s)" @select="onAction(s, $event)" /></td>
            </tr>
            <tr v-if="!paginated.length"><td colspan="9" class="ym-empty">Chưa có vận đơn. Tạo từ trang Đặt hàng.</td></tr>
          </tbody>
        </table>
      </div>
      <Pagination v-model="page" :total-items="filtered.length" :per-page="perPage" item-label="vận đơn" @update:per-page="(n) => perPage = n" />
    </div>
  </div>
</template>

<style scoped src="./_admin-shared.css"></style>
<style scoped>.ym-select { padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 8px; background: #fff; font-size: 14px; }</style>
