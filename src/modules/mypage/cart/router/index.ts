import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/cart',
    name: 'cart',
    component: () => import('../views/CartView.vue'),
    meta: { module: 'cart' },
  },
  {
    path: '/checkout',
    name: 'checkout',
    component: () => import('../views/CheckoutView.vue'),
    meta: { module: 'cart' },
  },
  {
    path: '/order-confirm',
    name: 'order-confirm',
    component: () => import('../views/OrderConfirmView.vue'),
    meta: { module: 'cart' },
  },
]

export default routes
