<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useShopEntity, type ShopEntityImportPreview } from '../composables/useShopEntity'
import { useToast } from '../composables/useToast'
import AdminModal from './AdminModal.vue'

/**
 * Cặp button "Nhập" / "Xuất" + modal import dùng chung cho mọi admin entity.
 *
 * Sử dụng:
 *   <ShopImportExport entity="customers" id-field="email" @imported="onReload" />
 *
 * Props:
 * - entity: tên entity backend (customers, suppliers, orders, ...)
 * - idField: field dùng để match khi update_existing (vd "email" cho customers, "code" cho suppliers)
 * - label: nhãn hiển thị (mặc định = entity)
 */
interface Props {
  entity: string
  idField?: string
  label?: string
}
const props = withDefaults(defineProps<Props>(), { idField: '', label: '' })
const emit = defineEmits<{
  (e: 'imported', report: { created: number; updated: number; skipped: number }): void
}>()

const toast = useToast()
const shop = useShopEntity(props.entity)
const items = shop.items
const statsRef = shop.stats

const open = ref(false)
const dataOpen = ref(false)
const file = ref<File | null>(null)
const preview = ref<ShopEntityImportPreview | null>(null)
const mapping = ref<Record<string, string>>({})
const updateExisting = ref(false)
const loadingPreview = ref(false)
const submitting = ref(false)

const labelText = computed(() => props.label || props.entity)
const storedCount = computed(() => Number(statsRef.value?.total ?? 0))
const dataColumns = computed(() => {
  const set = new Set<string>()
  for (const row of items.value) {
    for (const k of Object.keys(row)) {
      if (k !== 'id' && k !== 'createdAt' && k !== 'updatedAt') set.add(k)
    }
  }
  return Array.from(set)
})

async function refreshCount() {
  try {
    await shop.fetch({ all: 1 })
  } catch {
    // bỏ qua — BE có thể đang khởi động
  }
}

onMounted(refreshCount)

function reset() {
  file.value = null
  preview.value = null
  mapping.value = {}
  updateExisting.value = false
}

function openImport() {
  reset()
  open.value = true
}

async function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const f = input.files?.[0] || null
  file.value = f
  preview.value = null
  mapping.value = {}
  if (!f) return

  loadingPreview.value = true
  try {
    const data = await shop.importPreview(f)
    preview.value = data
    mapping.value = { ...data.mapping }
    toast.success('Đã đọc file', `${data.rowCount} dòng · ${data.columns.length} cột`)
  } catch (err: any) {
    toast.error('Không đọc được file', err?.response?.data?.message || 'Kiểm tra định dạng Excel/CSV')
  } finally {
    loadingPreview.value = false
  }
}

async function submitImport() {
  if (!file.value) {
    toast.error('Chưa chọn file')
    return
  }
  if (Object.keys(mapping.value).length === 0) {
    toast.error('Mapping trống', 'Cần ít nhất 1 cột để nhập.')
    return
  }
  submitting.value = true
  try {
    const report = await shop.importFile(file.value, mapping.value, {
      updateExisting: updateExisting.value,
      idField: props.idField,
    })
    open.value = false
    emit('imported', report)
    await refreshCount()
    toast.success(
      'Đã nhập dữ liệu',
      `Tạo ${report.created || 0} · Cập nhật ${report.updated || 0} · Bỏ qua ${report.skipped || 0}`,
    )
  } catch (err: any) {
    toast.error('Nhập thất bại', err?.response?.data?.message || 'Lỗi không xác định')
  } finally {
    submitting.value = false
  }
}

async function doExport() {
  try {
    await shop.exportCsv()
    toast.success('Đã xuất CSV')
  } catch (err: any) {
    toast.error('Xuất thất bại', err?.response?.data?.message || 'Lỗi không xác định')
  }
}

async function deleteEntry(id: number) {
  if (!confirm('Xoá bản ghi này?')) return
  try {
    await shop.remove(id)
    await refreshCount()
    toast.success('Đã xoá')
  } catch (err: any) {
    toast.error('Xoá thất bại', err?.response?.data?.message || 'Lỗi')
  }
}
</script>

<template>
  <div class="ym-iexp">
    <button type="button" class="ym-btn" @click="openImport">
      <i class="ri-upload-2-line" aria-hidden="true"></i> Nhập
    </button>
    <button type="button" class="ym-btn" @click="doExport">
      <i class="ri-download-2-line" aria-hidden="true"></i> Xuất
    </button>
    <button v-if="storedCount > 0" type="button" class="ym-btn ym-iexp__count" @click="dataOpen = true">
      <i class="ri-database-2-line" aria-hidden="true"></i> Đã nhập: {{ storedCount }}
    </button>

    <AdminModal v-model:open="dataOpen" :title="`Dữ liệu ${labelText} đã nhập (${storedCount})`" size="xl" hide-footer>
      <div v-if="items.length === 0" class="ym-iexp__empty">Chưa có bản ghi nào.</div>
      <div v-else class="ym-iexp__data">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th v-for="c in dataColumns" :key="c">{{ c }}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in items" :key="row.id">
              <td>{{ row.id }}</td>
              <td v-for="c in dataColumns" :key="c">
                <span class="ym-iexp__cell">{{ row[c] ?? '—' }}</span>
              </td>
              <td>
                <button type="button" class="ym-btn ym-btn--danger" @click="deleteEntry(row.id)">
                  <i class="ri-delete-bin-line"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </AdminModal>

    <AdminModal v-model:open="open" :title="`Nhập ${labelText} từ Excel/CSV`" size="lg">
      <div class="ym-iexp__body">
        <label class="ym-iexp__file">
          <i class="ri-file-excel-2-line" aria-hidden="true"></i>
          <span v-if="!file">Chọn file Excel/CSV (.xlsx, .xls, .csv)</span>
          <span v-else>{{ file.name }}</span>
          <input type="file" accept=".xlsx,.xls,.csv" @change="onFileChange" />
        </label>

        <div v-if="loadingPreview" class="ym-iexp__loading">Đang đọc file...</div>

        <label v-if="preview" class="ym-iexp__check">
          <input type="checkbox" v-model="updateExisting" />
          <span v-if="props.idField">Cập nhật bản ghi trùng <strong>{{ props.idField }}</strong></span>
          <span v-else>Cập nhật bản ghi trùng (cần idField)</span>
        </label>

        <div v-if="preview" class="ym-iexp__summary">
          <span><strong>{{ preview.rowCount }}</strong> dòng</span>
          <span><strong>{{ preview.columns.length }}</strong> cột</span>
        </div>

        <div v-if="preview" class="ym-iexp__columns">
          <span v-for="c in preview.columns" :key="c">{{ c }}</span>
        </div>

        <div v-if="preview && preview.rows.length" class="ym-iexp__preview">
          <table>
            <thead>
              <tr>
                <th v-for="c in preview.columns" :key="c">{{ c }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, idx) in preview.rows.slice(0, 5)" :key="idx">
                <td v-for="c in preview.columns" :key="c">{{ row[c] ?? '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <template #footer>
        <button type="button" class="ym-btn" @click="open = false">Hủy</button>
        <button
          type="button"
          class="ym-btn ym-btn--primary"
          :disabled="!preview || submitting"
          @click="submitImport"
        >
          <span v-if="submitting">Đang nhập...</span>
          <span v-else>Xác nhận nhập</span>
        </button>
      </template>
    </AdminModal>
  </div>
</template>

<style scoped>
.ym-iexp { display: inline-flex; gap: 6px; flex-wrap: wrap; }
.ym-iexp__count { background: #ecfdf5; border-color: #6ee7b7; color: #047857; }
.ym-iexp__count:hover { background: #d1fae5; }
.ym-iexp__empty { padding: 24px; text-align: center; color: #6b7280; }
.ym-iexp__data { overflow-x: auto; max-height: 70vh; }
.ym-iexp__data table { width: 100%; border-collapse: collapse; font-size: 12px; }
.ym-iexp__data th, .ym-iexp__data td {
  padding: 6px 10px; border-bottom: 1px solid #e5e7eb; text-align: left;
  white-space: nowrap; max-width: 240px; overflow: hidden; text-overflow: ellipsis;
}
.ym-iexp__data th { background: #f9fafb; font-weight: 600; position: sticky; top: 0; z-index: 1; }
.ym-iexp__cell { display: inline-block; max-width: 220px; overflow: hidden; text-overflow: ellipsis; vertical-align: middle; }
.ym-iexp__body { display: flex; flex-direction: column; gap: 12px; }
.ym-iexp__file {
  display: flex; align-items: center; gap: 8px;
  padding: 12px; border: 2px dashed #d1d5db; border-radius: 6px;
  cursor: pointer; color: #6b7280; font-size: 13px;
  transition: all 0.15s;
}
.ym-iexp__file:hover { border-color: #6366f1; color: #4f46e5; }
.ym-iexp__file input { display: none; }
.ym-iexp__loading { color: #6b7280; font-size: 13px; }
.ym-iexp__check { display: flex; align-items: center; gap: 6px; font-size: 13px; }
.ym-iexp__summary { display: flex; gap: 12px; font-size: 13px; }
.ym-iexp__summary span {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 4px 10px; background: #eef2ff; color: #4338ca; border-radius: 999px;
}
.ym-iexp__columns { display: flex; flex-wrap: wrap; gap: 4px; max-height: 80px; overflow-y: auto; }
.ym-iexp__columns span {
  padding: 3px 8px; background: #f3f4f6; border-radius: 4px;
  font-size: 12px; color: #374151;
}
.ym-iexp__preview { overflow-x: auto; max-height: 250px; }
.ym-iexp__preview table { width: 100%; border-collapse: collapse; font-size: 12px; }
.ym-iexp__preview th, .ym-iexp__preview td {
  padding: 6px 10px; border-bottom: 1px solid #e5e7eb; text-align: left;
  white-space: nowrap;
}
.ym-iexp__preview th { background: #f9fafb; font-weight: 600; }
</style>
