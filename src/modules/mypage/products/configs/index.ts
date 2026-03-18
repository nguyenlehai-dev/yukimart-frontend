/**
 * Products Module Config
 */

export const PRODUCTS_PER_PAGE = 12

export const SORT_OPTIONS = [
  { label: 'Mới nhất', value: 'created_at:desc' },
  { label: 'Giá tăng dần', value: 'price:asc' },
  { label: 'Giá giảm dần', value: 'price:desc' },
  { label: 'Tên A-Z', value: 'name:asc' },
  { label: 'Tên Z-A', value: 'name:desc' },
] as const

export const DEFAULT_PRODUCT_IMAGE = '/images/product-placeholder.png'
