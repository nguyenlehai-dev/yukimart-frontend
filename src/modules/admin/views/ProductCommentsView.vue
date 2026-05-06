<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import AdminModal from '../components/AdminModal.vue'
import RowMenu from '../components/RowMenu.vue'
import { useToast } from '../composables/useToast'
import { useShopEntity } from '../composables/useShopEntity'

type CommentType = 'review' | 'question'
type CommentStatus = 'pending' | 'approved' | 'hidden' | 'spam'

interface ProductComment {
  id: number
  productId: number
  productName: string
  productSku: string
  type: CommentType
  author: string
  email: string
  rating: number
  content: string
  status: CommentStatus
  verified: boolean
  likes: number
  reply: string
  date: string
  createdAt?: string
}

const toast = useToast()
const shop = useShopEntity('product-comments')

const search = ref('')
const statusFilter = ref<'all' | CommentStatus>('all')
const typeFilter = ref<'all' | CommentType>('all')
const formOpen = ref(false)
const replyOpen = ref(false)
const editingId = ref<number | null>(null)
const replyTarget = ref<ProductComment | null>(null)
const replyText = ref('')

const form = ref<Omit<ProductComment, 'id'>>({
  productId: 0,
  productName: '',
  productSku: '',
  type: 'review',
  author: '',
  email: '',
  rating: 5,
  content: '',
  status: 'pending',
  verified: false,
  likes: 0,
  reply: '',
  date: new Date().toLocaleDateString('vi-VN'),
})

onMounted(() => {
  shop.fetch({ all: 1 }).catch((e: any) => toast.error('Tải bình luận thất bại', e?.message))
})

function asNumber(value: any, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function normalize(raw: Record<string, any>): ProductComment {
  return {
    id: Number(raw.id),
    productId: asNumber(raw.product_id ?? raw.productId),
    productName: String(raw.product_name ?? raw.productName ?? ''),
    productSku: String(raw.product_sku ?? raw.productSku ?? ''),
    type: (raw.type === 'question' ? 'question' : 'review') as CommentType,
    author: String(raw.author ?? 'Khách hàng'),
    email: String(raw.email ?? ''),
    rating: asNumber(raw.rating, 0),
    content: String(raw.content ?? ''),
    status: (raw.status || 'pending') as CommentStatus,
    verified: Boolean(raw.verified),
    likes: asNumber(raw.likes, 0),
    reply: String(raw.reply ?? ''),
    date: String(raw.date ?? raw.createdAt ?? ''),
    createdAt: raw.createdAt,
  }
}

function toPayload(c: Omit<ProductComment, 'id'> | ProductComment) {
  return {
    product_id: c.productId,
    product_name: c.productName,
    product_sku: c.productSku,
    type: c.type,
    author: c.author,
    email: c.email,
    rating: c.type === 'review' ? c.rating : null,
    content: c.content,
    status: c.status,
    verified: c.verified,
    likes: c.likes,
    reply: c.reply,
    date: c.date || new Date().toLocaleDateString('vi-VN'),
  }
}

const comments = computed(() => shop.items.value.map(normalize))
const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return comments.value.filter((c) => {
    if (statusFilter.value !== 'all' && c.status !== statusFilter.value) return false
    if (typeFilter.value !== 'all' && c.type !== typeFilter.value) return false
    if (!q) return true
    return [c.author, c.email, c.productName, c.productSku, c.content, c.reply]
      .join(' ')
      .toLowerCase()
      .includes(q)
  })
})

const stats = computed(() => ({
  total: comments.value.length,
  pending: comments.value.filter((c) => c.status === 'pending').length,
  approved: comments.value.filter((c) => c.status === 'approved').length,
  questions: comments.value.filter((c) => c.type === 'question').length,
}))

const statusMap: Record<CommentStatus, { label: string; tone: string }> = {
  pending: { label: 'Chờ duyệt', tone: 'warning' },
  approved: { label: 'Đã duyệt', tone: 'success' },
  hidden: { label: 'Đã ẩn', tone: 'neutral' },
  spam: { label: 'Spam', tone: 'danger' },
}

function openCreate() {
  editingId.value = null
  form.value = {
    productId: 0,
    productName: '',
    productSku: '',
    type: 'review',
    author: '',
    email: '',
    rating: 5,
    content: '',
    status: 'approved',
    verified: false,
    likes: 0,
    reply: '',
    date: new Date().toLocaleDateString('vi-VN'),
  }
  formOpen.value = true
}

function openEdit(c: ProductComment) {
  editingId.value = c.id
  form.value = { ...c }
  formOpen.value = true
}

async function submitForm() {
  if (!form.value.productId || !form.value.author.trim() || !form.value.content.trim()) {
    toast.error('Thiếu thông tin', 'Cần sản phẩm, khách hàng và nội dung.')
    return
  }
  if (form.value.type === 'review' && (form.value.rating < 1 || form.value.rating > 5)) {
    toast.error('Số sao không hợp lệ', 'Đánh giá cần từ 1 đến 5 sao.')
    return
  }

  try {
    if (editingId.value) {
      await shop.update(editingId.value, toPayload(form.value))
      toast.success('Đã cập nhật bình luận')
    } else {
      await shop.create(toPayload(form.value))
      toast.success('Đã tạo bình luận')
    }
    formOpen.value = false
  } catch (e: any) {
    toast.error('Lưu thất bại', e?.response?.data?.message || e?.message)
  }
}

async function setStatus(c: ProductComment, status: CommentStatus) {
  try {
    await shop.update(c.id, toPayload({ ...c, status }))
    toast.success(status === 'approved' ? 'Đã duyệt bình luận' : 'Đã cập nhật trạng thái')
  } catch (e: any) {
    toast.error('Cập nhật thất bại', e?.response?.data?.message || e?.message)
  }
}

function openReply(c: ProductComment) {
  replyTarget.value = c
  replyText.value = c.reply
  replyOpen.value = true
}

async function submitReply() {
  if (!replyTarget.value || !replyText.value.trim()) {
    toast.error('Thiếu nội dung trả lời')
    return
  }
  try {
    await shop.update(replyTarget.value.id, {
      ...toPayload({ ...replyTarget.value, reply: replyText.value.trim(), status: 'approved' }),
      reply_date: new Date().toLocaleDateString('vi-VN'),
    })
    toast.success('Đã trả lời bình luận')
    replyOpen.value = false
  } catch (e: any) {
    toast.error('Trả lời thất bại', e?.response?.data?.message || e?.message)
  }
}

async function remove(c: ProductComment) {
  if (!confirm(`Xoá bình luận của "${c.author}"?`)) return
  try {
    await shop.remove(c.id)
    toast.success('Đã xoá bình luận')
  } catch (e: any) {
    toast.error('Xoá thất bại', e?.response?.data?.message || e?.message)
  }
}

function rowItems(c: ProductComment) {
  return [
    { key: 'approve', label: 'Duyệt hiển thị', icon: 'ri-check-line' },
    { key: 'reply', label: c.reply ? 'Sửa trả lời' : 'Trả lời', icon: 'ri-reply-line' },
    { key: 'hide', label: 'Ẩn bình luận', icon: 'ri-eye-off-line' },
    { key: 'spam', label: 'Đánh dấu spam', icon: 'ri-spam-line', tone: 'danger' as const },
    { key: 'edit', label: 'Chỉnh sửa', icon: 'ri-edit-line' },
    { key: 'delete', label: 'Xoá', icon: 'ri-delete-bin-line', tone: 'danger' as const },
  ]
}

function onAction(c: ProductComment, key: string) {
  if (key === 'approve') setStatus(c, 'approved')
  else if (key === 'reply') openReply(c)
  else if (key === 'hide') setStatus(c, 'hidden')
  else if (key === 'spam') setStatus(c, 'spam')
  else if (key === 'edit') openEdit(c)
  else if (key === 'delete') remove(c)
}
</script>

<template>
  <div class="ym-page">
    <header class="ym-page__header">
      <div>
        <h1>Bình luận sản phẩm</h1>
        <p>Quản lý đánh giá và hỏi đáp của khách hàng trên trang chi tiết sản phẩm</p>
      </div>
      <div class="ym-page__actions">
        <button type="button" class="ym-btn" @click="shop.fetch({ all: 1 })">
          <i class="ri-refresh-line"></i> Tải lại
        </button>
        <button type="button" class="ym-btn ym-btn--primary" @click="openCreate">
          <i class="ri-add-line"></i> Thêm bình luận
        </button>
      </div>
    </header>

    <section class="ym-mini-stats">
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Tổng bình luận</p><p class="ym-mini-stat__value">{{ stats.total }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Chờ duyệt</p><p class="ym-mini-stat__value" style="color: #92400e">{{ stats.pending }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Đã duyệt</p><p class="ym-mini-stat__value" style="color: #166534">{{ stats.approved }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Hỏi đáp</p><p class="ym-mini-stat__value">{{ stats.questions }}</p></article>
    </section>

    <div class="ym-card">
      <div class="ym-toolbar">
        <div class="ym-search">
          <i class="ri-search-line"></i>
          <input v-model="search" type="text" placeholder="Tìm khách, sản phẩm, nội dung..." />
        </div>
        <div class="ym-toolbar__actions">
          <select v-model="typeFilter" class="ym-select">
            <option value="all">Tất cả loại</option>
            <option value="review">Đánh giá</option>
            <option value="question">Hỏi đáp</option>
          </select>
          <select v-model="statusFilter" class="ym-select">
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Chờ duyệt</option>
            <option value="approved">Đã duyệt</option>
            <option value="hidden">Đã ẩn</option>
            <option value="spam">Spam</option>
          </select>
        </div>
      </div>

      <div class="ym-table-wrap">
        <table class="ym-table">
          <thead>
            <tr>
              <th>Khách hàng</th>
              <th>Sản phẩm</th>
              <th>Loại</th>
              <th>Nội dung</th>
              <th>Phản hồi</th>
              <th>Trạng thái</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="shop.loading.value">
              <td colspan="7" class="ym-empty">Đang tải bình luận...</td>
            </tr>
            <tr v-for="c in filtered" :key="c.id">
              <td>
                <div class="ym-comment-user">
                  <strong>{{ c.author }}</strong>
                  <small>{{ c.email || c.date || '—' }}</small>
                </div>
              </td>
              <td>
                <RouterLink :to="`/products/${c.productId}`" class="ym-link">
                  {{ c.productName || `SP #${c.productId}` }}
                </RouterLink>
                <small class="is-muted">{{ c.productSku }}</small>
              </td>
              <td>
                <span class="ym-tag" :class="c.type === 'review' ? 'ym-tag--warning' : 'ym-tag--info'">
                  {{ c.type === 'review' ? `${c.rating || 0} sao` : 'Hỏi đáp' }}
                </span>
                <span v-if="c.verified" class="ym-tag ym-tag--success" style="margin-left: 4px">Đã mua</span>
              </td>
              <td class="ym-comment-content">{{ c.content }}</td>
              <td class="ym-comment-content">{{ c.reply || '—' }}</td>
              <td><span :class="['ym-tag', `ym-tag--${statusMap[c.status]?.tone || 'neutral'}`]">{{ statusMap[c.status]?.label || c.status }}</span></td>
              <td class="is-right"><RowMenu :items="rowItems(c)" @select="onAction(c, $event)" /></td>
            </tr>
            <tr v-if="!shop.loading.value && !filtered.length">
              <td colspan="7" class="ym-empty">Chưa có bình luận phù hợp.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <AdminModal v-model:open="formOpen" :title="editingId ? 'Sửa bình luận' : 'Thêm bình luận'" size="lg" confirm-text="Lưu" @confirm="submitForm">
      <div class="ym-form-row">
        <div class="ym-form-group"><label>ID sản phẩm *</label><input v-model.number="form.productId" type="number" min="1" /></div>
        <div class="ym-form-group"><label>SKU</label><input v-model="form.productSku" type="text" /></div>
      </div>
      <div class="ym-form-group"><label>Tên sản phẩm</label><input v-model="form.productName" type="text" /></div>
      <div class="ym-form-row">
        <div class="ym-form-group"><label>Khách hàng *</label><input v-model="form.author" type="text" /></div>
        <div class="ym-form-group"><label>Email</label><input v-model="form.email" type="email" /></div>
      </div>
      <div class="ym-form-row">
        <div class="ym-form-group">
          <label>Loại</label>
          <select v-model="form.type">
            <option value="review">Đánh giá</option>
            <option value="question">Hỏi đáp</option>
          </select>
        </div>
        <div v-if="form.type === 'review'" class="ym-form-group"><label>Số sao</label><input v-model.number="form.rating" type="number" min="1" max="5" /></div>
        <div class="ym-form-group">
          <label>Trạng thái</label>
          <select v-model="form.status">
            <option value="pending">Chờ duyệt</option>
            <option value="approved">Đã duyệt</option>
            <option value="hidden">Đã ẩn</option>
            <option value="spam">Spam</option>
          </select>
        </div>
      </div>
      <div class="ym-form-group"><label>Nội dung *</label><textarea v-model="form.content" rows="4"></textarea></div>
      <div class="ym-form-group"><label>Trả lời của shop</label><textarea v-model="form.reply" rows="3"></textarea></div>
      <label class="ym-checkbox"><input v-model="form.verified" type="checkbox" /> Đã mua hàng</label>
    </AdminModal>

    <!-- Modal trả lời: luôn render để Teleport/Transition mount sẵn — tránh race
         condition khi v-if mount cùng lúc với v-model:open=true. Slot phụ thuộc
         replyTarget được bảo vệ riêng bằng v-if. -->
    <AdminModal
      v-model:open="replyOpen"
      :title="replyTarget ? `Trả lời ${replyTarget.author}` : 'Trả lời'"
      size="md"
      confirm-text="Gửi trả lời"
      @confirm="submitReply"
    >
      <template v-if="replyTarget">
        <p class="ym-reply-source">{{ replyTarget.content }}</p>
        <div class="ym-form-group">
          <label>Nội dung trả lời</label>
          <textarea v-model="replyText" rows="5"></textarea>
        </div>
      </template>
    </AdminModal>
  </div>
</template>

<style scoped src="./_admin-shared.css"></style>
<style scoped>
.ym-comment-user { display: flex; flex-direction: column; gap: 2px; }
.ym-comment-user small,
.is-muted { display: block; color: #6b7280; font-size: 12px; margin-top: 2px; }
.ym-comment-content {
  max-width: 320px;
  white-space: normal;
  color: #374151;
  line-height: 1.45;
}
.ym-checkbox { display: flex; align-items: center; gap: 8px; font-size: 14px; color: #374151; }
.ym-reply-source {
  margin: 0 0 12px;
  padding: 12px;
  background: #f9fafb;
  border: 1px solid #eef2f7;
  border-radius: 8px;
  color: #374151;
}
</style>
