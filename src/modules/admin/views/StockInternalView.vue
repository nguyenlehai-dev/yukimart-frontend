<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import AdminModal from '../components/AdminModal.vue'
import RowMenu from '../components/RowMenu.vue'
import Pagination from '../components/Pagination.vue'
import ShopImportExport from '../components/ShopImportExport.vue'
import { useToast } from '../composables/useToast'
import { useAdminDataStore } from '../stores/adminData'
import { useShopBusinessStore, type StockInternal, type OrderLine } from '../stores/shopBusiness'
import { useImportedAs } from '../composables/useImportedAs'
import { formatPrice } from '@/modules/mypage/home/configs'

const toast = useToast()
const adminData = useAdminDataStore()
const business = useShopBusinessStore()

const imported = useImportedAs<StockInternal>('stock-internals', {
  code: ['ma_phieu', 'code'],
  warehouse: ['kho', 'warehouse'],
  totalQuantity: ['tong_so_luong', 'total_quantity'],
  totalValue: ['tong_gia_tri', 'total_value'],
  purpose: ['muc_dich', 'purpose'],
  status: ['trang_thai', 'status'],
  createdAt: ['ngay_tao', 'created_at'],
}, (raw, m) => ({
  id: Number(raw.id),
  code: String(m.code ?? `XNB${raw.id}`),
  warehouse: String(m.warehouse ?? ''),
  lines: [],
  totalQuantity: Number(m.totalQuantity ?? 0),
  totalValue: Number(m.totalValue ?? 0),
  purpose: String(m.purpose ?? ''),
  status: (m.status ?? 'draft') as 'draft' | 'completed',
  createdAt: String(m.createdAt ?? ''),
}))
const allInternals = computed<StockInternal[]>(() => imported.hasData.value ? imported.items.value : business.stockInternals)

const purposes = ['Marketing', 'Tặng khách', 'Mẫu thử', 'Đào tạo nhân viên', 'Hư hỏng']

if (!business.stockInternals.length) {
  business.stockInternals.push(
    { id: 1, code: 'XNB0001', warehouse: 'Kho HCM', lines: [], totalQuantity: 25, totalValue: 1250000, purpose: 'Marketing', status: 'completed', createdAt: '04/05/2026 10:00' },
    { id: 2, code: 'XNB0002', warehouse: 'Kho HN', lines: [], totalQuantity: 12, totalValue: 580000, purpose: 'Tặng khách', status: 'completed', createdAt: '03/05/2026 14:30' },
  )
}

const search = ref('')
const filterPurpose = ref('all')
const page = ref(1)
const perPage = ref(5)
const filtered = computed(() => allInternals.value.filter((i) =>
  (!search.value.trim() || i.code.toLowerCase().includes(search.value.trim().toLowerCase()))
  && (filterPurpose.value === 'all' || i.purpose === filterPurpose.value)))
const paginated = computed(() => filtered.value.slice((page.value - 1) * perPage.value, page.value * perPage.value))
watch([search, filterPurpose], () => { page.value = 1 })

const stats = computed(() => ({
  total: allInternals.value.length,
  totalQty: allInternals.value.reduce((s, i) => s + i.totalQuantity, 0),
  totalValue: allInternals.value.reduce((s, i) => s + i.totalValue, 0),
  marketing: allInternals.value.filter((i) => i.purpose === 'Marketing').length,
}))

// Create modal
const formOpen = ref(false)
const form = ref<{ warehouse: string; purpose: string; lines: OrderLine[] }>({ warehouse: 'Kho HCM', purpose: 'Marketing', lines: [] })
const productSearch = ref('')

const productResults = computed(() => {
  const q = productSearch.value.trim().toLowerCase()
  if (!q) return adminData.products.slice(0, 8)
  return adminData.products.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)).slice(0, 12)
})

function openCreate() {
  form.value = { warehouse: 'Kho HCM', purpose: 'Marketing', lines: [] }
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
  const id = Math.max(0, ...business.stockInternals.map((i) => i.id)) + 1
  const code = 'XNB' + String(id + 100).padStart(4, '0')
  // Auto-trừ tồn ngay khi tạo (status = completed)
  const item: StockInternal = {
    id, code, warehouse: form.value.warehouse,
    lines: form.value.lines, totalQuantity: totalQty, totalValue,
    purpose: form.value.purpose, status: 'completed',
    createdAt: new Date().toLocaleString('vi-VN'),
  }
  business.stockInternals.unshift(item)
  for (const line of form.value.lines) {
    adminData.adjustStock(line.productId, -line.quantity).catch(() => {})
    business.logMovement(line.productId, line.sku, line.name, 'out', -line.quantity, code, 'internal', `Xuất nội bộ: ${form.value.purpose}`)
  }
  toast.success('Đã tạo + trừ tồn', code)
  formOpen.value = false
}

const detailOpen = ref(false)
const detail = ref<StockInternal | null>(null)
function openDetail(d: StockInternal) { detail.value = d; detailOpen.value = true }

const rowMenu = [
  { key: 'view', label: 'Xem chi tiết', icon: 'ri-eye-line' },
  { key: 'delete', label: 'Xoá', icon: 'ri-delete-bin-line', tone: 'danger' as const },
]
function onAction(d: StockInternal, key: string) {
  if (key === 'view') openDetail(d)
  else if (key === 'delete') {
    business.stockInternals.splice(business.stockInternals.findIndex((x) => x.id === d.id), 1)
    toast.success('Đã xoá', d.code)
  }
}
</script>

<template>
  <div class="ym-page">
    <header class="ym-page__header">
      <div>
        <h1>Xuất dùng nội bộ</h1>
        <p>Marketing / Tặng khách / Mẫu thử… Khi tạo phiếu → tồn kho tự trừ.</p>
      </div>
      <div class="ym-page__actions">
        <ShopImportExport entity="stock-internals" id-field="code" label="phiếu xuất nội bộ" @imported="imported.refresh" />
        <button type="button" class="ym-btn ym-btn--primary" @click="openCreate"><i class="ri-add-line"></i> Tạo phiếu xuất</button>
      </div>
    </header>

    <section class="ym-mini-stats">
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Tổng phiếu</p><p class="ym-mini-stat__value">{{ stats.total }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Tổng SL</p><p class="ym-mini-stat__value">{{ stats.totalQty }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Tổng giá trị</p><p class="ym-mini-stat__value" style="color: #d0021b">{{ formatPrice(stats.totalValue) }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Marketing</p><p class="ym-mini-stat__value" style="color: #6d28d9">{{ stats.marketing }}</p></article>
    </section>

    <div class="ym-card">
      <div class="ym-toolbar">
        <div class="ym-search"><i class="ri-search-line"></i><input v-model="search" type="text" placeholder="Tìm theo mã phiếu..." /></div>
        <div class="ym-toolbar__actions"><select v-model="filterPurpose" class="ym-select"><option value="all">Tất cả mục đích</option><option v-for="p in purposes" :key="p" :value="p">{{ p }}</option></select></div>
      </div>
      <div class="ym-table-wrap">
        <table class="ym-table">
          <thead><tr><th>Mã phiếu</th><th>Kho</th><th>Mục đích</th><th class="is-center">SP</th><th class="is-center">SL</th><th class="is-right">Giá trị</th><th>Trạng thái</th><th>Thời gian</th><th></th></tr></thead>
          <tbody>
            <tr v-for="d in paginated" :key="d.id">
              <td><a href="#" class="ym-link" @click.prevent="openDetail(d)">{{ d.code }}</a></td>
              <td>{{ d.warehouse }}</td>
              <td><span class="ym-tag ym-tag--purple">{{ d.purpose }}</span></td>
              <td class="is-center">{{ d.lines.length }}</td>
              <td class="is-center"><strong>{{ d.totalQuantity }}</strong></td>
              <td class="is-right"><strong>{{ formatPrice(d.totalValue) }}</strong></td>
              <td><span :class="['ym-tag', d.status === 'completed' ? 'ym-tag--success' : 'ym-tag--neutral']">{{ d.status === 'completed' ? 'Hoàn tất' : 'Phiếu tạm' }}</span></td>
              <td class="is-muted">{{ d.createdAt }}</td>
              <td class="is-right"><RowMenu :items="rowMenu" @select="onAction(d, $event)" /></td>
            </tr>
            <tr v-if="!paginated.length"><td colspan="9" class="ym-empty">Chưa có phiếu xuất nội bộ.</td></tr>
          </tbody>
        </table>
      </div>
      <Pagination v-model="page" :total-items="filtered.length" :per-page="perPage" item-label="phiếu" @update:per-page="(n) => perPage = n" />
    </div>

    <AdminModal v-model:open="formOpen" title="Tạo phiếu xuất nội bộ" subtitle="Tồn kho sẽ trừ ngay khi lưu" size="lg" confirm-text="Lưu phiếu (trừ tồn)" @confirm="submit">
      <div class="ym-form-row">
        <div class="ym-form-group"><label>Kho</label><select v-model="form.warehouse"><option v-for="w in adminData.warehouseOptions" :key="w" :value="w">{{ w }}</option></select></div>
        <div class="ym-form-group"><label>Mục đích</label><select v-model="form.purpose"><option v-for="p in purposes" :key="p" :value="p">{{ p }}</option></select></div>
      </div>
      <div class="ym-product-picker">
        <div class="ym-search"><i class="ri-search-line"></i><input v-model="productSearch" type="text" placeholder="Tìm SP..." /></div>
        <div v-if="productSearch" class="ym-picker-results">
          <button v-for="p in productResults" :key="p.id" type="button" class="ym-picker-item" @click="addLine(p.id)">
            <img :src="p.image" :alt="p.name" />
            <div><strong>{{ p.name }}</strong><small>{{ p.sku }} · Tồn {{ p.stock }}</small></div>
            <i class="ri-add-line"></i>
          </button>
        </div>
      </div>
      <div v-if="!form.lines.length" class="ym-empty" style="padding: 20px; border: 1px dashed #e5e7eb; border-radius: 10px">Chưa chọn SP.</div>
      <div v-for="(line, idx) in form.lines" :key="line.productId" class="ym-line">
        <img :src="line.image" :alt="line.name" />
        <div class="ym-line__info"><strong>{{ line.name }}</strong><small>{{ line.sku }} · Tồn còn {{ adminData.findProduct(line.productId)?.stock || 0 }}</small></div>
        <input v-model.number="line.quantity" type="number" min="1" :max="adminData.findProduct(line.productId)?.stock" class="ym-line__input" />
        <strong class="ym-line__sum">{{ formatPrice(line.unitPrice * line.quantity) }}</strong>
        <button type="button" class="ym-icon-btn" @click="removeLine(idx)"><i class="ri-delete-bin-line"></i></button>
      </div>
    </AdminModal>

    <AdminModal v-if="detail" v-model:open="detailOpen" :title="detail.code" :subtitle="detail.purpose" size="lg" hide-footer>
      <div style="display: flex; gap: 8px; margin-bottom: 12px">
        <span :class="['ym-tag', detail.status === 'completed' ? 'ym-tag--success' : 'ym-tag--neutral']">{{ detail.status === 'completed' ? 'Hoàn tất' : 'Phiếu tạm' }}</span>
        <span class="is-muted" style="font-size: 13px">{{ detail.warehouse }} · {{ detail.createdAt }}</span>
      </div>
      <div v-for="line in detail.lines" :key="line.productId" class="ym-line ym-line--readonly">
        <img :src="line.image" :alt="line.name" />
        <div class="ym-line__info"><strong>{{ line.name }}</strong><small>{{ line.sku }}</small></div>
        <span class="is-muted">{{ formatPrice(line.unitPrice) }} × {{ line.quantity }}</span>
        <strong class="ym-line__sum">{{ formatPrice(line.unitPrice * line.quantity) }}</strong>
      </div>
      <p v-if="!detail.lines.length" style="padding: 16px; text-align: center; color: #9ca3af">Phiếu legacy không có chi tiết. SL: {{ detail.totalQuantity }} · GT: {{ formatPrice(detail.totalValue) }}</p>
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

.ym-line { display: grid; grid-template-columns: 50px 1fr 80px 100px 32px; gap: 10px; align-items: center; padding: 8px; background: #fafbfc; border: 1px solid #f1f3f5; border-radius: 8px; margin-bottom: 6px; }
.ym-line--readonly { grid-template-columns: 50px 1fr 140px 100px; }
.ym-line img { width: 50px; height: 50px; object-fit: contain; padding: 2px; background: #fff; border-radius: 6px; }
.ym-line__info { min-width: 0; }
.ym-line__info strong { display: block; font-size: 13px; color: #111827; }
.ym-line__info small { font-size: 11px; color: #6b7280; }
.ym-line__input { padding: 6px 8px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; }
.ym-line__sum { color: #d0021b; text-align: right; font-size: 14px; }
</style>
