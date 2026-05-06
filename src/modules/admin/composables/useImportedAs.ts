import { ref, computed, onMounted, watch } from 'vue'
import { useShopEntity } from './useShopEntity'

/**
 * Map các bản ghi đã import (bảng shop_entries) sang shape mong muốn của FE.
 *
 * Mỗi field trong shape khai báo 1 list "candidate keys" — tuần tự thử các key đó
 * trong row.data, lấy giá trị đầu tiên non-null. Hỗ trợ cả key sạch (sau khi sửa
 * slugifyKey) lẫn key cũ bị lỗi (vd "ien_thoai" do bug Đ→"" trước đây).
 *
 * Ví dụ:
 *   const { items } = useImportedAs<Supplier>('suppliers', {
 *     code: ['ma_nha_cung_cap', 'ma_ncc', 'code'],
 *     name: ['ten_nha_cung_cap', 'ten_ncc', 'name'],
 *     phone: ['dien_thoai', 'ien_thoai', 'sdt'],
 *     ...
 *   }, (raw, mapped) => ({ ...defaults, ...mapped, ... custom transforms ... }))
 */
export function useImportedAs<T extends Record<string, any>>(
  entity: string,
  fieldMap: Record<string, string[]>,
  finalize?: (raw: Record<string, any>, mapped: Record<string, any>) => T,
) {
  const shop = useShopEntity(entity)
  const ready = ref(false)

  function pick(row: Record<string, any>, candidates: string[]): any {
    for (const k of candidates) {
      const v = row[k]
      if (v !== undefined && v !== null && v !== '') return v
    }
    return undefined
  }

  const items = computed<T[]>(() => {
    return shop.items.value.map((raw) => {
      const mapped: Record<string, any> = { id: raw.id }
      for (const field in fieldMap) {
        mapped[field] = pick(raw, fieldMap[field])
      }
      return finalize ? finalize(raw, mapped) : (mapped as T)
    })
  })

  const total = computed(() => Number(shop.stats.value?.total ?? items.value.length))
  const hasData = computed(() => items.value.length > 0)

  async function refresh(opts: { force?: boolean } = {}) {
    try {
      await shop.fetch({ all: 1 }, { force: !!opts.force })
      ready.value = true
    } catch {
      // bỏ qua
    }
  }

  onMounted(refresh)

  return { items, total, hasData, ready, refresh, raw: shop.items }
}
