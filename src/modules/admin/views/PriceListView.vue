<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import AdminModal from '../components/AdminModal.vue'
import RowMenu from '../components/RowMenu.vue'
import ShopImportExport from '../components/ShopImportExport.vue'
import { useToast } from '../composables/useToast'
import { useShopBusinessStore, type PriceList } from '../stores/shopBusiness'
import { useAdminDataStore } from '../stores/adminData'
import { useImportedAs } from '../composables/useImportedAs'
import { formatPrice } from '@/modules/mypage/home/configs'

const toast = useToast()
const router = useRouter()
const business = useShopBusinessStore()
const adminData = useAdminDataStore()

/** Tìm product theo SKU (case-insensitive) trong tập đã import vào shop_products. */
function findProductBySku(sku: string): { id: number } | undefined {
  const s = sku.trim().toLowerCase()
  if (!s) return undefined
  return adminData.products.find((p) => (p.sku || '').toLowerCase() === s)
}

/** Parse cột "SP áp dụng" → 'all' | number[]. Hỗ trợ "Tất cả", "all", "*", danh sách SKU. */
function parseProductIds(raw: any): number[] | 'all' {
  if (raw === undefined || raw === null || raw === '') return 'all'
  const s = String(raw).trim().toLowerCase()
  if (s === '' || s === 'all' || s === '*' || s === 'tat ca' || s === 'tất cả' || s === 'tatca') return 'all'
  // Tách theo , ; | xuống dòng
  const skus = s.split(/[,;|\n]+/).map((x) => x.trim()).filter(Boolean)
  const ids: number[] = []
  for (const sku of skus) {
    const p = findProductBySku(sku)
    if (p) ids.push(p.id)
  }
  return ids.length > 0 ? ids : 'all'
}

/** Coerce appliesTo về group code/name hợp lệ. */
function parseAppliesTo(raw: any): PriceList['appliesTo'] {
  if (raw === undefined || raw === null || raw === '') return 'all'
  const s = String(raw).trim().toLowerCase()
  if (s === '' || s === 'all' || s === 'tất cả' || s === 'tat ca') return 'all'
  if (s.includes('vip')) return 'vip'
  if (s.includes('sỉ') || s.includes('si') || s.includes('wholesale')) return 'wholesale'
  if (s.includes('lẻ') || s.includes('le') || s.includes('retail')) return 'retail'
  if (s.includes('mới') || s.includes('moi') || s === 'new') return 'NEW'
  if (s.includes('inactive') || s.includes('không hoạt')) return 'INACTIVE'
  return s as any // giữ raw text
}

const imported = useImportedAs<PriceList>('price-lists', {
  code: ['ma', 'ma_bang_gia', 'code'],
  name: ['ten', 'ten_bang_gia', 'name'],
  appliesTo: ['ap_dung_cho', 'applies_to', 'doi_tuong'],
  type: ['loai', 'type'],
  value: ['gia_tri', 'value', 'phan_tram', 'discount'],
  productIds: ['san_pham_ap_dung', 'sp_ap_dung', 'product_skus', 'product_ids'],
  startDate: ['ngay_bat_dau', 'start_date'],
  endDate: ['ngay_ket_thuc', 'end_date'],
  active: ['trang_thai', 'active'],
}, (raw, m) => ({
  id: Number(raw.id),
  code: String(m.code ?? `BG${raw.id}`),
  name: String(m.name ?? '(Không tên)'),
  appliesTo: parseAppliesTo(m.appliesTo),
  type: (() => {
    const s = String(m.type ?? 'percent').toLowerCase()
    return (s === 'fixed' || s === 'co_dinh' || s === 'cố định') ? 'fixed' : 'percent'
  })(),
  value: Number(m.value ?? 0),
  productIds: parseProductIds(m.productIds),
  startDate: String(m.startDate ?? ''),
  endDate: String(m.endDate ?? ''),
  active: m.active === undefined ? true : (m.active === 1 || m.active === '1' || m.active === true),
}))
const allPriceLists = computed<PriceList[]>(() => imported.hasData.value ? imported.items.value : business.priceLists)

/** Đếm SP thật được áp dụng cho 1 price list — dùng cho stats + detail modal. */
function priceListProductCount(pl: PriceList): number {
  if (pl.productIds === 'all') return adminData.products.length
  return Array.isArray(pl.productIds) ? pl.productIds.length : 0
}

const appliesMap: Record<string, { label: string; tone: string }> = {
  all: { label: 'Tất cả khách', tone: 'neutral' },
  retail: { label: 'Khách lẻ', tone: 'info' },
  wholesale: { label: 'Khách sỉ', tone: 'primary' },
  vip: { label: 'Khách VIP', tone: 'warning' },
  NEW: { label: 'Khách mới', tone: 'purple' },
  INACTIVE: { label: 'Khách không hoạt động', tone: 'neutral' },
}

const formOpen = ref(false)
const editingId = ref<number | null>(null)
const detailOpen = ref(false)
const detail = ref<PriceList | null>(null)
const form = ref<Omit<PriceList, 'id'>>({ code: '', name: '', appliesTo: 'all', type: 'percent', value: 0, productIds: 'all', startDate: '', endDate: '', active: true })

function openCreate() {
  editingId.value = null
  form.value = { code: 'BG-' + String(business.priceLists.length + 1).padStart(3, '0'), name: '', appliesTo: 'all', type: 'percent', value: 0, productIds: 'all', startDate: '', endDate: '', active: true }
  formOpen.value = true
}
function openEdit(p: PriceList) {
  editingId.value = p.id
  form.value = { code: p.code, name: p.name, appliesTo: p.appliesTo, type: p.type, value: p.value, productIds: p.productIds, startDate: p.startDate, endDate: p.endDate, active: p.active }
  formOpen.value = true
}
function openDetail(p: PriceList) { detail.value = p; detailOpen.value = true }

function submit() {
  if (!form.value.name) return toast.error('Thiếu tên bảng giá')
  if (editingId.value) {
    const idx = business.priceLists.findIndex((p) => p.id === editingId.value)
    if (idx >= 0) business.priceLists[idx] = { ...business.priceLists[idx], ...form.value }
    toast.success('Đã cập nhật', form.value.name)
  } else {
    const id = Math.max(0, ...business.priceLists.map((p) => p.id)) + 1
    business.priceLists.unshift({ id, ...form.value })
    toast.success('Đã thêm bảng giá', form.value.name)
  }
  formOpen.value = false
}
function toggleActive(p: PriceList) { p.active = !p.active; toast.info(p.active ? 'Đã kích hoạt' : 'Đã tạm dừng', p.name) }
function remove(p: PriceList) {
  if (!confirm(`Xoá bảng giá "${p.name}"?`)) return
  business.priceLists.splice(business.priceLists.findIndex((x) => x.id === p.id), 1)
  toast.success('Đã xoá', p.code)
}
function onAction(p: PriceList, key: string) {
  if (key === 'view') openDetail(p)
  else if (key === 'edit') openEdit(p)
  else if (key === 'toggle') toggleActive(p)
  else if (key === 'delete') remove(p)
}
function rowItems(p: PriceList) {
  return [
    { key: 'view', label: 'Xem chi tiết + sản phẩm', icon: 'ri-eye-line' },
    { key: 'edit', label: 'Chỉnh sửa', icon: 'ri-edit-line' },
    { key: 'toggle', label: p.active ? 'Tạm dừng' : 'Kích hoạt', icon: p.active ? 'ri-pause-line' : 'ri-play-line' },
    { key: 'delete', label: 'Xoá', icon: 'ri-delete-bin-line', tone: 'danger' as const },
  ]
}

// Sản phẩm được áp dụng bảng giá
function productsAffected(pl: PriceList) {
  if (pl.productIds === 'all') return adminData.products
  return adminData.products.filter((p) => Array.isArray(pl.productIds) && pl.productIds.includes(p.id))
}

function effectivePrice(originalPrice: number, pl: PriceList) {
  if (pl.type === 'percent') return Math.round(originalPrice * (1 + pl.value / 100))
  return Math.max(0, originalPrice + pl.value)
}

// Nhóm khách dùng bảng giá nào
function groupsUsing(plId: number) {
  return business.customerGroups.filter((g) => g.priceListId === plId)
}

const stats = computed(() => ({
  total: allPriceLists.value.length,
  active: allPriceLists.value.filter((p) => p.active).length,
  productsAffected: allPriceLists.value.reduce((s, pl) => s + (pl.productIds === 'all' ? adminData.products.length : (Array.isArray(pl.productIds) ? pl.productIds.length : 0)), 0),
  promotion: allPriceLists.value.filter((p) => p.code.startsWith('KM')).length,
}))

function gotoProduct(_id: number) { router.push('/admin/products') }
function gotoGroup() { router.push('/admin/customer-groups') }
</script>

<template>
  <div class="ym-page">
    <header class="ym-page__header">
      <div>
        <h1>Thiết lập giá</h1>
        <p>Bảng giá theo nhóm khách. Mỗi nhóm gắn 1 bảng giá → áp dụng cho tất cả sản phẩm khi đặt đơn.</p>
      </div>
      <div class="ym-page__actions">
        <ShopImportExport entity="price-lists" id-field="code" label="bảng giá" @imported="imported.refresh" />
        <button type="button" class="ym-btn ym-btn--primary" @click="openCreate"><i class="ri-add-line"></i> Tạo bảng giá</button>
      </div>
    </header>

    <section class="ym-mini-stats">
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Tổng bảng giá</p><p class="ym-mini-stat__value">{{ stats.total }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Đang áp dụng</p><p class="ym-mini-stat__value" style="color: #166534">{{ stats.active }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Sản phẩm áp dụng</p><p class="ym-mini-stat__value">{{ stats.productsAffected }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Khuyến mãi</p><p class="ym-mini-stat__value" style="color: #d0021b">{{ stats.promotion }}</p></article>
    </section>

    <div class="ym-card">
      <div class="ym-table-wrap">
        <table class="ym-table">
          <thead><tr><th>Mã</th><th>Tên bảng giá</th><th>Áp dụng cho</th><th>Loại</th><th class="is-right">Giá trị</th><th class="is-center">SP áp dụng</th><th>Nhóm liên kết</th><th>Hiệu lực</th><th>Trạng thái</th><th></th></tr></thead>
          <tbody>
            <tr v-for="p in allPriceLists" :key="p.id">
              <td><strong>{{ p.code }}</strong></td>
              <td><a href="#" class="ym-link" @click.prevent="openDetail(p)">{{ p.name }}</a></td>
              <td><span :class="['ym-tag', `ym-tag--${appliesMap[p.appliesTo]?.tone || 'neutral'}`]">{{ appliesMap[p.appliesTo]?.label || p.appliesTo }}</span></td>
              <td class="is-muted">{{ p.type === 'percent' ? 'Phần trăm' : 'Số tiền' }}</td>
              <td class="is-right"><strong :style="{ color: p.value < 0 ? '#d0021b' : '#326e51' }">{{ p.type === 'percent' ? `${p.value}%` : formatPrice(p.value) }}</strong></td>
              <td class="is-center">{{ p.productIds === 'all' ? 'Tất cả' : (Array.isArray(p.productIds) ? p.productIds.length : 0) }}</td>
              <td>
                <div class="ym-group-chips">
                  <button v-for="g in groupsUsing(p.id)" :key="g.id" type="button" class="ym-group-chip" :style="{ background: g.color + '22', color: g.color, borderColor: g.color + '44' }" @click="gotoGroup">
                    {{ g.code }}
                  </button>
                  <span v-if="!groupsUsing(p.id).length" class="is-muted" style="font-size: 12px">—</span>
                </div>
              </td>
              <td class="is-muted">{{ p.startDate }} → {{ p.endDate }}</td>
              <td><span :class="['ym-tag', p.active ? 'ym-tag--success' : 'ym-tag--neutral']">{{ p.active ? 'Đang áp dụng' : 'Tạm dừng' }}</span></td>
              <td class="is-right"><RowMenu :items="rowItems(p)" @select="onAction(p, $event)" /></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Form -->
    <AdminModal v-model:open="formOpen" :title="editingId ? 'Sửa bảng giá' : 'Tạo bảng giá'" size="md" :confirm-text="editingId ? 'Lưu' : 'Tạo'" @confirm="submit">
      <div class="ym-form-row">
        <div class="ym-form-group"><label>Mã *</label><input v-model="form.code" type="text" /></div>
        <div class="ym-form-group"><label>Tên bảng giá *</label><input v-model="form.name" type="text" /></div>
      </div>
      <div class="ym-form-row">
        <div class="ym-form-group">
          <label>Áp dụng cho</label>
          <select v-model="form.appliesTo">
            <option value="all">Tất cả khách</option>
            <option value="retail">Khách lẻ</option>
            <option value="wholesale">Khách sỉ</option>
            <option value="vip">Khách VIP</option>
            <option value="NEW">Khách mới (NEW)</option>
            <option value="INACTIVE">Không hoạt động</option>
          </select>
        </div>
        <div class="ym-form-group">
          <label>Loại điều chỉnh</label>
          <select v-model="form.type"><option value="percent">Phần trăm (%)</option><option value="fixed">Số tiền cố định</option></select>
        </div>
      </div>
      <div class="ym-form-group">
        <label>Giá trị {{ form.type === 'percent' ? '(% — số âm là giảm giá)' : '(₫ — số âm là giảm giá)' }}</label>
        <input v-model.number="form.value" type="number" />
      </div>
      <div class="ym-form-row">
        <div class="ym-form-group"><label>Bắt đầu</label><input v-model="form.startDate" type="text" placeholder="dd/mm/yyyy" /></div>
        <div class="ym-form-group"><label>Kết thúc</label><input v-model="form.endDate" type="text" placeholder="dd/mm/yyyy" /></div>
      </div>
      <label class="ym-checkbox"><input v-model="form.active" type="checkbox" /> Đang áp dụng</label>
    </AdminModal>

    <!-- Detail modal: show affected products with effective prices -->
    <AdminModal v-if="detail" v-model:open="detailOpen" :title="detail.name" :subtitle="detail.code" size="xl" hide-footer>
      <div class="ym-pl-meta">
        <div><label>Áp dụng cho</label><strong>{{ appliesMap[detail.appliesTo]?.label || detail.appliesTo }}</strong></div>
        <div><label>Điều chỉnh</label><strong :style="{ color: detail.value < 0 ? '#d0021b' : '#326e51' }">{{ detail.type === 'percent' ? `${detail.value}%` : formatPrice(detail.value) }}</strong></div>
        <div><label>Hiệu lực</label><strong>{{ detail.startDate }} → {{ detail.endDate }}</strong></div>
        <div><label>Trạng thái</label><span :class="['ym-tag', detail.active ? 'ym-tag--success' : 'ym-tag--neutral']">{{ detail.active ? 'Đang áp dụng' : 'Tạm dừng' }}</span></div>
      </div>

      <!-- Groups using this price list -->
      <div v-if="groupsUsing(detail.id).length" class="ym-pl-section">
        <h4>Nhóm khách áp dụng</h4>
        <div class="ym-group-chips">
          <RouterLink v-for="g in groupsUsing(detail.id)" :key="g.id" to="/admin/customer-groups" class="ym-group-chip" :style="{ background: g.color + '22', color: g.color, borderColor: g.color + '44' }">
            <i class="ri-group-line"></i> {{ g.name }} ({{ business.customersInGroup(g.id).length }} khách)
          </RouterLink>
        </div>
      </div>

      <!-- Affected products -->
      <div class="ym-pl-section">
        <h4>Sản phẩm áp dụng ({{ productsAffected(detail).length }})</h4>
        <div class="ym-table-wrap">
          <table class="ym-table">
            <thead><tr><th>Sản phẩm</th><th class="is-right">Giá gốc</th><th class="is-right">Giá sau áp dụng</th><th class="is-right">Chênh lệch</th></tr></thead>
            <tbody>
              <tr v-for="p in productsAffected(detail).slice(0, 50)" :key="p.id">
                <td>
                  <button type="button" class="ym-cell-prod" @click="gotoProduct(p.id)">
                    <img :src="p.image" :alt="p.name" />
                    <div class="ym-cell-user">
                      <strong>{{ p.name }}</strong>
                      <small>{{ p.sku }} · {{ p.category }}</small>
                    </div>
                  </button>
                </td>
                <td class="is-right">{{ formatPrice(p.salePrice) }}</td>
                <td class="is-right"><strong style="color: #326e51">{{ formatPrice(effectivePrice(p.salePrice, detail)) }}</strong></td>
                <td class="is-right" :style="{ color: effectivePrice(p.salePrice, detail) < p.salePrice ? '#d0021b' : '#326e51' }">
                  <strong>{{ formatPrice(effectivePrice(p.salePrice, detail) - p.salePrice) }}</strong>
                </td>
              </tr>
              <tr v-if="!productsAffected(detail).length"><td colspan="4" class="ym-empty">Không có sản phẩm.</td></tr>
            </tbody>
          </table>
        </div>
        <p v-if="productsAffected(detail).length > 50" style="margin-top: 8px; font-size: 12px; color: #6b7280; text-align: center">+ {{ productsAffected(detail).length - 50 }} sản phẩm khác...</p>
      </div>

      <div style="display: flex; gap: 8px; justify-content: flex-end">
        <button type="button" class="ym-btn" @click="detailOpen = false; openEdit(detail!)"><i class="ri-edit-line"></i> Chỉnh sửa bảng giá</button>
      </div>
    </AdminModal>
  </div>
</template>

<style scoped src="./_admin-shared.css"></style>
<style scoped>
.ym-checkbox { display: flex; align-items: center; gap: 8px; font-size: 14px; cursor: pointer; }

.ym-pl-meta { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; padding: 14px; background: #fafbfc; border: 1px solid #f1f3f5; border-radius: 10px; margin-bottom: 16px; }
.ym-pl-meta > div { display: flex; flex-direction: column; gap: 2px; }
.ym-pl-meta label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.4px; }
.ym-pl-meta strong { font-size: 14px; color: #111827; }

.ym-pl-section { margin-bottom: 18px; }
.ym-pl-section h4 { margin: 0 0 8px; font-size: 13px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.4px; }

.ym-group-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.ym-group-chip { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border: 1px solid; border-radius: 999px; font-size: 12px; font-weight: 500; cursor: pointer; text-decoration: none; }

.ym-cell-prod { display: flex; align-items: center; gap: 8px; border: none; background: transparent; cursor: pointer; padding: 0; text-align: left; }
.ym-cell-prod img { width: 36px; height: 36px; object-fit: contain; padding: 2px; background: #fafbfc; border: 1px solid #f1f3f5; border-radius: 6px; }
.ym-cell-prod strong { color: #111827; }
.ym-cell-prod:hover strong { color: #326e51; }
</style>
