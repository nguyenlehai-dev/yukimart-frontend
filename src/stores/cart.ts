import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface CartItem {
  id: number
  name: string
  image: string
  brand: string
  price: number       // sale price per unit
  originalPrice: number
  quantity: number
}

export interface OrderInfo {
  id: number
  date: string
  items: CartItem[]
  subtotal: number
  total: number
  paymentMethod: string
  customer: {
    firstName: string
    lastName: string
    company: string
    country: string
    address: string
    postalCode: string
    city: string
    phone: string
    email: string
    note: string
  }
}

export const useCartStore = defineStore('cart', () => {
  // ── Cart ──
  const items = ref<CartItem[]>([])

  const totalItems = computed(() =>
    items.value.reduce((sum, item) => sum + item.quantity, 0)
  )

  const subtotal = computed(() =>
    items.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
  )

  const totalOriginal = computed(() =>
    items.value.reduce((sum, item) => sum + item.originalPrice * item.quantity, 0)
  )

  function addItem(item: Omit<CartItem, 'quantity'>, quantity = 1) {
    const existing = items.value.find(i => i.id === item.id)
    if (existing) {
      existing.quantity += quantity
    } else {
      items.value.push({ ...item, quantity })
    }
  }

  function removeItem(id: number) {
    items.value = items.value.filter(i => i.id !== id)
  }

  function updateQuantity(id: number, qty: number) {
    const item = items.value.find(i => i.id === id)
    if (item) {
      if (qty <= 0) {
        removeItem(id)
      } else {
        item.quantity = qty
      }
    }
  }

  function clearCart() {
    items.value = []
  }

  // ── Orders ──
  const lastOrder = ref<OrderInfo | null>(null)
  let orderCounter = 1000

  function placeOrder(customer: OrderInfo['customer'], paymentMethod: string): OrderInfo {
    orderCounter++
    const order: OrderInfo = {
      id: orderCounter,
      date: new Date().toLocaleDateString('vi-VN'),
      items: [...items.value],
      subtotal: subtotal.value,
      total: subtotal.value,
      paymentMethod,
      customer,
    }
    lastOrder.value = order
    clearCart()
    return order
  }

  return {
    // Cart
    items,
    totalItems,
    subtotal,
    totalOriginal,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    // Orders
    lastOrder,
    placeOrder,
  }
})
