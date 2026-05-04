<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import AdminModal from '../components/AdminModal.vue'
import RowMenu from '../components/RowMenu.vue'
import Pagination from '../components/Pagination.vue'
import ShopImportExport from '../components/ShopImportExport.vue'
import { useToast } from '../composables/useToast'
import { newsPostToPayload, shopNewsApi } from '../services/shopApi'
import { useAdminDataStore } from '../stores/adminData'

type NewsStatus = 'draft' | 'published' | 'archived'
type NewsPost = {
  id: number
  title: string
  slug: string
  excerpt: string
  content: string
  image: string
  category: string
  author: string
  status: NewsStatus
  isFeatured: boolean
  comments: number
  viewCount: number
  sortOrder: number
  publishedAt: string | null
  date: string
  createdAt?: string
  updatedAt?: string
}

type FormState = Omit<NewsPost, 'id' | 'date' | 'createdAt' | 'updatedAt'>

const toast = useToast()
const store = useAdminDataStore()

const posts = ref<NewsPost[]>([])
const loading = ref(false)
const search = ref('')
const filterStatus = ref<'all' | NewsStatus>('all')
const filterCategory = ref('all')
const page = ref(1)
const perPage = ref(5)

const formOpen = ref(false)
const previewOpen = ref(false)
const confirmOpen = ref(false)
const saving = ref(false)
const editingId = ref<number | null>(null)
const preview = ref<NewsPost | null>(null)
const confirmCtx = ref<{ title: string; message: string; action: () => Promise<void> } | null>(null)

const statusMap: Record<NewsStatus, { label: string; tone: string }> = {
  draft: { label: 'Nháp', tone: 'neutral' },
  published: { label: 'Đã đăng', tone: 'success' },
  archived: { label: 'Lưu trữ', tone: 'warning' },
}

function emptyForm(): FormState {
  return {
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    image: '',
    category: 'Tin tức',
    author: 'Admin',
    status: 'draft',
    isFeatured: false,
    comments: 0,
    viewCount: 0,
    sortOrder: 0,
    publishedAt: new Date().toISOString().slice(0, 10),
  }
}

const form = ref<FormState>(emptyForm())

function slugify(s: string) {
  return store.slugify(s)
}

function pick(row: Record<string, any>, keys: string[]): any {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== null && row[k] !== '') return row[k]
  }
  return undefined
}

function mapNews(raw: Record<string, any>): NewsPost {
  return {
    id: Number(raw.id ?? 0),
    title: String(pick(raw, ['title', 'tieu_de', 'ten', 'name']) ?? ''),
    slug: String(pick(raw, ['slug', 'duong_dan']) ?? ''),
    excerpt: String(pick(raw, ['excerpt', 'mo_ta_ngan', 'tom_tat']) ?? ''),
    content: String(pick(raw, ['content', 'noi_dung', 'mo_ta']) ?? ''),
    image: String(pick(raw, ['image', 'anh', 'hinh', 'hinh_anh', 'image_url']) ?? ''),
    category: String(pick(raw, ['category', 'danh_muc', 'chuyen_muc']) ?? 'Tin tức'),
    author: String(pick(raw, ['author', 'tac_gia', 'nguoi_tao']) ?? 'Admin'),
    status: (pick(raw, ['status', 'trang_thai']) ?? 'draft') as NewsStatus,
    isFeatured: Boolean(pick(raw, ['is_featured', 'noi_bat', 'featured']) ?? false),
    comments: Number(pick(raw, ['comments', 'binh_luan']) ?? 0),
    viewCount: Number(pick(raw, ['view_count', 'luot_xem', 'views']) ?? 0),
    sortOrder: Number(pick(raw, ['sort_order', 'thu_tu']) ?? 0),
    publishedAt: pick(raw, ['published_at', 'ngay_dang']) ? String(pick(raw, ['published_at', 'ngay_dang'])) : null,
    date: String(pick(raw, ['date', 'ngay_dang', 'ngay_tao', 'created_at']) ?? ''),
    createdAt: raw.createdAt ?? raw.created_at,
    updatedAt: raw.updatedAt ?? raw.updated_at,
  }
}

async function loadNews() {
  loading.value = true
  try {
    const res = await shopNewsApi.list()
    posts.value = (res.data.data || []).map(mapNews)
  } catch (e: any) {
    toast.error('Tải tin tức thất bại', e?.response?.data?.message || e?.message)
  } finally {
    loading.value = false
  }
}

onMounted(loadNews)

const categoryOptions = computed(() => {
  const values = new Set(posts.value.map((p) => p.category).filter(Boolean))
  values.add('Tin tức')
  values.add('Hướng dẫn')
  values.add('Khuyến mãi')
  return [...values].sort()
})

const stats = computed(() => ({
  total: posts.value.length,
  published: posts.value.filter((p) => p.status === 'published').length,
  draft: posts.value.filter((p) => p.status === 'draft').length,
  featured: posts.value.filter((p) => p.isFeatured).length,
}))

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return posts.value.filter((p) => {
    const matchStatus = filterStatus.value === 'all' || p.status === filterStatus.value
    const matchCategory = filterCategory.value === 'all' || p.category === filterCategory.value
    const matchSearch = !q
      || p.title.toLowerCase().includes(q)
      || (p.excerpt || '').toLowerCase().includes(q)
      || (p.category || '').toLowerCase().includes(q)
    return matchStatus && matchCategory && matchSearch
  })
})

const paginated = computed(() => filtered.value.slice((page.value - 1) * perPage.value, page.value * perPage.value))
watch([search, filterStatus, filterCategory], () => { page.value = 1 })

function openCreate() {
  editingId.value = null
  form.value = emptyForm()
  formOpen.value = true
}

function openEdit(post: NewsPost) {
  editingId.value = post.id
  form.value = {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt || '',
    content: post.content || '',
    image: post.image || '',
    category: post.category || 'Tin tức',
    author: post.author || 'Admin',
    status: post.status,
    isFeatured: !!post.isFeatured,
    comments: post.comments || 0,
    viewCount: post.viewCount || 0,
    sortOrder: post.sortOrder || 0,
    publishedAt: post.publishedAt || new Date().toISOString().slice(0, 10),
  }
  formOpen.value = true
}

function openPreview(post: NewsPost) {
  preview.value = post
  previewOpen.value = true
}

async function submitForm() {
  const title = form.value.title.trim()
  if (!title) {
    toast.error('Thiếu tiêu đề', 'Hãy nhập tiêu đề bài viết.')
    return
  }
  if (!form.value.slug) form.value.slug = slugify(title)

  saving.value = true
  try {
    const payload = newsPostToPayload(form.value)
    if (editingId.value) {
      const res = await shopNewsApi.update(editingId.value, payload)
      const idx = posts.value.findIndex((p) => p.id === editingId.value)
      if (idx >= 0) posts.value[idx] = res.data.data
      toast.success('Đã cập nhật bài viết', title)
    } else {
      const res = await shopNewsApi.create(payload)
      posts.value.unshift(res.data.data)
      toast.success('Đã tạo bài viết', title)
    }
    formOpen.value = false
  } catch (e: any) {
    toast.error('Lưu bài viết thất bại', e?.response?.data?.message || e?.message)
  } finally {
    saving.value = false
  }
}

async function setStatus(post: NewsPost, status: NewsStatus) {
  try {
    const res = await shopNewsApi.updateStatus(post.id, status)
    const idx = posts.value.findIndex((p) => p.id === post.id)
    if (idx >= 0) posts.value[idx] = res.data.data
    toast.success('Đã đổi trạng thái', `${post.title}: ${statusMap[status].label}`)
  } catch (e: any) {
    toast.error('Đổi trạng thái thất bại', e?.response?.data?.message || e?.message)
  }
}

function askDelete(post: NewsPost) {
  confirmCtx.value = {
    title: `Xoá bài viết "${post.title}"?`,
    message: 'Bài viết sẽ bị xoá khỏi danh sách tin tức. Hành động này không thể hoàn tác.',
    action: async () => {
      await shopNewsApi.remove(post.id)
      posts.value = posts.value.filter((p) => p.id !== post.id)
      toast.success('Đã xoá bài viết', post.title)
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
    toast.error('Xoá bài viết thất bại', e?.response?.data?.message || e?.message)
  }
}

function onRowAction(post: NewsPost, key: string) {
  if (key === 'preview') openPreview(post)
  else if (key === 'edit') openEdit(post)
  else if (key === 'publish') setStatus(post, 'published')
  else if (key === 'draft') setStatus(post, 'draft')
  else if (key === 'archive') setStatus(post, 'archived')
  else if (key === 'delete') askDelete(post)
}

function rowItems(post: NewsPost) {
  const items: { key: string; label: string; icon: string; tone?: 'danger' }[] = [
    { key: 'preview', label: 'Xem nhanh', icon: 'ri-eye-line' },
    { key: 'edit', label: 'Chỉnh sửa', icon: 'ri-edit-line' },
  ]
  if (post.status !== 'published') items.push({ key: 'publish', label: 'Đăng bài', icon: 'ri-send-plane-line' })
  if (post.status !== 'draft') items.push({ key: 'draft', label: 'Chuyển về nháp', icon: 'ri-draft-line' })
  if (post.status !== 'archived') items.push({ key: 'archive', label: 'Lưu trữ', icon: 'ri-archive-line' })
  items.push({ key: 'delete', label: 'Xoá bài viết', icon: 'ri-delete-bin-line', tone: 'danger' as const })
  return items
}

function publicUrl(post: NewsPost) {
  return `/news/${post.slug}`
}
</script>

<template>
  <div class="ym-page">
    <header class="ym-page__header">
      <div>
        <h1>Tin tức</h1>
        <p>Quản lý bài viết hiển thị ở trang Tin tức và chi tiết bài viết.</p>
      </div>
      <div class="ym-page__actions">
        <ShopImportExport entity="news" id-field="slug" label="tin tức" @imported="loadNews" />
        <button type="button" class="ym-btn" @click="loadNews"><i class="ri-refresh-line"></i> Tải lại</button>
        <button type="button" class="ym-btn ym-btn--primary" @click="openCreate"><i class="ri-add-line"></i> Thêm bài viết</button>
      </div>
    </header>

    <section class="ym-mini-stats">
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Tổng bài</p><p class="ym-mini-stat__value">{{ stats.total }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Đã đăng</p><p class="ym-mini-stat__value" style="color: #166534">{{ stats.published }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Nháp</p><p class="ym-mini-stat__value" style="color: #6b7280">{{ stats.draft }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Nổi bật</p><p class="ym-mini-stat__value" style="color: #92400e">{{ stats.featured }}</p></article>
    </section>

    <div class="ym-card">
      <div class="ym-toolbar">
        <div class="ym-search">
          <i class="ri-search-line"></i>
          <input v-model="search" type="text" placeholder="Tìm theo tiêu đề, mô tả, danh mục..." />
        </div>
        <div class="ym-toolbar__actions">
          <select v-model="filterCategory" class="ym-select">
            <option value="all">Tất cả danh mục</option>
            <option v-for="cat in categoryOptions" :key="cat" :value="cat">{{ cat }}</option>
          </select>
          <select v-model="filterStatus" class="ym-select">
            <option value="all">Tất cả trạng thái</option>
            <option value="published">Đã đăng</option>
            <option value="draft">Nháp</option>
            <option value="archived">Lưu trữ</option>
          </select>
        </div>
      </div>

      <div class="ym-table-wrap">
        <table class="ym-table">
          <thead>
            <tr>
              <th>Bài viết</th>
              <th>Danh mục</th>
              <th>Ngày đăng</th>
              <th class="is-center">Bình luận</th>
              <th>Trạng thái</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading"><td colspan="6" class="ym-empty">Đang tải bài viết...</td></tr>
            <tr v-for="post in paginated" :key="post.id">
              <td>
                <div class="ym-news-cell">
                  <img v-if="post.image" :src="post.image" :alt="post.title" />
                  <span v-else class="ym-news-cell__empty"><i class="ri-image-line"></i></span>
                  <div class="ym-cell-user">
                    <a :href="publicUrl(post)" target="_blank" class="ym-link">{{ post.title }}</a>
                    <small>{{ post.excerpt || post.slug }}</small>
                  </div>
                </div>
              </td>
              <td>{{ post.category || '—' }}</td>
              <td class="is-muted">{{ post.date }}</td>
              <td class="is-center">{{ post.comments }}</td>
              <td>
                <span :class="['ym-tag', `ym-tag--${statusMap[post.status]?.tone || 'neutral'}`]">{{ statusMap[post.status]?.label || post.status }}</span>
                <span v-if="post.isFeatured" class="ym-tag ym-tag--warning" style="margin-left: 6px">Nổi bật</span>
              </td>
              <td class="is-right"><RowMenu :items="rowItems(post)" @select="onRowAction(post, $event)" /></td>
            </tr>
            <tr v-if="!loading && !filtered.length"><td colspan="6" class="ym-empty">Chưa có bài viết nào.</td></tr>
          </tbody>
        </table>
      </div>

      <Pagination
        v-model="page"
        :total-items="filtered.length"
        :per-page="perPage"
        item-label="bài viết"
        @update:per-page="(n) => perPage = n"
      />
    </div>

    <AdminModal v-model:open="formOpen" :title="editingId ? 'Chỉnh sửa bài viết' : 'Thêm bài viết'" size="xl" :confirm-text="editingId ? 'Lưu bài viết' : 'Tạo bài viết'" :loading="saving" @confirm="submitForm">
      <div class="ym-form-row">
        <div class="ym-form-group">
          <label>Tiêu đề *</label>
          <input v-model="form.title" type="text" placeholder="Nhập tiêu đề bài viết" @blur="!form.slug && (form.slug = slugify(form.title))" />
        </div>
        <div class="ym-form-group">
          <label>Slug</label>
          <input v-model="form.slug" type="text" placeholder="tu-dong-tu-tieu-de" />
        </div>
      </div>
      <div class="ym-form-row">
        <div class="ym-form-group">
          <label>Danh mục</label>
          <input v-model="form.category" list="news-categories" type="text" />
          <datalist id="news-categories"><option v-for="cat in categoryOptions" :key="cat" :value="cat" /></datalist>
        </div>
        <div class="ym-form-group">
          <label>Trạng thái</label>
          <select v-model="form.status">
            <option value="draft">Nháp</option>
            <option value="published">Đã đăng</option>
            <option value="archived">Lưu trữ</option>
          </select>
        </div>
      </div>
      <div class="ym-form-row">
        <div class="ym-form-group"><label>Tác giả</label><input v-model="form.author" type="text" /></div>
        <div class="ym-form-group"><label>Ngày đăng</label><input v-model="form.publishedAt" type="date" /></div>
        <div class="ym-form-group"><label>Thứ tự</label><input v-model.number="form.sortOrder" type="number" /></div>
      </div>
      <div class="ym-form-group"><label>Ảnh đại diện URL</label><input v-model="form.image" type="url" placeholder="https://..." /></div>
      <div class="ym-form-group"><label>Mô tả ngắn</label><textarea v-model="form.excerpt" rows="3" maxlength="1000"></textarea></div>
      <div class="ym-form-group">
        <label>Nội dung HTML</label>
        <textarea v-model="form.content" class="ym-content-editor" rows="12" placeholder="<p>Nội dung bài viết...</p>"></textarea>
        <p class="ym-form-help">Có thể nhập HTML cơ bản như p, strong, ul, li, img.</p>
      </div>
      <div class="ym-form-row">
        <label class="ym-checkbox"><input v-model="form.isFeatured" type="checkbox" /> Bài viết nổi bật</label>
        <div class="ym-form-group"><label>Số bình luận</label><input v-model.number="form.comments" type="number" min="0" /></div>
      </div>
    </AdminModal>

    <AdminModal v-if="preview" v-model:open="previewOpen" :title="preview.title" subtitle="Xem nhanh bài viết" size="lg" hide-footer>
      <article class="ym-news-preview">
        <img v-if="preview.image" :src="preview.image" :alt="preview.title" />
        <p><span :class="['ym-tag', `ym-tag--${statusMap[preview.status]?.tone || 'neutral'}`]">{{ statusMap[preview.status]?.label || preview.status }}</span> <span class="is-muted">{{ preview.category }} · {{ preview.date }}</span></p>
        <p class="ym-news-preview__excerpt">{{ preview.excerpt }}</p>
        <div class="ym-news-preview__content" v-html="preview.content"></div>
      </article>
    </AdminModal>

    <AdminModal v-if="confirmCtx" v-model:open="confirmOpen" :title="confirmCtx.title" :subtitle="confirmCtx.message" size="sm" confirm-text="Xoá" confirm-tone="danger" @confirm="runConfirm">
      <p class="is-muted">Kiểm tra lại trước khi xoá khỏi hệ thống.</p>
    </AdminModal>
  </div>
</template>

<style scoped src="./_admin-shared.css"></style>
<style scoped>
.ym-news-cell {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 360px;
}
.ym-news-cell img,
.ym-news-cell__empty {
  width: 92px;
  height: 58px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  object-fit: cover;
  flex-shrink: 0;
}
.ym-news-cell__empty {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 22px;
}
.ym-content-editor {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}
.ym-news-preview img {
  width: 100%;
  max-height: 300px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 14px;
}
.ym-news-preview__excerpt {
  color: #4b5563;
  font-weight: 500;
}
.ym-news-preview__content {
  color: #1f2937;
  line-height: 1.7;
}
</style>
