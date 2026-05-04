<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

interface MenuItem {
  to: string
  label: string
  badge?: string
  icon?: string
}
interface MenuColumn {
  title?: string
  items: MenuItem[]
}
interface NavItem {
  key: string
  label: string
  to?: string
  columns?: MenuColumn[]
}

defineProps<{
  navItems: NavItem[]
}>()

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

const openKey = ref<string | null>(null)
const userMenuOpen = ref(false)
const userInitial = computed(() => (authStore.userName?.[0] || 'A').toUpperCase())

let closeTimer: ReturnType<typeof setTimeout> | null = null
function open(key: string) {
  if (closeTimer) clearTimeout(closeTimer)
  openKey.value = key
}
function scheduleClose() {
  if (closeTimer) clearTimeout(closeTimer)
  closeTimer = setTimeout(() => {
    openKey.value = null
  }, 160)
}
function close() {
  if (closeTimer) clearTimeout(closeTimer)
  openKey.value = null
}
function toggleUserMenu() { userMenuOpen.value = !userMenuOpen.value }
async function handleLogout() {
  await authStore.logout()
  router.push('/')
}

function isItemActive(to: string) {
  return route.path === to || route.path.startsWith(to + '/')
}
function isNavItemActive(item: NavItem) {
  if (item.to && isItemActive(item.to)) return true
  if (item.columns) {
    for (const col of item.columns) {
      for (const it of col.items) {
        if (isItemActive(it.to)) return true
      }
    }
  }
  return false
}

function onNavClick(item: NavItem) {
  if (item.to) {
    router.push(item.to)
  }
  close()
}

function onDocClick(e: MouseEvent) {
  const el = e.target as HTMLElement
  if (!el.closest('.adm-topnav')) {
    close()
    userMenuOpen.value = false
  }
}
document.addEventListener('click', onDocClick)
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  if (closeTimer) clearTimeout(closeTimer)
})
</script>

<template>
  <header class="adm-topnav">
    <div class="adm-topnav__inner">
      <RouterLink to="/admin" class="adm-topnav__brand" @click="close">
        <i class="ri-leaf-line"></i>
        <span>YukiMart Admin</span>
      </RouterLink>

      <nav class="adm-topnav__nav">
        <ul>
          <li
            v-for="item in navItems"
            :key="item.key"
            :class="['adm-topnav__item', { 'is-active': isNavItemActive(item), 'has-menu': item.columns?.length, 'is-open': openKey === item.key }]"
            @mouseenter="item.columns?.length && open(item.key)"
            @mouseleave="item.columns?.length && scheduleClose()"
          >
            <button type="button" class="adm-topnav__link" @click="onNavClick(item)">
              {{ item.label }}
              <i v-if="item.columns?.length" class="ri-arrow-down-s-line"></i>
            </button>

            <div v-if="item.columns?.length && openKey === item.key" class="adm-topnav__mega" @mouseenter="open(item.key)" @mouseleave="scheduleClose()">
              <div class="adm-topnav__mega-cols">
                <div v-for="(col, idx) in item.columns" :key="idx" class="adm-topnav__mega-col">
                  <h4 v-if="col.title">{{ col.title }}</h4>
                  <RouterLink
                    v-for="sub in col.items"
                    :key="sub.to"
                    :to="sub.to"
                    :class="['adm-topnav__sub', { 'is-active': isItemActive(sub.to) }]"
                    @click="close"
                  >
                    <i v-if="sub.icon" :class="sub.icon"></i>
                    <span>{{ sub.label }}</span>
                    <span v-if="sub.badge" class="adm-topnav__badge">{{ sub.badge }}</span>
                  </RouterLink>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </nav>

      <div class="adm-topnav__right">
        <button type="button" class="adm-topnav__icon-btn" aria-label="Thông báo">
          <i class="ri-notification-3-line"></i>
          <span class="adm-topnav__count">3</span>
        </button>
        <div class="adm-topnav__user">
          <button type="button" class="adm-topnav__user-btn" @click.stop="toggleUserMenu">
            <span class="adm-topnav__avatar">{{ userInitial }}</span>
            <span class="adm-topnav__user-name">{{ authStore.userName || 'Admin' }}</span>
            <i class="ri-arrow-down-s-line"></i>
          </button>
          <div v-if="userMenuOpen" class="adm-topnav__user-menu">
            <RouterLink to="/account?tab=info" class="adm-topnav__user-menu-item" @click="userMenuOpen = false">
              <i class="ri-user-line"></i> Tài khoản
            </RouterLink>
            <RouterLink to="/" class="adm-topnav__user-menu-item" @click="userMenuOpen = false">
              <i class="ri-store-2-line"></i> Về cửa hàng
            </RouterLink>
            <button type="button" class="adm-topnav__user-menu-item is-danger" @click="handleLogout">
              <i class="ri-logout-box-r-line"></i> Đăng xuất
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.adm-topnav {
  background: linear-gradient(180deg, #1c5a3f 0%, #245d44 100%);
  color: #fff;
  flex-shrink: 0;
  z-index: 100;
  position: relative;
}
.adm-topnav__inner {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 24px;
  min-height: 56px;
}

.adm-topnav__brand {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #fff;
  text-decoration: none;
  font-weight: 700;
  font-size: 15px;
  white-space: nowrap;
  padding-right: 12px;
  border-right: 1px solid rgba(255, 255, 255, 0.15);
  margin-right: 4px;
}
.adm-topnav__brand i { font-size: 20px; }

.adm-topnav__nav {
  flex: 1;
  min-width: 0;
}
.adm-topnav__nav ul {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: 0;
}
.adm-topnav__item {
  position: relative;
}
.adm-topnav__link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0 18px;
  height: 56px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.92);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s;
}
.adm-topnav__link:hover { background: rgba(255, 255, 255, 0.1); color: #fff; }
.adm-topnav__item.is-active > .adm-topnav__link {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  font-weight: 600;
}
.adm-topnav__item.is-open > .adm-topnav__link {
  background: #fff;
  color: #1c5a3f;
}

/* Mega menu */
.adm-topnav__mega {
  position: absolute;
  top: 100%;
  left: 0;
  background: #fff;
  border-radius: 0 0 10px 10px;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.15);
  min-width: 280px;
  padding: 8px;
  animation: adm-fade-in 0.15s ease;
}
@keyframes adm-fade-in {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}
.adm-topnav__mega-cols {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 4px;
}
.adm-topnav__mega-col h4 {
  margin: 0;
  padding: 10px 14px 6px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: #6b7280;
  border-bottom: 1px solid #f1f3f5;
  margin-bottom: 4px;
}
.adm-topnav__sub {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 14px;
  border-radius: 6px;
  text-decoration: none;
  color: #1f2937;
  font-size: 14px;
  white-space: nowrap;
  transition: background 0.12s;
}
.adm-topnav__sub:hover { background: #f3f6f4; color: #326e51; }
.adm-topnav__sub.is-active {
  background: #e8f0ec;
  color: #326e51;
  font-weight: 600;
}
.adm-topnav__sub i { font-size: 15px; color: #6b7280; width: 16px; text-align: center; }
.adm-topnav__sub.is-active i { color: #326e51; }
.adm-topnav__badge {
  margin-left: auto;
  background: #d0021b;
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 999px;
}

/* Right side */
.adm-topnav__right {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
}
.adm-topnav__icon-btn {
  position: relative;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.92);
  font-size: 18px;
  border-radius: 50%;
  cursor: pointer;
}
.adm-topnav__icon-btn:hover { background: rgba(255, 255, 255, 0.15); }
.adm-topnav__count {
  position: absolute;
  top: 4px;
  right: 4px;
  min-width: 14px;
  height: 14px;
  padding: 0 3px;
  background: #d0021b;
  color: #fff;
  font-size: 9px;
  font-weight: 700;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.adm-topnav__user { position: relative; }
.adm-topnav__user-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px 4px 4px;
  border: none;
  background: transparent;
  color: #fff;
  border-radius: 999px;
  cursor: pointer;
  font-size: 14px;
}
.adm-topnav__user-btn:hover { background: rgba(255, 255, 255, 0.15); }
.adm-topnav__avatar {
  width: 30px; height: 30px;
  border-radius: 50%;
  background: #f7c948;
  color: #1c5a3f;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 13px;
}
.adm-topnav__user-name { font-weight: 500; }

.adm-topnav__user-menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  min-width: 200px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  padding: 6px;
  z-index: 110;
}
.adm-topnav__user-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 9px 12px;
  border: none;
  background: transparent;
  border-radius: 6px;
  color: #1f2937;
  font-size: 14px;
  text-decoration: none;
  cursor: pointer;
  text-align: left;
}
.adm-topnav__user-menu-item:hover { background: #f3f4f6; }
.adm-topnav__user-menu-item.is-danger { color: #d0021b; }

/* Mobile: hide nav text in narrower screens */
@media (max-width: 1024px) {
  .adm-topnav__user-name { display: none; }
}
@media (max-width: 768px) {
  .adm-topnav__nav { display: none; }
}
</style>
