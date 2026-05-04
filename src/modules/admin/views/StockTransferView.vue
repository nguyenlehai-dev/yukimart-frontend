<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import AdminModal from '../components/AdminModal.vue'
import RowMenu from '../components/RowMenu.vue'
import Pagination from '../components/Pagination.vue'
import ShopImportExport from '../components/ShopImportExport.vue'
import { useToast } from '../composables/useToast'
import { useAdminDataStore } from '../stores/adminData'
import { useShopBusinessStore, type StockTransfer, type OrderLine } from '../stores/shopBusiness'
import { useImportedAs } from '../composables/useImportedAs'

const toast = useToast()
const adminData = useAdminDataStore()
const business = useShopBusinessStore()

const imported = useImportedAs<StockTransfer>('stock-transfers', {
  code: ['ma_phieu', 'code'],
  fromWarehouse: ['kho_xuat', 'from_warehouse'],
  toWarehouse: ['kho_nhap', 'to_warehouse'],
  totalQuantity: ['tong_so_luong', 'total_quantity'],
  status: ['trang_thai', 'status'],
  createdAt: ['ngay_tao', 'created_at'],
  createdBy: ['nguoi_tao', 'created_by'],
}, (raw, m) => ({
  id: Number(raw.id),
  code: String(m.code ?? `CH${raw.id}`),
  fromWarehouse: String(m.fromWarehouse ?? ''),
  toWarehouse: String(m.toWarehouse ?? ''),
  lines: [],
  totalQuantity: Number(m.totalQuantity ?? 0),
  status: (m.status ?? 'draft') as StockTransfer['status'],
  createdAt: String(m.createdAt ?? ''),
  createdBy: String(m.createdBy ?? 'Admin'),
}))
const allTransfers = computed<StockTransfer[]>(() => imported.hasData.value ? imported.items.value : business.stockTransfers)

const statusMap = {
  draft: { label: 'Phiếu tạm', tone: 'neutral' },
  in_transit: { label: 'Đang chuyển', tone: 'info' },
  received: { label: 'Đã nhận', tone: 'success' },
  cancelled: { label: 'Đã huỷ', tone: 'danger' },
}

if (!business.stockTransfers.length) {
  business.stockTransfers.push(
    { id: 1, code: 'CH0001', fromWarehouse: 'Kho HCM', toWarehouse: 'Kho HN', lines: [], totalQuantity: 120, status: 'received', createdAt: '04/05/2026 09:30', createdBy: 'Admin' },
    { id: 2, code: 'CH0002', fromWarehouse: 'Kho HCM', toWarehouse: 'Kho HN', lines: [], totalQuantity: 45, status: 'in_transit', createdAt: '03/05/2026 14:00', createdBy: 'Admin' },
  )
}

const search = ref(''); const filterStatus = ref<'all' | keyof typeof statusMap>('all')
const page = ref(1); const perPage = ref(5)
const filtered = computed(() => allTransfers.value.filter((i) =>
  (!search.value.trim() || i.code.toLowerCase().includes(search.value.trim().toLowerCase()))
  && (filterStatus.value === 'all' || i.status === filterStatus.value)))
const paginated = computed(() => filtered.value.slice((page.value - 1) * perPage.value, page.value * perPage.value))
watch([search, filterStatus], () => { page.value = 1 })

const stats = computed(() => ({
  total: allTransfers.value.length,
  inTransit: allTransfers.value.filter((i) => i.status === 'in_transit').length,
  totalQuantity: allTransfers.value.reduce((s, i) => s + i.totalQuantity, 0),
  completed: allTransfers.value.filter((i) => i.status === 'received').length,
}))

const formOpen = ref(false)
const form = ref<{ from: string; to: string; lines: OrderLine[] }>({ from: 'Kho HCM', to: 'Kho HN', lines: [] })
const productSearch = ref('')
const productResults = computed(() => {
  const q = productSearch.value.trim().toLowerCase()
  if (!q) return adminData.products.slice(0, 8)
  return adminData.products.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)).slice(0, 12)
})
function openCreate() { form.value = { from: 'Kho HCM', to: 'Kho HN', lines: [] }; productSearch.value = ''; formOpen.value = true }
function addLine(productId: number) {
  const ex = form.value.lines.find((l) => l.productId === productId)
  if (ex) { ex.quantity++; return }
  const p = adminData.findProduct(productId)
  if (!p) return
  form.value.lines.push({ productId: p.id, sku: p.sku, name: p.name, image: p.image, unitPrice: p.cost, quantity: 1 })
  productSearch.value = ''
}
function removeLine(idx: number) { form.value.lines.splice(idx, 1) }
function submit() {
  if (form.value.from === form.value.to) return toast.error('Kho nguồn = kho đích')
  if (!form.value.lines.length) return toast.error('Chưa chọn sản phẩm')
  const totalQty = form.value.lines.reduce((s, l) => s + l.quantity, 0)
  const id = Math.max(0, ...business.stockTransfers.map((i) => i.id)) + 1
  const code = 'CH' + String(id + 100).padStart(4, '0')
  business.stockTransfers.unshift({
    id, code, fromWarehouse: form.value.from, toWarehouse: form.value.to,
    lines: form.value.lines, totalQuantity: totalQty, status: 'in_transit',
    createdAt: new Date().toLocaleString('vi-VN'), createdBy: 'Admin',
  })
  // Log: xuất khỏi kho nguồn
  for (const line of form.value.lines) {
    business.logMovement(line.productId, line.sku, line.name, 'out', -line.quantity, code, 'transfer', `Chuyển: ${form.value.from} → ${form.value.to}`)
  }
  toast.success('Đã tạo phiếu chuyển', code)
  formOpen.value = false
}

function receive(t: StockTransfer) {
  if (t.status !== 'in_transit') return
  if (!confirm(`Xác nhận đã nhận hàng ở ${t.toWarehouse}?`)) return
  t.status = 'received'
  for (const line of t.lines) {
    business.logMovement(line.productId, line.sku, line.name, 'in', line.quantity, t.code, 'transfer', `Nhận tại: ${t.toWarehouse}`)
  }
  toast.success('Đã nhận hàng', t.code)
}

const detailOpen = ref(false); const detail = ref<StockTransfer | null>(null)
function openDetail(t: StockTransfer) { detail.value = t; detailOpen.value = true }

const rowMenu = (t: StockTransfer) => {
  const items: { key: string; label: string; icon: string; tone?: 'danger' }[] = [{ key: 'view', label: 'Xem chi tiết', icon: 'ri-eye-line' }]
  if (t.status === 'in_transit') items.push({ key: 'receive', label: 'Xác nhận nhận', icon: 'ri-check-double-line' })
  items.push({ key: 'delete', label: 'Xoá', icon: 'ri-delete-bin-line', tone: 'danger' })
  return items
}
function onAction(t: StockTransfer, key: string) {
  if (key === 'view') openDetail(t)
  else if (key === 'receive') receive(t)
  else if (key === 'delete') { business.stockTransfers.splice(business.stockTransfers.findIndex((x) => x.id === t.id), 1); toast.success('Đã xoá', t.code) }
}
</script>

<template>
  <div class="ym-page">
    <header class="ym-page__header">
      <div><h1>Chuyển hàng</h1><p>Phiếu chuyển hàng giữa các kho. Khi tạo → log xuất kho nguồn, khi nhận → log nhập kho đích.</p></div>
      <div class="ym-page__actions">
        <ShopImportExport entity="stock-transfers" id-field="code" label="phiếu chuyển kho" @imported="imported.refresh" />
        <button type="button" class="ym-btn ym-btn--primary" @click="openCreate"><i class="ri-add-line"></i> Tạo phiếu chuyển</button>
      </div>
    </header>

    <section class="ym-mini-stats">
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Tổng phiếu</p><p class="ym-mini-stat__value">{{ stats.total }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Đang chuyển</p><p class="ym-mini-stat__value" style="color: #1e40af">{{ stats.inTransit }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Đã nhận</p><p class="ym-mini-stat__value" style="color: #166534">{{ stats.completed }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Tổng SP chuyển</p><p class="ym-mini-stat__value">{{ stats.totalQuantity }}</p></article>
    </section>

    <div class="ym-card">
      <div class="ym-toolbar">
        <div class="ym-search"><i class="ri-search-line"></i><input v-model="search" type="text" placeholder="Tìm theo mã..." /></div>
        <div class="ym-toolbar__actions"><select v-model="filterStatus" class="ym-select"><option value="all">Tất cả</option><option v-for="(v, k) in statusMap" :key="k" :value="k">{{ v.label }}</option></select></div>
      </div>
      <div class="ym-table-wrap">
        <table class="ym-table">
          <thead><tr><th>Mã phiếu</th><th>Từ</th><th>Đến</th><th class="is-center">SP</th><th class="is-center">SL</th><th>Trạng thái</th><th>Thời gian</th><th></th></tr></thead>
          <tbody>
            <tr v-for="t in paginated" :key="t.id">
              <td><a href="#" class="ym-link" @click.prevent="openDetail(t)">{{ t.code }}</a></td>
              <td>{{ t.fromWarehouse }}</td>
              <td><i class="ri-arrow-right-line is-muted"></i> {{ t.toWarehouse }}</td>
              <td class="is-center">{{ t.lines.length }}</td>
              <td class="is-center"><strong>{{ t.totalQuantity }}</strong></td>
              <td><span :class="['ym-tag', `ym-tag--${statusMap[t.status]?.tone || 'neutral'}`]">{{ statusMap[t.status]?.label || t.status }}</span></td>
              <td class="is-muted">{{ t.createdAt }}</td>
              <td class="is-right"><RowMenu :items="rowMenu(t)" @select="onAction(t, $event)" /></td>
            </tr>
            <tr v-if="!paginated.length"><td colspan="8" class="ym-empty">Chưa có phiếu chuyển kho.</td></tr>
          </tbody>
        </table>
      </div>
      <Pagination v-model="page" :total-items="filtered.length" :per-page="perPage" item-label="phiếu" @update:per-page="(n) => perPage = n" />
    </div>

    <AdminModal v-model:open="formOpen" title="Tạo phiếu chuyển kho" size="lg" confirm-text="Tạo phiếu" @confirm="submit">
      <div class="ym-form-row">
        <div class="ym-form-group"><label>Từ kho</label><select v-model="form.from"><option v-for="w in adminData.warehouseOptions" :key="w" :value="w">{{ w }}</option></select></div>
        <div class="ym-form-group"><label>Đến kho</label><select v-model="form.to"><option v-for="w in adminData.warehouseOptions" :key="w" :value="w">{{ w }}</option></select></div>
      </div>
      <div class="ym-product-picker">
        <div class="ym-search"><i class="ri-search-line"></i><input v-model="productSearch" type="text" placeholder="Tìm SP..." /></div>
        <div v-if="productSearch" class="ym-picker-results">
          <button v-for="p in productResults" :key="p.id" type="button" class="ym-picker-item" @click="addLine(p.id)">
            <img :src="p.image" :alt="p.name" /><div><strong>{{ p.name }}</strong><small>{{ p.sku }} · Tồn {{ p.stock }}</small></div><i class="ri-add-line"></i>
          </button>
        </div>
      </div>
      <div v-for="(line, idx) in form.lines" :key="line.productId" class="ym-line">
        <img :src="line.image" :alt="line.name" />
        <div class="ym-line__info"><strong>{{ line.name }}</strong><small>{{ line.sku }}</small></div>
        <input v-model.number="line.quantity" type="number" min="1" class="ym-line__input" />
        <button type="button" class="ym-icon-btn" @click="removeLine(idx)"><i class="ri-delete-bin-line"></i></button>
      </div>
    </AdminModal>

    <AdminModal v-if="detail" v-model:open="detailOpen" :title="detail.code" :subtitle="`${detail.fromWarehouse} → ${detail.toWarehouse}`" size="lg" hide-footer>
      <div style="display: flex; gap: 8px; margin-bottom: 12px">
        <span :class="['ym-tag', `ym-tag--${statusMap[detail.status]?.tone || 'neutral'}`]">{{ statusMap[detail.status]?.label || detail.status }}</span>
        <span class="is-muted" style="font-size: 13px">{{ detail.createdAt }}</span>
      </div>
      <div v-for="line in detail.lines" :key="line.productId" class="ym-line ym-line--readonly">
        <img :src="line.image" :alt="line.name" />
        <div class="ym-line__info"><strong>{{ line.name }}</strong><small>{{ line.sku }}</small></div>
        <span class="is-muted">SL: {{ line.quantity }}</span>
      </div>
      <p v-if="!detail.lines.length" style="padding: 16px; text-align: center; color: #9ca3af">Phiếu legacy. Tổng SL: {{ detail.totalQuantity }}</p>
      <div v-if="detail.status === 'in_transit'" style="display: flex; justify-content: flex-end; margin-top: 14px">
        <button type="button" class="ym-btn ym-btn--primary" @click="receive(detail!); detailOpen = false"><i class="ri-check-double-line"></i> Xác nhận nhận hàng</button>
      </div>
    </AdminModal>
  </div>
</template>

<style scoped src="./_admin-shared.css"></style>
<style scoped>
.ym-select { padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 8px; background: #fff; font-size: 14px; }
.ym-product-picker { position: relative; margin: 14px 0 12px; }
.ym-picker-results { position: absolute; top: calc(100% + 4px); left: 0; right: 0; background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.08); max-height: 280px; overflow-y: auto; z-index: 10; }
.ym-picker-item { display: flex; align-items: center; gap: 10px; width: 100%; padding: 8px 12px; border: none; background: transparent; text-align: left; cursor: pointer; border-bottom: 1px solid #f1f3f5; }
.ym-picker-item:hover { background: #f3f6f4; }
.ym-picker-item img { width: 36px; height: 36px; object-fit: contain; padding: 2px; background: #fafbfc; border-radius: 6px; }
.ym-picker-item div { flex: 1; min-width: 0; }
.ym-picker-item strong { display: block; font-size: 13px; color: #111827; }
.ym-picker-item small { font-size: 11px; color: #6b7280; }
.ym-line { display: grid; grid-template-columns: 50px 1fr 80px 32px; gap: 10px; align-items: center; padding: 8px; background: #fafbfc; border: 1px solid #f1f3f5; border-radius: 8px; margin-bottom: 6px; }
.ym-line--readonly { grid-template-columns: 50px 1fr 100px; }
.ym-line img { width: 50px; height: 50px; object-fit: contain; padding: 2px; background: #fff; border-radius: 6px; }
.ym-line__info strong { display: block; font-size: 13px; color: #111827; }
.ym-line__info small { font-size: 11px; color: #6b7280; }
.ym-line__input { padding: 6px 8px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; }
</style>
