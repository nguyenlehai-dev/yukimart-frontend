/**
 * Product Model
 */
export interface Product {
  id: number
  name: string
  slug: string
  price: number
  description: string
  image: string
  category: string
  stock: number
  created_at: string
}

export interface ProductFilter {
  category?: string
  search?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  page?: number
  per_page?: number
}
