import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import type { Product } from '@/modules/mypage/home/configs'

/**
 * Returns the correct display price and label based on user role:
 * - admin: sees originalPrice (giá gốc, cao nhất)
 * - retail: sees salePrice (giá khách lẻ)
 * - wholesale: sees wholesalePrice (giá khách sỉ, thấp nhất)
 */
export function useProductPricing(product: Product) {
  const authStore = useAuthStore()

  const displayPrice = computed(() => {
    switch (authStore.userRole) {
      case 'admin':
        return product.originalPrice
      case 'wholesale':
        return product.wholesalePrice
      default: // retail or guest
        return product.salePrice
    }
  })

  const crossedOutPrice = computed(() => {
    // Show crossed-out price only if it's higher than display price
    if (authStore.userRole === 'admin') {
      return 0 // admin sees the highest price, no cross-out
    }
    return product.originalPrice > displayPrice.value ? product.originalPrice : 0
  })

  const priceLabel = computed(() => {
    switch (authStore.userRole) {
      case 'admin':
        return 'Giá gốc'
      case 'wholesale':
        return 'Giá sỉ'
      default:
        return ''
    }
  })

  const roleBadge = computed(() => {
    switch (authStore.userRole) {
      case 'wholesale':
        return { text: 'Giá sỉ', class: 'ym-price-badge--wholesale' }
      case 'admin':
        return { text: 'Giá gốc', class: 'ym-price-badge--admin' }
      default:
        return null
    }
  })

  return {
    displayPrice,
    crossedOutPrice,
    priceLabel,
    roleBadge,
    isLoggedIn: authStore.isLoggedIn,
    userRole: authStore.userRole,
  }
}
