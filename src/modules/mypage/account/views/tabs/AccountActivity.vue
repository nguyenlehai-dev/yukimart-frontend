<script setup lang="ts">
import { ref } from 'vue'

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

const activities = ref<Activity[]>([
  {
    id: 1,
    type: 'review',
    date: '16 Thg 10, 2026',
    product: {
      name: 'Kem Chống Nắng La Roche-Posay Anthelios 50ml',
      image: 'https://hasaki.vn/images/graphics/no-image.jpg'
    },
    rating: 5,
    content: 'Chất kem rất thích, thấm nhanh không bị bết rít. Giao hàng cực kỳ nhanh, sẽ ủng hộ shop tiếp vào đợt sale tới.',
    reply: {
      author: 'YukiMart Official',
      content: 'Chào bạn, cảm ơn bạn đã tin dùng sản phẩm của YukiMart. Chúc bạn một ngày tốt lành và luôn tự tin rạng rỡ nhé!',
      date: '16 Thg 10, 2026'
    }
  },
  {
    id: 2,
    type: 'comment',
    date: '10 Thg 10, 2026',
    product: {
      name: 'Nước Tẩy Trang L\'Oreal 3 in 1 Micellar Water',
      image: 'https://hasaki.vn/images/graphics/no-image.jpg'
    },
    content: 'Sản phẩm này hiện tại ở chi nhánh Quận 10 còn hàng không shop, date đến bao giờ ạ?',
    reply: {
      author: 'YukiMart CSKH',
      content: 'Dạ chào bạn, chi nhánh Q10 hiện vẫn còn sẵn hàng. Lô hàng hiện tại có hạn sử dụng (EXP) lến đến tháng 12/2028 ạ. Mời bạn ghé shop nhé!',
      date: '10 Thg 10, 2026'
    }
  },
  {
    id: 3,
    type: 'review',
    date: '05 Thg 10, 2026',
    product: {
      name: 'Serum Phục Hồi Da B5 Giảm Khuyết Điểm',
      image: 'https://hasaki.vn/images/graphics/no-image.jpg'
    },
    rating: 4,
    content: 'Dùng khá thích, da có ẩm mượt hơn sau 2 tuần. Tuy nhiên giá hơi cao xíu so với dung tích.',
  }
])
</script>

<template>
  <div class="ym-acc-activity-tab">
    <div class="ym-acc-section-header">
      <h2 class="ym-acc-section-title">Hoạt động gần đây</h2>
      <p class="ym-acc-section-desc">Theo dõi các đánh giá, bình luận và phản hồi từ hệ thống</p>
    </div>

    <!-- Empty State -->
    <div v-if="activities.length === 0" class="ym-acc-empty">
      <div class="ym-acc-empty__icon ym-acc-empty__icon--blue"><i class="ri-chat-3-line"></i></div>
      <h4 class="ym-acc-empty__title">Chưa có hoạt động nào</h4>
      <p class="ym-acc-empty__desc">Bạn chưa để lại bất kỳ đánh giá hay bình luận nào.</p>
    </div>

    <!-- Activity Timeline -->
    <div v-else class="ym-acc-timeline">
      <div 
        v-for="act in activities" 
        :key="act.id" 
        class="ym-acc-timeline__item"
      >
        <!-- Timeline Marker -->
        <div class="ym-acc-timeline__marker" :class="act.type === 'review' ? 'ym-bg-green' : 'ym-bg-blue'">
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
            
            <div v-if="act.rating" class="ym-acc-act-card__rating">
              <i class="ri-star-fill text-warning" v-for="i in act.rating" :key="'s'+i"></i>
              <i class="ri-star-line text-muted" v-for="i in 5 - act.rating" :key="'e'+i"></i>
            </div>

            <div class="ym-acc-act-card__product">
              <img :src="act.product.image" alt="sp" />
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
                  <div class="ym-acc-reply__avatar"><i class="ri-store-2-fill"></i></div>
                  <strong>{{ act.reply.author }}</strong>
                  <i class="ri-verified-badge-fill text-primary ms-1" title="Official"></i>
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
  </div>
</template>
