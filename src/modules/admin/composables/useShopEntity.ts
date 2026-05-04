import { ref, computed, type Ref } from 'vue'
import api from '@/services/api'

export interface ShopEntityField {
  key: string
  label: string
}

export interface ShopEntityImportPreview {
  columns: string[]
  rows: Record<string, any>[]
  rowCount: number
  mapping: Record<string, string>
  fields: ShopEntityField[]
}

export interface ShopEntityImportReport {
  created: number
  updated: number
  skipped: number
  errors: Array<{ row: number; message: string }>
}

interface EntityState {
  items: Ref<Record<string, any>[]>
  meta: Ref<{ total: number; perPage: number; currentPage: number; lastPage: number }>
  stats: Ref<Record<string, any>>
  loading: Ref<boolean>
  error: Ref<string | null>
}

// Global cache: mọi component sử dụng cùng entity sẽ chia sẻ state. Khi 1 chỗ
// import/refresh, mọi nơi (ShopImportExport pill, view's table) tự re-render.
const entityCache = new Map<string, EntityState>()

function getOrCreateState(entity: string): EntityState {
  let state = entityCache.get(entity)
  if (!state) {
    state = {
      items: ref<Record<string, any>[]>([]),
      meta: ref({ total: 0, perPage: 20, currentPage: 1, lastPage: 1 }),
      stats: ref<Record<string, any>>({}),
      loading: ref(false),
      error: ref<string | null>(null),
    }
    entityCache.set(entity, state)
  }
  return state
}

/**
 * Composable cho mọi shop entity. State được cache theo entity name nên tất cả
 * caller đều chia sẻ cùng items/stats — import ở component này, view bên kia
 * tự cập nhật table mà không cần emit thủ công.
 */
export function useShopEntity(entity: string) {
  const state = getOrCreateState(entity)
  const total = computed(() => state.meta.value.total || state.items.value.length)

  async function fetch(params: Record<string, any> = { all: 1 }) {
    state.loading.value = true
    state.error.value = null
    try {
      const res = await api.get(`/shop/${entity}`, { params })
      state.items.value = res.data.data || []
      if (res.data.meta) state.meta.value = res.data.meta
      if (res.data.stats) state.stats.value = res.data.stats
    } catch (e: any) {
      state.error.value = e?.response?.data?.message || e?.message || 'Lỗi tải dữ liệu'
      throw e
    } finally {
      state.loading.value = false
    }
  }

  async function importPreview(file: File): Promise<ShopEntityImportPreview> {
    const formData = new FormData()
    formData.append('file', file)
    const res = await api.post(`/shop/${entity}/import-preview`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data.data
  }

  async function importFile(
    file: File,
    mapping: Record<string, string>,
    options: { updateExisting?: boolean; idField?: string } = {},
  ): Promise<ShopEntityImportReport> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('mapping', JSON.stringify(mapping))
    formData.append('update_existing', options.updateExisting ? '1' : '0')
    if (options.idField) formData.append('id_field', options.idField)
    const res = await api.post(`/shop/${entity}/import`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    // Sau import: refresh để mọi component dùng entity này thấy data mới ngay.
    await fetch({ all: 1 })
    return res.data.data
  }

  async function exportCsv() {
    const res = await api.get(`/shop/${entity}/export`, { responseType: 'blob' })
    const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const stamp = new Date().toISOString().slice(0, 10)
    link.href = url
    link.download = `shop-${entity}-${stamp}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  async function create(data: Record<string, any>) {
    const res = await api.post(`/shop/${entity}`, data)
    await fetch({ all: 1 })
    return res.data.data
  }

  async function update(id: number, data: Record<string, any>) {
    const res = await api.put(`/shop/${entity}/${id}`, data)
    await fetch({ all: 1 })
    return res.data.data
  }

  async function remove(id: number) {
    await api.delete(`/shop/${entity}/${id}`)
    await fetch({ all: 1 })
  }

  return {
    items: state.items,
    meta: state.meta,
    stats: state.stats,
    loading: state.loading,
    error: state.error,
    total,
    fetch,
    importPreview,
    importFile,
    exportCsv,
    create,
    update,
    remove,
  }
}
