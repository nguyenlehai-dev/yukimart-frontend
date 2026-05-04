<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { RouterView, RouterLink, useRouter, useRoute } from 'vue-router'
import { navLinks } from '../modules/mypage/home/configs'
import { useAdminDataStore } from '@/modules/admin/stores/adminData'

const __adminStore = useAdminDataStore()
const categoryMenuItems = computed(() => __adminStore.customerMenu)
import { useCartStore } from '../stores/cart'
import { useAuthStore } from '../stores/auth'
import LoginModal from '../components/ui/LoginModal.vue'
import TrustBadges from '../components/common/TrustBadges.vue'
import BackToTop from '../components/common/BackToTop.vue'
import FloatingActions from '../components/common/FloatingActions.vue'
import MobileBottomNav from '../components/common/MobileBottomNav.vue'

const cartStore = useCartStore()
const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

// ── State ──
const searchQuery = ref('')
const searchCategory = ref('all')
const userWrapRef = ref<HTMLElement | null>(null)
const expandedItem = ref<number | null>(null)
const showCategoryDrawer = ref(false)
const showLoginModal = ref(false)
const loginRedirectTo = ref('')
const showUserDropdown = ref(false)
const showMobileAccount = ref(false)

// ── Computed ──
const isHomePage = computed(() => route.path === '/')
const userInitial = computed(() => {
  const name = authStore.userName
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
})

// ── Search ──
function onSubmitSearch() {
  const q = searchQuery.value.trim()
  if (!q) return
  router.push({
    path: '/products',
    query: { q, cat: searchCategory.value !== 'all' ? searchCategory.value : undefined },
  })
}

// ── Drawer / Modal handlers ──
function toggleSubmenu(itemId: number, hasSubmenu: boolean) {
  if (!hasSubmenu) return
  expandedItem.value = expandedItem.value === itemId ? null : itemId
}

function toggleCategoryDrawer() {
  if (window.innerWidth <= 1199) {
    showCategoryDrawer.value = !showCategoryDrawer.value
  }
}

function closeCategoryDrawer() {
  showCategoryDrawer.value = false
}

function openLoginModal(redirect = '') {
  loginRedirectTo.value = redirect
  showLoginModal.value = true
}

function handleCartClick() {
  if (!authStore.isLoggedIn) {
    openLoginModal('/cart')
  } else {
    router.push('/cart')
  }
}

function handleLoginClick() {
  if (authStore.isLoggedIn) {
    showUserDropdown.value = !showUserDropdown.value
  } else {
    openLoginModal('')
  }
}

function closeUserDropdown() {
  showUserDropdown.value = false
}

function handleLogout() {
  authStore.logout()
  showUserDropdown.value = false
  showMobileAccount.value = false
}

function onLoggedIn() {
  if (loginRedirectTo.value) router.push(loginRedirectTo.value)
}

// ── Click outside / keyboard ──
function onDocClick(e: MouseEvent) {
  if (userWrapRef.value && !userWrapRef.value.contains(e.target as Node)) {
    showUserDropdown.value = false
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key !== 'Escape') return
  if (showUserDropdown.value) showUserDropdown.value = false
  else if (showCategoryDrawer.value) closeCategoryDrawer()
  else if (showMobileAccount.value) showMobileAccount.value = false
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onKeydown)
})
onUnmounted(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKeydown)
  document.body.classList.remove('ym-no-scroll')
})

// Lock body scroll khi overlay mở
watch(
  () => showCategoryDrawer.value || showMobileAccount.value || showLoginModal.value,
  (locked) => {
    document.body.classList.toggle('ym-no-scroll', locked)
  },
)

// Đóng overlay khi đổi route
watch(() => route.fullPath, () => {
  showUserDropdown.value = false
  showCategoryDrawer.value = false
  showMobileAccount.value = false
})
</script>

<template>
  <div class="ym-layout">
    <!-- Top Bar -->
    <div class="ym-topbar" role="region" aria-label="Thông báo và liên hệ">
      <div class="container ym-topbar__inner">
        <div class="ym-topbar__marquee" aria-live="off">
          <span class="ym-topbar__marquee-text">Chào mừng đến với YukiMart! | Miễn phí giao hàng cho đơn từ 500K</span>
        </div>
        <a href="tel:0933738798" class="ym-topbar__text ym-topbar__hotline" aria-label="Gọi hotline 093 373 87 98">
          <i class="ri-phone-fill" aria-hidden="true"></i> Hotline: 093 373 87 98
        </a>
      </div>
    </div>

    <!-- Header -->
    <header class="ym-header">
      <div class="container ym-header__inner">
        <!-- Logo -->
        <RouterLink to="/" class="ym-header__logo">
          <div class="ym-header__logo-circle">
            <i class="ri-shopping-cart-2-line"></i>
          </div>
          <div class="ym-header__logo-text">
            <div class="ym-header__logo-brand">
              <strong>YUKI</strong><span>MART</span><sub>.vn</sub>
            </div>
            <small>Chất lượng cho tất cả!</small>
          </div>
        </RouterLink>

        <!-- Search Bar -->
        <form class="ym-header__search" role="search" @submit.prevent="onSubmitSearch">
          <label for="ym-search-cat" class="visually-hidden">Danh mục tìm kiếm</label>
          <select id="ym-search-cat" v-model="searchCategory" class="ym-header__search-select">
            <option value="all">All</option>
            <option value="trang-diem">Trang điểm</option>
            <option value="cham-soc-da">Chăm sóc da</option>
            <option value="cham-soc-toc">Chăm sóc tóc</option>
          </select>
          <label for="ym-search-input" class="visually-hidden">Tìm kiếm sản phẩm</label>
          <input
            id="ym-search-input"
            v-model="searchQuery"
            type="search"
            inputmode="search"
            autocomplete="off"
            class="ym-header__search-input"
            placeholder="Tìm kiếm sản phẩm, danh mục..."
          />
          <button type="submit" class="ym-header__search-btn" aria-label="Tìm kiếm">
            <i class="ri-search-line" aria-hidden="true"></i>
          </button>
        </form>

        <!-- Actions -->
        <div class="ym-header__actions">
          <a href="#" class="ym-header__action" aria-label="Hỗ trợ khách hàng">
            <i class="ri-customer-service-2-line ym-header__action-icon" aria-hidden="true"></i>
            <span class="ym-header__action-text">Hỗ trợ<br/>khách hàng</span>
          </a>
          <button type="button" class="ym-header__action ym-header__action--btn" @click="handleCartClick" :aria-label="`Giỏ hàng, ${cartStore.totalItems} sản phẩm`">
            <div class="ym-header__cart-wrap">
              <i class="ri-shopping-bag-line ym-header__action-icon" aria-hidden="true"></i>
              <span class="ym-header__action-badge" :class="{ 'ym-header__action-badge--active': cartStore.totalItems > 0 }" aria-hidden="true">
                {{ cartStore.totalItems }}
              </span>
            </div>
            <span class="ym-header__action-text">Giỏ<br/>hàng</span>
          </button>
          <!-- User area -->
          <div v-if="authStore.isLoggedIn" class="ym-header__user-wrap" ref="userWrapRef">
            <button
              type="button"
              class="ym-header__action ym-header__action--btn ym-header__action--login"
              :aria-expanded="showUserDropdown"
              aria-haspopup="menu"
              aria-controls="ym-user-dropdown"
              @click="handleLoginClick"
            >
              <img v-if="authStore.user?.avatar" :src="authStore.user.avatar" class="ym-header__user-avatar ym-avatar--img" alt="" />
              <span v-else class="ym-header__user-avatar" aria-hidden="true">{{ userInitial }}</span>
              <span class="ym-header__user-name">{{ authStore.userName }}</span>
              <i class="ri-arrow-down-s-line" :class="{ 'ym-rotate-180': showUserDropdown }" aria-hidden="true"></i>
            </button>
            <!-- Dropdown -->
            <Transition name="dropdown">
              <div v-if="showUserDropdown" id="ym-user-dropdown" class="ym-user-dropdown" role="menu">
                <div class="ym-user-dropdown__header">
                  <img v-if="authStore.user?.avatar" :src="authStore.user.avatar" class="ym-user-dropdown__avatar ym-avatar--img" alt="" />
                  <span v-else class="ym-user-dropdown__avatar" aria-hidden="true">{{ userInitial }}</span>
                  <div class="ym-user-dropdown__info">
                    <strong>{{ authStore.userName }}</strong>
                    <small>{{ authStore.userRole === 'wholesale' ? 'Khách sỉ' : 'Thành viên' }}</small>
                  </div>
                </div>
                <div class="ym-user-dropdown__divider" role="separator"></div>
                <p class="ym-user-dropdown__welcome">
                  Xin chào, <strong>{{ authStore.userName }}</strong>!
                </p>
                <ul class="ym-user-dropdown__menu" role="none">
                  <li role="none"><RouterLink role="menuitem" to="/account?tab=info" @click="closeUserDropdown"><i class="ri-user-line" aria-hidden="true"></i> Tài khoản</RouterLink></li>
                  <li role="none"><RouterLink role="menuitem" to="/account?tab=orders" @click="closeUserDropdown"><i class="ri-shopping-bag-line" aria-hidden="true"></i> Đơn hàng</RouterLink></li>
                  <li role="none"><RouterLink role="menuitem" to="/account?tab=activity" @click="closeUserDropdown"><i class="ri-chat-1-line" aria-hidden="true"></i> Hoạt động</RouterLink></li>
                  <li role="none"><button type="button" role="menuitem" class="ym-user-dropdown__item-btn" @click="closeUserDropdown"><i class="ri-heart-line" aria-hidden="true"></i> Yêu thích</button></li>
                  <li role="none"><button type="button" role="menuitem" class="ym-user-dropdown__item-btn" @click="closeUserDropdown"><i class="ri-settings-3-line" aria-hidden="true"></i> Cài đặt</button></li>
                  <li v-if="authStore.isSuperAdmin" role="none"><RouterLink role="menuitem" to="/admin" @click="closeUserDropdown"><i class="ri-shield-user-line" aria-hidden="true"></i> Trang quản trị</RouterLink></li>
                </ul>
                <div class="ym-user-dropdown__divider" role="separator"></div>
                <ul class="ym-user-dropdown__menu" role="none">
                  <li role="none"><button type="button" role="menuitem" class="ym-user-dropdown__item-btn ym-user-dropdown__logout" @click="handleLogout"><i class="ri-logout-box-r-line" aria-hidden="true"></i> Đăng xuất</button></li>
                </ul>
              </div>
            </Transition>
          </div>
          <button v-else type="button" class="ym-header__action ym-header__action--btn ym-header__action--login" @click="handleLoginClick">
            ĐĂNG NHẬP / ĐĂNG KÝ
          </button>
        </div>
      </div>
    </header>

    <!-- Navigation -->
    <nav class="ym-nav">
      <div class="container ym-nav__inner">
        <button class="ym-nav__link ym-nav__link--cat" @click="toggleCategoryDrawer">
          <i class="ri-menu-line"></i> DANH MỤC SẢN PHẨM
        </button>
        <div class="ym-nav__scroll">
          <RouterLink
            v-for="(item, idx) in navLinks"
            :key="idx"
            :to="item.link"
            class="ym-nav__link"
            :class="{ 'ym-nav__link--has-badge': item.badge }"
          >
            <i v-if="item.icon" class="ri-fire-fill"></i>
            {{ item.label }}
            <span v-if="item.badge" class="ym-nav__badge-new">{{ item.badge }}</span>
          </RouterLink>
        </div>
      </div>
    </nav>

    <!-- Mobile Category Drawer -->
    <Transition name="fade">
      <div v-if="showCategoryDrawer" class="ym-drawer-overlay" @click="closeCategoryDrawer"></div>
    </Transition>
    <Transition name="slide-left">
      <div v-if="showCategoryDrawer" class="ym-drawer">
        <div class="ym-drawer__header">
          <h4>DANH MỤC SẢN PHẨM</h4>
          <button class="ym-drawer__close" @click="closeCategoryDrawer">
            <i class="ri-close-line"></i>
          </button>
        </div>
        <ul class="ym-drawer__list">
          <li v-for="item in categoryMenuItems" :key="item.id" class="ym-drawer__item">
            <!-- Item with submenu: use div to avoid touch issues -->
            <div
              v-if="item.submenu"
              class="ym-drawer__link"
              :class="{ 'ym-drawer__link--expanded': expandedItem === item.id }"
              @click="toggleSubmenu(item.id, true)"
            >
              {{ item.name }}
              <i class="ri-arrow-right-s-line ym-drawer__arrow" :class="{ 'ym-drawer__arrow--open': expandedItem === item.id }"></i>
            </div>
            <!-- Item without submenu: regular link -->
            <RouterLink
              v-else
              :to="item.link"
              class="ym-drawer__link"
              @click="closeCategoryDrawer"
            >
              {{ item.name }}
            </RouterLink>
            <!-- Submenu accordion -->
            <div v-if="item.submenu && expandedItem === item.id" class="ym-drawer__submenu">
              <div v-for="(col, idx) in item.submenu.columns" :key="idx" class="ym-drawer__sub-group">
                <h5 class="ym-drawer__sub-title">{{ col.title }}</h5>
                <ul class="ym-drawer__sub-list">
                  <li v-for="sub in col.items" :key="sub">
                    <a href="#" class="ym-drawer__sub-link" @click="closeCategoryDrawer">{{ sub }}</a>
                  </li>
                </ul>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </Transition>

    <!-- Login Modal -->
    <LoginModal
      v-model="showLoginModal"
      @logged-in="onLoggedIn"
    />

    <!-- Main Content -->
    <main class="ym-main">
      <RouterView />
    </main>

    <!-- Global Trust Badges -->
    <TrustBadges v-if="!isHomePage" />

    <!-- Back to top -->
    <BackToTop />

    <!-- Floating Contact Buttons -->
    <FloatingActions />

    <!-- Mobile Bottom Navigation -->
    <MobileBottomNav
      @open-login="openLoginModal('')"
      @open-category="toggleCategoryDrawer"
      @open-account="showMobileAccount = !showMobileAccount"
    />

    <!-- Mobile Account Bottom Sheet -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showMobileAccount" class="ym-mobile-account-overlay" @click="showMobileAccount = false"></div>
      </Transition>
      <Transition name="slide-up">
        <div v-if="showMobileAccount" class="ym-mobile-account">
          <div class="ym-mobile-account__header">
            <img v-if="authStore.user?.avatar" :src="authStore.user.avatar" class="ym-mobile-account__avatar" style="object-fit: cover; background: white;" />
            <span v-else class="ym-mobile-account__avatar">{{ userInitial }}</span>
            <div class="ym-mobile-account__info">
              <strong>{{ authStore.userName }}</strong>
              <small>{{ authStore.userRole === 'wholesale' ? 'Khách sỉ' : 'Thành viên' }}</small>
            </div>
            <button class="ym-mobile-account__close" @click="showMobileAccount = false">
              <i class="ri-close-line"></i>
            </button>
          </div>
          <ul class="ym-mobile-account__menu">
            <li><RouterLink to="/account?tab=info" @click="showMobileAccount = false"><i class="ri-user-line" aria-hidden="true"></i> Tài khoản</RouterLink></li>
            <li><RouterLink to="/account?tab=orders" @click="showMobileAccount = false"><i class="ri-shopping-bag-line" aria-hidden="true"></i> Đơn hàng</RouterLink></li>
            <li><RouterLink to="/account?tab=activity" @click="showMobileAccount = false"><i class="ri-chat-1-line" aria-hidden="true"></i> Hoạt động</RouterLink></li>
            <li><button type="button" class="ym-mobile-account__item-btn" @click="showMobileAccount = false"><i class="ri-heart-line" aria-hidden="true"></i> Yêu thích</button></li>
            <li><button type="button" class="ym-mobile-account__item-btn" @click="showMobileAccount = false"><i class="ri-settings-3-line" aria-hidden="true"></i> Cài đặt</button></li>
            <li v-if="authStore.isSuperAdmin"><RouterLink to="/admin" @click="showMobileAccount = false"><i class="ri-shield-user-line" aria-hidden="true"></i> Trang quản trị</RouterLink></li>
          </ul>
          <div class="ym-mobile-account__divider" role="separator"></div>
          <ul class="ym-mobile-account__menu">
            <li><button type="button" class="ym-mobile-account__item-btn ym-mobile-account__logout" @click="handleLogout"><i class="ri-logout-box-r-line" aria-hidden="true"></i> Đăng xuất</button></li>
          </ul>
        </div>
      </Transition>
    </Teleport>

    <!-- Footer -->
    <footer class="ym-footer">
      <div class="container">
        <!-- Top 4 columns -->
        <div class="ym-footer__grid">
          <div class="ym-footer__col">
            <h4>FANPAGE FACEBOOK</h4>
            <div class="ym-footer__social">
              <a href="#" class="ym-footer__social-btn ym-footer__social-btn--fb" aria-label="Facebook" rel="noopener"><i class="ri-facebook-fill" aria-hidden="true"></i></a>
              <a href="#" class="ym-footer__social-btn ym-footer__social-btn--tw" aria-label="X (Twitter)" rel="noopener"><i class="ri-twitter-x-fill" aria-hidden="true"></i></a>
              <a href="mailto:hello@yukimart.vn" class="ym-footer__social-btn ym-footer__social-btn--mail" aria-label="Email"><i class="ri-mail-fill" aria-hidden="true"></i></a>
              <a href="#" class="ym-footer__social-btn ym-footer__social-btn--wa" aria-label="WhatsApp" rel="noopener"><i class="ri-whatsapp-fill" aria-hidden="true"></i></a>
            </div>
          </div>
          <div class="ym-footer__col">
            <h4>HỖ TRỢ KHÁCH HÀNG</h4>
            <ul>
              <li>Hotline: <strong>093 373 87 98</strong></li>
              <li>(1000đ/phut, 8-22h kể cả T7, CN)</li>
              <li><a href="#">Các câu hỏi thường gặp</a></li>
              <li><a href="#">Gửi yêu cầu hỗ trợ</a></li>
              <li><a href="#">Hướng dẫn đặt hàng</a></li>
              <li><a href="#">Phương thức vận chuyển</a></li>
              <li><a href="#">Chính sách đổi trả</a></li>
            </ul>
          </div>
          <div class="ym-footer__col">
            <h4>VỀ YUKIMART.VN</h4>
            <ul>
              <li><a href="#">Phiếu mua hàng</a></li>
              <li><a href="#">Giới thiệu YukiMart.vn</a></li>
              <li><a href="#">Tuyển dụng</a></li>
              <li><a href="#">Chính sách bảo mật</a></li>
              <li><a href="#">Điều khoản sử dụng</a></li>
              <li><a href="#">Liên hệ</a></li>
            </ul>
          </div>
          <div class="ym-footer__col">
            <h4>HỢP TÁC &amp; LIÊN KẾT</h4>
            <ul>
              <li><a href="#">http://YukiMart.vn</a></li>
            </ul>
            <h4 class="mt-3">TẢI ỨNG DỤNG</h4>
            <div class="ym-footer__apps">
              <a href="#" class="ym-footer__app-btn">
                <i class="ri-apple-fill"></i> App Store
              </a>
              <a href="#" class="ym-footer__app-btn">
                <i class="ri-google-play-fill"></i> Google Play
              </a>
            </div>
          </div>
        </div>

        <!-- Description / SEO -->
        <div class="ym-footer__desc">
          <h4>ĐẸP</h4>
          <p>
            Đẹp - là một từ mà mọi người đều khát khao có được. Đẹp đi đôi với khoẻ mạnh, đẹp đi đôi với sự lựa chọn thông minh. Đẹp toát ra từ
            vẻ ngoài tươi tắn tràn đầy năng lượng sống. Chính vì vậy sức khỏe và làm đẹp ngày càng được nhiều người quan tâm để hướng đến cuộc sống
            tươi vui, hạnh phúc hơn. Sức khỏe tốt được biểu hiện qua làn da nõn nà, mịn màng, vóc dáng cân đối, mái tóc bóng bẩy và hàm răng khỏe
            khoắn. Thấu hiểu nhu cầu đó, các hãng mỹ phẩm không ngừng nghiên cứu và cho ra đời hàng nghìn loại mỹ phẩm làm đẹp đa dạng chủng
            loại. Nhiều nhóm hàng mỹ phẩm bao gồm chăm sóc da, chăm sóc tóc, chăm sóc toàn thân, chăm sóc cá nhân, nước hoa, lăn khử mùi,... ra đời để
            đáp ứng nhu cầu đẹp của con người.
          </p>
          <p>
            YukiMart luôn tôn trọng khách hàng, lấy niềm vui, sự hài lòng của khách hàng làm động lực, không ngừng tìm kiếm các sản phẩm tốt nhất
            để mỗi khách hàng đều có thể trở nên tự tin và xinh đẹp hơn. Các thương hiệu mỹ phẩm ở YukiMart đều là các thương hiệu uy tín, được
            mọi người tin dùng như: Secret Key, Laneige, Vichy, Avene, Yves Rocher, La Roche-Posay, Lancôme,... Bên cạnh đó, khi mua hàng ở YukiMart,
            khách luôn được giá ưu đãi tốt nhất, dịch vụ nhanh chóng &amp; nhiều chương trình khuyến mãi khác.
          </p>
        </div>

        <!-- Bottom company info -->
        <div class="ym-footer__bottom">
          <div class="ym-footer__bottom-left">
            <p><strong>Bản quyền © 2026 YukiMart.vn</strong></p>
            <p><strong>Công Ty TNHH YUKIMART MART</strong></p>
            <ul>
              <li><i class="ri-map-pin-line"></i> Địa chỉ giao dịch:</li>
              <li>524 Lý Thường Kiệt, Phường 7, Tân Bình, Ho Chi Minh City, Vietnam, 700000</li>
            </ul>
            <p>Hotline: <strong>093 373 87 98</strong></p>
          </div>
          <!-- <div class="ym-footer__bottom-right">
            <p>Giấy chứng nhận Đăng ký Kinh doanh số 0313612829 do Sở Kế
            hoạch và Đầu tư Thành phố Hồ Chí Minh cấp ngày 13/01/2016</p>
          </div> -->
        </div>
      </div>
    </footer>
  </div>
</template>
