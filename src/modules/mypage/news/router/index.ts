import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/news',
    name: 'news',
    component: () => import('../views/NewsView.vue'),
    meta: { module: 'news' },
  },
  {
    path: '/news/:slug',
    name: 'news-detail',
    component: () => import('../views/NewsDetailView.vue'),
    meta: { module: 'news' },
  },
]

export default routes
