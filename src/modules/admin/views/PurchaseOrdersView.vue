<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import AdminModal from '../components/AdminModal.vue'
import RowMenu from '../components/RowMenu.vue'
import Pagination from '../components/Pagination.vue'
import ShopImportExport from '../components/ShopImportExport.vue'
import { useToast } from '../composables/useToast'
import { useAdminDataStore } from '../stores/adminData'
import { useShopBusinessStore, type PurchaseOrder, type PurchaseStatus, type OrderLine } from '../stores/shopBusiness'
import { useImportedAs } from '../composables/useImportedAs'
import { formatPrice } from '@/modules/mypage/home/configs'

const toast = useToast()
const router = useRouter()
const adminData = useAdminDataStore()
const business = useShopBusinessStore()

const imported = useImportedAs<PurchaseOrder>('purchase-orders', {
  code: ['ma_phieu', 'ma_don', 'code'],
  supplierId: ['supplier_id', 'ma_ncc_id'],
  supplierCode: ['ma_ncc', 'supplier_code'],
  supplierName: ['ten_ncc', 'ten_nha_cung_cap', 'supplier_name'],
  total: ['tong_tien', 'total'],
  paid: ['da_thanh_toan', 'paid'],
  status: ['trang_thai', 'status'],
  invoiceId: ['invoice_id'],
  createdAt: ['ngay_tao', 'created_at'],
  note: ['ghi_chu', 'note'],
}, (raw, m) => ({
  id: Number(raw.id),
  code: String(m.code ?? `NH${raw.id}`),
  supplierId: Number(m.supplierId ?? 0),
  supplierCode: String(m.supplierCode ?? ''),
  supplierName: String(m.supplierName ?? ''),
  lines: [],
  total: Number(m.total ?? 0),
  paid: Number(m.paid ?? 0),
  status: (() => {
    const s = String(m.status ?? '').toLowerCase()
    if (['draft', 'received', 'partial', 'cancelled'].includes(s)) return s as PurchaseStatus
    return 'draft' as PurchaseStatus
  })(),
  invoiceId: m.invoiceId !== undefined && m.invoiceId !== null ? Number(m.invoiceId) : null,
  createdAt: String(m.createdAt ?? ''),
  note: m.note ? String(m.note) : undefined,
}))
const allPOs = computed<PurchaseOrder[]>(() => imported.hasData.value ? imported.items.value : business.purchaseOrders)

const statusMap: Record<PurchaseStatus, { label: string; tone: string }> = {
  draft: { label: 'Phiếu tạm', tone: 'neutral' },
  received: { label: 'Đã nhập kho', tone: 'success' },
  partial: { label: 'Nhập một phần', tone: 'warning' },
  cancelled: { label: 'Đã huỷ', tone: 'danger' },
}

const search = ref(''); const filterStatus = ref<'all' | PurchaseStatus>('all')
const page = ref(1); const perPage = ref(5)
const filtered = computed(() => allPOs.value.filter((o) => {
  const q = search.value.trim().toLowerCase()
  return (!q || o.code.toLowerCase().includes(q) || o.supplierName.toLowerCase().includes(q)) && (filterStatus.value === 'all' || o.status === filterStatus.value)
}))
const paginated = computed(() => filtered.value.slice((page.value - 1) * perPage.value, page.value * perPage.value))
watch([search, filterStatus], () => { page.value = 1 })

const stats = computed(() => ({
  total: allPOs.value.length,
  totalAmount: allPOs.value.reduce((s, o) => s + o.total, 0),
  totalDebt: business.totalSupplierDebt,
  pending: allPOs.value.filter((o) => o.status === 'draft' || o.status === 'partial').length,
}))

// Detail
const detailOpen = ref(false)
const detail = ref<PurchaseOrder | null>(null)
function openDetail(o: PurchaseOrder) { detail.value = o; detailOpen.value = true }

// Create PO modal
type FormState = { supplierId: number; lines: OrderLine[]; note: string }
const formOpen = ref(false)
const form = ref<FormState>({ supplierId: 0, lines: [], note: '' })
const productPickerSearch = ref('')

const formTotal = computed(() => form.value.lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0))
const productSearchResults = computed(() => {
  const q = productPickerSearch.value.trim().toLowerCase()
  if (!q) return adminData.products.slice(0, 8)
  return adminData.products.filter((p) =>
    p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)
  ).slice(0, 12)
})

function openCreate() {
  form.value = { supplierId: business.suppliers[0]?.id || 0, lines: [], note: '' }
  productPickerSearch.value = ''
  formOpen.value = true
}
function addLine(productId: number) {
  const existing = form.value.lines.find((l) => l.productId === productId)
  if (existing) { existing.quantity++; return }
  const p = adminData.findProduct(productId)
  if (!p) return
  form.value.lines.push({ productId: p.id, sku: p.sku, name: p.name, image: p.image, unitPrice: p.cost, quantity: 1 })
  productPickerSearch.value = ''
}
function removeLine(idx: number) { form.value.lines.splice(idx, 1) }
function submit() {
  if (!form.value.supplierId || !form.value.lines.length) {
    toast.error('Thiếu NCC hoặc sản phẩm')
    return
  }
  const po = business.createPurchaseOrder(form.value.supplierId, form.value.lines, form.value.note)
  if (po) {
    toast.success('Đã tạo phiếu nhập', po.code)
    formOpen.value = false
  }
}

function receive(po: PurchaseOrder) {
  if (po.status === 'received') { toast.info('Phiếu đã nhập trước đó', po.code); return }
  if (!confirm(`Xác nhận đã nhận hàng cho ${po.code}? Tồn kho và công nợ NCC sẽ tự cập nhật.`)) return
  business.receivePurchaseOrder(po.id)
  toast.success('Đã nhập kho', po.code)
}
function gotoSupplier(_supplierId: number) { router.push('/admin/suppliers') }
function gotoInvoice(_invoiceId: number | null) { if (_invoiceId) router.push('/admin/purchase-invoices') }

const rowMenu = (po: PurchaseOrder) => {
  const items: { key: string; label: string; icon: string; tone?: 'danger' }[] = [
    { key: 'view', label: 'Xem chi tiết', icon: 'ri-eye-line' },
    { key: 'supplier', label: 'Đi tới NCC', icon: 'ri-store-line' },
  ]
  if (po.status === 'draft' || po.status === 'partial') {
    items.push({ key: 'receive', label: 'Xác nhận nhận hàng', icon: 'ri-check-double-line' })
  }
  if (po.invoiceId) items.push({ key: 'invoice', label: 'Đi tới HĐ đầu vào', icon: 'ri-bill-line' })
  items.push({ key: 'print', label: 'In phiếu', icon: 'ri-printer-line' })
  items.push({ key: 'delete', label: 'Xoá', icon: 'ri-delete-bin-line', tone: 'danger' })
  return items
}
function onAction(po: PurchaseOrder, key: string) {
  if (key === 'view') openDetail(po)
  else if (key === 'supplier') gotoSupplier(po.supplierId)
  else if (key === 'receive') receive(po)
  else if (key === 'invoice') gotoInvoice(po.invoiceId)
  else if (key === 'delete') {
    business.purchaseOrders.splice(business.purchaseOrders.findIndex((x) => x.id === po.id), 1)
    toast.success('Đã xoá', po.code)
  } else toast.info('Tính năng demo', po.code)
}
</script>

<template>
  <div class="ym-page">
    <header class="ym-page__header">
      <div>
        <h1>Nhập hàng</h1>
        <p>Tạo phiếu nhập → Nhận hàng → Tồn kho tự cộng + Ghi nhận công nợ NCC.</p>
      </div>
      <div class="ym-page__actions">
        <ShopImportExport entity="purchase-orders" id-field="code" label="phiếu nhập hàng" @imported="imported.refresh" />
        <button type="button" class="ym-btn ym-btn--primary" @click="openCreate"><i class="ri-add-line"></i> Tạo phiếu nhập</button>
      </div>
    </header>

    <section class="ym-mini-stats">
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Tổng phiếu</p><p class="ym-mini-stat__value">{{ stats.total }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Tổng giá trị</p><p class="ym-mini-stat__value" style="color: #326e51">{{ formatPrice(stats.totalAmount) }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Công nợ NCC</p><p class="ym-mini-stat__value" style="color: #d0021b">{{ formatPrice(stats.totalDebt) }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Đang xử lý</p><p class="ym-mini-stat__value" style="color: #92400e">{{ stats.pending }}</p></article>
    </section>

    <div class="ym-card">
      <div class="ym-toolbar">
        <div class="ym-search"><i class="ri-search-line"></i><input v-model="search" type="text" placeholder="Tìm theo mã phiếu, NCC..." /></div>
        <div class="ym-toolbar__actions"><select v-model="filterStatus" class="ym-select"><option value="all">Tất cả</option><option v-for="(v, k) in statusMap" :key="k" :value="k">{{ v.label }}</option></select></div>
      </div>
      <div class="ym-table-wrap">
        <table class="ym-table">
          <thead><tr><th>Mã phiếu</th><th>NCC</th><th class="is-center">SP</th><th class="is-right">Giá trị</th><th class="is-right">Đã trả</th><th>HĐ đầu vào</th><th>Trạng thái</th><th>Thời gian</th><th></th></tr></thead>
          <tbody>
            <tr v-for="o in paginated" :key="o.id">
              <td><a href="#" class="ym-link" @click.prevent="openDetail(o)">{{ o.code }}</a></td>
              <td><a href="#" class="ym-link" @click.prevent="gotoSupplier(o.supplierId)">{{ o.supplierName }}</a></td>
              <td class="is-center">{{ o.lines.reduce((s, l) => s + l.quantity, 0) }}</td>
              <td class="is-right"><strong>{{ formatPrice(o.total) }}</strong></td>
              <td class="is-right is-muted">{{ formatPrice(o.paid) }}</td>
              <td>
                <button v-if="o.invoiceId" type="button" class="ym-link-chip" @click="gotoInvoice(o.invoiceId)">
                  <i class="ri-bill-line"></i> HĐV
                </button>
                <span v-else class="is-muted" style="font-size: 12px">—</span>
              </td>
              <td><span :class="['ym-tag', `ym-tag--${statusMap[o.status]?.tone || 'neutral'}`]">{{ statusMap[o.status]?.label || o.status }}</span></td>
              <td class="is-muted">{{ o.createdAt }}</td>
              <td class="is-right"><RowMenu :items="rowMenu(o)" @select="onAction(o, $event)" /></td>
            </tr>
            <tr v-if="!paginated.length"><td colspan="9" class="ym-empty">Chưa có phiếu nhập.</td></tr>
          </tbody>
        </table>
      </div>
      <Pagination v-model="page" :total-items="filtered.length" :per-page="perPage" item-label="phiếu" @update:per-page="(n) => perPage = n" />
    </div>

    <!-- Create modal -->
    <AdminModal v-model:open="formOpen" title="Tạo phiếu nhập kho" subtitle="Chọn NCC → Chọn sản phẩm → Lưu phiếu" size="xl" confirm-text="Lưu phiếu" @confirm="submit">
      <div class="ym-form-group">
        <label>Nhà cung cấp *</label>
        <select v-model="form.supplierId">
          <option v-for="s in business.suppliers" :key="s.id" :value="s.id">{{ s.code }} - {{ s.name }}</option>
        </select>
      </div>

      <h4 style="margin: 14px 0 8px; font-size: 13px; text-transform: uppercase; color: #374151">Sản phẩm nhập</h4>
      <div class="ym-product-picker">
        <div class="ym-search"><i class="ri-search-line"></i><input v-model="productPickerSearch" type="text" placeholder="Tìm sản phẩm..." /></div>
        <div v-if="productPickerSearch" class="ym-picker-results">
          <button v-for="p in productSearchResults" :key="p.id" type="button" class="ym-picker-item" @click="addLine(p.id)">
            <img :src="p.image" :alt="p.name" />
            <div>
              <strong>{{ p.name }}</strong>
              <small>{{ p.sku }} · Giá vốn: {{ formatPrice(p.cost) }} · Tồn: {{ p.stock }}</small>
            </div>
            <i class="ri-add-line"></i>
          </button>
        </div>
      </div>

      <div v-if="!form.lines.length" class="ym-empty" style="padding: 20px; border: 1px dashed #e5e7eb; border-radius: 10px">
        Chưa chọn sản phẩm. Tìm và thêm vào phiếu nhập.
      </div>
      <div v-for="(line, idx) in form.lines" :key="line.productId" class="ym-line">
        <img :src="line.image" :alt="line.name" />
        <div class="ym-line__info"><strong>{{ line.name }}</strong><small>{{ line.sku }}</small></div>
        <input v-model.number="line.unitPrice" type="number" min="0" class="ym-line__input" placeholder="Giá nhập" />
        <input v-model.number="line.quantity" type="number" min="1" class="ym-line__input" />
        <strong class="ym-line__sum">{{ formatPrice(line.unitPrice * line.quantity) }}</strong>
        <button type="button" class="ym-icon-btn" @click="removeLine(idx)"><i class="ri-delete-bin-line"></i></button>
      </div>

      <div class="ym-po-total">
        <span>Tổng giá trị nhập</span>
        <strong>{{ formatPrice(formTotal) }}</strong>
      </div>

      <div class="ym-form-group" style="margin-top: 12px"><label>Ghi chú</label><textarea v-model="form.note" rows="2"></textarea></div>
    </AdminModal>

    <!-- Detail modal -->
    <AdminModal v-if="detail" v-model:open="detailOpen" :title="detail.code" :subtitle="`NCC: ${detail.supplierName}`" size="lg" hide-footer>
      <div style="display: flex; gap: 8px; margin-bottom: 12px; align-items: center">
        <span :class="['ym-tag', `ym-tag--${statusMap[detail.status]?.tone || 'neutral'}`]">{{ statusMap[detail.status]?.label || detail.status }}</span>
        <span style="color: #6b7280; font-size: 13px">Tạo lúc {{ detail.createdAt }}</span>
        <button v-if="detail.invoiceId" type="button" class="ym-link-chip" @click="gotoInvoice(detail.invoiceId)">
          <i class="ri-bill-line"></i> HĐ đầu vào
        </button>
      </div>

      <div v-for="line in detail.lines" :key="line.productId" class="ym-line ym-line--readonly">
        <img :src="line.image" :alt="line.name" />
        <div class="ym-line__info"><strong>{{ line.name }}</strong><small>{{ line.sku }}</small></div>
        <span class="is-muted">{{ formatPrice(line.unitPrice) }} × {{ line.quantity }}</span>
        <strong class="ym-line__sum">{{ formatPrice(line.unitPrice * line.quantity) }}</strong>
      </div>

      <div class="ym-po-total" style="margin-top: 14px">
        <span>Tổng giá trị</span>
        <strong>{{ formatPrice(detail.total) }}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 4px 14px; font-size: 14px; color: #4b5563">
        <span>Đã thanh toán</span><span>{{ formatPrice(detail.paid) }}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 4px 14px; font-size: 14px; color: #d0021b">
        <span>Còn nợ NCC</span><strong>{{ formatPrice(detail.total - detail.paid) }}</strong>
      </div>

      <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 14px">
        <button v-if="detail.status === 'draft' || detail.status === 'partial'" type="button" class="ym-btn ym-btn--primary" @click="receive(detail!); detailOpen = false">
          <i class="ri-check-double-line"></i> Xác nhận nhận hàng
        </button>
      </div>
    </AdminModal>
  </div>
</template>

<style scoped src="./_admin-shared.css"></style>
<style scoped>
.ym-select { padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 8px; background: #fff; font-size: 14px; width: 100%; }
.ym-link-chip { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border: 1px solid #e5e7eb; background: #f3f6f4; color: #326e51; font-size: 11px; font-weight: 600; border-radius: 999px; cursor: pointer; }
.ym-link-chip:hover { background: #e8f0ec; }

.ym-product-picker { position: relative; margin-bottom: 12px; }
.ym-picker-results { position: absolute; top: calc(100% + 4px); left: 0; right: 0; background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08); max-height: 320px; overflow-y: auto; z-index: 10; }
.ym-picker-item { display: flex; align-items: center; gap: 10px; width: 100%; padding: 8px 12px; border: none; background: transparent; text-align: left; cursor: pointer; border-bottom: 1px solid #f1f3f5; }
.ym-picker-item:hover { background: #f3f6f4; }
.ym-picker-item img { width: 36px; height: 36px; object-fit: contain; padding: 2px; background: #fafbfc; border: 1px solid #f1f3f5; border-radius: 6px; }
.ym-picker-item > div { flex: 1; min-width: 0; }
.ym-picker-item strong { display: block; font-size: 13px; color: #111827; }
.ym-picker-item small { font-size: 11px; color: #6b7280; }
.ym-picker-item i { color: #326e51; font-size: 18px; }

.ym-line { display: grid; grid-template-columns: 50px 1fr 110px 80px 100px 32px; gap: 10px; align-items: center; padding: 8px; background: #fafbfc; border: 1px solid #f1f3f5; border-radius: 8px; margin-bottom: 6px; }
.ym-line--readonly { grid-template-columns: 50px 1fr 140px 100px; }
.ym-line img { width: 50px; height: 50px; object-fit: contain; padding: 2px; background: #fff; border: 1px solid #f1f3f5; border-radius: 6px; }
.ym-line__info { min-width: 0; }
.ym-line__info strong { display: block; font-size: 13px; color: #111827; }
.ym-line__info small { font-size: 11px; color: #6b7280; }
.ym-line__input { padding: 6px 8px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; background: #fff; }
.ym-line__sum { color: #326e51; text-align: right; font-size: 14px; }

.ym-po-total { display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; background: #e8f0ec; border-radius: 10px; margin-top: 10px; font-size: 14px; }
.ym-po-total strong { color: #326e51; font-size: 18px; }
</style>
