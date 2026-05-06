<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import AdminModal from '../components/AdminModal.vue'
import RowMenu from '../components/RowMenu.vue'
import Pagination from '../components/Pagination.vue'
import ShopImportExport from '../components/ShopImportExport.vue'
import { useToast } from '../composables/useToast'
import { useAdminDataStore } from '../stores/adminData'
import { useShopBusinessStore, type Order, type OrderStatus, type OrderLine, type Customer, type Payment } from '../stores/shopBusiness'
import { useImportedAs } from '../composables/useImportedAs'
import { useShopEntity } from '../composables/useShopEntity'
import { useServerPagedList } from '../composables/useServerPagedList'
import { formatPrice } from '@/modules/mypage/home/configs'

const ordersEntity = useShopEntity('orders')
const invoicesEntity = useShopEntity('invoices')
const shipmentsEntity = useShopEntity('shipments')

const toast = useToast()
const router = useRouter()
const adminData = useAdminDataStore()
const business = useShopBusinessStore()

function formatDateTime(value: any): string {
  if (!value) return ''
  const s = String(value)
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
    const d = new Date(s)
    return isNaN(d.getTime()) ? s : d.toLocaleString('vi-VN')
  }
  return s
}

function rowToOrder(raw: any): Order {
  const c = (raw.customer ?? null) as null | { firstName?: string; lastName?: string; phone?: string; email?: string; address?: string; city?: string; country?: string }
  const fallbackName = c ? `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() : ''
  const fallbackAddress = c ? [c.address, c.city, c.country].filter(Boolean).join(', ') : ''
  const detail = Array.isArray(raw.items_detail ?? raw.lines) ? (raw.items_detail ?? raw.lines) as any[] : []
  const lines: OrderLine[] = detail.map((d: any) => ({
    productId: Number(d.id ?? d.productId ?? 0),
    sku: String(d.sku ?? ''),
    name: String(d.name ?? ''),
    image: String(d.image ?? ''),
    unitPrice: Number(d.price ?? d.unitPrice ?? 0),
    quantity: Number(d.quantity ?? 1),
  }))
  const paymentRaw = String(raw.payment ?? raw.thanh_toan ?? 'cod').toLowerCase()
  const payment: Payment = (['cod', 'bank', 'momo', 'card'] as Payment[]).includes(paymentRaw as Payment)
    ? (paymentRaw as Payment)
    : 'cod'

  return {
    id: Number(raw.id),
    code: String(raw.code ?? raw.ma_don_hang ?? raw.ma_don ?? `#YM${raw.id}`),
    customerId: Number(raw.customer_id ?? raw.user_id ?? raw.ma_khach_hang ?? 0),
    customerName: String(raw.customer_name ?? raw.ten_khach_hang ?? raw.khach_hang ?? raw.name ?? fallbackName),
    customerEmail: String(raw.customer_email ?? raw.email ?? c?.email ?? ''),
    customerPhone: String(raw.customer_phone ?? raw.dien_thoai ?? raw.sdt ?? raw.phone ?? c?.phone ?? ''),
    customerAddress: String(raw.customer_address ?? raw.dia_chi ?? raw.address ?? fallbackAddress),
    lines,
    subtotal: Number(raw.subtotal ?? raw.tong_phu ?? 0),
    discount: Number(raw.discount ?? raw.giam_gia ?? 0),
    total: Number(raw.total ?? raw.tong_tien ?? raw.thanh_tien ?? 0),
    payment,
    status: (raw.status ?? raw.trang_thai ?? 'pending') as OrderStatus,
    invoiceId: raw.invoice_id ?? raw.invoiceId ? Number(raw.invoice_id ?? raw.invoiceId) : null,
    shipmentId: raw.shipment_id ?? raw.shipmentId ? Number(raw.shipment_id ?? raw.shipmentId) : null,
    createdAt: formatDateTime(raw.created_at ?? raw.createdAt ?? raw.ngay_tao ?? ''),
    note: raw.note ? String(raw.note) : undefined,
  }
}

const statusMap: Record<OrderStatus, { label: string; tone: string }> = {
  pending: { label: 'Chờ xác nhận', tone: 'warning' },
  processing: { label: 'Đang xử lý', tone: 'info' },
  shipping: { label: 'Đang giao', tone: 'primary' },
  completed: { label: 'Hoàn thành', tone: 'success' },
  cancelled: { label: 'Đã huỷ', tone: 'danger' },
}
const paymentMap = { cod: 'COD', bank: 'Chuyển khoản', momo: 'MoMo', card: 'Thẻ' }

const filterStatus = ref<'all' | OrderStatus>('all')
const search = ref('')
const selected = ref<number[]>([])
const page = ref(1)
const perPage = ref(20)

// Server-side pagination + filter status. Đổi tab status hoặc gõ search → refetch.
const imported = useServerPagedList<Order>('orders', () => ({
  page: page.value,
  perPage: perPage.value,
  q: search.value.trim(),
  status: filterStatus.value === 'all' ? '' : filterStatus.value,
}), { mapper: rowToOrder })

const tabs: { key: 'all' | OrderStatus; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'pending', label: 'Chờ xác nhận' },
  { key: 'processing', label: 'Đang xử lý' },
  { key: 'shipping', label: 'Đang giao' },
  { key: 'completed', label: 'Hoàn thành' },
  { key: 'cancelled', label: 'Đã huỷ' },
]

// Tab counts: BE chưa có aggregate by status — tính trên page hiện tại + total.
// Khi user click tab, server-side filter chính xác kết quả.
const counts = computed(() => {
  const map: Record<string, number> = { all: imported.meta.value.total }
  for (const o of imported.items.value) map[o.status] = (map[o.status] || 0) + 1
  return map
})

const paginated = computed(() => imported.items.value)
watch([filterStatus, search], () => { page.value = 1; selected.value = [] })

const allSelected = computed(() => paginated.value.length > 0 && paginated.value.every((o) => selected.value.includes(o.id)))
function toggleAll() {
  if (allSelected.value) selected.value = selected.value.filter((id) => !paginated.value.some((o) => o.id === id))
  else selected.value = [...new Set([...selected.value, ...paginated.value.map((o) => o.id)])]
}
function toggleOne(id: number) {
  selected.value = selected.value.includes(id) ? selected.value.filter((x) => x !== id) : [...selected.value, id]
}

// ── Form ──
type FormState = Omit<Order, 'id' | 'code' | 'createdAt' | 'subtotal' | 'discount' | 'total' | 'invoiceId' | 'shipmentId'>
function emptyForm(): FormState {
  return { customerId: 0, customerName: '', customerEmail: '', customerPhone: '', customerAddress: '', lines: [], payment: 'cod', status: 'pending', note: '' }
}
const formOpen = ref(false)
const detailOpen = ref(false)
const statusOpen = ref(false)
const confirmOpen = ref(false)
const shipmentDialog = ref(false)
const form = ref<FormState>(emptyForm())
const editingId = ref<number | null>(null)
const detail = ref<Order | null>(null)
const statusTarget = ref<Order | null>(null)
const newStatus = ref<OrderStatus>('pending')
const productPickerSearch = ref('')
const customerSearch = ref('')
const confirmCtx = ref<{ title: string; message: string; tone: 'danger' | 'primary'; action: () => void } | null>(null)
const shipmentTarget = ref<Order | null>(null)
const shipmentPartner = ref<{ name: string; code: string; fee: number }>({ name: 'Giao Hàng Nhanh', code: 'GHN', fee: 28000 })

const formCustomer = computed<Customer | null>(() => business.getCustomer(form.value.customerId))
const formGroup = computed(() => formCustomer.value ? business.getCustomerGroup(formCustomer.value.groupId) : null)
const formSubtotal = computed(() => form.value.lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0))
const formDiscount = computed(() => formGroup.value && formGroup.value.discount > 0 ? Math.round(formSubtotal.value * formGroup.value.discount / 100) : 0)
const formTotal = computed(() => formSubtotal.value - formDiscount.value)

const productSearchResults = computed(() => {
  const q = productPickerSearch.value.trim().toLowerCase()
  if (!q) return adminData.products.slice(0, 8)
  return adminData.products.filter((p) =>
    p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)
  ).slice(0, 12)
})

const customerResults = computed(() => {
  const q = customerSearch.value.trim().toLowerCase()
  if (!q) return business.customers.slice(0, 6)
  return business.customers.filter((c) =>
    c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone.includes(q)
  ).slice(0, 8)
})

function pickCustomer(c: Customer) {
  form.value.customerId = c.id
  form.value.customerName = c.name
  form.value.customerEmail = c.email
  form.value.customerPhone = c.phone
  customerSearch.value = ''
  // Recompute prices for existing lines based on new customer's group
  form.value.lines = form.value.lines.map((l) => ({ ...l, unitPrice: business.priceForCustomer(l.productId, c.id) }))
}

function addLine(productId: number) {
  const existing = form.value.lines.find((l) => l.productId === productId)
  if (existing) { existing.quantity++; return }
  const p = adminData.findProduct(productId)
  if (!p) return
  const unitPrice = form.value.customerId ? business.priceForCustomer(productId, form.value.customerId) : p.salePrice
  form.value.lines.push({ productId: p.id, sku: p.sku, name: p.name, image: p.image, unitPrice, quantity: 1 })
  productPickerSearch.value = ''
}

function removeLine(idx: number) { form.value.lines.splice(idx, 1) }

function openCreate() {
  editingId.value = null
  form.value = emptyForm()
  formOpen.value = true
}

function openEdit(order: Order) {
  editingId.value = order.id
  form.value = {
    customerId: order.customerId, customerName: order.customerName, customerEmail: order.customerEmail,
    customerPhone: order.customerPhone, customerAddress: order.customerAddress,
    lines: order.lines.map((l) => ({ ...l })),
    payment: order.payment, status: order.status, note: order.note,
  }
  formOpen.value = true
}

async function submitForm() {
  if (!form.value.customerName || !form.value.customerEmail || !form.value.customerPhone) {
    toast.error('Thiếu thông tin', 'Tên, email và SĐT là bắt buộc.'); return
  }
  if (!form.value.lines.length) { toast.error('Đơn không có sản phẩm'); return }

  // Gửi cả camelCase lẫn snake_case để admin (đọc snake) + AccountOrders (đọc camel) đều thấy.
  const payload: Record<string, any> = {
    customer_name: form.value.customerName,
    customer_email: form.value.customerEmail,
    customer_phone: form.value.customerPhone,
    customer_address: form.value.customerAddress,
    customer_id: form.value.customerId,
    payment: form.value.payment,
    payment_method: form.value.payment === 'bank' ? 'Chuyển khoản ngân hàng'
      : form.value.payment === 'cod' ? 'Trả tiền mặt khi nhận hàng'
      : form.value.payment,
    status: form.value.status,
    note: form.value.note ?? '',
    items: form.value.lines.reduce((s, l) => s + l.quantity, 0),
    items_detail: form.value.lines.map((l) => ({
      id: l.productId, name: l.name, image: l.image,
      price: l.unitPrice, quantity: l.quantity, sku: l.sku,
    })),
    subtotal: formSubtotal.value,
    discount: formDiscount.value,
    total: formTotal.value,
  }

  try {
    if (editingId.value) {
      await ordersEntity.update(editingId.value, payload)
      await imported.refresh()
      toast.success('Đã cập nhật đơn')
    } else {
      const code = `YM-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`
      await ordersEntity.create({ ...payload, code, created_at: new Date().toISOString() })
      await imported.refresh()
      // Trừ tồn kho local (BE chưa gắn pipeline trừ kho).
      for (const l of form.value.lines) adminData.adjustStock(l.productId, -l.quantity).catch(() => {})
      toast.success('Đã tạo đơn hàng', code)
    }
    formOpen.value = false
  } catch (err: any) {
    toast.error('Lưu đơn thất bại', err?.response?.data?.message || err?.message || 'Lỗi không xác định')
  }
}

function openDetail(order: Order) { detail.value = order; detailOpen.value = true }

function openStatus(order: Order) {
  statusTarget.value = order; newStatus.value = order.status; statusOpen.value = true
}
async function submitStatus() {
  if (!statusTarget.value) return
  const target = statusTarget.value
  try {
    await ordersEntity.update(target.id, { status: newStatus.value })
    await imported.refresh()
    toast.success('Đã cập nhật trạng thái', `${target.code} → ${statusMap[newStatus.value].label}`)
  } catch (err: any) {
    toast.error('Cập nhật thất bại', err?.response?.data?.message || err?.message || 'Lỗi không xác định')
  }
  statusOpen.value = false
}

async function createInvoice(order: Order) {
  if (order.invoiceId) {
    toast.info('Đã có hoá đơn', 'Đơn này đã sinh hoá đơn')
    return
  }
  const subt = Math.round(order.total / 1.1)
  const vat = order.total - subt
  const stamp = new Date().toISOString().slice(2, 10).replace(/-/g, '')
  const code = `HD-${stamp}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`

  const invoicePayload: Record<string, any> = {
    code,
    order_id: order.id,
    order_code: order.code,
    customer_id: order.customerId,
    user_id: order.customerId, // để AccountInvoices tab của user thấy
    customer_name: order.customerName,
    customer_email: order.customerEmail,
    customer_phone: order.customerPhone,
    item_count: order.lines.reduce((a, l) => a + l.quantity, 0),
    subtotal: subt,
    vat,
    total: order.total,
    paid: 0,
    status: 'unpaid',
    company: 'YukiMart Viet Nam',
    items_detail: order.lines.map((l) => ({
      id: l.productId, name: l.name, image: l.image,
      price: l.unitPrice, quantity: l.quantity, sku: l.sku,
    })),
    created_at: new Date().toISOString(),
  }

  try {
    const created = await invoicesEntity.create(invoicePayload)
    const newInvoiceId = Number((created as any)?.id ?? 0)
    if (newInvoiceId) {
      await ordersEntity.update(order.id, { invoice_id: newInvoiceId, invoiceId: newInvoiceId })
      await imported.refresh()
    }
    toast.success('Đã tạo hoá đơn', code)
  } catch (err: any) {
    toast.error('Tạo hoá đơn thất bại', err?.response?.data?.message || err?.message || 'Lỗi không xác định')
  }
}

function openShipment(order: Order) {
  if (order.shipmentId) {
    toast.info('Đã có vận đơn', `Đơn này đã có vận đơn`)
    return
  }
  shipmentTarget.value = order
  shipmentDialog.value = true
}

async function submitShipment() {
  if (!shipmentTarget.value) return
  const order = shipmentTarget.value
  const trackingCode = `${shipmentPartner.value.code}${String(Date.now()).slice(-10)}`
  const cod = order.payment === 'cod' ? order.total : 0

  const payload: Record<string, any> = {
    tracking_code: trackingCode,
    order_id: order.id,
    order_code: order.code,
    user_id: order.customerId,
    customer_name: order.customerName,
    customer_phone: order.customerPhone,
    customer_address: order.customerAddress,
    partner: shipmentPartner.value.name,
    partner_code: shipmentPartner.value.code,
    fee: shipmentPartner.value.fee,
    cod,
    status: 'shipping',
    created_at: new Date().toISOString(),
  }

  try {
    const created = await shipmentsEntity.create(payload)
    const newShipmentId = Number((created as any)?.id ?? 0)
    if (newShipmentId) {
      await ordersEntity.update(order.id, {
        shipment_id: newShipmentId,
        shipmentId: newShipmentId,
        status: 'shipping',
      })
      await imported.refresh()
    }
    toast.success('Đã tạo vận đơn', trackingCode)
    shipmentDialog.value = false
  } catch (err: any) {
    toast.error('Tạo vận đơn thất bại', err?.response?.data?.message || err?.message || 'Lỗi không xác định')
  }
}

function askDelete(order: Order) {
  confirmCtx.value = {
    title: `Xoá đơn ${order.code}?`,
    message: 'Đơn hàng sẽ bị xoá vĩnh viễn.',
    tone: 'danger',
    action: async () => {
      try {
        await ordersEntity.remove(order.id)
        await imported.refresh()
        selected.value = selected.value.filter((id) => id !== order.id)
        toast.success('Đã xoá đơn', order.code)
      } catch (err: any) {
        toast.error('Xoá thất bại', err?.response?.data?.message || err?.message || 'Lỗi không xác định')
      }
    },
  }
  confirmOpen.value = true
}

function askCancel(order: Order) {
  confirmCtx.value = {
    title: `Huỷ đơn ${order.code}?`,
    message: 'Đơn sẽ chuyển sang "Đã huỷ" và hoàn lại tồn kho.',
    tone: 'danger',
    action: async () => {
      try {
        await ordersEntity.update(order.id, { status: 'cancelled' })
        await imported.refresh()
        if (order.status !== 'cancelled') {
          for (const l of order.lines) adminData.adjustStock(l.productId, l.quantity).catch(() => {})
        }
        toast.success('Đã huỷ đơn', order.code)
      } catch (err: any) {
        toast.error('Huỷ thất bại', err?.response?.data?.message || err?.message || 'Lỗi không xác định')
      }
    },
  }
  confirmOpen.value = true
}

async function bulkUpdateStatus(newSt: OrderStatus) {
  const ids = [...selected.value]
  try {
    await Promise.all(ids.map((id) => ordersEntity.update(id, { status: newSt })))
    await imported.refresh()
    toast.success(`Cập nhật ${ids.length} đơn`, `→ ${statusMap[newSt].label}`)
    selected.value = []
  } catch (err: any) {
    toast.error('Cập nhật thất bại', err?.response?.data?.message || err?.message || 'Lỗi không xác định')
  }
}

function onRowAction(order: Order, key: string) {
  if (key === 'view') openDetail(order)
  else if (key === 'edit') openEdit(order)
  else if (key === 'status') openStatus(order)
  else if (key === 'invoice') createInvoice(order)
  else if (key === 'shipment') openShipment(order)
  else if (key === 'cancel') askCancel(order)
  else if (key === 'delete') askDelete(order)
}

function rowMenuItems(order: Order) {
  const base: { key: string; label: string; icon: string; tone?: 'danger' }[] = [
    { key: 'view', label: 'Xem chi tiết', icon: 'ri-eye-line' },
    { key: 'edit', label: 'Chỉnh sửa', icon: 'ri-edit-line' },
  ]
  if (!order.invoiceId) base.push({ key: 'invoice', label: 'Tạo hoá đơn', icon: 'ri-file-list-3-line' })
  if (!order.shipmentId) base.push({ key: 'shipment', label: 'Tạo vận đơn', icon: 'ri-truck-line' })
  base.push({ key: 'status', label: 'Đổi trạng thái', icon: 'ri-refresh-line' })
  if (order.status !== 'cancelled' && order.status !== 'completed') {
    base.push({ key: 'cancel', label: 'Huỷ đơn', icon: 'ri-close-circle-line', tone: 'danger' })
  }
  base.push({ key: 'delete', label: 'Xoá đơn', icon: 'ri-delete-bin-line', tone: 'danger' })
  return base
}

function gotoInvoice(orderId: number) {
  const inv = business.invoices.find((i) => i.orderId === orderId)
  if (inv) router.push('/admin/invoices')
}
function gotoShipment(orderId: number) {
  const ship = business.shipments.find((s) => s.orderId === orderId)
  if (ship) router.push('/admin/shipments')
}
</script>

<template>
  <div class="ym-page">
    <header class="ym-page__header">
      <div>
        <h1>Đặt hàng</h1>
        <p>Quản lý đơn đặt hàng từ khách. Đơn → Hoá đơn → Vận đơn theo đúng quy trình.</p>
      </div>
      <div class="ym-page__actions">
        <ShopImportExport entity="orders" id-field="code" label="đơn hàng" @imported="imported.refresh" />
        <button type="button" class="ym-btn ym-btn--primary" @click="openCreate"><i class="ri-add-line"></i> Tạo đơn hàng</button>
      </div>
    </header>

    <div class="ym-tabs">
      <button v-for="tab in tabs" :key="tab.key" type="button" :class="['ym-tabs__item', { 'is-active': filterStatus === tab.key }]" @click="filterStatus = tab.key">
        {{ tab.label }} <span class="ym-tabs__count">{{ counts[tab.key] || 0 }}</span>
      </button>
    </div>

    <div class="ym-card">
      <div class="ym-toolbar">
        <div class="ym-search">
          <i class="ri-search-line"></i>
          <input v-model="search" type="text" placeholder="Tìm theo mã đơn, khách hàng, email, SĐT..." />
        </div>
        <div class="ym-toolbar__actions">
          <button type="button" class="ym-btn ym-btn--icon"><i class="ri-filter-3-line"></i> Bộ lọc</button>
        </div>
      </div>

      <div v-if="selected.length" class="ym-bulk">
        Đã chọn <strong>{{ selected.length }}</strong> đơn hàng
        <button type="button" class="ym-btn ym-btn--sm" @click="bulkUpdateStatus('processing')">→ Đang xử lý</button>
        <button type="button" class="ym-btn ym-btn--sm" @click="bulkUpdateStatus('shipping')">→ Đang giao</button>
        <button type="button" class="ym-btn ym-btn--sm" @click="bulkUpdateStatus('completed')">→ Hoàn thành</button>
        <button type="button" class="ym-btn ym-btn--sm ym-btn--ghost" @click="selected = []">Bỏ chọn</button>
      </div>

      <div class="ym-table-wrap">
        <table class="ym-table">
          <thead>
            <tr>
              <th class="is-check"><input type="checkbox" :checked="allSelected" @change="toggleAll" /></th>
              <th>Mã đơn</th>
              <th>Khách hàng</th>
              <th>SP</th>
              <th class="is-right">Tổng tiền</th>
              <th>Liên kết</th>
              <th>Trạng thái</th>
              <th>Thời gian</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in paginated" :key="order.id" :class="{ 'is-selected': selected.includes(order.id) }">
              <td class="is-check"><input type="checkbox" :checked="selected.includes(order.id)" @change="toggleOne(order.id)" /></td>
              <td><a href="#" class="ym-link" @click.prevent="openDetail(order)">{{ order.code }}</a></td>
              <td>
                <div class="ym-cell-user">
                  <strong>{{ order.customerName }}</strong>
                  <small>{{ order.customerPhone }}</small>
                </div>
              </td>
              <td>
                <div class="ym-product-stack">
                  <img v-for="line in order.lines.slice(0, 3)" :key="line.productId" :src="line.image" :alt="line.name" :title="line.name" loading="lazy" />
                  <span v-if="order.lines.length > 3" class="ym-product-more">+{{ order.lines.length - 3 }}</span>
                </div>
              </td>
              <td class="is-right">
                <strong>{{ formatPrice(order.total) }}</strong>
                <small v-if="order.discount > 0" class="ym-discount-tag">-{{ formatPrice(order.discount) }}</small>
              </td>
              <td>
                <div class="ym-links">
                  <button v-if="order.invoiceId" type="button" class="ym-link-chip" title="Đã có hoá đơn" @click="gotoInvoice(order.id)">
                    <i class="ri-file-list-3-line"></i> HĐ
                  </button>
                  <button v-if="order.shipmentId" type="button" class="ym-link-chip" title="Đã có vận đơn" @click="gotoShipment(order.id)">
                    <i class="ri-truck-line"></i> VĐ
                  </button>
                  <span v-if="!order.invoiceId && !order.shipmentId" class="is-muted" style="font-size: 12px">—</span>
                </div>
              </td>
              <td><span :class="['ym-tag', `ym-tag--${statusMap[order.status]?.tone || 'neutral'}`]">{{ statusMap[order.status]?.label || order.status }}</span></td>
              <td class="is-muted">{{ order.createdAt }}</td>
              <td class="is-right">
                <RowMenu :items="rowMenuItems(order)" @select="onRowAction(order, $event)" />
              </td>
            </tr>
            <tr v-if="!paginated.length"><td colspan="9" class="ym-empty">Không có đơn hàng phù hợp.</td></tr>
          </tbody>
        </table>
      </div>

      <Pagination v-model="page" :total-items="imported.meta.total" :per-page="perPage" item-label="đơn hàng" @update:per-page="(n) => perPage = n" />
    </div>

    <!-- Form modal -->
    <AdminModal v-model:open="formOpen" :title="editingId ? `Chỉnh sửa đơn` : 'Tạo đơn hàng mới'" subtitle="Chọn khách hàng → Bảng giá tự áp dụng → Chọn sản phẩm" size="xl" :confirm-text="editingId ? 'Lưu' : 'Tạo đơn'" @confirm="submitForm">
      <div class="ym-order-form">
        <div class="ym-order-form__customer">
          <h4>Khách hàng</h4>
          <div class="ym-product-picker">
            <div class="ym-search">
              <i class="ri-user-search-line"></i>
              <input v-model="customerSearch" type="text" placeholder="Tìm khách hàng có sẵn..." />
            </div>
            <div v-if="customerSearch" class="ym-picker-results">
              <button v-for="c in customerResults" :key="c.id" type="button" class="ym-picker-item" @click="pickCustomer(c)">
                <span :class="['ym-avatar', `ym-avatar--${c.avatarTone}`]" style="width: 32px; height: 32px; font-size: 13px">{{ c.initial }}</span>
                <div>
                  <strong>{{ c.name }}</strong>
                  <small>{{ c.phone }} · {{ business.getCustomerGroup(c.groupId)?.name }}</small>
                </div>
                <i class="ri-check-line"></i>
              </button>
            </div>
          </div>
          <div v-if="formGroup" class="ym-customer-tag">
            <i class="ri-vip-crown-line"></i> {{ formGroup.name }}
            <span v-if="formGroup.discount > 0">· Giảm {{ formGroup.discount }}% tự động</span>
          </div>

          <div class="ym-form-row">
            <div class="ym-form-group"><label>Tên *</label><input v-model="form.customerName" type="text" /></div>
            <div class="ym-form-group"><label>Email *</label><input v-model="form.customerEmail" type="email" /></div>
          </div>
          <div class="ym-form-row">
            <div class="ym-form-group"><label>SĐT *</label><input v-model="form.customerPhone" type="tel" /></div>
            <div class="ym-form-group">
              <label>Thanh toán</label>
              <select v-model="form.payment"><option value="cod">COD</option><option value="bank">Chuyển khoản</option><option value="momo">MoMo</option><option value="card">Thẻ</option></select>
            </div>
          </div>
          <div class="ym-form-group"><label>Địa chỉ</label><input v-model="form.customerAddress" type="text" /></div>
          <div class="ym-form-group"><label>Ghi chú</label><textarea v-model="form.note" rows="2"></textarea></div>
        </div>

        <div class="ym-order-form__products">
          <h4>Sản phẩm</h4>
          <div class="ym-product-picker">
            <div class="ym-search">
              <i class="ri-search-line"></i>
              <input v-model="productPickerSearch" type="text" placeholder="Tìm và thêm sản phẩm..." />
            </div>
            <div v-if="productPickerSearch" class="ym-picker-results">
              <button v-for="p in productSearchResults" :key="p.id" type="button" class="ym-picker-item" @click="addLine(p.id)">
                <img :src="p.image" :alt="p.name" />
                <div>
                  <strong>{{ p.name }}</strong>
                  <small>{{ p.sku }} · {{ formatPrice(form.customerId ? business.priceForCustomer(p.id, form.customerId) : p.salePrice) }} · Tồn {{ p.stock }}</small>
                </div>
                <i class="ri-add-line"></i>
              </button>
            </div>
          </div>

          <div v-if="!form.lines.length" class="ym-empty" style="padding: 24px; border: 1px dashed #e5e7eb; border-radius: 10px">
            Chưa có sản phẩm. Hãy tìm và thêm vào đơn.
          </div>
          <div v-for="(line, idx) in form.lines" :key="line.productId" class="ym-line">
            <img :src="line.image" :alt="line.name" />
            <div class="ym-line__info">
              <strong>{{ line.name }}</strong>
              <small>{{ line.sku }}</small>
            </div>
            <input v-model.number="line.unitPrice" type="number" min="0" class="ym-line__input" />
            <div class="ym-line__qty">
              <button type="button" @click="line.quantity = Math.max(1, line.quantity - 1)"><i class="ri-subtract-line"></i></button>
              <input v-model.number="line.quantity" type="number" min="1" />
              <button type="button" @click="line.quantity++"><i class="ri-add-line"></i></button>
            </div>
            <strong class="ym-line__sum">{{ formatPrice(line.unitPrice * line.quantity) }}</strong>
            <button type="button" class="ym-icon-btn" @click="removeLine(idx)"><i class="ri-delete-bin-line"></i></button>
          </div>

          <div class="ym-order-form__total">
            <div class="ym-total-row"><span>Tạm tính</span><strong>{{ formatPrice(formSubtotal) }}</strong></div>
            <div v-if="formDiscount > 0" class="ym-total-row" style="color: #d0021b"><span>Giảm giá ({{ formGroup?.discount }}%)</span><strong>-{{ formatPrice(formDiscount) }}</strong></div>
            <div class="ym-total-row ym-total-row--final"><span>Tổng cộng</span><strong>{{ formatPrice(formTotal) }}</strong></div>
          </div>
        </div>
      </div>
    </AdminModal>

    <!-- Detail modal -->
    <AdminModal v-if="detail" v-model:open="detailOpen" :title="detail.code" subtitle="Chi tiết đơn hàng" size="lg" hide-footer>
      <div class="ym-detail">
        <div class="ym-detail__row">
          <span :class="['ym-tag', `ym-tag--${statusMap[detail.status]?.tone || 'neutral'}`]">{{ statusMap[detail.status]?.label || detail.status }}</span>
          <span class="ym-detail__time">Tạo lúc {{ detail.createdAt }}</span>
        </div>

        <div class="ym-detail__related">
          <span v-if="detail.invoiceId" class="ym-detail__chip" @click="gotoInvoice(detail.id)" style="cursor: pointer">
            <i class="ri-file-list-3-line"></i>
            Hoá đơn: <strong>{{ business.getInvoice(detail.invoiceId)?.code }}</strong>
          </span>
          <button v-else type="button" class="ym-btn ym-btn--sm" @click="createInvoice(detail!); detailOpen = false">
            <i class="ri-add-line"></i> Tạo hoá đơn
          </button>
          <span v-if="detail.shipmentId" class="ym-detail__chip" @click="gotoShipment(detail.id)" style="cursor: pointer">
            <i class="ri-truck-line"></i>
            Vận đơn: <strong>{{ business.getShipment(detail.shipmentId)?.trackingCode }}</strong>
          </span>
          <button v-else type="button" class="ym-btn ym-btn--sm" @click="openShipment(detail!); detailOpen = false">
            <i class="ri-add-line"></i> Tạo vận đơn
          </button>
        </div>

        <div class="ym-detail__grid">
          <div><label>Khách hàng</label><strong>{{ detail.customerName }}</strong></div>
          <div><label>SĐT</label><strong>{{ detail.customerPhone }}</strong></div>
          <div><label>Email</label><strong>{{ detail.customerEmail }}</strong></div>
          <div><label>Thanh toán</label><strong>{{ paymentMap[detail.payment] }}</strong></div>
          <div class="ym-detail__full"><label>Địa chỉ</label><strong>{{ detail.customerAddress }}</strong></div>
        </div>

        <div class="ym-detail__lines">
          <h4>Sản phẩm</h4>
          <div v-for="line in detail.lines" :key="line.productId" class="ym-line ym-line--readonly">
            <img :src="line.image" :alt="line.name" />
            <div class="ym-line__info"><strong>{{ line.name }}</strong><small>{{ line.sku }}</small></div>
            <span class="is-muted">{{ formatPrice(line.unitPrice) }} × {{ line.quantity }}</span>
            <strong class="ym-line__sum">{{ formatPrice(line.unitPrice * line.quantity) }}</strong>
          </div>
        </div>

        <div class="ym-detail__total">
          <div class="ym-total-row"><span>Tạm tính</span><strong>{{ formatPrice(detail.subtotal) }}</strong></div>
          <div v-if="detail.discount > 0" class="ym-total-row" style="color: #d0021b"><span>Giảm giá</span><strong>-{{ formatPrice(detail.discount) }}</strong></div>
          <div class="ym-total-row ym-total-row--final"><span>Tổng cộng</span><strong>{{ formatPrice(detail.total) }}</strong></div>
        </div>
      </div>
    </AdminModal>

    <AdminModal v-if="statusTarget" v-model:open="statusOpen" :title="`Đổi trạng thái ${statusTarget.code}`" size="sm" confirm-text="Cập nhật" @confirm="submitStatus">
      <div class="ym-form-group">
        <label>Trạng thái mới</label>
        <select v-model="newStatus">
          <option v-for="(v, k) in statusMap" :key="k" :value="k">{{ v.label }}</option>
        </select>
      </div>
    </AdminModal>

    <!-- Shipment dialog -->
    <AdminModal v-if="shipmentTarget" v-model:open="shipmentDialog" :title="`Tạo vận đơn cho ${shipmentTarget.code}`" size="md" confirm-text="Tạo vận đơn" @confirm="submitShipment">
      <div class="ym-form-group">
        <label>Đối tác giao hàng</label>
        <select v-model="shipmentPartner.name" @change="(e) => { const v = (e.target as HTMLSelectElement).value; const m: any = { 'Giao Hàng Nhanh': { code: 'GHN', fee: 28000 }, 'Giao Hàng Tiết Kiệm': { code: 'GHTK', fee: 22000 }, 'J&T Express': { code: 'JT', fee: 32000 }, 'Ninja Van': { code: 'NJV', fee: 30000 } }; const info = m[v]; if (info) { shipmentPartner.code = info.code; shipmentPartner.fee = info.fee } }">
          <option>Giao Hàng Nhanh</option>
          <option>Giao Hàng Tiết Kiệm</option>
          <option>J&T Express</option>
          <option>Ninja Van</option>
        </select>
      </div>
      <div class="ym-form-row">
        <div class="ym-form-group"><label>Mã đối tác</label><input v-model="shipmentPartner.code" type="text" disabled /></div>
        <div class="ym-form-group"><label>Phí giao (₫)</label><input v-model.number="shipmentPartner.fee" type="number" /></div>
      </div>
      <p class="ym-form-help">COD sẽ tự động lấy = tổng đơn nếu thanh toán COD.</p>
    </AdminModal>

    <AdminModal v-if="confirmCtx" v-model:open="confirmOpen" :title="confirmCtx.title" size="sm" :confirm-tone="confirmCtx.tone" :confirm-text="confirmCtx.tone === 'danger' ? 'Xác nhận' : 'OK'" @confirm="confirmCtx.action(); confirmOpen = false">
      <p style="margin: 0; color: #4b5563">{{ confirmCtx.message }}</p>
    </AdminModal>
  </div>
</template>

<style scoped src="./_admin-shared.css"></style>
<style scoped>
.ym-product-stack { display: flex; align-items: center; gap: 4px; }
.ym-product-stack img { width: 32px; height: 32px; object-fit: contain; padding: 1px; background: #fafbfc; border: 1px solid #f1f3f5; border-radius: 6px; margin-left: -4px; }
.ym-product-stack img:first-child { margin-left: 0; }
.ym-product-more { width: 32px; height: 32px; background: #f3f4f6; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; color: #4b5563; margin-left: -4px; }
.ym-discount-tag { display: block; font-size: 11px; color: #d0021b; }

.ym-links { display: flex; gap: 4px; }
.ym-link-chip { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border: 1px solid #e5e7eb; background: #f3f6f4; color: #326e51; font-size: 11px; font-weight: 600; border-radius: 999px; cursor: pointer; }
.ym-link-chip:hover { background: #e8f0ec; }

.ym-detail { display: flex; flex-direction: column; gap: 14px; }
.ym-detail__row { display: flex; align-items: center; gap: 12px; }
.ym-detail__time { color: #6b7280; font-size: 13px; }
.ym-detail__related { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; padding: 12px; background: #f3f6f4; border-radius: 10px; }
.ym-detail__chip { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; background: #fff; border: 1px solid #d1e0d6; border-radius: 999px; font-size: 13px; color: #1f2937; }
.ym-detail__chip:hover { border-color: #326e51; color: #326e51; }
.ym-detail__chip strong { color: #326e51; }
.ym-detail__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 24px; background: #fafbfc; padding: 14px; border-radius: 10px; border: 1px solid #f1f3f5; }
.ym-detail__grid > div { display: flex; flex-direction: column; gap: 2px; }
.ym-detail__grid label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.4px; color: #6b7280; }
.ym-detail__grid strong { font-size: 14px; color: #111827; font-weight: 500; }
.ym-detail__full { grid-column: 1 / -1; }
.ym-detail__lines h4 { margin: 0 0 8px; font-size: 13px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.4px; }
.ym-detail__total { background: #fafbfc; padding: 14px; border-radius: 10px; border: 1px solid #f1f3f5; }

.ym-total-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 14px; }
.ym-total-row--final { border-top: 1px solid #e5e7eb; margin-top: 6px; padding-top: 10px; font-size: 16px; font-weight: 700; }
.ym-total-row--final strong { color: #326e51; font-size: 18px; }

.ym-order-form { display: grid; grid-template-columns: 320px 1fr; gap: 16px; }
@media (max-width: 900px) { .ym-order-form { grid-template-columns: 1fr; } }
.ym-order-form h4 { margin: 0 0 10px; font-size: 13px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.4px; }

.ym-customer-tag { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; background: #fef3c7; color: #92400e; border-radius: 8px; font-size: 13px; font-weight: 500; margin-bottom: 12px; }

.ym-product-picker { position: relative; margin-bottom: 12px; }
.ym-picker-results { position: absolute; top: calc(100% + 4px); left: 0; right: 0; background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08); max-height: 320px; overflow-y: auto; z-index: 10; }
.ym-picker-item { display: flex; align-items: center; gap: 10px; width: 100%; padding: 8px 12px; border: none; background: transparent; text-align: left; cursor: pointer; border-bottom: 1px solid #f1f3f5; }
.ym-picker-item:hover { background: #f3f6f4; }
.ym-picker-item:last-child { border-bottom: none; }
.ym-picker-item img { width: 36px; height: 36px; object-fit: contain; padding: 2px; background: #fafbfc; border: 1px solid #f1f3f5; border-radius: 6px; }
.ym-picker-item > div { flex: 1; min-width: 0; }
.ym-picker-item strong { display: block; font-size: 13px; color: #111827; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ym-picker-item small { font-size: 11px; color: #6b7280; }
.ym-picker-item i { color: #326e51; font-size: 18px; }

.ym-line { display: grid; grid-template-columns: 50px 1fr 100px 110px 100px 32px; gap: 10px; align-items: center; padding: 8px; background: #fafbfc; border: 1px solid #f1f3f5; border-radius: 8px; margin-bottom: 6px; }
.ym-line--readonly { grid-template-columns: 50px 1fr 140px 100px; }
.ym-line img { width: 50px; height: 50px; object-fit: contain; padding: 2px; background: #fff; border: 1px solid #f1f3f5; border-radius: 6px; }
.ym-line__info { min-width: 0; }
.ym-line__info strong { display: block; font-size: 13px; color: #111827; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ym-line__info small { font-size: 11px; color: #6b7280; }
.ym-line__input { padding: 6px 8px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; background: #fff; }
.ym-line__qty { display: flex; align-items: center; }
.ym-line__qty button { width: 26px; height: 28px; border: 1px solid #d1d5db; background: #fff; cursor: pointer; }
.ym-line__qty button:first-child { border-radius: 6px 0 0 6px; }
.ym-line__qty button:last-child { border-radius: 0 6px 6px 0; border-left: none; }
.ym-line__qty input { width: 40px; height: 28px; border: 1px solid #d1d5db; border-left: none; border-right: none; text-align: center; font-size: 13px; }
.ym-line__sum { color: #d0021b; text-align: right; font-size: 14px; }

.ym-order-form__total { padding: 14px; background: #e8f0ec; border-radius: 10px; margin-top: 12px; }
</style>
