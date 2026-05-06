import { ref, watch, type Ref, type WatchSource } from 'vue'
import api from '@/services/api'

export interface PagedListParams {
  page?: number
  perPage?: number
  q?: string
  status?: string
  userId?: number
  [key: string]: any
}

export interface PagedListMeta {
  total: number
  perPage: number
  currentPage: number
  lastPage: number
}

/**
 * Composable cho admin list lớn (customers, orders, ...) — pagination + search
 * server-side. Khác với `useImportedAs` (load all + filter FE), composable này
 * fetch lại khi params đổi và trả total đúng từ BE.
 *
 * Caller cung cấp các reactive ref params; composable tự debounce + refetch.
 */
export function useServerPagedList<T = Record<string, any>>(
  entity: string,
  paramsSource: () => PagedListParams,
  options: { mapper?: (row: any) => T; debounceMs?: number; auto?: boolean } = {},
) {
  const items = ref<T[]>([]) as Ref<T[]>
  const meta = ref<PagedListMeta>({ total: 0, perPage: 20, currentPage: 1, lastPage: 1 })
  const stats = ref<Record<string, any>>({})
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastReqId = ref(0)

  async function fetch() {
    const reqId = ++lastReqId.value
    const p = paramsSource()
    const queryParams: Record<string, any> = {
      page: p.page ?? 1,
      per_page: p.perPage ?? 20,
    }
    if (p.q) queryParams.q = p.q
    if (p.status) queryParams.status = p.status
    if (p.userId) queryParams.user_id = p.userId
    // Bất kỳ field nào khác user truyền cũng forward.
    for (const k in p) {
      if (['page', 'perPage', 'q', 'status', 'userId'].includes(k)) continue
      if (p[k] !== undefined && p[k] !== null && p[k] !== '') {
        queryParams[k] = p[k]
      }
    }

    loading.value = true
    error.value = null
    try {
      const res = await api.get(`/shop/${entity}`, { params: queryParams })
      // Out-of-order response (user gõ search nhanh) → bỏ qua nếu không phải request mới nhất.
      if (reqId !== lastReqId.value) return

      const raw: any[] = res.data?.data || []
      items.value = options.mapper ? raw.map(options.mapper) : (raw as T[])
      if (res.data?.meta) {
        meta.value = {
          total: Number(res.data.meta.total ?? 0),
          perPage: Number(res.data.meta.perPage ?? p.perPage ?? 20),
          currentPage: Number(res.data.meta.currentPage ?? p.page ?? 1),
          lastPage: Number(res.data.meta.lastPage ?? 1),
        }
      }
      if (res.data?.stats) stats.value = res.data.stats
    } catch (e: any) {
      if (reqId !== lastReqId.value) return
      error.value = e?.response?.data?.message || e?.message || 'Lỗi tải dữ liệu'
    } finally {
      if (reqId === lastReqId.value) loading.value = false
    }
  }

  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  function refetchDebounced() {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(fetch, options.debounceMs ?? 250)
  }

  if (options.auto !== false) {
    watch(paramsSource as WatchSource<PagedListParams>, refetchDebounced, { deep: true, immediate: true })
  }

  return {
    items,
    meta,
    stats,
    loading,
    error,
    refresh: fetch,
  }
}
