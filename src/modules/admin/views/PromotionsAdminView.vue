<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import AdminModal from '../components/AdminModal.vue'
import RowMenu from '../components/RowMenu.vue'
import Pagination from '../components/Pagination.vue'
import ShopImportExport from '../components/ShopImportExport.vue'
import { useToast } from '../composables/useToast'
import { promotionToPayload, shopPromotionsApi } from '../services/shopApi'
import { useAdminDataStore } from '../stores/adminData'

type PromotionStatus = 'draft' | 'active' | 'scheduled' | 'expired'
type PromotionType = 'banner' | 'coupon' | 'campaign'
type Promotion = {
  id: number
  title: string
  slug: string
  description: string
  image: string
  link: string
  badge: string
  discountLabel: string
  type: PromotionType
  status: PromotionStatus
  startsAt: string | null
  endsAt: string | null
  priority: number
  createdAt?: string
  updatedAt?: string
}
type FormState = Omit<Promotion, 'id' | 'createdAt' | 'updatedAt'>

const toast = useToast()
const store = useAdminDataStore()

const promotions = ref<Promotion[]>([])
const loading = ref(false)
const saving = ref(false)
const search = ref('')
const filterStatus = ref<'all' | PromotionStatus>('all')
const filterType = ref<'all' | PromotionType>('all')
const page = ref(1)
const perPage = ref(6)

const formOpen = ref(false)
const detailOpen = ref(false)
const confirmOpen = ref(false)
const editingId = ref<number | null>(null)
const form = ref<FormState>(emptyForm())
const detail = ref<Promotion | null>(null)
const confirmCtx = ref<{ title: string; message: string; action: () => Promise<void> } | null>(null)

const statusMap: Record<PromotionStatus, { label: string; tone: string }> = {
  draft: { label: 'Nháp', tone: 'neutral' },
  active: { label: 'Đang chạy', tone: 'success' },
  scheduled: { label: 'Lên lịch', tone: 'info' },
  expired: { label: 'Hết hạn', tone: 'danger' },
}

const typeMap: Record<PromotionType, string> = {
  banner: 'Banner',
  coupon: 'Mã ưu đãi',
  campaign: 'Chiến dịch',
}

function emptyForm(): FormState {
  return {
    title: '',
    slug: '',
    description: '',
    image: '',
    link: '/campaign/wow',
    badge: '',
    discountLabel: '',
    type: 'banner',
    status: 'draft',
    startsAt: '',
    endsAt: '',
    priority: 0,
  }
}

function slugify(s: string) {
  return store.slugify(s)
}

function pickP(row: Record<string, any>, keys: string[]): any {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== null && row[k] !== '') return row[k]
  }
  return undefined
}

function mapPromotion(raw: Record<string, any>): Promotion {
  return {
    id: Number(raw.id ?? 0),
    title: String(pickP(raw, ['title', 'tieu_de', 'ten', 'name']) ?? ''),
    slug: String(pickP(raw, ['slug']) ?? ''),
    description: String(pickP(raw, ['description', 'mo_ta']) ?? ''),
    image: String(pickP(raw, ['image', 'anh', 'hinh', 'hinh_anh']) ?? ''),
    link: String(pickP(raw, ['link', 'lien_ket']) ?? ''),
    badge: String(pickP(raw, ['badge', 'nhan']) ?? ''),
    discountLabel: String(pickP(raw, ['discount_label', 'nhan_giam_gia']) ?? ''),
    type: (pickP(raw, ['type', 'loai']) ?? 'banner') as PromotionType,
    status: (pickP(raw, ['status', 'trang_thai']) ?? 'draft') as PromotionStatus,
    startsAt: pickP(raw, ['starts_at', 'ngay_bat_dau']) ? String(pickP(raw, ['starts_at', 'ngay_bat_dau'])) : null,
    endsAt: pickP(raw, ['ends_at', 'ngay_ket_thuc']) ? String(pickP(raw, ['ends_at', 'ngay_ket_thuc'])) : null,
    priority: Number(pickP(raw, ['priority', 'uu_tien']) ?? 0),
    createdAt: raw.createdAt ?? raw.created_at,
    updatedAt: raw.updatedAt ?? raw.updated_at,
  }
}

async function loadPromotions() {
  loading.value = true
  try {
    const res = await shopPromotionsApi.list()
    promotions.value = (res.data.data || []).map(mapPromotion)
  } catch (e: any) {
    toast.error('Tải khuyến mãi thất bại', e?.response?.data?.message || e?.message)
  } finally {
    loading.value = false
  }
}

onMounted(loadPromotions)

const stats = computed(() => ({
  total: promotions.value.length,
  active: promotions.value.filter((p) => p.status === 'active').length,
  scheduled: promotions.value.filter((p) => p.status === 'scheduled').length,
  expired: promotions.value.filter((p) => p.status === 'expired').length,
}))

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return promotions.value.filter((p) => {
    const matchStatus = filterStatus.value === 'all' || p.status === filterStatus.value
    const matchType = filterType.value === 'all' || p.type === filterType.value
    const matchSearch = !q
      || p.title.toLowerCase().includes(q)
      || (p.description || '').toLowerCase().includes(q)
      || (p.badge || '').toLowerCase().includes(q)
      || (p.discountLabel || '').toLowerCase().includes(q)
    return matchStatus && matchType && matchSearch
  })
})

const paginated = computed(() => filtered.value.slice((page.value - 1) * perPage.value, page.value * perPage.value))
watch([search, filterStatus, filterType], () => { page.value = 1 })

function openCreate() {
  editingId.value = null
  form.value = emptyForm()
  formOpen.value = true
}

function openEdit(promotion: Promotion) {
  editingId.value = promotion.id
  form.value = {
    title: promotion.title,
    slug: promotion.slug,
    description: promotion.description || '',
    image: promotion.image || '',
    link: promotion.link || '/campaign/wow',
    badge: promotion.badge || '',
    discountLabel: promotion.discountLabel || '',
    type: promotion.type,
    status: promotion.status,
    startsAt: promotion.startsAt || '',
    endsAt: promotion.endsAt || '',
    priority: promotion.priority || 0,
  }
  formOpen.value = true
}

function openDetail(promotion: Promotion) {
  detail.value = promotion
  detailOpen.value = true
}

async function submitForm() {
  const title = form.value.title.trim()
  if (!title) {
    toast.error('Thiếu tên chương trình', 'Hãy nhập tên khuyến mãi.')
    return
  }
  if (!form.value.slug) form.value.slug = slugify(title)

  saving.value = true
  try {
    const payload = promotionToPayload(form.value)
    if (editingId.value) {
      const res = await shopPromotionsApi.update(editingId.value, payload)
      const idx = promotions.value.findIndex((p) => p.id === editingId.value)
      if (idx >= 0) promotions.value[idx] = res.data.data
      toast.success('Đã cập nhật khuyến mãi', title)
    } else {
      const res = await shopPromotionsApi.create(payload)
      promotions.value.unshift(res.data.data)
      toast.success('Đã tạo khuyến mãi', title)
    }
    formOpen.value = false
  } catch (e: any) {
    toast.error('Lưu khuyến mãi thất bại', e?.response?.data?.message || e?.message)
  } finally {
    saving.value = false
  }
}

async function setStatus(promotion: Promotion, status: PromotionStatus) {
  try {
    const res = await shopPromotionsApi.updateStatus(promotion.id, status)
    const idx = promotions.value.findIndex((p) => p.id === promotion.id)
    if (idx >= 0) promotions.value[idx] = res.data.data
    toast.success('Đã đổi trạng thái', `${promotion.title}: ${statusMap[status].label}`)
  } catch (e: any) {
    toast.error('Đổi trạng thái thất bại', e?.response?.data?.message || e?.message)
  }
}

function askDelete(promotion: Promotion) {
  confirmCtx.value = {
    title: `Xoá khuyến mãi "${promotion.title}"?`,
    message: 'Chương trình sẽ bị xoá khỏi trang khuyến mãi. Hành động này không thể hoàn tác.',
    action: async () => {
      await shopPromotionsApi.remove(promotion.id)
      promotions.value = promotions.value.filter((p) => p.id !== promotion.id)
      toast.success('Đã xoá khuyến mãi', promotion.title)
      confirmOpen.value = false
    },
  }
  confirmOpen.value = true
}

async function runConfirm() {
  if (!confirmCtx.value) return
  try {
    await confirmCtx.value.action()
  } catch (e: any) {
    toast.error('Xoá khuyến mãi thất bại', e?.response?.data?.message || e?.message)
  }
}

function rowItems(promotion: Promotion) {
  const items: { key: string; label: string; icon: string; tone?: 'danger' }[] = [
    { key: 'view', label: 'Xem nhanh', icon: 'ri-eye-line' },
    { key: 'edit', label: 'Chỉnh sửa', icon: 'ri-edit-line' },
  ]
  if (promotion.status !== 'active') items.push({ key: 'active', label: 'Bật chương trình', icon: 'ri-play-circle-line' })
  if (promotion.status !== 'scheduled') items.push({ key: 'scheduled', label: 'Lên lịch', icon: 'ri-calendar-schedule-line' })
  if (promotion.status !== 'draft') items.push({ key: 'draft', label: 'Chuyển về nháp', icon: 'ri-draft-line' })
  if (promotion.status !== 'expired') items.push({ key: 'expired', label: 'Đánh dấu hết hạn', icon: 'ri-time-line' })
  items.push({ key: 'delete', label: 'Xoá khuyến mãi', icon: 'ri-delete-bin-line', tone: 'danger' })
  return items
}

function onRowAction(promotion: Promotion, key: string) {
  if (key === 'view') openDetail(promotion)
  else if (key === 'edit') openEdit(promotion)
  else if (key === 'active' || key === 'scheduled' || key === 'draft' || key === 'expired') setStatus(promotion, key as PromotionStatus)
  else if (key === 'delete') askDelete(promotion)
}

function openLink(promotion: Promotion) {
  window.open(promotion.link || '/campaign/wow', '_blank')
}

function periodText(promotion: Promotion) {
  if (!promotion.startsAt && !promotion.endsAt) return 'Không giới hạn'
  return `${promotion.startsAt || '...'} → ${promotion.endsAt || '...'}`
}
</script>

<template>
  <div class="ym-page">
    <header class="ym-page__header">
      <div>
        <h1>Chương trình khuyến mãi</h1>
        <p>Quản lý banner, chiến dịch và ưu đãi hiển thị trên trang khuyến mãi.</p>
      </div>
      <div class="ym-page__actions">
        <ShopImportExport entity="promotions" id-field="code" label="khuyến mãi" @imported="loadPromotions" />
        <button type="button" class="ym-btn" @click="loadPromotions"><i class="ri-refresh-line"></i> Tải lại</button>
        <button type="button" class="ym-btn ym-btn--primary" @click="openCreate"><i class="ri-add-line"></i> Thêm khuyến mãi</button>
      </div>
    </header>

    <section class="ym-mini-stats">
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Tổng chương trình</p><p class="ym-mini-stat__value">{{ stats.total }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Đang chạy</p><p class="ym-mini-stat__value" style="color: #166534">{{ stats.active }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Lên lịch</p><p class="ym-mini-stat__value" style="color: #1e40af">{{ stats.scheduled }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Hết hạn</p><p class="ym-mini-stat__value" style="color: #991b1b">{{ stats.expired }}</p></article>
    </section>

    <div class="ym-card">
      <div class="ym-toolbar">
        <div class="ym-search">
          <i class="ri-search-line"></i>
          <input v-model="search" type="text" placeholder="Tìm theo tên, mô tả, nhãn..." />
        </div>
        <div class="ym-toolbar__actions">
          <select v-model="filterType" class="ym-select">
            <option value="all">Tất cả loại</option>
            <option value="banner">Banner</option>
            <option value="coupon">Mã ưu đãi</option>
            <option value="campaign">Chiến dịch</option>
          </select>
          <select v-model="filterStatus" class="ym-select">
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang chạy</option>
            <option value="scheduled">Lên lịch</option>
            <option value="draft">Nháp</option>
            <option value="expired">Hết hạn</option>
          </select>
        </div>
      </div>

      <div v-if="loading" class="ym-empty">Đang tải khuyến mãi...</div>
      <div v-else-if="!filtered.length" class="ym-empty">Chưa có chương trình khuyến mãi nào.</div>
      <div v-else class="ym-promo-grid">
        <article v-for="promotion in paginated" :key="promotion.id" class="ym-promo-card">
          <div class="ym-promo-card__media">
            <img v-if="promotion.image" :src="promotion.image" :alt="promotion.title" />
            <div v-else class="ym-promo-card__empty"><i class="ri-image-line"></i></div>
            <span v-if="promotion.badge" class="ym-promo-card__badge">{{ promotion.badge }}</span>
          </div>
          <div class="ym-promo-card__body">
            <div class="ym-promo-card__head">
              <span :class="['ym-tag', `ym-tag--${statusMap[promotion.status]?.tone || 'neutral'}`]">{{ statusMap[promotion.status]?.label || promotion.status }}</span>
              <RowMenu :items="rowItems(promotion)" @select="onRowAction(promotion, $event)" />
            </div>
            <h3>{{ promotion.title }}</h3>
            <p>{{ promotion.description || promotion.slug }}</p>
            <div class="ym-promo-card__meta">
              <span><i class="ri-layout-grid-line"></i> {{ typeMap[promotion.type] }}</span>
              <span v-if="promotion.discountLabel"><i class="ri-coupon-3-line"></i> {{ promotion.discountLabel }}</span>
              <span><i class="ri-sort-desc"></i> Ưu tiên {{ promotion.priority }}</span>
            </div>
            <small>{{ periodText(promotion) }}</small>
          </div>
          <footer class="ym-promo-card__actions">
            <button type="button" class="ym-btn ym-btn--sm" @click="openDetail(promotion)"><i class="ri-eye-line"></i> Xem</button>
            <button type="button" class="ym-btn ym-btn--sm" @click="openEdit(promotion)"><i class="ri-edit-line"></i> Sửa</button>
            <button type="button" class="ym-btn ym-btn--sm" @click="openLink(promotion)"><i class="ri-external-link-line"></i> Mở</button>
          </footer>
        </article>
      </div>

      <Pagination
        v-model="page"
        :total-items="filtered.length"
        :per-page="perPage"
        item-label="khuyến mãi"
        @update:per-page="(n) => perPage = n"
      />
    </div>

    <AdminModal v-model:open="formOpen" :title="editingId ? 'Chỉnh sửa khuyến mãi' : 'Thêm khuyến mãi'" size="lg" :confirm-text="editingId ? 'Lưu khuyến mãi' : 'Tạo khuyến mãi'" :loading="saving" @confirm="submitForm">
      <div class="ym-form-row">
        <div class="ym-form-group">
          <label>Tên chương trình *</label>
          <input v-model="form.title" type="text" placeholder="Vd: Deal ngập tràn tháng 5" @blur="!form.slug && (form.slug = slugify(form.title))" />
        </div>
        <div class="ym-form-group">
          <label>Slug</label>
          <input v-model="form.slug" type="text" placeholder="deal-ngap-tran-thang-5" />
        </div>
      </div>
      <div class="ym-form-row">
        <div class="ym-form-group">
          <label>Loại</label>
          <select v-model="form.type">
            <option value="banner">Banner</option>
            <option value="coupon">Mã ưu đãi</option>
            <option value="campaign">Chiến dịch</option>
          </select>
        </div>
        <div class="ym-form-group">
          <label>Trạng thái</label>
          <select v-model="form.status">
            <option value="draft">Nháp</option>
            <option value="active">Đang chạy</option>
            <option value="scheduled">Lên lịch</option>
            <option value="expired">Hết hạn</option>
          </select>
        </div>
        <div class="ym-form-group"><label>Ưu tiên</label><input v-model.number="form.priority" type="number" /></div>
      </div>
      <div class="ym-form-row">
        <div class="ym-form-group"><label>Bắt đầu</label><input v-model="form.startsAt" type="datetime-local" /></div>
        <div class="ym-form-group"><label>Kết thúc</label><input v-model="form.endsAt" type="datetime-local" /></div>
      </div>
      <div class="ym-form-group"><label>Ảnh banner URL</label><input v-model="form.image" type="url" placeholder="https://..." /></div>
      <div class="ym-form-row">
        <div class="ym-form-group"><label>Link điều hướng</label><input v-model="form.link" type="text" placeholder="/products hoặc https://..." /></div>
        <div class="ym-form-group"><label>Nhãn</label><input v-model="form.badge" type="text" placeholder="Hot, Mới, Flash Sale..." /></div>
        <div class="ym-form-group"><label>Ưu đãi</label><input v-model="form.discountLabel" type="text" placeholder="-20%, Mua 1 tặng 1..." /></div>
      </div>
      <div class="ym-form-group"><label>Mô tả</label><textarea v-model="form.description" rows="4" maxlength="1000"></textarea></div>
    </AdminModal>

    <AdminModal v-if="detail" v-model:open="detailOpen" :title="detail.title" subtitle="Chi tiết chương trình khuyến mãi" size="lg" hide-footer>
      <div class="ym-promo-detail">
        <img v-if="detail.image" :src="detail.image" :alt="detail.title" />
        <div>
          <span :class="['ym-tag', `ym-tag--${statusMap[detail.status]?.tone || 'neutral'}`]">{{ statusMap[detail.status]?.label || detail.status }}</span>
          <span class="ym-tag ym-tag--primary" style="margin-left: 6px">{{ typeMap[detail.type] }}</span>
        </div>
        <p>{{ detail.description || 'Chưa có mô tả.' }}</p>
        <ul>
          <li><strong>Link:</strong> {{ detail.link || '—' }}</li>
          <li><strong>Nhãn:</strong> {{ detail.badge || '—' }}</li>
          <li><strong>Ưu đãi:</strong> {{ detail.discountLabel || '—' }}</li>
          <li><strong>Thời gian:</strong> {{ periodText(detail) }}</li>
          <li><strong>Ưu tiên:</strong> {{ detail.priority }}</li>
        </ul>
      </div>
    </AdminModal>

    <AdminModal v-if="confirmCtx" v-model:open="confirmOpen" :title="confirmCtx.title" :subtitle="confirmCtx.message" size="sm" confirm-text="Xoá" confirm-tone="danger" @confirm="runConfirm">
      <p class="is-muted">Kiểm tra lại trước khi xoá khỏi hệ thống.</p>
    </AdminModal>
  </div>
</template>

<style scoped src="./_admin-shared.css"></style>
<style scoped>
.ym-promo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 14px;
  padding: 16px;
}
.ym-promo-card {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
  background: #fff;
  display: flex;
  flex-direction: column;
  min-height: 100%;
}
.ym-promo-card__media {
  position: relative;
  aspect-ratio: 16 / 7;
  background: #f9fafb;
  border-bottom: 1px solid #f1f3f5;
}
.ym-promo-card__media img,
.ym-promo-card__empty {
  width: 100%;
  height: 100%;
}
.ym-promo-card__media img {
  object-fit: cover;
}
.ym-promo-card__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 32px;
}
.ym-promo-card__badge {
  position: absolute;
  top: 10px;
  left: 10px;
  background: #d0021b;
  color: #fff;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 700;
}
.ym-promo-card__body {
  padding: 12px 14px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ym-promo-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.ym-promo-card h3 {
  margin: 0;
  font-size: 15px;
  line-height: 1.35;
  color: #111827;
}
.ym-promo-card p {
  margin: 0;
  color: #4b5563;
  font-size: 13px;
  line-height: 1.45;
}
.ym-promo-card small {
  color: #6b7280;
  font-size: 12px;
}
.ym-promo-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  color: #6b7280;
  font-size: 12px;
}
.ym-promo-card__actions {
  display: flex;
  gap: 6px;
  padding: 10px 14px;
  border-top: 1px solid #f1f3f5;
  background: #fafbfc;
}
.ym-promo-card__actions .ym-btn {
  flex: 1;
  justify-content: center;
}
.ym-promo-detail img {
  width: 100%;
  max-height: 320px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 14px;
}
.ym-promo-detail p {
  color: #4b5563;
  line-height: 1.6;
}
.ym-promo-detail ul {
  margin: 12px 0 0;
  padding-left: 18px;
  color: #1f2937;
  line-height: 1.8;
}
</style>
