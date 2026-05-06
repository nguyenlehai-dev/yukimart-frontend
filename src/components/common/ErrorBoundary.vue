<script setup lang="ts">
import { onErrorCaptured, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

interface Props {
  /** Reset error khi đổi route — mặc định bật để user navigate ra chỗ khác là hết lỗi. */
  resetOnRouteChange?: boolean
}
const props = withDefaults(defineProps<Props>(), { resetOnRouteChange: true })

const error = ref<Error | null>(null)
const route = useRoute()

onErrorCaptured((err) => {
  error.value = err as Error
  // Log để dev debug; production có thể gửi sang Sentry/...
  console.error('[ErrorBoundary]', err)
  return false // chặn lan ra Vue global handler
})

watch(() => route.fullPath, () => {
  if (props.resetOnRouteChange) error.value = null
})

function reload() {
  window.location.reload()
}
function reset() {
  error.value = null
}
</script>

<template>
  <div v-if="error" class="ym-errboundary" role="alert">
    <div class="ym-errboundary__icon" aria-hidden="true">
      <i class="ri-error-warning-line"></i>
    </div>
    <h2 class="ym-errboundary__title">Đã xảy ra lỗi</h2>
    <p class="ym-errboundary__msg">{{ error.message || 'Lỗi không xác định trong giao diện.' }}</p>
    <div class="ym-errboundary__actions">
      <button type="button" class="ym-btn ym-btn--primary" @click="reset">Thử lại</button>
      <button type="button" class="ym-btn ym-btn--ghost" @click="reload">Tải lại trang</button>
    </div>
    <details v-if="error.stack" class="ym-errboundary__details">
      <summary>Chi tiết lỗi</summary>
      <pre>{{ error.stack }}</pre>
    </details>
  </div>
  <slot v-else />
</template>

<style scoped>
.ym-errboundary {
  max-width: 540px;
  margin: 60px auto;
  padding: 32px;
  background: #fff;
  border: 1px solid #fecaca;
  border-radius: 14px;
  text-align: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
}
.ym-errboundary__icon {
  font-size: 56px;
  color: #d0021b;
  margin-bottom: 8px;
}
.ym-errboundary__title {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 700;
  color: #111827;
}
.ym-errboundary__msg {
  color: #4b5563;
  font-size: 14px;
  margin: 0 0 20px;
  line-height: 1.5;
  word-break: break-word;
}
.ym-errboundary__actions {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-bottom: 16px;
}
.ym-errboundary__details {
  text-align: left;
  font-size: 12px;
  color: #6b7280;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f1f3f5;
}
.ym-errboundary__details pre {
  white-space: pre-wrap;
  word-break: break-all;
  padding: 8px;
  background: #fafbfc;
  border-radius: 6px;
  font-size: 11px;
  max-height: 240px;
  overflow: auto;
}
</style>
