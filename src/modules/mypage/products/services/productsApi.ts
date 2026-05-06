import api from '@/services/api'
import type { ProductDetail, RelatedProduct } from '../models/Product'

/**
 * Service gọi API thật cho trang chi tiết sản phẩm (mypage). Thay thế cho data
 * giả-lập trong configs/index.ts — admin import sản phẩm gì thì FE hiển thị
 * đúng vậy (hình ảnh, danh mục, thương hiệu, giá, tồn kho).
 */

const PLACEHOLDER_IMAGE = '/images/product-placeholder.png'

function asArray<T>(v: any): T[] {
  return Array.isArray(v) ? v : []
}

function asString(v: any, fallback = ''): string {
  return typeof v === 'string' && v.length ? v : fallback
}

function asNumber(v: any, fallback = 0): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

/**
 * Tách category dạng "A>>B>>C" hoặc "A/B/C" thành các bậc breadcrumb. BE lưu
 * category theo dấu ">>" (kiotviet), nhưng cũng có thể là "/". Dấu phân tách
 * khác sẽ giữ nguyên như 1 bậc duy nhất.
 */
function splitCategoryToPath(category: string): string[] {
  if (!category) return []
  if (category.includes('>>')) return category.split('>>').map((s) => s.trim()).filter(Boolean)
  if (category.includes('/')) return category.split('/').map((s) => s.trim()).filter(Boolean)
  return [category.trim()]
}

/**
 * Build mảng specs cơ bản từ field của shop_products. Các field ingredients/usage
 * BE chưa có schema → để trống, UI sẽ tự ẩn nếu rỗng.
 */
function buildSpecs(raw: any): ProductDetail['specs'] {
  const items: ProductDetail['specs'] = []
  const push = (label: string, value: any) => {
    const v = value === null || value === undefined ? '' : String(value)
    if (v.trim()) items.push({ label, value: v })
  }
  push('Mã sản phẩm', raw.sku)
  push('Mã vạch', raw.barcode)
  push('Thương hiệu', raw.brand)
  push('Danh mục', raw.category)
  push('Đơn vị', raw.unit)
  if (asNumber(raw.weight) > 0) push('Khối lượng', `${raw.weight} kg`)
  if (asNumber(raw.points) > 0) push('Điểm thưởng', String(raw.points))
  return items
}

export function mapApiToProductDetail(raw: any): ProductDetail {
  const images = asArray<string>(raw.images).filter(Boolean)
  if (images.length === 0 && raw.image) images.push(String(raw.image))
  if (images.length === 0) images.push(PLACEHOLDER_IMAGE)

  const category = asString(raw.category)
  const apiPath = asArray<string>(raw.categoryPath).filter(Boolean)
  const path = apiPath.length ? apiPath : splitCategoryToPath(category)
  const categoryPath = ['Trang chủ', ...path]

  const description = asString(raw.description)
  // BE không có HTML mô tả riêng → dùng plain description, escape rồi bọc <p>.
  const contentHtml = description
    ? `<p>${description.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] || c))}</p>`
    : '<p>Đang cập nhật mô tả sản phẩm.</p>'

  return {
    id: asNumber(raw.id),
    name: asString(raw.name, 'Sản phẩm'),
    slug: asString(raw.slug),
    sku: asString(raw.sku),
    brand: asString(raw.brand),
    brandOrigin: '',
    category,
    categoryPath,
    images,
    customerImages: [],
    originalPrice: asNumber(raw.originalPrice ?? raw.original_price),
    salePrice: asNumber(raw.salePrice ?? raw.sale_price ?? raw.price),
    discount: asNumber(raw.discount),
    stock: asNumber(raw.stock),
    skinType: '',
    skinTypeOptions: [],
    volumes: [],
    selectedVolume: '',
    rating: 0,
    ratingCount: 0,
    ratingDistribution: [0, 0, 0, 0, 0],
    questionCount: 0,
    flashDeal: raw.isHotDeal
      ? { endTime: '', label: 'HOT DEAL' }
      : undefined,
    description,
    contentHtml,
    specs: buildSpecs(raw),
    ingredientsSections: [],
    usage: [],
    reviews: [],
    questions: [],
  }
}

function mapApiToRelated(raw: any): RelatedProduct {
  return {
    id: asNumber(raw.id),
    name: asString(raw.name),
    slug: asString(raw.slug),
    brand: asString(raw.brand),
    image: asString(raw.image, PLACEHOLDER_IMAGE),
    originalPrice: asNumber(raw.originalPrice ?? raw.original_price),
    salePrice: asNumber(raw.salePrice ?? raw.sale_price ?? raw.price),
    discount: asNumber(raw.discount),
  }
}

export const productsApi = {
  async detail(id: number): Promise<ProductDetail | null> {
    try {
      const res = await api.get(`/shop/products/${id}`)
      const raw = res.data?.data
      if (!raw) return null
      return mapApiToProductDetail(raw)
    } catch {
      return null
    }
  },

  /** Sản phẩm cùng danh mục (loại trừ chính nó). */
  async related(currentId: number, category: string, limit = 6): Promise<RelatedProduct[]> {
    if (!category) return []
    const cat = category.split('>>')[0]?.trim() || category
    try {
      const res = await api.get('/shop/products', { params: { category: cat, limit } })
      return asArray<any>(res.data?.data)
        .filter((p) => asNumber(p.id) !== currentId)
        .slice(0, limit)
        .map(mapApiToRelated)
    } catch {
      return []
    }
  },

  async sameBrand(currentId: number, brand: string, limit = 6): Promise<RelatedProduct[]> {
    if (!brand) return []
    try {
      const res = await api.get('/shop/products', { params: { brand, limit } })
      return asArray<any>(res.data?.data)
        .filter((p) => asNumber(p.id) !== currentId)
        .slice(0, limit)
        .map(mapApiToRelated)
    } catch {
      return []
    }
  },
}
