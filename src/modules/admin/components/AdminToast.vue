<script setup lang="ts">
import { useToast } from '../composables/useToast'

const { toasts, dismiss } = useToast()

const iconMap = {
  success: 'ri-checkbox-circle-line',
  error: 'ri-close-circle-line',
  info: 'ri-information-line',
  warning: 'ri-error-warning-line',
}
</script>

<template>
  <Teleport to="body">
    <div class="adm-toast-stack" aria-live="polite">
      <TransitionGroup name="toast">
        <div v-for="t in toasts" :key="t.id" :class="['adm-toast', `adm-toast--${t.tone}`]">
          <i :class="iconMap[t.tone]"></i>
          <div class="adm-toast__body">
            <strong>{{ t.title }}</strong>
            <p v-if="t.message">{{ t.message }}</p>
          </div>
          <button type="button" class="adm-toast__close" @click="dismiss(t.id)">
            <i class="ri-close-line"></i>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.adm-toast-stack {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1100;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
}
.adm-toast {
  pointer-events: auto;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  min-width: 280px;
  max-width: 380px;
  padding: 12px 14px;
  background: #fff;
  border-radius: 10px;
  border-left: 4px solid #326e51;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}
.adm-toast > i {
  font-size: 20px;
  flex-shrink: 0;
  color: #326e51;
}
.adm-toast__body { flex: 1; min-width: 0; }
.adm-toast__body strong { display: block; color: #111827; font-size: 14px; }
.adm-toast__body p { margin: 2px 0 0; font-size: 13px; color: #4b5563; }
.adm-toast__close {
  border: none;
  background: transparent;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  color: #9ca3af;
  cursor: pointer;
  font-size: 16px;
}
.adm-toast__close:hover { background: #f3f4f6; color: #1f2937; }

.adm-toast--success { border-left-color: #166534; }
.adm-toast--success > i { color: #166534; }
.adm-toast--error { border-left-color: #d0021b; }
.adm-toast--error > i { color: #d0021b; }
.adm-toast--warning { border-left-color: #92400e; }
.adm-toast--warning > i { color: #92400e; }
.adm-toast--info { border-left-color: #1e40af; }
.adm-toast--info > i { color: #1e40af; }

.toast-enter-active, .toast-leave-active { transition: all 0.25s; }
.toast-enter-from { opacity: 0; transform: translateX(20px); }
.toast-leave-to { opacity: 0; transform: translateX(20px); }
</style>
