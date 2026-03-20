import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/campaign/wow',
    name: 'campaign-wow',
    component: () => import('../views/CampaignView.vue'),
    meta: { module: 'campaign' },
  },
]

export default routes
