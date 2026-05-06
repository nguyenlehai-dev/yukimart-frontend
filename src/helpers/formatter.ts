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

/**
 * Smart date format — nhận ISO/timestamp/dd-mm-yyyy/dd/mm/yyyy/empty,
 * trả về chuỗi vi-VN dạng dd/mm/yyyy. Trả về empty string khi input lỗi.
 */
export const formatDateSmart = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return ''
  const s = String(value).trim()
  if (!s) return ''

  // Đã là dd/mm/yyyy hoặc dd-mm-yyyy → trả về (chuẩn hoá / cho gọn)
  const ddMmYyyy = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/.exec(s)
  if (ddMmYyyy) {
    const [, d, m, y] = ddMmYyyy
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`
  }

  const d = new Date(s)
  if (isNaN(d.getTime())) return s
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}/${d.getFullYear()}`
}

/** Format datetime đầy đủ: dd/mm/yyyy HH:mm. */
export const formatDateTime = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return ''
  const d = new Date(String(value))
  if (isNaN(d.getTime())) return String(value)
  const date = formatDateSmart(value)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${date} ${hh}:${mm}`
}

/** Relative thời gian: "3 ngày trước", "2 tháng trước". */
export const formatRelativeTime = (value: unknown): string => {
  if (!value) return ''
  const d = new Date(String(value))
  if (isNaN(d.getTime())) return ''
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000)
  if (seconds < 60) return 'Vừa xong'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} phút trước`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} giờ trước`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} ngày trước`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} tháng trước`
  const years = Math.floor(months / 12)
  return `${years} năm trước`
}

// Generate random UUID
export const generateUUID = (): string => {
  if (crypto && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).substring(2, 15)
}
