/**
 * Common formatting helpers
 */

// Format currency
export const formatCurrency = (amount: number, currency = 'VND', locale = 'vi-VN'): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

// Format date
export const formatDate = (dateString: string | Date, locale = 'vi-VN'): string => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

// Generate random UUID
export const generateUUID = (): string => {
  if (crypto && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).substring(2, 15)
}
