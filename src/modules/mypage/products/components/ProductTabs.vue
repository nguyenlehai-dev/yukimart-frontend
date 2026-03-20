<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { ProductDetail } from '../models/Product'
import { formatPrice } from '../configs'
import { useCartStore } from '../../../../stores/cart'

const props = defineProps<{
  product: ProductDetail
}>()

const cartStore = useCartStore()

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
    window.scrollTo({ top: y, behavior: 'smooth' })
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
const reviewPage = ref(1)
const reviewsPerPage = 4
const totalReviewPages = computed(() => Math.ceil(props.product.reviews.length / reviewsPerPage))
const paginatedReviews = computed(() => {
  const start = (reviewPage.value - 1) * reviewsPerPage
  return props.product.reviews.slice(start, start + reviewsPerPage)
})

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

    <!-- Tab navigation (inline) -->
    <div class="ym-pdp-tabs__nav">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        :class="['ym-pdp-tabs__nav-btn', { 'ym-pdp-tabs__nav-btn--active': tab.key === activeSection }]"
        @click="scrollToSection(tab.key)"
      >
        {{ tab.label }}
        <span v-if="tab.key === 'reviews'" class="ym-pdp-tabs__nav-count">({{ product.ratingCount }})</span>
        <span v-if="tab.key === 'qa'" class="ym-pdp-tabs__nav-count">({{ product.questionCount }})</span>
      </button>
    </div>

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
              :class="['ym-pdp-stickybar__nav-btn', { 'ym-pdp-stickybar__nav-btn--active': tab.key === activeSection }]"
              @click="scrollToSection(tab.key)"
            >
              {{ tab.label }}
            </button>
          </div>
          <button class="ym-pdp-stickybar__cart-btn" @click="addToCart">
            <i class="ri-shopping-cart-fill"></i> THÊM VÀO GIỎ HÀNG
          </button>
        </div>
      </div>
    </Transition>

    <!-- All sections shown at once -->
    <div class="ym-pdp-tabs__content">
      <!-- Mô tả -->
      <section id="section-description" class="ym-pdp-tabs__section">
        <div class="ym-pdp-tabs__description" v-html="product.contentHtml"></div>
        <div class="ym-pdp-tabs__expand">
          <a href="#" @click.prevent>Xem thêm <i class="ri-arrow-down-s-line"></i></a>
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
        <h3 class="ym-pdp-tabs__section-title">Đánh giá ({{ product.ratingCount }})</h3>

        <!-- Star distribution -->
        <div class="ym-pdp-tabs__review-summary">
          <div class="ym-pdp-tabs__review-avg">
            <span class="ym-pdp-tabs__review-avg-score">{{ product.rating }}</span>
            <div class="ym-pdp-tabs__review-avg-stars">
              <i v-for="n in renderStars(product.rating).full" :key="`af${n}`" class="ri-star-fill"></i>
              <i v-if="renderStars(product.rating).half" class="ri-star-half-fill"></i>
              <i v-for="n in renderStars(product.rating).empty" :key="`ae${n}`" class="ri-star-line"></i>
            </div>
            <span class="ym-pdp-tabs__review-avg-count">{{ product.ratingCount }} đánh giá</span>
          </div>

          <div class="ym-pdp-tabs__review-bars">
            <div v-for="(pct, idx) in product.ratingDistribution" :key="idx" class="ym-pdp-tabs__review-bar-row">
              <span class="ym-pdp-tabs__review-bar-label">{{ starLabels[idx] }} <i class="ri-star-fill"></i></span>
              <div class="ym-pdp-tabs__review-bar-track">
                <div class="ym-pdp-tabs__review-bar-fill" :style="{ width: pct + '%' }"></div>
              </div>
              <span class="ym-pdp-tabs__review-bar-pct">{{ pct }}%</span>
            </div>
          </div>

          <div class="ym-pdp-tabs__review-write">
            <button class="ym-pdp-tabs__review-write-btn">
              <i class="ri-edit-line"></i> Viết đánh giá
            </button>
          </div>
        </div>

        <!-- Review list -->
        <div class="ym-pdp-tabs__reviews">
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
              <div class="ym-pdp-tabs__review-actions">
                <button><i class="ri-thumb-up-line"></i> Hữu ích</button>
                <button><i class="ri-flag-line"></i> Báo cáo</button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="totalReviewPages > 1" class="ym-pdp-tabs__review-pagination">
          <button
            v-for="p in totalReviewPages"
            :key="p"
            :class="['ym-pdp-tabs__review-page-btn', { 'ym-pdp-tabs__review-page-btn--active': p === reviewPage }]"
            @click="reviewPage = p"
          >
            {{ p }}
          </button>
        </div>
      </section>

      <!-- Hỏi đáp -->
      <section id="section-qa" class="ym-pdp-tabs__section ym-pdp-tabs__section--qa">
        <h3 class="ym-pdp-tabs__section-title">Hỏi đáp ({{ product.questionCount }})</h3>

        <!-- Input area -->
        <div class="ym-pdp-tabs__qa-input-area">
          <input type="text" placeholder="Bạn có câu hỏi với sản phẩm này? Đặt câu hỏi ngay." class="ym-pdp-tabs__qa-input">
          <button class="ym-pdp-tabs__qa-submit-btn">Gửi</button>
        </div>

        <div v-if="product.questions.length === 0" class="ym-pdp-tabs__qa-empty">
          <p>Chưa có câu hỏi nào. Hãy là người đầu tiên đặt câu hỏi!</p>
        </div>

        <div v-else class="ym-pdp-tabs__qa-list">
          <div v-for="q in product.questions" :key="q.id" class="ym-pdp-tabs__qa-item">
            <!-- Main Question -->
            <div class="ym-pdp-tabs__qa-main">
              <strong class="ym-pdp-tabs__qa-author">{{ q.author }}</strong>
              <p class="ym-pdp-tabs__qa-content">{{ q.content }}</p>
              <div class="ym-pdp-tabs__qa-meta">
                <span class="ym-pdp-tabs__qa-date">{{ q.date }}</span>
                <button class="ym-pdp-tabs__qa-action-btn" :class="{ 'ym-pdp-tabs__qa-action-btn--liked': q.likes > 0 }">
                  Thích <i class="ri-thumb-up-fill" v-if="q.likes > 0"></i><i class="ri-thumb-up-line" v-else></i> {{ q.likes }}
                </button>
                <button class="ym-pdp-tabs__qa-action-btn">Trả lời</button>
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
                  <button class="ym-pdp-tabs__qa-action-btn" :class="{ 'ym-pdp-tabs__qa-action-btn--liked': reply.likes > 0 }">
                    Thích <i class="ri-thumb-up-fill" v-if="reply.likes > 0"></i><i class="ri-thumb-up-line" v-else></i> {{ reply.likes }}
                  </button>
                  <button class="ym-pdp-tabs__qa-action-btn">Trả lời</button>
                </div>
              </div>
              <div v-if="q.replies.length > 2" class="ym-pdp-tabs__qa-reply-more">
                <a href="#" @click.prevent>Xem 3 câu trả lời <i class="ri-arrow-down-s-line"></i></a>
              </div>
            </div>
          </div>

          <div class="ym-pdp-tabs__qa-more">
            <a href="#" @click.prevent>Xem thêm <i class="ri-arrow-down-s-line"></i></a>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
