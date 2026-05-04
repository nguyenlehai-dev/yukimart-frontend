<script setup lang="ts">
import { computed, defineAsyncComponent, watch } from 'vue'
import { useRoute } from 'vue-router'
import DefaultLayout from './layouts/DefaultLayout.vue'
import { useAdminDataStore } from '@/modules/admin/stores/adminData'
import { useShopBusinessStore } from '@/modules/admin/stores/shopBusiness'

const AdminLayout = defineAsyncComponent(() => import('./layouts/AdminLayout.vue'))

const route = useRoute()
const shopStore = useAdminDataStore()
const business = useShopBusinessStore()

const layout = computed(() => {
  const name = (route.meta?.layout as string) || 'DefaultLayout'
  return name === 'AdminLayout' ? AdminLayout : DefaultLayout
})

async function ensureShopData() {
  const isAdmin = route.path.startsWith('/admin') || route.meta?.layout === 'AdminLayout'
  if (isAdmin) {
    if (route.path === '/admin/products') {
      await shopStore.fetchCatalogData()
      return
    }
    await shopStore.fetchAll({ all: 1 })
    business.ensureSeeded()
    return
  }

  await shopStore.fetchPublicHome()
}

watch(() => [route.path, route.meta?.layout], ensureShopData, { immediate: true })

// Khi products vừa load xong (sau API), trigger seed transactions
watch(() => shopStore.products.length, () => {
  if (route.meta?.layout === 'AdminLayout') business.ensureSeeded()
})
</script>

<template>
  <component :is="layout" />
</template>
