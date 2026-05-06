import api from '@/services/api'

export type ProductCommentType = 'review' | 'question'

export interface ProductCommentPayload {
  product_id: number
  product_name?: string
  product_sku?: string
  type: ProductCommentType
  author: string
  email?: string
  rating?: number
  content: string
}

export interface ProductCommentReplyPayload {
  author: string
  email?: string
  content: string
}

export const productCommentsApi = {
  list: (productId: number, params: Record<string, any> = {}) =>
    api.get('/shop/product-comments/public', {
      params: {
        product_id: productId,
        limit: 100,
        ...params,
      },
    }),
  create: (data: ProductCommentPayload) => api.post('/shop/product-comments/public', data),
  reply: (commentId: number, data: ProductCommentReplyPayload) =>
    api.post(`/shop/product-comments/public/${commentId}/reply`, data),
}
