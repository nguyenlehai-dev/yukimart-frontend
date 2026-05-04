<script lang="ts">
import { ref } from 'vue'

// Shared singleton: id của menu đang mở (chỉ 1 tại một thời điểm)
const openMenuId = ref<symbol | null>(null)

export function closeAllRowMenus() {
  openMenuId.value = null
}
</script>

<script setup lang="ts">
import { ref as _ref, computed, nextTick, onBeforeUnmount, watch } from 'vue'

defineProps<{
  items: { key: string; label: string; icon: string; tone?: 'danger' | 'default' }[]
}>()

const emit = defineEmits<{ (e: 'select', key: string): void }>()

const myId = Symbol('rowmenu')
const trigger = _ref<HTMLElement | null>(null)
const panel = _ref<HTMLElement | null>(null)
const pos = _ref({ top: 0, left: 0 })

const PANEL_WIDTH = 200

const isOpen = computed(() => openMenuId.value === myId)

function computePosition() {
  if (!trigger.value) return
  const rect = trigger.value.getBoundingClientRect()
  const vh = window.innerHeight
  const vw = window.innerWidth
  const panelH = panel.value?.offsetHeight || 200

  let top = rect.bottom + 4
  if (rect.bottom + panelH > vh - 8 && rect.top - panelH - 8 > 0) {
    top = rect.top - 4 - panelH
  }
  if (top < 8) top = 8

  let left = rect.right - PANEL_WIDTH
  if (left < 8) left = 8
  if (left + PANEL_WIDTH > vw - 8) left = vw - PANEL_WIDTH - 8

  pos.value = { top, left }
}

function toggle() {
  openMenuId.value = isOpen.value ? null : myId
}

function close() {
  if (isOpen.value) openMenuId.value = null
}

function pick(key: string) {
  emit('select', key)
  close()
}

watch(isOpen, async (v) => {
  if (v) {
    await nextTick()
    computePosition()
    // Refine after browser paints panel
    await nextTick()
    computePosition()
  }
})

function onDocClick(e: MouseEvent) {
  if (!isOpen.value) return
  const target = e.target as Node
  if (trigger.value?.contains(target)) return
  if (panel.value?.contains(target)) return
  close()
}

function onScroll() {
  if (isOpen.value) computePosition()
}

document.addEventListener('click', onDocClick, true)
window.addEventListener('scroll', onScroll, true)
window.addEventListener('resize', onScroll)

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick, true)
  window.removeEventListener('scroll', onScroll, true)
  window.removeEventListener('resize', onScroll)
  if (isOpen.value) close()
})

const panelStyle = computed(() => ({
  top: pos.value.top + 'px',
  left: pos.value.left + 'px',
  width: PANEL_WIDTH + 'px',
}))
</script>

<template>
  <div class="adm-rowmenu">
    <button ref="trigger" type="button" class="adm-rowmenu__trigger" @click.stop="toggle" aria-label="Thao tác">
      <i class="ri-more-2-fill"></i>
    </button>
    <Teleport to="body">
      <Transition name="rowmenu">
        <div
          v-if="isOpen"
          ref="panel"
          class="adm-rowmenu__panel"
          :style="panelStyle"
          @click.stop
        >
          <button
            v-for="item in items"
            :key="item.key"
            type="button"
            :class="['adm-rowmenu__item', item.tone === 'danger' ? 'is-danger' : '']"
            @click="pick(item.key)"
          >
            <i :class="item.icon"></i> {{ item.label }}
          </button>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.adm-rowmenu { display: inline-block; }
.adm-rowmenu__trigger {
  border: none;
  background: transparent;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  color: #6b7280;
  cursor: pointer;
  font-size: 16px;
}
.adm-rowmenu__trigger:hover { background: #f3f4f6; color: #1f2937; }
</style>

<style>
.adm-rowmenu__panel {
  position: fixed;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
  padding: 4px;
  z-index: 900;
}
.adm-rowmenu__item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  border: none;
  background: transparent;
  text-align: left;
  border-radius: 6px;
  font-size: 13px;
  color: #1f2937;
  cursor: pointer;
}
.adm-rowmenu__item:hover { background: #f3f4f6; }
.adm-rowmenu__item.is-danger { color: #d0021b; }
.adm-rowmenu__item.is-danger:hover { background: #fee2e2; }
.adm-rowmenu__item i { font-size: 15px; }

.rowmenu-enter-active, .rowmenu-leave-active { transition: opacity 0.12s, transform 0.12s; }
.rowmenu-enter-from, .rowmenu-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
