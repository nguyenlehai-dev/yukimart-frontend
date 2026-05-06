<script setup lang="ts">
import { ref } from 'vue'
import { useCartStore } from '../../../../stores/cart'
import { useAuthStore } from '../../../../stores/auth'
import { useRouter } from 'vue-router'

const cartStore = useCartStore()
const authStore = useAuthStore()
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
const submitting = ref(false)
const formRef = ref<HTMLFormElement | null>(null)

async function handlePlaceOrder() {
  formError.value = ''

  if (!authStore.isLoggedIn) {
    formError.value = 'Vui lòng đăng nhập để đặt hàng'
    router.push('/?login=true')
    return
  }

  if (!firstName.value || !lastName.value || !phone.value || !email.value || !address.value || !city.value) {
    formError.value = 'Vui lòng điền đầy đủ thông tin bắt buộc (*)'
    formRef.value?.querySelector<HTMLInputElement>('input:invalid, [aria-invalid="true"]')?.focus()
    return
  }

  submitting.value = true
  try {
    await cartStore.placeOrder(
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
      paymentMethod.value === 'bank_transfer' ? 'Chuyển khoản ngân hàng' : 'Trả tiền mặt khi nhận hàng',
      paymentMethod.value,
    )
    router.push('/order-confirm')
  } catch (err: any) {
    formError.value = err?.response?.data?.message || 'Đặt hàng thất bại. Vui lòng thử lại.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="ym-checkout">
    <div class="container">
      <h1 class="visually-hidden">Thanh toán đơn hàng</h1>

      <div v-if="cartStore.items.length === 0 && !cartStore.lastOrder" class="ym-cart__empty">
        <p>Giỏ hàng trống. <RouterLink to="/">Quay lại mua hàng</RouterLink></p>
      </div>

      <div v-else class="ym-checkout__layout">
        <!-- Left: Form -->
        <div class="ym-checkout__form-section">
          <p class="ym-checkout__coupon-note">
            Bạn có mã ưu đãi? <RouterLink to="/cart">Quay lại giỏ hàng</RouterLink> để nhập mã.
          </p>

          <form ref="formRef" id="ym-checkout-form" @submit.prevent="handlePlaceOrder" novalidate>
            <fieldset class="ym-checkout__fieldset">
              <legend class="ym-checkout__section-title">THÔNG TIN THANH TOÁN</legend>

              <p v-if="formError" class="ym-checkout__error" role="alert">{{ formError }}</p>

              <div class="ym-checkout__row-2col">
                <div class="ym-checkout__field">
                  <label for="ck-fname">Tên <span aria-hidden="true">*</span></label>
                  <input id="ck-fname" v-model="firstName" type="text" autocomplete="given-name" required />
                </div>
                <div class="ym-checkout__field">
                  <label for="ck-lname">Họ <span aria-hidden="true">*</span></label>
                  <input id="ck-lname" v-model="lastName" type="text" autocomplete="family-name" required />
                </div>
              </div>

              <div class="ym-checkout__field">
                <label for="ck-company">Tên công ty (tuỳ chọn)</label>
                <input id="ck-company" v-model="company" type="text" autocomplete="organization" />
              </div>

              <div class="ym-checkout__field">
                <label for="ck-country">Quốc gia/Khu vực <span aria-hidden="true">*</span></label>
                <select id="ck-country" v-model="country" autocomplete="country-name" required>
                  <option>Việt Nam</option>
                  <option>Hoa Kỳ</option>
                  <option>Nhật Bản</option>
                  <option>Hàn Quốc</option>
                </select>
              </div>

              <div class="ym-checkout__field">
                <label for="ck-address">Địa chỉ <span aria-hidden="true">*</span></label>
                <input id="ck-address" v-model="address" type="text" autocomplete="street-address" placeholder="Số nhà, tên đường" required />
              </div>

              <div class="ym-checkout__field">
                <label for="ck-postal">Mã bưu điện (tuỳ chọn)</label>
                <input id="ck-postal" v-model="postalCode" type="text" autocomplete="postal-code" inputmode="numeric" pattern="[0-9]*" />
              </div>

              <div class="ym-checkout__field">
                <label for="ck-city">Tỉnh / Thành phố <span aria-hidden="true">*</span></label>
                <input id="ck-city" v-model="city" type="text" autocomplete="address-level2" required />
              </div>

              <div class="ym-checkout__field">
                <label for="ck-phone">Số điện thoại <span aria-hidden="true">*</span></label>
                <input id="ck-phone" v-model="phone" type="tel" autocomplete="tel" inputmode="tel" pattern="[0-9+\s-]{8,15}" required />
              </div>

              <div class="ym-checkout__field">
                <label for="ck-email">Địa chỉ email <span aria-hidden="true">*</span></label>
                <input id="ck-email" v-model="email" type="email" autocomplete="email" inputmode="email" required />
              </div>
            </fieldset>

            <fieldset class="ym-checkout__fieldset">
              <legend class="ym-checkout__section-title ym-checkout__section-title--extra">THÔNG TIN BỔ SUNG</legend>

              <div class="ym-checkout__field">
                <label for="ck-note">Ghi chú đơn hàng (tuỳ chọn)</label>
                <textarea
                  id="ck-note"
                  v-model="note"
                  rows="4"
                  placeholder="Ghi chú về đơn hàng, ví dụ: thời gian hay chỉ dẫn địa điểm giao hàng chi tiết hơn."
                ></textarea>
              </div>
            </fieldset>

            <!-- Submit button (mobile only, desktop uses sidebar) -->
            <button type="submit" class="ym-checkout__btn-order ym-checkout__btn-order--mobile" :disabled="submitting">
              {{ submitting ? 'ĐANG XỬ LÝ…' : 'ĐẶT HÀNG' }}
            </button>
          </form>
        </div>

        <!-- Right: Order summary -->
        <aside class="ym-checkout__sidebar" aria-label="Tóm tắt đơn hàng">
          <div class="ym-checkout__order-box">
            <h2 class="ym-checkout__order-title">ĐƠN HÀNG CỦA BẠN</h2>

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
              <span aria-live="polite">{{ formatPrice(cartStore.subtotal) }}</span>
            </div>

            <!-- Payment method -->
            <fieldset class="ym-checkout__payment">
              <legend class="visually-hidden">Phương thức thanh toán</legend>
              <label class="ym-checkout__payment-option">
                <input v-model="paymentMethod" type="radio" name="payment" value="bank_transfer" />
                <strong>Chuyển khoản ngân hàng</strong>
              </label>
              <p v-if="paymentMethod === 'bank_transfer'" class="ym-checkout__payment-desc">
                Thực hiện thanh toán vào ngay tài khoản ngân hàng của chúng tôi. Vui lòng sử dụng Mã đơn hàng của bạn trong phần Nội dung thanh toán. Đơn hàng sẽ được giao sau khi tiền đã chuyển.
              </p>

              <label class="ym-checkout__payment-option">
                <input v-model="paymentMethod" type="radio" name="payment" value="cod" />
                <strong>Trả tiền mặt khi nhận hàng</strong>
              </label>
            </fieldset>

            <!-- Liên kết với form bằng `form` attribute để Enter trên field bất kỳ vẫn submit -->
            <button type="submit" form="ym-checkout-form" class="ym-checkout__btn-order" :disabled="submitting">
              {{ submitting ? 'ĐANG XỬ LÝ…' : 'ĐẶT HÀNG' }}
            </button>

            <p class="ym-checkout__privacy-note">
              Thông tin cá nhân của bạn sẽ được sử dụng để xử lý đơn hàng, tăng trải nghiệm sử dụng website, và cho các mục đích cụ thể khác đã được mô tả trong
              <a href="/privacy">chính sách riêng tư</a>.
            </p>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ym-checkout__fieldset {
  border: none;
  padding: 0;
  margin: 0 0 var(--space-6, 24px);
}
</style>
