<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import AdminModal from '../components/AdminModal.vue'
import Pagination from '../components/Pagination.vue'
import { useToast } from '../composables/useToast'
import { useAdminDataStore, type AdminProduct } from '../stores/adminData'
import { useShopBusinessStore } from '../stores/shopBusiness'
import { formatPrice } from '@/modules/mypage/home/configs'

const toast = useToast()
const store = useAdminDataStore()
const business = useShopBusinessStore()

// Lịch sử biến động kho — đọc từ central store (audit trail thật)
const history = computed(() => business.inventoryMovements)

const search = ref('')
const filterStatus = ref<'all' | 'low' | 'out' | 'ok'>('all')
const filterWarehouse = ref('all')
const page = ref(1)
const perPage = ref(5)

function statusOf(item: AdminProduct): 'out' | 'low' | 'ok' {
  if (item.stock === 0) return 'out'
  if (item.stock < item.threshold) return 'low'
  return 'ok'
}

const statusInfo = {
  out: { label: 'Hết hàng', tone: 'danger' },
  low: { label: 'Sắp hết', tone: 'warning' },
  ok: { label: 'Đủ hàng', tone: 'success' },
}

const filtered = computed(() => {
  return store.products.filter((it) => {
    const s = statusOf(it)
    const matchStatus = filterStatus.value === 'all' || s === filterStatus.value
    const matchWh = filterWarehouse.value === 'all' || it.warehouse === filterWarehouse.value
    const q = search.value.trim().toLowerCase()
    const matchSearch = !q || it.name.toLowerCase().includes(q) || it.sku.toLowerCase().includes(q) || it.brand.toLowerCase().includes(q)
    return matchStatus && matchWh && matchSearch
  })
})

const paginated = computed(() => {
  const start = (page.value - 1) * perPage.value
  return filtered.value.slice(start, start + perPage.value)
})
watch([search, filterStatus, filterWarehouse], () => { page.value = 1 })

const stats = computed(() => {
  const totalValue = store.totalStockValue
  return {
    sku: store.products.length,
    totalStock: store.products.reduce((s, i) => s + i.stock, 0),
    lowStock: store.lowStock.length,
    outOfStock: store.outOfStock.length,
    totalValue,
  }
})

// Stock movement
type MoveType = 'in' | 'out' | 'adjust'
const moveOpen = ref(false)
const historyOpen = ref(false)
const moveType = ref<MoveType>('in')
const moveTarget = ref<AdminProduct | null>(null)
const moveQty = ref(0)
const moveReason = ref('')

function openMove(item: AdminProduct, type: MoveType) {
  moveTarget.value = item
  moveType.value = type
  moveQty.value = type === 'adjust' ? 0 : 1
  moveReason.value = ''
  moveOpen.value = true
}

function nowStr() {
  const d = new Date()
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function submitMove() {
  if (!moveTarget.value || !moveQty.value) {
    toast.error('Số lượng không hợp lệ')
    return
  }
  let delta = 0
  if (moveType.value === 'in') delta = Math.abs(moveQty.value)
  else if (moveType.value === 'out') delta = -Math.abs(moveQty.value)
  else delta = moveQty.value

  if (moveTarget.value.stock + delta < 0) {
    toast.error('Không đủ tồn', `${moveTarget.value.sku} chỉ còn ${moveTarget.value.stock}.`)
    return
  }

  store.adjustStock(moveTarget.value.id, delta)
  business.logMovement(
    moveTarget.value.id, moveTarget.value.sku, moveTarget.value.name,
    moveType.value, delta,
    'ADJ-' + moveTarget.value.sku,
    'manual',
    moveReason.value
  )

  const labels = { in: 'Nhập kho', out: 'Xuất kho', adjust: 'Điều chỉnh' }
  toast.success(`${labels[moveType.value]} thành công`, `${moveTarget.value.sku}: ${delta > 0 ? '+' : ''}${delta}`)
  moveOpen.value = false
}

// Bulk import
const importOpen = ref(false)
const importItems = ref<{ sku: string; name: string; warehouse: string; quantity: number }[]>([
  { sku: '', name: '', warehouse: 'Kho HCM', quantity: 0 },
])

function addImportRow() {
  importItems.value.push({ sku: '', name: '', warehouse: 'Kho HCM', quantity: 0 })
}
function removeImportRow(idx: number) {
  importItems.value.splice(idx, 1)
  if (!importItems.value.length) addImportRow()
}
function fillNameFromSku(row: { sku: string; name: string }) {
  const it = store.products.find((i) => i.sku === row.sku)
  if (it) row.name = it.name
}
function submitImport() {
  let count = 0
  for (const row of importItems.value) {
    if (!row.sku || !row.quantity) continue
    const it = store.products.find((p) => p.sku === row.sku)
    if (it) {
      store.adjustStock(it.id, Math.abs(row.quantity))
      business.logMovement(it.id, it.sku, it.name, 'in', Math.abs(row.quantity), 'BULK-IMPORT', 'manual', 'Phiếu nhập kho hàng loạt')
      count++
    }
  }
  if (count === 0) {
    toast.warning('Không nhập được', 'Kiểm tra SKU và số lượng.')
    return
  }
  toast.success('Phiếu nhập kho', `Đã nhập ${count} mặt hàng.`)
  importItems.value = [{ sku: '', name: '', warehouse: 'Kho HCM', quantity: 0 }]
  importOpen.value = false
}

function exportInventory() {
  toast.info('Đang xuất tồn kho', `${filtered.value.length} mục`)
}

function formatNum(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value)
}
</script>

<template>
  <div class="ym-page">
    <header class="ym-page__header">
      <div>
        <h1>Tồn kho</h1>
        <p>Theo dõi tồn kho, cảnh báo hàng sắp hết và điều chỉnh số lượng</p>
      </div>
      <div class="ym-page__actions">
        <button type="button" class="ym-btn" @click="historyOpen = true"><i class="ri-history-line"></i> Lịch sử</button>
        <button type="button" class="ym-btn" @click="exportInventory"><i class="ri-download-2-line"></i> Xuất kho</button>
        <button type="button" class="ym-btn ym-btn--primary" @click="importOpen = true"><i class="ri-add-line"></i> Phiếu nhập</button>
      </div>
    </header>

    <section class="ym-mini-stats">
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Số SKU</p><p class="ym-mini-stat__value">{{ stats.sku }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Tổng tồn</p><p class="ym-mini-stat__value">{{ formatNum(stats.totalStock) }} <small>SP</small></p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Sắp hết</p><p class="ym-mini-stat__value" style="color: #92400e">{{ stats.lowStock }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Hết hàng</p><p class="ym-mini-stat__value" style="color: #991b1b">{{ stats.outOfStock }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Giá trị tồn</p><p class="ym-mini-stat__value" style="color: #326e51">{{ formatPrice(stats.totalValue) }}</p></article>
    </section>

    <div v-if="stats.lowStock + stats.outOfStock > 0" class="ym-alert">
      <i class="ri-error-warning-line"></i>
      <div>
        <strong>{{ stats.outOfStock }} sản phẩm hết hàng</strong> và
        <strong>{{ stats.lowStock }} sản phẩm sắp hết.</strong>
        Hãy nhập thêm hàng để tránh gián đoạn bán hàng.
      </div>
      <button type="button" class="ym-btn ym-btn--sm ym-btn--primary" @click="importOpen = true">Tạo phiếu nhập</button>
    </div>

    <div class="ym-card">
      <div class="ym-toolbar">
        <div class="ym-search">
          <i class="ri-search-line"></i>
          <input v-model="search" type="text" placeholder="Tìm theo SKU, tên sản phẩm, thương hiệu..." />
        </div>
        <div class="ym-toolbar__actions">
          <select v-model="filterWarehouse" class="ym-select">
            <option value="all">Tất cả kho</option>
            <option v-for="w in store.warehouseOptions" :key="w" :value="w">{{ w }}</option>
          </select>
          <select v-model="filterStatus" class="ym-select">
            <option value="all">Tất cả trạng thái</option>
            <option value="ok">Đủ hàng</option>
            <option value="low">Sắp hết</option>
            <option value="out">Hết hàng</option>
          </select>
        </div>
      </div>

      <div class="ym-table-wrap">
        <table class="ym-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Sản phẩm</th>
              <th>Kho</th>
              <th class="is-right">Tồn</th>
              <th class="is-right">Đặt</th>
              <th class="is-right">Khả dụng</th>
              <th class="is-right">Định mức</th>
              <th>Trạng thái</th>
              <th class="is-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="it in paginated" :key="it.id">
              <td><strong>{{ it.sku }}</strong></td>
              <td>
                <div class="ym-customer">
                  <img :src="it.image" :alt="it.name" class="ym-thumb" loading="lazy" />
                  <div class="ym-cell-user">
                    <strong>{{ it.name }}</strong>
                    <small>{{ it.brand }} · {{ it.category }}</small>
                  </div>
                </div>
              </td>
              <td>{{ it.warehouse }}</td>
              <td class="is-right" :class="statusOf(it) === 'out' ? 'is-danger' : statusOf(it) === 'low' ? 'is-warning' : ''">{{ formatNum(it.stock) }}</td>
              <td class="is-right is-muted">{{ formatNum(it.reserved) }}</td>
              <td class="is-right"><strong>{{ formatNum(it.stock - it.reserved) }}</strong></td>
              <td class="is-right is-muted">{{ formatNum(it.threshold) }}</td>
              <td><span :class="['ym-tag', `ym-tag--${statusInfo[statusOf(it)].tone}`]">{{ statusInfo[statusOf(it)].label }}</span></td>
              <td class="is-right">
                <div class="ym-actions-group">
                  <button type="button" class="ym-btn ym-btn--sm" @click="openMove(it, 'in')" title="Nhập"><i class="ri-arrow-down-line"></i></button>
                  <button type="button" class="ym-btn ym-btn--sm" @click="openMove(it, 'out')" title="Xuất"><i class="ri-arrow-up-line"></i></button>
                  <button type="button" class="ym-btn ym-btn--sm" @click="openMove(it, 'adjust')" title="Điều chỉnh"><i class="ri-tools-line"></i></button>
                </div>
              </td>
            </tr>
            <tr v-if="!filtered.length"><td colspan="9" class="ym-empty">Không có mục nào.</td></tr>
          </tbody>
        </table>
      </div>

      <Pagination
        v-model="page"
        :total-items="filtered.length"
        :per-page="perPage"
        item-label="SKU"
        @update:per-page="(n) => perPage = n"
      />
    </div>

    <AdminModal v-if="moveTarget" v-model:open="moveOpen" :title="moveType === 'in' ? `Nhập kho: ${moveTarget.sku}` : moveType === 'out' ? `Xuất kho: ${moveTarget.sku}` : `Điều chỉnh: ${moveTarget.sku}`" size="sm" confirm-text="Xác nhận" @confirm="submitMove">
      <p style="margin: 0 0 10px; font-size: 14px; color: #4b5563">
        {{ moveTarget.name }}<br>
        Tồn hiện tại: <strong>{{ moveTarget.stock }}</strong>
      </p>
      <div class="ym-form-group">
        <label>{{ moveType === 'adjust' ? 'Số lượng (+/-)' : 'Số lượng' }}</label>
        <input v-model.number="moveQty" type="number" :min="moveType === 'adjust' ? undefined : 1" />
      </div>
      <div class="ym-form-group">
        <label>Lý do / Ghi chú</label>
        <textarea v-model="moveReason" rows="2" placeholder="Vd: Nhập từ NCC, hư hỏng..."></textarea>
      </div>
    </AdminModal>

    <AdminModal v-model:open="importOpen" title="Phiếu nhập kho" subtitle="Nhập nhiều mặt hàng cùng lúc" size="xl" confirm-text="Lưu phiếu" @confirm="submitImport">
      <table class="ym-table">
        <thead>
          <tr>
            <th>SKU</th>
            <th>Sản phẩm</th>
            <th>Kho</th>
            <th class="is-right">Số lượng</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, idx) in importItems" :key="idx">
            <td><input v-model="row.sku" type="text" list="sku-options" placeholder="SKU" class="ym-inline-input" @blur="fillNameFromSku(row)" /></td>
            <td><input v-model="row.name" type="text" placeholder="Tự động" class="ym-inline-input" /></td>
            <td>
              <select v-model="row.warehouse" class="ym-inline-input">
                <option v-for="w in store.warehouseOptions" :key="w" :value="w">{{ w }}</option>
              </select>
            </td>
            <td class="is-right"><input v-model.number="row.quantity" type="number" min="0" class="ym-inline-input" style="width: 100px" /></td>
            <td class="is-right">
              <button type="button" class="ym-icon-btn" @click="removeImportRow(idx)"><i class="ri-delete-bin-line"></i></button>
            </td>
          </tr>
        </tbody>
      </table>
      <datalist id="sku-options">
        <option v-for="it in store.products" :key="it.id" :value="it.sku">{{ it.name }}</option>
      </datalist>
      <button type="button" class="ym-btn ym-btn--sm" style="margin-top: 10px" @click="addImportRow">
        <i class="ri-add-line"></i> Thêm dòng
      </button>
    </AdminModal>

    <AdminModal v-model:open="historyOpen" title="Lịch sử biến động kho" size="lg" hide-footer>
      <table class="ym-table">
        <thead>
          <tr>
            <th>Thời gian</th>
            <th>SKU</th>
            <th>Loại</th>
            <th class="is-right">Số lượng</th>
            <th>Người thực hiện</th>
            <th>Lý do</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="h in history" :key="h.id">
            <td class="is-muted">{{ h.at }}</td>
            <td><strong>{{ h.productSku }}</strong></td>
            <td>
              <span :class="['ym-tag', h.type === 'in' ? 'ym-tag--success' : h.type === 'out' ? 'ym-tag--info' : 'ym-tag--warning']">
                {{ h.type === 'in' ? 'Nhập' : h.type === 'out' ? 'Xuất' : 'Điều chỉnh' }}
              </span>
            </td>
            <td class="is-right" :class="h.quantity > 0 ? 'is-success' : 'is-danger'"><strong>{{ h.quantity > 0 ? '+' : '' }}{{ h.quantity }}</strong></td>
            <td>{{ h.by }}</td>
            <td class="is-muted">{{ h.reason || '—' }}</td>
          </tr>
          <tr v-if="!history.length"><td colspan="6" class="ym-empty">Chưa có lịch sử.</td></tr>
        </tbody>
      </table>
    </AdminModal>
  </div>
</template>

<style scoped src="./_admin-shared.css"></style>
<style scoped>
.ym-customer { display: flex; align-items: center; gap: 10px; }
.ym-thumb { width: 40px; height: 40px; object-fit: contain; padding: 2px; background: #fafbfc; border: 1px solid #f1f3f5; border-radius: 6px; flex-shrink: 0; }
.ym-select { padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 8px; background: #fff; font-size: 14px; }
.ym-alert { display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: #fef3c7; border: 1px solid #fde68a; border-radius: 10px; color: #92400e; font-size: 14px; }
.ym-alert > i { font-size: 22px; flex-shrink: 0; }
.ym-alert > div { flex: 1; }
.ym-table .is-danger { color: #d0021b; font-weight: 600; }
.ym-table .is-warning { color: #92400e; font-weight: 600; }
.ym-table .is-success { color: #166534; font-weight: 600; }
.ym-actions-group { display: inline-flex; gap: 4px; }
.ym-inline-input { width: 100%; padding: 6px 8px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; background: #fff; }
.ym-inline-input:focus { outline: none; border-color: #326e51; }
</style>
