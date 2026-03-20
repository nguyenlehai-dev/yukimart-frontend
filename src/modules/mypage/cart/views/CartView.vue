<script setup lang="ts">
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
  cartStore.updateQuantity(id, currentQty - 1)
}

function goCheckout() {
  router.push('/checkout')
}
</script>

<template>
  <div class="ym-cart">
    <div class="container">
      <div v-if="cartStore.items.length === 0" class="ym-cart__empty">
        <i class="ri-shopping-cart-line ym-cart__empty-icon"></i>
        <p>Giỏ hàng của bạn đang trống</p>
        <RouterLink to="/" class="ym-cart__empty-btn">← Tiếp tục mua hàng</RouterLink>
      </div>

      <div v-else class="ym-cart__layout">
        <!-- Cart table -->
        <div class="ym-cart__main">
          <table class="ym-cart__table">
            <thead>
              <tr>
                <th class="ym-cart__th-product">SẢN PHẨM</th>
                <th>GIÁ</th>
                <th>SỐ LƯỢNG</th>
                <th>TẠM TÍNH</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in cartStore.items" :key="item.id" class="ym-cart__row">
                <td class="ym-cart__cell-product">
                  <img :src="item.image" :alt="item.name" class="ym-cart__item-img" />
                  <div class="ym-cart__item-info">
                    <span class="ym-cart__item-name">{{ item.name }}</span>
                  </div>
                </td>
                <td class="ym-cart__cell-price">{{ formatPrice(item.price) }}</td>
                <td class="ym-cart__cell-qty">
                  <div class="ym-cart__qty-control">
                    <button @click="decrementQty(item.id, item.quantity)">-</button>
                    <span>{{ item.quantity }}</span>
                    <button @click="incrementQty(item.id, item.quantity)">+</button>
                  </div>
                </td>
                <td class="ym-cart__cell-subtotal">{{ formatPrice(item.price * item.quantity) }}</td>
                <td class="ym-cart__cell-remove">
                  <button class="ym-cart__remove-btn" @click="cartStore.removeItem(item.id)">
                    <i class="ri-close-line"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <div class="ym-cart__actions-row">
            <RouterLink to="/" class="ym-cart__btn-continue">← TIẾP TỤC XEM SẢN PHẨM</RouterLink>
            <button class="ym-cart__btn-update">CẬP NHẬT GIỎ HÀNG</button>
          </div>
        </div>

        <!-- Sidebar -->
        <aside class="ym-cart__sidebar">
          <div class="ym-cart__summary-box">
            <h3 class="ym-cart__summary-title">CỘNG GIỎ HÀNG</h3>
            <div class="ym-cart__summary-row">
              <span>Tạm tính</span>
              <span class="ym-cart__summary-value">{{ formatPrice(cartStore.subtotal) }}</span>
            </div>
            <div class="ym-cart__summary-row ym-cart__summary-row--total">
              <span>Tổng</span>
              <span class="ym-cart__summary-value">{{ formatPrice(cartStore.subtotal) }}</span>
            </div>
            <button class="ym-cart__btn-checkout" @click="goCheckout">
              TIẾN HÀNH THANH TOÁN
            </button>
          </div>

          <!-- Coupon -->
          <div class="ym-cart__coupon-box">
            <p class="ym-cart__coupon-label"><i class="ri-coupon-2-fill"></i> Phiếu ưu đãi</p>
            <input type="text" placeholder="Mã ưu đãi" class="ym-cart__coupon-input" />
            <button class="ym-cart__coupon-btn">Áp dụng</button>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>
