<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { RouterView, RouterLink, useRouter, useRoute } from 'vue-router'
import { navLinks, categoryMenuItems } from '../modules/mypage/home/configs'
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

// ── Click-outside for user dropdown ──
const userWrapRef = ref<HTMLElement | null>(null)

function onDocClick(e: MouseEvent) {
  if (userWrapRef.value && !userWrapRef.value.contains(e.target as Node)) {
    showUserDropdown.value = false
  }
}

onMounted(() => document.addEventListener('click', onDocClick))
onUnmounted(() => document.removeEventListener('click', onDocClick))

const isHomePage = computed(() => route.path === '/')

const expandedItem = ref<number | null>(null)

const toggleSubmenu = (itemId: number, hasSubmenu: boolean) => {
  if (!hasSubmenu) return
  expandedItem.value = expandedItem.value === itemId ? null : itemId
}

const showCategoryDrawer = ref(false)

const toggleCategoryDrawer = () => {
  if (window.innerWidth <= 1199) {
    showCategoryDrawer.value = !showCategoryDrawer.value
  }
}

const closeCategoryDrawer = () => {
  showCategoryDrawer.value = false
}

// ── Login modal ──
const showLoginModal = ref(false)
const loginRedirectTo = ref('')

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

// ── User dropdown ──
const showUserDropdown = ref(false)

function closeUserDropdown() {
  showUserDropdown.value = false
}

function handleLogout() {
  authStore.logout()
  showUserDropdown.value = false
  showMobileAccount.value = false
}

// ── Mobile account panel ──
const showMobileAccount = ref(false)

function onLoggedIn() {
  if (loginRedirectTo.value) {
    router.push(loginRedirectTo.value)
  }
}

// Tên viết tắt (lấy chữ cái đầu)
const userInitial = computed(() => {
  const name = authStore.userName
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
})
</script>

<template>
  <div class="ym-layout">
    <!-- Top Bar -->
    <div class="ym-topbar">
      <div class="container ym-topbar__inner">
        <div class="ym-topbar__marquee">
          <span class="ym-topbar__marquee-text">Chào mừng đến với YukiMart! | Miễn phí giao hàng cho đơn từ 500K</span>
        </div>
        <span class="ym-topbar__text ym-topbar__hotline"><i class="ri-phone-fill"></i> Hotline: 093 373 87 98</span>
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
        <div class="ym-header__search">
          <select class="ym-header__search-select">
            <option>All</option>
            <option>Trang điểm</option>
            <option>Chăm sóc da</option>
            <option>Chăm sóc tóc</option>
          </select>
          <input
            type="text"
            class="ym-header__search-input"
            placeholder="Tìm kiếm sản phẩm, danh mục..."
          />
          <button class="ym-header__search-btn">
            <i class="ri-search-line"></i>
          </button>
        </div>

        <!-- Actions -->
        <div class="ym-header__actions">
          <a href="#" class="ym-header__action">
            <i class="ri-customer-service-2-line ym-header__action-icon"></i>
            <span class="ym-header__action-text">Hỗ trợ<br/>khách hàng</span>
          </a>
          <a href="#" class="ym-header__action" @click.prevent="handleCartClick">
            <div class="ym-header__cart-wrap">
              <i class="ri-shopping-bag-line ym-header__action-icon"></i>
              <span class="ym-header__action-badge" :class="{ 'ym-header__action-badge--active': cartStore.totalItems > 0 }">
                {{ cartStore.totalItems }}
              </span>
            </div>
            <span class="ym-header__action-text">Giỏ<br/>hàng</span>
          </a>
          <!-- User area -->
          <div v-if="authStore.isLoggedIn" class="ym-header__user-wrap" ref="userWrapRef">
            <a href="#" class="ym-header__action ym-header__action--login" @click.prevent="handleLoginClick">
              <img v-if="authStore.user?.avatar" :src="authStore.user.avatar" class="ym-header__user-avatar" style="object-fit: cover; background: white;" />
              <span v-else class="ym-header__user-avatar">{{ userInitial }}</span>
              <span class="ym-header__user-name">{{ authStore.userName }}</span>
              <i class="ri-arrow-down-s-line"></i>
            </a>
            <!-- Dropdown -->
            <Transition name="dropdown">
              <div v-if="showUserDropdown" class="ym-user-dropdown">
                <div class="ym-user-dropdown__header">
                  <img v-if="authStore.user?.avatar" :src="authStore.user.avatar" class="ym-user-dropdown__avatar" style="object-fit: cover; background: white;" />
                  <span v-else class="ym-user-dropdown__avatar">{{ userInitial }}</span>
                  <div class="ym-user-dropdown__info">
                    <strong>{{ authStore.userName }}</strong>
                    <small>{{ authStore.userRole === 'wholesale' ? 'Khách sỉ' : 'Thành viên' }}</small>
                  </div>
                </div>
                <div class="ym-user-dropdown__divider"></div>
                <p class="ym-user-dropdown__welcome">
                  Xin chào, <strong>{{ authStore.userName }}</strong>!
                </p>
                <ul class="ym-user-dropdown__menu">
                  <li><RouterLink to="/account?tab=info" @click="closeUserDropdown"><i class="ri-user-line"></i> Tài khoản</RouterLink></li>
                  <li><RouterLink to="/account?tab=orders" @click="closeUserDropdown"><i class="ri-shopping-bag-line"></i> Đơn hàng</RouterLink></li>
                  <li><RouterLink to="/account?tab=activity" @click="closeUserDropdown"><i class="ri-chat-1-line"></i> Hoạt động</RouterLink></li>
                  <li><a href="#" @click.prevent="closeUserDropdown"><i class="ri-heart-line"></i> Yêu thích</a></li>
                  <li><a href="#" @click.prevent="closeUserDropdown"><i class="ri-settings-3-line"></i> Cài đặt</a></li>
                </ul>
                <div class="ym-user-dropdown__divider"></div>
                <ul class="ym-user-dropdown__menu">
                  <li><a href="#" class="ym-user-dropdown__logout" @click.prevent="handleLogout"><i class="ri-logout-box-r-line"></i> Đăng xuất</a></li>
                </ul>
              </div>
            </Transition>
          </div>
          <a v-else href="#" class="ym-header__action ym-header__action--login" @click.prevent="handleLoginClick">
            ĐĂNG NHẬP / ĐĂNG KÝ
          </a>
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
            <li><RouterLink to="/account?tab=info" @click="showMobileAccount = false"><i class="ri-user-line"></i> Tài khoản</RouterLink></li>
            <li><RouterLink to="/account?tab=orders" @click="showMobileAccount = false"><i class="ri-shopping-bag-line"></i> Đơn hàng</RouterLink></li>
            <li><RouterLink to="/account?tab=activity" @click="showMobileAccount = false"><i class="ri-chat-1-line"></i> Hoạt động</RouterLink></li>
            <li><a href="#" @click.prevent="showMobileAccount = false"><i class="ri-heart-line"></i> Yêu thích</a></li>
            <li><a href="#" @click.prevent="showMobileAccount = false"><i class="ri-settings-3-line"></i> Cài đặt</a></li>
          </ul>
          <div class="ym-mobile-account__divider"></div>
          <ul class="ym-mobile-account__menu">
            <li><a href="#" class="ym-mobile-account__logout" @click.prevent="handleLogout"><i class="ri-logout-box-r-line"></i> Đăng xuất</a></li>
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
              <a href="#" class="ym-footer__social-btn ym-footer__social-btn--fb"><i class="ri-facebook-fill"></i></a>
              <a href="#" class="ym-footer__social-btn ym-footer__social-btn--tw"><i class="ri-twitter-x-fill"></i></a>
              <a href="#" class="ym-footer__social-btn ym-footer__social-btn--mail"><i class="ri-mail-fill"></i></a>
              <a href="#" class="ym-footer__social-btn ym-footer__social-btn--wa"><i class="ri-whatsapp-fill"></i></a>
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
            Đẹp - Là một từ mà mọi người đều khát khao có nằm lòn nó. Đẹp đi đôi với khoẻ mạnh, đẹp đi đội với sự lựa chọn thông minh. Đẹp toát ra từ
            vẻ ngoài tươi tắn tràn đầy năng lượng sống. Chính vì vậy sức khỏe và làm đẹp ngày càng được nhiều người quan tâm để hướng đến cuộc sống
            tươi vui, hạnh phúc hơn. Sức khỏe tốt được biểu hiện qua làn da nõn nào, mịn màng, vóc dáng cân đối, mái tóc bóng bẩy và nàm rằng khỏe
            khoắn. Thấu hiểu nhu cầu đó, các hãng mỹ phẩm không ngừng nghiên cứu và cho ra đời hàng nghìn loại mỹ phẩm làm đẹp đa dạng chủng
            loại. Nhiều nhóm hàng mỹ phẩm bao gồm chăm sóc da, chăm sóc tóc, chăm sóc toàn thân, chăm sóc cá nhân, nước hoa lăn lưới ra đời và
            cạnh hoa đó đặp ứng nhu cầu đẹp của con người.
          </p>
          <p>
            YukiMart luôn tôn trọng khách hàng, lấy niềm vui, sự hài lòng của khách hàng để làm động lực, không ngừng tìm kiếm các sản phẩm tốt nhất
            để mỗi khách hàng đều có thể tỏ nên tu tin và xinh đẹp hơn. Các hãng thương hiệu mỹ phẩm ở YukiMart luôn là các thương hiệu uy tín, được
            mọi người tin dùng như : Secret Key, Laneige, Vichy, Avene, Yves Rocher, Laroche Posay, Lancôme,... Bên cạnh đó khi mua hàng ở YukiMart,
            khách luôn được giá ưu đãi tốt nhất, dịch vụ nhanh chóng &amp; nhiều chương trình Khuyến Mãi khác.
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
