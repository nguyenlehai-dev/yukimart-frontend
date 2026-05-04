<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import AdminModal from '../components/AdminModal.vue'
import RowMenu from '../components/RowMenu.vue'
import Pagination from '../components/Pagination.vue'
import ShopImportExport from '../components/ShopImportExport.vue'
import { useToast } from '../composables/useToast'
import { useAdminDataStore } from '../stores/adminData'
import { useShopBusinessStore, type StockDisposal, type OrderLine } from '../stores/shopBusiness'
import { useImportedAs } from '../composables/useImportedAs'
import { formatPrice } from '@/modules/mypage/home/configs'

const toast = useToast()
const adminData = useAdminDataStore()
const business = useShopBusinessStore()

const imported = useImportedAs<StockDisposal>('stock-disposals', {
  code: ['ma_phieu', 'code'],
  warehouse: ['kho', 'warehouse'],
  totalQuantity: ['tong_so_luong', 'total_quantity'],
  totalValue: ['tong_gia_tri', 'total_value'],
  reason: ['ly_do', 'reason'],
  status: ['trang_thai', 'status'],
  createdAt: ['ngay_tao', 'created_at'],
}, (raw, m) => ({
  id: Number(raw.id),
  code: String(m.code ?? `XH${raw.id}`),
  warehouse: String(m.warehouse ?? ''),
  lines: [],
  totalQuantity: Number(m.totalQuantity ?? 0),
  totalValue: Number(m.totalValue ?? 0),
  reason: String(m.reason ?? ''),
  status: (m.status ?? 'pending') as StockDisposal['status'],
  createdAt: String(m.createdAt ?? ''),
}))
const allDisposals = computed<StockDisposal[]>(() => imported.hasData.value ? imported.items.value : business.stockDisposals)

const reasons = ['Hết hạn', 'Hư hỏng', 'Vỡ chai', 'Lỗi sản xuất', 'Khách trả - không bán lại được']
const statusMap = {
  pending: { label: 'Chờ duyệt', tone: 'warning' },
  approved: { label: 'Đã duyệt', tone: 'success' },
  cancelled: { label: 'Đã huỷ', tone: 'danger' },
}

// Seed nếu trống
if (!business.stockDisposals.length) {
  business.stockDisposals.push(
    { id: 1, code: 'XH0001', warehouse: 'Kho HCM', lines: [], totalQuantity: 18, totalValue: 720000, reason: 'Hết hạn', status: 'approved', createdAt: '04/05/2026 09:00' },
    { id: 2, code: 'XH0002', warehouse: 'Kho HCM', lines: [], totalQuantity: 6, totalValue: 240000, reason: 'Vỡ chai', status: 'pending', createdAt: '03/05/2026 14:00' },
  )
}

const search = ref('')
const filterStatus = ref<'all' | keyof typeof statusMap>('all')
const page = ref(1)
const perPage = ref(5)
const filtered = computed(() => allDisposals.value.filter((i) =>
  (!search.value.trim() || i.code.toLowerCase().includes(search.value.trim().toLowerCase()))
  && (filterStatus.value === 'all' || i.status === filterStatus.value)))
const paginated = computed(() => filtered.value.slice((page.value - 1) * perPage.value, page.value * perPage.value))
watch([search, filterStatus], () => { page.value = 1 })

const stats = computed(() => ({
  total: allDisposals.value.length,
  pending: allDisposals.value.filter((i) => i.status === 'pending').length,
  totalQty: allDisposals.value.reduce((s, i) => s + i.totalQuantity, 0),
  totalValue: allDisposals.value.reduce((s, i) => s + i.totalValue, 0),
}))

// Create modal
const formOpen = ref(false)
const form = ref<{ warehouse: string; reason: string; lines: OrderLine[] }>({ warehouse: 'Kho HCM', reason: 'Hết hạn', lines: [] })
const productSearch = ref('')

const productResults = computed(() => {
  const q = productSearch.value.trim().toLowerCase()
  if (!q) return adminData.products.slice(0, 8)
  return adminData.products.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)).slice(0, 12)
})

function openCreate() {
  form.value = { warehouse: 'Kho HCM', reason: 'Hết hạn', lines: [] }
  productSearch.value = ''
  formOpen.value = true
}
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
  if (!form.value.lines.length) return toast.error('Chưa chọn sản phẩm')
  const totalQty = form.value.lines.reduce((s, l) => s + l.quantity, 0)
  const totalValue = form.value.lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0)
  const id = Math.max(0, ...business.stockDisposals.map((i) => i.id)) + 1
  const code = 'XH' + String(id + 100).padStart(4, '0')
  business.stockDisposals.unshift({
    id, code, warehouse: form.value.warehouse,
    lines: form.value.lines, totalQuantity: totalQty, totalValue,
    reason: form.value.reason, status: 'pending',
    createdAt: new Date().toLocaleString('vi-VN'),
  })
  toast.success('Đã tạo phiếu hủy', code)
  formOpen.value = false
}

function approve(d: StockDisposal) {
  if (d.status !== 'pending') return
  if (!confirm(`Duyệt phiếu hủy ${d.code}? Tồn kho sẽ tự động trừ và ghi nhận trong lịch sử.`)) return
  d.status = 'approved'
  for (const line of d.lines) {
    adminData.adjustStock(line.productId, -line.quantity).catch(() => {})
    business.logMovement(line.productId, line.sku, line.name, 'out', -line.quantity, d.code, 'disposal', `Xuất hủy: ${d.reason}`)
  }
  toast.success('Đã duyệt + trừ tồn', d.code)
}

const detailOpen = ref(false)
const detail = ref<StockDisposal | null>(null)
function openDetail(d: StockDisposal) { detail.value = d; detailOpen.value = true }

const rowMenu = (d: StockDisposal) => {
  const items: { key: string; label: string; icon: string; tone?: 'danger' }[] = [
    { key: 'view', label: 'Xem chi tiết', icon: 'ri-eye-line' },
  ]
  if (d.status === 'pending') items.push({ key: 'approve', label: 'Duyệt phiếu', icon: 'ri-check-line' })
  items.push({ key: 'delete', label: 'Xoá', icon: 'ri-delete-bin-line', tone: 'danger' })
  return items
}
function onAction(d: StockDisposal, key: string) {
  if (key === 'view') openDetail(d)
  else if (key === 'approve') approve(d)
  else if (key === 'delete') {
    business.stockDisposals.splice(business.stockDisposals.findIndex((x) => x.id === d.id), 1)
    toast.success('Đã xoá', d.code)
  }
}
</script>

<template>
  <div class="ym-page">
    <header class="ym-page__header">
      <div>
        <h1>Xuất hủy</h1>
        <p>Phiếu xuất hủy. Khi duyệt → tồn kho tự trừ + ghi log trong lịch sử biến động kho.</p>
      </div>
      <div class="ym-page__actions">
        <ShopImportExport entity="stock-disposals" id-field="code" label="phiếu xuất hủy" @imported="imported.refresh" />
        <button type="button" class="ym-btn ym-btn--primary" @click="openCreate"><i class="ri-add-line"></i> Tạo phiếu hủy</button>
      </div>
    </header>

    <section class="ym-mini-stats">
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Tổng phiếu</p><p class="ym-mini-stat__value">{{ stats.total }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Chờ duyệt</p><p class="ym-mini-stat__value" style="color: #92400e">{{ stats.pending }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Tổng số lượng</p><p class="ym-mini-stat__value">{{ stats.totalQty }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Thiệt hại</p><p class="ym-mini-stat__value" style="color: #d0021b">{{ formatPrice(stats.totalValue) }}</p></article>
    </section>

    <div class="ym-card">
      <div class="ym-toolbar">
        <div class="ym-search"><i class="ri-search-line"></i><input v-model="search" type="text" placeholder="Tìm theo mã phiếu..." /></div>
        <div class="ym-toolbar__actions"><select v-model="filterStatus" class="ym-select"><option value="all">Tất cả</option><option v-for="(v, k) in statusMap" :key="k" :value="k">{{ v.label }}</option></select></div>
      </div>
      <div class="ym-table-wrap">
        <table class="ym-table">
          <thead><tr><th>Mã phiếu</th><th>Kho</th><th>Lý do</th><th class="is-center">SP</th><th class="is-center">SL</th><th class="is-right">Thiệt hại</th><th>Trạng thái</th><th>Thời gian</th><th></th></tr></thead>
          <tbody>
            <tr v-for="d in paginated" :key="d.id">
              <td><a href="#" class="ym-link" @click.prevent="openDetail(d)">{{ d.code }}</a></td>
              <td>{{ d.warehouse }}</td>
              <td>{{ d.reason }}</td>
              <td class="is-center">{{ d.lines.length }}</td>
              <td class="is-center"><strong>{{ d.totalQuantity }}</strong></td>
              <td class="is-right is-danger"><strong>{{ formatPrice(d.totalValue) }}</strong></td>
              <td><span :class="['ym-tag', `ym-tag--${statusMap[d.status]?.tone || 'neutral'}`]">{{ statusMap[d.status]?.label || d.status }}</span></td>
              <td class="is-muted">{{ d.createdAt }}</td>
              <td class="is-right"><RowMenu :items="rowMenu(d)" @select="onAction(d, $event)" /></td>
            </tr>
            <tr v-if="!paginated.length"><td colspan="9" class="ym-empty">Chưa có phiếu hủy.</td></tr>
          </tbody>
        </table>
      </div>
      <Pagination v-model="page" :total-items="filtered.length" :per-page="perPage" item-label="phiếu" @update:per-page="(n) => perPage = n" />
    </div>

    <!-- Create modal -->
    <AdminModal v-model:open="formOpen" title="Tạo phiếu xuất hủy" subtitle="Chọn sản phẩm cần huỷ + lý do" size="lg" confirm-text="Lưu phiếu" @confirm="submit">
      <div class="ym-form-row">
        <div class="ym-form-group">
          <label>Kho</label>
          <select v-model="form.warehouse">
            <option v-for="w in adminData.warehouseOptions" :key="w" :value="w">{{ w }}</option>
          </select>
        </div>
        <div class="ym-form-group">
          <label>Lý do hủy</label>
          <select v-model="form.reason"><option v-for="r in reasons" :key="r" :value="r">{{ r }}</option></select>
        </div>
      </div>
      <div class="ym-product-picker">
        <div class="ym-search"><i class="ri-search-line"></i><input v-model="productSearch" type="text" placeholder="Tìm SP cần hủy..." /></div>
        <div v-if="productSearch" class="ym-picker-results">
          <button v-for="p in productResults" :key="p.id" type="button" class="ym-picker-item" @click="addLine(p.id)">
            <img :src="p.image" :alt="p.name" />
            <div><strong>{{ p.name }}</strong><small>{{ p.sku }} · Tồn {{ p.stock }} · Vốn {{ formatPrice(p.cost) }}</small></div>
            <i class="ri-add-line"></i>
          </button>
        </div>
      </div>
      <div v-if="!form.lines.length" class="ym-empty" style="padding: 20px; border: 1px dashed #e5e7eb; border-radius: 10px">Chưa chọn sản phẩm.</div>
      <div v-for="(line, idx) in form.lines" :key="line.productId" class="ym-line">
        <img :src="line.image" :alt="line.name" />
        <div class="ym-line__info"><strong>{{ line.name }}</strong><small>{{ line.sku }}</small></div>
        <input v-model.number="line.quantity" type="number" min="1" class="ym-line__input" />
        <strong class="ym-line__sum">{{ formatPrice(line.unitPrice * line.quantity) }}</strong>
        <button type="button" class="ym-icon-btn" @click="removeLine(idx)"><i class="ri-delete-bin-line"></i></button>
      </div>
    </AdminModal>

    <AdminModal v-if="detail" v-model:open="detailOpen" :title="detail.code" :subtitle="detail.reason" size="lg" hide-footer>
      <div style="display: flex; gap: 8px; margin-bottom: 12px">
        <span :class="['ym-tag', `ym-tag--${statusMap[detail.status]?.tone || 'neutral'}`]">{{ statusMap[detail.status]?.label || detail.status }}</span>
        <span class="is-muted" style="font-size: 13px">{{ detail.warehouse }} · {{ detail.createdAt }}</span>
      </div>
      <div v-for="line in detail.lines" :key="line.productId" class="ym-line ym-line--readonly">
        <img :src="line.image" :alt="line.name" />
        <div class="ym-line__info"><strong>{{ line.name }}</strong><small>{{ line.sku }}</small></div>
        <span class="is-muted">{{ formatPrice(line.unitPrice) }} × {{ line.quantity }}</span>
        <strong class="ym-line__sum">{{ formatPrice(line.unitPrice * line.quantity) }}</strong>
      </div>
      <p v-if="!detail.lines.length" style="padding: 16px; text-align: center; color: #9ca3af">Phiếu legacy không có chi tiết SP. Tổng SL: {{ detail.totalQuantity }} · Thiệt hại {{ formatPrice(detail.totalValue) }}</p>
      <div v-if="detail.status === 'pending'" style="display: flex; justify-content: flex-end; margin-top: 14px">
        <button type="button" class="ym-btn ym-btn--primary" @click="approve(detail!); detailOpen = false">
          <i class="ri-check-line"></i> Duyệt phiếu hủy
        </button>
      </div>
    </AdminModal>
  </div>
</template>

<style scoped src="./_admin-shared.css"></style>
<style scoped>
.ym-select { padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 8px; background: #fff; font-size: 14px; }
.ym-table .is-danger { color: #d0021b; }

.ym-product-picker { position: relative; margin: 14px 0 12px; }
.ym-picker-results { position: absolute; top: calc(100% + 4px); left: 0; right: 0; background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.08); max-height: 280px; overflow-y: auto; z-index: 10; }
.ym-picker-item { display: flex; align-items: center; gap: 10px; width: 100%; padding: 8px 12px; border: none; background: transparent; text-align: left; cursor: pointer; border-bottom: 1px solid #f1f3f5; }
.ym-picker-item:hover { background: #fef2f2; }
.ym-picker-item img { width: 36px; height: 36px; object-fit: contain; padding: 2px; background: #fafbfc; border-radius: 6px; }
.ym-picker-item div { flex: 1; min-width: 0; }
.ym-picker-item strong { display: block; font-size: 13px; color: #111827; }
.ym-picker-item small { font-size: 11px; color: #6b7280; }

.ym-line { display: grid; grid-template-columns: 50px 1fr 80px 100px 32px; gap: 10px; align-items: center; padding: 8px; background: #fafbfc; border: 1px solid #f1f3f5; border-radius: 8px; margin-bottom: 6px; }
.ym-line--readonly { grid-template-columns: 50px 1fr 140px 100px; }
.ym-line img { width: 50px; height: 50px; object-fit: contain; padding: 2px; background: #fff; border-radius: 6px; }
.ym-line__info { min-width: 0; }
.ym-line__info strong { display: block; font-size: 13px; color: #111827; }
.ym-line__info small { font-size: 11px; color: #6b7280; }
.ym-line__input { padding: 6px 8px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; background: #fff; }
.ym-line__sum { color: #d0021b; text-align: right; font-size: 14px; }
</style>
