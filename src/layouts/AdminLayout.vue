<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AdminToast from '@/modules/admin/components/AdminToast.vue'
import ErrorBoundary from '@/components/common/ErrorBoundary.vue'
import { useAdminDataStore } from '@/modules/admin/stores/adminData'
import { useToast } from '@/modules/admin/composables/useToast'

const authStore = useAuthStore()
const adminData = useAdminDataStore()
const toast = useToast()
const route = useRoute()
const router = useRouter()

const sidebarOpen = ref(false)
const userMenuOpen = ref(false)
const userMenuRef = ref<HTMLElement | null>(null)

interface NavItem {
  to: string
  label: string
  icon: string
  badge?: string
  exact?: boolean
}
interface NavGroup {
  title: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    title: 'Tổng quan',
    items: [
      { to: '/admin', label: 'Dashboard', icon: 'ri-dashboard-line', exact: true },
    ],
  },
  {
    title: 'Hàng hóa',
    items: [
      { to: '/admin/products', label: 'Sản phẩm', icon: 'ri-store-2-line' },
      { to: '/admin/categories', label: 'Danh mục', icon: 'ri-folder-line' },
      { to: '/admin/product-comments', label: 'Bình luận', icon: 'ri-message-3-line' },
      { to: '/admin/sections', label: 'Khu vực hiển thị', icon: 'ri-layout-grid-line' },
      { to: '/admin/price-list', label: 'Thiết lập giá', icon: 'ri-price-tag-3-line' },
    ],
  },
  {
    title: 'Nội dung',
    items: [
      { to: '/admin/brands', label: 'Thương hiệu', icon: 'ri-price-tag-3-line' },
      { to: '/admin/news', label: 'Tin tức', icon: 'ri-article-line' },
      { to: '/admin/promotions', label: 'Khuyến mãi', icon: 'ri-megaphone-line' },
    ],
  },
  {
    title: 'Kho hàng',
    items: [
      { to: '/admin/inventory', label: 'Tồn kho', icon: 'ri-archive-line' },
      { to: '/admin/stock-transfer', label: 'Chuyển hàng', icon: 'ri-truck-line' },
      { to: '/admin/stock-check', label: 'Kiểm kho', icon: 'ri-checkbox-multiple-line' },
      { to: '/admin/stock-internal', label: 'Xuất dùng nội bộ', icon: 'ri-share-forward-line', badge: 'Mới' },
      { to: '/admin/stock-disposal', label: 'Xuất hủy', icon: 'ri-delete-bin-2-line' },
    ],
  },
  {
    title: 'Mua hàng',
    items: [
      { to: '/admin/suppliers', label: 'Nhà cung cấp', icon: 'ri-store-line' },
      { to: '/admin/purchase-invoices', label: 'Hóa đơn đầu vào', icon: 'ri-bill-line', badge: 'Mới' },
      { to: '/admin/purchase-orders', label: 'Nhập hàng', icon: 'ri-arrow-down-circle-line' },
      { to: '/admin/purchase-returns', label: 'Trả hàng nhập', icon: 'ri-arrow-go-back-line' },
    ],
  },
  {
    title: 'Đơn hàng',
    items: [
      { to: '/admin/orders', label: 'Đặt hàng', icon: 'ri-shopping-bag-line' },
      { to: '/admin/invoices', label: 'Hóa đơn', icon: 'ri-file-list-3-line' },
      { to: '/admin/sales-returns', label: 'Trả hàng', icon: 'ri-arrow-go-back-line' },
      { to: '/admin/shipping-partners', label: 'Đối tác giao hàng', icon: 'ri-truck-line' },
      { to: '/admin/shipments', label: 'Vận đơn', icon: 'ri-ship-line' },
    ],
  },
  {
    title: 'Khách hàng',
    items: [
      { to: '/admin/customers', label: 'Khách hàng', icon: 'ri-user-3-line' },
      { to: '/admin/customer-groups', label: 'Nhóm khách hàng', icon: 'ri-group-line' },
    ],
  },
  {
    title: 'Báo cáo',
    items: [
      { to: '/admin/reports/sales', label: 'Bán hàng', icon: 'ri-line-chart-line' },
      { to: '/admin/reports/inventory', label: 'Tồn kho', icon: 'ri-archive-line' },
      { to: '/admin/reports/finance', label: 'Tài chính', icon: 'ri-money-dollar-circle-line' },
    ],
  },
  {
    title: 'Hệ thống',
    items: [
      { to: '/admin/activity-log', label: 'Nhật ký hệ thống', icon: 'ri-history-line' },
      { to: '/admin/settings', label: 'Cài đặt', icon: 'ri-settings-3-line' },
    ],
  },
]

// Mỗi group mặc định mở. Click tiêu đề để collapse.
const collapsed = ref<Set<string>>(new Set())
function toggleGroup(title: string) {
  collapsed.value.has(title) ? collapsed.value.delete(title) : collapsed.value.add(title)
  collapsed.value = new Set(collapsed.value)
}

const userInitial = computed(() => (authStore.userName?.[0] || 'A').toUpperCase())

function toggleSidebar() { sidebarOpen.value = !sidebarOpen.value }
function closeSidebar() { sidebarOpen.value = false }
function toggleUserMenu() { userMenuOpen.value = !userMenuOpen.value }

async function handleLogout() {
  await authStore.logout()
  router.push('/')
}

async function handleRefreshData() {
  await adminData.fetchAll()
  toast.success('Đã đồng bộ dữ liệu', 'Tải lại từ server.')
  userMenuOpen.value = false
}

function onClickOutside(e: MouseEvent) {
  if (userMenuRef.value && !userMenuRef.value.contains(e.target as Node)) {
    userMenuOpen.value = false
  }
}

function isActive(item: NavItem) {
  if (item.exact) return route.path === item.to
  return route.path === item.to || route.path.startsWith(item.to + '/')
}

function isGroupActive(group: NavGroup) {
  return group.items.some((it) => isActive(it))
}

onMounted(() => document.addEventListener('click', onClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', onClickOutside))
</script>

<template>
  <div class="ym-admin">
    <!-- Sidebar -->
    <aside class="ym-admin__sidebar" :class="{ 'is-open': sidebarOpen }">
      <div class="ym-admin__brand">
        <i class="ri-leaf-line"></i>
        <span>YukiMart Admin</span>
      </div>
      <nav class="ym-admin__nav">
        <div v-for="group in navGroups" :key="group.title" class="ym-admin__nav-group">
          <button
            type="button"
            class="ym-admin__nav-title"
            :class="{ 'is-active': isGroupActive(group), 'is-collapsed': collapsed.has(group.title) }"
            @click="toggleGroup(group.title)"
          >
            <span>{{ group.title }}</span>
            <i :class="collapsed.has(group.title) ? 'ri-add-line' : 'ri-subtract-line'"></i>
          </button>
          <div v-show="!collapsed.has(group.title)" class="ym-admin__nav-items">
            <RouterLink
              v-for="item in group.items"
              :key="item.to"
              :to="item.to"
              :class="['ym-admin__nav-item', { 'is-active': isActive(item) }]"
              @click="closeSidebar"
            >
              <i :class="item.icon" aria-hidden="true"></i>
              <span>{{ item.label }}</span>
              <span v-if="item.badge" class="ym-admin__nav-badge">{{ item.badge }}</span>
            </RouterLink>
          </div>
        </div>
      </nav>
      <RouterLink to="/" class="ym-admin__back" @click="closeSidebar">
        <i class="ri-arrow-left-line"></i> Về trang khách hàng
      </RouterLink>
    </aside>

    <div v-if="sidebarOpen" class="ym-admin__overlay" @click="closeSidebar"></div>

    <!-- Main -->
    <div class="ym-admin__main">
      <header class="ym-admin__header">
        <button class="ym-admin__menu-btn" type="button" @click="toggleSidebar" aria-label="Toggle menu">
          <i class="ri-menu-line"></i>
        </button>
        <div class="ym-admin__breadcrumb">
          <i class="ri-home-4-line"></i>
          <span>Quản trị</span>
        </div>
        <div class="ym-admin__header-actions">
          <button class="ym-admin__icon-btn" type="button" aria-label="Thông báo">
            <i class="ri-notification-3-line"></i>
            <span class="ym-admin__badge">3</span>
          </button>
          <div ref="userMenuRef" class="ym-admin__user">
            <button type="button" class="ym-admin__user-btn" @click="toggleUserMenu">
              <span class="ym-admin__avatar">{{ userInitial }}</span>
              <span class="ym-admin__user-name">{{ authStore.userName || 'Admin' }}</span>
              <i class="ri-arrow-down-s-line"></i>
            </button>
            <div v-if="userMenuOpen" class="ym-admin__user-menu">
              <RouterLink to="/account?tab=info" class="ym-admin__user-menu-item" @click="userMenuOpen = false">
                <i class="ri-user-line"></i> Tài khoản
              </RouterLink>
              <RouterLink to="/" class="ym-admin__user-menu-item" @click="userMenuOpen = false">
                <i class="ri-store-2-line"></i> Về cửa hàng
              </RouterLink>
              <button type="button" class="ym-admin__user-menu-item" @click="handleRefreshData">
                <i class="ri-refresh-line"></i> Đồng bộ lại dữ liệu
              </button>
              <button type="button" class="ym-admin__user-menu-item is-danger" @click="handleLogout">
                <i class="ri-logout-box-r-line"></i> Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </header>

      <main class="ym-admin__content">
        <ErrorBoundary>
          <RouterView />
        </ErrorBoundary>
      </main>
    </div>
    <AdminToast />
  </div>
</template>

<style scoped>
.ym-admin {
  height: 100vh;
  height: 100dvh;
  display: flex;
  overflow: hidden;
  background: #f4f6f8;
  color: #1f2937;
}

/* Sidebar */
.ym-admin__sidebar {
  width: 240px;
  flex-shrink: 0;
  background: #fff;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  height: 100%;
  z-index: 50;
}

.ym-admin__brand {
  flex-shrink: 0;
  height: 60px;
  padding: 0 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 16px;
  color: #326e51;
  border-bottom: 1px solid #e5e7eb;
}
.ym-admin__brand i { font-size: 20px; }

.ym-admin__nav {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}
.ym-admin__nav::-webkit-scrollbar { width: 6px; }
.ym-admin__nav::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 3px; }
.ym-admin__nav::-webkit-scrollbar-thumb:hover { background: #d1d5db; }

.ym-admin__nav-group { padding: 4px 0; }
.ym-admin__nav-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin: 6px 0 4px;
  padding: 6px 20px;
  border: none;
  background: transparent;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: #9ca3af;
  cursor: pointer;
  text-align: left;
}
.ym-admin__nav-title:hover { color: #6b7280; }
.ym-admin__nav-title.is-active { color: #326e51; }
.ym-admin__nav-title i { font-size: 14px; }
.ym-admin__nav-items { display: flex; flex-direction: column; }

.ym-admin__nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 20px;
  color: #4b5563;
  font-size: 14px;
  text-decoration: none;
  border-left: 3px solid transparent;
  transition: background 0.15s, color 0.15s;
}
.ym-admin__nav-item i {
  font-size: 16px;
  width: 18px;
  text-align: center;
  flex-shrink: 0;
}
.ym-admin__nav-item:hover {
  background: #f3f6f4;
  color: #326e51;
}
.ym-admin__nav-item.is-active {
  background: #e8f0ec;
  color: #326e51;
  border-left-color: #326e51;
  font-weight: 600;
}
.ym-admin__nav-badge {
  margin-left: auto;
  background: #d0021b;
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 999px;
}

.ym-admin__back {
  flex-shrink: 0;
  padding: 14px 20px;
  border-top: 1px solid #e5e7eb;
  color: #6b7280;
  font-size: 13px;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 6px;
  background: #fff;
}
.ym-admin__back:hover { color: #326e51; }

.ym-admin__overlay { display: none; }

/* Main */
.ym-admin__main {
  flex: 1;
  min-width: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ym-admin__header {
  flex-shrink: 0;
  height: 60px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  padding: 0 20px;
  gap: 12px;
  z-index: 40;
}
.ym-admin__menu-btn {
  display: none;
  border: none;
  background: transparent;
  font-size: 22px;
  color: #4b5563;
  cursor: pointer;
}
.ym-admin__breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #6b7280;
  font-size: 14px;
}
.ym-admin__header-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 12px;
}

.ym-admin__icon-btn {
  position: relative;
  border: none;
  background: transparent;
  font-size: 20px;
  color: #4b5563;
  cursor: pointer;
  padding: 6px;
  border-radius: 8px;
}
.ym-admin__icon-btn:hover { background: #f3f4f6; }
.ym-admin__badge {
  position: absolute;
  top: 0;
  right: 0;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 8px;
  background: #d0021b;
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ym-admin__user { position: relative; }
.ym-admin__user-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid transparent;
  background: transparent;
  padding: 4px 10px 4px 4px;
  border-radius: 999px;
  cursor: pointer;
  font-size: 14px;
  color: #1f2937;
}
.ym-admin__user-btn:hover { background: #f3f4f6; }
.ym-admin__avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #326e51;
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 13px;
}
.ym-admin__user-name { font-weight: 500; }

.ym-admin__user-menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  min-width: 220px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  padding: 6px;
  z-index: 60;
}
.ym-admin__user-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  border: none;
  background: transparent;
  border-radius: 6px;
  color: #1f2937;
  font-size: 14px;
  text-decoration: none;
  cursor: pointer;
  text-align: left;
}
.ym-admin__user-menu-item:hover { background: #f3f4f6; }
.ym-admin__user-menu-item.is-danger { color: #d0021b; }

/* Content */
.ym-admin__content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  overflow-x: hidden;
}

/* Mobile */
@media (max-width: 992px) {
  .ym-admin__sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    height: 100dvh;
    transform: translateX(-100%);
    transition: transform 0.25s;
  }
  .ym-admin__sidebar.is-open {
    transform: translateX(0);
  }
  .ym-admin__overlay {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 45;
  }
  .ym-admin__menu-btn { display: inline-flex; }
  .ym-admin__user-name { display: none; }
  .ym-admin__content { padding: 16px; }
}
</style>
