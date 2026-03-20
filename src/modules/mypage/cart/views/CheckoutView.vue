<script setup lang="ts">
import { ref } from 'vue'
import { useCartStore } from '../../../../stores/cart'
import { useRouter } from 'vue-router'

const cartStore = useCartStore()
const router = useRouter()

const formatPrice = (price: number) =>
  new Intl.NumberFormat('vi-VN').format(price) + 'đ'

// Form fields
const firstName = ref('')
const lastName = ref('')
const company = ref('')
const country = ref('Việt Nam')
const address = ref('')
const postalCode = ref('')
const city = ref('')
const phone = ref('')
const email = ref('')
const note = ref('')
const paymentMethod = ref('bank_transfer')

const formError = ref('')

function handlePlaceOrder() {
  if (!firstName.value || !lastName.value || !phone.value || !email.value || !address.value) {
    formError.value = 'Vui lòng điền đầy đủ thông tin bắt buộc (*)'
    return
  }

  cartStore.placeOrder(
    {
      firstName: firstName.value,
      lastName: lastName.value,
      company: company.value,
      country: country.value,
      address: address.value,
      postalCode: postalCode.value,
      city: city.value,
      phone: phone.value,
      email: email.value,
      note: note.value,
    },
    paymentMethod.value === 'bank_transfer' ? 'Chuyển khoản ngân hàng' : 'Trả tiền mặt khi nhận hàng'
  )

  router.push('/order-confirm')
}
</script>

<template>
  <div class="ym-checkout">
    <div class="container">
      <div v-if="cartStore.items.length === 0 && !cartStore.lastOrder" class="ym-cart__empty">
        <p>Giỏ hàng trống. <RouterLink to="/">Quay lại mua hàng</RouterLink></p>
      </div>

      <div v-else class="ym-checkout__layout">
        <!-- Left: Form -->
        <div class="ym-checkout__form-section">
          <p class="ym-checkout__coupon-note">
            Bạn có mã ưu đãi? Ấn vào đây để nhập mã
          </p>

          <h2 class="ym-checkout__section-title">THÔNG TIN THANH TOÁN</h2>

          <p v-if="formError" class="ym-checkout__error">{{ formError }}</p>

          <form @submit.prevent="handlePlaceOrder">
            <div class="ym-checkout__row-2col">
              <div class="ym-checkout__field">
                <label>Tên *</label>
                <input v-model="firstName" type="text" />
              </div>
              <div class="ym-checkout__field">
                <label>Họ *</label>
                <input v-model="lastName" type="text" />
              </div>
            </div>

            <div class="ym-checkout__field">
              <label>Tên công ty (tuỳ chọn)</label>
              <input v-model="company" type="text" />
            </div>

            <div class="ym-checkout__field">
              <label>Quốc gia/Khu vực *</label>
              <select v-model="country">
                <option>Việt Nam</option>
                <option>Hoa Kỳ</option>
                <option>Nhật Bản</option>
                <option>Hàn Quốc</option>
              </select>
            </div>

            <div class="ym-checkout__field">
              <label>Địa chỉ *</label>
              <input v-model="address" type="text" placeholder="Địa chỉ" />
            </div>

            <div class="ym-checkout__field">
              <label>Mã bưu điện (tuỳ chọn)</label>
              <input v-model="postalCode" type="text" />
            </div>

            <div class="ym-checkout__field">
              <label>Tỉnh / Thành phố *</label>
              <input v-model="city" type="text" />
            </div>

            <div class="ym-checkout__field">
              <label>Số điện thoại *</label>
              <input v-model="phone" type="tel" />
            </div>

            <div class="ym-checkout__field">
              <label>Địa chỉ email *</label>
              <input v-model="email" type="email" />
            </div>

            <h2 class="ym-checkout__section-title ym-checkout__section-title--extra">THÔNG TIN BỔ SUNG</h2>

            <div class="ym-checkout__field">
              <label>Ghi chú đơn hàng (tuỳ chọn)</label>
              <textarea
                v-model="note"
                rows="4"
                placeholder="Ghi chú về đơn hàng, ví dụ: thời gian hay chỉ dẫn địa điểm giao hàng chi tiết hơn."
              ></textarea>
            </div>

            <!-- Submit button (mobile only, desktop uses sidebar) -->
            <button type="submit" class="ym-checkout__btn-order ym-checkout__btn-order--mobile">
              ĐẶT HÀNG
            </button>
          </form>
        </div>

        <!-- Right: Order summary -->
        <aside class="ym-checkout__sidebar">
          <div class="ym-checkout__order-box">
            <h3 class="ym-checkout__order-title">ĐƠN HÀNG CỦA BẠN</h3>

            <div class="ym-checkout__order-header">
              <span>SẢN PHẨM</span>
              <span>TẠM TÍNH</span>
            </div>

            <div
              v-for="item in cartStore.items"
              :key="item.id"
              class="ym-checkout__order-item"
            >
              <span class="ym-checkout__order-item-name">
                {{ item.name }} × {{ item.quantity }}
              </span>
              <span class="ym-checkout__order-item-price">
                {{ formatPrice(item.price * item.quantity) }}
              </span>
            </div>

            <div class="ym-checkout__order-row">
              <span>Tạm tính</span>
              <span>{{ formatPrice(cartStore.subtotal) }}</span>
            </div>

            <div class="ym-checkout__order-row ym-checkout__order-row--total">
              <span>Tổng</span>
              <span>{{ formatPrice(cartStore.subtotal) }}</span>
            </div>

            <!-- Payment method -->
            <div class="ym-checkout__payment">
              <label class="ym-checkout__payment-option">
                <input v-model="paymentMethod" type="radio" value="bank_transfer" />
                <strong>Chuyển khoản ngân hàng</strong>
              </label>
              <p v-if="paymentMethod === 'bank_transfer'" class="ym-checkout__payment-desc">
                Thực hiện thanh toán vào ngay tài khoản ngân hàng của chúng tôi. Vui lòng sử dụng Mã đơn hàng của bạn trong phần Nội dung thanh toán. Đơn hàng sẽ được giao sau khi tiền đã chuyển.
              </p>

              <label class="ym-checkout__payment-option">
                <input v-model="paymentMethod" type="radio" value="cod" />
                <strong>Trả tiền mặt khi nhận hàng</strong>
              </label>
            </div>

            <button class="ym-checkout__btn-order" @click="handlePlaceOrder">
              ĐẶT HÀNG
            </button>

            <p class="ym-checkout__privacy-note">
              Thông tin cá nhân của bạn sẽ được sử dụng để xử lý đơn hàng, tăng trải nghiệm sử dụng website, và cho các mục đích cụ thể khác đã được mô tả trong
              <a href="#">chính sách riêng tư</a>.
            </p>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>
