import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/admin',
    name: 'admin',
    component: () => import('../views/DashboardView.vue'),
    meta: { module: 'admin', requiresAuth: true, layout: 'AdminLayout' },
  },
]

export default routes
