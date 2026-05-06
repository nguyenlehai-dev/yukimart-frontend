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

export interface ProductDetail {
  id: number
  name: string
  slug: string
  sku: string
  brand: string
  brandOrigin: string
  category: string
  categoryPath: string[]
  images: string[]
  customerImages: string[]
  originalPrice: number
  salePrice: number
  discount: number
  stock: number
  skinType: string
  skinTypeOptions: { label: string; image?: string }[]
  volumes: string[]
  selectedVolume: string
  rating: number
  ratingCount: number
  ratingDistribution: number[] // [1★%, 2★%, 3★%, 4★%, 5★%]
  questionCount: number
  flashDeal?: {
    endTime: string
    label: string
  }
  description: string
  contentHtml: string
  specs: { label: string; value: string }[]
  ingredientsSections: {
    title: string
    mainIngredients: { name: string; benefit: string }[]
    fullIngredients: string
  }[]
  usage: string[]
  reviews: ProductReview[]
  questions: ProductQuestion[]
}

export interface ProductReview {
  id: number
  author: string
  avatar?: string
  rating: number
  date: string
  content: string
  verified?: boolean
  images?: string[]
  reply?: string
  replies?: ProductQuestionReply[]
}

export interface ProductQuestion {
  id: number
  author: string
  date: string
  content: string
  likes: number
  replies: ProductQuestionReply[]
}

export interface ProductQuestionReply {
  id: number
  author: string
  isStore?: boolean
  date: string
  content: string
  likes: number
}

export interface RelatedProduct {
  id: number
  name: string
  slug: string
  brand: string
  image: string
  originalPrice: number
  salePrice: number
  discount: number
}

export interface ProductFilter {
  category?: string
  search?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  page?: number
  per_page?: number
}
