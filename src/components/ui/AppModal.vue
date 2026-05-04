<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, useId, watch } from 'vue'

const props = withDefaults(defineProps<{
  modelValue: boolean
  title?: string
  width?: string
  closeOnBackdrop?: boolean
  closeOnEscape?: boolean
}>(), {
  closeOnBackdrop: true,
  closeOnEscape: true,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const dialogRef = ref<HTMLElement | null>(null)
const previousFocus = ref<HTMLElement | null>(null)
const titleId = `modal-title-${useId()}`
const labelledBy = computed(() => (props.title ? titleId : undefined))

function close() {
  emit('update:modelValue', false)
  emit('cancel')
}

function getFocusable(): HTMLElement[] {
  if (!dialogRef.value) return []
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ')
  return Array.from(dialogRef.value.querySelectorAll<HTMLElement>(selector))
}

function onKeydown(e: KeyboardEvent) {
  if (!props.modelValue) return

  if (e.key === 'Escape' && props.closeOnEscape) {
    e.stopPropagation()
    close()
    return
  }

  if (e.key !== 'Tab') return

  const focusable = getFocusable()
  if (focusable.length === 0) return

  const first = focusable[0]
  const last = focusable[focusable.length - 1]

  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault()
    first.focus()
  }
}

watch(() => props.modelValue, async (open) => {
  if (open) {
    previousFocus.value = document.activeElement as HTMLElement
    document.addEventListener('keydown', onKeydown)
    document.body.classList.add('ym-no-scroll')
    await nextTick()
    const focusable = getFocusable()
    if (focusable.length) focusable[0].focus()
    else dialogRef.value?.focus()
  } else {
    document.removeEventListener('keydown', onKeydown)
    document.body.classList.remove('ym-no-scroll')
    previousFocus.value?.focus?.()
    previousFocus.value = null
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
  document.body.classList.remove('ym-no-scroll')
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="modal-backdrop"
        @click.self="closeOnBackdrop && close()"
      >
        <div
          ref="dialogRef"
          class="modal-dialog"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="labelledBy"
          :style="{ maxWidth: width || '500px' }"
          tabindex="-1"
        >
          <div class="modal-header">
            <h3 v-if="title" :id="titleId" class="modal-title">{{ title }}</h3>
            <button
              type="button"
              class="modal-close"
              aria-label="Đóng"
              @click="close"
            >
              <i class="ri-close-line" aria-hidden="true"></i>
            </button>
          </div>

          <div class="modal-body">
            <slot></slot>
          </div>

          <div v-if="$slots.footer" class="modal-footer">
            <slot name="footer"></slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: var(--space-4, 16px);
  z-index: var(--z-modal, 1050);
}
.modal-dialog {
  background: white;
  width: 100%;
  max-height: calc(100vh - 32px);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  outline: none;
}
.modal-header {
  padding: var(--space-5, 20px) var(--space-6, 24px);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-3, 12px);
}
.modal-title {
  font-size: var(--text-lg);
  font-weight: var(--font-weight-semibold);
  margin: 0;
  color: var(--color-text);
}
.modal-close {
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: var(--color-text-muted);
  border-radius: var(--radius-md);
  transition: background var(--transition-fast), color var(--transition-fast);
}
.modal-close:hover {
  color: var(--color-text);
  background: var(--color-bg-hover);
}
.modal-close:focus { outline: none; }
.modal-close:focus-visible { box-shadow: var(--focus-ring); }

.modal-body {
  padding: var(--space-6, 24px);
  overflow-y: auto;
  flex: 1;
}
.modal-footer {
  padding: var(--space-4, 16px) var(--space-6, 24px);
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3, 12px);
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to { opacity: 0; }

.modal-enter-active .modal-dialog {
  animation: modal-pop 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modal-pop {
  0% { transform: scale(0.96) translateY(8px); opacity: 0; }
  100% { transform: scale(1) translateY(0); opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .modal-enter-active,
  .modal-leave-active { transition: none; }
  .modal-enter-active .modal-dialog { animation: none; }
}
</style>
