<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import api from '@/services/api'
import { formatDateTime } from '@/helpers/formatter'
import Pagination from '../components/Pagination.vue'

interface LogRow {
  id: number
  description: string
  user_id: number | null
  user_name: string
  user_type: string
  route: string
  method_type: string
  status_code: number
  ip_address: string
  country: string
  created_at: string
}

const items = ref<LogRow[]>([])
const meta = ref({ total: 0, currentPage: 1, lastPage: 1, perPage: 20 })
const loading = ref(false)
const error = ref('')

const search = ref('')
const methodFilter = ref('')
const statusFilter = ref('')
const fromDate = ref('')
const toDate = ref('')
const page = ref(1)
const perPage = ref(20)

let debounceTimer: ReturnType<typeof setTimeout> | null = null
let lastReqId = 0

async function fetchList() {
  const reqId = ++lastReqId
  loading.value = true
  error.value = ''
  const params: Record<string, any> = {
    page: page.value,
    limit: perPage.value,
  }
  if (search.value.trim()) params.search = search.value.trim()
  if (methodFilter.value) params.method_type = methodFilter.value
  if (statusFilter.value) params.status_code = Number(statusFilter.value)
  if (fromDate.value) params.from_date = fromDate.value
  if (toDate.value) params.to_date = toDate.value

  try {
    const res = await api.get('/log-activities', { params })
    if (reqId !== lastReqId) return
    const data: any[] = res.data?.data ?? []
    items.value = data.map((r: any) => ({
      id: Number(r.id),
      description: String(r.description ?? ''),
      user_id: r.user_id ?? null,
      user_name: String(r.user?.name ?? r.user_name ?? '—'),
      user_type: String(r.user_type ?? ''),
      route: String(r.route ?? ''),
      method_type: String(r.method_type ?? ''),
      status_code: Number(r.status_code ?? 0),
      ip_address: String(r.ip_address ?? ''),
      country: String(r.country ?? ''),
      created_at: String(r.created_at ?? ''),
    }))
    if (res.data?.meta) {
      meta.value = {
        total: Number(res.data.meta.total ?? 0),
        currentPage: Number(res.data.meta.current_page ?? 1),
        lastPage: Number(res.data.meta.last_page ?? 1),
        perPage: Number(res.data.meta.per_page ?? perPage.value),
      }
    }
  } catch (e: any) {
    if (reqId !== lastReqId) return
    error.value = e?.response?.data?.message || e?.message || 'Lỗi tải log'
  } finally {
    if (reqId === lastReqId) loading.value = false
  }
}

function debouncedFetch() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(fetchList, 300)
}

onMounted(fetchList)
watch([page, perPage], fetchList)
watch([search, methodFilter, statusFilter, fromDate, toDate], () => {
  page.value = 1
  debouncedFetch()
})

function statusTone(code: number) {
  if (code >= 500) return 'danger'
  if (code >= 400) return 'warning'
  if (code >= 200 && code < 300) return 'success'
  return 'neutral'
}

function methodTone(m: string) {
  return ({ GET: 'info', POST: 'primary', PUT: 'warning', PATCH: 'warning', DELETE: 'danger' } as Record<string, string>)[m] ?? 'neutral'
}

const stats = computed(() => ({
  total: meta.value.total,
  errorRate: items.value.length
    ? Math.round((items.value.filter((r) => r.status_code >= 400).length / items.value.length) * 100)
    : 0,
}))
</script>

<template>
  <div class="ym-page">
    <header class="ym-page__header">
      <div>
        <h1>Nhật ký hệ thống</h1>
        <p>Audit log mọi request có xác thực — admin xem được ai đã làm gì và lúc nào.</p>
      </div>
    </header>

    <section class="ym-mini-stats">
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Tổng request đã log</p><p class="ym-mini-stat__value">{{ stats.total.toLocaleString('vi-VN') }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">% lỗi (page hiện tại)</p><p class="ym-mini-stat__value" :style="{ color: stats.errorRate > 10 ? '#d0021b' : '#326e51' }">{{ stats.errorRate }}%</p></article>
    </section>

    <div class="ym-card">
      <div class="ym-toolbar">
        <div class="ym-search" style="flex: 1; max-width: 320px">
          <i class="ri-search-line"></i>
          <input v-model="search" type="text" placeholder="Tìm description, route, IP..." />
        </div>
        <select v-model="methodFilter" class="ym-select">
          <option value="">Mọi method</option>
          <option>GET</option><option>POST</option><option>PUT</option><option>PATCH</option><option>DELETE</option>
        </select>
        <select v-model="statusFilter" class="ym-select">
          <option value="">Mọi mã</option>
          <option value="200">200 OK</option>
          <option value="201">201 Created</option>
          <option value="400">400 Bad Request</option>
          <option value="401">401 Unauthorized</option>
          <option value="403">403 Forbidden</option>
          <option value="404">404 Not Found</option>
          <option value="422">422 Validation</option>
          <option value="500">500 Error</option>
        </select>
        <input v-model="fromDate" type="date" class="ym-input" :title="'Từ ngày'" />
        <input v-model="toDate" type="date" class="ym-input" :title="'Đến ngày'" />
      </div>

      <div class="ym-table-wrap">
        <table class="ym-table">
          <thead>
            <tr>
              <th>Thời gian</th>
              <th>Người dùng</th>
              <th>Method</th>
              <th>Route</th>
              <th class="is-center">Status</th>
              <th>IP</th>
              <th>Mô tả</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in items" :key="r.id">
              <td class="is-muted" style="white-space: nowrap">{{ formatDateTime(r.created_at) }}</td>
              <td>
                <div class="ym-cell-user">
                  <strong>{{ r.user_name }}</strong>
                  <small v-if="r.user_id">#{{ r.user_id }}</small>
                </div>
              </td>
              <td><span :class="['ym-tag', `ym-tag--${methodTone(r.method_type)}`]" style="font-size: 11px">{{ r.method_type }}</span></td>
              <td><code class="ym-code">{{ r.route }}</code></td>
              <td class="is-center"><span :class="['ym-tag', `ym-tag--${statusTone(r.status_code)}`]">{{ r.status_code }}</span></td>
              <td class="is-muted">{{ r.ip_address }}<span v-if="r.country" class="is-muted"> · {{ r.country }}</span></td>
              <td>{{ r.description }}</td>
            </tr>
            <tr v-if="!items.length"><td colspan="7" class="ym-empty">{{ loading ? 'Đang tải...' : (error || 'Chưa có log nào.') }}</td></tr>
          </tbody>
        </table>
      </div>

      <Pagination
        v-model="page"
        :total-items="meta.total"
        :per-page="perPage"
        item-label="bản ghi"
        @update:per-page="(n) => perPage = n"
      />
    </div>
  </div>
</template>

<style scoped src="./_admin-shared.css"></style>
<style scoped>
.ym-toolbar {
  display: flex; gap: 10px; padding: 12px 16px; border-bottom: 1px solid #f1f3f5; flex-wrap: wrap; align-items: center;
}
.ym-select, .ym-input {
  height: 36px; padding: 0 10px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 13px; background: #fff;
}
.ym-code {
  font-size: 12px; background: #f3f4f6; padding: 2px 6px; border-radius: 4px; color: #1f2937;
  word-break: break-all;
}
.ym-cell-user { display: flex; flex-direction: column; }
.ym-cell-user small { color: #6b7280; font-size: 11px; }
</style>
