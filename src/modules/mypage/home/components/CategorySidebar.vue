<script setup lang="ts">
import { ref, computed } from 'vue'
import type { CategoryMenu } from '../configs'
import { useAdminDataStore } from '@/modules/admin/stores/adminData'

const store = useAdminDataStore()
// Đồng bộ menu với admin: chỉ hiện danh mục active + showOnMenu
const categoryMenuItems = computed<CategoryMenu[]>(() => store.customerMenu as any)

const hoveredItem = ref<CategoryMenu | null>(null)
let hoverTimeout: ReturnType<typeof setTimeout> | null = null

// Touch detection
const isTouchDevice = () => 'ontouchstart' in window || navigator.maxTouchPoints > 0

const onMouseEnterItem = (item: CategoryMenu) => {
  if (isTouchDevice()) return
  if (hoverTimeout) clearTimeout(hoverTimeout)
  hoveredItem.value = item
}

const onMouseLeaveItem = () => {
  if (isTouchDevice()) return
  hoverTimeout = setTimeout(() => {
    hoveredItem.value = null
  }, 150)
}

const onMouseEnterDropdown = () => {
  if (hoverTimeout) clearTimeout(hoverTimeout)
}

const onMouseLeaveDropdown = () => {
  hoveredItem.value = null
}

// Click/touch support
const onClickItem = (item: CategoryMenu, event: Event) => {
  if (!item.submenu) return
  event.preventDefault()
  if (hoveredItem.value?.id === item.id) {
    hoveredItem.value = null
  } else {
    hoveredItem.value = item
  }
}
</script>

<template>
  <div class="ym-category-sidebar">
    <ul class="ym-category-sidebar__list">
      <li
        v-for="item in categoryMenuItems"
        :key="item.id"
        class="ym-category-sidebar__item"
        :class="{ 'ym-category-sidebar__item--active': hoveredItem?.id === item.id }"
        @mouseenter="onMouseEnterItem(item)"
        @mouseleave="onMouseLeaveItem"
        @focusin="onMouseEnterItem(item)"
      >
        <RouterLink
          :to="item.link"
          class="ym-category-sidebar__link"
          :aria-haspopup="item.submenu ? 'menu' : undefined"
          :aria-expanded="item.submenu ? hoveredItem?.id === item.id : undefined"
          @click="item.submenu ? onClickItem(item, $event) : undefined"
        >
          <span class="ym-category-sidebar__name">{{ item.name }}</span>
          <i v-if="item.submenu" class="ri-arrow-right-s-line ym-category-sidebar__arrow" aria-hidden="true"></i>
        </RouterLink>
      </li>
    </ul>

    <!-- Mega Menu Dropdown -->
    <Transition name="fade">
      <div
        v-if="hoveredItem?.submenu"
        class="ym-megamenu"
        role="menu"
        :aria-label="hoveredItem.name"
        @mouseenter="onMouseEnterDropdown"
        @mouseleave="onMouseLeaveDropdown"
        @focusin="onMouseEnterDropdown"
        @focusout="onMouseLeaveDropdown"
      >
        <div class="ym-megamenu__content">
          <div class="ym-megamenu__columns">
            <div
              v-for="(col, idx) in hoveredItem.submenu.columns"
              :key="idx"
              class="ym-megamenu__col"
            >
              <h4 class="ym-megamenu__col-title">{{ col.title }}</h4>
              <ul class="ym-megamenu__col-list">
                <li v-for="subItem in col.items" :key="subItem">
                  <a href="#" role="menuitem" class="ym-megamenu__col-link">{{ subItem }}</a>
                </li>
              </ul>
            </div>
          </div>
          <div v-if="hoveredItem.submenu.image" class="ym-megamenu__image">
            <img :src="hoveredItem.submenu.image" :alt="hoveredItem.name" loading="lazy" decoding="async" />
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>
