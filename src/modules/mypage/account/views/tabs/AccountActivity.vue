<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { accountApi } from '../../../../../services/api'

interface Activity {
  id: number
  type: 'review' | 'comment'
  date: string
  product: {
    name: string
    image: string
  }
  content: string
  rating?: number
  reply?: {
    author: string
    content: string
    date: string
  }
}

const activities = ref<Activity[]>([])
const loading = ref(true)
const loadError = ref('')

const FALLBACK_IMG = 'https://hasaki.vn/images/graphics/no-image.jpg'

function formatDate(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return String(iso)
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function mapActivity(raw: any): Activity {
  const hasRating = raw.rating !== undefined && raw.rating !== null && Number(raw.rating) > 0
  return {
    id: Number(raw.id),
    type: hasRating ? 'review' : 'comment',
    date: formatDate(raw.createdAt) || String(raw.date ?? ''),
    product: {
      name: String(raw.product_name ?? raw.product?.name ?? ''),
      image: String(raw.product_image ?? raw.product?.image ?? FALLBACK_IMG),
    },
    content: String(raw.content ?? raw.body ?? ''),
    rating: hasRating ? Number(raw.rating) : undefined,
    reply: raw.reply
      ? {
          author: String(raw.reply.author ?? 'YukiMart'),
          content: String(raw.reply.content ?? ''),
          date: formatDate(raw.reply.date) || String(raw.reply.date ?? ''),
        }
      : undefined,
  }
}

onMounted(async () => {
  try {
    const res = await accountApi.activities()
    const items = res.data?.data?.items ?? []
    activities.value = items.map(mapActivity)
  } catch (err: any) {
    loadError.value = err?.response?.data?.message || 'Không tải được hoạt động'
  } finally {
    loading.value = false
  }
})

const typeFilter = ref<'all' | 'review' | 'comment'>('all')

const filterTabs = computed(() => [
  { key: 'all' as const, label: 'Tất cả', count: activities.value.length },
  { key: 'review' as const, label: 'Đánh giá', count: activities.value.filter(a => a.type === 'review').length },
  { key: 'comment' as const, label: 'Hỏi đáp', count: activities.value.filter(a => a.type === 'comment').length },
])

const filteredActivities = computed(() =>
  typeFilter.value === 'all' ? activities.value : activities.value.filter(a => a.type === typeFilter.value),
)

const emptyText = computed(() => {
  if (typeFilter.value === 'review') return 'Bạn chưa để lại đánh giá nào.'
  if (typeFilter.value === 'comment') return 'Bạn chưa đặt câu hỏi nào.'
  return 'Bạn chưa có hoạt động nào trên hệ thống.'
})
</script>

<template>
  <div class="ym-acc-activity-tab">
    <div class="ym-acc-section-header">
      <h2 class="ym-acc-section-title">Hoạt động gần đây</h2>
      <p class="ym-acc-section-desc">Theo dõi các đánh giá, bình luận và phản hồi từ hệ thống</p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="ym-acc-empty" role="status" aria-busy="true">
      <div class="ym-acc-empty__icon" aria-hidden="true"><i class="ri-loader-4-line"></i></div>
      <h3 class="ym-acc-empty__title">Đang tải hoạt động...</h3>
    </div>
    <!-- Error -->
    <div v-else-if="loadError" class="ym-acc-empty" role="alert">
      <div class="ym-acc-empty__icon" aria-hidden="true"><i class="ri-error-warning-line"></i></div>
      <h3 class="ym-acc-empty__title">Không tải được dữ liệu</h3>
      <p class="ym-acc-empty__desc">{{ loadError }}</p>
    </div>

    <template v-else>
    <!-- Filter tabs -->
    <div class="ym-acc-tabs-wrap">
      <div class="ym-acc-tabs" role="group" aria-label="Lọc hoạt động">
        <button
          v-for="tab in filterTabs"
          :key="tab.key"
          type="button"
          class="ym-acc-tab"
          :class="{ 'ym-acc-tab--active': typeFilter === tab.key }"
          :aria-pressed="typeFilter === tab.key"
          @click="typeFilter = tab.key"
        >
          {{ tab.label }}
          <span v-if="tab.count > 0" class="ym-acc-tab__count" aria-hidden="true">{{ tab.count }}</span>
          <span class="visually-hidden">({{ tab.count }})</span>
        </button>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="filteredActivities.length === 0" class="ym-acc-empty" role="status">
      <div class="ym-acc-empty__icon ym-acc-empty__icon--blue" aria-hidden="true"><i class="ri-chat-3-line"></i></div>
      <h3 class="ym-acc-empty__title">Chưa có hoạt động</h3>
      <p class="ym-acc-empty__desc">{{ emptyText }}</p>
    </div>

    <!-- Activity Timeline -->
    <div v-else class="ym-acc-timeline">
      <div
        v-for="act in filteredActivities"
        :key="act.id" 
        class="ym-acc-timeline__item"
      >
        <!-- Timeline Marker -->
        <div class="ym-acc-timeline__marker" :class="act.type === 'review' ? 'ym-bg-green' : 'ym-bg-blue'" aria-hidden="true">
          <i :class="act.type === 'review' ? 'ri-star-smile-fill' : 'ri-question-answer-fill'"></i>
        </div>

        <!-- Activity Content -->
        <div class="ym-acc-timeline__content">
          <div class="ym-acc-act-card">
            
            <div class="ym-acc-act-card__head">
              <span class="ym-soft-badge" :class="act.type === 'review' ? 'ym-soft-badge--success' : 'ym-soft-badge--info'">
                {{ act.type === 'review' ? 'Đánh giá sản phẩm' : 'Hỏi đáp' }}
              </span>
              <span class="ym-acc-act-card__time">{{ act.date }}</span>
            </div>
            
            <div v-if="act.rating" class="ym-acc-act-card__rating" :aria-label="`Đánh giá ${act.rating} trên 5 sao`">
              <i class="ri-star-fill text-warning" v-for="i in act.rating" :key="'s'+i" aria-hidden="true"></i>
              <i class="ri-star-line text-muted" v-for="i in 5 - act.rating" :key="'e'+i" aria-hidden="true"></i>
            </div>

            <div class="ym-acc-act-card__product">
              <img :src="act.product.image" :alt="act.product.name || ''" loading="lazy" decoding="async" />
              <div class="ym-acc-act-card__product-info">
                <a href="#" class="ym-acc-act-card__product-name">{{ act.product.name }}</a>
              </div>
            </div>

            <div class="ym-acc-act-card__text">
              <p>{{ act.content }}</p>
            </div>

            <!-- Shop Reply Bubble -->
            <div v-if="act.reply" class="ym-acc-reply">
              <div class="ym-acc-reply__header">
                <div class="ym-acc-reply__author">
                  <div class="ym-acc-reply__avatar" aria-hidden="true"><i class="ri-store-2-fill"></i></div>
                  <strong>{{ act.reply.author }}</strong>
                  <i class="ri-verified-badge-fill text-primary ms-1" aria-label="Tài khoản chính thức"></i>
                </div>
                <span class="ym-acc-reply__time">{{ act.reply.date }}</span>
              </div>
              <div class="ym-acc-reply__text">
                <p>{{ act.reply.content }}</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
    </template>
  </div>
</template>
