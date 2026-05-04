<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  modelValue: number
  totalItems: number
  perPage?: number
  perPageOptions?: number[]
  itemLabel?: string
}>(), {
  perPage: 5,
  perPageOptions: () => [5, 10, 20, 50, 100],
  itemLabel: 'mục',
})

const emit = defineEmits<{
  (e: 'update:modelValue', page: number): void
  (e: 'update:perPage', n: number): void
}>()

const totalPages = computed(() => Math.max(1, Math.ceil(props.totalItems / props.perPage)))

const fromItem = computed(() => props.totalItems === 0 ? 0 : (props.modelValue - 1) * props.perPage + 1)
const toItem = computed(() => Math.min(props.modelValue * props.perPage, props.totalItems))

// Smart pages: 1 ... currentPage-1 currentPage currentPage+1 ... totalPages
const pageList = computed(() => {
  const total = totalPages.value
  const cur = props.modelValue
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: (number | '...')[] = [1]
  if (cur > 3) pages.push('...')
  const start = Math.max(2, cur - 1)
  const end = Math.min(total - 1, cur + 1)
  for (let i = start; i <= end; i++) pages.push(i)
  if (cur < total - 2) pages.push('...')
  pages.push(total)
  return pages
})

function goPage(p: number) {
  if (p < 1 || p > totalPages.value || p === props.modelValue) return
  emit('update:modelValue', p)
}

function changePerPage(e: Event) {
  const n = Number((e.target as HTMLSelectElement).value)
  emit('update:perPage', n)
  emit('update:modelValue', 1)
}
</script>

<template>
  <div class="adm-pagination">
    <div class="adm-pagination__info">
      <span>
        Hiển thị <strong>{{ fromItem }}</strong> - <strong>{{ toItem }}</strong>
        của <strong>{{ totalItems }}</strong> {{ itemLabel }}
      </span>
      <select v-if="perPageOptions.length" class="adm-pagination__perpage" :value="perPage" @change="changePerPage">
        <option v-for="n in perPageOptions" :key="n" :value="n">{{ n }} / trang</option>
      </select>
    </div>

    <nav v-if="totalPages > 1" class="adm-pagination__pager">
      <button type="button" class="adm-pagination__btn" :disabled="modelValue === 1" @click="goPage(modelValue - 1)" aria-label="Trang trước">
        <i class="ri-arrow-left-s-line"></i>
      </button>
      <template v-for="(p, idx) in pageList" :key="idx">
        <button v-if="p !== '...'" type="button" :class="['adm-pagination__btn', { 'is-active': p === modelValue }]" @click="goPage(p as number)">{{ p }}</button>
        <span v-else class="adm-pagination__dots">…</span>
      </template>
      <button type="button" class="adm-pagination__btn" :disabled="modelValue === totalPages" @click="goPage(modelValue + 1)" aria-label="Trang sau">
        <i class="ri-arrow-right-s-line"></i>
      </button>
    </nav>
  </div>
</template>

<style scoped>
.adm-pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  border-top: 1px solid #f1f3f5;
  flex-wrap: wrap;
}
.adm-pagination__info {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: #6b7280;
}
.adm-pagination__info strong { color: #111827; font-weight: 600; }

.adm-pagination__perpage {
  padding: 5px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  font-size: 13px;
  color: #1f2937;
  cursor: pointer;
}

.adm-pagination__pager { display: flex; gap: 4px; }
.adm-pagination__btn {
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  border: 1px solid #e5e7eb;
  background: #fff;
  border-radius: 6px;
  color: #4b5563;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.adm-pagination__btn:hover:not(:disabled) { background: #f3f4f6; border-color: #d1d5db; }
.adm-pagination__btn:disabled { opacity: 0.45; cursor: not-allowed; }
.adm-pagination__btn.is-active {
  background: #326e51;
  border-color: #326e51;
  color: #fff;
  font-weight: 600;
}
.adm-pagination__dots {
  display: inline-flex;
  align-items: center;
  padding: 0 6px;
  color: #9ca3af;
}
</style>
