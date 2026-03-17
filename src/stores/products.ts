import { defineStore } from 'pinia'
import { ref } from 'vue'
import { productApi } from '@/services/api'

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

export const useProductStore = defineStore('products', () => {
  const products = ref<Product[]>([])
  const currentProduct = ref<Product | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchProducts(params?: Record<string, any>) {
    loading.value = true
    error.value = null
    try {
      const response = await productApi.getAll(params)
      products.value = response.data.data
    } catch (e: any) {
      error.value = e.message || 'Failed to fetch products'
    } finally {
      loading.value = false
    }
  }

  async function fetchProduct(id: number) {
    loading.value = true
    error.value = null
    try {
      const response = await productApi.getById(id)
      currentProduct.value = response.data.data
    } catch (e: any) {
      error.value = e.message || 'Failed to fetch product'
    } finally {
      loading.value = false
    }
  }

  return { products, currentProduct, loading, error, fetchProducts, fetchProduct }
})
