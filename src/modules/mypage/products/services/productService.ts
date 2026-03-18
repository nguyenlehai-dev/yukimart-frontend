import api from '@/services/api'
import type { ProductFilter } from '../models/Product'

const productService = {
  getAll: (params?: ProductFilter) => api.get('/products', { params }),
  getById: (id: number) => api.get(`/products/${id}`),
  create: (data: Record<string, any>) => api.post('/products', data),
  update: (id: number, data: Record<string, any>) => api.put(`/products/${id}`, data),
  delete: (id: number) => api.delete(`/products/${id}`),
}

export default productService
