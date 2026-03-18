/**
 * Composable for product formatting utilities
 */
export function useProductFormat() {
  function formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price)
  }

  function formatStock(stock: number): string {
    if (stock <= 0) return 'Hết hàng'
    if (stock <= 5) return `Chỉ còn ${stock} sản phẩm`
    return `Còn ${stock} sản phẩm`
  }

  function isInStock(stock: number): boolean {
    return stock > 0
  }

  return {
    formatPrice,
    formatStock,
    isInStock,
  }
}
