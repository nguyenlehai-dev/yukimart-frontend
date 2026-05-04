import api from '@/services/api'

// Note: backend image field is filename only — frontend resolver maps to bundled URL.
// We send filename back when saving.

export const shopProductsApi = {
  list: (params?: Record<string, any>) => api.get('/shop/products', { params }),
  get: (id: number) => api.get(`/shop/products/${id}`),
  create: (data: Record<string, any>) => api.post('/shop/products', data),
  update: (id: number, data: Record<string, any>) => api.put(`/shop/products/${id}`, data),
  remove: (id: number) => api.delete(`/shop/products/${id}`),
  adjustStock: (id: number, payload: { delta: number; type?: string; reason?: string }) =>
    api.post(`/shop/products/${id}/adjust-stock`, payload),
  exportProducts: (params?: Record<string, any>) =>
    api.get('/shop/products/export', { params, responseType: 'blob' }),
  importPreview: (formData: FormData) =>
    api.post('/shop/products/import-preview', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  importProducts: (formData: FormData) =>
    api.post('/shop/products/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
}

export const shopCategoriesApi = {
  list: () => api.get('/shop/categories'),
  create: (data: Record<string, any>) => api.post('/shop/categories', data),
  update: (id: number, data: Record<string, any>) => api.put(`/shop/categories/${id}`, data),
  remove: (id: number) => api.delete(`/shop/categories/${id}`),
}

export const shopSectionsApi = {
  list: () => api.get('/shop/sections'),
  create: (data: Record<string, any>) => api.post('/shop/sections', data),
  update: (id: string, data: Record<string, any>) => api.put(`/shop/sections/${encodeURIComponent(id)}`, data),
  remove: (id: string) => api.delete(`/shop/sections/${encodeURIComponent(id)}`),
  reorder: (order: string[]) => api.put('/shop/sections/reorder', { order }),
  syncProducts: (id: string, productIds: number[]) =>
    api.put(`/shop/sections/${encodeURIComponent(id)}/sync-products`, { product_ids: productIds }),
}

export const shopBrandsApi = {
  list: () => api.get('/shop/brands'),
  publicList: () => api.get('/shop/brands/public'),
  create: (data: Record<string, any>) => api.post('/shop/brands', data),
  update: (id: number, data: Record<string, any>) => api.put(`/shop/brands/${id}`, data),
  remove: (id: number) => api.delete(`/shop/brands/${id}`),
}

export const shopNewsApi = {
  list: (params?: Record<string, any>) => api.get('/shop/news', { params }),
  publicList: (params?: Record<string, any>) => api.get('/shop/news/public', { params }),
  categories: () => api.get('/shop/news/categories'),
  get: (id: number) => api.get(`/shop/news/${id}`),
  getBySlug: (slug: string) => api.get(`/shop/news/slug/${encodeURIComponent(slug)}`),
  create: (data: Record<string, any>) => api.post('/shop/news', data),
  update: (id: number, data: Record<string, any>) => api.put(`/shop/news/${id}`, data),
  updateStatus: (id: number, status: string) => api.put(`/shop/news/${id}/status`, { status }),
  remove: (id: number) => api.delete(`/shop/news/${id}`),
}

export const shopPromotionsApi = {
  list: (params?: Record<string, any>) => api.get('/shop/promotions', { params }),
  publicList: (params?: Record<string, any>) => api.get('/shop/promotions/public', { params }),
  get: (id: number) => api.get(`/shop/promotions/${id}`),
  create: (data: Record<string, any>) => api.post('/shop/promotions', data),
  update: (id: number, data: Record<string, any>) => api.put(`/shop/promotions/${id}`, data),
  updateStatus: (id: number, status: string) => api.put(`/shop/promotions/${id}/status`, { status }),
  remove: (id: number) => api.delete(`/shop/promotions/${id}`),
}

export const shopCustomersApi = {
  list: () => api.get('/shop/customers'),
  create: (data: Record<string, any>) => api.post('/shop/customers', data),
  update: (id: number, data: Record<string, any>) => api.put(`/shop/customers/${id}`, data),
  remove: (id: number) => api.delete(`/shop/customers/${id}`),
}

export const shopOrdersApi = {
  list: () => api.get('/shop/orders'),
  get: (id: number) => api.get(`/shop/orders/${id}`),
  create: (data: Record<string, any>) => api.post('/shop/orders', data),
  updateStatus: (id: number, status: string) => api.put(`/shop/orders/${id}/status`, { status }),
  remove: (id: number) => api.delete(`/shop/orders/${id}`),
}

export const shopInventoryApi = {
  history: () => api.get('/shop/inventory/history'),
}

// Helper to convert frontend AdminProduct → backend payload (camelCase → snake_case)
export function productToPayload(p: any): Record<string, any> {
  return {
    sku: p.sku,
    name: p.name,
    slug: p.slug,
    category: p.category,
    category_id: p.categoryId ?? null,
    product_type: p.productType ?? null,
    barcode: p.barcode ?? null,
    brand: p.brand,
    image: p.image,
    image_urls: p.imageUrls ?? null,
    original_price: p.originalPrice,
    sale_price: p.salePrice,
    wholesale_price: p.wholesalePrice,
    cost: p.cost,
    discount: p.discount,
    stock: p.stock,
    reserved: p.reserved,
    threshold: p.threshold,
    max_stock: p.maxStock ?? null,
    warehouse: p.warehouse,
    unit: p.unit ?? null,
    base_unit_code: p.baseUnitCode ?? null,
    conversion_rate: p.conversionRate ?? null,
    attributes: p.attributes ?? null,
    related_sku: p.relatedSku ?? null,
    weight: p.weight ?? null,
    points: p.points ?? 0,
    reward_points: p.rewardPoints ?? 0,
    is_business_active: p.isBusinessActive ?? true,
    is_direct_sale: p.isDirectSale ?? true,
    location: p.location ?? null,
    note_template: p.noteTemplate ?? null,
    component_items: p.componentItems ?? null,
    source_created_at: p.sourceCreatedAt ?? null,
    expected_out_of_stock_at: p.expectedOutOfStockAt ?? null,
    status: p.status,
    is_hot_deal: p.isHotDeal ?? false,
    is_suggested: p.isSuggested ?? false,
    section_id: p.sectionId ?? null,
    description: p.description,
  }
}

export function categoryToPayload(c: any): Record<string, any> {
  return {
    parent_id: c.parentId ?? null,
    name: c.name,
    slug: c.slug,
    icon: c.icon,
    description: c.description,
    show_on_menu: c.showOnMenu ?? true,
    active: c.active ?? true,
  }
}

export function sectionToPayload(s: any): Record<string, any> {
  return {
    section_key: s.id,
    title: s.title,
    color: s.color,
    promo_image: s.promoImage,
    banners: s.banners ?? [],
    sub_tabs: s.subTabs ?? [],
    tags: s.tags ?? [],
    sort_order: s.sortOrder,
  }
}

export function brandToPayload(b: any): Record<string, any> {
  return {
    name: b.name,
    slug: b.slug,
    logo: b.logoSource ?? b.logo,
    link: b.link,
    active: b.active ?? true,
    sort_order: b.sortOrder ?? 0,
  }
}

export function newsPostToPayload(p: any): Record<string, any> {
  return {
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    content: p.content,
    image: p.image,
    category: p.category,
    author: p.author || 'Admin',
    status: p.status,
    is_featured: p.isFeatured ?? false,
    comments_count: p.comments ?? 0,
    view_count: p.viewCount ?? 0,
    sort_order: p.sortOrder ?? 0,
    published_at: p.publishedAt || null,
  }
}

export function promotionToPayload(p: any): Record<string, any> {
  return {
    title: p.title,
    slug: p.slug,
    description: p.description,
    image: p.image,
    link: p.link,
    badge: p.badge,
    discount_label: p.discountLabel,
    type: p.type,
    status: p.status,
    starts_at: p.startsAt || null,
    ends_at: p.endsAt || null,
    priority: p.priority ?? 0,
  }
}

export function customerToPayload(c: any): Record<string, any> {
  return {
    name: c.name,
    email: c.email,
    phone: c.phone,
    type: c.type,
    active: c.active ?? true,
    note: c.note,
  }
}
