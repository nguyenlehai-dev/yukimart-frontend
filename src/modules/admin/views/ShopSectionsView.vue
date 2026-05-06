<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import AdminModal from '../components/AdminModal.vue'
import RowMenu from '../components/RowMenu.vue'
import ShopImportExport from '../components/ShopImportExport.vue'
import { useToast } from '../composables/useToast'
import { useAdminDataStore, type AdminProduct, type ShopSection } from '../stores/adminData'
import { useImportedAs } from '../composables/useImportedAs'

const toast = useToast()
const router = useRouter()
const store = useAdminDataStore()

const imported = useImportedAs<ShopSection>('sections', {
  id: ['ma', 'id', 'key'],
  title: ['ten', 'title', 'tieu_de'],
  color: ['mau', 'color'],
}, (raw, m) => ({
  id: String(m.id ?? raw.id),
  title: String(m.title ?? '(Không tên)'),
  color: String(m.color ?? '#326e51'),
  promoImage: String(raw.promo_image ?? raw.banner ?? ''),
  banners: [],
  subTabs: [],
  tags: [],
  productIds: [],
  sortOrder: Number(raw.sort_order ?? raw.thu_tu ?? 0),
}))

// Ưu tiên: imported > effectiveSections từ store (sections fetched từ API hoặc
// auto-derive từ danh mục) > seeded fake. Logic derive nằm trong adminData store
// để cả /admin/sections lẫn HomeView (mypage) dùng chung.
const allSections = computed<ShopSection[]>(() => {
  if (imported.hasData.value) return imported.items.value
  return store.effectiveSections
})

type FormState = {
  id: string
  title: string
  color: string
  promoImage: string
  subTabs: string
  tags: string
}
function emptyForm(): FormState {
  return { id: '', title: '', color: '#326e51', promoImage: '', subTabs: '', tags: '' }
}

const formOpen = ref(false)
const editingId = ref<string | null>(null)
const form = ref<FormState>(emptyForm())
const productsModalOpen = ref(false)
const productsModalSection = ref<ShopSection | null>(null)
const productPickerSearch = ref('')

function slugify(s: string): string {
  if (!s) return ''
  try {
    return s.toLowerCase()
      .normalize('NFD').replace(/̀-ͯ/g, '').replace(/[̀-ͯ]/g, '')
      .replace(/đ/g, 'd').replace(/Đ/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim().replace(/\s+/g, '-')
  } catch {
    return s.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/--+/g, '-')
  }
}

const stats = computed(() => ({
  total: allSections.value.length,
  totalProducts: allSections.value.reduce((s, x) => s + x.productIds.length, 0),
  empty: allSections.value.filter((s) => s.productIds.length === 0).length,
}))

const sectionPreviewProducts = computed(() => {
  const map = new Map<string, AdminProduct[]>()
  for (const section of allSections.value) {
    map.set(
      section.id,
      section.productIds
        .slice(0, 8)
        .map((id) => store.findProduct(id))
        .filter((p): p is AdminProduct => p !== null),
    )
  }
  return map
})

function previewProducts(s: ShopSection) {
  return sectionPreviewProducts.value.get(s.id) || []
}

function openCreate() {
  editingId.value = null
  form.value = emptyForm()
  formOpen.value = true
}
function openEdit(s: ShopSection) {
  editingId.value = s.id
  form.value = {
    id: s.id, title: s.title, color: s.color || '#326e51',
    promoImage: s.promoImage || '',
    subTabs: s.subTabs.join(', '),
    tags: s.tags.join(', '),
  }
  formOpen.value = true
}

async function submit() {
  try {
    const title = (form.value.title || '').trim()
    if (!title) {
      toast.error('Thiếu tên', 'Hãy nhập tên section trước khi lưu')
      return
    }
    const rawId = (form.value.id || '').trim()
    const idGen = rawId || slugify(title) || ('section-' + Date.now())

    if (!editingId.value && store.sections.some((s) => s.id === idGen)) {
      toast.error('ID đã tồn tại', `Đổi tên hoặc nhập ID khác — hiện: ${idGen}`)
      return
    }
    const subTabs = (form.value.subTabs || '').split(',').map((s) => s.trim()).filter(Boolean)
    const tags = (form.value.tags || '').split(',').map((s) => s.trim()).filter(Boolean)

    if (editingId.value) {
      await store.updateSection(editingId.value, {
        title, color: form.value.color || '#326e51',
        promoImage: form.value.promoImage || undefined,
        subTabs, tags,
      })
      toast.success('Đã cập nhật section', title)
    } else {
      const result = await store.addSection({
        id: idGen, title,
        color: form.value.color || '#326e51',
        promoImage: form.value.promoImage || undefined,
        banners: [], subTabs, tags,
      })
      if (!result) {
        toast.error('Tạo section thất bại', 'ID đã tồn tại')
        return
      }
      toast.success('Đã tạo section', `${title} (id: ${idGen})`)
    }
    formOpen.value = false
  } catch (e: any) {
    console.error('[ShopSections] submit error:', e)
    toast.error('Lỗi lưu section', e?.response?.data?.message || e?.message || 'Lỗi không xác định')
  }
}

async function askDelete(s: ShopSection) {
  if (!confirm(`Xoá section "${s.title}"? Sản phẩm trong section sẽ vẫn còn nhưng không hiển thị ở khu vực này nữa.`)) return
  try {
    await store.removeSection(s.id)
    toast.success('Đã xoá section', s.title)
  } catch (e: any) {
    toast.error('Xoá section thất bại', e?.response?.data?.message || e?.message)
  }
}

// Manage products in section
async function openProducts(s: ShopSection) {
  productsModalSection.value = s
  productPickerSearch.value = ''
  productsModalOpen.value = true
  if (!store.products.length) {
    try {
      await store.fetchProductSnapshot({ all: 1, limit: 1000 })
    } catch (e: any) {
      toast.error('Tải sản phẩm thất bại', e?.response?.data?.message || e?.message)
    }
  }
}
function isProductInSection(productId: number) {
  return productsModalSection.value?.productIds.includes(productId)
}
async function toggleProductInSection(productId: number) {
  if (!productsModalSection.value) return
  const ids = [...productsModalSection.value.productIds]
  const idx = ids.indexOf(productId)
  if (idx >= 0) ids.splice(idx, 1)
  else ids.push(productId)
  try {
    const updated = await store.updateSection(productsModalSection.value.id, { productIds: ids })
    productsModalSection.value = updated || store.sections.find((s) => s.id === productsModalSection.value?.id) || null
  } catch (e: any) {
    toast.error('Cập nhật sản phẩm thất bại', e?.response?.data?.message || e?.message)
  }
}

const productSearchResults = computed(() => {
  const q = productPickerSearch.value.trim().toLowerCase()
  const list = store.products
  if (!q) return list.slice(0, 20)
  return list.filter((p) =>
    p.name.toLowerCase().includes(q) ||
    p.sku.toLowerCase().includes(q) ||
    p.brand.toLowerCase().includes(q) ||
    p.category.toLowerCase().includes(q)
  ).slice(0, 30)
})

async function moveUp(s: ShopSection) {
  const idx = store.sections.findIndex((x) => x.id === s.id)
  if (idx > 0) {
    const newOrder = store.sections.map((x) => x.id)
    ;[newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]]
    try {
      await store.reorderSections(newOrder)
      toast.success('Đã chuyển lên', s.title)
    } catch (e: any) {
      toast.error('Sắp xếp thất bại', e?.response?.data?.message || e?.message)
    }
  }
}
async function moveDown(s: ShopSection) {
  const idx = store.sections.findIndex((x) => x.id === s.id)
  if (idx < store.sections.length - 1 && idx >= 0) {
    const newOrder = store.sections.map((x) => x.id)
    ;[newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]]
    try {
      await store.reorderSections(newOrder)
      toast.success('Đã chuyển xuống', s.title)
    } catch (e: any) {
      toast.error('Sắp xếp thất bại', e?.response?.data?.message || e?.message)
    }
  }
}

function rowItems(s: ShopSection, idx: number, total: number) {
  const items: { key: string; label: string; icon: string; tone?: 'danger' }[] = [
    { key: 'products', label: 'Quản lý SP trong section', icon: 'ri-store-2-line' },
    { key: 'edit', label: 'Chỉnh sửa', icon: 'ri-edit-line' },
  ]
  if (idx > 0) items.push({ key: 'up', label: 'Chuyển lên', icon: 'ri-arrow-up-line' })
  if (idx < total - 1) items.push({ key: 'down', label: 'Chuyển xuống', icon: 'ri-arrow-down-line' })
  items.push({ key: 'delete', label: 'Xoá section', icon: 'ri-delete-bin-line', tone: 'danger' })
  return items
}
function onAction(s: ShopSection, idx: number, key: string) {
  if (key === 'products') openProducts(s)
  else if (key === 'edit') openEdit(s)
  else if (key === 'up') moveUp(s)
  else if (key === 'down') moveDown(s)
  else if (key === 'delete') askDelete(s)
}

function gotoHome() {
  window.open('/', '_blank')
}
</script>

<template>
  <div class="ym-page">
    <header class="ym-page__header">
      <div>
        <h1>Khu vực hiển thị</h1>
        <p>Section trên trang chủ (TRANG ĐIỂM, CHĂM SÓC DA MẶT...). Mỗi section là 1 carousel hiển thị các SP đã gán.</p>
      </div>
      <div class="ym-page__actions">
        <ShopImportExport entity="sections" id-field="key" label="khu vực hiển thị" @imported="imported.refresh" />
        <button type="button" class="ym-btn" @click="gotoHome"><i class="ri-external-link-line"></i> Xem trang chủ</button>
        <button type="button" class="ym-btn ym-btn--primary" @click="openCreate"><i class="ri-add-line"></i> Thêm section mới</button>
      </div>
    </header>

    <section class="ym-mini-stats">
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Tổng section</p><p class="ym-mini-stat__value">{{ stats.total }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Lượt SP gán</p><p class="ym-mini-stat__value">{{ stats.totalProducts }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Section trống</p><p class="ym-mini-stat__value" :style="{ color: stats.empty > 0 ? '#92400e' : '#166534' }">{{ stats.empty }}</p></article>
    </section>

    <!-- Loading -->
    <div v-if="store.loading && !allSections.length" class="ym-loading-card">
      <i class="ri-loader-4-line ym-spinning"></i>
      <p>Đang tải khu vực hiển thị từ server...</p>
    </div>

    <!-- Empty -->
    <div v-else-if="!allSections.length" class="ym-empty-card">
      <i class="ri-layout-grid-line"></i>
      <h3>Chưa có khu vực hiển thị nào</h3>
      <p>Tạo khu vực đầu tiên để hiển thị sản phẩm theo nhóm trên trang chủ (giống như TRANG ĐIỂM, CHĂM SÓC DA MẶT...).</p>
      <button type="button" class="ym-btn ym-btn--primary" @click="openCreate"><i class="ri-add-line"></i> Tạo khu vực đầu tiên</button>
    </div>

    <div v-else class="ym-sections-grid">
      <article v-for="(s, idx) in allSections" :key="s.id" class="ym-sec-card">
        <header class="ym-sec-card__head" :style="{ borderTopColor: s.color }">
          <div class="ym-sec-card__order">
            <button type="button" :disabled="idx === 0" @click="moveUp(s)"><i class="ri-arrow-up-s-line"></i></button>
            <span>#{{ idx + 1 }}</span>
            <button type="button" :disabled="idx === allSections.length - 1" @click="moveDown(s)"><i class="ri-arrow-down-s-line"></i></button>
          </div>
          <div class="ym-sec-card__title-wrap">
            <span class="ym-sec-card__color-dot" :style="{ background: s.color }"></span>
            <h3>{{ s.title }}</h3>
            <small class="ym-sec-card__id">{{ s.id }}</small>
          </div>
          <RowMenu :items="rowItems(s, idx, allSections.length)" @select="onAction(s, idx, $event)" />
        </header>

        <div class="ym-sec-card__body">
          <div class="ym-sec-stats">
            <div><span class="is-muted">Sản phẩm</span><strong>{{ s.productIds.length }}</strong></div>
            <div><span class="is-muted">Sub-tabs</span><strong>{{ s.subTabs.length }}</strong></div>
            <div><span class="is-muted">Tags</span><strong>{{ s.tags.length }}</strong></div>
          </div>

          <div v-if="s.subTabs.length" class="ym-sec-chips">
            <small>Sub-tabs:</small>
            <span v-for="(t, i) in s.subTabs" :key="i" class="ym-chip">{{ t }}</span>
          </div>
          <div v-if="s.tags.length" class="ym-sec-chips">
            <small>Tags:</small>
            <span v-for="(t, i) in s.tags" :key="i" class="ym-chip ym-chip--tag">{{ t }}</span>
          </div>

          <div v-if="s.productIds.length" class="ym-sec-products">
            <small>Sản phẩm trong section:</small>
            <div class="ym-sec-products__stack">
              <img v-for="p in previewProducts(s)" :key="p.id" :src="p.image" :title="p.name" :alt="p.name" />
              <span v-if="s.productIds.length > 8" class="ym-sec-products__more">+{{ s.productIds.length - 8 }}</span>
            </div>
          </div>
        </div>

        <footer class="ym-sec-card__actions">
          <button type="button" class="ym-btn ym-btn--sm" @click="openProducts(s)"><i class="ri-store-2-line"></i> Quản lý SP ({{ s.productIds.length }})</button>
          <button type="button" class="ym-btn ym-btn--sm" @click="openEdit(s)"><i class="ri-edit-line"></i> Sửa</button>
        </footer>
      </article>

      <article class="ym-sec-card ym-sec-card--add" @click="openCreate">
        <i class="ri-add-circle-line"></i>
        <span>Thêm section mới</span>
      </article>
    </div>

    <!-- Form modal -->
    <AdminModal v-model:open="formOpen" :title="editingId ? 'Chỉnh sửa section' : 'Thêm section mới'" subtitle="Section là 1 hàng SP hiển thị trên trang chủ" size="md" :confirm-text="editingId ? 'Lưu' : 'Tạo'" @confirm="submit">
      <div class="ym-form-row">
        <div class="ym-form-group">
          <label>ID (slug)</label>
          <input v-model="form.id" type="text" :disabled="!!editingId" :placeholder="form.title ? slugify(form.title) : 'auto-tao-tu-ten'" />
          <p class="ym-form-help">Không thay đổi được sau khi tạo. Dùng để URL/anchor.</p>
        </div>
        <div class="ym-form-group">
          <label>Màu chủ đạo</label>
          <input v-model="form.color" type="color" style="height: 38px; padding: 4px" />
        </div>
      </div>
      <div class="ym-form-group"><label>Tên section *</label><input v-model="form.title" type="text" placeholder="Vd: TRANG ĐIỂM CAO CẤP" /></div>
      <div class="ym-form-group">
        <label>Sub-tabs (cách nhau dấu phẩy)</label>
        <input v-model="form.subTabs" type="text" placeholder="Vd: Trang điểm môi, Tẩy trang, Trang điểm mặt" />
        <p class="ym-form-help">Hiển thị ngay dưới tiêu đề section, để filter SP theo sub-tab.</p>
      </div>
      <div class="ym-form-group">
        <label>Tags / từ khóa hot</label>
        <input v-model="form.tags" type="text" placeholder="Vd: Son môi, Cushion, Phấn phủ, Kem nền" />
        <p class="ym-form-help">Chip tags hiển thị ở góc trên section, click để filter.</p>
      </div>
      <div class="ym-form-group">
        <label>Ảnh promo (URL)</label>
        <input v-model="form.promoImage" type="url" placeholder="https://..." />
      </div>
    </AdminModal>

    <!-- Manage products in section -->
    <AdminModal v-if="productsModalSection" v-model:open="productsModalOpen" :title="`Quản lý SP: ${productsModalSection.title}`" :subtitle="`${productsModalSection.productIds.length} sản phẩm đã gán · Click để toggle`" size="xl" hide-footer>
      <div class="ym-search" style="margin-bottom: 14px">
        <i class="ri-search-line"></i>
        <input v-model="productPickerSearch" type="text" placeholder="Tìm theo tên, SKU, brand, danh mục..." />
      </div>

      <p style="margin: 0 0 10px; font-size: 13px; color: #6b7280">
        <i class="ri-information-line"></i> Tích vào SP để gán/bỏ gán khỏi section. Thay đổi áp dụng ngay trên trang chủ.
      </p>

      <div class="ym-prod-grid">
        <label v-for="p in productSearchResults" :key="p.id" :class="['ym-prod-pick', { 'is-on': isProductInSection(p.id) }]">
          <input type="checkbox" :checked="isProductInSection(p.id)" @change="toggleProductInSection(p.id)" />
          <img :src="p.image" :alt="p.name" />
          <div>
            <strong>{{ p.name }}</strong>
            <small>{{ p.sku }} · {{ p.brand }} · {{ p.category }}</small>
          </div>
          <i v-if="isProductInSection(p.id)" class="ri-checkbox-circle-fill ym-prod-pick__check"></i>
        </label>
      </div>

      <div style="display: flex; justify-content: flex-end; margin-top: 14px; gap: 8px">
        <button type="button" class="ym-btn" @click="productsModalOpen = false">Đóng</button>
        <button type="button" class="ym-btn ym-btn--primary" @click="gotoHome">
          <i class="ri-external-link-line"></i> Xem trên trang chủ
        </button>
      </div>
    </AdminModal>
  </div>
</template>

<style scoped src="./_admin-shared.css"></style>
<style scoped>
.ym-sections-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 14px;
}

.ym-loading-card, .ym-empty-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 24px;
  background: #fff;
  border: 2px dashed #e5e7eb;
  border-radius: 12px;
  text-align: center;
  gap: 12px;
}
.ym-loading-card i { font-size: 36px; color: #326e51; }
.ym-loading-card p { color: #6b7280; font-size: 14px; margin: 0; }
.ym-empty-card i { font-size: 48px; color: #9ca3af; }
.ym-empty-card h3 { margin: 0; font-size: 16px; color: #111827; }
.ym-empty-card p { margin: 0; color: #6b7280; font-size: 14px; max-width: 480px; }
.ym-spinning { animation: ym-spin 1s linear infinite; }
@keyframes ym-spin { to { transform: rotate(360deg); } }

.ym-sec-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.ym-sec-card__head {
  border-top: 4px solid #326e51;
  padding: 14px 16px 10px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.ym-sec-card__order {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 11px;
  color: #6b7280;
}
.ym-sec-card__order button {
  width: 22px;
  height: 18px;
  border: none;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}
.ym-sec-card__order button:hover:not(:disabled) { background: #f3f4f6; color: #326e51; }
.ym-sec-card__order button:disabled { opacity: 0.3; cursor: not-allowed; }

.ym-sec-card__title-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.ym-sec-card__color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}
.ym-sec-card__title-wrap h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #111827;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.ym-sec-card__id {
  font-size: 11px;
  color: #9ca3af;
  background: #f3f4f6;
  padding: 1px 6px;
  border-radius: 4px;
  font-family: monospace;
}

.ym-sec-card__body {
  padding: 12px 16px;
  flex: 1;
}
.ym-sec-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 10px 12px;
  background: #fafbfc;
  border-radius: 8px;
  margin-bottom: 10px;
}
.ym-sec-stats > div { display: flex; flex-direction: column; gap: 2px; }
.ym-sec-stats span { font-size: 11px; }
.ym-sec-stats strong { font-size: 16px; color: #111827; }

.ym-sec-chips { margin-top: 10px; font-size: 12px; }
.ym-sec-chips small { color: #6b7280; margin-right: 6px; }
.ym-chip {
  display: inline-block;
  padding: 2px 8px;
  background: #e8f0ec;
  color: #326e51;
  border-radius: 999px;
  font-size: 11px;
  margin-right: 4px;
  margin-top: 4px;
}
.ym-chip--tag { background: #fef3c7; color: #92400e; }

.ym-sec-products { margin-top: 12px; padding-top: 10px; border-top: 1px dashed #e5e7eb; }
.ym-sec-products small { color: #6b7280; font-size: 12px; }
.ym-sec-products__stack {
  display: flex;
  align-items: center;
  margin-top: 4px;
  flex-wrap: wrap;
  gap: 2px;
}
.ym-sec-products__stack img {
  width: 36px;
  height: 36px;
  object-fit: contain;
  padding: 2px;
  background: #fafbfc;
  border: 1px solid #f1f3f5;
  border-radius: 6px;
  margin-left: -4px;
}
.ym-sec-products__stack img:first-child { margin-left: 0; }
.ym-sec-products__more {
  margin-left: -4px;
  width: 36px;
  height: 36px;
  background: #f3f4f6;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  color: #4b5563;
  border: 1px solid #f1f3f5;
}

.ym-sec-card__actions {
  display: flex;
  gap: 6px;
  padding: 10px 16px;
  border-top: 1px solid #f1f3f5;
  background: #fafbfc;
}
.ym-sec-card__actions .ym-btn { flex: 1; justify-content: center; }

.ym-sec-card--add {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 2px dashed #d1d5db;
  background: #fafbfc;
  color: #6b7280;
  cursor: pointer;
  min-height: 280px;
  font-weight: 500;
  transition: all 0.15s;
}
.ym-sec-card--add:hover {
  border-color: #326e51;
  color: #326e51;
  background: #f3f6f4;
}
.ym-sec-card--add i { font-size: 32px; }

/* Product picker grid trong modal */
.ym-prod-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 8px;
  max-height: 480px;
  overflow-y: auto;
  padding: 4px;
}
.ym-prod-pick {
  display: grid;
  grid-template-columns: 22px 50px 1fr 22px;
  gap: 10px;
  align-items: center;
  padding: 8px;
  background: #fff;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.12s;
}
.ym-prod-pick:hover { border-color: #326e51; }
.ym-prod-pick.is-on {
  border-color: #326e51;
  background: #f3f6f4;
}
.ym-prod-pick input[type="checkbox"] {
  width: 16px;
  height: 16px;
}
.ym-prod-pick img {
  width: 50px;
  height: 50px;
  object-fit: contain;
  padding: 2px;
  background: #fafbfc;
  border: 1px solid #f1f3f5;
  border-radius: 6px;
}
.ym-prod-pick > div {
  min-width: 0;
}
.ym-prod-pick strong {
  display: block;
  font-size: 13px;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ym-prod-pick small {
  font-size: 11px;
  color: #6b7280;
}
.ym-prod-pick__check {
  color: #166534;
  font-size: 18px;
}
</style>
