<script setup lang="ts">
defineProps<{
  data: any[]
  columns: { key: string; label: string; width?: string }[]
  loading?: boolean
}>()
</script>

<template>
  <div class="data-table-wrapper">
    <table class="data-table">
      <thead>
        <tr>
          <th 
            v-for="col in columns" 
            :key="col.key"
            :style="{ width: col.width }"
          >
            {{ col.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading">
          <td :colspan="columns.length" class="text-center py-4">
            Đang tải dữ liệu...
          </td>
        </tr>
        <tr v-else-if="data.length === 0">
          <td :colspan="columns.length" class="text-center py-4 text-muted">
            Không có dữ liệu
          </td>
        </tr>
        <template v-else>
          <tr v-for="(row, index) in data" :key="index">
            <td v-for="col in columns" :key="col.key">
              <!-- Default slot for custom column rendering -->
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
}
.data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}
.data-table th, .data-table td {
  padding: 1rem;
  border-bottom: 1px solid var(--color-border);
}
.data-table th {
  background-color: var(--color-bg-hover);
  font-weight: 600;
  color: var(--color-text-muted);
}
.data-table tr:last-child td {
  border-bottom: none;
}
.text-center { text-align: center; }
.py-4 { padding-top: 2rem; padding-bottom: 2rem; }
.text-muted { color: var(--color-text-muted); }
</style>
