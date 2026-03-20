<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../../../stores/auth'
import AccountInfo from './tabs/AccountInfo.vue'
import AccountOrders from './tabs/AccountOrders.vue'
import AccountActivity from './tabs/AccountActivity.vue'
import AccountPurchaseHistory from './tabs/AccountPurchaseHistory.vue'
import AccountInvoices from './tabs/AccountInvoices.vue'
import AccountTerms from './tabs/AccountTerms.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const pageReady = ref(false)

// ── Protect Route ──
onMounted(async () => {
  if (!authStore.initialized) {
    await authStore.hydrate()
  }
  if (!authStore.isLoggedIn) {
    router.push('/?login=true')
  } else {
    pageReady.value = true
  }
})

// ── Tab Management ──
const activeTab = ref(route.query.tab ? String(route.query.tab) : 'info')

watch(
  () => route.query.tab,
  (newTab) => {
    if (newTab) {
      activeTab.value = String(newTab)
    } else {
      activeTab.value = 'info'
    }
  }
)

function setTab(tabName: string) {
  activeTab.value = tabName
  router.push({ query: { tab: tabName } })
}

// ── User Data ──
const userInitial = computed(() => {
  const name = authStore.userName
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
})

const userRoleText = computed(() => {
  switch(authStore.userRole) {
    case 'admin': return 'Quản trị viên'
    case 'wholesale': return 'Khách sỉ'
    default: return 'Khách hàng'
  }
})

function handleLogout() {
  authStore.logout()
  router.push('/')
}
</script>

<template>
  <div class="ym-acc-layout" v-if="pageReady && authStore.isLoggedIn">
    <!-- Premium Header Area -->
    <div class="ym-acc-header-bg"></div>

    <div class="container ym-acc-container">
      <div class="ym-acc-grid">
        
        <!-- Premium Sidebar -->
        <aside class="ym-acc-sidebar">
          <div class="ym-acc-profile-card">
            <div class="ym-acc-profile-card__cover"></div>
            <div class="ym-acc-profile-card__avatar-wrap">
              <div class="ym-acc-profile-card__avatar">
                <img v-if="authStore.user?.avatar" :src="authStore.user.avatar" alt="Avatar" class="ym-acc-profile-card__avatar-img" />
                <span v-else>{{ userInitial }}</span>
              </div>
            </div>
            <div class="ym-acc-profile-card__info">
              <h3 class="ym-acc-profile-card__name">{{ authStore.userName }}</h3>
              <p class="ym-acc-profile-card__email">{{ authStore.user?.email || '' }}</p>
              <span class="ym-acc-profile-card__badge">{{ userRoleText }}</span>
            </div>
          </div>

          <nav class="ym-acc-nav">
            
            <div class="ym-acc-nav-group-title">TÀI KHOẢN</div>
            <button type="button" class="ym-acc-nav__item" :class="{ 'ym-acc-nav__item--active': activeTab === 'info' }" @click="setTab('info')">
              <i class="ri-user-smile-line"></i> <span>Thông tin</span>
            </button>
            <button type="button" class="ym-acc-nav__item" :class="{ 'ym-acc-nav__item--active': activeTab === 'orders' }" @click="setTab('orders')">
              <i class="ri-shopping-basket-line"></i> <span>Đơn hàng</span>
            </button>
            <button type="button" class="ym-acc-nav__item" :class="{ 'ym-acc-nav__item--active': activeTab === 'activity' }" @click="setTab('activity')">
              <i class="ri-discuss-line"></i> <span>Hoạt động</span>
            </button>

            <div class="ym-acc-nav__divider mt-3"></div>
            
            <div class="ym-acc-nav-group-title">DỊCH VỤ & HÓA ĐƠN</div>
            <button type="button" class="ym-acc-nav__item" :class="{ 'ym-acc-nav__item--active': activeTab === 'purchase_history' }" @click="setTab('purchase_history')">
              <i class="ri-history-line"></i> <span>Lịch sử mua hàng</span>
            </button>
            <button type="button" class="ym-acc-nav__item" :class="{ 'ym-acc-nav__item--active': activeTab === 'invoices' }" @click="setTab('invoices')">
              <i class="ri-receipt-line"></i> <span>Hóa đơn điện tử</span>
            </button>

            <div class="ym-acc-nav__divider mt-3"></div>
            
            <div class="ym-acc-nav-group-title">KHÁC</div>
            <button type="button" class="ym-acc-nav__item" :class="{ 'ym-acc-nav__item--active': activeTab === 'terms' }" @click="setTab('terms')">
              <i class="ri-article-line"></i> <span>Điều khoản sử dụng</span>
            </button>

            <div class="ym-acc-nav__divider mt-3"></div>
            
            <button type="button" class="ym-acc-nav__item ym-acc-nav__item--danger" @click="handleLogout">
              <i class="ri-logout-circle-line"></i> <span>Đăng xuất</span>
            </button>
          </nav>
        </aside>

        <!-- Main Workspace -->
        <main class="ym-acc-main">
          <Transition name="fade-slide" mode="out-in">
            <div :key="activeTab" class="ym-acc-panel">
              <AccountInfo v-if="activeTab === 'info'" />
              <AccountOrders v-else-if="activeTab === 'orders'" />
              <AccountActivity v-else-if="activeTab === 'activity'" />
              <AccountPurchaseHistory v-else-if="activeTab === 'purchase_history'" />
              <AccountInvoices v-else-if="activeTab === 'invoices'" />
              <AccountTerms v-else-if="activeTab === 'terms'" />
            </div>
          </Transition>
        </main>

      </div>
    </div>
  </div>
</template>
