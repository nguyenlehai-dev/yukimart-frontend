<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useCartStore } from '../../stores/cart'
import { useAuthStore } from '../../stores/auth'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()
const authStore = useAuthStore()

const emit = defineEmits<{
  (e: 'openLogin'): void
  (e: 'openCategory'): void
  (e: 'openAccount'): void
}>()

const currentPath = computed(() => route.path)

function handleAccountClick() {
  if (authStore.isLoggedIn) emit('openAccount')
  else emit('openLogin')
}

function handleCartClick() {
  if (authStore.isLoggedIn) router.push('/cart')
  else emit('openLogin')
}
</script>

<template>
  <nav class="ym-bottom-nav" aria-label="Điều hướng chính">
    <RouterLink to="/" class="ym-bottom-nav__item" :class="{ active: currentPath === '/' }" :aria-current="currentPath === '/' ? 'page' : undefined">
      <i class="ri-home-4-line" aria-hidden="true"></i>
      <span>Trang chủ</span>
    </RouterLink>

    <RouterLink to="/products" class="ym-bottom-nav__item" :class="{ active: currentPath.startsWith('/products') }" :aria-current="currentPath.startsWith('/products') ? 'page' : undefined">
      <i class="ri-heart-line" aria-hidden="true"></i>
      <span>Yêu thích</span>
    </RouterLink>

    <button
      type="button"
      class="ym-bottom-nav__item ym-bottom-nav__item--center"
      aria-label="Mở danh mục sản phẩm"
      @click="emit('openCategory')"
    >
      <div class="ym-bottom-nav__center-btn" aria-hidden="true">
        <i class="ri-apps-2-line"></i>
      </div>
      <span>Danh mục</span>
    </button>

    <button
      type="button"
      class="ym-bottom-nav__item"
      :class="{ active: currentPath === '/cart' }"
      :aria-label="`Giỏ hàng${cartStore.totalItems > 0 ? `, ${cartStore.totalItems} sản phẩm` : ''}`"
      :aria-current="currentPath === '/cart' ? 'page' : undefined"
      @click="handleCartClick"
    >
      <div class="ym-bottom-nav__badge-wrap">
        <i class="ri-shopping-cart-line" aria-hidden="true"></i>
        <span v-if="cartStore.totalItems > 0" class="ym-bottom-nav__badge" aria-hidden="true">{{ cartStore.totalItems }}</span>
      </div>
      <span>Giỏ hàng</span>
    </button>

    <button type="button" class="ym-bottom-nav__item" @click="handleAccountClick">
      <i class="ri-user-line" aria-hidden="true"></i>
      <span>{{ authStore.isLoggedIn ? 'Tài khoản' : 'Đăng nhập' }}</span>
    </button>
  </nav>
</template>
