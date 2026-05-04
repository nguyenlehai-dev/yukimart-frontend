<script setup lang="ts">
import { ref } from 'vue'
import { useCartStore } from '../../../../stores/cart'
import { useRouter } from 'vue-router'

const cartStore = useCartStore()
const router = useRouter()

const formatPrice = (price: number) =>
  new Intl.NumberFormat('vi-VN').format(price) + 'đ'

function incrementQty(id: number, currentQty: number) {
  cartStore.updateQuantity(id, currentQty + 1)
}

function decrementQty(id: number, currentQty: number) {
  if (currentQty <= 1) return
  cartStore.updateQuantity(id, currentQty - 1)
}

function goCheckout() {
  router.push('/checkout')
}

const couponCode = ref('')
const couponMessage = ref('')

function applyCoupon() {
  const code = couponCode.value.trim()
  if (!code) return
  // Placeholder: real coupon validation cần API
  couponMessage.value = `Đã ghi nhận mã "${code}" — sẽ được kiểm tra khi thanh toán.`
}
</script>

<template>
  <div class="ym-cart">
    <div class="container">
      <h1 class="visually-hidden">Giỏ hàng</h1>

      <div v-if="cartStore.items.length === 0" class="ym-cart__empty">
        <i class="ri-shopping-cart-line ym-cart__empty-icon" aria-hidden="true"></i>
        <p>Giỏ hàng của bạn đang trống</p>
        <RouterLink to="/" class="ym-cart__empty-btn">← Tiếp tục mua hàng</RouterLink>
      </div>

      <div v-else class="ym-cart__layout">
        <!-- Cart table -->
        <div class="ym-cart__main">
          <table class="ym-cart__table" aria-label="Sản phẩm trong giỏ hàng">
            <thead>
              <tr>
                <th class="ym-cart__th-product" scope="col">SẢN PHẨM</th>
                <th scope="col">GIÁ</th>
                <th scope="col">SỐ LƯỢNG</th>
                <th scope="col">TẠM TÍNH</th>
                <th scope="col"><span class="visually-hidden">Xoá sản phẩm</span></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in cartStore.items" :key="item.id" class="ym-cart__row">
                <td class="ym-cart__cell-product">
                  <img
                    :src="item.image"
                    :alt="item.name || ''"
                    loading="lazy"
                    decoding="async"
                    class="ym-cart__item-img"
                  />
                  <div class="ym-cart__item-info">
                    <span class="ym-cart__item-name">{{ item.name }}</span>
                  </div>
                </td>
                <td class="ym-cart__cell-price">{{ formatPrice(item.price) }}</td>
                <td class="ym-cart__cell-qty">
                  <div class="ym-cart__qty-control" role="group" :aria-label="`Số lượng ${item.name}`">
                    <button
                      type="button"
                      :aria-label="`Giảm số lượng ${item.name}`"
                      :disabled="item.quantity <= 1"
                      @click="decrementQty(item.id, item.quantity)"
                    >−</button>
                    <span aria-live="polite" :aria-label="`Số lượng: ${item.quantity}`">{{ item.quantity }}</span>
                    <button
                      type="button"
                      :aria-label="`Tăng số lượng ${item.name}`"
                      @click="incrementQty(item.id, item.quantity)"
                    >+</button>
                  </div>
                </td>
                <td class="ym-cart__cell-subtotal">{{ formatPrice(item.price * item.quantity) }}</td>
                <td class="ym-cart__cell-remove">
                  <button
                    type="button"
                    class="ym-cart__remove-btn"
                    :aria-label="`Xoá ${item.name} khỏi giỏ hàng`"
                    @click="cartStore.removeItem(item.id)"
                  >
                    <i class="ri-close-line" aria-hidden="true"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <div class="ym-cart__actions-row">
            <RouterLink to="/" class="ym-cart__btn-continue">← TIẾP TỤC XEM SẢN PHẨM</RouterLink>
          </div>
        </div>

        <!-- Sidebar -->
        <aside class="ym-cart__sidebar" aria-label="Tóm tắt đơn hàng">
          <div class="ym-cart__summary-box">
            <h3 class="ym-cart__summary-title">CỘNG GIỎ HÀNG</h3>
            <div class="ym-cart__summary-row">
              <span>Tạm tính</span>
              <span class="ym-cart__summary-value">{{ formatPrice(cartStore.subtotal) }}</span>
            </div>
            <div class="ym-cart__summary-row ym-cart__summary-row--total">
              <span>Tổng</span>
              <span class="ym-cart__summary-value" aria-live="polite">{{ formatPrice(cartStore.subtotal) }}</span>
            </div>
            <button type="button" class="ym-cart__btn-checkout" @click="goCheckout">
              TIẾN HÀNH THANH TOÁN
            </button>
          </div>

          <!-- Coupon -->
          <form class="ym-cart__coupon-box" @submit.prevent="applyCoupon">
            <label for="ym-cart-coupon" class="ym-cart__coupon-label">
              <i class="ri-coupon-2-fill" aria-hidden="true"></i> Phiếu ưu đãi
            </label>
            <input
              id="ym-cart-coupon"
              v-model="couponCode"
              type="text"
              autocomplete="off"
              placeholder="Mã ưu đãi"
              class="ym-cart__coupon-input"
            />
            <button type="submit" class="ym-cart__coupon-btn">Áp dụng</button>
            <p v-if="couponMessage" class="ym-cart__coupon-msg" role="status">{{ couponMessage }}</p>
          </form>
        </aside>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ym-cart__coupon-msg {
  margin-top: 8px;
  padding: 8px 12px;
  background: var(--color-bg-hover, #f0f7f4);
  color: var(--color-primary, #326e51);
  border-radius: var(--radius-sm, 4px);
  font-size: var(--text-sm, 0.875rem);
  line-height: 1.4;
}
</style>
