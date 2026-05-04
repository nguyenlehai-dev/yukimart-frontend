<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AdminModal from '../components/AdminModal.vue'
import Pagination from '../components/Pagination.vue'
import RowMenu from '../components/RowMenu.vue'
import { useToast } from '../composables/useToast'
import { useAdminDataStore, type ShopBrand } from '../stores/adminData'
import { resolveBrandLogo } from '../utils/imageResolver'

type FormState = {
  name: string
  slug: string
  logoSource: string
  link: string
  active: boolean
  sortOrder: number
}

const KNOWN_LOGOS = [
  '1505115115loreal-paris-logo_img_150x75_766519_fit_center.jpg',
  '1544069586laroche-posay_img_150x75_766519_fit_center.jpg',
  '1467278639logo_cetaphil_img_150x75_766519_fit_center.jpg',
  '1473823224eucerin-logo_img_150x75_766519_fit_center.jpg',
  '1505115725maybelline-logo_img_150x75_766519_fit_center.jpg',
  '1544069455vichy-new_img_150x75_766519_fit_center.jpg',
  '1515400908MERRIRS_img_150x75_766519_fit_center.jpg',
  '1515401178moony_img_150x75_766519_fit_center.jpg',
  '1471419239agapan-logo_img_120x60_63ea52_fit_center.jpg',
  '1476268841argussy_logo_img_120x60_63ea52_fit_center.png',
  '14963736243w-clinic-logo_img_120x60_63ea52_fit_center.png',
  '1506650932deborahmilano_img_120x60_63ea52_fit_center.jpg',
  '1538456535ALEDA_img_120x60_63ea52_fit_center.jpg',
]

const toast = useToast()
const store = useAdminDataStore()

const search = ref('')
const filterStatus = ref<'all' | 'active' | 'hidden'>('all')
const page = ref(1)
const perPage = ref(8)
const formOpen = ref(false)
const confirmOpen = ref(false)
const saving = ref(false)
const editingId = ref<number | null>(null)
const form = ref<FormState>(emptyForm())
const confirmCtx = ref<{ title: string; message: string; action: () => Promise<void> } | null>(null)

const productBrandOptions = computed(() => store.brandOptions)
const logoPreview = computed(() => resolveBrandLogo(form.value.logoSource))

const stats = computed(() => ({
  total: store.brands.length,
  active: store.brands.filter((brand) => brand.active).length,
  hidden: store.brands.filter((brand) => !brand.active).length,
  linkedProducts: productBrandOptions.value.length,
}))

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return store.brands.filter((brand) => {
    const matchStatus = filterStatus.value === 'all'
      || (filterStatus.value === 'active' && brand.active)
      || (filterStatus.value === 'hidden' && !brand.active)
    const matchSearch = !q
      || brand.name.toLowerCase().includes(q)
      || brand.slug.toLowerCase().includes(q)
      || (brand.link || '').toLowerCase().includes(q)
    return matchStatus && matchSearch
  })
})

const paginated = computed(() => filtered.value.slice((page.value - 1) * perPage.value, page.value * perPage.value))

watch([search, filterStatus], () => { page.value = 1 })

watch(() => form.value.name, (name, prevName) => {
  if (!form.value.slug || form.value.slug === store.slugify(prevName || '')) {
    form.value.slug = store.slugify(name)
  }
  if (!form.value.link || (prevName && form.value.link === `/products?brand=${encodeURIComponent(prevName)}`)) {
    form.value.link = `/products?brand=${encodeURIComponent(name)}`
  }
})

function emptyForm(): FormState {
  return {
    name: '',
    slug: '',
    logoSource: '',
    link: '',
    active: true,
    sortOrder: Math.max(0, ...store.brands.map((brand) => brand.sortOrder || 0)) + 1,
  }
}

function openCreate() {
  editingId.value = null
  form.value = emptyForm()
  formOpen.value = true
}

function openEdit(brand: ShopBrand) {
  editingId.value = brand.id
  form.value = {
    name: brand.name,
    slug: brand.slug,
    logoSource: brand.logoSource || brand.logo,
    link: brand.link || `/products?brand=${encodeURIComponent(brand.name)}`,
    active: brand.active,
    sortOrder: brand.sortOrder || 0,
  }
  formOpen.value = true
}

async function submitForm() {
  const name = form.value.name.trim()
  if (!name) {
    toast.error('Thiếu tên thương hiệu', 'Hãy nhập tên trước khi lưu.')
    return
  }
  if (!form.value.slug) form.value.slug = store.slugify(name)
  if (!form.value.link) form.value.link = `/products?brand=${encodeURIComponent(name)}`

  saving.value = true
  try {
    const rawLink = form.value.link.trim()
    const link = !rawLink || rawLink.startsWith('/products?brand=')
      ? `/products?brand=${encodeURIComponent(name)}`
      : rawLink
    const payload = {
      name,
      slug: form.value.slug,
      logo: logoPreview.value,
      logoSource: form.value.logoSource.trim(),
      link,
      active: form.value.active,
      sortOrder: form.value.sortOrder || 0,
    }

    if (editingId.value) {
      await store.updateBrand(editingId.value, payload)
      toast.success('Đã cập nhật thương hiệu', name)
    } else {
      await store.addBrand(payload)
      toast.success('Đã thêm thương hiệu nổi bật', name)
    }
    formOpen.value = false
  } catch (e: any) {
    toast.error('Lưu thương hiệu thất bại', e?.response?.data?.message || e?.message)
  } finally {
    saving.value = false
  }
}

async function toggleActive(brand: ShopBrand) {
  try {
    await store.updateBrand(brand.id, { active: !brand.active })
    toast.success(brand.active ? 'Đã ẩn thương hiệu' : 'Đã hiển thị thương hiệu', brand.name)
  } catch (e: any) {
    toast.error('Cập nhật trạng thái thất bại', e?.response?.data?.message || e?.message)
  }
}

function askDelete(brand: ShopBrand) {
  confirmCtx.value = {
    title: `Xoá thương hiệu "${brand.name}"?`,
    message: 'Thương hiệu sẽ bị xoá khỏi khu vực nổi bật trên trang chủ.',
    action: async () => {
      await store.removeBrand(brand.id)
      toast.success('Đã xoá thương hiệu', brand.name)
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
    toast.error('Xoá thương hiệu thất bại', e?.response?.data?.message || e?.message)
  }
}

function rowItems(brand: ShopBrand) {
  return [
    { key: 'edit', label: 'Chỉnh sửa', icon: 'ri-edit-line' },
    { key: 'toggle', label: brand.active ? 'Ẩn khỏi trang chủ' : 'Hiển thị trên trang chủ', icon: brand.active ? 'ri-eye-off-line' : 'ri-eye-line' },
    { key: 'delete', label: 'Xoá thương hiệu', icon: 'ri-delete-bin-line', tone: 'danger' as const },
  ]
}

function onRowAction(brand: ShopBrand, key: string) {
  if (key === 'edit') openEdit(brand)
  else if (key === 'toggle') toggleActive(brand)
  else if (key === 'delete') askDelete(brand)
}
</script>

<template>
  <div class="ym-page">
    <header class="ym-page__header">
      <div>
        <h1>Thương hiệu nổi bật</h1>
        <p>Quản lý logo thương hiệu hiển thị trên trang chủ.</p>
      </div>
      <div class="ym-page__actions">
        <button type="button" class="ym-btn" @click="store.fetchAll"><i class="ri-refresh-line"></i> Tải lại</button>
        <button type="button" class="ym-btn ym-btn--primary" @click="openCreate"><i class="ri-add-line"></i> Thêm thương hiệu</button>
      </div>
    </header>

    <section class="ym-mini-stats">
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Tổng thương hiệu</p><p class="ym-mini-stat__value">{{ stats.total }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Đang hiển thị</p><p class="ym-mini-stat__value" style="color: #166534">{{ stats.active }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Đang ẩn</p><p class="ym-mini-stat__value" style="color: #6b7280">{{ stats.hidden }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Brand từ sản phẩm</p><p class="ym-mini-stat__value">{{ stats.linkedProducts }}</p></article>
    </section>

    <div class="ym-card">
      <div class="ym-toolbar">
        <div class="ym-search">
          <i class="ri-search-line"></i>
          <input v-model="search" type="text" placeholder="Tìm theo tên, slug, link..." />
        </div>
        <div class="ym-toolbar__actions">
          <select v-model="filterStatus" class="ym-select">
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hiển thị</option>
            <option value="hidden">Đang ẩn</option>
          </select>
        </div>
      </div>

      <div v-if="store.loading" class="ym-empty">Đang tải thương hiệu...</div>
      <div v-else-if="!filtered.length" class="ym-empty">Chưa có thương hiệu nổi bật nào.</div>
      <div v-else class="ym-brand-grid">
        <article v-for="brand in paginated" :key="brand.id" class="ym-brand-card">
          <div class="ym-brand-card__head">
            <span :class="['ym-tag', brand.active ? 'ym-tag--success' : 'ym-tag--neutral']">
              <i :class="brand.active ? 'ri-eye-line' : 'ri-eye-off-line'"></i>
              {{ brand.active ? 'Hiển thị' : 'Ẩn' }}
            </span>
            <RowMenu :items="rowItems(brand)" @select="onRowAction(brand, $event)" />
          </div>
          <RouterLink :to="brand.link || `/products?brand=${encodeURIComponent(brand.name)}`" class="ym-brand-card__logo">
            <img v-if="brand.logo" :src="brand.logo" :alt="brand.name" />
            <i v-else class="ri-price-tag-3-line"></i>
          </RouterLink>
          <div class="ym-brand-card__body">
            <h3>{{ brand.name }}</h3>
            <p>/{{ brand.slug }}</p>
            <small><i class="ri-sort-asc"></i> Thứ tự {{ brand.sortOrder }}</small>
          </div>
          <footer class="ym-brand-card__actions">
            <button type="button" class="ym-btn ym-btn--sm" @click="openEdit(brand)"><i class="ri-edit-line"></i> Sửa</button>
            <button type="button" class="ym-btn ym-btn--sm" @click="toggleActive(brand)">
              <i :class="brand.active ? 'ri-eye-off-line' : 'ri-eye-line'"></i>
              {{ brand.active ? 'Ẩn' : 'Hiện' }}
            </button>
          </footer>
        </article>
      </div>

      <Pagination
        v-model="page"
        :total-items="filtered.length"
        :per-page="perPage"
        item-label="thương hiệu"
        @update:per-page="(n) => perPage = n"
      />
    </div>

    <AdminModal v-model:open="formOpen" :title="editingId ? 'Chỉnh sửa thương hiệu' : 'Thêm thương hiệu nổi bật'" size="md" :confirm-text="editingId ? 'Lưu thương hiệu' : 'Tạo thương hiệu'" :loading="saving" @confirm="submitForm">
      <div class="ym-brand-form-preview">
        <img v-if="logoPreview" :src="logoPreview" :alt="form.name || 'Logo thương hiệu'" />
        <i v-else class="ri-image-add-line"></i>
      </div>

      <div class="ym-form-row">
        <div class="ym-form-group">
          <label>Tên thương hiệu *</label>
          <input v-model="form.name" list="brand-options" type="text" placeholder="Vd: Maybelline" />
          <datalist id="brand-options"><option v-for="brand in productBrandOptions" :key="brand" :value="brand" /></datalist>
        </div>
        <div class="ym-form-group">
          <label>Slug</label>
          <input v-model="form.slug" type="text" placeholder="maybelline" />
        </div>
      </div>

      <div class="ym-form-group">
        <label>Logo</label>
        <input v-model="form.logoSource" list="logo-options" type="text" placeholder="Tên file logo hoặc URL https://..." />
        <datalist id="logo-options"><option v-for="logo in KNOWN_LOGOS" :key="logo" :value="logo" /></datalist>
        <p class="ym-form-help">Có thể nhập tên file trong assets/images/trademark hoặc URL ảnh đầy đủ.</p>
      </div>

      <div class="ym-form-row">
        <div class="ym-form-group">
          <label>Link</label>
          <input v-model="form.link" type="text" placeholder="/products?brand=Maybelline" />
        </div>
        <div class="ym-form-group">
          <label>Thứ tự</label>
          <input v-model.number="form.sortOrder" type="number" min="0" />
        </div>
      </div>
      <label class="ym-checkbox"><input v-model="form.active" type="checkbox" /> Hiển thị trên trang chủ</label>
    </AdminModal>

    <AdminModal v-if="confirmCtx" v-model:open="confirmOpen" :title="confirmCtx.title" :subtitle="confirmCtx.message" size="sm" confirm-text="Xoá" confirm-tone="danger" @confirm="runConfirm">
      <p class="is-muted">Kiểm tra lại trước khi xoá khỏi hệ thống.</p>
    </AdminModal>
  </div>
</template>

<style scoped src="./_admin-shared.css"></style>
<style scoped>
.ym-brand-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
  padding: 16px;
}
.ym-brand-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  display: flex;
  flex-direction: column;
  min-height: 100%;
}
.ym-brand-card__head,
.ym-brand-card__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px;
}
.ym-brand-card__logo {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 92px;
  margin: 0 12px;
  border: 1px solid #f1f3f5;
  border-radius: 8px;
  background: #fafafa;
  color: #9ca3af;
  text-decoration: none;
  font-size: 30px;
}
.ym-brand-card__logo img {
  max-width: 150px;
  max-height: 75px;
  object-fit: contain;
}
.ym-brand-card__body {
  padding: 12px;
  flex: 1;
}
.ym-brand-card__body h3 {
  margin: 0;
  font-size: 15px;
  line-height: 1.35;
  color: #111827;
}
.ym-brand-card__body p {
  margin: 4px 0 8px;
  color: #9ca3af;
  font-size: 12px;
}
.ym-brand-card__body small {
  color: #6b7280;
  font-size: 12px;
}
.ym-brand-card__actions {
  border-top: 1px solid #f1f3f5;
  justify-content: flex-end;
}
.ym-brand-form-preview {
  height: 96px;
  border: 1px dashed #d1d5db;
  border-radius: 8px;
  background: #fafafa;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
  color: #9ca3af;
  font-size: 32px;
}
.ym-brand-form-preview img {
  max-width: 170px;
  max-height: 80px;
  object-fit: contain;
}
.ym-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
}
</style>
