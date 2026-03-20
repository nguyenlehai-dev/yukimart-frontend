<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useCartStore } from '../../stores/cart'
import { useAuthStore } from '../../stores/auth'

const route = useRoute()
const cartStore = useCartStore()
const authStore = useAuthStore()

const emit = defineEmits<{
  (e: 'openLogin'): void
  (e: 'openCategory'): void
  (e: 'openAccount'): void
}>()

const currentPath = computed(() => route.path)

function handleAccountClick() {
  if (authStore.isLoggedIn) {
    emit('openAccount')
  } else {
    emit('openLogin')
  }
}
</script>

<template>
  <nav class="ym-bottom-nav">
    <RouterLink to="/" class="ym-bottom-nav__item" :class="{ active: currentPath === '/' }">
      <i class="ri-home-4-line"></i>
      <span>Trang chủ</span>
    </RouterLink>

    <RouterLink to="/products" class="ym-bottom-nav__item" :class="{ active: currentPath.startsWith('/products') }">
      <i class="ri-heart-line"></i>
      <span>Yêu thích</span>
    </RouterLink>

    <button class="ym-bottom-nav__item ym-bottom-nav__item--center" @click="$emit('openCategory')">
      <div class="ym-bottom-nav__center-btn">
        <i class="ri-apps-2-line"></i>
      </div>
      <span>Danh mục</span>
    </button>

    <a href="#" class="ym-bottom-nav__item" :class="{ active: currentPath === '/cart' }" @click.prevent="authStore.isLoggedIn ? $router.push('/cart') : $emit('openLogin')">
      <div class="ym-bottom-nav__badge-wrap">
        <i class="ri-shopping-cart-line"></i>
        <span v-if="cartStore.totalItems > 0" class="ym-bottom-nav__badge">{{ cartStore.totalItems }}</span>
      </div>
      <span>Giỏ hàng</span>
    </a>

    <a href="#" class="ym-bottom-nav__item" @click.prevent="handleAccountClick">
      <i class="ri-user-line"></i>
      <span>{{ authStore.isLoggedIn ? 'Tài khoản' : 'Đăng nhập' }}</span>
    </a>
  </nav>
</template>
