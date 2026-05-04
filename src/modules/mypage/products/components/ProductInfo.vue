<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import type { ProductDetail } from '../models/Product'
import { formatPrice } from '../configs'
import { useCartStore } from '../../../../stores/cart'

const cartStore = useCartStore()
const router = useRouter()

const props = defineProps<{
  product: ProductDetail
}>()

const quantity = ref(1)
const selectedVolume = ref(props.product.selectedVolume)
const selectedSkinType = ref(props.product.skinType)

// Flash deal countdown
const countdown = ref({ days: 0, hours: 1, minutes: 4, seconds: 37 })
let timer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  timer = setInterval(() => {
    if (countdown.value.seconds > 0) {
      countdown.value.seconds--
    } else if (countdown.value.minutes > 0) {
      countdown.value.minutes--
      countdown.value.seconds = 59
    } else if (countdown.value.hours > 0) {
      countdown.value.hours--
      countdown.value.minutes = 59
      countdown.value.seconds = 59
    } else if (countdown.value.days > 0) {
      countdown.value.days--
      countdown.value.hours = 23
      countdown.value.minutes = 59
      countdown.value.seconds = 59
    }
  }, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

const pad = (n: number) => String(n).padStart(2, '0')

const totalSalePrice = computed(() => props.product.salePrice * quantity.value)
const totalOriginalPrice = computed(() => props.product.originalPrice * quantity.value)
const savings = computed(() => totalOriginalPrice.value - totalSalePrice.value)

function incrementQty() {
  if (quantity.value < props.product.stock) quantity.value++
}

function decrementQty() {
  if (quantity.value > 1) quantity.value--
}

// Generate stars
const fullStars = computed(() => Math.floor(props.product.rating))
const hasHalfStar = computed(() => props.product.rating % 1 >= 0.5)

// ── Cart actions ──
const showLoginModal = ref(false)

function addToCart() {
  cartStore.addItem({
    id: props.product.id,
    name: props.product.name,
    image: props.product.images[0],
    brand: props.product.brand,
    price: props.product.salePrice,
    originalPrice: props.product.originalPrice,
  }, quantity.value)
}

function buyNow() {
  addToCart()
  router.push('/cart')
}
</script>

<template>
  <div class="ym-pdp-info">
    <!-- Brand + auth badge -->
    <div class="ym-pdp-info__brand-row">
      <span class="ym-pdp-info__nowfree">NowFree</span>
      <span class="ym-pdp-info__brand-name">{{ product.brand }}</span>
      <span class="ym-pdp-info__auth-badge">
        <i class="ri-shield-check-fill"></i> PHÂN PHỐI CHÍNH HÃNG
      </span>
    </div>

    <!-- Product name -->
    <h1 class="ym-pdp-info__name">{{ product.name }}</h1>
    <p class="ym-pdp-info__subtitle">{{ product.description }}</p>

    <!-- SKU + Registration -->
    <div class="ym-pdp-info__meta-row">
      <span class="ym-pdp-info__meta-item">Số công bố với Bộ Y Tế</span>
    </div>

    <!-- Rating -->
    <div class="ym-pdp-info__rating-row">
      <span class="ym-pdp-info__rating-score" :aria-label="`Đánh giá ${product.rating} trên 5 sao`">{{ product.rating }}</span>
      <span class="ym-pdp-info__stars" aria-hidden="true">
        <i v-for="n in fullStars" :key="n" class="ri-star-fill"></i>
        <i v-if="hasHalfStar" class="ri-star-half-fill"></i>
      </span>
      <a href="#reviews" class="ym-pdp-info__rating-link">{{ product.ratingCount }} đánh giá</a>
      <span class="ym-pdp-info__divider" aria-hidden="true">|</span>
      <a href="#qa" class="ym-pdp-info__rating-link">{{ product.questionCount }} Hỏi đáp</a>
      <span class="ym-pdp-info__divider" aria-hidden="true">|</span>
      <span class="ym-pdp-info__sku">Mã sản phẩm: {{ product.sku }}</span>
    </div>

    <!-- Flash Deal -->
    <div v-if="product.flashDeal" class="ym-pdp-info__flash-deal">
      <span class="ym-pdp-info__flash-label">
        <i class="ri-flashlight-fill"></i> {{ product.flashDeal.label }}
      </span>
      <span class="ym-pdp-info__flash-countdown-label">KẾT THÚC TRONG</span>
      <span class="ym-pdp-info__flash-timer">
        <span class="ym-pdp-info__flash-box">{{ pad(countdown.days) }}</span>
        <span class="ym-pdp-info__flash-box">{{ pad(countdown.hours) }}</span>
        <span class="ym-pdp-info__flash-box">{{ pad(countdown.minutes) }}</span>
        <span class="ym-pdp-info__flash-box">{{ pad(countdown.seconds) }}</span>
      </span>
    </div>

    <!-- Price -->
    <div class="ym-pdp-info__price-section">
      <span class="ym-pdp-info__price-sale">{{ formatPrice(totalSalePrice) }}</span>
      <span class="ym-pdp-info__price-vat">(Đã bao gồm VAT)</span>
      <span v-if="quantity > 1" class="ym-pdp-info__price-qty-note">
        = {{ formatPrice(product.salePrice) }} × {{ quantity }}
      </span>
    </div>
    <div class="ym-pdp-info__price-original">
      Giá thị trường: <span class="ym-pdp-info__price-old">{{ formatPrice(totalOriginalPrice) }}</span>
      - Tiết kiệm: <span class="ym-pdp-info__price-savings">{{ formatPrice(savings) }} ({{ product.discount }}%)</span>
    </div>

    <!-- Skin type -->
    <div class="ym-pdp-info__option-row" role="radiogroup" aria-label="Loại da">
      <span class="ym-pdp-info__option-label">Loại da: <strong>{{ selectedSkinType }}</strong></span>
      <div class="ym-pdp-info__option-list">
        <button
          v-for="opt in product.skinTypeOptions"
          :key="opt.label"
          type="button"
          role="radio"
          :aria-checked="opt.label === selectedSkinType"
          :aria-label="opt.label"
          :class="['ym-pdp-info__option-btn', { 'ym-pdp-info__option-btn--active': opt.label === selectedSkinType }]"
          @click="selectedSkinType = opt.label"
        >
          <img v-if="opt.image" :src="opt.image" :alt="opt.label" loading="lazy" decoding="async" class="ym-pdp-info__option-img" />
        </button>
      </div>
    </div>

    <!-- Volume -->
    <div class="ym-pdp-info__option-row" role="radiogroup" aria-label="Dung tích">
      <span class="ym-pdp-info__option-label">Dung Tích: <strong>{{ selectedVolume }}</strong></span>
      <div class="ym-pdp-info__option-list">
        <button
          v-for="vol in product.volumes"
          :key="vol"
          type="button"
          role="radio"
          :aria-checked="vol === selectedVolume"
          :class="['ym-pdp-info__volume-btn', { 'ym-pdp-info__volume-btn--active': vol === selectedVolume }]"
          @click="selectedVolume = vol"
        >
          {{ vol }}
        </button>
      </div>
    </div>

    <!-- Quantity -->
    <div class="ym-pdp-info__qty-row">
      <label for="ym-pdp-qty" class="ym-pdp-info__option-label">Số lượng:</label>
      <div class="ym-pdp-info__qty-control" role="group" aria-label="Số lượng">
        <button
          type="button"
          class="ym-pdp-info__qty-btn"
          aria-label="Giảm số lượng"
          :disabled="quantity <= 1"
          @click="decrementQty"
        >−</button>
        <input
          id="ym-pdp-qty"
          v-model.number="quantity"
          type="number"
          min="1"
          :max="product.stock"
          inputmode="numeric"
          class="ym-pdp-info__qty-input"
          aria-label="Số lượng"
        />
        <button
          type="button"
          class="ym-pdp-info__qty-btn"
          aria-label="Tăng số lượng"
          :disabled="quantity >= product.stock"
          @click="incrementQty"
        >+</button>
      </div>
    </div>

    <!-- Shipping info -->
    <div class="ym-pdp-info__shipping">
      <span class="ym-pdp-info__shipping-badge">NowFree</span>
      <span class="ym-pdp-info__shipping-text">
        Giao Nhanh Miễn Phí 2H
      </span>
    </div>
    <p class="ym-pdp-info__shipping-note">
      Bạn muốn nhận hàng trước 16h hôm nay (<em>Miễn phí</em>). Đặt hàng trong 5 phút tới và chọn giao hàng 2H ở bước thanh toán.
      <a href="#">Xem thêm</a>
    </p>

    <!-- Share + Wishlist -->
    <div class="ym-pdp-info__share-row">
      <button type="button" class="ym-pdp-info__share-btn" aria-label="Chia sẻ qua Facebook">
        <i class="ri-facebook-fill" aria-hidden="true"></i> Chia sẻ
      </button>
      <button type="button" class="ym-pdp-info__wishlist-btn">
        <i class="ri-heart-line" aria-hidden="true"></i> Thêm vào danh sách yêu thích
      </button>
    </div>

    <!-- Action buttons -->
    <div class="ym-pdp-info__actions">
      <div class="ym-pdp-info__stock-info" role="status">
        <i class="ri-checkbox-circle-fill" aria-hidden="true"></i> {{ product.stock }}/306 CN Còn hàng
      </div>
      <button type="button" class="ym-pdp-info__btn-cart" @click="addToCart" :aria-label="`Thêm ${product.name} vào giỏ hàng`">
        <i class="ri-shopping-cart-fill" aria-hidden="true"></i> GIỎ HÀNG
      </button>
      <button type="button" class="ym-pdp-info__btn-buy" @click="buyNow" :aria-label="`Mua ngay ${product.name}`">
        MUA NGAY NOWFREE 2H<br/><small>Trẻ tặng 100k</small>
      </button>
    </div>
  </div>
</template>
