<script setup lang="ts">
import { computed, defineAsyncComponent, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DefaultLayout from './layouts/DefaultLayout.vue'
import { useAdminDataStore } from '@/modules/admin/stores/adminData'
import { useShopBusinessStore } from '@/modules/admin/stores/shopBusiness'
import { useAuthStore } from '@/stores/auth'

const AdminLayout = defineAsyncComponent(() => import('./layouts/AdminLayout.vue'))

const route = useRoute()
const router = useRouter()
const shopStore = useAdminDataStore()
const business = useShopBusinessStore()
const authStore = useAuthStore()

// Đợi router resolve điều hướng đầu tiên + auth hydrate trước khi render layout.
// Có timeout 8s để tránh splash treo vĩnh viễn nếu BE/api lỗi (vd /api/user
// hang) — sau timeout vẫn render UI, các page tự xử fallback unauth.
const ready = ref(false)
const initTimeout = setTimeout(() => {
  if (!ready.value) {
    console.warn('[App] init timeout — continue without full hydration')
    ready.value = true
  }
}, 8000)
Promise.all([router.isReady(), authStore.hydrate()]).finally(() => {
  clearTimeout(initTimeout)
  ready.value = true
})

const layout = computed(() => {
  const name = (route.meta?.layout as string) || 'DefaultLayout'
  return name === 'AdminLayout' ? AdminLayout : DefaultLayout
})

async function ensureShopData() {
  // Chỉ chạy khi route đã resolve thật, tránh fire với route.path = '/' rỗng
  // ban đầu (khi reload /admin/x sẽ gây 1 lượt fetchPublicHome thừa).
  if (!ready.value) return

  const isAdmin = route.path.startsWith('/admin') || route.meta?.layout === 'AdminLayout'
  if (isAdmin) {
    if (route.path === '/admin/products' || route.path === '/admin/categories') {
      await shopStore.fetchCatalogData()
      return
    }
    if (route.path === '/admin/price-list') {
      await shopStore.fetchProductStats()
      return
    }
    if (route.path === '/admin/product-comments') {
      return
    }
    if (route.path === '/admin/sections') {
      await shopStore.fetchAll({ all: 1, limit: 300 })
      return
    }
    await shopStore.fetchAll({ all: 1, limit: 300 })
    business.ensureSeeded()
    return
  }

  await shopStore.fetchPublicHome()
}

watch(() => [ready.value, route.path, route.meta?.layout], ensureShopData, { immediate: true })

// Khi products vừa load xong (sau API), trigger seed transactions
watch(() => shopStore.products.length, () => {
  if (route.meta?.layout === 'AdminLayout') business.ensureSeeded()
})
</script>

<template>
  <component v-if="ready" :is="layout" />
  <div v-else class="ym-app-splash" aria-busy="true" role="status">
    <div class="ym-app-splash__spinner" aria-hidden="true"></div>
  </div>
</template>

<style scoped>
.ym-app-splash {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  z-index: 9999;
}
.ym-app-splash__spinner {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(50, 110, 81, 0.15);
  border-top-color: #326e51;
  border-radius: 50%;
  animation: ym-app-splash-spin 0.7s linear infinite;
}
@keyframes ym-app-splash-spin {
  to { transform: rotate(360deg); }
}
</style>
