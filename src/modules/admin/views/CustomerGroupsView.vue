<script setup lang="ts">
import { ref, computed } from 'vue'
import AdminModal from '../components/AdminModal.vue'
import RowMenu from '../components/RowMenu.vue'
import ShopImportExport from '../components/ShopImportExport.vue'
import { useToast } from '../composables/useToast'
import { useShopBusinessStore, type CustomerGroup, type Customer, type PriceList } from '../stores/shopBusiness'
import { useImportedAs } from '../composables/useImportedAs'
import { useShopEntity } from '../composables/useShopEntity'
import { formatPrice } from '@/modules/mypage/home/configs'

const toast = useToast()
const business = useShopBusinessStore()
const groupsEntity = useShopEntity('customer-groups')

// Khách hàng thật (BE) — dùng để đếm thành viên + stats nhóm.
const importedCustomers = useImportedAs<Customer>('customers', {
  name: ['ten_khach_hang', 'ten_kh', 'ten', 'name', 'full_name'],
  email: ['email', 'mail'],
  phone: ['dien_thoai', 'ien_thoai', 'sdt', 'phone'],
  groupId: ['nhom', 'nhom_khach_hang', 'loai_khach', 'loai_khach_hang', 'group_id', 'group'],
  ordersCount: ['so_don', 'orders_count'],
  totalSpent: ['tong_chi_tieu', 'tong_mua', 'total_spent'],
  joinedAt: ['ngay_tao', 'ngay_tham_gia', 'joined_at', 'created_at'],
}, (raw, m) => ({
  id: Number(raw.id),
  name: String(m.name ?? '(Không tên)'),
  email: String(m.email ?? ''),
  phone: String(m.phone ?? ''),
  groupId: typeof m.groupId === 'number' ? m.groupId : Number(m.groupId ?? 3) || 3,
  ordersCount: Number(m.ordersCount ?? 0),
  totalSpent: Number(m.totalSpent ?? 0),
  joinedAt: String(m.joinedAt ?? ''),
  active: true,
  initial: String(m.name ?? '?').trim().charAt(0).toUpperCase() || '?',
  avatarTone: 'blue' as any,
}))
const allCustomers = computed<Customer[]>(() =>
  importedCustomers.ready.value ? importedCustomers.items.value : [],
)

// Imported price-lists để tra cứu priceListId theo code/name khi customer-groups
// import có cột "Bảng giá" dạng text (vd "BG-VIP", "Giá VIP").
const importedPriceLists = useImportedAs<PriceList>('price-lists', {
  code: ['ma', 'ma_bang_gia', 'code'],
  name: ['ten', 'ten_bang_gia', 'name'],
}, (raw, m) => ({
  id: Number(raw.id),
  code: String(m.code ?? ''),
  name: String(m.name ?? ''),
  appliesTo: 'all',
  type: 'percent',
  value: 0,
  productIds: 'all',
  startDate: '',
  endDate: '',
  active: true,
}))
const allPriceLists = computed<PriceList[]>(() =>
  importedPriceLists.hasData.value ? importedPriceLists.items.value : business.priceLists,
)
function findPriceList(idOrName: number | string | undefined | null): PriceList | undefined {
  if (idOrName === undefined || idOrName === null || idOrName === '') return undefined
  const list = allPriceLists.value
  if (typeof idOrName === 'number') return list.find((pl) => pl.id === idOrName)
  const s = String(idOrName).trim().toLowerCase()
  if (/^\d+$/.test(s)) return list.find((pl) => pl.id === Number(s))
  return list.find((pl) => (pl.code || '').toLowerCase() === s)
    || list.find((pl) => (pl.name || '').toLowerCase() === s)
}

const imported = useImportedAs<CustomerGroup>('customer-groups', {
  code: ['ma', 'ma_nhom', 'code'],
  name: ['ten', 'ten_nhom', 'name'],
  description: ['mo_ta', 'description'],
  minSpent: ['chi_tieu_toi_thieu', 'min_spent'],
  discount: ['giam_gia', 'discount'],
  color: ['mau', 'color'],
  active: ['trang_thai', 'active'],
  priceListId: ['bang_gia', 'ma_bang_gia', 'price_list', 'price_list_id'],
}, (raw, m) => {
  // Nếu priceListId là text (vd "BG-VIP"), lookup → numeric id.
  const plRef = findPriceList(m.priceListId as any)
  return {
    id: Number(raw.id),
    code: String(m.code ?? ''),
    name: String(m.name ?? ''),
    description: String(m.description ?? ''),
    minSpent: Number(m.minSpent ?? 0),
    discount: Number(m.discount ?? 0),
    color: String(m.color ?? '#326e51'),
    active: m.active === undefined ? true : (m.active === 1 || m.active === '1' || m.active === true),
    priceListId: plRef?.id ?? (typeof m.priceListId === 'number' ? m.priceListId : null),
  }
})
const allGroups = computed<CustomerGroup[]>(() => imported.hasData.value ? imported.items.value : business.customerGroups)

const formOpen = ref(false)
const editingId = ref<number | null>(null)
const form = ref<Omit<CustomerGroup, 'id'>>({ code: '', name: '', description: '', minSpent: 0, discount: 0, color: '#326e51', active: true, priceListId: null })

function openCreate() {
  editingId.value = null
  form.value = { code: '', name: '', description: '', minSpent: 0, discount: 0, color: '#326e51', active: true, priceListId: null }
  formOpen.value = true
}
function openEdit(g: CustomerGroup) {
  editingId.value = g.id
  form.value = { code: g.code, name: g.name, description: g.description, minSpent: g.minSpent, discount: g.discount, color: g.color, active: g.active, priceListId: g.priceListId }
  formOpen.value = true
}
async function submit() {
  if (!form.value.name || !form.value.code) return toast.error('Thiếu mã hoặc tên nhóm')
  const payload: Record<string, any> = {
    code: form.value.code,
    name: form.value.name,
    description: form.value.description,
    min_spent: form.value.minSpent,
    discount: form.value.discount,
    color: form.value.color,
    active: form.value.active,
    price_list_id: form.value.priceListId,
  }
  try {
    if (editingId.value) {
      await groupsEntity.update(editingId.value, payload)
      toast.success('Đã cập nhật', form.value.name)
    } else {
      await groupsEntity.create(payload)
      toast.success('Đã thêm', form.value.name)
    }
    await imported.refresh({ force: true })
    formOpen.value = false
  } catch (err: any) {
    toast.error('Lưu thất bại', err?.response?.data?.message || err?.message || 'Lỗi không xác định')
  }
}
// Confirm dialog state — thay browser confirm() bằng AdminModal đẹp hơn.
const confirmOpen = ref(false)
const confirmCtx = ref<{ title: string; message: string; tone: 'danger' | 'primary'; action: () => void } | null>(null)

function remove(g: CustomerGroup) {
  const memberCount = memberCountOf(g)
  confirmCtx.value = {
    title: `Xoá nhóm "${g.name}"?`,
    message: memberCount > 0
      ? `Nhóm này đang có ${memberCount} khách. Xoá nhóm sẽ không xoá khách nhưng họ sẽ mất nhóm này.`
      : 'Hành động không thể hoàn tác.',
    tone: 'danger',
    action: async () => {
      try {
        await groupsEntity.remove(g.id)
        await imported.refresh({ force: true })
        toast.success('Đã xoá', g.code)
      } catch (err: any) {
        toast.error('Xoá thất bại', err?.response?.data?.message || err?.message || 'Lỗi không xác định')
      }
    },
  }
  confirmOpen.value = true
}
function onAction(g: CustomerGroup, key: string) {
  if (key === 'edit') openEdit(g)
  else if (key === 'view-customers') openMembers(g)
  else if (key === 'delete') remove(g)
}
function rowItems() {
  return [
    { key: 'edit', label: 'Chỉnh sửa', icon: 'ri-edit-line' },
    { key: 'view-customers', label: 'Xem khách trong nhóm', icon: 'ri-group-line' },
    { key: 'delete', label: 'Xoá', icon: 'ri-delete-bin-line', tone: 'danger' as const },
  ]
}

// Members modal
const membersOpen = ref(false)
const membersGroup = ref<CustomerGroup | null>(null)
const membersSearch = ref('')

function openMembers(g: CustomerGroup) {
  membersGroup.value = g
  membersSearch.value = ''
  membersOpen.value = true
}

const groupMembers = computed(() => {
  if (!membersGroup.value) return []
  const gid = membersGroup.value.id
  const list = allCustomers.value.filter((c) => c.groupId === gid)
  const q = membersSearch.value.trim().toLowerCase()
  if (!q) return list
  return list.filter((m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || m.phone.includes(q))
})

const stats = computed(() => {
  const vipGroup = allGroups.value.find((g) => (g.code || '').toUpperCase() === 'VIP')
  return {
    total: allGroups.value.length,
    active: allGroups.value.filter((g) => g.active).length,
    totalCustomers: allCustomers.value.length,
    vipCount: vipGroup ? allCustomers.value.filter((c) => c.groupId === vipGroup.id).length : 0,
  }
})

function memberCountOf(g: CustomerGroup) {
  return allCustomers.value.filter((c) => c.groupId === g.id).length
}
</script>

<template>
  <div class="ym-page">
    <header class="ym-page__header">
      <div>
        <h1>Nhóm khách hàng</h1>
        <p>Phân nhóm khách hàng. Mỗi nhóm gắn 1 bảng giá tự động áp dụng khi khách đặt đơn.</p>
      </div>
      <div class="ym-page__actions">
        <ShopImportExport entity="customer-groups" id-field="name" label="nhóm khách hàng" @imported="imported.refresh" />
        <button type="button" class="ym-btn ym-btn--primary" @click="openCreate"><i class="ri-add-line"></i> Thêm nhóm</button>
      </div>
    </header>

    <section class="ym-mini-stats">
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Tổng nhóm</p><p class="ym-mini-stat__value">{{ stats.total }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Đang áp dụng</p><p class="ym-mini-stat__value" style="color: #166534">{{ stats.active }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Tổng khách</p><p class="ym-mini-stat__value">{{ stats.totalCustomers }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Khách VIP</p><p class="ym-mini-stat__value" style="color: #f7c948">{{ stats.vipCount }}</p></article>
    </section>

    <div class="ym-groups">
      <article v-for="g in allGroups" :key="g.id" class="ym-group">
        <div class="ym-group__head">
          <span class="ym-group__badge" :style="{ background: g.color }"><i class="ri-group-line"></i></span>
          <div>
            <h3>{{ g.name }}</h3>
            <p class="ym-group__code">{{ g.code }}</p>
          </div>
          <span :class="['ym-tag', g.active ? 'ym-tag--success' : 'ym-tag--neutral']">{{ g.active ? 'Đang áp dụng' : 'Tạm dừng' }}</span>
          <RowMenu :items="rowItems()" @select="onAction(g, $event)" />
        </div>
        <p class="ym-group__desc">{{ g.description }}</p>
        <dl class="ym-group__stats">
          <div><dt>Số khách</dt><dd><strong>{{ memberCountOf(g) }}</strong></dd></div>
          <div><dt>Chi tiêu min</dt><dd>{{ g.minSpent > 0 ? formatPrice(g.minSpent) : '—' }}</dd></div>
          <div><dt>Giảm giá</dt><dd :style="{ color: g.discount > 0 ? '#d0021b' : '#6b7280' }"><strong>{{ g.discount > 0 ? `-${g.discount}%` : '—' }}</strong></dd></div>
        </dl>
        <div v-if="g.priceListId" class="ym-group__price">
          <i class="ri-price-tag-3-line"></i> Bảng giá: <strong>{{ findPriceList(g.priceListId)?.name }}</strong>
        </div>
      </article>
    </div>

    <AdminModal v-model:open="formOpen" :title="editingId ? 'Sửa nhóm' : 'Thêm nhóm khách'" size="md" :confirm-text="editingId ? 'Lưu' : 'Tạo'" @confirm="submit">
      <div class="ym-form-row">
        <div class="ym-form-group"><label>Mã *</label><input v-model="form.code" type="text" /></div>
        <div class="ym-form-group"><label>Tên *</label><input v-model="form.name" type="text" /></div>
      </div>
      <div class="ym-form-group"><label>Mô tả</label><textarea v-model="form.description" rows="2"></textarea></div>
      <div class="ym-form-row">
        <div class="ym-form-group"><label>Chi tiêu tối thiểu (₫)</label><input v-model.number="form.minSpent" type="number" min="0" /></div>
        <div class="ym-form-group"><label>Giảm giá (%)</label><input v-model.number="form.discount" type="number" min="0" max="100" /></div>
      </div>
      <div class="ym-form-group">
        <label>Bảng giá áp dụng tự động</label>
        <select v-model="form.priceListId">
          <option :value="null">— Không áp dụng —</option>
          <option v-for="pl in allPriceLists" :key="pl.id" :value="pl.id">{{ pl.name }}</option>
        </select>
      </div>
      <div class="ym-form-group"><label>Màu nhóm</label><input v-model="form.color" type="color" style="height: 40px; padding: 4px" /></div>
      <label class="ym-checkbox"><input v-model="form.active" type="checkbox" /> Đang áp dụng</label>
    </AdminModal>

    <!-- Members modal -->
    <AdminModal v-if="membersGroup" v-model:open="membersOpen" :title="`Khách hàng trong nhóm: ${membersGroup.name}`" :subtitle="`${groupMembers.length} khách`" size="xl" hide-footer>
      <div class="ym-search" style="margin-bottom: 14px">
        <i class="ri-search-line"></i>
        <input v-model="membersSearch" type="text" placeholder="Tìm theo tên, email, SĐT..." />
      </div>

      <div class="ym-table-wrap">
        <table class="ym-table">
          <thead><tr><th>Khách hàng</th><th>SĐT</th><th class="is-center">Đơn</th><th class="is-right">Đã chi tiêu</th><th>Tham gia</th></tr></thead>
          <tbody>
            <tr v-for="m in groupMembers" :key="m.id">
              <td>
                <div class="ym-customer">
                  <span :class="['ym-avatar', `ym-avatar--${m.avatarTone}`]" style="width: 32px; height: 32px; font-size: 13px">{{ m.initial }}</span>
                  <div class="ym-cell-user">
                    <strong>{{ m.name }}</strong>
                    <small>{{ m.email }}</small>
                  </div>
                </div>
              </td>
              <td>{{ m.phone }}</td>
              <td class="is-center">{{ m.ordersCount }}</td>
              <td class="is-right"><strong>{{ formatPrice(m.totalSpent) }}</strong></td>
              <td class="is-muted">{{ m.joinedAt }}</td>
            </tr>
            <tr v-if="!groupMembers.length"><td colspan="5" class="ym-empty">{{ membersSearch ? 'Không tìm thấy.' : 'Chưa có khách trong nhóm này.' }}</td></tr>
          </tbody>
        </table>
      </div>

      <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 14px">
        <RouterLink to="/admin/customers" class="ym-btn"><i class="ri-external-link-line"></i> Quản lý khách hàng</RouterLink>
        <button type="button" class="ym-btn ym-btn--primary" @click="membersOpen = false">Đóng</button>
      </div>
    </AdminModal>

    <AdminModal v-if="confirmCtx" v-model:open="confirmOpen" :title="confirmCtx.title" size="sm" :confirm-tone="confirmCtx.tone" :confirm-text="confirmCtx.tone === 'danger' ? 'Xác nhận xoá' : 'OK'" @confirm="confirmCtx.action(); confirmOpen = false">
      <p style="margin: 0; color: #4b5563">{{ confirmCtx.message }}</p>
    </AdminModal>
  </div>
</template>

<style scoped src="./_admin-shared.css"></style>
<style scoped>
.ym-customer { display: flex; align-items: center; gap: 10px; }
.ym-groups { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 14px; }
.ym-group { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 18px; }
.ym-group__head { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
.ym-group__badge { width: 44px; height: 44px; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; color: #fff; font-size: 20px; }
.ym-group__head h3 { margin: 0; font-size: 15px; color: #111827; }
.ym-group__code { margin: 2px 0 0; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.4px; }
.ym-group__head .ym-tag { margin-left: auto; }
.ym-group__desc { margin: 0; font-size: 13px; color: #6b7280; line-height: 1.5; }
.ym-group__stats { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin: 10px 0 0; padding: 12px; background: #fafbfc; border-radius: 8px; }
.ym-group__stats div { display: flex; flex-direction: column; gap: 2px; }
.ym-group__stats dt { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.4px; }
.ym-group__stats dd { margin: 0; font-size: 14px; color: #111827; }
.ym-group__price { margin-top: 10px; padding: 8px 12px; background: #e8f0ec; border-radius: 8px; color: #326e51; font-size: 13px; }
.ym-group__price strong { color: #1c5a3f; }

.ym-checkbox { display: flex; align-items: center; gap: 8px; font-size: 14px; cursor: pointer; }
</style>
