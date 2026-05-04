<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import RowMenu from '../components/RowMenu.vue'
import Pagination from '../components/Pagination.vue'
import ShopImportExport from '../components/ShopImportExport.vue'
import { useToast } from '../composables/useToast'
import { useShopBusinessStore, type PurchaseInvoice } from '../stores/shopBusiness'
import { useImportedAs } from '../composables/useImportedAs'
import { formatPrice } from '@/modules/mypage/home/configs'

const toast = useToast()
const router = useRouter()
const business = useShopBusinessStore()

const imported = useImportedAs<PurchaseInvoice>('purchase-invoices', {
  code: ['ma_phieu', 'code'],
  invoiceNo: ['so_hoa_don', 'invoice_no'],
  purchaseOrderId: ['purchase_order_id'],
  purchaseOrderCode: ['ma_phieu_nhap', 'purchase_order_code'],
  supplierName: ['ten_ncc', 'ten_nha_cung_cap', 'supplier_name'],
  total: ['tong_tien', 'total'],
  vat: ['vat', 'thue'],
  status: ['trang_thai', 'status'],
  dueDate: ['han_thanh_toan', 'due_date'],
  createdAt: ['ngay_tao', 'created_at'],
}, (raw, m) => ({
  id: Number(raw.id),
  code: String(m.code ?? `HDV${raw.id}`),
  invoiceNo: String(m.invoiceNo ?? ''),
  purchaseOrderId: Number(m.purchaseOrderId ?? 0),
  purchaseOrderCode: String(m.purchaseOrderCode ?? ''),
  supplierName: String(m.supplierName ?? ''),
  total: Number(m.total ?? 0),
  vat: Number(m.vat ?? 0),
  status: (m.status ?? 'unpaid') as 'unpaid' | 'paid' | 'overdue',
  dueDate: String(m.dueDate ?? ''),
  createdAt: String(m.createdAt ?? ''),
}))
const allPInvoices = computed<PurchaseInvoice[]>(() => imported.hasData.value ? imported.items.value : business.purchaseInvoices)

const statusMap = {
  unpaid: { label: 'Chưa thanh toán', tone: 'warning' },
  paid: { label: 'Đã thanh toán', tone: 'success' },
  overdue: { label: 'Quá hạn', tone: 'danger' },
}

const search = ref(''); const filterStatus = ref<'all' | keyof typeof statusMap>('all')
const page = ref(1); const perPage = ref(5)
const filtered = computed(() => allPInvoices.value.filter((i) => {
  const q = search.value.trim().toLowerCase()
  return (!q || i.code.toLowerCase().includes(q) || i.invoiceNo.toLowerCase().includes(q) || i.supplierName.toLowerCase().includes(q)) && (filterStatus.value === 'all' || i.status === filterStatus.value)
}))
const paginated = computed(() => filtered.value.slice((page.value - 1) * perPage.value, page.value * perPage.value))
watch([search, filterStatus], () => { page.value = 1 })

const stats = computed(() => ({
  total: allPInvoices.value.length,
  totalAmount: allPInvoices.value.reduce((s, i) => s + i.total, 0),
  totalVat: allPInvoices.value.reduce((s, i) => s + i.vat, 0),
  unpaid: allPInvoices.value.filter((i) => i.status === 'unpaid' || i.status === 'overdue').length,
}))

function gotoPO(_poId: number) { router.push('/admin/purchase-orders') }

function markPaid(inv: PurchaseInvoice) {
  inv.status = 'paid'
  // Trừ công nợ NCC
  const po = business.getPO(inv.purchaseOrderId)
  if (po) {
    const sup = business.getSupplier(po.supplierId)
    if (sup) sup.totalDebt = Math.max(0, sup.totalDebt - inv.total)
    po.paid = po.total
  }
  toast.success('Đã ghi nhận thanh toán', inv.code)
}

const rowMenu = (i: PurchaseInvoice) => {
  const items: { key: string; label: string; icon: string; tone?: 'danger' }[] = [
    { key: 'po', label: 'Đi tới phiếu nhập', icon: 'ri-arrow-down-circle-line' },
  ]
  if (i.status !== 'paid') items.push({ key: 'pay', label: 'Ghi nhận thanh toán', icon: 'ri-bank-card-line' })
  items.push({ key: 'print', label: 'In hoá đơn', icon: 'ri-printer-line' })
  items.push({ key: 'delete', label: 'Xoá', icon: 'ri-delete-bin-line', tone: 'danger' })
  return items
}
function onAction(i: PurchaseInvoice, key: string) {
  if (key === 'po') gotoPO(i.purchaseOrderId)
  else if (key === 'pay') markPaid(i)
  else if (key === 'delete') {
    business.purchaseInvoices.splice(business.purchaseInvoices.findIndex((x) => x.id === i.id), 1)
    toast.success('Đã xoá', i.code)
  } else toast.info('Tính năng demo')
}
</script>

<template>
  <div class="ym-page">
    <header class="ym-page__header">
      <div>
        <h1>Hóa đơn đầu vào</h1>
        <p>Hoá đơn GTGT từ NCC, liên kết với Phiếu nhập (PO).</p>
      </div>
      <div class="ym-page__actions"><ShopImportExport entity="purchase-invoices" id-field="code" label="hóa đơn đầu vào" @imported="imported.refresh" /></div>
    </header>

    <section class="ym-mini-stats">
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Tổng HĐ</p><p class="ym-mini-stat__value">{{ stats.total }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Tổng giá trị</p><p class="ym-mini-stat__value" style="color: #326e51">{{ formatPrice(stats.totalAmount) }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Tổng VAT</p><p class="ym-mini-stat__value">{{ formatPrice(stats.totalVat) }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Chưa trả</p><p class="ym-mini-stat__value" style="color: #d0021b">{{ stats.unpaid }}</p></article>
    </section>

    <div class="ym-card">
      <div class="ym-toolbar">
        <div class="ym-search"><i class="ri-search-line"></i><input v-model="search" type="text" placeholder="Tìm theo mã, số HĐ, NCC..." /></div>
        <div class="ym-toolbar__actions"><select v-model="filterStatus" class="ym-select"><option value="all">Tất cả</option><option v-for="(v, k) in statusMap" :key="k" :value="k">{{ v.label }}</option></select></div>
      </div>
      <div class="ym-table-wrap">
        <table class="ym-table">
          <thead><tr><th>Mã HĐ</th><th>Số hoá đơn</th><th>NCC</th><th>Phiếu nhập</th><th class="is-right">Tổng tiền</th><th class="is-right">VAT</th><th>Hạn TT</th><th>Trạng thái</th><th></th></tr></thead>
          <tbody>
            <tr v-for="i in paginated" :key="i.id">
              <td><strong>{{ i.code }}</strong></td>
              <td>{{ i.invoiceNo }}</td>
              <td>{{ i.supplierName }}</td>
              <td><a href="#" class="ym-link" @click.prevent="gotoPO(i.purchaseOrderId)">{{ i.purchaseOrderCode }}</a></td>
              <td class="is-right"><strong>{{ formatPrice(i.total) }}</strong></td>
              <td class="is-right is-muted">{{ formatPrice(i.vat) }}</td>
              <td class="is-muted">{{ i.dueDate }}</td>
              <td><span :class="['ym-tag', `ym-tag--${statusMap[i.status]?.tone || 'neutral'}`]">{{ statusMap[i.status]?.label || i.status }}</span></td>
              <td class="is-right"><RowMenu :items="rowMenu(i)" @select="onAction(i, $event)" /></td>
            </tr>
            <tr v-if="!paginated.length"><td colspan="9" class="ym-empty">Chưa có hoá đơn đầu vào. Tạo từ trang Phiếu nhập.</td></tr>
          </tbody>
        </table>
      </div>
      <Pagination v-model="page" :total-items="filtered.length" :per-page="perPage" item-label="hoá đơn" @update:per-page="(n) => perPage = n" />
    </div>
  </div>
</template>

<style scoped src="./_admin-shared.css"></style>
<style scoped>.ym-select { padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 8px; background: #fff; font-size: 14px; }</style>
