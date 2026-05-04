<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import AdminModal from '../components/AdminModal.vue'
import Pagination from '../components/Pagination.vue'
import { useToast } from '../composables/useToast'
import { useAdminDataStore, type AdminCategory } from '../stores/adminData'
import { formatPrice } from '@/modules/mypage/home/configs'

const toast = useToast()
const router = useRouter()
const store = useAdminDataStore()

// Modal hiển thị sản phẩm trong danh mục
const productsModalOpen = ref(false)
const productsModalCategory = ref<AdminCategory | null>(null)
const productsSearch = ref('')

function openProducts(cat: AdminCategory) {
  productsModalCategory.value = cat
  productsSearch.value = ''
  productsModalOpen.value = true
}

const productsInModal = computed(() => {
  if (!productsModalCategory.value) return []
  const q = productsSearch.value.trim().toLowerCase()
  return store.productsForCategory(productsModalCategory.value).filter((p) => {
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    return matchSearch
  })
})

const modalStats = computed(() => {
  const list = productsInModal.value
  return {
    count: list.length,
    totalStock: list.reduce((s, p) => s + p.stock, 0),
    totalValue: list.reduce((s, p) => s + p.stock * p.cost, 0),
    outOfStock: list.filter((p) => p.stock === 0).length,
  }
})

function gotoProducts(catName: string) {
  router.push({ path: '/admin/products', query: { category: catName } })
  productsModalOpen.value = false
}

const expanded = ref<Set<number>>(new Set())

// Open all roots by default
const initialRoots = computed(() => store.categories.filter((c) => c.parentId === null).map((c) => c.id))
expanded.value = new Set(initialRoots.value)

function toggle(id: number) {
  expanded.value.has(id) ? expanded.value.delete(id) : expanded.value.add(id)
  expanded.value = new Set(expanded.value)
}

function toggleAll() {
  if (expanded.value.size === 0) {
    const allParents = store.categories.filter((c) => store.categories.some((x) => x.parentId === c.id)).map((c) => c.id)
    expanded.value = new Set(allParents)
  } else {
    expanded.value = new Set()
  }
}

function childrenOf(id: number) {
  return store.categories.filter((c) => c.parentId === id)
}

const rootCats = computed(() => store.categories.filter((c) => c.parentId === null))

// Pagination cho root categories — danh mục có thể >100 cha gây lag khi render
// hết 1 trang. Mặc định 20/trang.
const page = ref(1)
const perPage = ref(20)
const search = ref('')
const filteredRoots = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return rootCats.value
  return rootCats.value.filter((c) => c.name.toLowerCase().includes(q))
})
const paginatedRoots = computed(() =>
  filteredRoots.value.slice((page.value - 1) * perPage.value, page.value * perPage.value),
)
watch(search, () => { page.value = 1 })

const stats = computed(() => ({
  total: store.categories.length,
  root: rootCats.value.length,
  visible: store.categories.filter((c) => c.active).length,
  totalProducts: store.products.length,
}))

// Side form for adding new category
type FormState = Omit<AdminCategory, 'id'>
function emptyForm(): FormState {
  return { parentId: null, name: '', slug: '', icon: 'ri-folder-line', description: '', showOnMenu: true, active: true }
}

const sideForm = ref<FormState>(emptyForm())
const prevName = ref('')

watch(() => sideForm.value.name, (n) => {
  if (!sideForm.value.slug || sideForm.value.slug === store.slugify(prevName.value)) {
    sideForm.value.slug = store.slugify(n)
  }
  prevName.value = n
})

function submitSide() {
  if (!sideForm.value.name) {
    toast.error('Thiếu thông tin', 'Tên danh mục là bắt buộc.')
    return
  }
  const cat = store.addCategory(sideForm.value)
  if (cat.parentId !== null) {
    expanded.value.add(cat.parentId)
    expanded.value = new Set(expanded.value)
  }
  toast.success('Đã thêm danh mục', cat.name)
  sideForm.value = emptyForm()
}

// Edit modal
const editOpen = ref(false)
const editingId = ref<number | null>(null)
const editForm = ref<FormState>(emptyForm())
const subOpen = ref(false)

function openEdit(c: AdminCategory) {
  editingId.value = c.id
  editForm.value = {
    parentId: c.parentId,
    name: c.name,
    slug: c.slug,
    icon: c.icon,
    description: c.description || '',
    showOnMenu: c.showOnMenu,
    active: c.active,
  }
  editOpen.value = true
}

function submitEdit() {
  if (!editingId.value || !editForm.value.name) return
  store.updateCategory(editingId.value, {
    ...editForm.value,
    slug: editForm.value.slug || store.slugify(editForm.value.name),
  })
  toast.success('Đã cập nhật danh mục', editForm.value.name)
  editOpen.value = false
}

function openAddSub(parentId: number) {
  editingId.value = null
  editForm.value = { ...emptyForm(), parentId }
  subOpen.value = true
}

function submitAddSub() {
  if (!editForm.value.name) {
    toast.error('Thiếu thông tin', 'Tên danh mục là bắt buộc.')
    return
  }
  const cat = store.addCategory(editForm.value)
  if (cat.parentId !== null) {
    expanded.value.add(cat.parentId)
    expanded.value = new Set(expanded.value)
  }
  toast.success('Đã thêm danh mục con', cat.name)
  subOpen.value = false
}

const confirmOpen = ref(false)
const confirmCtx = ref<{ title: string; message: string; action: () => void } | null>(null)

function askDelete(c: AdminCategory) {
  const childs = childrenOf(c.id).length
  confirmCtx.value = {
    title: `Xoá danh mục "${c.name}"?`,
    message: childs > 0 ? `Danh mục này có ${childs} danh mục con. Tất cả sẽ bị xoá theo.` : 'Hành động không thể hoàn tác.',
    action: () => {
      const removed = store.removeCategory(c.id)
      toast.success('Đã xoá danh mục', `${c.name} (${removed} mục)`)
    },
  }
  confirmOpen.value = true
}

function productCount(c: AdminCategory) {
  return store.productsInCategory(c)
}
</script>

<template>
  <div class="ym-page">
    <header class="ym-page__header">
      <div>
        <h1>Danh mục</h1>
        <p>Quản lý cấu trúc danh mục sản phẩm hiển thị trên trang khách hàng</p>
      </div>
      <div class="ym-page__actions">
        <button type="button" class="ym-btn" @click="toggleAll">
          <i class="ri-expand-up-down-line"></i>
          {{ expanded.size === 0 ? 'Mở rộng tất cả' : 'Thu gọn tất cả' }}
        </button>
      </div>
    </header>

    <section class="ym-mini-stats">
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Tổng danh mục</p><p class="ym-mini-stat__value">{{ stats.total }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Danh mục gốc</p><p class="ym-mini-stat__value">{{ stats.root }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Đang hiển thị</p><p class="ym-mini-stat__value">{{ stats.visible }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Tổng sản phẩm</p><p class="ym-mini-stat__value">{{ stats.totalProducts }}</p></article>
    </section>

    <div class="ym-layout">
      <div class="ym-card">
        <div class="ym-card__header">
          <h2>Cấu trúc danh mục</h2>
          <div class="ym-search" style="max-width: 320px">
            <i class="ri-search-line"></i>
            <input v-model="search" type="text" placeholder="Tìm danh mục cha..." />
          </div>
        </div>
        <ul class="ym-tree">
          <li v-for="cat in paginatedRoots" :key="cat.id" class="ym-tree__node">
            <div class="ym-tree__row">
              <button v-if="childrenOf(cat.id).length" type="button" class="ym-tree__toggle" @click="toggle(cat.id)">
                <i :class="expanded.has(cat.id) ? 'ri-arrow-down-s-line' : 'ri-arrow-right-s-line'"></i>
              </button>
              <span v-else class="ym-tree__spacer"></span>
              <i :class="['ym-tree__icon', cat.icon]"></i>
              <span class="ym-tree__name">{{ cat.name }}</span>
              <span class="ym-tree__slug">/{{ cat.slug }}</span>
              <button type="button" class="ym-tag-link" title="Xem sản phẩm trong nhóm" @click="openProducts(cat)">
                <i class="ri-store-2-line"></i> {{ productCount(cat) }} SP
              </button>
              <span :class="['ym-tag', cat.active && cat.showOnMenu ? 'ym-tag--success' : 'ym-tag--neutral']" :title="`Active: ${cat.active ? 'có' : 'không'} | Menu: ${cat.showOnMenu ? 'có' : 'không'}`">
                <i :class="cat.active && cat.showOnMenu ? 'ri-eye-line' : 'ri-eye-off-line'"></i>
                {{ cat.active && cat.showOnMenu ? 'Hiện trên web' : 'Ẩn' }}
              </span>
              <div class="ym-tree__actions">
                <button type="button" class="ym-icon-btn" title="Xem SP" @click="openProducts(cat)"><i class="ri-eye-line"></i></button>
                <button type="button" class="ym-icon-btn" title="Sửa" @click="openEdit(cat)"><i class="ri-edit-line"></i></button>
                <button type="button" class="ym-icon-btn" title="Thêm con" @click="openAddSub(cat.id)"><i class="ri-add-line"></i></button>
                <button type="button" class="ym-icon-btn" title="Xoá" @click="askDelete(cat)"><i class="ri-delete-bin-line"></i></button>
              </div>
            </div>
            <ul v-if="childrenOf(cat.id).length && expanded.has(cat.id)" class="ym-tree ym-tree--child">
              <li v-for="lvl2 in childrenOf(cat.id)" :key="lvl2.id" class="ym-tree__node">
                <div class="ym-tree__row">
                  <button v-if="childrenOf(lvl2.id).length" type="button" class="ym-tree__toggle" @click="toggle(lvl2.id)">
                    <i :class="expanded.has(lvl2.id) ? 'ri-arrow-down-s-line' : 'ri-arrow-right-s-line'"></i>
                  </button>
                  <span v-else class="ym-tree__spacer"></span>
                  <i :class="['ym-tree__icon', lvl2.icon]"></i>
                  <span class="ym-tree__name">{{ lvl2.name }}</span>
                  <span class="ym-tree__slug">/{{ lvl2.slug }}</span>
                  <button type="button" class="ym-tag-link" title="Xem sản phẩm" @click="openProducts(lvl2)">
                    <i class="ri-store-2-line"></i> {{ productCount(lvl2) }} SP
                  </button>
                  <span :class="['ym-tag', lvl2.active && lvl2.showOnMenu ? 'ym-tag--success' : 'ym-tag--neutral']">
                    <i :class="lvl2.active && lvl2.showOnMenu ? 'ri-eye-line' : 'ri-eye-off-line'"></i>
                    {{ lvl2.active && lvl2.showOnMenu ? 'Hiện' : 'Ẩn' }}
                  </span>
                  <div class="ym-tree__actions">
                    <button type="button" class="ym-icon-btn" title="Xem SP" @click="openProducts(lvl2)"><i class="ri-eye-line"></i></button>
                    <button type="button" class="ym-icon-btn" @click="openEdit(lvl2)"><i class="ri-edit-line"></i></button>
                    <button type="button" class="ym-icon-btn" @click="openAddSub(lvl2.id)"><i class="ri-add-line"></i></button>
                    <button type="button" class="ym-icon-btn" @click="askDelete(lvl2)"><i class="ri-delete-bin-line"></i></button>
                  </div>
                </div>
                <ul v-if="childrenOf(lvl2.id).length && expanded.has(lvl2.id)" class="ym-tree ym-tree--child">
                  <li v-for="lvl3 in childrenOf(lvl2.id)" :key="lvl3.id" class="ym-tree__node">
                    <div class="ym-tree__row">
                      <span class="ym-tree__spacer"></span>
                      <i :class="['ym-tree__icon', lvl3.icon]"></i>
                      <span class="ym-tree__name">{{ lvl3.name }}</span>
                      <span class="ym-tree__slug">/{{ lvl3.slug }}</span>
                      <span :class="['ym-tag', lvl3.active && lvl3.showOnMenu ? 'ym-tag--success' : 'ym-tag--neutral']">
                        <i :class="lvl3.active && lvl3.showOnMenu ? 'ri-eye-line' : 'ri-eye-off-line'"></i>
                        {{ lvl3.active && lvl3.showOnMenu ? 'Hiện' : 'Ẩn' }}
                      </span>
                      <div class="ym-tree__actions">
                        <button type="button" class="ym-icon-btn" @click="openEdit(lvl3)"><i class="ri-edit-line"></i></button>
                        <button type="button" class="ym-icon-btn" @click="askDelete(lvl3)"><i class="ri-delete-bin-line"></i></button>
                      </div>
                    </div>
                  </li>
                </ul>
              </li>
            </ul>
          </li>
        </ul>
        <Pagination v-model="page" :total-items="filteredRoots.length" :per-page="perPage" item-label="danh mục" @update:per-page="(n) => perPage = n" />
      </div>

      <aside class="ym-card">
        <div class="ym-card__header"><h2>Thêm danh mục mới</h2></div>
        <div class="ym-card__body">
          <div class="ym-form-group">
            <label>Tên danh mục *</label>
            <input v-model="sideForm.name" type="text" placeholder="Vd: Mỹ phẩm Hàn Quốc" />
          </div>
          <div class="ym-form-group">
            <label>Slug</label>
            <input v-model="sideForm.slug" type="text" placeholder="my-pham-han-quoc" />
            <p class="ym-form-help">URL: /products?cat={{ sideForm.slug || 'auto' }}</p>
          </div>
          <div class="ym-form-group">
            <label>Danh mục cha</label>
            <select v-model="sideForm.parentId">
              <option :value="null">— Không có (gốc) —</option>
              <option v-for="cat in rootCats" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
            </select>
          </div>
          <div class="ym-form-group">
            <label>Icon</label>
            <input v-model="sideForm.icon" type="text" placeholder="ri-leaf-line" />
          </div>
          <div class="ym-form-group">
            <label>Mô tả</label>
            <textarea v-model="sideForm.description" rows="3"></textarea>
          </div>
          <label class="ym-checkbox"><input v-model="sideForm.showOnMenu" type="checkbox" /> Hiển thị trên menu</label>
          <label class="ym-checkbox"><input v-model="sideForm.active" type="checkbox" /> Đang hiển thị</label>
          <div class="ym-form-actions">
            <button type="button" class="ym-btn" @click="sideForm = emptyForm()">Reset</button>
            <button type="button" class="ym-btn ym-btn--primary" @click="submitSide">Thêm danh mục</button>
          </div>
        </div>
      </aside>
    </div>

    <AdminModal v-model:open="editOpen" title="Chỉnh sửa danh mục" size="md" confirm-text="Lưu" @confirm="submitEdit">
      <div class="ym-form-group"><label>Tên *</label><input v-model="editForm.name" type="text" /></div>
      <div class="ym-form-group"><label>Slug</label><input v-model="editForm.slug" type="text" /></div>
      <div class="ym-form-row">
        <div class="ym-form-group">
          <label>Danh mục cha</label>
          <select v-model="editForm.parentId">
            <option :value="null">— Gốc —</option>
            <option v-for="cat in rootCats.filter(c => c.id !== editingId)" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
          </select>
        </div>
        <div class="ym-form-group"><label>Icon</label><input v-model="editForm.icon" type="text" /></div>
      </div>
      <div class="ym-form-group"><label>Mô tả</label><textarea v-model="editForm.description" rows="3"></textarea></div>
      <label class="ym-checkbox"><input v-model="editForm.showOnMenu" type="checkbox" /> Hiển thị trên menu</label>
      <label class="ym-checkbox"><input v-model="editForm.active" type="checkbox" /> Đang hiển thị</label>
    </AdminModal>

    <AdminModal v-model:open="subOpen" title="Thêm danh mục con" size="md" confirm-text="Thêm" @confirm="submitAddSub">
      <div class="ym-form-group"><label>Tên *</label><input v-model="editForm.name" type="text" /></div>
      <div class="ym-form-group"><label>Slug</label><input v-model="editForm.slug" type="text" /></div>
      <div class="ym-form-group"><label>Icon</label><input v-model="editForm.icon" type="text" /></div>
      <div class="ym-form-group"><label>Mô tả</label><textarea v-model="editForm.description" rows="3"></textarea></div>
    </AdminModal>

    <AdminModal v-if="confirmCtx" v-model:open="confirmOpen" :title="confirmCtx.title" size="sm" confirm-tone="danger" confirm-text="Xoá" @confirm="confirmCtx.action(); confirmOpen = false">
      <p style="margin: 0; color: #4b5563">{{ confirmCtx.message }}</p>
    </AdminModal>

    <!-- Products in category modal -->
    <AdminModal v-if="productsModalCategory" v-model:open="productsModalOpen" :title="`Sản phẩm trong: ${productsModalCategory.name}`" :subtitle="`${modalStats.count} sản phẩm`" size="xl" hide-footer>
      <section class="ym-mini-stats" style="margin-bottom: 14px">
        <article class="ym-mini-stat"><p class="ym-mini-stat__label">Số SP</p><p class="ym-mini-stat__value">{{ modalStats.count }}</p></article>
        <article class="ym-mini-stat"><p class="ym-mini-stat__label">Tổng tồn</p><p class="ym-mini-stat__value">{{ modalStats.totalStock }}</p></article>
        <article class="ym-mini-stat"><p class="ym-mini-stat__label">Giá trị tồn</p><p class="ym-mini-stat__value" style="color: #326e51">{{ formatPrice(modalStats.totalValue) }}</p></article>
        <article class="ym-mini-stat"><p class="ym-mini-stat__label">Hết hàng</p><p class="ym-mini-stat__value" style="color: #d0021b">{{ modalStats.outOfStock }}</p></article>
      </section>

      <div class="ym-search" style="margin-bottom: 14px">
        <i class="ri-search-line"></i>
        <input v-model="productsSearch" type="text" placeholder="Tìm trong danh mục..." />
      </div>

      <div class="ym-table-wrap">
        <table class="ym-table">
          <thead><tr><th>SKU</th><th>Sản phẩm</th><th>Brand</th><th class="is-right">Giá lẻ</th><th class="is-right">Giá vốn</th><th class="is-center">Tồn</th><th>Trạng thái</th></tr></thead>
          <tbody>
            <tr v-for="p in productsInModal" :key="p.id">
              <td><strong>{{ p.sku }}</strong></td>
              <td>
                <div class="ym-cell-prod">
                  <img :src="p.image" :alt="p.name" />
                  <span>{{ p.name }}</span>
                </div>
              </td>
              <td>{{ p.brand }}</td>
              <td class="is-right"><strong>{{ formatPrice(p.salePrice) }}</strong></td>
              <td class="is-right is-muted">{{ formatPrice(p.cost) }}</td>
              <td class="is-center" :class="p.stock === 0 ? 'is-danger' : p.stock < p.threshold ? 'is-warning' : ''">{{ p.stock }}</td>
              <td><span :class="['ym-tag', p.status === 'active' ? 'ym-tag--success' : p.status === 'out_of_stock' ? 'ym-tag--danger' : 'ym-tag--neutral']">{{ p.status === 'active' ? 'Đang bán' : p.status === 'out_of_stock' ? 'Hết hàng' : 'Nháp' }}</span></td>
            </tr>
            <tr v-if="!productsInModal.length"><td colspan="7" class="ym-empty">Chưa có sản phẩm trong danh mục này.</td></tr>
          </tbody>
        </table>
      </div>

      <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 14px">
        <button type="button" class="ym-btn" @click="productsModalOpen = false">Đóng</button>
        <button type="button" class="ym-btn ym-btn--primary" @click="gotoProducts(productsModalCategory!.name)">
          <i class="ri-external-link-line"></i> Mở trang sản phẩm với filter này
        </button>
      </div>
    </AdminModal>
  </div>
</template>

<style scoped src="./_admin-shared.css"></style>
<style scoped>
.ym-layout { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; }
@media (max-width: 1024px) { .ym-layout { grid-template-columns: 1fr; } }

.ym-tree { list-style: none; margin: 0; padding: 8px 0; }
.ym-tree--child { margin-left: 24px; padding: 0; border-left: 1px dashed #e5e7eb; }
.ym-tree__node { padding: 0; }
.ym-tree__row { display: flex; align-items: center; gap: 10px; padding: 9px 14px; border-bottom: 1px solid #f5f5f5; font-size: 14px; }
.ym-tree__row:hover { background: #fafbfc; }
.ym-tree__toggle, .ym-tree__spacer { width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; }
.ym-tree__toggle { border: none; background: transparent; color: #6b7280; cursor: pointer; border-radius: 4px; }
.ym-tree__toggle:hover { background: #f3f4f6; color: #1f2937; }
.ym-tree__icon { color: #326e51; font-size: 16px; }
.ym-tree__name { font-weight: 500; color: #111827; }
.ym-tree__slug { color: #9ca3af; font-size: 12px; }
.ym-tree__actions { margin-left: auto; display: flex; gap: 2px; opacity: 0; transition: opacity 0.15s; }
.ym-tree__row:hover .ym-tree__actions { opacity: 1; }

.ym-form-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 8px; }
.ym-checkbox { display: flex; align-items: center; gap: 8px; font-size: 14px; color: #374151; margin-bottom: 10px; cursor: pointer; }

.ym-tag-link {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 9px; border-radius: 999px;
  background: #f3f6f4; color: #326e51;
  border: 1px solid transparent;
  font-size: 12px; font-weight: 500;
  cursor: pointer;
}
.ym-tag-link:hover { background: #e8f0ec; border-color: #326e51; }

.ym-cell-prod { display: flex; align-items: center; gap: 8px; }
.ym-cell-prod img { width: 32px; height: 32px; object-fit: contain; padding: 2px; background: #fafbfc; border: 1px solid #f1f3f5; border-radius: 6px; }
.ym-table .is-danger { color: #d0021b; font-weight: 600; }
.ym-table .is-warning { color: #92400e; font-weight: 600; }
</style>
