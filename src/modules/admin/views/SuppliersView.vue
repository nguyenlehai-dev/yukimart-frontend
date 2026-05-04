<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import AdminModal from '../components/AdminModal.vue'
import RowMenu from '../components/RowMenu.vue'
import Pagination from '../components/Pagination.vue'
import ShopImportExport from '../components/ShopImportExport.vue'
import { useToast } from '../composables/useToast'
import { useShopBusinessStore, type Supplier } from '../stores/shopBusiness'
import { useImportedAs } from '../composables/useImportedAs'
import { formatPrice } from '@/modules/mypage/home/configs'

const toast = useToast()
const router = useRouter()
const business = useShopBusinessStore()

// Map data từ shop_entries (entity = 'suppliers') sang Supplier shape.
// Hỗ trợ key sạch (sau khi sửa slugifyKey) lẫn key cũ bị lỗi (ien_thoai, ia_chi).
const imported = useImportedAs<Supplier>('suppliers', {
  code: ['ma_nha_cung_cap', 'ma_ncc', 'ma', 'code', 'sku'],
  name: ['ten_nha_cung_cap', 'ten_ncc', 'ten', 'name'],
  contact: ['nguoi_lien_he', 'lien_he', 'nguoi_tao', 'contact'],
  phone: ['dien_thoai', 'ien_thoai', 'sdt', 'phone'],
  email: ['email', 'mail'],
  address: ['dia_chi', 'ia_chi', 'address', 'khu_vuc', 'phuongxa'],
  totalDebt: ['no_can_tra_hien_tai', 'cong_no', 'debt', 'total_debt'],
  totalPurchase: ['tong_mua_tru_tra_hang', 'tong_mua', 'tong_nhap', 'total_purchase'],
  active: ['trang_thai', 'active'],
}, (raw, m) => ({
  id: Number(raw.id),
  code: String(m.code ?? `NCC${raw.id}`),
  name: String(m.name ?? '(Không tên)'),
  contact: String(m.contact ?? ''),
  phone: String(m.phone ?? ''),
  email: String(m.email ?? ''),
  address: String(m.address ?? ''),
  totalDebt: Number(m.totalDebt ?? 0),
  totalPurchase: Number(m.totalPurchase ?? 0),
  active: m.active === undefined ? true : (m.active === 1 || m.active === '1' || m.active === true || String(m.active).toLowerCase() === 'active'),
}))

// Hợp nhất nguồn: ưu tiên data đã import nếu có, fallback về fake seed.
const allSuppliers = computed<Supplier[]>(() =>
  imported.hasData.value ? imported.items.value : business.suppliers,
)

const search = ref('')
const filterActive = ref<'all' | 'active' | 'inactive'>('all')
const page = ref(1)
const perPage = ref(5)

const filtered = computed(() => allSuppliers.value.filter((s) => {
  const q = search.value.trim().toLowerCase()
  return (!q || s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q) || s.phone.includes(q))
    && (filterActive.value === 'all' || (filterActive.value === 'active' ? s.active : !s.active))
}))
const paginated = computed(() => filtered.value.slice((page.value - 1) * perPage.value, page.value * perPage.value))
watch([search, filterActive], () => { page.value = 1 })

const stats = computed(() => ({
  total: allSuppliers.value.length,
  active: allSuppliers.value.filter((s) => s.active).length,
  totalDebt: allSuppliers.value.reduce((s, x) => s + x.totalDebt, 0),
  totalPurchase: allSuppliers.value.reduce((s, x) => s + x.totalPurchase, 0),
}))

const formOpen = ref(false)
const detailOpen = ref(false)
const editingId = ref<number | null>(null)
const detail = ref<Supplier | null>(null)
const form = ref<Omit<Supplier, 'id' | 'totalDebt' | 'totalPurchase'>>({ code: '', name: '', contact: '', phone: '', email: '', address: '', active: true })

function openCreate() {
  editingId.value = null
  form.value = { code: 'NCC' + String(business.suppliers.length + 1).padStart(3, '0'), name: '', contact: '', phone: '', email: '', address: '', active: true }
  formOpen.value = true
}
function openEdit(s: Supplier) {
  editingId.value = s.id
  form.value = { code: s.code, name: s.name, contact: s.contact, phone: s.phone, email: s.email, address: s.address, active: s.active }
  formOpen.value = true
}
function openDetail(s: Supplier) { detail.value = s; detailOpen.value = true }

function submit() {
  if (!form.value.name || !form.value.phone) return toast.error('Thiếu tên hoặc SĐT')
  if (editingId.value) {
    const idx = business.suppliers.findIndex((s) => s.id === editingId.value)
    if (idx >= 0) business.suppliers[idx] = { ...business.suppliers[idx], ...form.value }
    toast.success('Đã cập nhật NCC', form.value.name)
  } else {
    const id = Math.max(0, ...business.suppliers.map((s) => s.id)) + 1
    business.suppliers.unshift({ id, ...form.value, totalDebt: 0, totalPurchase: 0 })
    toast.success('Đã thêm NCC', form.value.name)
  }
  formOpen.value = false
}

function askDelete(s: Supplier) {
  if (!confirm(`Xoá NCC "${s.name}"?`)) return
  business.suppliers.splice(business.suppliers.findIndex((x) => x.id === s.id), 1)
  toast.success('Đã xoá', s.code)
}
function toggleActive(s: Supplier) { s.active = !s.active; toast.info(s.active ? 'Đã kích hoạt' : 'Đã tạm khoá', s.name) }

function rowItems(s: Supplier) {
  return [
    { key: 'view', label: 'Xem chi tiết + lịch sử nhập', icon: 'ri-eye-line' },
    { key: 'edit', label: 'Chỉnh sửa', icon: 'ri-edit-line' },
    { key: 'po', label: 'Tạo phiếu nhập mới', icon: 'ri-add-line' },
    { key: 'toggle', label: s.active ? 'Tạm khoá' : 'Kích hoạt', icon: s.active ? 'ri-lock-line' : 'ri-lock-unlock-line' },
    { key: 'delete', label: 'Xoá NCC', icon: 'ri-delete-bin-line', tone: 'danger' as const },
  ]
}
function onRowAction(s: Supplier, key: string) {
  if (key === 'view') openDetail(s)
  else if (key === 'edit') openEdit(s)
  else if (key === 'po') router.push('/admin/purchase-orders')
  else if (key === 'toggle') toggleActive(s)
  else if (key === 'delete') askDelete(s)
}
</script>

<template>
  <div class="ym-page">
    <header class="ym-page__header">
      <div>
        <h1>Nhà cung cấp</h1>
        <p>Quản lý NCC. Click vào NCC để xem lịch sử phiếu nhập + công nợ.</p>
      </div>
      <div class="ym-page__actions">
        <ShopImportExport entity="suppliers" id-field="code" label="nhà cung cấp" @imported="imported.refresh" />
        <button type="button" class="ym-btn ym-btn--primary" @click="openCreate"><i class="ri-add-line"></i> Thêm NCC</button>
      </div>
    </header>

    <section class="ym-mini-stats">
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Tổng NCC</p><p class="ym-mini-stat__value">{{ stats.total }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Đang hoạt động</p><p class="ym-mini-stat__value" style="color: #166534">{{ stats.active }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Công nợ phải trả</p><p class="ym-mini-stat__value" style="color: #d0021b">{{ formatPrice(stats.totalDebt) }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Tổng đã nhập</p><p class="ym-mini-stat__value" style="color: #326e51">{{ formatPrice(stats.totalPurchase) }}</p></article>
    </section>

    <div class="ym-card">
      <div class="ym-toolbar">
        <div class="ym-search"><i class="ri-search-line"></i><input v-model="search" type="text" placeholder="Tìm theo tên, mã, SĐT..." /></div>
        <div class="ym-toolbar__actions">
          <select v-model="filterActive" class="ym-select"><option value="all">Tất cả</option><option value="active">Hoạt động</option><option value="inactive">Đã khoá</option></select>
        </div>
      </div>
      <div class="ym-table-wrap">
        <table class="ym-table">
          <thead><tr><th>Mã</th><th>Tên NCC</th><th>Liên hệ</th><th>SĐT</th><th class="is-center">Số PN</th><th class="is-right">Công nợ</th><th class="is-right">Tổng nhập</th><th>Trạng thái</th><th></th></tr></thead>
          <tbody>
            <tr v-for="s in paginated" :key="s.id">
              <td><strong>{{ s.code }}</strong></td>
              <td><a href="#" class="ym-link" @click.prevent="openDetail(s)">{{ s.name }}</a></td>
              <td>{{ s.contact }}</td>
              <td>{{ s.phone }}</td>
              <td class="is-center">{{ business.poOfSupplier(s.id).length }}</td>
              <td class="is-right" :class="s.totalDebt > 0 ? 'is-danger' : 'is-muted'">{{ formatPrice(s.totalDebt) }}</td>
              <td class="is-right"><strong>{{ formatPrice(s.totalPurchase) }}</strong></td>
              <td><span :class="['ym-tag', s.active ? 'ym-tag--success' : 'ym-tag--neutral']">{{ s.active ? 'Hoạt động' : 'Đã khoá' }}</span></td>
              <td class="is-right"><RowMenu :items="rowItems(s)" @select="onRowAction(s, $event)" /></td>
            </tr>
            <tr v-if="!paginated.length"><td colspan="9" class="ym-empty">Không có NCC.</td></tr>
          </tbody>
        </table>
      </div>
      <Pagination v-model="page" :total-items="filtered.length" :per-page="perPage" item-label="NCC" @update:per-page="(n) => perPage = n" />
    </div>

    <!-- Form modal -->
    <AdminModal v-model:open="formOpen" :title="editingId ? 'Sửa NCC' : 'Thêm NCC'" size="md" :confirm-text="editingId ? 'Lưu' : 'Thêm'" @confirm="submit">
      <div class="ym-form-row">
        <div class="ym-form-group"><label>Mã NCC *</label><input v-model="form.code" type="text" /></div>
        <div class="ym-form-group"><label>Tên NCC *</label><input v-model="form.name" type="text" /></div>
      </div>
      <div class="ym-form-group"><label>Người liên hệ</label><input v-model="form.contact" type="text" /></div>
      <div class="ym-form-row">
        <div class="ym-form-group"><label>SĐT *</label><input v-model="form.phone" type="tel" /></div>
        <div class="ym-form-group"><label>Email</label><input v-model="form.email" type="email" /></div>
      </div>
      <div class="ym-form-group"><label>Địa chỉ</label><input v-model="form.address" type="text" /></div>
      <label class="ym-checkbox"><input v-model="form.active" type="checkbox" /> Đang hoạt động</label>
    </AdminModal>

    <!-- Detail modal -->
    <AdminModal v-if="detail" v-model:open="detailOpen" :title="detail.name" :subtitle="detail.code" size="lg" hide-footer>
      <div class="ym-grid-2" style="margin-bottom: 16px">
        <div><label>Liên hệ</label><strong>{{ detail.contact }}</strong></div>
        <div><label>SĐT</label><strong>{{ detail.phone }}</strong></div>
        <div><label>Email</label><strong>{{ detail.email }}</strong></div>
        <div><label>Địa chỉ</label><strong>{{ detail.address }}</strong></div>
        <div><label>Tổng nhập</label><strong style="color: #326e51">{{ formatPrice(detail.totalPurchase) }}</strong></div>
        <div><label>Công nợ phải trả</label><strong style="color: #d0021b">{{ formatPrice(detail.totalDebt) }}</strong></div>
      </div>

      <h4 style="margin: 0 0 8px; font-size: 13px; text-transform: uppercase; color: #374151">Lịch sử phiếu nhập ({{ business.poOfSupplier(detail.id).length }})</h4>
      <div v-if="business.poOfSupplier(detail.id).length" class="ym-table-wrap">
        <table class="ym-table">
          <thead><tr><th>Mã PN</th><th class="is-center">SP</th><th class="is-right">Giá trị</th><th class="is-right">Đã trả</th><th>Trạng thái</th><th>Thời gian</th></tr></thead>
          <tbody>
            <tr v-for="po in business.poOfSupplier(detail.id)" :key="po.id">
              <td><strong>{{ po.code }}</strong></td>
              <td class="is-center">{{ po.lines.reduce((s, l) => s + l.quantity, 0) }}</td>
              <td class="is-right">{{ formatPrice(po.total) }}</td>
              <td class="is-right is-muted">{{ formatPrice(po.paid) }}</td>
              <td><span class="ym-tag" :class="po.status === 'received' ? 'ym-tag--success' : po.status === 'cancelled' ? 'ym-tag--danger' : 'ym-tag--warning'">{{ po.status }}</span></td>
              <td class="is-muted">{{ po.createdAt }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else style="color: #9ca3af; padding: 20px; text-align: center">Chưa có phiếu nhập nào từ NCC này.</p>

      <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 14px">
        <button type="button" class="ym-btn" @click="detailOpen = false; openEdit(detail!)"><i class="ri-edit-line"></i> Sửa</button>
        <button type="button" class="ym-btn ym-btn--primary" @click="$router.push('/admin/purchase-orders')"><i class="ri-add-line"></i> Tạo phiếu nhập mới</button>
      </div>
    </AdminModal>
  </div>
</template>

<style scoped src="./_admin-shared.css"></style>
<style scoped>
.ym-select { padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 8px; background: #fff; font-size: 14px; }
.ym-checkbox { display: flex; align-items: center; gap: 8px; font-size: 14px; cursor: pointer; }
.ym-table .is-danger { color: #d0021b; font-weight: 600; }
.ym-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 18px; padding: 14px; background: #fafbfc; border: 1px solid #f1f3f5; border-radius: 10px; }
.ym-grid-2 > div { display: flex; flex-direction: column; gap: 2px; }
.ym-grid-2 label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.4px; color: #6b7280; }
.ym-grid-2 strong { font-size: 14px; color: #111827; font-weight: 500; }
</style>
