<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import type { ProductDetail, ProductQuestion, ProductReview } from '../models/Product'
import { formatPrice } from '../configs'
import { productCommentsApi, type ProductCommentPayload } from '../services/productCommentsApi'
import { useCartStore } from '../../../../stores/cart'

const props = defineProps<{
  product: ProductDetail
}>()

const cartStore = useCartStore()
const remoteReviews = ref<ProductReview[]>([])
const remoteQuestions = ref<ProductQuestion[]>([])
const commentsLoading = ref(false)
const commentNotice = ref('')
const submittingComment = ref(false)
const reviewFormOpen = ref(false)
const reviewForm = ref({ author: '', email: '', rating: 5, content: '' })
const questionForm = ref({ author: '', email: '', content: '' })

// State cho form trả lời inline trong tab Hỏi đáp. Mỗi lần chỉ 1 form mở.
const replyOpenId = ref<number | null>(null)
const replyForm = ref({ author: '', content: '' })

function openReply(qId: number) {
  replyOpenId.value = replyOpenId.value === qId ? null : qId
  replyForm.value = { author: '', content: '' }
}

async function submitReply(qId: number) {
  if (!replyForm.value.content.trim()) {
    commentNotice.value = 'Vui lòng nhập nội dung trả lời.'
    return
  }
  submittingComment.value = true
  try {
    await productCommentsApi.reply(qId, {
      author: replyForm.value.author.trim() || 'Khách hàng',
      content: replyForm.value.content.trim(),
    })
    replyForm.value = { author: '', content: '' }
    replyOpenId.value = null
    commentNotice.value = 'Cảm ơn bạn! Trả lời đã được đăng.'
    await loadProductComments()
  } catch {
    commentNotice.value = 'Không gửi được trả lời. Vui lòng thử lại.'
  } finally {
    submittingComment.value = false
  }
}

const tabs = [
  { key: 'description', label: 'Mô tả' },
  { key: 'specs', label: 'Thông số' },
  { key: 'ingredients', label: 'Thành phần' },
  { key: 'usage', label: 'HDSD' },
  { key: 'reviews', label: 'Đánh giá' },
  { key: 'qa', label: 'Hỏi đáp' },
]

// ── Active section tracking via IntersectionObserver ──
const activeSection = ref('description')
const isNavSticky = ref(false)
const tabNavEl = ref<HTMLElement | null>(null)
let stickyObserver: IntersectionObserver | null = null
let sectionObserver: IntersectionObserver | null = null

function scrollToSection(key: string) {
  const el = document.getElementById(`section-${key}`)
  if (el) {
    const offset = 100 // sticky nav height
    const y = el.getBoundingClientRect().top + window.scrollY - offset
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' })
    el.setAttribute('tabindex', '-1')
    el.focus({ preventScroll: true })
  }
}

onMounted(() => {
  // Observe tab nav for sticky state
  if (tabNavEl.value) {
    stickyObserver = new IntersectionObserver(
      ([entry]) => {
        isNavSticky.value = !entry.isIntersecting
      },
      { threshold: 0, rootMargin: '-1px 0px 0px 0px' }
    )
    stickyObserver.observe(tabNavEl.value)
  }

  // Observe sections for active tab highlight
  const sectionEls = tabs.map(t => document.getElementById(`section-${t.key}`)).filter(Boolean) as HTMLElement[]
  sectionObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const id = entry.target.id.replace('section-', '')
          activeSection.value = id
        }
      }
    },
    { threshold: 0.1, rootMargin: '-120px 0px -60% 0px' }
  )
  sectionEls.forEach(el => sectionObserver!.observe(el))
})

onUnmounted(() => {
  stickyObserver?.disconnect()
  sectionObserver?.disconnect()
})

// ── Star rendering ──
function renderStars(rating: number) {
  const full = Math.floor(rating)
  const half = rating % 1 >= 0.5 ? 1 : 0
  const empty = 5 - full - half
  return { full, half, empty }
}

const starLabels = ['1', '2', '3', '4', '5']

// ── Review pagination ──
// Dùng duy nhất dữ liệu từ API (admin là source of truth). Mock product.reviews/questions
// chỉ dùng làm seed UI demo trên product id=1 — không trộn vào danh sách hiển thị nữa.
const reviewPage = ref(1)
const reviewsPerPage = 4
const reviewList = computed(() => remoteReviews.value)
const questionList = computed(() => remoteQuestions.value)
const ratingCountDisplay = computed(() => reviewList.value.length)
const questionCountDisplay = computed(() => questionList.value.length)
const ratingDisplay = computed(() => {
  const items = reviewList.value
  if (!items.length) return 0
  const sum = items.reduce((acc, r) => acc + (Number(r.rating) || 0), 0)
  return +(sum / items.length).toFixed(1)
})
// Phân phối số sao [1★, 2★, 3★, 4★, 5★] tính theo % trên tổng review.
const ratingDistribution = computed(() => {
  const items = reviewList.value
  const buckets = [0, 0, 0, 0, 0]
  if (!items.length) return buckets
  for (const r of items) {
    const idx = Math.max(1, Math.min(5, Math.round(Number(r.rating) || 0))) - 1
    buckets[idx]++
  }
  return buckets.map((c) => Math.round((c / items.length) * 100))
})
const totalReviewPages = computed(() => Math.max(1, Math.ceil(reviewList.value.length / reviewsPerPage)))
const paginatedReviews = computed(() => {
  const start = (reviewPage.value - 1) * reviewsPerPage
  return reviewList.value.slice(start, start + reviewsPerPage)
})

function mapReplyEntries(raw: any[]): ProductReview['replies'] {
  return (Array.isArray(raw) ? raw : []).map((reply: any) => ({
    id: Number(reply.id),
    author: String(reply.author || 'YukiMart'),
    isStore: Boolean(reply.isStore ?? reply.is_store),
    date: String(reply.date || ''),
    content: String(reply.content || ''),
    likes: Number(reply.likes || 0),
  }))
}

function mapReview(raw: any): ProductReview {
  return {
    id: Number(raw.id),
    author: String(raw.author || 'Khách hàng'),
    rating: Number(raw.rating || 5),
    date: String(raw.date || ''),
    content: String(raw.content || ''),
    verified: Boolean(raw.verified),
    reply: String(raw.reply || ''),
    replies: mapReplyEntries(raw.replies),
  }
}

function mapQuestion(raw: any): ProductQuestion {
  return {
    id: Number(raw.id),
    author: String(raw.author || 'Khách hàng'),
    date: String(raw.date || ''),
    content: String(raw.content || ''),
    likes: Number(raw.likes || 0),
    replies: mapReplyEntries(raw.replies) ?? [],
  }
}

async function loadProductComments() {
  commentsLoading.value = true
  try {
    const res = await productCommentsApi.list(props.product.id)
    const rows = res.data.data || []
    remoteReviews.value = rows.filter((row: any) => row.type === 'review').map(mapReview)
    remoteQuestions.value = rows.filter((row: any) => row.type === 'question').map(mapQuestion)
  } catch {
    remoteReviews.value = []
    remoteQuestions.value = []
  } finally {
    commentsLoading.value = false
  }
}

watch(() => props.product.id, () => {
  reviewPage.value = 1
  commentNotice.value = ''
  loadProductComments()
}, { immediate: true })

function commentPayload(type: 'review' | 'question', data: { author: string; email?: string; rating?: number; content: string }): ProductCommentPayload {
  return {
    product_id: props.product.id,
    product_name: props.product.name,
    product_sku: props.product.sku,
    type,
    author: data.author.trim() || 'Khách hàng',
    email: data.email?.trim() || undefined,
    rating: type === 'review' ? data.rating : undefined,
    content: data.content.trim(),
  }
}

async function submitReview() {
  if (!reviewForm.value.content.trim()) {
    commentNotice.value = 'Vui lòng nhập nội dung đánh giá.'
    return
  }
  submittingComment.value = true
  try {
    await productCommentsApi.create(commentPayload('review', reviewForm.value))
    reviewForm.value = { author: '', email: '', rating: 5, content: '' }
    reviewFormOpen.value = false
    commentNotice.value = 'Cảm ơn bạn! Đánh giá đã được đăng.'
    // Auto-approve ở BE: review hiển thị ngay sau khi reload list.
    await loadProductComments()
  } catch {
    commentNotice.value = 'Không gửi được đánh giá. Vui lòng thử lại.'
  } finally {
    submittingComment.value = false
  }
}

async function submitQuestion() {
  if (!questionForm.value.content.trim()) {
    commentNotice.value = 'Vui lòng nhập nội dung câu hỏi.'
    return
  }
  submittingComment.value = true
  try {
    await productCommentsApi.create(commentPayload('question', questionForm.value))
    questionForm.value = { author: '', email: '', content: '' }
    commentNotice.value = 'Cảm ơn bạn! Câu hỏi đã được đăng.'
    await loadProductComments()
  } catch {
    commentNotice.value = 'Không gửi được câu hỏi. Vui lòng thử lại.'
  } finally {
    submittingComment.value = false
  }
}

function getInitial(name: string) {
  return name.charAt(0).toUpperCase()
}

const avatarColors = ['#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#009688', '#ff5722', '#795548']
function getAvatarColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return avatarColors[Math.abs(hash) % avatarColors.length]
}

function addToCart() {
  cartStore.addItem({
    id: props.product.id,
    name: props.product.name,
    image: props.product.images[0],
    brand: props.product.brand,
    price: props.product.salePrice,
    originalPrice: props.product.originalPrice,
  }, 1)
}
</script>

<template>
  <div class="ym-pdp-tabs">
    <!-- Sentinel for sticky detection -->
    <div ref="tabNavEl" class="ym-pdp-tabs__sentinel"></div>

    <!-- Tab navigation (inline, scroll-spy style) -->
    <nav class="ym-pdp-tabs__nav" aria-label="Mục lục sản phẩm">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        :aria-current="tab.key === activeSection ? 'true' : undefined"
        :class="['ym-pdp-tabs__nav-btn', { 'ym-pdp-tabs__nav-btn--active': tab.key === activeSection }]"
        @click="scrollToSection(tab.key)"
      >
        {{ tab.label }}
        <span v-if="tab.key === 'reviews'" class="ym-pdp-tabs__nav-count">({{ ratingCountDisplay }})</span>
        <span v-if="tab.key === 'qa'" class="ym-pdp-tabs__nav-count">({{ questionCountDisplay }})</span>
      </button>
    </nav>

    <!-- Sticky bar (appears on scroll) -->
    <Transition name="slide-down">
      <div v-if="isNavSticky" class="ym-pdp-stickybar">
        <div class="container ym-pdp-stickybar__inner">
          <div class="ym-pdp-stickybar__product">
            <img :src="product.images[0]" :alt="product.name" class="ym-pdp-stickybar__img" />
            <div class="ym-pdp-stickybar__info">
              <span class="ym-pdp-stickybar__name">{{ product.name }}</span>
              <span class="ym-pdp-stickybar__price">{{ formatPrice(product.salePrice) }}</span>
              <span class="ym-pdp-stickybar__old-price">{{ formatPrice(product.originalPrice) }}</span>
              <span class="ym-pdp-stickybar__brand">| {{ product.brand }}</span>
            </div>
          </div>
          <div class="ym-pdp-stickybar__nav">
            <button
              v-for="tab in tabs"
              :key="tab.key"
              type="button"
              :aria-current="tab.key === activeSection ? 'true' : undefined"
              :class="['ym-pdp-stickybar__nav-btn', { 'ym-pdp-stickybar__nav-btn--active': tab.key === activeSection }]"
              @click="scrollToSection(tab.key)"
            >
              {{ tab.label }}
            </button>
          </div>
          <button type="button" class="ym-pdp-stickybar__cart-btn" :aria-label="`Thêm ${product.name} vào giỏ hàng`" @click="addToCart">
            <i class="ri-shopping-cart-fill" aria-hidden="true"></i> THÊM VÀO GIỎ HÀNG
          </button>
        </div>
      </div>
    </Transition>

    <!-- All sections shown at once -->
    <div class="ym-pdp-tabs__content">
      <!-- Mô tả -->
      <section id="section-description" class="ym-pdp-tabs__section" aria-labelledby="ym-pdp-section-description-title">
        <h2 id="ym-pdp-section-description-title" class="visually-hidden">Mô tả sản phẩm</h2>
        <div class="ym-pdp-tabs__description" v-html="product.contentHtml"></div>
        <div class="ym-pdp-tabs__expand">
          <button type="button" class="ym-pdp-tabs__expand-btn">Xem thêm <i class="ri-arrow-down-s-line" aria-hidden="true"></i></button>
        </div>
      </section>

      <!-- Thông số -->
      <section id="section-specs" class="ym-pdp-tabs__section">
        <h3 class="ym-pdp-tabs__section-title">Thông số sản phẩm</h3>
        <table class="ym-pdp-tabs__specs-table">
          <tbody>
            <tr v-for="spec in product.specs" :key="spec.label">
              <td class="ym-pdp-tabs__specs-label">{{ spec.label }}</td>
              <td class="ym-pdp-tabs__specs-value">{{ spec.value || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- Thành phần -->
      <section id="section-ingredients" class="ym-pdp-tabs__section">
        <h3 class="ym-pdp-tabs__section-title">Thành phần sản phẩm</h3>
        <div
          v-for="section in product.ingredientsSections"
          :key="section.title"
          class="ym-pdp-tabs__ingredient-section"
        >
          <h4 class="ym-pdp-tabs__ingredient-title">{{ section.title }}</h4>
          <p><strong>Thành phần chính:</strong></p>
          <ul class="ym-pdp-tabs__ingredient-list">
            <li v-for="ing in section.mainIngredients" :key="ing.name">
              <strong>{{ ing.name }}:</strong> {{ ing.benefit }}
            </li>
          </ul>
          <p><strong>Thành phần đầy đủ:</strong></p>
          <p class="ym-pdp-tabs__ingredient-full">{{ section.fullIngredients }}</p>
        </div>
      </section>

      <!-- HDSD -->
      <section id="section-usage" class="ym-pdp-tabs__section">
        <h3 class="ym-pdp-tabs__section-title">Hướng dẫn sử dụng</h3>
        <ul class="ym-pdp-tabs__usage-list">
          <li v-for="(step, i) in product.usage" :key="i">{{ step }}</li>
        </ul>
      </section>

      <!-- Đánh giá -->
      <section id="section-reviews" class="ym-pdp-tabs__section">
        <h3 class="ym-pdp-tabs__section-title">Đánh giá ({{ ratingCountDisplay }})</h3>

        <!-- Star distribution -->
        <div class="ym-pdp-tabs__review-summary">
          <div class="ym-pdp-tabs__review-avg">
            <span class="ym-pdp-tabs__review-avg-score">{{ ratingDisplay }}</span>
            <div class="ym-pdp-tabs__review-avg-stars">
              <i v-for="n in renderStars(ratingDisplay).full" :key="`af${n}`" class="ri-star-fill"></i>
              <i v-if="renderStars(ratingDisplay).half" class="ri-star-half-fill"></i>
              <i v-for="n in renderStars(ratingDisplay).empty" :key="`ae${n}`" class="ri-star-line"></i>
            </div>
            <span class="ym-pdp-tabs__review-avg-count">{{ ratingCountDisplay }} đánh giá</span>
          </div>

          <div class="ym-pdp-tabs__review-bars">
            <div v-for="(pct, idx) in ratingDistribution" :key="idx" class="ym-pdp-tabs__review-bar-row">
              <span class="ym-pdp-tabs__review-bar-label">{{ starLabels[idx] }} <i class="ri-star-fill"></i></span>
              <div class="ym-pdp-tabs__review-bar-track">
                <div class="ym-pdp-tabs__review-bar-fill" :style="{ width: pct + '%' }"></div>
              </div>
              <span class="ym-pdp-tabs__review-bar-pct">{{ pct }}%</span>
            </div>
          </div>

          <div class="ym-pdp-tabs__review-write">
            <button type="button" class="ym-pdp-tabs__review-write-btn" @click="reviewFormOpen = !reviewFormOpen">
              <i class="ri-edit-line" aria-hidden="true"></i> Viết đánh giá
            </button>
          </div>
        </div>

        <form v-if="reviewFormOpen" class="ym-pdp-tabs__comment-form" @submit.prevent="submitReview">
          <div class="ym-pdp-tabs__comment-row">
            <input v-model="reviewForm.author" type="text" placeholder="Tên của bạn" />
            <input v-model="reviewForm.email" type="email" placeholder="Email" />
            <select v-model.number="reviewForm.rating">
              <option v-for="n in 5" :key="n" :value="n">{{ n }} sao</option>
            </select>
          </div>
          <textarea v-model="reviewForm.content" rows="4" placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."></textarea>
          <button type="submit" :disabled="submittingComment">Gửi đánh giá</button>
        </form>
        <p v-if="commentNotice" class="ym-pdp-tabs__comment-notice">{{ commentNotice }}</p>
        <p v-if="commentsLoading" class="ym-pdp-tabs__comment-loading">Đang tải bình luận đã duyệt...</p>

        <!-- Empty state khi chưa có review nào đã duyệt -->
        <div v-if="!commentsLoading && reviewList.length === 0" class="ym-pdp-tabs__empty">
          <p>Chưa có đánh giá nào cho sản phẩm này. Hãy là người đầu tiên đánh giá!</p>
        </div>

        <!-- Review list -->
        <div v-else class="ym-pdp-tabs__reviews">
          <div v-for="review in paginatedReviews" :key="review.id" class="ym-pdp-tabs__review-item">
            <div class="ym-pdp-tabs__review-left">
              <div class="ym-pdp-tabs__review-avatar" :style="{ background: getAvatarColor(review.author) }">
                {{ getInitial(review.author) }}
              </div>
            </div>
            <div class="ym-pdp-tabs__review-right">
              <div class="ym-pdp-tabs__review-header">
                <strong class="ym-pdp-tabs__review-author">{{ review.author }}</strong>
                <span v-if="review.verified" class="ym-pdp-tabs__review-verified">
                  <i class="ri-checkbox-circle-fill"></i> Đã mua hàng
                </span>
                <span class="ym-pdp-tabs__review-date">{{ review.date }}</span>
              </div>
              <div class="ym-pdp-tabs__review-stars">
                <i v-for="n in renderStars(review.rating).full" :key="`f${n}`" class="ri-star-fill"></i>
                <i v-for="n in renderStars(review.rating).half" :key="`h${n}`" class="ri-star-half-fill"></i>
                <i v-for="n in renderStars(review.rating).empty" :key="`e${n}`" class="ri-star-line"></i>
              </div>
              <p class="ym-pdp-tabs__review-content">{{ review.content }}</p>
              <!-- Phản hồi của shop (admin trả lời review) -->
              <div v-if="review.replies && review.replies.length" class="ym-pdp-tabs__review-replies">
                <div v-for="reply in review.replies" :key="reply.id" class="ym-pdp-tabs__review-reply">
                  <div class="ym-pdp-tabs__review-reply-header">
                    <span v-if="reply.isStore" class="ym-pdp-tabs__qa-badge-store">YukiMart</span>
                    <strong v-else>{{ reply.author }}</strong>
                    <span class="ym-pdp-tabs__review-date">{{ reply.date }}</span>
                  </div>
                  <p class="ym-pdp-tabs__review-content">{{ reply.content }}</p>
                </div>
              </div>
              <div class="ym-pdp-tabs__review-actions">
                <button type="button"><i class="ri-thumb-up-line" aria-hidden="true"></i> Hữu ích</button>
                <button type="button"><i class="ri-flag-line" aria-hidden="true"></i> Báo cáo</button>
              </div>
            </div>
          </div>
        </div>

        <nav v-if="reviewList.length && totalReviewPages > 1" class="ym-pdp-tabs__review-pagination" aria-label="Phân trang đánh giá">
          <button
            v-for="p in totalReviewPages"
            :key="p"
            type="button"
            :aria-label="`Trang đánh giá ${p}`"
            :aria-current="p === reviewPage ? 'page' : undefined"
            :class="['ym-pdp-tabs__review-page-btn', { 'ym-pdp-tabs__review-page-btn--active': p === reviewPage }]"
            @click="reviewPage = p"
          >
            {{ p }}
          </button>
        </nav>
      </section>

      <!-- Hỏi đáp -->
      <section id="section-qa" class="ym-pdp-tabs__section ym-pdp-tabs__section--qa">
        <h3 class="ym-pdp-tabs__section-title">Hỏi đáp ({{ questionCountDisplay }})</h3>

        <!-- Input area -->
        <form class="ym-pdp-tabs__qa-input-area" @submit.prevent="submitQuestion">
          <input
            v-model="questionForm.author"
            type="text"
            placeholder="Tên của bạn"
            class="ym-pdp-tabs__qa-input ym-pdp-tabs__qa-input--name"
          />
          <label for="ym-pdp-qa-input" class="visually-hidden">Đặt câu hỏi cho sản phẩm</label>
          <input
            id="ym-pdp-qa-input"
            v-model="questionForm.content"
            type="text"
            placeholder="Bạn có câu hỏi với sản phẩm này? Đặt câu hỏi ngay."
            class="ym-pdp-tabs__qa-input"
          />
          <button type="submit" class="ym-pdp-tabs__qa-submit-btn" :disabled="submittingComment">Gửi</button>
        </form>
        <p v-if="commentNotice" class="ym-pdp-tabs__comment-notice">{{ commentNotice }}</p>

        <div v-if="questionList.length === 0" class="ym-pdp-tabs__qa-empty">
          <p>Chưa có câu hỏi nào. Hãy là người đầu tiên đặt câu hỏi!</p>
        </div>

        <div v-else class="ym-pdp-tabs__qa-list">
          <div v-for="q in questionList" :key="q.id" class="ym-pdp-tabs__qa-item">
            <!-- Main Question -->
            <div class="ym-pdp-tabs__qa-main">
              <strong class="ym-pdp-tabs__qa-author">{{ q.author }}</strong>
              <p class="ym-pdp-tabs__qa-content">{{ q.content }}</p>
              <div class="ym-pdp-tabs__qa-meta">
                <span class="ym-pdp-tabs__qa-date">{{ q.date }}</span>
                <button type="button" class="ym-pdp-tabs__qa-action-btn" :class="{ 'ym-pdp-tabs__qa-action-btn--liked': q.likes > 0 }">
                  Thích <i class="ri-thumb-up-fill" v-if="q.likes > 0" aria-hidden="true"></i><i class="ri-thumb-up-line" v-else aria-hidden="true"></i> {{ q.likes }}
                </button>
                <button type="button" class="ym-pdp-tabs__qa-action-btn" @click="openReply(q.id)">
                  {{ replyOpenId === q.id ? 'Đóng' : 'Trả lời' }}
                </button>
              </div>
            </div>

            <!-- Replies -->
            <div v-if="q.replies && q.replies.length > 0" class="ym-pdp-tabs__qa-replies">
              <div v-for="reply in q.replies" :key="reply.id" class="ym-pdp-tabs__qa-reply">
                <div class="ym-pdp-tabs__qa-reply-header">
                  <span v-if="reply.isStore" class="ym-pdp-tabs__qa-badge-store">YukiMart</span>
                  <strong v-else class="ym-pdp-tabs__qa-author">{{ reply.author }}</strong>
                </div>
                <p class="ym-pdp-tabs__qa-content">{{ reply.content }}</p>
                <div class="ym-pdp-tabs__qa-meta">
                  <span class="ym-pdp-tabs__qa-date">{{ reply.date }}</span>
                  <button type="button" class="ym-pdp-tabs__qa-action-btn" :class="{ 'ym-pdp-tabs__qa-action-btn--liked': reply.likes > 0 }">
                    Thích <i class="ri-thumb-up-fill" v-if="reply.likes > 0" aria-hidden="true"></i><i class="ri-thumb-up-line" v-else aria-hidden="true"></i> {{ reply.likes }}
                  </button>
                  <button type="button" class="ym-pdp-tabs__qa-action-btn" @click="openReply(q.id)">Trả lời</button>
                </div>
              </div>
            </div>

            <!-- Form trả lời inline cho câu hỏi đang mở -->
            <form v-if="replyOpenId === q.id" class="ym-pdp-tabs__qa-reply-form" @submit.prevent="submitReply(q.id)">
              <input
                v-model="replyForm.author"
                type="text"
                placeholder="Tên của bạn"
                class="ym-pdp-tabs__qa-input ym-pdp-tabs__qa-input--name"
              />
              <input
                v-model="replyForm.content"
                type="text"
                placeholder="Nội dung trả lời..."
                class="ym-pdp-tabs__qa-input"
              />
              <button type="submit" class="ym-pdp-tabs__qa-submit-btn" :disabled="submittingComment">Gửi</button>
            </form>
          </div>

          <div class="ym-pdp-tabs__qa-more">
            <button type="button" class="ym-pdp-tabs__qa-more-btn">Xem thêm <i class="ri-arrow-down-s-line" aria-hidden="true"></i></button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.ym-pdp-tabs__comment-form {
  margin: 14px 0 18px;
  padding: 14px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fafafa;
  display: grid;
  gap: 10px;
}
.ym-pdp-tabs__comment-row {
  display: grid;
  grid-template-columns: 1fr 1fr 120px;
  gap: 10px;
}
.ym-pdp-tabs__comment-form input,
.ym-pdp-tabs__comment-form select,
.ym-pdp-tabs__comment-form textarea {
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 9px 11px;
  font: inherit;
  background: #fff;
}
.ym-pdp-tabs__comment-form button {
  justify-self: end;
  border: none;
  border-radius: 6px;
  padding: 10px 16px;
  font-weight: 700;
  color: #fff;
  background: #326e51;
}
.ym-pdp-tabs__comment-form button:disabled,
.ym-pdp-tabs__qa-submit-btn:disabled {
  opacity: 0.6;
  cursor: wait;
}
.ym-pdp-tabs__comment-notice,
.ym-pdp-tabs__comment-loading {
  margin: 8px 0 14px;
  color: #326e51;
  font-size: 13px;
}
.ym-pdp-tabs__qa-input--name {
  max-width: 180px;
}
.ym-pdp-tabs__empty {
  margin: 16px 0;
  padding: 18px;
  border: 1px dashed #d1d5db;
  border-radius: 8px;
  color: #6b7280;
  text-align: center;
}
.ym-pdp-tabs__review-replies {
  margin-top: 10px;
  padding: 10px 12px;
  border-left: 3px solid #326e51;
  background: #f5faf7;
  border-radius: 6px;
  display: grid;
  gap: 8px;
}
.ym-pdp-tabs__review-reply {
  display: grid;
  gap: 4px;
}
.ym-pdp-tabs__review-reply-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}
.ym-pdp-tabs__qa-reply-form {
  display: flex;
  gap: 8px;
  margin: 10px 0 0 16px;
  padding: 10px;
  background: #f9fafb;
  border-radius: 8px;
}
.ym-pdp-tabs__qa-reply-form .ym-pdp-tabs__qa-input {
  flex: 1;
}
.ym-pdp-tabs__qa-reply-form .ym-pdp-tabs__qa-input--name {
  flex: 0 0 160px;
}
@media (max-width: 768px) {
  .ym-pdp-tabs__qa-reply-form {
    flex-direction: column;
  }
  .ym-pdp-tabs__qa-reply-form .ym-pdp-tabs__qa-input--name {
    flex: 1;
  }
}
@media (max-width: 768px) {
  .ym-pdp-tabs__comment-row {
    grid-template-columns: 1fr;
  }
  .ym-pdp-tabs__qa-input--name {
    max-width: none;
  }
}
</style>
