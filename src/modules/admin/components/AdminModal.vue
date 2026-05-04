<script setup lang="ts">
import { watch } from 'vue'

const props = defineProps<{
  open: boolean
  title: string
  subtitle?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  hideFooter?: boolean
  confirmText?: string
  cancelText?: string
  confirmTone?: 'primary' | 'danger'
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

function close() {
  emit('update:open', false)
  emit('cancel')
}

watch(
  () => props.open,
  (v) => {
    if (typeof document === 'undefined') return
    document.body.style.overflow = v ? 'hidden' : ''
  }
)
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="open" class="adm-modal" @mousedown.self="close">
        <div :class="['adm-modal__dialog', `adm-modal__dialog--${size || 'md'}`]" @mousedown.stop>
          <header class="adm-modal__header">
            <div>
              <h2>{{ title }}</h2>
              <p v-if="subtitle">{{ subtitle }}</p>
            </div>
            <button type="button" class="adm-modal__close" @click="close" aria-label="Đóng">
              <i class="ri-close-line"></i>
            </button>
          </header>
          <div class="adm-modal__body">
            <slot />
          </div>
          <footer v-if="!hideFooter" class="adm-modal__footer">
            <slot name="footer">
              <button type="button" class="adm-btn" @click="close">{{ cancelText || 'Huỷ' }}</button>
              <button
                type="button"
                :class="['adm-btn', confirmTone === 'danger' ? 'adm-btn--danger' : 'adm-btn--primary']"
                :disabled="loading"
                @click="emit('confirm')"
              >
                <i v-if="loading" class="ri-loader-4-line adm-spin"></i>
                {{ confirmText || 'Lưu' }}
              </button>
            </slot>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.adm-modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(15, 23, 42, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow-y: auto;
}
.adm-modal__dialog {
  background: #fff;
  border-radius: 14px;
  width: 100%;
  max-height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
}
.adm-modal__dialog--sm { max-width: 420px; }
.adm-modal__dialog--md { max-width: 560px; }
.adm-modal__dialog--lg { max-width: 760px; }
.adm-modal__dialog--xl { max-width: 1040px; }

.adm-modal__header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 18px 22px;
  border-bottom: 1px solid #f1f3f5;
}
.adm-modal__header h2 { margin: 0; font-size: 17px; font-weight: 600; color: #111827; }
.adm-modal__header p { margin: 4px 0 0; font-size: 13px; color: #6b7280; }
.adm-modal__close {
  margin-left: auto;
  border: none;
  background: transparent;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  font-size: 22px;
  color: #6b7280;
  cursor: pointer;
}
.adm-modal__close:hover { background: #f3f4f6; color: #1f2937; }

.adm-modal__body {
  padding: 20px 22px;
  overflow-y: auto;
  flex: 1;
}
.adm-modal__footer {
  padding: 14px 22px;
  border-top: 1px solid #f1f3f5;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.adm-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  background: #fff;
  color: #1f2937;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}
.adm-btn:hover { background: #f9fafb; }
.adm-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.adm-btn--primary { background: #326e51; color: #fff; border-color: #326e51; }
.adm-btn--primary:hover:not(:disabled) { background: #285a42; }
.adm-btn--danger { background: #d0021b; color: #fff; border-color: #d0021b; }
.adm-btn--danger:hover:not(:disabled) { background: #b8011a; }
.adm-spin { animation: adm-spin 0.8s linear infinite; }
@keyframes adm-spin { to { transform: rotate(360deg); } }

.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.18s; }
.modal-fade-enter-active .adm-modal__dialog,
.modal-fade-leave-active .adm-modal__dialog { transition: transform 0.2s; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.modal-fade-enter-from .adm-modal__dialog, .modal-fade-leave-to .adm-modal__dialog {
  transform: translateY(20px) scale(0.98);
}
</style>
