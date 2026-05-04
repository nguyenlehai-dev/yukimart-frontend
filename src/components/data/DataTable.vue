<script setup lang="ts" generic="T extends Record<string, any>">
import { computed } from 'vue'

type SortDir = 'asc' | 'desc' | null

interface Column {
  key: string
  label: string
  width?: string
  sortable?: boolean
  align?: 'left' | 'center' | 'right'
}

const props = withDefaults(defineProps<{
  data: T[]
  columns: Column[]
  loading?: boolean
  emptyText?: string
  loadingText?: string
  caption?: string
  rowKey?: keyof T | ((row: T, index: number) => string | number)
  sortBy?: string
  sortDir?: SortDir
}>(), {
  emptyText: 'Không có dữ liệu',
  loadingText: 'Đang tải dữ liệu...',
  sortDir: null,
})

const emit = defineEmits<{
  (e: 'sort', payload: { key: string; dir: SortDir }): void
  (e: 'rowClick', row: T, index: number): void
}>()

const colCount = computed(() => props.columns.length)

function getRowKey(row: T, index: number): string | number {
  const k = props.rowKey
  if (!k) return index
  if (typeof k === 'function') return k(row, index)
  const v = row[k]
  return v == null ? index : (v as string | number)
}

function ariaSortFor(col: Column): 'ascending' | 'descending' | 'none' | undefined {
  if (!col.sortable) return undefined
  if (props.sortBy !== col.key) return 'none'
  if (props.sortDir === 'asc') return 'ascending'
  if (props.sortDir === 'desc') return 'descending'
  return 'none'
}

function onSort(col: Column) {
  if (!col.sortable) return
  let nextDir: SortDir = 'asc'
  if (props.sortBy === col.key) {
    nextDir = props.sortDir === 'asc' ? 'desc' : props.sortDir === 'desc' ? null : 'asc'
  }
  emit('sort', { key: col.key, dir: nextDir })
}
</script>

<template>
  <div class="data-table-wrapper" role="region" :aria-label="caption || 'Bảng dữ liệu'" tabindex="0">
    <table class="data-table" :aria-busy="loading || undefined">
      <caption v-if="caption" class="data-table__caption">{{ caption }}</caption>
      <thead>
        <tr>
          <th
            v-for="col in columns"
            :key="col.key"
            :style="{ width: col.width, textAlign: col.align || 'left' }"
            scope="col"
            :aria-sort="ariaSortFor(col)"
          >
            <button
              v-if="col.sortable"
              type="button"
              class="data-table__sort-btn"
              @click="onSort(col)"
            >
              {{ col.label }}
              <i
                aria-hidden="true"
                class="data-table__sort-icon"
                :class="{
                  'ri-arrow-up-line': sortBy === col.key && sortDir === 'asc',
                  'ri-arrow-down-line': sortBy === col.key && sortDir === 'desc',
                  'ri-expand-up-down-line': sortBy !== col.key || sortDir === null,
                }"
              ></i>
            </button>
            <template v-else>{{ col.label }}</template>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading" class="data-table__state-row">
          <td :colspan="colCount" class="data-table__state">
            <span class="data-table__spinner" aria-hidden="true"></span>
            {{ loadingText }}
          </td>
        </tr>
        <tr v-else-if="data.length === 0" class="data-table__state-row">
          <td :colspan="colCount" class="data-table__state data-table__state--empty">
            {{ emptyText }}
          </td>
        </tr>
        <template v-else>
          <tr
            v-for="(row, index) in data"
            :key="getRowKey(row, index)"
            class="data-table__row"
            @click="emit('rowClick', row, index)"
          >
            <td
              v-for="col in columns"
              :key="col.key"
              :style="{ textAlign: col.align || 'left' }"
            >
              <slot :name="col.key" :row="row" :index="index" :value="row[col.key]">
                {{ row[col.key] }}
              </slot>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.data-table-wrapper {
  overflow-x: auto;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: #fff;
}
.data-table-wrapper:focus { outline: none; }
.data-table-wrapper:focus-visible {
  box-shadow: var(--focus-ring);
}

.data-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  text-align: left;
  font-size: var(--text-sm, 0.875rem);
}

.data-table__caption {
  caption-side: top;
  text-align: left;
  padding: var(--space-3, 12px) var(--space-4, 16px);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  border-bottom: 1px solid var(--color-border);
}

.data-table th,
.data-table td {
  padding: var(--space-3, 12px) var(--space-4, 16px);
  border-bottom: 1px solid var(--color-border);
  vertical-align: middle;
}

.data-table th {
  background-color: var(--color-bg-hover);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-muted);
  font-size: var(--text-xs);
  letter-spacing: 0.02em;
  text-transform: uppercase;
  white-space: nowrap;
  position: sticky;
  top: 0;
  z-index: 1;
}

.data-table tbody tr:last-child td { border-bottom: none; }
.data-table__row {
  transition: background-color var(--transition-fast);
}
.data-table__row:hover {
  background-color: var(--color-bg-hover);
}

.data-table__sort-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  color: inherit;
  text-transform: inherit;
  letter-spacing: inherit;
  cursor: pointer;
  user-select: none;
}
.data-table__sort-btn:focus { outline: none; }
.data-table__sort-btn:focus-visible {
  box-shadow: var(--focus-ring);
  border-radius: var(--radius-sm);
  padding: 2px 4px;
  margin: -2px -4px;
}

.data-table__sort-icon {
  font-size: 0.875rem;
  opacity: 0.7;
}

.data-table__state {
  text-align: center;
  padding: var(--space-12, 48px) var(--space-4, 16px);
  color: var(--color-text-muted);
}
.data-table__state--empty {
  color: var(--color-text-light);
}
.data-table__state-row:hover { background: transparent !important; }

.data-table__spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  margin-right: 8px;
  vertical-align: middle;
  animation: dt-spin 0.7s linear infinite;
}

@keyframes dt-spin {
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .data-table__row { transition: none; }
  .data-table__spinner { animation-duration: 1.5s; }
}
</style>
