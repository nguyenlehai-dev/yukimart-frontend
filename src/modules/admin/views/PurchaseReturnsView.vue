<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import AdminModal from '../components/AdminModal.vue'
import RowMenu from '../components/RowMenu.vue'
import Pagination from '../components/Pagination.vue'
import ShopImportExport from '../components/ShopImportExport.vue'
import { useToast } from '../composables/useToast'
import { useAdminDataStore } from '../stores/adminData'
import { useShopBusinessStore, type PurchaseReturn, type ReturnStatus, type OrderLine } from '../stores/shopBusiness'
import { useImportedAs } from '../composables/useImportedAs'
import { formatPrice } from '@/modules/mypage/home/configs'

const toast = useToast()
const router = useRouter()
const adminData = useAdminDataStore()
const business = useShopBusinessStore()

const imported = useImportedAs<PurchaseReturn>('purchase-returns', {
  code: ['ma_phieu', 'code'],
  purchaseOrderId: ['purchase_order_id'],
  purchaseOrderCode: ['ma_phieu_nhap', 'purchase_order_code'],
  supplierName: ['ten_ncc', 'ten_nha_cung_cap', 'supplier_name'],
  total: ['tong_tien', 'total'],
  refunded: ['da_hoan', 'refunded'],
  reason: ['ly_do', 'reason'],
  status: ['trang_thai', 'status'],
  createdAt: ['ngay_tao', 'created_at'],
}, (raw, m) => ({
  id: Number(raw.id),
  code: String(m.code ?? `PR${raw.id}`),
  purchaseOrderId: Number(m.purchaseOrderId ?? 0),
  purchaseOrderCode: String(m.purchaseOrderCode ?? ''),
  supplierName: String(m.supplierName ?? ''),
  lines: [],
  total: Number(m.total ?? 0),
  refunded: Number(m.refunded ?? 0),
  reason: String(m.reason ?? ''),
  status: (() => {
    const s = String(m.status ?? '').toLowerCase()
    if (['pending', 'completed', 'cancelled'].includes(s)) return s as ReturnStatus
    return 'pending' as ReturnStatus
  })(),
  createdAt: String(m.createdAt ?? ''),
}))
const allPReturns = computed<PurchaseReturn[]>(() => imported.hasData.value ? imported.items.value : business.purchaseReturns)

const statusMap: Record<ReturnStatus, { label: string; tone: string }> = {
  pending: { label: 'Chờ hoàn tiền', tone: 'warning' },
  completed: { label: 'Đã hoàn tiền', tone: 'success' },
  cancelled: { label: 'Đã huỷ', tone: 'danger' },
}

const search = ref(''); const filterStatus = ref<'all' | ReturnStatus>('all')
const page = ref(1); const perPage = ref(5)
const filtered = computed(() => allPReturns.value.filter((i) => {
  const q = search.value.trim().toLowerCase()
  return (!q || i.code.toLowerCase().includes(q) || i.purchaseOrderCode.toLowerCase().includes(q) || i.supplierName.toLowerCase().includes(q)) && (filterStatus.value === 'all' || i.status === filterStatus.value)
}))
const paginated = computed(() => filtered.value.slice((page.value - 1) * perPage.value, page.value * perPage.value))
watch([search, filterStatus], () => { page.value = 1 })

const stats = computed(() => ({
  total: allPReturns.value.length,
  pending: allPReturns.value.filter((i) => i.status === 'pending').length,
  totalReturned: allPReturns.value.reduce((s, i) => s + i.total, 0),
  totalRefunded: allPReturns.value.reduce((s, i) => s + i.refunded, 0),
}))

// Create from PO
const formOpen = ref(false)
const formPOId = ref<number | null>(null)
const formReason = ref('Hàng lỗi')
const formLines = ref<Array<OrderLine & { checked: boolean }>>([])
const reasons = ['Hàng lỗi', 'Sai mẫu', 'Quá date', 'Đã thoả thuận giữ', 'Hư hỏng vận chuyển']

function openCreate() {
  formPOId.value = business.purchaseOrders[0]?.id || null
  formReason.value = 'Hàng lỗi'
  loadPOLines()
  formOpen.value = true
}

function loadPOLines() {
  const po = business.purchaseOrders.find((p) => p.id === formPOId.value)
  if (!po) { formLines.value = []; return }
  formLines.value = po.lines.map((l) => ({ ...l, checked: false }))
}

function submit() {
  const lines = formLines.value.filter((l) => l.checked && l.quantity > 0).map(({ productId, sku, name, image, unitPrice, quantity }) => ({ productId, sku, name, image, unitPrice, quantity }))
  if (!lines.length) return toast.error('Chọn ít nhất 1 SP để trả')
  const po = business.purchaseOrders.find((p) => p.id === formPOId.value)
  if (!po) return toast.error('Không tìm thấy phiếu nhập')

  const total = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0)
  const id = Math.max(0, ...business.purchaseReturns.map((r) => r.id)) + 1
  const code = 'TRN' + String(id + 100).padStart(4, '0')
  business.purchaseReturns.unshift({
    id, code, purchaseOrderId: po.id, purchaseOrderCode: po.code,
    supplierName: po.supplierName, lines, total, refunded: 0,
    reason: formReason.value, status: 'pending',
    createdAt: new Date().toLocaleString('vi-VN'),
  })
  toast.success('Đã tạo phiếu trả hàng nhập', code)
  formOpen.value = false
}

function approve(r: PurchaseReturn) {
  if (r.status !== 'pending') return
  if (!confirm(`Duyệt phiếu trả ${r.code}? Tồn kho sẽ trừ + công nợ NCC giảm.`)) return
  r.status = 'completed'
  r.refunded = r.total
  // Trừ tồn (vì hàng đã trả về NCC) + giảm công nợ NCC
  for (const line of r.lines) {
    adminData.adjustStock(line.productId, -line.quantity).catch(() => {})
    business.logMovement(line.productId, line.sku, line.name, 'out', -line.quantity, r.code, 'purchase_return', `Trả NCC: ${r.reason}`)
  }
  const po = business.getPO(r.purchaseOrderId)
  if (po) {
    const sup = business.getSupplier(po.supplierId)
    if (sup) {
      sup.totalDebt = Math.max(0, sup.totalDebt - r.total)
      sup.totalPurchase = Math.max(0, sup.totalPurchase - r.total)
    }
  }
  toast.success('Đã duyệt + cập nhật kho/công nợ', r.code)
}

function gotoPO(_poId: number) { router.push('/admin/purchase-orders') }

const rowMenu = (r: PurchaseReturn) => {
  const items: { key: string; label: string; icon: string; tone?: 'danger' }[] = [
    { key: 'po', label: 'Đi tới phiếu nhập', icon: 'ri-arrow-down-circle-line' },
  ]
  if (r.status === 'pending') items.push({ key: 'approve', label: 'Duyệt + Hoàn tiền', icon: 'ri-check-line' })
  items.push({ key: 'delete', label: 'Xoá', icon: 'ri-delete-bin-line', tone: 'danger' })
  return items
}
function onAction(r: PurchaseReturn, key: string) {
  if (key === 'po') gotoPO(r.purchaseOrderId)
  else if (key === 'approve') approve(r)
  else if (key === 'delete') {
    business.purchaseReturns.splice(business.purchaseReturns.findIndex((x) => x.id === r.id), 1)
    toast.success('Đã xoá', r.code)
  }
}
</script>

<template>
  <div class="ym-page">
    <header class="ym-page__header">
      <div>
        <h1>Trả hàng nhập</h1>
        <p>Phiếu trả hàng cho NCC. Duyệt → trừ tồn + giảm công nợ NCC.</p>
      </div>
      <div class="ym-page__actions">
        <ShopImportExport entity="purchase-returns" id-field="code" label="phiếu trả hàng nhập" @imported="imported.refresh" />
        <button type="button" class="ym-btn ym-btn--primary" @click="openCreate"><i class="ri-add-line"></i> Tạo phiếu trả</button>
      </div>
    </header>

    <section class="ym-mini-stats">
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Tổng phiếu</p><p class="ym-mini-stat__value">{{ stats.total }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Chờ xử lý</p><p class="ym-mini-stat__value" style="color: #92400e">{{ stats.pending }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Giá trị trả</p><p class="ym-mini-stat__value">{{ formatPrice(stats.totalReturned) }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Đã hoàn</p><p class="ym-mini-stat__value" style="color: #166534">{{ formatPrice(stats.totalRefunded) }}</p></article>
    </section>

    <div class="ym-card">
      <div class="ym-toolbar">
        <div class="ym-search"><i class="ri-search-line"></i><input v-model="search" type="text" placeholder="Tìm theo mã, PO, NCC..." /></div>
        <div class="ym-toolbar__actions"><select v-model="filterStatus" class="ym-select"><option value="all">Tất cả</option><option v-for="(v, k) in statusMap" :key="k" :value="k">{{ v.label }}</option></select></div>
      </div>
      <div class="ym-table-wrap">
        <table class="ym-table">
          <thead><tr><th>Mã phiếu</th><th>Phiếu nhập</th><th>NCC</th><th>Lý do</th><th class="is-center">SP</th><th class="is-right">Giá trị</th><th class="is-right">Đã hoàn</th><th>Trạng thái</th><th>Thời gian</th><th></th></tr></thead>
          <tbody>
            <tr v-for="r in paginated" :key="r.id">
              <td><strong>{{ r.code }}</strong></td>
              <td><a href="#" class="ym-link" @click.prevent="gotoPO(r.purchaseOrderId)">{{ r.purchaseOrderCode }}</a></td>
              <td>{{ r.supplierName }}</td>
              <td class="is-muted">{{ r.reason }}</td>
              <td class="is-center">{{ r.lines.length }}</td>
              <td class="is-right"><strong>{{ formatPrice(r.total) }}</strong></td>
              <td class="is-right is-muted">{{ formatPrice(r.refunded) }}</td>
              <td><span :class="['ym-tag', `ym-tag--${statusMap[r.status]?.tone || 'neutral'}`]">{{ statusMap[r.status]?.label || r.status }}</span></td>
              <td class="is-muted">{{ r.createdAt }}</td>
              <td class="is-right"><RowMenu :items="rowMenu(r)" @select="onAction(r, $event)" /></td>
            </tr>
            <tr v-if="!paginated.length"><td colspan="10" class="ym-empty">Chưa có phiếu trả hàng nhập.</td></tr>
          </tbody>
        </table>
      </div>
      <Pagination v-model="page" :total-items="filtered.length" :per-page="perPage" item-label="phiếu" @update:per-page="(n) => perPage = n" />
    </div>

    <AdminModal v-model:open="formOpen" title="Tạo phiếu trả hàng nhập" subtitle="Chọn phiếu nhập gốc → tick SP cần trả" size="lg" confirm-text="Tạo phiếu" @confirm="submit">
      <div class="ym-form-group">
        <label>Phiếu nhập gốc</label>
        <select v-model="formPOId" @change="loadPOLines()">
          <option v-for="po in business.purchaseOrders" :key="po.id" :value="po.id">{{ po.code }} - {{ po.supplierName }} ({{ formatPrice(po.total) }})</option>
        </select>
      </div>
      <div class="ym-form-group"><label>Lý do</label><select v-model="formReason"><option v-for="r in reasons" :key="r" :value="r">{{ r }}</option></select></div>

      <h4 style="margin: 14px 0 8px; font-size: 13px; text-transform: uppercase; color: #374151">Sản phẩm cần trả</h4>
      <div v-if="!formLines.length" class="ym-empty" style="padding: 16px">Chọn phiếu nhập để xem SP.</div>
      <label v-for="line in formLines" :key="line.productId" class="ym-rt-line">
        <input v-model="line.checked" type="checkbox" />
        <img :src="line.image" :alt="line.name" />
        <div><strong>{{ line.name }}</strong><small>{{ line.sku }} · {{ formatPrice(line.unitPrice) }}</small></div>
        <input v-model.number="line.quantity" type="number" min="1" :disabled="!line.checked" />
      </label>
    </AdminModal>
  </div>
</template>

<style scoped src="./_admin-shared.css"></style>
<style scoped>
.ym-select { padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 8px; background: #fff; font-size: 14px; width: 100%; }
.ym-rt-line { display: grid; grid-template-columns: 24px 50px 1fr 80px; gap: 10px; align-items: center; padding: 8px; background: #fafbfc; border: 1px solid #f1f3f5; border-radius: 8px; cursor: pointer; margin-bottom: 6px; }
.ym-rt-line:hover { border-color: #326e51; }
.ym-rt-line img { width: 50px; height: 50px; object-fit: contain; padding: 2px; background: #fff; border-radius: 6px; }
.ym-rt-line strong { display: block; font-size: 13px; color: #111827; }
.ym-rt-line small { font-size: 11px; color: #6b7280; }
.ym-rt-line input[type="number"] { padding: 6px 8px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; }
</style>
