<script setup lang="ts">
import { useCartStore } from '../../../../stores/cart'

const cartStore = useCartStore()
const order = cartStore.lastOrder

const formatPrice = (price: number) =>
  new Intl.NumberFormat('vi-VN').format(price) + 'đ'
</script>

<template>
  <div class="ym-order-confirm">
    <div class="container">
      <div v-if="!order" class="ym-cart__empty">
        <p>Không tìm thấy đơn hàng. <RouterLink to="/">Quay lại trang chủ</RouterLink></p>
      </div>

      <div v-else class="ym-order-confirm__layout">
        <h2 class="ym-order-confirm__heading">Chi tiết đơn hàng</h2>

        <div class="ym-order-confirm__grid">
          <!-- Left: Order details -->
          <div class="ym-order-confirm__details">
            <table class="ym-order-confirm__table">
              <thead>
                <tr>
                  <th>SẢN PHẨM</th>
                  <th>TỔNG</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in order.items" :key="item.id">
                  <td>{{ item.name }} × {{ item.quantity }}</td>
                  <td>{{ formatPrice(item.price * item.quantity) }}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td>Tổng số phụ:</td>
                  <td>{{ formatPrice(order.subtotal) }}</td>
                </tr>
                <tr>
                  <td>Phương thức thanh toán:</td>
                  <td>{{ order.paymentMethod }}</td>
                </tr>
                <tr class="ym-order-confirm__total-row">
                  <td>Tổng cộng:</td>
                  <td class="ym-order-confirm__total-value">{{ formatPrice(order.total) }}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <!-- Right: Thank you message -->
          <div class="ym-order-confirm__thankyou">
            <div class="ym-order-confirm__thankyou-box">
              <p class="ym-order-confirm__thankyou-msg">
                <i class="ri-checkbox-circle-fill"></i>
                Cảm ơn bạn. Đơn hàng của bạn đã được nhận.
              </p>
              <ul class="ym-order-confirm__info-list">
                <li>Mã đơn hàng: <strong>{{ order.id }}</strong></li>
                <li>Ngày: <strong>{{ order.date }}</strong></li>
                <li>Tổng cộng: <strong class="ym-order-confirm__total-highlight">{{ formatPrice(order.total) }}</strong></li>
                <li>Phương thức thanh toán: <strong>{{ order.paymentMethod }}</strong></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
