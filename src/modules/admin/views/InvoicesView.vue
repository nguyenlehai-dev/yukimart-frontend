<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import RowMenu from '../components/RowMenu.vue'
import Pagination from '../components/Pagination.vue'
import AdminModal from '../components/AdminModal.vue'
import ShopImportExport from '../components/ShopImportExport.vue'
import { useToast } from '../composables/useToast'
import { useShopBusinessStore, type Invoice, type InvoiceStatus } from '../stores/shopBusiness'
import { useImportedAs } from '../composables/useImportedAs'
import { useShopEntity } from '../composables/useShopEntity'
import { formatPrice } from '@/modules/mypage/home/configs'

const invoicesEntity = useShopEntity('invoices')
const salesReturnsEntity = useShopEntity('sales-returns')

const toast = useToast()
const router = useRouter()
const business = useShopBusinessStore()

const imported = useImportedAs<Invoice>('invoices', {
  code: ['ma_hoa_don', 'ma_hd', 'code'],
  orderId: ['ma_don_hang_id', 'order_id'],
  orderCode: ['ma_don_hang', 'ma_don', 'order_code'],
  customerId: ['customer_id', 'ma_khach_hang'],
  customerName: ['ten_khach_hang', 'khach_hang', 'customer_name'],
  itemCount: ['so_san_pham', 'item_count'],
  subtotal: ['tong_phu', 'subtotal'],
  vat: ['vat', 'thue'],
  total: ['tong_tien', 'thanh_tien', 'total'],
  status: ['trang_thai', 'status'],
  paid: ['da_thanh_toan', 'da_thu', 'paid'],
  createdAt: ['ngay_tao', 'created_at'],
}, (raw, m) => ({
  id: Number(raw.id),
  code: String(m.code ?? `HD${raw.id}`),
  orderId: Number(m.orderId ?? 0),
  orderCode: String(m.orderCode ?? ''),
  customerId: Number(m.customerId ?? 0),
  customerName: String(m.customerName ?? ''),
  itemCount: Number(m.itemCount ?? 0),
  subtotal: Number(m.subtotal ?? 0),
  vat: Number(m.vat ?? 0),
  total: Number(m.total ?? 0),
  status: (m.status ?? 'unpaid') as InvoiceStatus,
  paid: Number(m.paid ?? 0),
  createdAt: String(m.createdAt ?? ''),
}))
const allInvoices = computed<Invoice[]>(() => imported.ready.value ? imported.items.value : [])

const statusMap: Record<InvoiceStatus, { label: string; tone: string }> = {
  unpaid: { label: 'Chưa thanh toán', tone: 'warning' },
  paid: { label: 'Đã thanh toán', tone: 'success' },
  partial: { label: 'Thanh toán 1 phần', tone: 'info' },
}

const search = ref(''); const filterStatus = ref<'all' | InvoiceStatus>('all')
const page = ref(1); const perPage = ref(5)
const filtered = computed(() => allInvoices.value.filter((i) => {
  const q = search.value.trim().toLowerCase()
  return (!q || i.code.toLowerCase().includes(q) || i.orderCode.toLowerCase().includes(q) || i.customerName.toLowerCase().includes(q)) && (filterStatus.value === 'all' || i.status === filterStatus.value)
}))
const paginated = computed(() => filtered.value.slice((page.value - 1) * perPage.value, page.value * perPage.value))
watch([search, filterStatus], () => { page.value = 1 })

const stats = computed(() => ({
  total: allInvoices.value.length,
  totalAmount: allInvoices.value.reduce((s, i) => s + i.total, 0),
  totalVat: allInvoices.value.reduce((s, i) => s + i.vat, 0),
  unpaid: allInvoices.value.filter((i) => i.status !== 'paid').length,
  receivable: business.totalReceivable,
}))

// Detail
const detailOpen = ref(false)
const detail = ref<Invoice | null>(null)
function openDetail(inv: Invoice) { detail.value = inv; detailOpen.value = true }

// Mark as paid — wire BE: cập nhật data->status + data->paid trong shop_entries.
async function markPaid(inv: Invoice) {
  try {
    await invoicesEntity.update(inv.id, {
      status: 'paid',
      paid: inv.total,
    })
    await imported.refresh({ force: true })
    toast.success('Đã ghi nhận thanh toán', inv.code)
  } catch (err: any) {
    toast.error('Cập nhật thất bại', err?.response?.data?.message || err?.message || 'Lỗi không xác định')
  }
}

// Create return from invoice
const returnDialog = ref(false)
const returnTarget = ref<Invoice | null>(null)
const returnReason = ref('')
const returnLines = ref<Array<{ productId: number; sku: string; name: string; image: string; unitPrice: number; quantity: number; checked: boolean }>>([])

function openReturn(inv: Invoice) {
  const order = business.getOrder(inv.orderId)
  if (!order) {
    toast.error('Không tìm thấy đơn gốc')
    return
  }
  returnTarget.value = inv
  returnReason.value = ''
  returnLines.value = order.lines.map((l) => ({ ...l, checked: false }))
  returnDialog.value = true
}
async function submitReturn() {
  if (!returnTarget.value) return
  const inv = returnTarget.value
  const lines = returnLines.value.filter((l) => l.checked && l.quantity > 0).map(({ productId, sku, name, image, unitPrice, quantity }) => ({ productId, sku, name, image, unitPrice, quantity }))
  if (!lines.length) {
    toast.error('Chọn ít nhất 1 sản phẩm trả')
    return
  }
  const total = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0)
  const code = `TR-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`

  try {
    await salesReturnsEntity.create({
      code,
      invoice_id: inv.id,
      invoice_code: inv.code,
      order_code: inv.orderCode,
      customer_id: inv.customerId,
      customer_name: inv.customerName,
      lines,
      total,
      refunded: 0,
      reason: returnReason.value || 'Khách trả',
      status: 'pending',
      created_at: new Date().toISOString(),
    })
    toast.success('Đã tạo phiếu trả', code)
    returnDialog.value = false
  } catch (err: any) {
    toast.error('Tạo phiếu trả thất bại', err?.response?.data?.message || err?.message || 'Lỗi không xác định')
  }
}

function gotoOrder(orderId: number) { router.push('/admin/orders'); toast.info('Đi tới đặt hàng', business.getOrder(orderId)?.code || '') }

const rowMenu = (inv: Invoice) => {
  const items: { key: string; label: string; icon: string; tone?: 'danger' }[] = [
    { key: 'view', label: 'Xem chi tiết', icon: 'ri-eye-line' },
    { key: 'order', label: 'Đi tới đơn gốc', icon: 'ri-shopping-bag-line' },
  ]
  if (inv.status !== 'paid') items.push({ key: 'pay', label: 'Ghi nhận thanh toán', icon: 'ri-bank-card-line' })
  items.push({ key: 'return', label: 'Tạo phiếu trả hàng', icon: 'ri-arrow-go-back-line' })
  items.push({ key: 'print', label: 'In hoá đơn', icon: 'ri-printer-line' })
  return items
}
function onAction(inv: Invoice, key: string) {
  if (key === 'view') openDetail(inv)
  else if (key === 'order') gotoOrder(inv.orderId)
  else if (key === 'pay') markPaid(inv)
  else if (key === 'return') openReturn(inv)
  else toast.info('Tính năng demo', inv.code)
}
</script>

<template>
  <div class="ym-page">
    <header class="ym-page__header">
      <div>
        <h1>Hóa đơn</h1>
        <p>Hoá đơn được sinh từ Đơn hàng. Có thể tạo Phiếu trả hàng từ hoá đơn.</p>
      </div>
      <div class="ym-page__actions">
        <ShopImportExport entity="invoices" id-field="code" label="hóa đơn" @imported="imported.refresh" />
      </div>
    </header>

    <section class="ym-mini-stats">
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Tổng HĐ</p><p class="ym-mini-stat__value">{{ stats.total }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Tổng doanh thu</p><p class="ym-mini-stat__value" style="color: #326e51">{{ formatPrice(stats.totalAmount) }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Tổng VAT</p><p class="ym-mini-stat__value">{{ formatPrice(stats.totalVat) }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Chưa thu</p><p class="ym-mini-stat__value" style="color: #d0021b">{{ formatPrice(stats.receivable) }}</p></article>
    </section>

    <div class="ym-card">
      <div class="ym-toolbar">
        <div class="ym-search"><i class="ri-search-line"></i><input v-model="search" type="text" placeholder="Tìm theo mã HĐ, đơn hàng, khách..." /></div>
        <div class="ym-toolbar__actions"><select v-model="filterStatus" class="ym-select"><option value="all">Tất cả</option><option v-for="(v, k) in statusMap" :key="k" :value="k">{{ v.label }}</option></select></div>
      </div>
      <div class="ym-table-wrap">
        <table class="ym-table">
          <thead><tr><th>Mã HĐ</th><th>Đơn hàng</th><th>Khách hàng</th><th class="is-center">SP</th><th class="is-right">Tổng</th><th class="is-right">Đã thu</th><th>Trạng thái</th><th>Thời gian</th><th></th></tr></thead>
          <tbody>
            <tr v-for="i in paginated" :key="i.id">
              <td><a href="#" class="ym-link" @click.prevent="openDetail(i)">{{ i.code }}</a></td>
              <td><a href="#" class="ym-link" @click.prevent="gotoOrder(i.orderId)"><i class="ri-shopping-bag-line"></i> {{ i.orderCode }}</a></td>
              <td>{{ i.customerName }}</td>
              <td class="is-center">{{ i.itemCount }}</td>
              <td class="is-right"><strong>{{ formatPrice(i.total) }}</strong></td>
              <td class="is-right is-muted">{{ formatPrice(i.paid) }}</td>
              <td><span :class="['ym-tag', `ym-tag--${statusMap[i.status]?.tone || 'neutral'}`]">{{ statusMap[i.status]?.label || i.status }}</span></td>
              <td class="is-muted">{{ i.createdAt }}</td>
              <td class="is-right"><RowMenu :items="rowMenu(i)" @select="onAction(i, $event)" /></td>
            </tr>
            <tr v-if="!paginated.length"><td colspan="9" class="ym-empty">Không có hoá đơn.</td></tr>
          </tbody>
        </table>
      </div>
      <Pagination v-model="page" :total-items="filtered.length" :per-page="perPage" item-label="hoá đơn" @update:per-page="(n) => perPage = n" />
    </div>

    <!-- Detail modal -->
    <AdminModal v-if="detail" v-model:open="detailOpen" :title="detail.code" subtitle="Chi tiết hoá đơn" size="lg" hide-footer>
      <div class="ym-detail-related" style="margin-bottom: 14px">
        <a href="#" class="ym-detail-chip" @click.prevent="gotoOrder(detail.orderId)">
          <i class="ri-shopping-bag-line"></i> Đơn gốc: <strong>{{ detail.orderCode }}</strong>
        </a>
        <span class="ym-tag" :class="`ym-tag--${statusMap[detail.status]?.tone || 'neutral'}`">{{ statusMap[detail.status]?.label || detail.status }}</span>
      </div>
      <div class="ym-detail-grid">
        <div><label>Khách hàng</label><strong>{{ detail.customerName }}</strong></div>
        <div><label>Số mặt hàng</label><strong>{{ detail.itemCount }}</strong></div>
        <div><label>Tạm tính</label><strong>{{ formatPrice(detail.subtotal) }}</strong></div>
        <div><label>VAT (10%)</label><strong>{{ formatPrice(detail.vat) }}</strong></div>
        <div><label>Tổng tiền</label><strong style="color: #326e51">{{ formatPrice(detail.total) }}</strong></div>
        <div><label>Đã thu</label><strong>{{ formatPrice(detail.paid) }}</strong></div>
        <div><label>Còn nợ</label><strong style="color: #d0021b">{{ formatPrice(detail.total - detail.paid) }}</strong></div>
        <div><label>Ngày tạo</label><strong>{{ detail.createdAt }}</strong></div>
      </div>
      <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 14px">
        <button v-if="detail.status !== 'paid'" type="button" class="ym-btn ym-btn--primary" @click="markPaid(detail!); detailOpen = false">
          <i class="ri-bank-card-line"></i> Ghi nhận thanh toán
        </button>
        <button type="button" class="ym-btn" @click="detailOpen = false; openReturn(detail!)">
          <i class="ri-arrow-go-back-line"></i> Tạo phiếu trả
        </button>
      </div>
    </AdminModal>

    <!-- Return dialog -->
    <AdminModal v-if="returnTarget" v-model:open="returnDialog" :title="`Tạo phiếu trả từ ${returnTarget.code}`" size="lg" confirm-text="Tạo phiếu trả" @confirm="submitReturn">
      <p style="margin: 0 0 12px; font-size: 13px; color: #6b7280">Chọn sản phẩm khách muốn trả. Tồn kho sẽ được hoàn lại khi duyệt phiếu.</p>
      <div class="ym-return-list">
        <label v-for="line in returnLines" :key="line.productId" class="ym-return-line">
          <input v-model="line.checked" type="checkbox" />
          <img :src="line.image" :alt="line.name" />
          <div>
            <strong>{{ line.name }}</strong>
            <small>{{ line.sku }} · {{ formatPrice(line.unitPrice) }}</small>
          </div>
          <input v-model.number="line.quantity" type="number" min="1" :disabled="!line.checked" />
        </label>
      </div>
      <div class="ym-form-group" style="margin-top: 14px">
        <label>Lý do trả hàng</label>
        <textarea v-model="returnReason" rows="2" placeholder="Hàng lỗi / Đổi mẫu / Không vừa ý..."></textarea>
      </div>
    </AdminModal>
  </div>
</template>

<style scoped src="./_admin-shared.css"></style>
<style scoped>
.ym-select { padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 8px; background: #fff; font-size: 14px; }
.ym-detail-related { display: flex; gap: 8px; align-items: center; padding: 12px; background: #f3f6f4; border-radius: 10px; }
.ym-detail-chip { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; background: #fff; border: 1px solid #d1e0d6; border-radius: 999px; font-size: 13px; color: #1f2937; text-decoration: none; }
.ym-detail-chip:hover { border-color: #326e51; color: #326e51; }
.ym-detail-chip strong { color: #326e51; }
.ym-detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 24px; background: #fafbfc; padding: 14px; border-radius: 10px; border: 1px solid #f1f3f5; }
.ym-detail-grid > div { display: flex; flex-direction: column; gap: 2px; }
.ym-detail-grid label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.4px; color: #6b7280; }
.ym-detail-grid strong { font-size: 14px; color: #111827; font-weight: 500; }

.ym-return-list { display: flex; flex-direction: column; gap: 8px; max-height: 400px; overflow-y: auto; }
.ym-return-line { display: grid; grid-template-columns: 24px 50px 1fr 80px; gap: 10px; align-items: center; padding: 8px; background: #fafbfc; border: 1px solid #f1f3f5; border-radius: 8px; cursor: pointer; }
.ym-return-line:hover { border-color: #326e51; }
.ym-return-line img { width: 50px; height: 50px; object-fit: contain; padding: 2px; background: #fff; border: 1px solid #f1f3f5; border-radius: 6px; }
.ym-return-line div strong { display: block; font-size: 13px; color: #111827; }
.ym-return-line div small { font-size: 11px; color: #6b7280; }
.ym-return-line input[type="number"] { padding: 6px 8px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; }
</style>
