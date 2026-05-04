import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  featuredBrands as fallbackFeaturedBrands,
  type Brand as SiteBrand,
  type Product as SiteProduct,
  type CategorySectionData,
} from '@/modules/mypage/home/configs'
import {
  shopProductsApi,
  shopCategoriesApi,
  shopSectionsApi,
  shopBrandsApi,
  productToPayload,
  categoryToPayload,
  sectionToPayload,
  brandToPayload,
} from '../services/shopApi'
import { resolveBrandLogo, resolveProductImage } from '../utils/imageResolver'

export interface AdminProduct extends SiteProduct {
  sku: string
  categoryId?: number | null
  categoryPath?: string[]
  productType?: string | null
  barcode?: string | null
  imageUrls?: string | null
  maxStock?: number | null
  unit?: string | null
  baseUnitCode?: string | null
  conversionRate?: number | null
  attributes?: string | null
  relatedSku?: string | null
  weight?: number | null
  points?: number
  rewardPoints?: number
  isBusinessActive?: boolean
  isDirectSale?: boolean
  location?: string | null
  noteTemplate?: string | null
  componentItems?: string | null
  sourceCreatedAt?: string | null
  expectedOutOfStockAt?: string | null
  cost: number
  status: 'active' | 'draft' | 'out_of_stock'
  warehouse: string
  reserved: number
  threshold: number
  isHotDeal: boolean
  isSuggested: boolean
  sectionId: number | null
  description?: string
  createdAt?: string
}

export interface AdminCategory {
  id: number
  parentId: number | null
  name: string
  slug: string
  active: boolean
  showOnMenu: boolean
  icon: string
  description?: string
}

export interface ShopSection {
  id: string
  title: string
  color: string
  promoImage?: string
  banners: CategorySectionData['banners']
  subTabs: string[]
  tags: string[]
  productIds: number[]
  sortOrder?: number
}

export interface ShopBrand extends SiteBrand {
  slug: string
  logoSource?: string
  link: string
  active: boolean
  sortOrder: number
  createdAt?: string
  updatedAt?: string
}

const SLUG_DIACRITICS = /[̀-ͯ]/g
function slugify(s: string) {
  return s.toLowerCase()
    .normalize('NFD').replace(SLUG_DIACRITICS, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim().replace(/\s+/g, '-')
}

const CATEGORY_ALIASES: Record<string, string[]> = {
  'chăm-sóc-cơ-thể': ['chăm-sóc-toàn-thân'],
  'chăm-sóc-toàn-thân': ['chăm-sóc-cơ-thể'],
  'chăm-sóc-da': ['chăm-sóc-da-mặt'],
  'chăm-sóc-da-mặt': ['chăm-sóc-da'],
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'làm-sạch-da': ['tẩy-trang', 'sữa-rửa-mặt', 'toner', 'nước-cân-bằng', 'tẩy-tế-bào-chết'],
  'tẩy-trang-mặt': ['tẩy-trang'],
  'sữa-rửa-mặt': ['sữa-rửa-mặt'],
  'đặc-trị': ['serum', 'tinh-chất', 'trị-mụn', 'melano', 'thâm', 'nám'],
  'serum-tinh-chất': ['serum', 'tinh-chất'],
  'hỗ-trợ-trị-mụn': ['trị-mụn', 'mụn'],
  'bộ-chăm-sóc-da-mặt': ['chống-nắng', 'mặt-nạ', 'dưỡng-mắt', 'dưỡng-môi'],
  'chống-nắng': ['chống-nắng', 'spf'],
  'mặt-nạ': ['mặt-nạ'],
  'trang-điểm-môi': ['son', 'lip'],
  'son-môi': ['son'],
  'son-kem': ['son-kem'],
  'son-dưỡng': ['son-dưỡng'],
  'trang-điểm-mặt': ['kem-nền', 'phấn-phủ', 'cushion', 'che-khuyết-điểm', 'fit-me', 'foundation'],
  'kem-nền': ['kem-nền', 'foundation', 'fit-me'],
  'che-khuyết-điểm': ['che-khuyết-điểm'],
  'trang-điểm-mắt': ['mascara', 'kẻ-mắt', 'phấn-mắt', 'chân-mày'],
  'mascara': ['mascara'],
  'sữa-tắm': ['sữa-tắm'],
  'dưỡng-thể': ['dưỡng-thể', 'lotion-dưỡng-thể', 'kem-dưỡng-thể'],
  'khử-mùi': ['khử-mùi', 'lăn-khử-mùi', 'xịt-khử-mùi'],
}

const CATEGORY_TEXT_CLEANUP = /[^0-9a-zA-ZÀ-ỹ\s-]/g

function categoryKey(value?: string | null) {
  return (value || '')
    .toLowerCase()
    .normalize('NFC')
    .replace(CATEGORY_TEXT_CLEANUP, ' ')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function categoryKeys(value?: string | null) {
  const key = categoryKey(value)
  return new Set([key, ...(CATEGORY_ALIASES[key] || [])].filter(Boolean))
}

function categoryKeyMatches(productCategory: string | undefined | null, targetKeys: Set<string>) {
  const productKeys = categoryKeys(productCategory)
  for (const productKey of productKeys) {
    for (const targetKey of targetKeys) {
      if (productKey === targetKey || productKey.includes(targetKey)) {
        return true
      }
    }
  }
  return false
}

function categoryKeywordMatches(product: Pick<AdminProduct, 'category' | 'name'>, targetKeys: Set<string>) {
  const productText = categoryKey(`${product.category || ''} ${product.name || ''}`)
  for (const targetKey of targetKeys) {
    for (const keyword of CATEGORY_KEYWORDS[targetKey] || []) {
      if (productText.includes(keyword)) return true
    }
  }
  return false
}

// Map API response (image filename) → frontend product (image full URL)
function hydrateProduct(p: any): AdminProduct {
  return {
    ...p,
    image: resolveProductImage(p.image),
  }
}

function hydrateBrand(b: any): ShopBrand {
  const name = b.name || ''
  const link = !b.link || String(b.link).startsWith('/products?brand=')
    ? `/products?brand=${encodeURIComponent(name)}`
    : b.link
  return {
    ...b,
    logoSource: b.logo || '',
    logo: resolveBrandLogo(b.logo),
    slug: b.slug || slugify(name),
    link,
    active: b.active ?? true,
    sortOrder: b.sortOrder ?? 0,
  }
}

export const useAdminDataStore = defineStore('adminData', () => {
  const products = ref<AdminProduct[]>([])
  const publicProducts = ref<AdminProduct[]>([])
  const publicProductMeta = ref({ total: 0, perPage: 20, currentPage: 1, lastPage: 1 })
  const publicBrandFacets = ref<{ brand: string; count: number }[]>([])
  const adminProductMeta = ref({ total: 0, perPage: 20, currentPage: 1, lastPage: 1 })
  const adminProductStats = ref({ total: 0, active: 0, outOfStock: 0, lowStock: 0, totalValue: 0 })
  const adminProductBrandFacets = ref<{ brand: string; count: number }[]>([])
  const categories = ref<AdminCategory[]>([])
  const sections = ref<ShopSection[]>([])
  const brands = ref<ShopBrand[]>(fallbackFeaturedBrands.map((brand, index) => hydrateBrand({
    ...brand,
    slug: slugify(brand.name),
    link: `/products?brand=${encodeURIComponent(brand.name)}`,
    active: true,
    sortOrder: index,
  })))
  const loading = ref(false)
  const loaded = ref(false)
  const error = ref<string | null>(null)
  let shopLoadSeq = 0
  // Cache freshness — bỏ qua fetch nếu đã tải trong khoảng FRESHNESS_MS gần đây.
  // Chuyển tab trong /admin sẽ không gọi lại 4 API gây lag.
  const FRESHNESS_MS = 60_000
  let lastFetchAllAt = 0
  let lastFetchCatalogAt = 0
  let lastFetchHomeAt = 0
  function invalidateCache() {
    lastFetchAllAt = 0
    lastFetchCatalogAt = 0
    lastFetchHomeAt = 0
  }

  // ── Hydrate from API ──
  async function fetchAll(params: Record<string, any> = { all: 1 }, opts: { force?: boolean } = {}) {
    if (!opts.force && loaded.value && Date.now() - lastFetchAllAt < FRESHNESS_MS) return
    const seq = ++shopLoadSeq
    loading.value = true
    error.value = null
    try {
      const [pRes, cRes, sRes, bRes] = await Promise.all([
        shopProductsApi.list(params),
        shopCategoriesApi.list(),
        shopSectionsApi.list(),
        shopBrandsApi.list(),
      ])
      if (seq !== shopLoadSeq) return
      products.value = (pRes.data.data || []).map(hydrateProduct)
      // BE trả meta.total = số SP thực tế tải về (cap 200), nhưng stats là tổng đầy đủ.
      // Lưu vào adminProductStats để Dashboard hiển thị tổng thật, không bị cắt theo cap.
      const stats = pRes.data.stats || {}
      adminProductStats.value = {
        total: stats.total ?? products.value.length,
        active: stats.active ?? 0,
        outOfStock: stats.outOfStock ?? 0,
        lowStock: stats.lowStock ?? 0,
        totalValue: stats.totalValue ?? 0,
      }
      categories.value = cRes.data.data || []
      sections.value = sRes.data.data || []
      brands.value = (bRes.data.data || []).map(hydrateBrand)
      loaded.value = true
      lastFetchAllAt = Date.now()
    } catch (e: any) {
      if (seq !== shopLoadSeq) return
      error.value = e?.message || 'Lỗi tải dữ liệu shop'
      console.error('[shopAdmin] fetchAll failed:', e)
    } finally {
      if (seq === shopLoadSeq) loading.value = false
    }
  }

  async function fetchCatalogData(opts: { force?: boolean } = {}) {
    if (!opts.force && loaded.value && Date.now() - lastFetchCatalogAt < FRESHNESS_MS) return
    const seq = ++shopLoadSeq
    loading.value = true
    error.value = null
    try {
      const [cRes, sRes, bRes] = await Promise.all([
        shopCategoriesApi.list(),
        shopSectionsApi.list(),
        shopBrandsApi.list(),
      ])
      if (seq !== shopLoadSeq) return
      categories.value = cRes.data.data || []
      sections.value = sRes.data.data || []
      brands.value = (bRes.data.data || []).map(hydrateBrand)
      loaded.value = true
      lastFetchCatalogAt = Date.now()
    } catch (e: any) {
      if (seq !== shopLoadSeq) return
      error.value = e?.message || 'Lỗi tải dữ liệu shop'
      console.error('[shopAdmin] fetchCatalogData failed:', e)
    } finally {
      if (seq === shopLoadSeq) loading.value = false
    }
  }

  async function fetchAdminProducts(params: Record<string, any> = {}) {
    try {
      const res = await shopProductsApi.list({
        paginate: 1,
        ...params,
      })
      products.value = (res.data.data || []).map(hydrateProduct)
      adminProductMeta.value = {
        total: res.data.meta?.total ?? products.value.length,
        perPage: res.data.meta?.perPage ?? 20,
        currentPage: res.data.meta?.currentPage ?? 1,
        lastPage: res.data.meta?.lastPage ?? 1,
      }
      adminProductStats.value = {
        total: res.data.stats?.total ?? adminProductMeta.value.total,
        active: res.data.stats?.active ?? activeProducts.value.length,
        outOfStock: res.data.stats?.outOfStock ?? outOfStock.value.length,
        lowStock: res.data.stats?.lowStock ?? lowStock.value.length,
        totalValue: res.data.stats?.totalValue ?? totalStockValue.value,
      }
      adminProductBrandFacets.value = res.data.facets?.brands || []
      loaded.value = true
    } catch (e: any) {
      error.value = e?.message || 'Lỗi tải sản phẩm'
      console.error('[shopAdmin] fetchAdminProducts failed:', e)
      throw e
    }
  }

  async function fetchPublicHome(opts: { force?: boolean } = {}) {
    if (!opts.force && loaded.value && Date.now() - lastFetchHomeAt < FRESHNESS_MS) return
    const seq = ++shopLoadSeq
    loading.value = true
    error.value = null
    try {
      const [pRes, cRes, sRes, bRes] = await Promise.all([
        shopProductsApi.list({ public: 'home', limit: 2000 }),
        shopCategoriesApi.list(),
        shopSectionsApi.list(),
        shopBrandsApi.publicList(),
      ])
      if (seq !== shopLoadSeq) return
      products.value = (pRes.data.data || []).map(hydrateProduct)
      categories.value = cRes.data.data || []
      sections.value = sRes.data.data || []
      brands.value = (bRes.data.data || []).map(hydrateBrand)
      loaded.value = true
      lastFetchHomeAt = Date.now()
    } catch (e: any) {
      if (seq !== shopLoadSeq) return
      error.value = e?.message || 'Lỗi tải dữ liệu shop'
      console.error('[shopAdmin] fetchPublicHome failed:', e)
    } finally {
      if (seq === shopLoadSeq) loading.value = false
    }
  }

  async function fetchPublicProducts(params: Record<string, any> = {}) {
    try {
      const res = await shopProductsApi.list({
        public: 'list',
        paginate: 1,
        ...params,
      })
      publicProducts.value = (res.data.data || []).map(hydrateProduct)
      publicProductMeta.value = {
        total: res.data.meta?.total ?? publicProducts.value.length,
        perPage: res.data.meta?.perPage ?? 20,
        currentPage: res.data.meta?.currentPage ?? 1,
        lastPage: res.data.meta?.lastPage ?? 1,
      }
      publicBrandFacets.value = res.data.facets?.brands || []
    } catch (e: any) {
      error.value = e?.message || 'Lỗi tải danh sách sản phẩm'
      console.error('[shopAdmin] fetchPublicProducts failed:', e)
      throw e
    }
  }

  async function fetchBrands() {
    try {
      const res = await shopBrandsApi.list()
      brands.value = (res.data.data || []).map(hydrateBrand)
    } catch (e: any) {
      error.value = e?.message || 'Lỗi tải thương hiệu nổi bật'
      console.error('[shopAdmin] fetchBrands failed:', e)
    }
  }

  function findProduct(id: number) {
    return products.value.find((p) => p.id === id) || null
  }

  // ── Computed ──
  // productCount đọc từ stats BE trước (số tổng thật) rồi mới fallback theo array
  // (sẽ chỉ chính xác khi đã load đủ; với cap 200 thì stats luôn đáng tin hơn).
  const productCount = computed(() => adminProductStats.value.total || products.value.length)
  const activeProducts = computed(() => products.value.filter((p) => p.status === 'active'))
  const outOfStock = computed(() => products.value.filter((p) => p.stock === 0))
  const lowStock = computed(() => products.value.filter((p) => p.stock > 0 && p.stock < p.threshold))
  // Số tuyệt đối lấy từ BE stats — chính xác cả khi products array bị cap.
  const activeProductCount = computed(() => adminProductStats.value.active || activeProducts.value.length)
  const outOfStockCount = computed(() => adminProductStats.value.outOfStock || outOfStock.value.length)
  const totalStockValue = computed(() => products.value.reduce((s, p) => s + p.stock * p.cost, 0))

  const categoryOptions = computed(() => [...new Set(products.value.map((p) => p.category))].sort())
  const brandOptions = computed(() => [...new Set(products.value.map((p) => p.brand))].sort())
  const warehouseOptions = computed(() => [...new Set(products.value.map((p) => p.warehouse))])

  const hotDeals = computed<AdminProduct[]>(() =>
    products.value.filter((p) => p.isHotDeal && p.status === 'active')
  )

  const suggested = computed<AdminProduct[]>(() =>
    products.value.filter((p) => p.isSuggested && p.status === 'active')
  )

  const featuredBrands = computed<ShopBrand[]>(() =>
    brands.value
      .filter((brand) => brand.active)
      .slice()
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.id - b.id)
  )

  // Auto-derive sections từ cấu trúc danh mục khi chưa có sections riêng — dùng
  // chung cho /admin/sections lẫn HomeView (mypage). Mỗi danh mục cha → 1 section,
  // subTabs = tên danh mục con cấp 2, productIds = SP thuộc cha hoặc con cháu.
  const SECTION_COLORS = ['#326e51', '#1d4ed8', '#9333ea', '#dc2626', '#ea580c', '#0891b2', '#be123c', '#15803d']
  const derivedSections = computed<ShopSection[]>(() => {
    const cats = categories.value
    if (cats.length === 0 || products.value.length === 0) return []
    const roots = cats.filter((c) => c.parentId === null && c.active !== false)
    if (roots.length === 0) return []

    return roots
      .map((root, idx) => {
        const subCats = cats.filter((c) => c.parentId === root.id)
        // Build branch names: root + tất cả con cháu (BFS).
        const branchNames = new Set<string>([root.name, ...subCats.map((c) => c.name)])
        const stack = subCats.map((c) => c.id)
        while (stack.length) {
          const id = stack.pop()!
          for (const child of cats.filter((c) => c.parentId === id)) {
            branchNames.add(child.name)
            stack.push(child.id)
          }
        }
        // Match SP: branch helper + path matching ("A>>B>>C" → check segments).
        const fromHelper = productsForCategory(root)
        const fromPath = products.value.filter((p) => {
          const cat = (p.category || '').trim()
          if (!cat) return false
          if (branchNames.has(cat)) return true
          const segments = cat.split(/\s*>>\s*|\s*\/\s*|\s*->\s*/)
          return segments.some((seg) => branchNames.has(seg))
        })
        const idSet = new Set<number>()
        const productIds: number[] = []
        for (const p of [...fromHelper, ...fromPath]) {
          if (!idSet.has(p.id)) { idSet.add(p.id); productIds.push(p.id) }
        }
        return {
          id: root.slug || `cat-${root.id}`,
          title: root.name,
          color: SECTION_COLORS[idx % SECTION_COLORS.length],
          promoImage: '',
          banners: [],
          subTabs: subCats.map((c) => c.name),
          tags: [],
          productIds,
          sortOrder: idx,
        } as ShopSection
      })
      .filter((s) => s.productIds.length > 0)
  })

  // Source ưu tiên: sections từ API/import > derived từ danh mục > rỗng.
  const effectiveSections = computed<ShopSection[]>(() =>
    sections.value.length > 0 ? sections.value : derivedSections.value
  )

  const shopSections = computed(() =>
    effectiveSections.value.map((s) => ({
      ...s,
      // Hiển thị mọi SP trừ "out_of_stock". Imported products không có cột status
      // sẽ default 'draft' (BE) — vẫn hiện trên trang chủ để bán/preview.
      products: s.productIds
        .map((id) => findProduct(id))
        .filter((p): p is AdminProduct => p !== null && p.status !== 'out_of_stock'),
    }))
  )

  // ── Customer-site menu (filtered by active + showOnMenu) ──
  const customerMenu = computed(() => {
    const visible = (c: AdminCategory) => c.active && c.showOnMenu
    const rootCats = categories.value.filter((c) => c.parentId === null && visible(c))
    return rootCats.map((root) => {
      const cols = categories.value
        .filter((c) => c.parentId === root.id && visible(c))
        .map((col) => ({
          title: col.name,
          items: categories.value
            .filter((c) => c.parentId === col.id && visible(c))
            .map((c) => c.name),
        }))
      return {
        id: root.id,
        name: root.name,
        icon: root.icon || '',
        link: `/products?cat=${root.slug}`,
        submenu: cols.length ? { columns: cols } : undefined,
      }
    })
  })

  // ── Product CRUD (sync with API) ──
  async function addProduct(p: Omit<AdminProduct, 'id'>): Promise<AdminProduct | null> {
    try {
      const res = await shopProductsApi.create(productToPayload(p))
      const newProduct = hydrateProduct(res.data.data)
      products.value.unshift(newProduct)
      return newProduct
    } catch (e: any) {
      error.value = e?.response?.data?.message || 'Tạo sản phẩm thất bại'
      throw e
    }
  }

  async function updateProduct(id: number, patch: Partial<AdminProduct>) {
    try {
      const merged = { ...findProduct(id), ...patch }
      const res = await shopProductsApi.update(id, productToPayload(merged))
      const updated = hydrateProduct(res.data.data)
      const idx = products.value.findIndex((p) => p.id === id)
      if (idx >= 0) products.value[idx] = updated
    } catch (e: any) {
      error.value = e?.response?.data?.message || 'Cập nhật sản phẩm thất bại'
      throw e
    }
  }

  async function removeProduct(id: number) {
    try {
      await shopProductsApi.remove(id)
      products.value = products.value.filter((p) => p.id !== id)
      for (const s of sections.value) s.productIds = s.productIds.filter((x) => x !== id)
    } catch (e: any) {
      error.value = e?.response?.data?.message || 'Xoá sản phẩm thất bại'
      throw e
    }
  }

  async function adjustStock(id: number, delta: number, reason?: string) {
    try {
      const type = delta > 0 ? 'in' : 'out'
      const res = await shopProductsApi.adjustStock(id, { delta, type, reason })
      const updated = hydrateProduct(res.data.data)
      const idx = products.value.findIndex((p) => p.id === id)
      if (idx >= 0) products.value[idx] = updated
    } catch (e: any) {
      error.value = e?.response?.data?.message || 'Điều chỉnh tồn thất bại'
      throw e
    }
  }

  // ── Shop Section CRUD ──
  async function addSection(s: Omit<ShopSection, 'productIds'>): Promise<ShopSection | null> {
    const exists = sections.value.find((x) => x.id === s.id)
    if (exists) return null

    try {
      const res = await shopSectionsApi.create(sectionToPayload({ ...s, productIds: [] }))
      const created = res.data.data as ShopSection
      sections.value.push(created)
      return created
    } catch (e: any) {
      error.value = e?.response?.data?.message || 'Tạo section thất bại'
      throw e
    }
  }

  async function updateSection(id: string, patch: Partial<ShopSection>): Promise<ShopSection | null> {
    const idx = sections.value.findIndex((s) => s.id === id)
    if (idx < 0) return null

    const previous: ShopSection = {
      ...sections.value[idx],
      productIds: [...sections.value[idx].productIds],
      banners: [...(sections.value[idx].banners || [])],
      subTabs: [...(sections.value[idx].subTabs || [])],
      tags: [...(sections.value[idx].tags || [])],
    }
    const merged: ShopSection = { ...previous, ...patch }
    sections.value[idx] = merged

    const hasSectionPatch = ['id', 'title', 'color', 'promoImage', 'banners', 'subTabs', 'tags', 'sortOrder']
      .some((key) => Object.prototype.hasOwnProperty.call(patch, key))
    const hasProductPatch = Object.prototype.hasOwnProperty.call(patch, 'productIds')

    try {
      let updated: ShopSection | null = null

      if (hasSectionPatch) {
        const res = await shopSectionsApi.update(id, sectionToPayload(merged))
        updated = res.data.data as ShopSection
      }

      if (hasProductPatch) {
        const targetId = updated?.id || merged.id
        const res = await shopSectionsApi.syncProducts(targetId, merged.productIds)
        updated = res.data.data as ShopSection
      }

      if (updated) {
        const targetIdx = sections.value.findIndex((s) => s.id === id || s.id === updated?.id)
        if (targetIdx >= 0) sections.value[targetIdx] = updated
      }

      return updated || merged
    } catch (e: any) {
      sections.value[idx] = previous
      error.value = e?.response?.data?.message || 'Cập nhật section thất bại'
      throw e
    }
  }

  async function removeSection(id: string): Promise<void> {
    const previous = [...sections.value]
    const section = sections.value.find((s) => s.id === id)
    const productIds = new Set(section?.productIds || [])

    sections.value = sections.value.filter((s) => s.id !== id)

    try {
      await shopSectionsApi.remove(id)
      for (const p of products.value) {
        if (productIds.has(p.id)) p.sectionId = null
      }
    } catch (e: any) {
      sections.value = previous
      error.value = e?.response?.data?.message || 'Xoá section thất bại'
      throw e
    }
  }

  async function reorderSections(newOrder: string[]): Promise<void> {
    const previous = [...sections.value]
    sections.value = newOrder
      .map((id) => sections.value.find((s) => s.id === id))
      .filter((s): s is ShopSection => s !== undefined)

    try {
      await shopSectionsApi.reorder(newOrder)
    } catch (e: any) {
      sections.value = previous
      error.value = e?.response?.data?.message || 'Sắp xếp section thất bại'
      throw e
    }
  }

  // ── Featured Brand CRUD ──
  async function addBrand(brand: Omit<ShopBrand, 'id' | 'createdAt' | 'updatedAt'>): Promise<ShopBrand | null> {
    try {
      const res = await shopBrandsApi.create(brandToPayload(brand))
      const created = hydrateBrand(res.data.data)
      brands.value.push(created)
      return created
    } catch (e: any) {
      error.value = e?.response?.data?.message || 'Tạo thương hiệu thất bại'
      throw e
    }
  }

  async function updateBrand(id: number, patch: Partial<ShopBrand>): Promise<ShopBrand | null> {
    const current = brands.value.find((brand) => brand.id === id)
    if (!current) return null

    try {
      const res = await shopBrandsApi.update(id, brandToPayload({ ...current, ...patch }))
      const updated = hydrateBrand(res.data.data)
      const idx = brands.value.findIndex((brand) => brand.id === id)
      if (idx >= 0) brands.value[idx] = updated
      return updated
    } catch (e: any) {
      error.value = e?.response?.data?.message || 'Cập nhật thương hiệu thất bại'
      throw e
    }
  }

  async function removeBrand(id: number): Promise<void> {
    try {
      await shopBrandsApi.remove(id)
      brands.value = brands.value.filter((brand) => brand.id !== id)
    } catch (e: any) {
      error.value = e?.response?.data?.message || 'Xoá thương hiệu thất bại'
      throw e
    }
  }

  // ── Category CRUD ──
  async function addCategory(c: Omit<AdminCategory, 'id'>): Promise<AdminCategory | null> {
    try {
      const res = await shopCategoriesApi.create(categoryToPayload(c))
      categories.value.push(res.data.data)
      return res.data.data
    } catch (e: any) {
      error.value = e?.response?.data?.message || 'Tạo danh mục thất bại'
      throw e
    }
  }
  async function updateCategory(id: number, patch: Partial<AdminCategory>) {
    try {
      const cur = categories.value.find((c) => c.id === id)
      const merged = { ...cur, ...patch }
      const res = await shopCategoriesApi.update(id, categoryToPayload(merged))
      const idx = categories.value.findIndex((c) => c.id === id)
      if (idx >= 0) categories.value[idx] = res.data.data
    } catch (e: any) {
      error.value = e?.response?.data?.message || 'Cập nhật danh mục thất bại'
      throw e
    }
  }
  async function removeCategory(id: number): Promise<number> {
    try {
      const res = await shopCategoriesApi.remove(id)
      const removed = res.data.deleted || 1
      const ids = new Set<number>([id])
      let added = true
      while (added) {
        added = false
        for (const c of categories.value) {
          if (c.parentId !== null && ids.has(c.parentId) && !ids.has(c.id)) {
            ids.add(c.id); added = true
          }
        }
      }
      categories.value = categories.value.filter((c) => !ids.has(c.id))
      return removed
    } catch (e: any) {
      error.value = e?.response?.data?.message || 'Xoá danh mục thất bại'
      throw e
    }
  }

  function categoryBranchNames(category: AdminCategory | string): string[] {
    if (typeof category === 'string') {
      const key = categoryKey(category)
      const slugKey = slugify(category)
      const found = categories.value.find((c) =>
        categoryKey(c.name) === key || slugify(c.name) === slugKey || slugify(c.slug) === slugKey
      )
      return found ? categoryBranchNames(found) : [category]
    }

    const names: string[] = []
    const visit = (cat: AdminCategory) => {
      names.push(cat.name)
      categories.value
        .filter((child) => child.parentId === cat.id)
        .forEach(visit)
    }
    visit(category)
    return names
  }

  function categoryBranchIds(category: AdminCategory | string): Set<number> {
    const ids = new Set<number>()
    const root = typeof category === 'string'
      ? categories.value.find((c) => categoryKey(c.name) === categoryKey(category) || slugify(c.slug) === slugify(category))
      : category
    if (!root) return ids

    const visit = (cat: AdminCategory) => {
      ids.add(cat.id)
      categories.value
        .filter((child) => child.parentId === cat.id)
        .forEach(visit)
    }
    visit(root)
    return ids
  }

  function targetCategoryKeys(category: AdminCategory | string) {
    const keys = new Set<string>()
    for (const name of categoryBranchNames(category)) {
      categoryKeys(name).forEach((key) => keys.add(key))
    }
    return keys
  }

  function productMatchesCategory(product: Pick<AdminProduct, 'category' | 'name'>, category: AdminCategory | string) {
    const targetIds = categoryBranchIds(category)
    const productCategoryId = (product as AdminProduct).categoryId
    if (productCategoryId && targetIds.has(productCategoryId)) return true

    const targetKeys = targetCategoryKeys(category)
    return categoryKeyMatches(product.category, targetKeys) || categoryKeywordMatches(product, targetKeys)
  }

  function productsForCategory(category: AdminCategory | string) {
    return products.value.filter((p) => productMatchesCategory(p, category))
  }

  function productsInCategory(category: AdminCategory | string) {
    return productsForCategory(category).length
  }

  return {
    products, publicProducts, publicProductMeta, publicBrandFacets,
    adminProductMeta, adminProductStats, adminProductBrandFacets,
    categories, brands, sections,
    loading, loaded, error,
    productCount, activeProducts, outOfStock, lowStock, totalStockValue,
    activeProductCount, outOfStockCount,
    categoryOptions, brandOptions, warehouseOptions,
    hotDeals, suggested, featuredBrands, shopSections, derivedSections, effectiveSections,
    customerMenu,
    findProduct, fetchAll, fetchCatalogData, fetchAdminProducts, fetchPublicHome, fetchPublicProducts, fetchBrands,
    invalidateCache,
    addProduct, updateProduct, removeProduct, adjustStock,
    addCategory, updateCategory, removeCategory,
    addSection, updateSection, removeSection, reorderSections,
    addBrand, updateBrand, removeBrand,
    productsForCategory, productsInCategory, productMatchesCategory,
    slugify,
  }
})
