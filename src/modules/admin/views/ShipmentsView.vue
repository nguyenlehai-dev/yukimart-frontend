<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import RowMenu from '../components/RowMenu.vue'
import Pagination from '../components/Pagination.vue'
import ShopImportExport from '../components/ShopImportExport.vue'
import { useToast } from '../composables/useToast'
import { useShopBusinessStore, type Shipment, type ShipmentStatus } from '../stores/shopBusiness'
import { useShopEntity } from '../composables/useShopEntity'
import { useServerPagedList } from '../composables/useServerPagedList'
import api from '@/services/api'
import { formatPrice } from '@/modules/mypage/home/configs'

const toast = useToast()
const router = useRouter()
const business = useShopBusinessStore()
const shipmentsEntity = useShopEntity('shipments')

function rowToShipment(raw: any): Shipment {
  return {
    id: Number(raw.id),
    trackingCode: String(raw.tracking_code ?? raw.trackingCode ?? raw.ma_van_don ?? raw.code ?? `VD${raw.id}`),
    orderId: Number(raw.order_id ?? raw.orderId ?? 0),
    orderCode: String(raw.order_code ?? raw.orderCode ?? raw.ma_don_hang ?? ''),
    customerName: String(raw.customer_name ?? raw.customerName ?? raw.ten_khach_hang ?? ''),
    partner: String(raw.partner ?? raw.don_vi_van_chuyen ?? 'GHN'),
    partnerCode: String(raw.partner_code ?? raw.partnerCode ?? raw.ma_doi_tac ?? 'GHN'),
    fee: Number(raw.fee ?? raw.phi ?? 0),
    cod: Number(raw.cod ?? 0),
    status: (raw.status ?? raw.trang_thai ?? 'pending') as ShipmentStatus,
    updatedAt: String(raw.updated_at ?? raw.updatedAt ?? raw.ngay_cap_nhat ?? ''),
  }
}

const statusMap: Record<ShipmentStatus, { label: string; tone: string }> = {
  pending: { label: 'Chờ lấy hàng', tone: 'neutral' },
  picking: { label: 'Đang lấy', tone: 'warning' },
  shipping: { label: 'Đang giao', tone: 'info' },
  delivered: { label: 'Đã giao', tone: 'success' },
  failed: { label: 'Giao thất bại', tone: 'danger' },
  returned: { label: 'Hoàn về', tone: 'danger' },
}

const search = ref(''); const filterStatus = ref<'all' | ShipmentStatus>('all'); const filterPartner = ref('all')
const page = ref(1); const perPage = ref(20)

const imported = useServerPagedList<Shipment>('shipments', () => ({
  page: page.value,
  perPage: perPage.value,
  q: search.value.trim(),
  status: filterStatus.value === 'all' ? '' : filterStatus.value,
}), { mapper: rowToShipment })

const partnerOptions = computed(() => ['all', ...new Set(imported.items.value.map((i) => i.partner))])
const paginated = computed(() => filterPartner.value === 'all'
  ? imported.items.value
  : imported.items.value.filter((i) => i.partner === filterPartner.value))

watch([search, filterStatus, filterPartner], () => { page.value = 1 })

const stats = computed(() => ({
  total: imported.meta.value.total || imported.items.value.length,
  shipping: imported.items.value.filter((i) => i.status === 'shipping' || i.status === 'picking').length,
  delivered: imported.items.value.filter((i) => i.status === 'delivered').length,
  failed: imported.items.value.filter((i) => i.status === 'failed' || i.status === 'returned').length,
}))

async function syncStatus(s: Shipment) {
  const next: Record<ShipmentStatus, ShipmentStatus> = {
    pending: 'picking', picking: 'shipping', shipping: 'delivered',
    delivered: 'delivered', failed: 'failed', returned: 'returned',
  }
  const old = s.status
  const newStatus = next[s.status]
  if (old === newStatus) return

  try {
    await shipmentsEntity.update(s.id, {
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    // Khi giao thành công → cập nhật order status sang completed (qua BE).
    if (newStatus === 'delivered' && s.orderId > 0) {
      try {
        await api.put(`/shop/orders/${s.orderId}`, { status: 'completed' })
      } catch { /* observer có thể từ chối transition — bỏ qua */ }
    }
    await imported.refresh()
    toast.success('Đã đồng bộ', `${s.trackingCode}: ${old} → ${newStatus}`)
  } catch (err: any) {
    toast.error('Đồng bộ thất bại', err?.response?.data?.message || err?.message || 'Lỗi')
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
  for (const s of imported.items.value) syncStatus(s)
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
      <Pagination v-model="page" :total-items="imported.meta.total" :per-page="perPage" item-label="vận đơn" @update:per-page="(n) => perPage = n" />
    </div>
  </div>
</template>

<style scoped src="./_admin-shared.css"></style>
<style scoped>.ym-select { padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 8px; background: #fff; font-size: 14px; }</style>
