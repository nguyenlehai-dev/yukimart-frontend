<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import AdminModal from '../components/AdminModal.vue'
import RowMenu from '../components/RowMenu.vue'
import Pagination from '../components/Pagination.vue'
import ShopImportExport from '../components/ShopImportExport.vue'
import { useToast } from '../composables/useToast'
import { useAdminDataStore } from '../stores/adminData'
import { useShopBusinessStore, type StockCheck } from '../stores/shopBusiness'
import { useImportedAs } from '../composables/useImportedAs'

const toast = useToast()
const adminData = useAdminDataStore()
const business = useShopBusinessStore()

const imported = useImportedAs<StockCheck>('stock-checks', {
  code: ['ma_phieu', 'code'],
  warehouse: ['kho', 'warehouse'],
  itemsChecked: ['so_sp_da_kiem', 'items_checked'],
  differences: ['chenh_lech', 'differences'],
  status: ['trang_thai', 'status'],
  createdAt: ['ngay_tao', 'created_at'],
  createdBy: ['nguoi_tao', 'created_by'],
}, (raw, m) => ({
  id: Number(raw.id),
  code: String(m.code ?? `KK${raw.id}`),
  warehouse: String(m.warehouse ?? 'Kho HCM'),
  itemsChecked: Number(m.itemsChecked ?? 0),
  differences: Number(m.differences ?? 0),
  status: (m.status ?? 'draft') as StockCheck['status'],
  createdAt: String(m.createdAt ?? ''),
  createdBy: String(m.createdBy ?? 'Admin'),
}))
const allChecks = computed<StockCheck[]>(() => imported.hasData.value ? imported.items.value : business.stockChecks)

interface CheckLine { productId: number; sku: string; name: string; image: string; expected: number; actual: number; diff: number }

const statusMap = {
  draft: { label: 'Đang kiểm', tone: 'warning' },
  completed: { label: 'Đã kiểm', tone: 'info' },
  adjusted: { label: 'Đã điều chỉnh', tone: 'success' },
}

if (!business.stockChecks.length) {
  business.stockChecks.push(
    { id: 1, code: 'KK0001', warehouse: 'Kho HCM', itemsChecked: 38, differences: 5, status: 'adjusted', createdAt: '04/05/2026 09:00', createdBy: 'Admin' },
  )
}

const checkLinesMap = ref<Record<number, CheckLine[]>>({})

const search = ref(''); const filterStatus = ref<'all' | keyof typeof statusMap>('all')
const page = ref(1); const perPage = ref(5)
const filtered = computed(() => allChecks.value.filter((i) => (!search.value.trim() || i.code.toLowerCase().includes(search.value.trim().toLowerCase())) && (filterStatus.value === 'all' || i.status === filterStatus.value)))
const paginated = computed(() => filtered.value.slice((page.value - 1) * perPage.value, page.value * perPage.value))
watch([search, filterStatus], () => { page.value = 1 })

const stats = computed(() => ({
  total: allChecks.value.length,
  inProgress: allChecks.value.filter((i) => i.status === 'draft').length,
  totalDifferences: allChecks.value.reduce((s, i) => s + i.differences, 0),
  adjusted: allChecks.value.filter((i) => i.status === 'adjusted').length,
}))

const formOpen = ref(false)
const formWarehouse = ref('Kho HCM')
const formLines = ref<CheckLine[]>([])

function openCreate() {
  formWarehouse.value = adminData.warehouseOptions[0] || 'Kho HCM'
  formLines.value = adminData.products
    .filter((p) => p.warehouse === formWarehouse.value)
    .slice(0, 20)
    .map((p) => ({ productId: p.id, sku: p.sku, name: p.name, image: p.image, expected: p.stock, actual: p.stock, diff: 0 }))
  formOpen.value = true
}

function recomputeDiff(line: CheckLine) { line.diff = line.actual - line.expected }
function changeWh() {
  formLines.value = adminData.products
    .filter((p) => p.warehouse === formWarehouse.value)
    .slice(0, 20)
    .map((p) => ({ productId: p.id, sku: p.sku, name: p.name, image: p.image, expected: p.stock, actual: p.stock, diff: 0 }))
}

function submit() {
  const differences = formLines.value.filter((l) => l.diff !== 0).length
  const id = Math.max(0, ...business.stockChecks.map((c) => c.id)) + 1
  const code = 'KK' + String(id + 100).padStart(4, '0')
  business.stockChecks.unshift({
    id, code, warehouse: formWarehouse.value,
    itemsChecked: formLines.value.length, differences,
    status: 'draft', createdAt: new Date().toLocaleString('vi-VN'), createdBy: 'Admin',
  })
  // Lưu chi tiết line
  checkLinesMap.value[id] = JSON.parse(JSON.stringify(formLines.value))
  toast.success('Đã tạo phiếu kiểm', code)
  formOpen.value = false
}

function adjust(c: StockCheck) {
  if (c.status === 'adjusted') return
  const lines = checkLinesMap.value[c.id] || []
  if (!lines.length) {
    c.status = 'adjusted'
    toast.info('Phiếu legacy đã đánh dấu adjusted', c.code)
    return
  }
  if (!confirm(`Điều chỉnh tồn theo phiếu kiểm ${c.code}? Tồn kho thực tế sẽ ghi đè theo số đếm.`)) return
  for (const line of lines) {
    if (line.diff !== 0) {
      adminData.adjustStock(line.productId, line.diff).catch(() => {})
      business.logMovement(line.productId, line.sku, line.name, 'adjust', line.diff, c.code, 'check', `Kiểm kho: thực tế ${line.actual} vs hệ thống ${line.expected}`)
    }
  }
  c.status = 'adjusted'
  toast.success('Đã điều chỉnh tồn', c.code)
}

const detailOpen = ref(false); const detail = ref<StockCheck | null>(null)
function openDetail(c: StockCheck) { detail.value = c; detailOpen.value = true }

const rowMenu = (c: StockCheck) => {
  const items: { key: string; label: string; icon: string; tone?: 'danger' }[] = [{ key: 'view', label: 'Xem chi tiết', icon: 'ri-eye-line' }]
  if (c.status !== 'adjusted') items.push({ key: 'adjust', label: 'Điều chỉnh tồn', icon: 'ri-equalizer-line' })
  items.push({ key: 'delete', label: 'Xoá', icon: 'ri-delete-bin-line', tone: 'danger' })
  return items
}
function onAction(c: StockCheck, key: string) {
  if (key === 'view') openDetail(c)
  else if (key === 'adjust') adjust(c)
  else if (key === 'delete') {
    business.stockChecks.splice(business.stockChecks.findIndex((x) => x.id === c.id), 1)
    delete checkLinesMap.value[c.id]
    toast.success('Đã xoá', c.code)
  }
}
</script>

<template>
  <div class="ym-page">
    <header class="ym-page__header">
      <div><h1>Kiểm kho</h1><p>Đối chiếu tồn thực tế với hệ thống. Điều chỉnh → log movement chênh lệch.</p></div>
      <div class="ym-page__actions">
        <ShopImportExport entity="stock-checks" id-field="code" label="phiếu kiểm kho" @imported="imported.refresh" />
        <button type="button" class="ym-btn ym-btn--primary" @click="openCreate"><i class="ri-add-line"></i> Tạo phiếu kiểm</button>
      </div>
    </header>

    <section class="ym-mini-stats">
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Tổng phiếu</p><p class="ym-mini-stat__value">{{ stats.total }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Đang kiểm</p><p class="ym-mini-stat__value" style="color: #92400e">{{ stats.inProgress }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Tổng SP lệch</p><p class="ym-mini-stat__value" style="color: #d0021b">{{ stats.totalDifferences }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Đã điều chỉnh</p><p class="ym-mini-stat__value" style="color: #166534">{{ stats.adjusted }}</p></article>
    </section>

    <div class="ym-card">
      <div class="ym-toolbar">
        <div class="ym-search"><i class="ri-search-line"></i><input v-model="search" type="text" placeholder="Tìm theo mã..." /></div>
        <div class="ym-toolbar__actions"><select v-model="filterStatus" class="ym-select"><option value="all">Tất cả</option><option v-for="(v, k) in statusMap" :key="k" :value="k">{{ v.label }}</option></select></div>
      </div>
      <div class="ym-table-wrap">
        <table class="ym-table">
          <thead><tr><th>Mã phiếu</th><th>Kho</th><th class="is-center">SKU kiểm</th><th class="is-center">SP lệch</th><th>Trạng thái</th><th>Thời gian</th><th></th></tr></thead>
          <tbody>
            <tr v-for="c in paginated" :key="c.id">
              <td><a href="#" class="ym-link" @click.prevent="openDetail(c)">{{ c.code }}</a></td>
              <td>{{ c.warehouse }}</td>
              <td class="is-center">{{ c.itemsChecked }}</td>
              <td class="is-center" :class="c.differences > 0 ? 'is-danger' : 'is-muted'"><strong>{{ c.differences }}</strong></td>
              <td><span :class="['ym-tag', `ym-tag--${statusMap[c.status]?.tone || 'neutral'}`]">{{ statusMap[c.status]?.label || c.status }}</span></td>
              <td class="is-muted">{{ c.createdAt }}</td>
              <td class="is-right"><RowMenu :items="rowMenu(c)" @select="onAction(c, $event)" /></td>
            </tr>
            <tr v-if="!paginated.length"><td colspan="7" class="ym-empty">Chưa có phiếu kiểm.</td></tr>
          </tbody>
        </table>
      </div>
      <Pagination v-model="page" :total-items="filtered.length" :per-page="perPage" item-label="phiếu" @update:per-page="(n) => perPage = n" />
    </div>

    <AdminModal v-model:open="formOpen" title="Tạo phiếu kiểm kho" subtitle="Đếm SL thực tế cho từng SP" size="xl" confirm-text="Lưu phiếu" @confirm="submit">
      <div class="ym-form-group">
        <label>Kho kiểm</label>
        <select v-model="formWarehouse" @change="changeWh()"><option v-for="w in adminData.warehouseOptions" :key="w" :value="w">{{ w }}</option></select>
      </div>
      <div class="ym-table-wrap">
        <table class="ym-table">
          <thead><tr><th>SP</th><th class="is-center">Hệ thống</th><th class="is-center">Thực tế đếm</th><th class="is-center">Chênh lệch</th></tr></thead>
          <tbody>
            <tr v-for="line in formLines" :key="line.productId">
              <td><div class="ym-cell-prod"><img :src="line.image" :alt="line.name" /><div><strong>{{ line.name }}</strong><small>{{ line.sku }}</small></div></div></td>
              <td class="is-center is-muted">{{ line.expected }}</td>
              <td class="is-center"><input v-model.number="line.actual" type="number" min="0" class="ym-line__input" style="width: 80px" @input="recomputeDiff(line)" /></td>
              <td class="is-center" :class="line.diff > 0 ? 'is-success' : line.diff < 0 ? 'is-danger' : ''"><strong>{{ line.diff > 0 ? '+' : '' }}{{ line.diff }}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
    </AdminModal>

    <AdminModal v-if="detail" v-model:open="detailOpen" :title="detail.code" :subtitle="detail.warehouse" size="lg" hide-footer>
      <div style="display: flex; gap: 8px; margin-bottom: 12px">
        <span :class="['ym-tag', `ym-tag--${statusMap[detail.status]?.tone || 'neutral'}`]">{{ statusMap[detail.status]?.label || detail.status }}</span>
        <span class="is-muted" style="font-size: 13px">{{ detail.itemsChecked }} SKU · {{ detail.differences }} lệch · {{ detail.createdAt }}</span>
      </div>
      <table v-if="checkLinesMap[detail.id]?.length" class="ym-table">
        <thead><tr><th>SP</th><th class="is-center">HT</th><th class="is-center">Thực tế</th><th class="is-center">Lệch</th></tr></thead>
        <tbody>
          <tr v-for="line in checkLinesMap[detail.id]" :key="line.productId">
            <td><div class="ym-cell-prod"><img :src="line.image" :alt="line.name" /><span>{{ line.name }}</span></div></td>
            <td class="is-center is-muted">{{ line.expected }}</td>
            <td class="is-center">{{ line.actual }}</td>
            <td class="is-center" :class="line.diff > 0 ? 'is-success' : line.diff < 0 ? 'is-danger' : ''"><strong>{{ line.diff > 0 ? '+' : '' }}{{ line.diff }}</strong></td>
          </tr>
        </tbody>
      </table>
      <p v-else style="padding: 16px; text-align: center; color: #9ca3af">Phiếu legacy không có chi tiết line.</p>
      <div v-if="detail.status !== 'adjusted'" style="display: flex; justify-content: flex-end; margin-top: 14px">
        <button type="button" class="ym-btn ym-btn--primary" @click="adjust(detail!); detailOpen = false"><i class="ri-equalizer-line"></i> Điều chỉnh tồn theo phiếu</button>
      </div>
    </AdminModal>
  </div>
</template>

<style scoped src="./_admin-shared.css"></style>
<style scoped>
.ym-select { padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 8px; background: #fff; font-size: 14px; }
.ym-cell-prod { display: flex; align-items: center; gap: 8px; }
.ym-cell-prod img { width: 36px; height: 36px; object-fit: contain; padding: 2px; background: #fafbfc; border-radius: 6px; }
.ym-cell-prod strong, .ym-cell-prod span { font-size: 13px; color: #111827; }
.ym-cell-prod small { display: block; font-size: 11px; color: #6b7280; }
.ym-line__input { padding: 6px 8px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; text-align: center; }
.ym-table .is-danger { color: #d0021b; font-weight: 600; }
.ym-table .is-success { color: #166534; font-weight: 600; }
</style>
