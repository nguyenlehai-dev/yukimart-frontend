<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AdminModal from '../components/AdminModal.vue'
import RowMenu from '../components/RowMenu.vue'
import Pagination from '../components/Pagination.vue'
import { useToast } from '../composables/useToast'
import { useAdminDataStore, type AdminProduct } from '../stores/adminData'
import { useShopBusinessStore } from '../stores/shopBusiness'
import { shopProductsApi } from '../services/shopApi'
import { formatPrice, getBrandLogo } from '@/modules/mypage/home/configs'

const toast = useToast()
const route = useRoute()
const router = useRouter()
const store = useAdminDataStore()
const business = useShopBusinessStore()

// Tự động set filter từ query ?category=...
onMounted(() => {
  const cat = route.query.category as string | undefined
  if (cat) filterCategory.value = cat
  reloadProducts()
})

watch(() => route.query.category, (cat) => {
  if (typeof cat === 'string') filterCategory.value = cat
})

function gotoCategory(name: string) {
  filterCategory.value = name
  page.value = 1
  router.replace({ path: '/admin/products', query: { category: name } })
}

// Bảng giá liên quan tới sản phẩm
function priceListsForProduct(productId: number) {
  return business.priceLists.filter((pl) => pl.active && (pl.productIds === 'all' || (Array.isArray(pl.productIds) && pl.productIds.includes(productId))))
}

function priceForGroup(productId: number, groupCode: string) {
  const product = store.findProduct(productId)
  if (!product) return 0
  const group = business.customerGroups.find((g) => g.code === groupCode)
  if (!group) return product.salePrice
  return Math.round(product.salePrice * (1 - group.discount / 100))
}

// Category tree với indentation level cho dropdown
interface CategoryOption { name: string; depth: number; id: number; isVisible: boolean }
const categoryDropdownOptions = computed<CategoryOption[]>(() => {
  const result: CategoryOption[] = []
  const buildTree = (parentId: number | null, depth: number) => {
    const cats = store.categories
      .filter((c) => c.parentId === parentId)
      .sort((a, b) => a.name.localeCompare(b.name))
    for (const c of cats) {
      result.push({ name: c.name, depth, id: c.id, isVisible: c.active && c.showOnMenu })
      buildTree(c.id, depth + 1)
    }
  }
  buildTree(null, 0)
  return result
})

// Quick-create modals
const newCatOpen = ref(false)
const newCatName = ref('')
const newCatParent = ref<number | null>(null)

function openNewCat() {
  newCatName.value = ''
  newCatParent.value = null
  newCatOpen.value = true
}
async function createNewCat() {
  if (!newCatName.value.trim()) {
    toast.error('Nhập tên danh mục')
    return
  }
  try {
    const cat = await store.addCategory({
      parentId: newCatParent.value,
      name: newCatName.value.trim(),
      slug: store.slugify(newCatName.value),
      icon: 'ri-folder-line',
      showOnMenu: true,
      active: true,
    })
    if (cat) {
      form.value.category = cat.name
      toast.success('Đã tạo danh mục', cat.name)
      newCatOpen.value = false
    }
  } catch (e: any) {
    toast.error('Tạo danh mục thất bại', e?.message)
  }
}

const newBrandOpen = ref(false)
const newBrandName = ref('')
function openNewBrand() { newBrandName.value = ''; newBrandOpen.value = true }
function createNewBrand() {
  if (!newBrandName.value.trim()) return toast.error('Nhập tên thương hiệu')
  form.value.brand = newBrandName.value.trim()
  toast.success('Đã chọn thương hiệu', form.value.brand)
  newBrandOpen.value = false
}

const newWhOpen = ref(false)
const newWhName = ref('')
function openNewWh() { newWhName.value = ''; newWhOpen.value = true }
function createNewWh() {
  if (!newWhName.value.trim()) return toast.error('Nhập tên kho')
  form.value.warehouse = newWhName.value.trim()
  toast.success('Đã đặt kho', form.value.warehouse)
  newWhOpen.value = false
}

type ProductStatus = AdminProduct['status']

const statusMap: Record<ProductStatus, { label: string; tone: string }> = {
  active: { label: 'Đang bán', tone: 'success' },
  draft: { label: 'Nháp', tone: 'neutral' },
  out_of_stock: { label: 'Hết hàng', tone: 'danger' },
}

const filterStatus = ref<'all' | ProductStatus>('all')
const filterCategory = ref('all')
const filterBrand = ref('all')
const search = ref('')
const view = ref<'grid' | 'list'>('grid')
const page = ref(1)
const perPage = ref(5)

const filterCategoryOptions = computed(() => {
  const byKey = new Map<string, string>()
  const optionKey = (value: string) => value.trim().toLowerCase()
  for (const cat of store.categories) byKey.set(optionKey(cat.name), cat.name)
  for (const name of store.categoryOptions) {
    const key = optionKey(name)
    if (!byKey.has(key)) byKey.set(key, name)
  }
  return [...byKey.values()].sort((a, b) => a.localeCompare(b))
})

const filterBrandOptions = computed(() => {
  const fromFacets = store.adminProductBrandFacets.map((item) => item.brand)
  return fromFacets.length ? fromFacets : store.brandOptions
})

function categoryFilterTarget() {
  const value = filterCategory.value.trim().toLowerCase()
  const key = store.slugify(filterCategory.value)
  return store.categories.find((c) => c.name.trim().toLowerCase() === value)
    || store.categories.find((c) => store.slugify(c.name) === key || store.slugify(c.slug) === key)
    || filterCategory.value
}

const filtered = computed(() => store.products)
const paginated = computed(() => store.products)
const productTotal = computed(() => store.adminProductMeta.total || store.products.length)

let reloadTimer: ReturnType<typeof setTimeout> | null = null
let reloadSeq = 0

function productQueryParams() {
  const params: Record<string, any> = {
    page: page.value,
    per_page: perPage.value,
  }
  if (filterStatus.value !== 'all') params.status = filterStatus.value
  if (filterCategory.value !== 'all') params.category = filterCategory.value
  if (filterBrand.value !== 'all') params.brand = filterBrand.value
  if (search.value.trim()) params.q = search.value.trim()
  return params
}

async function reloadProducts() {
  const seq = ++reloadSeq
  try {
    await store.fetchAdminProducts(productQueryParams())
  } catch (e: any) {
    if (seq === reloadSeq) toast.error('Tải sản phẩm thất bại', e?.response?.data?.message || e?.message)
  }
}

function scheduleReloadProducts() {
  if (reloadTimer) clearTimeout(reloadTimer)
  reloadTimer = setTimeout(() => reloadProducts(), 250)
}

// Reset về trang 1 khi thay đổi filter/search
watch([filterStatus, filterCategory, filterBrand, search], () => {
  if (page.value !== 1) page.value = 1
  else scheduleReloadProducts()
})
watch([page, perPage], () => reloadProducts())

const stats = computed(() => ({
  total: store.adminProductStats.total || store.products.length,
  active: store.adminProductStats.active || store.activeProducts.length,
  outOfStock: store.adminProductStats.outOfStock || store.outOfStock.length,
  lowStock: store.adminProductStats.lowStock || store.lowStock.length,
  totalValue: store.adminProductStats.totalValue || store.totalStockValue,
}))

// ── Form state ──
type FormState = Omit<AdminProduct, 'id' | 'createdAt'>
function emptyForm(): FormState {
  return {
    name: '', slug: '', sku: '', brand: '', category: '',
    image: '', originalPrice: 0, salePrice: 0, wholesalePrice: 0,
    discount: 0, stock: 0, cost: 0,
    status: 'draft', warehouse: 'Kho HCM', reserved: 0, threshold: 10,
    isHotDeal: false, isSuggested: false, sectionId: null,
    description: '',
  }
}

// ── Validation rules cho form ──
type Check = { id: string; level: 'error' | 'warn' | 'ok' | 'info'; label: string; hint?: string }

const validations = computed<Check[]>(() => {
  const f = form.value
  const checks: Check[] = []

  checks.push({ id: 'sku', level: f.sku.trim().length < 3 ? 'error' : 'ok', label: 'SKU ≥ 3 ký tự', hint: f.sku.trim().length < 3 ? `Hiện ${f.sku.trim().length} ký tự` : undefined })
  checks.push({ id: 'name', level: f.name.trim().length < 5 ? 'error' : 'ok', label: 'Tên sản phẩm ≥ 5 ký tự', hint: f.name.trim().length < 5 ? `Hiện ${f.name.trim().length} ký tự` : undefined })

  const skuDupe = f.sku && store.products.find((p) => p.sku.toLowerCase() === f.sku.trim().toLowerCase() && p.id !== editingId.value)
  checks.push({ id: 'sku-unique', level: skuDupe ? 'error' : 'ok', label: 'SKU không trùng', hint: skuDupe ? `Trùng với "${skuDupe.name}"` : undefined })

  const slugDupe = f.slug && store.products.find((p) => p.slug.toLowerCase() === f.slug.trim().toLowerCase() && p.id !== editingId.value)
  checks.push({ id: 'slug-unique', level: slugDupe ? 'error' : 'ok', label: 'Slug không trùng', hint: slugDupe ? `Trùng với SP #${slugDupe.id}` : undefined })

  const nameDupe = f.name && store.products.find((p) => p.name.toLowerCase().trim() === f.name.toLowerCase().trim() && p.id !== editingId.value)
  if (nameDupe) checks.push({ id: 'name-dupe', level: 'warn', label: 'Trùng tên với SP khác', hint: `SKU: ${nameDupe.sku}` })

  const catExists = !f.category || store.categoryOptions.includes(f.category) || store.categories.some((c) => c.name === f.category)
  checks.push({ id: 'category', level: !f.category ? 'warn' : catExists ? 'ok' : 'warn', label: 'Danh mục', hint: !f.category ? 'Chưa chọn' : !catExists ? 'Mới — sẽ tạo' : f.category })
  checks.push({ id: 'brand', level: !f.brand ? 'warn' : 'ok', label: 'Thương hiệu', hint: !f.brand ? 'Chưa nhập' : f.brand })
  checks.push({ id: 'image', level: !f.image ? 'error' : 'ok', label: 'Có ảnh sản phẩm', hint: !f.image ? 'Cần URL/filename' : undefined })

  if (f.salePrice <= 0) checks.push({ id: 'sale', level: 'error', label: 'Giá lẻ > 0' })
  else checks.push({ id: 'sale', level: 'ok', label: 'Giá lẻ > 0', hint: f.salePrice.toLocaleString() + ' ₫' })

  if (f.originalPrice > 0 && f.salePrice > f.originalPrice) checks.push({ id: 'sale-vs-orig', level: 'error', label: 'Giá lẻ ≤ Giá gốc', hint: `${f.salePrice.toLocaleString()} > ${f.originalPrice.toLocaleString()}` })
  if (f.wholesalePrice > 0 && f.wholesalePrice > f.salePrice) checks.push({ id: 'ws-vs-sale', level: 'warn', label: 'Giá sỉ ≤ Giá lẻ', hint: 'Giá sỉ cao hơn giá lẻ' })
  if (f.cost > 0 && f.cost > f.wholesalePrice && f.wholesalePrice > 0) checks.push({ id: 'cost-ws', level: 'warn', label: 'Giá vốn ≤ Giá sỉ', hint: 'Bán sỉ lỗ vốn' })
  if (f.cost > 0 && f.cost > f.salePrice) checks.push({ id: 'cost-sale', level: 'error', label: 'Giá vốn ≤ Giá lẻ', hint: `Bán lẻ lỗ ${(f.cost - f.salePrice).toLocaleString()} ₫` })

  if (f.stock < 0) checks.push({ id: 'stock', level: 'error', label: 'Tồn kho ≥ 0' })
  else if (f.stock === 0) checks.push({ id: 'stock', level: 'warn', label: 'Có tồn kho ban đầu', hint: 'Tồn = 0 → tự chuyển "Hết hàng"' })
  else checks.push({ id: 'stock', level: 'ok', label: 'Tồn kho ban đầu', hint: `${f.stock} đv` })

  if (f.reserved > f.stock) checks.push({ id: 'reserved', level: 'error', label: 'Đặt giữ ≤ Tồn kho' })
  if (f.threshold <= 0) checks.push({ id: 'threshold', level: 'warn', label: 'Định mức cảnh báo > 0' })
  if (f.status === 'active' && f.stock === 0) checks.push({ id: 'status', level: 'info', label: 'Auto: Trạng thái → Hết hàng' })

  if (f.cost > 0 && f.salePrice > 0) {
    const margin = Math.round(((f.salePrice - f.cost) / f.salePrice) * 100)
    checks.push({
      id: 'margin',
      level: margin < 10 ? 'warn' : margin < 25 ? 'info' : 'ok',
      label: `Biên LN bán lẻ: ${margin}%`,
      hint: margin < 10 ? 'Biên LN thấp' : margin < 25 ? 'Trung bình' : 'Tốt',
    })
  }

  return checks
})

const validationErrors = computed(() => validations.value.filter((c) => c.level === 'error'))
const validationWarnings = computed(() => validations.value.filter((c) => c.level === 'warn'))
const canSubmit = computed(() => validationErrors.value.length === 0)

const formOpen = ref(false)
const stockOpen = ref(false)
const detailOpen = ref(false)
const confirmOpen = ref(false)
const form = ref<FormState>(emptyForm())
const editingId = ref<number | null>(null)
const stockTarget = ref<AdminProduct | null>(null)
const stockDelta = ref(0)
const detail = ref<AdminProduct | null>(null)
const confirmCtx = ref<{ title: string; message: string; tone: 'danger' | 'primary'; action: () => void } | null>(null)

// Section selection (uses section.id string, syncs to section.productIds[])
const selectedSectionKey = ref<string | null>(null)

function openCreate() {
  editingId.value = null
  form.value = emptyForm()
  selectedSectionKey.value = null
  formOpen.value = true
}

function openEdit(p: AdminProduct) {
  editingId.value = p.id
  form.value = { ...p }
  selectedSectionKey.value = store.sections.find((s) => s.productIds.includes(p.id))?.id || null
  formOpen.value = true
}

function openDetail(p: AdminProduct) {
  detail.value = p
  detailOpen.value = true
}

function recomputeDiscount() {
  if (form.value.originalPrice > 0 && form.value.salePrice > 0 && form.value.salePrice < form.value.originalPrice) {
    form.value.discount = Math.round((1 - form.value.salePrice / form.value.originalPrice) * 100)
  }
}

async function submitForm() {
  // Block submit nếu còn error
  if (!canSubmit.value) {
    const first = validationErrors.value[0]
    toast.error('Còn lỗi cần sửa', first?.label || 'Kiểm tra panel "Kiểm tra hệ thống"')
    return
  }

  if (!form.value.slug) form.value.slug = store.slugify(form.value.name)
  recomputeDiscount()

  // Auto-create category nếu chưa tồn tại
  if (form.value.category && !store.categories.some((c) => c.name === form.value.category)) {
    try {
      await store.addCategory({
        parentId: null,
        name: form.value.category,
        slug: store.slugify(form.value.category),
        icon: 'ri-folder-line',
        showOnMenu: true,
        active: true,
      })
      toast.info('Đã tự tạo danh mục mới', form.value.category)
    } catch (e) { /* ignore */ }
  }

  // Auto-fix status theo stock
  if (form.value.stock === 0 && form.value.status === 'active') {
    form.value.status = 'out_of_stock'
  }

  try {
    let savedProductId: number | null = editingId.value
    if (editingId.value) {
      await store.updateProduct(editingId.value, form.value)
      toast.success('Đã cập nhật sản phẩm', form.value.name)
    } else {
      const newP = await store.addProduct(form.value)
      savedProductId = newP?.id || null
      if (newP && form.value.stock > 0) {
        business.logMovement(newP.id, newP.sku, newP.name, 'in', form.value.stock, 'INIT-' + newP.sku, 'manual', 'Tồn kho ban đầu khi tạo SP')
      }
      toast.success('Đã thêm sản phẩm', `${form.value.name} (SKU: ${form.value.sku})`)
    }

    // Sync section membership: remove from all sections, add to selected one
    if (savedProductId !== null) {
      for (const s of store.sections) {
        if (s.productIds.includes(savedProductId)) {
          if (s.id !== selectedSectionKey.value) {
            await store.updateSection(s.id, { productIds: s.productIds.filter((x) => x !== savedProductId) })
          }
        }
      }
      if (selectedSectionKey.value) {
        const targetSec = store.sections.find((s) => s.id === selectedSectionKey.value)
        if (targetSec && !targetSec.productIds.includes(savedProductId)) {
          await store.updateSection(targetSec.id, { productIds: [...targetSec.productIds, savedProductId] })
          toast.info('Đã gán SP vào khu vực', targetSec.title)
        }
      }
    }

    formOpen.value = false
    await reloadProducts()
    if (validationWarnings.value.length > 0) {
      toast.warning(`Còn ${validationWarnings.value.length} cảnh báo`, 'Đã lưu, kiểm tra lại nếu cần.')
    }
  } catch (e: any) {
    toast.error('Lưu thất bại', e?.response?.data?.message || 'Lỗi không xác định')
  }
}

function openStock(p: AdminProduct) {
  stockTarget.value = p
  stockDelta.value = 0
  stockOpen.value = true
}

function submitStock() {
  if (!stockTarget.value || !stockDelta.value) {
    stockOpen.value = false
    return
  }
  store.adjustStock(stockTarget.value.id, stockDelta.value)
  toast.success('Đã điều chỉnh tồn', `${stockTarget.value.sku}: ${stockDelta.value > 0 ? '+' : ''}${stockDelta.value}`)
  stockOpen.value = false
}

async function duplicate(p: AdminProduct) {
  await store.addProduct({
    ...p,
    sku: p.sku + '-COPY',
    name: p.name + ' (Bản sao)',
    stock: 0,
    status: 'draft',
  })
  await reloadProducts()
  toast.success('Đã nhân bản', p.name)
}

function askDelete(p: AdminProduct) {
  confirmCtx.value = {
    title: `Xoá "${p.name}"?`,
    message: `SKU ${p.sku} sẽ bị xoá vĩnh viễn.`,
    tone: 'danger',
    action: () => {
      store.removeProduct(p.id).then(() => reloadProducts())
      toast.success('Đã xoá sản phẩm', p.sku)
    },
  }
  confirmOpen.value = true
}

function onRowAction(p: AdminProduct, key: string) {
  if (key === 'view') openDetail(p)
  else if (key === 'edit') openEdit(p)
  else if (key === 'stock') openStock(p)
  else if (key === 'duplicate') duplicate(p)
  else if (key === 'delete') askDelete(p)
}

const rowItems = [
  { key: 'view', label: 'Xem chi tiết', icon: 'ri-eye-line' },
  { key: 'edit', label: 'Chỉnh sửa', icon: 'ri-edit-line' },
  { key: 'stock', label: 'Điều chỉnh tồn', icon: 'ri-archive-line' },
  { key: 'duplicate', label: 'Nhân bản', icon: 'ri-file-copy-line' },
  { key: 'delete', label: 'Xoá sản phẩm', icon: 'ri-delete-bin-line', tone: 'danger' as const },
]

type ImportField = { key: string; label: string; required?: boolean }
type ImportPreviewData = {
  columns: string[]
  rows: Record<string, any>[]
  rowCount: number
  mapping: Record<string, string>
  fields: ImportField[]
}

const importOpen = ref(false)
const importLoading = ref(false)
const importSaving = ref(false)
const importFile = ref<File | null>(null)
const importPreviewData = ref<ImportPreviewData | null>(null)
const importMapping = ref<Record<string, string>>({})
const updateExisting = ref(false)

const importPreviewFields = computed(() => {
  const keys = ['sku', 'barcode', 'name', 'product_type', 'category_path', 'category', 'brand', 'original_price', 'sale_price', 'wholesale_price', 'cost', 'stock', 'reserved', 'threshold', 'unit', 'status']
  return importPreviewData.value?.fields.filter((field) => keys.includes(field.key)) || []
})

function importProducts() {
  importFile.value = null
  importPreviewData.value = null
  importMapping.value = {}
  updateExisting.value = false
  importOpen.value = true
}

async function handleImportFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] || null
  importFile.value = file
  importPreviewData.value = null
  importMapping.value = {}

  if (!file) return

  importLoading.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)
    const res = await shopProductsApi.importPreview(formData)
    const data = res.data.data as ImportPreviewData
    importPreviewData.value = data
    importMapping.value = { ...data.mapping }
    toast.success('Đã đọc file', `${data.rowCount} dòng · ${data.columns.length} cột`)
  } catch (e: any) {
    toast.error('Không đọc được file', e?.response?.data?.message || 'Kiểm tra định dạng Excel/CSV')
  } finally {
    importLoading.value = false
  }
}

function previewImportCell(row: Record<string, any>, fieldKey: string) {
  const column = importMapping.value[fieldKey]
  const value = column ? row[column] : ''
  if (value === null || value === undefined || value === '') return '—'
  return String(value)
}

async function submitImportProducts() {
  if (!importFile.value) {
    toast.error('Chưa chọn file')
    return
  }
  if (!importMapping.value.name) {
    toast.error('Thiếu mapping', 'Cần chọn cột Tên sản phẩm.')
    return
  }

  importSaving.value = true
  try {
    const formData = new FormData()
    formData.append('file', importFile.value)
    formData.append('mapping', JSON.stringify(importMapping.value))
    formData.append('update_existing', updateExisting.value ? '1' : '0')

    const res = await shopProductsApi.importProducts(formData)
    const report = res.data.data || {}
    store.invalidateCache()
    await store.fetchCatalogData({ force: true })
    await reloadProducts()
    importOpen.value = false
    toast.success(
      'Đã nhập sản phẩm',
      `Tạo ${report.created || 0} · Cập nhật ${report.updated || 0} · Bỏ qua ${report.skipped || 0}`
    )
    if ((report.errors || []).length) {
      toast.warning('Có dòng bị bỏ qua', `${report.errors.length} lỗi đầu tiên đã được ghi nhận.`)
    }
  } catch (e: any) {
    toast.error('Nhập sản phẩm thất bại', e?.response?.data?.message || 'Lỗi không xác định')
  } finally {
    importSaving.value = false
  }
}

async function exportProducts() {
  const params: Record<string, any> = {}
  if (filterStatus.value !== 'all') params.status = filterStatus.value
  if (filterCategory.value !== 'all') params.category = filterCategory.value
  if (filterBrand.value !== 'all') params.brand = filterBrand.value
  if (search.value.trim()) params.q = search.value.trim()

  try {
    const res = await shopProductsApi.exportProducts(params)
    const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    const stamp = new Date().toISOString().slice(0, 10)
    link.href = url
    link.download = `shop-products-${stamp}.xlsx`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
    toast.success('Đã xuất file', `${productTotal.value} sản phẩm`)
  } catch (e: any) {
    toast.error('Xuất file thất bại', e?.response?.data?.message || 'Lỗi không xác định')
  }
}
</script>

<template>
  <div class="ym-page">
    <header class="ym-page__header">
      <div>
        <h1>Sản phẩm</h1>
        <p>{{ stats.total }} sản phẩm · {{ stats.active }} đang bán · Giá trị tồn {{ formatPrice(stats.totalValue) }}</p>
      </div>
      <div class="ym-page__actions">
        <button type="button" class="ym-btn" @click="importProducts"><i class="ri-upload-2-line"></i> Nhập</button>
        <button type="button" class="ym-btn" @click="exportProducts"><i class="ri-download-2-line"></i> Xuất</button>
        <button type="button" class="ym-btn ym-btn--primary" @click="openCreate"><i class="ri-add-line"></i> Thêm sản phẩm</button>
      </div>
    </header>

    <section class="ym-mini-stats">
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Tổng sản phẩm</p><p class="ym-mini-stat__value">{{ stats.total }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Đang bán</p><p class="ym-mini-stat__value" style="color: #166534">{{ stats.active }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Sắp hết hàng</p><p class="ym-mini-stat__value" style="color: #92400e">{{ stats.lowStock }}</p></article>
      <article class="ym-mini-stat"><p class="ym-mini-stat__label">Hết hàng</p><p class="ym-mini-stat__value" style="color: #991b1b">{{ stats.outOfStock }}</p></article>
    </section>

    <div class="ym-card">
      <div class="ym-toolbar">
        <div class="ym-search">
          <i class="ri-search-line"></i>
          <input v-model="search" type="text" placeholder="Tìm theo tên, SKU, thương hiệu..." />
        </div>
        <div class="ym-toolbar__actions">
          <select v-model="filterCategory" class="ym-select">
            <option value="all">Tất cả danh mục</option>
            <option v-for="cat in filterCategoryOptions" :key="cat" :value="cat">{{ cat }}</option>
          </select>
          <select v-model="filterBrand" class="ym-select">
            <option value="all">Tất cả thương hiệu</option>
            <option v-for="b in filterBrandOptions" :key="b" :value="b">{{ b }}</option>
          </select>
          <select v-model="filterStatus" class="ym-select">
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang bán</option>
            <option value="draft">Nháp</option>
            <option value="out_of_stock">Hết hàng</option>
          </select>
          <div class="ym-view-toggle">
            <button type="button" :class="{ 'is-active': view === 'grid' }" @click="view = 'grid'"><i class="ri-grid-line"></i></button>
            <button type="button" :class="{ 'is-active': view === 'list' }" @click="view = 'list'"><i class="ri-list-check"></i></button>
          </div>
        </div>
      </div>

      <!-- Grid view -->
      <div v-if="view === 'grid'" class="ym-product-grid">
        <article v-for="p in paginated" :key="p.id" class="ym-product-card" @click="openDetail(p)">
          <div class="ym-product-card__media">
            <img :src="p.image" :alt="p.name" loading="lazy" />
            <span v-if="p.discount" class="ym-product-card__discount">-{{ p.discount }}%</span>
            <span :class="['ym-tag', `ym-tag--${statusMap[p.status]?.tone || 'neutral'}`, 'ym-product-card__status']">
              {{ statusMap[p.status]?.label || p.status }}
            </span>
          </div>
          <div class="ym-product-card__body">
            <p class="ym-product-card__sku">{{ p.sku }} · {{ p.category }}</p>
            <h3 class="ym-product-card__name">{{ p.name }}</h3>
            <div class="ym-product-card__brand">
              <img v-if="getBrandLogo(p.brand)" :src="getBrandLogo(p.brand)" :alt="p.brand" />
              <span v-else>{{ p.brand }}</span>
            </div>
            <div class="ym-product-card__prices">
              <strong>{{ formatPrice(p.salePrice) }}</strong>
              <small v-if="p.originalPrice > p.salePrice">{{ formatPrice(p.originalPrice) }}</small>
            </div>
            <div class="ym-product-card__bottom">
              <span class="ym-wholesale">Sỉ: {{ formatPrice(p.wholesalePrice) }}</span>
              <span :class="p.stock === 0 ? 'is-danger' : p.stock < p.threshold ? 'is-warning' : 'is-muted'">
                Tồn {{ p.stock }}
              </span>
            </div>
          </div>
          <div class="ym-product-card__actions" @click.stop>
            <button type="button" class="ym-btn ym-btn--sm" @click="openEdit(p)"><i class="ri-edit-line"></i> Sửa</button>
            <RowMenu :items="rowItems" @select="onRowAction(p, $event)" />
          </div>
        </article>
        <div v-if="!filtered.length" class="ym-empty" style="grid-column: 1 / -1">Không có sản phẩm phù hợp.</div>
      </div>

      <!-- List view -->
      <div v-else class="ym-table-wrap">
        <table class="ym-table">
          <thead>
            <tr>
              <th>Sản phẩm</th>
              <th>Danh mục</th>
              <th>Thương hiệu</th>
              <th class="is-right">Giá lẻ</th>
              <th class="is-right">Giá sỉ</th>
              <th class="is-right">Giá vốn</th>
              <th class="is-center">Tồn</th>
              <th>Trạng thái</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in paginated" :key="p.id">
              <td>
                <div class="ym-customer">
                  <img :src="p.image" :alt="p.name" class="ym-product-thumb" loading="lazy" />
                  <div class="ym-cell-user">
                    <a href="#" class="ym-link" @click.prevent="openDetail(p)">{{ p.name }}</a>
                    <small>{{ p.sku }}</small>
                  </div>
                </div>
              </td>
              <td><button type="button" class="ym-cat-link" @click="gotoCategory(p.category)">{{ p.category }}</button></td>
              <td>{{ p.brand }}</td>
              <td class="is-right">
                <strong>{{ formatPrice(p.salePrice) }}</strong>
                <small v-if="p.discount" class="ym-discount">-{{ p.discount }}%</small>
              </td>
              <td class="is-right is-muted">{{ formatPrice(p.wholesalePrice) }}</td>
              <td class="is-right is-muted">{{ formatPrice(p.cost) }}</td>
              <td class="is-center" :class="p.stock === 0 ? 'is-danger' : p.stock < p.threshold ? 'is-warning' : ''">{{ p.stock }}</td>
              <td><span :class="['ym-tag', `ym-tag--${statusMap[p.status]?.tone || 'neutral'}`]">{{ statusMap[p.status]?.label || p.status }}</span></td>
              <td class="is-right">
                <RowMenu :items="rowItems" @select="onRowAction(p, $event)" />
              </td>
            </tr>
            <tr v-if="!filtered.length"><td colspan="9" class="ym-empty">Không có sản phẩm.</td></tr>
          </tbody>
        </table>
      </div>

      <Pagination
        v-model="page"
        :total-items="productTotal"
        :per-page="perPage"
        :per-page-options="[5, 10, 20, 50, 100]"
        item-label="sản phẩm"
        @update:per-page="(n) => perPage = n"
      />
    </div>

    <!-- Import modal -->
    <AdminModal v-model:open="importOpen" title="Nhập sản phẩm từ Excel" size="xl" confirm-text="Nhập dữ liệu" :loading="importSaving" @confirm="submitImportProducts">
      <div class="ym-import">
        <label class="ym-import-uploader" :class="{ 'is-loading': importLoading }">
          <input type="file" accept=".xlsx,.xls,.csv" @change="handleImportFile" />
          <i :class="importLoading ? 'ri-loader-4-line adm-spin' : 'ri-file-excel-2-line'"></i>
          <span>
            <strong>{{ importFile?.name || 'Chọn file Excel/CSV' }}</strong>
            <small>{{ importLoading ? 'Đang đọc dữ liệu...' : 'Hệ thống sẽ tự nhận cột và gợi ý mapping.' }}</small>
          </span>
        </label>

        <label class="ym-import-option">
          <input v-model="updateExisting" type="checkbox" />
          <span>Cập nhật sản phẩm trùng SKU</span>
        </label>

        <div v-if="importPreviewData" class="ym-import-preview">
          <div class="ym-import-summary">
            <span><strong>{{ importPreviewData.rowCount }}</strong> dòng dữ liệu</span>
            <span><strong>{{ importPreviewData.columns.length }}</strong> cột</span>
            <span><strong>{{ Object.keys(importMapping).filter(k => importMapping[k]).length }}</strong> cột đã map</span>
          </div>

          <div class="ym-import-columns">
            <span v-for="column in importPreviewData.columns" :key="column">{{ column }}</span>
          </div>

          <div class="ym-import-grid">
            <section>
              <h4>Mapping cột</h4>
              <div class="ym-import-map">
                <label v-for="field in importPreviewData.fields" :key="field.key">
                  <span>{{ field.label }} <b v-if="field.required">*</b></span>
                  <select v-model="importMapping[field.key]">
                    <option value="">Bỏ qua</option>
                    <option v-for="column in importPreviewData.columns" :key="column" :value="column">{{ column }}</option>
                  </select>
                </label>
              </div>
            </section>

            <section>
              <h4>Xem trước dữ liệu</h4>
              <div class="ym-import-table-wrap">
                <table class="ym-import-table">
                  <thead>
                    <tr>
                      <th v-for="field in importPreviewFields" :key="field.key">{{ field.label }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(row, idx) in importPreviewData.rows" :key="idx">
                      <td v-for="field in importPreviewFields" :key="field.key">{{ previewImportCell(row, field.key) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>
      </div>
    </AdminModal>

    <!-- Form modal -->
    <AdminModal v-model:open="formOpen" :title="editingId ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'" size="xl" :confirm-text="editingId ? 'Lưu thay đổi' : (canSubmit ? 'Tạo sản phẩm' : `Còn ${validationErrors.length} lỗi`)" @confirm="submitForm">
      <!-- Validation panel -->
      <section class="ym-validate">
        <header class="ym-validate__header">
          <h4>
            <i class="ri-shield-check-line"></i>
            Kiểm tra hệ thống
          </h4>
          <div class="ym-validate__summary">
            <span :class="['ym-validate__pill', { 'is-active': validationErrors.length }]">
              <i class="ri-close-circle-fill"></i> {{ validationErrors.length }} lỗi
            </span>
            <span :class="['ym-validate__pill', 'is-warn', { 'is-active': validationWarnings.length }]">
              <i class="ri-error-warning-fill"></i> {{ validationWarnings.length }} cảnh báo
            </span>
            <span class="ym-validate__pill is-ok">
              <i class="ri-checkbox-circle-fill"></i> {{ validations.filter(c => c.level === 'ok').length }} hợp lệ
            </span>
          </div>
        </header>
        <ul class="ym-validate__list">
          <li v-for="check in validations" :key="check.id" :class="['ym-validate__item', `is-${check.level}`]">
            <i :class="check.level === 'ok' ? 'ri-checkbox-circle-line' : check.level === 'error' ? 'ri-close-circle-line' : check.level === 'warn' ? 'ri-error-warning-line' : 'ri-information-line'"></i>
            <span class="ym-validate__label">{{ check.label }}</span>
            <span v-if="check.hint" class="ym-validate__hint">{{ check.hint }}</span>
          </li>
        </ul>
      </section>

      <div class="ym-form-grid-img">
        <div>
          <div class="ym-image-input">
            <img v-if="form.image" :src="form.image" :alt="form.name" />
            <div v-else class="ym-image-input__placeholder">
              <i class="ri-image-add-line"></i>
              <span>Chưa có ảnh</span>
            </div>
          </div>
          <div class="ym-form-group">
            <label>URL ảnh sản phẩm</label>
            <input v-model="form.image" type="url" placeholder="https://..." />
            <p class="ym-form-help">Có thể dán URL hoặc đường dẫn nội bộ.</p>
          </div>
        </div>
        <div>
          <div class="ym-form-row">
            <div class="ym-form-group"><label>SKU *</label><input v-model="form.sku" type="text" /></div>
            <div class="ym-form-group">
              <label>Trạng thái</label>
              <select v-model="form.status">
                <option value="active">Đang bán</option>
                <option value="draft">Nháp</option>
                <option value="out_of_stock">Hết hàng</option>
              </select>
            </div>
          </div>
          <div class="ym-form-group"><label>Tên sản phẩm *</label><input v-model="form.name" type="text" /></div>
          <div class="ym-form-row">
            <div class="ym-form-group">
              <label>
                Danh mục
                <button type="button" class="ym-mini-add" @click="openNewCat"><i class="ri-add-line"></i> Thêm mới</button>
              </label>
              <select v-model="form.category">
                <option value="">— Chọn danh mục —</option>
                <option v-for="opt in categoryDropdownOptions" :key="opt.id" :value="opt.name" :disabled="!opt.isVisible">
                  {{ '— '.repeat(opt.depth) }}{{ opt.name }}{{ !opt.isVisible ? ' (Ẩn)' : '' }}
                </option>
              </select>
              <p v-if="form.category && !store.categories.some(c => c.name === form.category)" class="ym-form-help" style="color: #92400e">
                <i class="ri-error-warning-line"></i> Danh mục mới — sẽ tự tạo khi lưu
              </p>
            </div>
            <div class="ym-form-group">
              <label>
                Thương hiệu
                <button type="button" class="ym-mini-add" @click="openNewBrand"><i class="ri-add-line"></i> Thêm mới</button>
              </label>
              <select v-model="form.brand">
                <option value="">— Chọn thương hiệu —</option>
                <option v-for="b in store.brandOptions" :key="b" :value="b">{{ b }}</option>
                <option v-if="form.brand && !store.brandOptions.includes(form.brand)" :value="form.brand">{{ form.brand }} (mới)</option>
              </select>
            </div>
          </div>
          <div class="ym-form-row">
            <div class="ym-form-group">
              <label>Slug (URL)</label>
              <input v-model="form.slug" type="text" :placeholder="form.name ? store.slugify(form.name) : 'auto-tao-tu-ten'" />
              <p v-if="form.slug" class="ym-form-help">URL: /products/{{ form.slug }}</p>
            </div>
            <div class="ym-form-group">
              <label>
                Kho lưu trữ
                <button type="button" class="ym-mini-add" @click="openNewWh"><i class="ri-add-line"></i> Thêm kho</button>
              </label>
              <select v-model="form.warehouse">
                <option value="">— Chọn kho —</option>
                <option v-for="w in store.warehouseOptions" :key="w" :value="w">{{ w }}</option>
                <option v-if="form.warehouse && !store.warehouseOptions.includes(form.warehouse)" :value="form.warehouse">{{ form.warehouse }} (mới)</option>
              </select>
            </div>
          </div>

          <!-- Section + visibility toggles -->
          <div class="ym-form-row">
            <div class="ym-form-group">
              <label>
                Khu vực hiển thị (trang chủ)
                <RouterLink to="/admin/sections" class="ym-mini-add"><i class="ri-settings-3-line"></i> Quản lý</RouterLink>
              </label>
              <select v-model="selectedSectionKey">
                <option :value="null">— Không gán khu vực —</option>
                <option v-for="s in store.sections" :key="s.id" :value="s.id">{{ s.title }}</option>
              </select>
              <p class="ym-form-help">SP sẽ xuất hiện trong khu vực này trên trang chủ. Mỗi SP chỉ thuộc 1 khu vực.</p>
            </div>
            <div class="ym-form-group">
              <label>Đánh dấu nổi bật</label>
              <div class="ym-feature-toggles">
                <label class="ym-feature-toggle" :class="{ 'is-on': form.isHotDeal }">
                  <input v-model="form.isHotDeal" type="checkbox" />
                  <i class="ri-fire-fill"></i>
                  <span>Hot Deal</span>
                </label>
                <label class="ym-feature-toggle" :class="{ 'is-on': form.isSuggested }">
                  <input v-model="form.isSuggested" type="checkbox" />
                  <i class="ri-heart-fill"></i>
                  <span>Gợi ý cho bạn</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="ym-form-section">
        <h4>Giá</h4>
        <div class="ym-form-row">
          <div class="ym-form-group">
            <label>Giá gốc (₫)</label>
            <input v-model.number="form.originalPrice" type="number" min="0" @blur="recomputeDiscount" />
          </div>
          <div class="ym-form-group">
            <label>Giá lẻ (₫)</label>
            <input v-model.number="form.salePrice" type="number" min="0" @blur="recomputeDiscount" />
          </div>
          <div class="ym-form-group"><label>Giá sỉ (₫)</label><input v-model.number="form.wholesalePrice" type="number" min="0" /></div>
          <div class="ym-form-group"><label>Giá vốn (₫)</label><input v-model.number="form.cost" type="number" min="0" /></div>
          <div class="ym-form-group"><label>Giảm (%)</label><input v-model.number="form.discount" type="number" min="0" max="100" /></div>
        </div>
      </div>

      <div class="ym-form-section">
        <h4>Tồn kho</h4>
        <div class="ym-form-row">
          <div class="ym-form-group"><label>Tồn kho</label><input v-model.number="form.stock" type="number" min="0" /></div>
          <div class="ym-form-group"><label>Đặt giữ</label><input v-model.number="form.reserved" type="number" min="0" /></div>
          <div class="ym-form-group"><label>Định mức cảnh báo</label><input v-model.number="form.threshold" type="number" min="0" /></div>
        </div>
      </div>

      <div class="ym-form-group"><label>Mô tả</label><textarea v-model="form.description" rows="3"></textarea></div>
    </AdminModal>

    <!-- Detail modal -->
    <AdminModal v-if="detail" v-model:open="detailOpen" :title="detail.name" :subtitle="`${detail.sku} · ${detail.brand}`" size="lg" hide-footer>
      <div class="ym-detail-product">
        <img :src="detail.image" :alt="detail.name" class="ym-detail-product__img" />
        <div class="ym-detail-product__info">
          <button type="button" class="ym-cat-link" @click="detailOpen = false; gotoCategory(detail.category)">
            <i class="ri-folder-line"></i> {{ detail.category }}
          </button>
          <h3>{{ detail.name }}</h3>
          <div class="ym-detail-product__prices">
            <strong>{{ formatPrice(detail.salePrice) }}</strong>
            <small v-if="detail.originalPrice > detail.salePrice">{{ formatPrice(detail.originalPrice) }}</small>
            <span v-if="detail.discount" class="ym-discount">-{{ detail.discount }}%</span>
          </div>
          <div class="ym-detail-product__grid">
            <div><label>Giá sỉ</label><strong>{{ formatPrice(detail.wholesalePrice) }}</strong></div>
            <div><label>Giá vốn</label><strong>{{ formatPrice(detail.cost) }}</strong></div>
            <div><label>Tồn kho</label><strong>{{ detail.stock }}</strong></div>
            <div><label>Đặt giữ</label><strong>{{ detail.reserved }}</strong></div>
            <div><label>Khả dụng</label><strong>{{ detail.stock - detail.reserved }}</strong></div>
            <div><label>Kho</label><strong>{{ detail.warehouse }}</strong></div>
            <div><label>Trạng thái</label><span :class="['ym-tag', `ym-tag--${statusMap[detail.status]?.tone || 'neutral'}`]">{{ statusMap[detail.status]?.label || detail.status }}</span></div>
            <div><label>Ngày tạo</label><strong>{{ detail.createdAt }}</strong></div>
          </div>

          <!-- Giá theo nhóm khách (từ bảng giá) -->
          <div class="ym-price-grid">
            <h4>Giá theo nhóm khách</h4>
            <div class="ym-price-rows">
              <div v-for="g in business.customerGroups.filter(g => g.active)" :key="g.id" class="ym-price-row">
                <span class="ym-price-row__dot" :style="{ background: g.color }"></span>
                <span class="ym-price-row__name">{{ g.name }}</span>
                <span v-if="g.discount > 0" class="ym-tag ym-tag--success" style="font-size: 10px; padding: 1px 6px">-{{ g.discount }}%</span>
                <strong>{{ formatPrice(priceForGroup(detail.id, g.code)) }}</strong>
              </div>
            </div>
          </div>

          <!-- Bảng giá đang áp dụng -->
          <div v-if="priceListsForProduct(detail.id).length" class="ym-applied-pl">
            <h4>Bảng giá áp dụng</h4>
            <div class="ym-pl-chips">
              <RouterLink v-for="pl in priceListsForProduct(detail.id)" :key="pl.id" to="/admin/price-list" class="ym-pl-chip">
                <i class="ri-price-tag-3-line"></i> {{ pl.name }}
                <span style="color: #d0021b; font-weight: 600">
                  {{ pl.type === 'percent' ? `${pl.value}%` : formatPrice(pl.value) }}
                </span>
              </RouterLink>
            </div>
          </div>

          <div class="ym-detail-product__actions">
            <button type="button" class="ym-btn" @click="detailOpen = false; openStock(detail!)"><i class="ri-archive-line"></i> Điều chỉnh tồn</button>
            <button type="button" class="ym-btn ym-btn--primary" @click="detailOpen = false; openEdit(detail!)"><i class="ri-edit-line"></i> Chỉnh sửa</button>
          </div>
        </div>
      </div>
    </AdminModal>

    <!-- Stock modal -->
    <AdminModal v-if="stockTarget" v-model:open="stockOpen" :title="`Điều chỉnh tồn: ${stockTarget.sku}`" size="sm" confirm-text="Cập nhật" @confirm="submitStock">
      <p style="margin: 0 0 12px; font-size: 14px; color: #4b5563">
        {{ stockTarget.name }}<br>
        Tồn hiện tại: <strong>{{ stockTarget.stock }}</strong> · Sau điều chỉnh:
        <strong>{{ Math.max(0, stockTarget.stock + stockDelta) }}</strong>
      </p>
      <div class="ym-form-group">
        <label>Số lượng (+/-)</label>
        <input v-model.number="stockDelta" type="number" />
        <p class="ym-form-help">Số dương để nhập kho, số âm để xuất kho.</p>
      </div>
    </AdminModal>

    <AdminModal v-if="confirmCtx" v-model:open="confirmOpen" :title="confirmCtx.title" size="sm" :confirm-tone="confirmCtx.tone" confirm-text="Xác nhận" @confirm="confirmCtx.action(); confirmOpen = false">
      <p style="margin: 0; color: #4b5563">{{ confirmCtx.message }}</p>
    </AdminModal>

    <!-- Quick create category -->
    <AdminModal v-model:open="newCatOpen" title="Thêm danh mục nhanh" size="sm" confirm-text="Tạo + chọn" @confirm="createNewCat">
      <div class="ym-form-group"><label>Tên danh mục *</label><input v-model="newCatName" type="text" placeholder="Vd: Mỹ phẩm Hàn Quốc" autofocus /></div>
      <div class="ym-form-group">
        <label>Danh mục cha</label>
        <select v-model="newCatParent">
          <option :value="null">— Tạo ở cấp gốc —</option>
          <option v-for="c in store.categories.filter(x => x.parentId === null)" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
      </div>
      <p class="ym-form-help">Danh mục sẽ tự động hiện trên menu trang chủ.</p>
    </AdminModal>

    <!-- Quick add brand -->
    <AdminModal v-model:open="newBrandOpen" title="Thêm thương hiệu" size="sm" confirm-text="Chọn" @confirm="createNewBrand">
      <div class="ym-form-group"><label>Tên thương hiệu *</label><input v-model="newBrandName" type="text" placeholder="Vd: Innisfree" autofocus /></div>
      <p class="ym-form-help">Thương hiệu sẽ tự xuất hiện trong dropdown sau khi gán cho SP.</p>
    </AdminModal>

    <!-- Quick add warehouse -->
    <AdminModal v-model:open="newWhOpen" title="Thêm kho" size="sm" confirm-text="Chọn" @confirm="createNewWh">
      <div class="ym-form-group"><label>Tên kho *</label><input v-model="newWhName" type="text" placeholder="Vd: Kho Đà Nẵng" autofocus /></div>
    </AdminModal>
  </div>
</template>

<style scoped src="./_admin-shared.css"></style>
<style scoped>
.ym-customer { display: flex; align-items: center; gap: 10px; }
.ym-select { padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 8px; background: #fff; font-size: 14px; }
.ym-view-toggle { display: inline-flex; border: 1px solid #d1d5db; border-radius: 8px; overflow: hidden; }
.ym-view-toggle button { width: 36px; height: 36px; border: none; background: #fff; color: #6b7280; cursor: pointer; }
.ym-view-toggle button.is-active { background: #326e51; color: #fff; }

.ym-product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 14px; padding: 16px; }
.ym-product-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; display: flex; flex-direction: column; overflow: hidden; cursor: pointer; transition: all 0.15s; }
.ym-product-card:hover { border-color: #326e51; box-shadow: 0 4px 12px rgba(0,0,0,0.06); transform: translateY(-2px); }
.ym-product-card__media { position: relative; background: #fafbfc; aspect-ratio: 1; display: flex; align-items: center; justify-content: center; border-bottom: 1px solid #f1f3f5; overflow: hidden; }
.ym-product-card__media img { width: 100%; height: 100%; object-fit: contain; padding: 8px; }
.ym-product-card__discount {
  position: absolute; top: 8px; left: 8px;
  background: #d0021b; color: #fff;
  padding: 2px 8px; border-radius: 999px;
  font-size: 11px; font-weight: 600;
}
.ym-product-card__status { position: absolute; top: 8px; right: 8px; }
.ym-product-card__body { padding: 10px 12px; flex: 1; display: flex; flex-direction: column; gap: 4px; }
.ym-product-card__sku { margin: 0; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.4px; }
.ym-product-card__name { margin: 0; font-size: 13px; font-weight: 500; color: #111827; line-height: 1.4; min-height: 36px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.ym-product-card__brand { font-size: 12px; color: #6b7280; height: 18px; }
.ym-product-card__brand img { height: 18px; max-width: 80px; object-fit: contain; }
.ym-product-card__prices { display: flex; gap: 8px; align-items: baseline; }
.ym-product-card__prices strong { color: #d0021b; font-size: 14px; }
.ym-product-card__prices small { color: #9ca3af; font-size: 12px; text-decoration: line-through; }
.ym-product-card__bottom {
  display: flex; justify-content: space-between; align-items: center;
  font-size: 11px; padding-top: 4px; border-top: 1px dashed #f1f3f5;
}
.ym-product-card__bottom .is-danger { color: #d0021b; font-weight: 600; }
.ym-product-card__bottom .is-warning { color: #92400e; font-weight: 600; }
.ym-product-card__bottom .is-muted { color: #6b7280; }
.ym-wholesale { color: #2563eb; font-weight: 500; }
.ym-product-card__actions { display: flex; align-items: center; gap: 6px; padding: 8px 12px; border-top: 1px solid #f1f3f5; }
.ym-product-card__actions .ym-btn { flex: 1; justify-content: center; }

.ym-product-thumb {
  width: 44px; height: 44px; border-radius: 8px;
  object-fit: contain; padding: 2px;
  background: #fafbfc; border: 1px solid #f1f3f5;
  flex-shrink: 0;
}
.ym-discount {
  display: inline-block; margin-left: 6px;
  background: #fee2e2; color: #d0021b;
  padding: 1px 6px; border-radius: 4px;
  font-size: 11px; font-weight: 600;
}

.ym-table .is-danger { color: #d0021b; font-weight: 600; }
.ym-table .is-warning { color: #92400e; font-weight: 600; }

.ym-form-grid-img {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 16px;
  margin-bottom: 16px;
}
@media (max-width: 720px) { .ym-form-grid-img { grid-template-columns: 1fr; } }
.ym-image-input {
  aspect-ratio: 1;
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  background: #fafbfc;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 12px;
  overflow: hidden;
}
.ym-image-input img { width: 100%; height: 100%; object-fit: contain; padding: 8px; }
.ym-image-input__placeholder {
  display: flex; flex-direction: column; align-items: center;
  color: #9ca3af; font-size: 13px; gap: 6px;
}
.ym-image-input__placeholder i { font-size: 36px; }

.ym-form-section {
  border-top: 1px solid #f1f3f5;
  padding-top: 14px;
  margin-top: 6px;
}
.ym-form-section h4 {
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: 600;
  color: #4b5563;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.ym-detail-product { display: grid; grid-template-columns: 280px 1fr; gap: 16px; }
@media (max-width: 720px) { .ym-detail-product { grid-template-columns: 1fr; } }
.ym-detail-product__img {
  width: 100%; aspect-ratio: 1;
  background: #fafbfc; border-radius: 10px;
  object-fit: contain; padding: 12px;
  border: 1px solid #f1f3f5;
}
.ym-detail-product__info { display: flex; flex-direction: column; gap: 10px; }
.ym-detail-product__info h3 { margin: 0; font-size: 16px; color: #111827; line-height: 1.4; }
.ym-detail-product__prices {
  display: flex; gap: 8px; align-items: baseline;
  padding: 10px 14px;
  background: #fef2f2;
  border-radius: 10px;
}
.ym-detail-product__prices strong { color: #d0021b; font-size: 22px; }
.ym-detail-product__prices small { color: #9ca3af; font-size: 14px; text-decoration: line-through; }
.ym-detail-product__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px 16px;
  background: #fafbfc;
  padding: 14px;
  border-radius: 10px;
  border: 1px solid #f1f3f5;
}
.ym-detail-product__grid > div { display: flex; flex-direction: column; gap: 2px; }
.ym-detail-product__grid label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.4px; color: #6b7280; }
.ym-detail-product__grid strong { font-size: 14px; color: #111827; font-weight: 500; }
.ym-detail-product__actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 4px; }

.ym-cat-link {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 9px; border-radius: 999px;
  background: #f3f6f4; color: #326e51;
  border: 1px solid transparent;
  font-size: 12px; font-weight: 500;
  cursor: pointer;
}
.ym-cat-link:hover { background: #e8f0ec; border-color: #326e51; }

.ym-price-grid { padding: 12px; background: #fafbfc; border: 1px solid #f1f3f5; border-radius: 10px; }
.ym-price-grid h4 { margin: 0 0 8px; font-size: 12px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.4px; }
.ym-price-rows { display: flex; flex-direction: column; gap: 6px; }
.ym-price-row { display: grid; grid-template-columns: 12px 1fr auto auto; gap: 8px; align-items: center; padding: 6px 0; border-bottom: 1px dashed #f1f3f5; font-size: 13px; }
.ym-price-row:last-child { border-bottom: none; }
.ym-price-row__dot { width: 10px; height: 10px; border-radius: 50%; }
.ym-price-row__name { color: #1f2937; }
.ym-price-row strong { color: #d0021b; }

.ym-applied-pl { padding: 12px; background: #fef2f2; border: 1px solid #fde68a; border-radius: 10px; }
.ym-applied-pl h4 { margin: 0 0 8px; font-size: 12px; font-weight: 600; color: #92400e; text-transform: uppercase; letter-spacing: 0.4px; }
.ym-pl-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.ym-pl-chip { display: inline-flex; align-items: center; gap: 6px; padding: 5px 10px; background: #fff; border: 1px solid #fde68a; border-radius: 999px; font-size: 12px; color: #92400e; text-decoration: none; }
.ym-pl-chip:hover { border-color: #d0021b; }

/* Validation panel */
.ym-validate {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  margin-bottom: 16px;
  overflow: hidden;
}
.ym-validate__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #f1f3f5;
  flex-wrap: wrap;
  gap: 10px;
}
.ym-validate__header h4 {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: #111827;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.ym-validate__header h4 i { color: #326e51; font-size: 16px; }
.ym-validate__summary { display: flex; gap: 6px; }
.ym-validate__pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  background: #f3f4f6;
  color: #9ca3af;
}
.ym-validate__pill i { font-size: 12px; }
.ym-validate__pill.is-active { background: #fee2e2; color: #d0021b; }
.ym-validate__pill.is-warn.is-active { background: #fef3c7; color: #92400e; }
.ym-validate__pill.is-ok { background: #dcfce7; color: #166534; }

.ym-validate__list {
  list-style: none;
  margin: 0;
  padding: 8px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 4px;
}
.ym-validate__item {
  display: grid;
  grid-template-columns: 18px 1fr auto;
  gap: 8px;
  align-items: center;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  background: #fff;
  border: 1px solid #f1f3f5;
}
.ym-validate__item.is-ok { color: #166534; }
.ym-validate__item.is-ok i { color: #166534; }
.ym-validate__item.is-error { color: #d0021b; background: #fef2f2; border-color: #fee2e2; }
.ym-validate__item.is-error i { color: #d0021b; }
.ym-validate__item.is-warn { color: #92400e; background: #fffbeb; border-color: #fde68a; }
.ym-validate__item.is-warn i { color: #92400e; }
.ym-validate__item.is-info { color: #1e40af; background: #eff6ff; border-color: #bfdbfe; }
.ym-validate__item.is-info i { color: #1e40af; }
.ym-validate__item i { font-size: 16px; }
.ym-validate__label { font-weight: 500; }
.ym-validate__hint { font-size: 11px; opacity: 0.7; }

/* Form labels with quick-add buttons */
.ym-form-group label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.ym-mini-add {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 8px;
  border: 1px solid #d1d5db;
  background: #fff;
  border-radius: 6px;
  color: #326e51;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
}
.ym-mini-add:hover { background: #e8f0ec; border-color: #326e51; }
.ym-mini-add i { font-size: 12px; }

.ym-form-help {
  margin: 4px 0 0;
  font-size: 12px;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Feature toggles for hot deal / suggested */
.ym-feature-toggles { display: flex; gap: 8px; }
.ym-feature-toggle {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.15s;
  background: #fff;
}
.ym-feature-toggle input { display: none; }
.ym-feature-toggle i { font-size: 16px; color: #9ca3af; }
.ym-feature-toggle:hover { border-color: #d1d5db; }
.ym-feature-toggle.is-on {
  border-color: #d0021b;
  background: #fef2f2;
  color: #d0021b;
}
.ym-feature-toggle.is-on i { color: #d0021b; }
.ym-feature-toggle.is-on:nth-child(2) {
  border-color: #e91e63;
  background: #fef0f4;
  color: #e91e63;
}
.ym-feature-toggle.is-on:nth-child(2) i { color: #e91e63; }

.ym-import { display: flex; flex-direction: column; gap: 14px; }
.ym-import-uploader {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: 2px dashed #b7c7bd;
  border-radius: 10px;
  background: #f7faf8;
  color: #1f2937;
  cursor: pointer;
}
.ym-import-uploader:hover { border-color: #326e51; background: #f1f7f4; }
.ym-import-uploader.is-loading { pointer-events: none; opacity: 0.8; }
.ym-import-uploader input { display: none; }
.ym-import-uploader i { font-size: 30px; color: #326e51; }
.ym-import-uploader span { display: flex; flex-direction: column; min-width: 0; }
.ym-import-uploader strong { font-size: 14px; font-weight: 600; overflow-wrap: anywhere; }
.ym-import-uploader small { margin-top: 2px; color: #6b7280; font-size: 12px; }
.ym-import-option {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  font-size: 13px;
  color: #374151;
}
.ym-import-preview { display: flex; flex-direction: column; gap: 14px; }
.ym-import-summary { display: flex; flex-wrap: wrap; gap: 8px; }
.ym-import-summary span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border-radius: 999px;
  background: #eef6f1;
  color: #326e51;
  font-size: 12px;
}
.ym-import-columns { display: flex; flex-wrap: wrap; gap: 6px; }
.ym-import-columns span {
  padding: 4px 8px;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  background: #fff;
  color: #4b5563;
  font-size: 12px;
}
.ym-import-grid { display: grid; grid-template-columns: 360px 1fr; gap: 16px; align-items: start; }
.ym-import-grid h4 { margin: 0 0 10px; font-size: 13px; font-weight: 600; color: #111827; }
.ym-import-map {
  display: grid;
  gap: 8px;
  max-height: 440px;
  overflow: auto;
  padding-right: 4px;
}
.ym-import-map label {
  display: grid;
  grid-template-columns: 130px 1fr;
  gap: 8px;
  align-items: center;
  font-size: 12px;
}
.ym-import-map b { color: #d0021b; }
.ym-import-map select {
  width: 100%;
  min-width: 0;
  padding: 7px 9px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #fff;
  font-size: 13px;
}
.ym-import-table-wrap {
  max-height: 440px;
  overflow: auto;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
}
.ym-import-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.ym-import-table th,
.ym-import-table td {
  padding: 8px 10px;
  border-bottom: 1px solid #f1f3f5;
  text-align: left;
  white-space: nowrap;
}
.ym-import-table th { position: sticky; top: 0; background: #f9fafb; color: #4b5563; font-weight: 600; }
.adm-spin { animation: ym-spin 0.8s linear infinite; }
@keyframes ym-spin { to { transform: rotate(360deg); } }
@media (max-width: 920px) {
  .ym-import-grid { grid-template-columns: 1fr; }
  .ym-import-map { max-height: none; }
}
</style>
