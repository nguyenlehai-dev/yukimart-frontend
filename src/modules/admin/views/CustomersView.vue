<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import AdminModal from '../components/AdminModal.vue'
import RowMenu from '../components/RowMenu.vue'
import Pagination from '../components/Pagination.vue'
import ShopImportExport from '../components/ShopImportExport.vue'
import { useToast } from '../composables/useToast'
import { useShopBusinessStore, type Customer, type CustomerGroup } from '../stores/shopBusiness'
import { useImportedAs } from '../composables/useImportedAs'
import { useShopEntity } from '../composables/useShopEntity'
import { useServerPagedList } from '../composables/useServerPagedList'
import api from '@/services/api'
import { formatPrice } from '@/modules/mypage/home/configs'

const customersEntity = useShopEntity('customers')

const toast = useToast()
const business = useShopBusinessStore()

// Đọc imported customer-groups trước để tra cứu (groupId) theo tên khi customer
// imported chỉ có cột "Nhóm" dạng text (vd "VIP", "Sỉ", "Lẻ"). Khi không có
// imported groups thì fallback về fake business.customerGroups.
const importedGroups = useImportedAs<CustomerGroup>('customer-groups', {
  code: ['ma', 'ma_nhom', 'code'],
  name: ['ten', 'ten_nhom', 'name'],
  description: ['mo_ta', 'description'],
  minSpent: ['chi_tieu_toi_thieu', 'min_spent'],
  discount: ['giam_gia', 'discount'],
  color: ['mau', 'color'],
  active: ['trang_thai', 'active'],
  priceListId: ['bang_gia', 'price_list_id'],
}, (raw, m) => ({
  id: Number(raw.id),
  code: String(m.code ?? ''),
  name: String(m.name ?? ''),
  description: String(m.description ?? ''),
  minSpent: Number(m.minSpent ?? 0),
  discount: Number(m.discount ?? 0),
  color: String(m.color ?? '#326e51'),
  active: m.active === undefined ? true : (m.active === 1 || m.active === '1' || m.active === true),
  priceListId: m.priceListId !== undefined && m.priceListId !== null ? Number(m.priceListId) : null,
}))
const allGroups = computed<CustomerGroup[]>(() =>
  importedGroups.hasData.value ? importedGroups.items.value : business.customerGroups,
)

/** Tra cứu group: nhận id (number) hoặc name (string) → trả về CustomerGroup. */
function findGroup(idOrName: number | string | undefined): CustomerGroup | undefined {
  if (idOrName === undefined || idOrName === null || idOrName === '') return undefined
  const list = allGroups.value
  if (typeof idOrName === 'number') return list.find((g) => g.id === idOrName)
  const s = String(idOrName).trim().toLowerCase()
  return list.find((g) => String(g.id) === s)
    || list.find((g) => g.code?.toLowerCase() === s)
    || list.find((g) => g.name?.toLowerCase() === s)
}

// Server-side pagination + search. Mỗi lần đổi page/search refetch đúng 1 request.
const filterGroupId = ref<'all' | number>('all')
const search = ref('')
const page = ref(1)
const perPage = ref(20)

function rowToCustomer(raw: any): Customer {
  const groupRef = findGroup(raw.group_id ?? raw.groupId ?? raw.nhom)
  const resolvedGroupId = groupRef?.id
    ?? (typeof (raw.group_id ?? raw.groupId) === 'number' ? Number(raw.group_id ?? raw.groupId) : 3)
  const name = String(raw.name ?? raw.ten_khach_hang ?? raw.ten ?? raw.full_name ?? '(Không tên)')
  return {
    id: Number(raw.id),
    name,
    email: String(raw.email ?? raw.mail ?? ''),
    phone: String(raw.phone ?? raw.dien_thoai ?? raw.sdt ?? ''),
    groupId: resolvedGroupId,
    ordersCount: Number(raw.orders_count ?? raw.so_don ?? 0),
    totalSpent: Number(raw.total_spent ?? raw.tong_chi_tieu ?? 0),
    joinedAt: String(raw.joined_at ?? raw.ngay_tao ?? raw.created_at ?? raw.createdAt ?? ''),
    active: raw.active === undefined ? true : Boolean(raw.active),
    initial: name.trim().charAt(0).toUpperCase() || '?',
    avatarTone: 'blue' as any,
    note: raw.note ? String(raw.note) : undefined,
  }
}

const imported = useServerPagedList<Customer>('customers', () => ({
  page: page.value,
  perPage: perPage.value,
  q: search.value.trim(),
  // BE filter group_id chính xác (không bị giới hạn theo page hiện tại).
  group_id: filterGroupId.value === 'all' ? '' : filterGroupId.value,
}), { mapper: rowToCustomer })

const paginated = computed(() => imported.items.value)

watch([filterGroupId, search], () => { page.value = 1 })

function isGroupCode(c: Customer, codes: string[]): boolean {
  const g = findGroup(c.groupId)
  if (!g) return false
  const code = (g.code || '').toLowerCase()
  const name = (g.name || '').toLowerCase()
  return codes.some((k) => code === k.toLowerCase() || name.includes(k.toLowerCase()))
}
const stats = computed(() => ({
  total: imported.meta.value.total || imported.items.value.length,
  // VIP/Sỉ tính trên page hiện tại — chấp nhận xấp xỉ; full count cần BE aggregate.
  vip: imported.items.value.filter((c) => isGroupCode(c, ['VIP', 'vip'])).length,
  wholesale: imported.items.value.filter((c) => isGroupCode(c, ['WHOLESALE', 'sỉ', 'si'])).length,
  newThisMonth: imported.items.value.filter((c) => c.joinedAt.endsWith('/2026')).length,
}))

// Modals
type FormState = Pick<Customer, 'name' | 'email' | 'phone' | 'groupId' | 'note' | 'active'>
function emptyForm(): FormState {
  return { name: '', email: '', phone: '', groupId: 3, note: '', active: true }
}
const formOpen = ref(false)
const detailOpen = ref(false)
const confirmOpen = ref(false)
const form = ref<FormState>(emptyForm())
const editingId = ref<number | null>(null)
const detail = ref<Customer | null>(null)
const confirmCtx = ref<{ title: string; message: string; tone: 'danger' | 'primary'; action: () => void } | null>(null)

function openCreate() {
  editingId.value = null
  form.value = emptyForm()
  formOpen.value = true
}

function openEdit(c: Customer) {
  editingId.value = c.id
  form.value = { name: c.name, email: c.email, phone: c.phone, groupId: c.groupId, note: c.note, active: c.active }
  formOpen.value = true
}

async function submitForm() {
  if (!form.value.name || !form.value.email || !form.value.phone) {
    toast.error('Thiếu thông tin', 'Tên, email và SĐT là bắt buộc.')
    return
  }
  const payload: Record<string, any> = {
    name: form.value.name,
    email: form.value.email,
    phone: form.value.phone,
    group_id: form.value.groupId,
    note: form.value.note ?? '',
    active: form.value.active,
  }
  try {
    if (editingId.value) {
      await customersEntity.update(editingId.value, payload)
      toast.success('Đã cập nhật khách hàng', form.value.name)
    } else {
      await customersEntity.create({
        ...payload,
        joined_at: new Date().toLocaleDateString('vi-VN'),
        orders_count: 0,
        total_spent: 0,
      })
      toast.success('Đã thêm khách hàng', form.value.name)
    }
    await imported.refresh()
    formOpen.value = false
  } catch (err: any) {
    toast.error('Lưu thất bại', err?.response?.data?.message || err?.message || 'Lỗi không xác định')
  }
}

// Đơn của customer được fetch riêng khi mở detail — tránh load cho cả list.
const detailOrders = ref<Array<{ id: number; code: string; createdAt: string; status: string; total: number }>>([])
const detailOrdersLoading = ref(false)

async function openDetail(c: Customer) {
  detail.value = c
  detailOpen.value = true
  detailOrders.value = []
  detailOrdersLoading.value = true
  try {
    // BE-side filter user_id (gắn vào order khi customer đặt qua FE checkout).
    const res = await api.get('/shop/orders', {
      params: { user_id: c.id, per_page: 10, page: 1 },
    })
    const items: any[] = res.data?.data ?? []
    detailOrders.value = items.map((raw) => ({
      id: Number(raw.id),
      code: String(raw.code ?? `#YM${raw.id}`),
      createdAt: String(raw.created_at ?? raw.createdAt ?? ''),
      status: String(raw.status ?? ''),
      total: Number(raw.total ?? 0),
    }))
  } catch {
    detailOrders.value = []
  } finally {
    detailOrdersLoading.value = false
  }
}

async function toggleActive(c: Customer) {
  const next = !c.active
  try {
    // Endpoint riêng: cập nhật ShopEntry + sync users.status + revoke token nếu khoá.
    await api.post(`/admin/customers/${c.id}/active`, { active: next })
    await imported.refresh()
    toast.info(next ? 'Đã kích hoạt' : 'Đã tạm khoá tài khoản', c.name)
  } catch (err: any) {
    toast.error('Thao tác thất bại', err?.response?.data?.message || err?.message || 'Lỗi không xác định')
  }
}

function askDelete(c: Customer) {
  confirmCtx.value = {
    title: `Xoá khách hàng "${c.name}"?`,
    message: 'Tài khoản và lịch sử mua hàng sẽ bị xoá. Hành động không thể hoàn tác.',
    tone: 'danger',
    action: async () => {
      try {
        await customersEntity.remove(c.id)
        await imported.refresh()
        toast.success('Đã xoá khách hàng', c.name)
      } catch (err: any) {
        toast.error('Xoá thất bại', err?.response?.data?.message || err?.message || 'Lỗi không xác định')
      }
    },
  }
  confirmOpen.value = true
}

function onRowAction(c: Customer, key: string) {
  if (key === 'view') openDetail(c)
  else if (key === 'edit') openEdit(c)
  else if (key === 'toggle') toggleActive(c)
  else if (key === 'delete') askDelete(c)
}

function rowItems(c: Customer) {
  return [
    { key: 'view', label: 'Xem chi tiết', icon: 'ri-eye-line' },
    { key: 'edit', label: 'Chỉnh sửa', icon: 'ri-edit-line' },
    { key: 'toggle', label: c.active ? 'Tạm khoá' : 'Kích hoạt', icon: c.active ? 'ri-lock-line' : 'ri-lock-unlock-line' },
    { key: 'delete', label: 'Xoá khách hàng', icon: 'ri-delete-bin-line', tone: 'danger' as const },
  ]
}

function groupNameOf(groupId: number) {
  return findGroup(groupId)?.name || '—'
}
function groupTone(groupId: number): string {
  const g = findGroup(groupId)
  if (!g) return 'neutral'
  const code = (g.code || '').toUpperCase()
  if (code === 'VIP') return 'warning'
  if (code === 'WHOLESALE') return 'primary'
  if (code === 'NEW') return 'info'
  if (code === 'INACTIVE') return 'danger'
  return 'neutral'
}
</script>

<template>
  <div class="ym-page">
    <header class="ym-page__header">
      <div>
        <h1>Khách hàng</h1>
        <p>Danh sách khách hàng và phân tích hành vi mua sắm</p>
      </div>
      <div class="ym-page__actions">
        <ShopImportExport entity="customers" id-field="email" label="khách hàng" @imported="imported.refresh" />
        <button type="button" class="ym-btn ym-btn--primary" @click="openCreate"><i class="ri-user-add-line"></i> Thêm khách hàng</button>
      </div>
    </header>

    <section class="ym-mini-stats">
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Tổng khách</p><p class="ym-mini-stat__value">{{ stats.total }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Khách VIP</p><p class="ym-mini-stat__value" style="color: #f7c948">{{ stats.vip }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Khách sỉ</p><p class="ym-mini-stat__value" style="color: #326e51">{{ stats.wholesale }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Mới tháng này</p><p class="ym-mini-stat__value">+{{ stats.newThisMonth }}</p></article>
    </section>

    <div class="ym-card">
      <div class="ym-toolbar">
        <div class="ym-search">
          <i class="ri-search-line"></i>
          <input v-model="search" type="text" placeholder="Tìm theo tên, email, SĐT..." />
        </div>
        <div class="ym-toolbar__actions">
          <select v-model="filterGroupId" class="ym-select">
            <option value="all">Tất cả nhóm</option>
            <option v-for="g in allGroups" :key="g.id" :value="g.id">{{ g.name }}</option>
          </select>
        </div>
      </div>

      <div class="ym-table-wrap">
        <table class="ym-table">
          <thead>
            <tr>
              <th>Khách hàng</th>
              <th>SĐT</th>
              <th>Nhóm</th>
              <th class="is-center">Đơn</th>
              <th class="is-right">Đã chi tiêu</th>
              <th>Tham gia</th>
              <th>Trạng thái</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in paginated" :key="c.id">
              <td>
                <div class="ym-customer">
                  <span :class="['ym-avatar', `ym-avatar--${c.avatarTone}`]">{{ c.initial }}</span>
                  <div class="ym-cell-user">
                    <a href="#" class="ym-link" @click.prevent="openDetail(c)">{{ c.name }}</a>
                    <small>{{ c.email }}</small>
                  </div>
                </div>
              </td>
              <td>{{ c.phone }}</td>
              <td><span :class="['ym-tag', `ym-tag--${groupTone(c.groupId)}`]">{{ groupNameOf(c.groupId) }}</span></td>
              <td class="is-center">{{ c.ordersCount }}</td>
              <td class="is-right"><strong>{{ formatPrice(c.totalSpent) }}</strong></td>
              <td class="is-muted">{{ c.joinedAt }}</td>
              <td>
                <label class="ym-switch">
                  <input type="checkbox" :checked="c.active" @change="toggleActive(c)" />
                  <span class="ym-switch__slider"></span>
                </label>
              </td>
              <td class="is-right">
                <RowMenu :items="rowItems(c)" @select="onRowAction(c, $event)" />
              </td>
            </tr>
            <tr v-if="!paginated.length"><td colspan="8" class="ym-empty">{{ imported.loading ? 'Đang tải...' : 'Không có khách hàng nào.' }}</td></tr>
          </tbody>
        </table>
      </div>

      <Pagination
        v-model="page"
        :total-items="imported.meta.total"
        :per-page="perPage"
        item-label="khách hàng"
        @update:per-page="(n) => perPage = n"
      />
    </div>

    <!-- Form modal -->
    <AdminModal v-model:open="formOpen" :title="editingId ? 'Chỉnh sửa khách hàng' : 'Thêm khách hàng mới'" size="md" :confirm-text="editingId ? 'Lưu' : 'Thêm khách'" @confirm="submitForm">
      <div class="ym-form-group"><label>Tên đầy đủ *</label><input v-model="form.name" type="text" /></div>
      <div class="ym-form-row">
        <div class="ym-form-group"><label>Email *</label><input v-model="form.email" type="email" /></div>
        <div class="ym-form-group"><label>SĐT *</label><input v-model="form.phone" type="tel" /></div>
      </div>
      <div class="ym-form-group">
        <label>Nhóm khách hàng</label>
        <select v-model="form.groupId">
          <option v-for="g in allGroups" :key="g.id" :value="g.id">
            {{ g.name }}{{ g.discount > 0 ? ` (giảm ${g.discount}%)` : '' }}
          </option>
        </select>
        <p class="ym-form-help">Bảng giá và % giảm sẽ tự áp dụng cho khách thuộc nhóm này khi đặt hàng.</p>
      </div>
      <div class="ym-form-group"><label>Ghi chú</label><textarea v-model="form.note" rows="3"></textarea></div>
      <label class="ym-checkbox"><input v-model="form.active" type="checkbox" /> Tài khoản đang hoạt động</label>
    </AdminModal>

    <!-- Detail modal -->
    <AdminModal v-if="detail" v-model:open="detailOpen" :title="detail.name" subtitle="Hồ sơ khách hàng" size="lg" hide-footer>
      <div class="ym-detail-head">
        <span :class="['ym-avatar', 'ym-avatar--lg', `ym-avatar--${detail.avatarTone}`]">{{ detail.initial }}</span>
        <div>
          <strong>{{ detail.name }}</strong>
          <p>{{ detail.email }} · {{ detail.phone }}</p>
          <span :class="['ym-tag', `ym-tag--${groupTone(detail.groupId)}`]">{{ groupNameOf(detail.groupId) }}</span>
          <span v-if="findGroup(detail.groupId)?.discount" class="ym-tag ym-tag--success" style="margin-left: 6px">
            Giảm {{ findGroup(detail.groupId)?.discount }}% tự động
          </span>
        </div>
      </div>

      <div class="ym-detail__grid">
        <div><label>Tham gia</label><strong>{{ detail.joinedAt }}</strong></div>
        <div><label>Tổng đơn</label><strong>{{ detail.ordersCount }}</strong></div>
        <div><label>Đã chi tiêu</label><strong style="color: #326e51">{{ formatPrice(detail.totalSpent) }}</strong></div>
        <div><label>Bảng giá áp dụng</label><strong>{{ business.priceListForCustomer(detail)?.name || '—' }}</strong></div>
      </div>

      <div class="ym-detail-orders">
        <h4>Đơn hàng gần đây ({{ detailOrdersLoading ? '...' : detailOrders.length }})</h4>
        <ul v-if="detailOrders.length" class="ym-mini-list">
          <li v-for="o in detailOrders" :key="o.id">
            <strong>{{ o.code }}</strong>
            <span class="is-muted">{{ o.createdAt }}</span>
            <span :class="['ym-tag', 'ym-tag--' + (o.status === 'completed' ? 'success' : o.status === 'cancelled' ? 'danger' : 'info')]">{{ o.status }}</span>
            <strong style="margin-left: auto">{{ formatPrice(o.total) }}</strong>
          </li>
        </ul>
        <p v-else-if="detailOrdersLoading" style="color: #9ca3af; font-size: 13px; margin: 8px 0">Đang tải đơn hàng...</p>
        <p v-else style="color: #9ca3af; font-size: 13px; margin: 8px 0">Khách chưa có đơn hàng nào.</p>
      </div>

      <div class="ym-detail__actions">
        <button type="button" class="ym-btn" @click="detailOpen = false; openEdit(detail!)"><i class="ri-edit-line"></i> Chỉnh sửa</button>
      </div>
    </AdminModal>

    <AdminModal v-if="confirmCtx" v-model:open="confirmOpen" :title="confirmCtx.title" size="sm" :confirm-tone="confirmCtx.tone" confirm-text="Xác nhận" @confirm="confirmCtx.action(); confirmOpen = false">
      <p style="margin: 0; color: #4b5563">{{ confirmCtx.message }}</p>
    </AdminModal>
  </div>
</template>

<style scoped src="./_admin-shared.css"></style>
<style scoped>
.ym-customer { display: flex; align-items: center; gap: 10px; }
.ym-select { padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 8px; background: #fff; font-size: 14px; }
.ym-checkbox { display: flex; align-items: center; gap: 8px; font-size: 14px; cursor: pointer; }

.ym-detail-head { display: flex; gap: 14px; align-items: center; padding-bottom: 16px; border-bottom: 1px solid #f1f3f5; margin-bottom: 16px; }
.ym-detail-head strong { display: block; font-size: 16px; color: #111827; }
.ym-detail-head p { margin: 2px 0 6px; font-size: 13px; color: #6b7280; }
.ym-avatar--lg { width: 56px; height: 56px; font-size: 20px; }
.ym-detail__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 24px; background: #fafbfc; padding: 14px; border-radius: 10px; border: 1px solid #f1f3f5; }
.ym-detail__grid > div { display: flex; flex-direction: column; gap: 2px; }
.ym-detail__grid label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.4px; color: #6b7280; }
.ym-detail__grid strong { font-size: 14px; color: #111827; font-weight: 500; }
.ym-detail__actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 14px; }

.ym-detail-orders { margin-top: 16px; }
.ym-detail-orders h4 { margin: 0 0 8px; font-size: 13px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.4px; }
.ym-mini-list { list-style: none; margin: 0; padding: 0; }
.ym-mini-list li { display: flex; gap: 12px; align-items: center; padding: 8px 12px; border: 1px solid #f1f3f5; border-radius: 8px; margin-bottom: 6px; font-size: 13px; }
</style>
