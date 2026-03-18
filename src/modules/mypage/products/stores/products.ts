import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Product, ProductFilter } from '../models/Product'
import productService from '../services/productService'

export const useProductStore = defineStore('products', () => {
  const products = ref<Product[]>([])
  const currentProduct = ref<Product | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchProducts(params?: ProductFilter) {
    loading.value = true
    error.value = null
    try {
      const response = await productService.getAll(params)
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
      const response = await productService.getById(id)
      currentProduct.value = response.data.data
    } catch (e: any) {
      error.value = e.message || 'Failed to fetch product'
    } finally {
      loading.value = false
    }
  }

  return { products, currentProduct, loading, error, fetchProducts, fetchProduct }
})
