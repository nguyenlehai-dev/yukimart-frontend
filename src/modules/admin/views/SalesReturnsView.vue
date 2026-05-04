<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import RowMenu from '../components/RowMenu.vue'
import Pagination from '../components/Pagination.vue'
import ShopImportExport from '../components/ShopImportExport.vue'
import { useToast } from '../composables/useToast'
import { useShopBusinessStore, type SalesReturn, type ReturnStatus } from '../stores/shopBusiness'
import { useImportedAs } from '../composables/useImportedAs'
import { formatPrice } from '@/modules/mypage/home/configs'

const toast = useToast()
const router = useRouter()
const business = useShopBusinessStore()

const imported = useImportedAs<SalesReturn>('sales-returns', {
  code: ['ma_phieu', 'ma_tra', 'code'],
  invoiceId: ['invoice_id'],
  invoiceCode: ['ma_hoa_don', 'invoice_code'],
  orderCode: ['ma_don_hang', 'order_code'],
  customerName: ['ten_khach_hang', 'khach_hang', 'customer_name'],
  total: ['tong_tien', 'total'],
  refunded: ['da_hoan', 'refunded'],
  reason: ['ly_do', 'reason'],
  status: ['trang_thai', 'status'],
  createdAt: ['ngay_tao', 'created_at'],
}, (raw, m) => ({
  id: Number(raw.id),
  code: String(m.code ?? `TR${raw.id}`),
  invoiceId: Number(m.invoiceId ?? 0),
  invoiceCode: String(m.invoiceCode ?? ''),
  orderCode: String(m.orderCode ?? ''),
  customerName: String(m.customerName ?? ''),
  lines: [],
  total: Number(m.total ?? 0),
  refunded: Number(m.refunded ?? 0),
  reason: String(m.reason ?? ''),
  status: (m.status ?? 'pending') as ReturnStatus,
  createdAt: String(m.createdAt ?? ''),
}))
const allSalesReturns = computed<SalesReturn[]>(() => imported.hasData.value ? imported.items.value : business.salesReturns)

const statusMap: Record<ReturnStatus, { label: string; tone: string }> = {
  pending: { label: 'Chờ xử lý', tone: 'warning' },
  completed: { label: 'Đã hoàn tiền', tone: 'success' },
  cancelled: { label: 'Đã huỷ', tone: 'danger' },
}

const search = ref(''); const filterStatus = ref<'all' | ReturnStatus>('all')
const page = ref(1); const perPage = ref(5)
const filtered = computed(() => allSalesReturns.value.filter((i) => {
  const q = search.value.trim().toLowerCase()
  return (!q || i.code.toLowerCase().includes(q) || i.invoiceCode.toLowerCase().includes(q) || i.orderCode.toLowerCase().includes(q) || i.customerName.toLowerCase().includes(q))
    && (filterStatus.value === 'all' || i.status === filterStatus.value)
}))
const paginated = computed(() => filtered.value.slice((page.value - 1) * perPage.value, page.value * perPage.value))
watch([search, filterStatus], () => { page.value = 1 })

const stats = computed(() => ({
  total: allSalesReturns.value.length,
  pending: allSalesReturns.value.filter((i) => i.status === 'pending').length,
  totalReturned: allSalesReturns.value.reduce((s, i) => s + i.total, 0),
  totalRefunded: allSalesReturns.value.reduce((s, i) => s + i.refunded, 0),
}))

function approve(sr: SalesReturn) {
  business.approveSalesReturn(sr.id)
  toast.success('Đã hoàn tiền & cộng lại tồn kho', sr.code)
}
function gotoInvoice(_invoiceId: number) {
  router.push('/admin/invoices')
}

const rowMenu = (sr: SalesReturn) => {
  const items: { key: string; label: string; icon: string; tone?: 'danger' }[] = [
    { key: 'invoice', label: 'Đi tới hoá đơn', icon: 'ri-file-list-3-line' },
  ]
  if (sr.status === 'pending') items.push({ key: 'approve', label: 'Duyệt + Hoàn tiền', icon: 'ri-check-line' })
  items.push({ key: 'print', label: 'In phiếu', icon: 'ri-printer-line' })
  items.push({ key: 'delete', label: 'Xoá', icon: 'ri-delete-bin-line', tone: 'danger' })
  return items
}
function onAction(sr: SalesReturn, key: string) {
  if (key === 'invoice') gotoInvoice(sr.invoiceId)
  else if (key === 'approve') approve(sr)
  else if (key === 'delete') {
    business.salesReturns.splice(business.salesReturns.findIndex((x) => x.id === sr.id), 1)
    toast.success('Đã xoá', sr.code)
  } else toast.info('Tính năng demo', sr.code)
}
</script>

<template>
  <div class="ym-page">
    <header class="ym-page__header">
      <div>
        <h1>Trả hàng</h1>
        <p>Phiếu trả hàng từ khách hàng. Tồn kho tự động được hoàn lại khi duyệt phiếu.</p>
      </div>
      <div class="ym-page__actions">
        <ShopImportExport entity="sales-returns" id-field="code" label="trả hàng" @imported="imported.refresh" />
      </div>
    </header>

    <section class="ym-mini-stats">
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Tổng phiếu</p><p class="ym-mini-stat__value">{{ stats.total }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Chờ xử lý</p><p class="ym-mini-stat__value" style="color: #92400e">{{ stats.pending }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Tổng giá trị trả</p><p class="ym-mini-stat__value">{{ formatPrice(stats.totalReturned) }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Đã hoàn</p><p class="ym-mini-stat__value" style="color: #166534">{{ formatPrice(stats.totalRefunded) }}</p></article>
    </section>

    <div class="ym-card">
      <div class="ym-toolbar">
        <div class="ym-search"><i class="ri-search-line"></i><input v-model="search" type="text" placeholder="Tìm theo mã phiếu, HĐ, đơn, khách..." /></div>
        <div class="ym-toolbar__actions"><select v-model="filterStatus" class="ym-select"><option value="all">Tất cả</option><option v-for="(v, k) in statusMap" :key="k" :value="k">{{ v.label }}</option></select></div>
      </div>
      <div class="ym-table-wrap">
        <table class="ym-table">
          <thead><tr><th>Mã phiếu</th><th>Hoá đơn</th><th>Đơn hàng</th><th>Khách hàng</th><th>Lý do</th><th class="is-right">Giá trị</th><th class="is-right">Đã hoàn</th><th>Trạng thái</th><th>Thời gian</th><th></th></tr></thead>
          <tbody>
            <tr v-for="sr in paginated" :key="sr.id">
              <td><strong>{{ sr.code }}</strong></td>
              <td><a href="#" class="ym-link" @click.prevent="gotoInvoice(sr.invoiceId)"><i class="ri-file-list-3-line"></i> {{ sr.invoiceCode }}</a></td>
              <td><span class="ym-link">{{ sr.orderCode }}</span></td>
              <td>{{ sr.customerName }}</td>
              <td class="is-muted">{{ sr.reason }}</td>
              <td class="is-right"><strong>{{ formatPrice(sr.total) }}</strong></td>
              <td class="is-right is-muted">{{ formatPrice(sr.refunded) }}</td>
              <td><span :class="['ym-tag', `ym-tag--${statusMap[sr.status]?.tone || 'neutral'}`]">{{ statusMap[sr.status]?.label || sr.status }}</span></td>
              <td class="is-muted">{{ sr.createdAt }}</td>
              <td class="is-right"><RowMenu :items="rowMenu(sr)" @select="onAction(sr, $event)" /></td>
            </tr>
            <tr v-if="!paginated.length"><td colspan="10" class="ym-empty">Chưa có phiếu trả hàng. Tạo từ trang Hoá đơn.</td></tr>
          </tbody>
        </table>
      </div>
      <Pagination v-model="page" :total-items="filtered.length" :per-page="perPage" item-label="phiếu" @update:per-page="(n) => perPage = n" />
    </div>
  </div>
</template>

<style scoped src="./_admin-shared.css"></style>
<style scoped>.ym-select { padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 8px; background: #fff; font-size: 14px; }</style>
