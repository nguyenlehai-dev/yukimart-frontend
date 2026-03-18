import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

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

export default router
