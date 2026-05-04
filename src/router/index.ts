import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

/*
 * Dynamic Route Loader
 *
 * Tu dong quet tat ca file router.ts trong src/modules/ va collect routes.
 *
 * Them module moi: tao folder src/modules/[ten-module]/ + router.ts
 * Router chinh se tu dong nhan routes, khong can sua file nay.
 */

// Eagerly import tất cả router.ts từ các modules
const moduleRouteFiles = import.meta.glob<{ default: RouteRecordRaw[] }>(
  '../modules/**/router/index.ts',
  { eager: true }
)

// Collect tất cả routes từ các modules
const moduleRoutes: RouteRecordRaw[] = []

for (const path in moduleRouteFiles) {
  const mod = moduleRouteFiles[path]
  if (mod.default) {
    moduleRoutes.push(...mod.default)
  }
}

const router = createRouter({
  history: createWebHistory(),
  routes: moduleRoutes,
})

// Guard: chỉ Super Admin mới vào được /admin/*. Các user khác bị đẩy về trang chủ.
router.beforeEach(async (to) => {
  const requiresAdmin = to.path === '/admin' || to.path.startsWith('/admin/')
  if (!requiresAdmin) return true

  const authStore = useAuthStore()
  if (!authStore.initialized) {
    await authStore.hydrate()
  }

  if (!authStore.isLoggedIn || !authStore.isSuperAdmin) {
    return { path: '/', replace: true }
  }
  return true
})

export default router
