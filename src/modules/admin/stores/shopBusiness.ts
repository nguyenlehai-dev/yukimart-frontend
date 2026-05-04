/**
 * Shop Business Store
 *
 * Centralized state cho các entity liên quan tới NGHIỆP VỤ kinh doanh
 * (Customer, Order, Invoice, Return, Shipment, Purchase, Stock movement…)
 *
 * Áp dụng quy trình KiotViet:
 *   Đơn hàng → Hoá đơn → Trả hàng
 *   Đơn hàng → Vận đơn (qua đối tác giao hàng)
 *   Phiếu nhập (PO) → +Tồn kho + Công nợ NCC
 *   Trả hàng nhập → -Tồn kho - Công nợ NCC
 *   Khách hàng → Nhóm khách → Bảng giá → Discount tự áp dụng
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAdminDataStore } from './adminData'

// ─── Types ────────────────────────────────────────────────────────────────
export type CustomerType = 'retail' | 'wholesale' | 'vip'
export type AvatarTone = 'green' | 'blue' | 'orange' | 'pink' | 'purple'
export type OrderStatus = 'pending' | 'processing' | 'shipping' | 'completed' | 'cancelled'
export type InvoiceStatus = 'unpaid' | 'paid' | 'partial'
export type Payment = 'cod' | 'bank' | 'momo' | 'card'
export type ShipmentStatus = 'pending' | 'picking' | 'shipping' | 'delivered' | 'failed' | 'returned'
export type PurchaseStatus = 'draft' | 'received' | 'partial' | 'cancelled'
export type ReturnStatus = 'pending' | 'completed' | 'cancelled'
export type StockMoveType = 'in' | 'out' | 'adjust'

export interface CustomerGroup {
  id: number
  code: string                  // 'VIP' | 'WHOLESALE' | 'RETAIL' | 'NEW' | 'INACTIVE'
  name: string
  description: string
  minSpent: number
  discount: number              // % giảm giá khi đặt đơn
  color: string
  active: boolean
  priceListId: number | null    // Bảng giá tự động áp dụng
}

export interface PriceList {
  id: number
  code: string
  name: string
  appliesTo: 'all' | CustomerType | string  // có thể trỏ tới group code
  type: 'percent' | 'fixed'
  value: number                              // âm = giảm
  productIds: number[] | 'all'               // 'all' = áp dụng tất cả SP
  startDate: string
  endDate: string
  active: boolean
}

export interface Customer {
  id: number
  name: string
  email: string
  phone: string
  groupId: number               // Liên kết CustomerGroup
  ordersCount: number
  totalSpent: number
  joinedAt: string
  active: boolean
  initial: string
  avatarTone: AvatarTone
  note?: string
}

export interface Supplier {
  id: number
  code: string
  name: string
  contact: string
  phone: string
  email: string
  address: string
  totalDebt: number             // Công nợ phải trả
  totalPurchase: number
  active: boolean
}

export interface OrderLine {
  productId: number
  sku: string
  name: string
  image: string
  unitPrice: number
  quantity: number
}

export interface Order {
  id: number
  code: string                  // #YM2456
  customerId: number
  customerName: string
  customerEmail: string
  customerPhone: string
  customerAddress: string
  lines: OrderLine[]
  subtotal: number
  discount: number              // tổng giảm giá
  total: number
  payment: Payment
  status: OrderStatus
  invoiceId: number | null      // Hoá đơn được sinh từ đơn này
  shipmentId: number | null     // Vận đơn
  createdAt: string
  note?: string
}

export interface Invoice {
  id: number
  code: string                  // HD0042
  orderId: number               // ← liên kết Order
  orderCode: string
  customerId: number
  customerName: string
  itemCount: number
  subtotal: number
  vat: number                   // 10%
  total: number
  status: InvoiceStatus
  paid: number                  // số tiền đã thu
  createdAt: string
}

export interface SalesReturn {
  id: number
  code: string                  // TR0012
  invoiceId: number             // ← liên kết Invoice
  invoiceCode: string
  orderCode: string
  customerName: string
  lines: OrderLine[]            // dòng được trả
  total: number
  refunded: number
  reason: string
  status: ReturnStatus
  createdAt: string
}

export interface Shipment {
  id: number
  trackingCode: string
  orderId: number               // ← liên kết Order
  orderCode: string
  customerName: string
  partner: string
  partnerCode: string
  fee: number
  cod: number
  status: ShipmentStatus
  updatedAt: string
}

export interface PurchaseOrder {
  id: number
  code: string                  // NH00128
  supplierId: number
  supplierCode: string
  supplierName: string
  lines: OrderLine[]
  total: number
  paid: number
  status: PurchaseStatus
  invoiceId: number | null      // Hoá đơn đầu vào
  createdAt: string
  note?: string
}

export interface PurchaseInvoice {
  id: number
  code: string                  // HDV0042
  invoiceNo: string             // số HĐ GTGT của NCC
  purchaseOrderId: number       // ← liên kết PO
  purchaseOrderCode: string
  supplierName: string
  total: number
  vat: number
  status: 'unpaid' | 'paid' | 'overdue'
  dueDate: string
  createdAt: string
}

export interface PurchaseReturn {
  id: number
  code: string
  purchaseOrderId: number
  purchaseOrderCode: string
  supplierName: string
  lines: OrderLine[]
  total: number
  refunded: number
  reason: string
  status: ReturnStatus
  createdAt: string
}

export interface StockTransfer {
  id: number
  code: string
  fromWarehouse: string
  toWarehouse: string
  lines: OrderLine[]
  totalQuantity: number
  status: 'draft' | 'in_transit' | 'received' | 'cancelled'
  createdAt: string
  createdBy: string
}

export interface StockCheck {
  id: number
  code: string
  warehouse: string
  itemsChecked: number
  differences: number
  status: 'draft' | 'completed' | 'adjusted'
  createdAt: string
  createdBy: string
}

export interface StockInternal {
  id: number
  code: string
  warehouse: string
  lines: OrderLine[]
  totalQuantity: number
  totalValue: number
  purpose: string
  status: 'draft' | 'completed'
  createdAt: string
}

export interface StockDisposal {
  id: number
  code: string
  warehouse: string
  lines: OrderLine[]
  totalQuantity: number
  totalValue: number
  reason: string
  status: 'pending' | 'approved' | 'cancelled'
  createdAt: string
}

export interface InventoryMovement {
  id: number
  productId: number
  productSku: string
  productName: string
  type: StockMoveType
  quantity: number
  refCode: string               // PO/Order/Disposal/...
  refType: 'purchase_order' | 'order' | 'sales_return' | 'purchase_return' | 'transfer' | 'check' | 'internal' | 'disposal' | 'manual'
  by: string
  reason?: string
  at: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────
const tones: AvatarTone[] = ['green', 'blue', 'orange', 'pink', 'purple']
function nowStr() {
  const d = new Date()
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
function dateStr() {
  const d = new Date()
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

// ─── Store ────────────────────────────────────────────────────────────────
export const useShopBusinessStore = defineStore('shopBusiness', () => {
  const adminData = useAdminDataStore()

  // ── Seeds: Price lists ──
  const priceLists = ref<PriceList[]>([
    { id: 1, code: 'BG-RETAIL', name: 'Giá lẻ chuẩn', appliesTo: 'retail', type: 'percent', value: 0, productIds: 'all', startDate: '01/01/2026', endDate: '31/12/2026', active: true },
    { id: 2, code: 'BG-VIP', name: 'Bảng giá VIP - Giảm 15%', appliesTo: 'vip', type: 'percent', value: -15, productIds: 'all', startDate: '01/01/2026', endDate: '31/12/2026', active: true },
    { id: 3, code: 'BG-WS', name: 'Giá sỉ - Giảm 35%', appliesTo: 'wholesale', type: 'percent', value: -35, productIds: 'all', startDate: '01/01/2026', endDate: '31/12/2026', active: true },
    { id: 4, code: 'KM-NEW', name: 'Khách mới - Giảm 5%', appliesTo: 'NEW', type: 'percent', value: -5, productIds: 'all', startDate: '01/01/2026', endDate: '31/12/2026', active: true },
  ])

  // ── Seeds: Customer groups ──
  const customerGroups = ref<CustomerGroup[]>([
    { id: 1, code: 'VIP', name: 'Khách VIP', description: 'Khách hàng chi tiêu trên 10 triệu/năm', minSpent: 10_000_000, discount: 15, color: '#f7c948', active: true, priceListId: 2 },
    { id: 2, code: 'WHOLESALE', name: 'Khách sỉ', description: 'Đại lý, cửa hàng nhỏ', minSpent: 30_000_000, discount: 35, color: '#326e51', active: true, priceListId: 3 },
    { id: 3, code: 'RETAIL', name: 'Khách lẻ', description: 'Khách hàng cá nhân', minSpent: 0, discount: 0, color: '#2563eb', active: true, priceListId: 1 },
    { id: 4, code: 'NEW', name: 'Khách hàng mới', description: 'Đăng ký trong 30 ngày', minSpent: 0, discount: 5, color: '#e91e63', active: true, priceListId: 4 },
    { id: 5, code: 'INACTIVE', name: 'Khách không hoạt động', description: 'Không mua hàng > 6 tháng', minSpent: 0, discount: 0, color: '#6b7280', active: false, priceListId: 1 },
  ])

  // ── Seeds: Customers ──
  const customers = ref<Customer[]>([
    { id: 1, name: 'Nguyễn Văn An', email: 'an.nguyen@example.com', phone: '0901 234 567', groupId: 1, ordersCount: 24, totalSpent: 18_500_000, joinedAt: '12/01/2024', active: true, initial: 'A', avatarTone: 'green' },
    { id: 2, name: 'Trần Thị Bình', email: 'binh.tran@example.com', phone: '0912 345 678', groupId: 3, ordersCount: 8, totalSpent: 3_200_000, joinedAt: '03/03/2024', active: true, initial: 'B', avatarTone: 'blue' },
    { id: 3, name: 'Lê Quốc Cường', email: 'cuong.le@example.com', phone: '0923 456 789', groupId: 2, ordersCount: 42, totalSpent: 86_400_000, joinedAt: '20/06/2023', active: true, initial: 'C', avatarTone: 'orange' },
    { id: 4, name: 'Phạm Mai Dung', email: 'dung.pham@example.com', phone: '0934 567 890', groupId: 3, ordersCount: 3, totalSpent: 720_000, joinedAt: '15/09/2024', active: true, initial: 'D', avatarTone: 'pink' },
    { id: 5, name: 'Hoàng Tuấn Em', email: 'em.hoang@example.com', phone: '0945 678 901', groupId: 5, ordersCount: 1, totalSpent: 220_000, joinedAt: '02/10/2024', active: false, initial: 'E', avatarTone: 'purple' },
    { id: 6, name: 'Vũ Hồng Phúc', email: 'phuc.vu@example.com', phone: '0956 789 012', groupId: 1, ordersCount: 38, totalSpent: 32_100_000, joinedAt: '08/02/2023', active: true, initial: 'P', avatarTone: 'green' },
    { id: 7, name: 'Đỗ Thanh Giang', email: 'giang.do@example.com', phone: '0967 890 123', groupId: 2, ordersCount: 17, totalSpent: 45_200_000, joinedAt: '25/04/2024', active: true, initial: 'G', avatarTone: 'blue' },
    { id: 8, name: 'Bùi Ngọc Hà', email: 'ha.bui@example.com', phone: '0978 901 234', groupId: 3, ordersCount: 5, totalSpent: 1_480_000, joinedAt: '11/07/2024', active: true, initial: 'H', avatarTone: 'orange' },
    { id: 9, name: 'Trịnh Văn Khôi', email: 'khoi.trinh@example.com', phone: '0935 444 222', groupId: 4, ordersCount: 1, totalSpent: 380_000, joinedAt: '20/04/2026', active: true, initial: 'K', avatarTone: 'pink' },
    { id: 10, name: 'Lý Quang Minh', email: 'minh.ly@example.com', phone: '0902 111 333', groupId: 1, ordersCount: 31, totalSpent: 28_900_000, joinedAt: '05/03/2024', active: true, initial: 'M', avatarTone: 'green' },
  ])

  // ── Seeds: Suppliers ──
  const suppliers = ref<Supplier[]>([
    { id: 1, code: 'NCC001', name: 'Công ty TNHH Maybelline VN', contact: 'Nguyễn Văn A', phone: '0901234567', email: 'maybelline@vn.com', address: '12 Lê Lợi, Q.1, TP.HCM', totalDebt: 12_500_000, totalPurchase: 245_000_000, active: true },
    { id: 2, code: 'NCC002', name: 'Cetaphil Vietnam', contact: 'Trần Thị B', phone: '0912345678', email: 'cetaphil@vn.com', address: '56 Nguyễn Trãi, TP.HCM', totalDebt: 0, totalPurchase: 180_000_000, active: true },
    { id: 3, code: 'NCC003', name: 'La Roche-Posay Distributor', contact: 'Lê Quốc C', phone: '0923456789', email: 'lrp@distributor.vn', address: '8 Trần Hưng Đạo, Hà Nội', totalDebt: 5_800_000, totalPurchase: 95_000_000, active: true },
    { id: 4, code: 'NCC004', name: 'Senka Beauty Vietnam', contact: 'Phạm Mai D', phone: '0934567890', email: 'senka@beauty.vn', address: '24 Hai Bà Trưng, Đà Nẵng', totalDebt: 0, totalPurchase: 65_000_000, active: true },
    { id: 5, code: 'NCC005', name: 'Anessa Sun Care', contact: 'Hoàng E', phone: '0945678901', email: 'anessa@suncare.vn', address: '17 Phan Chu Trinh, Hà Nội', totalDebt: 22_000_000, totalPurchase: 320_000_000, active: true },
    { id: 6, code: 'NCC006', name: 'Mediheal Cosmetics', contact: 'Đỗ G', phone: '0967890123', email: 'mediheal@vn.com', address: '3 Lý Tự Trọng, TP.HCM', totalDebt: 7_800_000, totalPurchase: 142_000_000, active: true },
  ])

  // ── Seeds: Orders ──
  const orders = ref<Order[]>([])
  const invoices = ref<Invoice[]>([])
  const salesReturns = ref<SalesReturn[]>([])
  const shipments = ref<Shipment[]>([])
  const purchaseOrders = ref<PurchaseOrder[]>([])
  const purchaseInvoices = ref<PurchaseInvoice[]>([])
  const purchaseReturns = ref<PurchaseReturn[]>([])
  const stockTransfers = ref<StockTransfer[]>([])
  const stockChecks = ref<StockCheck[]>([])
  const stockInternals = ref<StockInternal[]>([])
  const stockDisposals = ref<StockDisposal[]>([])
  const inventoryMovements = ref<InventoryMovement[]>([])

  // Init seed orders sau khi customers ready
  function seedTransactions() {
    if (orders.value.length || !adminData.products.length) return
    const products = adminData.products
    if (!products.length) return

    const lineFromProduct = (productId: number, qty: number, customer: Customer): OrderLine | null => {
      const p = products.find((x) => x.id === productId)
      if (!p) return null
      // Áp dụng giá theo nhóm khách
      const group = customerGroups.value.find((g) => g.id === customer.groupId)
      const discount = group?.discount || 0
      const unitPrice = Math.round(p.salePrice * (1 - discount / 100))
      return { productId: p.id, sku: p.sku, name: p.name, image: p.image, unitPrice, quantity: qty }
    }

    const seed: { code: string; cust: number; items: number[][]; payment: Payment; status: OrderStatus; createdAt: string }[] = [
      { code: '#YM2456', cust: 1, items: [[products[0].id, 2], [products[2].id, 1]], payment: 'cod', status: 'pending', createdAt: '04/05/2026 10:42' },
      { code: '#YM2455', cust: 2, items: [[products[1].id, 1]], payment: 'momo', status: 'processing', createdAt: '04/05/2026 10:30' },
      { code: '#YM2454', cust: 3, items: [[products[3].id, 5], [products[4].id, 2]], payment: 'bank', status: 'shipping', createdAt: '04/05/2026 09:50' },
      { code: '#YM2453', cust: 4, items: [[products[5].id, 1], [products[6].id, 1]], payment: 'cod', status: 'completed', createdAt: '04/05/2026 09:15' },
      { code: '#YM2452', cust: 5, items: [[products[7].id, 4]], payment: 'card', status: 'cancelled', createdAt: '03/05/2026 22:08' },
      { code: '#YM2451', cust: 6, items: [[products[0].id, 1], [products[1].id, 1]], payment: 'bank', status: 'completed', createdAt: '03/05/2026 18:42' },
      { code: '#YM2450', cust: 7, items: [[products[2].id, 6]], payment: 'momo', status: 'shipping', createdAt: '03/05/2026 16:20' },
      { code: '#YM2449', cust: 8, items: [[products[3].id, 1]], payment: 'cod', status: 'completed', createdAt: '03/05/2026 14:11' },
    ]

    let nextOrderId = 1
    let nextInvoiceId = 1
    let nextShipmentId = 1
    for (const s of seed) {
      const cust = customers.value.find((c) => c.id === s.cust)!
      const lines: OrderLine[] = s.items
        .map(([pid, q]) => lineFromProduct(pid, q, cust))
        .filter((l): l is OrderLine => l !== null)
      const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0)
      const order: Order = {
        id: nextOrderId++, code: s.code,
        customerId: cust.id, customerName: cust.name, customerEmail: cust.email, customerPhone: cust.phone,
        customerAddress: '12 Nguyễn Trãi, Q.1, TP.HCM',
        lines, subtotal, discount: 0, total: subtotal,
        payment: s.payment, status: s.status,
        invoiceId: null, shipmentId: null,
        createdAt: s.createdAt,
      }
      // Auto sinh hoá đơn cho đơn đã completed/shipping
      if (s.status === 'completed' || s.status === 'shipping') {
        const subt = Math.round(subtotal / 1.1)
        const vat = subtotal - subt
        const inv: Invoice = {
          id: nextInvoiceId++,
          code: 'HD' + String(nextInvoiceId).padStart(4, '0'),
          orderId: order.id, orderCode: order.code,
          customerId: cust.id, customerName: cust.name,
          itemCount: lines.reduce((a, l) => a + l.quantity, 0),
          subtotal: subt, vat, total: subtotal,
          status: s.status === 'completed' ? 'paid' : 'partial',
          paid: s.status === 'completed' ? subtotal : Math.round(subtotal * 0.5),
          createdAt: s.createdAt,
        }
        invoices.value.push(inv)
        order.invoiceId = inv.id
      }
      // Auto sinh vận đơn cho đơn shipping/completed
      if (s.status === 'shipping' || s.status === 'completed') {
        const ship: Shipment = {
          id: nextShipmentId++,
          trackingCode: 'GHN' + String(1235487100 + nextShipmentId).padStart(10, '0'),
          orderId: order.id, orderCode: order.code,
          customerName: cust.name,
          partner: 'Giao Hàng Nhanh', partnerCode: 'GHN',
          fee: 28000, cod: s.payment === 'cod' ? subtotal : 0,
          status: s.status === 'completed' ? 'delivered' : 'shipping',
          updatedAt: s.createdAt,
        }
        shipments.value.push(ship)
        order.shipmentId = ship.id
      }
      orders.value.push(order)
    }

    // Seed một vài purchase orders
    let nextPOId = 1
    let nextPInvId = 1
    const poSeed: { supplierId: number; productIdx: number; qty: number; status: PurchaseStatus; createdAt: string }[] = [
      { supplierId: 1, productIdx: 0, qty: 50, status: 'received', createdAt: '04/05/2026 09:42' },
      { supplierId: 2, productIdx: 11, qty: 30, status: 'partial', createdAt: '03/05/2026 14:20' },
      { supplierId: 3, productIdx: 5, qty: 25, status: 'received', createdAt: '03/05/2026 10:15' },
      { supplierId: 4, productIdx: 2, qty: 40, status: 'draft', createdAt: '02/05/2026 16:30' },
      { supplierId: 5, productIdx: 1, qty: 60, status: 'received', createdAt: '01/05/2026 11:00' },
    ]
    for (const ps of poSeed) {
      const sup = suppliers.value.find((s) => s.id === ps.supplierId)!
      const p = products[ps.productIdx]
      if (!p) continue
      const line: OrderLine = { productId: p.id, sku: p.sku, name: p.name, image: p.image, unitPrice: p.cost, quantity: ps.qty }
      const total = line.unitPrice * line.quantity
      const po: PurchaseOrder = {
        id: nextPOId++,
        code: 'NH' + String(nextPOId + 100).padStart(5, '0'),
        supplierId: sup.id, supplierCode: sup.code, supplierName: sup.name,
        lines: [line], total, paid: ps.status === 'received' ? total : ps.status === 'partial' ? Math.round(total * 0.5) : 0,
        status: ps.status, invoiceId: null, createdAt: ps.createdAt,
      }
      // Sinh PI cho phiếu received
      if (ps.status === 'received') {
        const subt = Math.round(total / 1.1)
        const pinv: PurchaseInvoice = {
          id: nextPInvId++,
          code: 'HDV' + String(nextPInvId + 100).padStart(4, '0'),
          invoiceNo: 'GTGT-1234' + nextPInvId,
          purchaseOrderId: po.id, purchaseOrderCode: po.code,
          supplierName: sup.name,
          total, vat: total - subt,
          status: 'paid', dueDate: '15/05/2026', createdAt: ps.createdAt.split(' ')[0],
        }
        purchaseInvoices.value.push(pinv)
        po.invoiceId = pinv.id
      }
      purchaseOrders.value.push(po)
    }
  }

  // Re-seed mỗi khi products vừa load xong
  let seedDone = false
  function ensureSeeded() {
    if (!seedDone && adminData.products.length > 0) {
      seedTransactions()
      seedDone = true
    }
  }

  // ─── Lookup helpers ─────────────────────────────────────────────
  function getCustomer(id: number) { return customers.value.find((c) => c.id === id) || null }
  function getCustomerGroup(id: number) { return customerGroups.value.find((g) => g.id === id) || null }
  function getPriceList(id: number) { return priceLists.value.find((p) => p.id === id) || null }
  function getSupplier(id: number) { return suppliers.value.find((s) => s.id === id) || null }
  function getOrder(id: number) { return orders.value.find((o) => o.id === id) || null }
  function getInvoice(id: number) { return invoices.value.find((i) => i.id === id) || null }
  function getShipment(id: number) { return shipments.value.find((s) => s.id === id) || null }
  function getPO(id: number) { return purchaseOrders.value.find((p) => p.id === id) || null }

  function customersInGroup(groupId: number) {
    return customers.value.filter((c) => c.groupId === groupId)
  }

  // Tự động chọn bảng giá phù hợp với khách hàng
  function priceListForCustomer(c: Customer): PriceList | null {
    const group = getCustomerGroup(c.groupId)
    if (!group) return null
    return getPriceList(group.priceListId || 0) || null
  }

  // Tính giá khách phải trả cho 1 sản phẩm
  function priceForCustomer(productId: number, customerId: number): number {
    const product = adminData.findProduct(productId)
    if (!product) return 0
    const c = getCustomer(customerId)
    if (!c) return product.salePrice
    const group = getCustomerGroup(c.groupId)
    if (!group) return product.salePrice
    return Math.round(product.salePrice * (1 - group.discount / 100))
  }

  // ─── Workflow actions ───────────────────────────────────────────

  // Tạo hoá đơn từ đơn hàng (Order → Invoice)
  function createInvoiceFromOrder(orderId: number): Invoice | null {
    const order = getOrder(orderId)
    if (!order) return null
    if (order.invoiceId) return getInvoice(order.invoiceId)
    const subt = Math.round(order.total / 1.1)
    const vat = order.total - subt
    const id = Math.max(0, ...invoices.value.map((i) => i.id)) + 1
    const inv: Invoice = {
      id, code: 'HD' + String(id + 40).padStart(4, '0'),
      orderId: order.id, orderCode: order.code,
      customerId: order.customerId, customerName: order.customerName,
      itemCount: order.lines.reduce((a, l) => a + l.quantity, 0),
      subtotal: subt, vat, total: order.total,
      status: 'unpaid', paid: 0,
      createdAt: nowStr(),
    }
    invoices.value.unshift(inv)
    order.invoiceId = inv.id
    return inv
  }

  // Tạo phiếu trả từ hoá đơn (Invoice → SalesReturn)
  function createReturnFromInvoice(invoiceId: number, lines: OrderLine[], reason: string): SalesReturn | null {
    const inv = getInvoice(invoiceId)
    if (!inv) return null
    const order = getOrder(inv.orderId)
    const total = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0)
    const id = Math.max(0, ...salesReturns.value.map((r) => r.id)) + 1
    const sr: SalesReturn = {
      id, code: 'TR' + String(id + 12).padStart(4, '0'),
      invoiceId: inv.id, invoiceCode: inv.code,
      orderCode: order?.code || inv.orderCode,
      customerName: inv.customerName,
      lines, total, refunded: 0, reason,
      status: 'pending', createdAt: nowStr(),
    }
    salesReturns.value.unshift(sr)
    return sr
  }

  // Hoàn tiền & restore tồn kho
  function approveSalesReturn(returnId: number) {
    const sr = salesReturns.value.find((r) => r.id === returnId)
    if (!sr || sr.status !== 'pending') return
    sr.status = 'completed'
    sr.refunded = sr.total
    // Restore tồn
    for (const line of sr.lines) {
      adminData.adjustStock(line.productId, line.quantity).catch(() => {})
      logMovement(line.productId, line.sku, line.name, 'in', line.quantity, sr.code, 'sales_return', 'Khách trả hàng - ' + sr.reason)
    }
  }

  // Tạo vận đơn từ đơn hàng (Order → Shipment)
  function createShipmentFromOrder(orderId: number, partner: string, partnerCode: string, fee: number): Shipment | null {
    const order = getOrder(orderId)
    if (!order) return null
    if (order.shipmentId) return getShipment(order.shipmentId)
    const id = Math.max(0, ...shipments.value.map((s) => s.id)) + 1
    const ship: Shipment = {
      id,
      trackingCode: partnerCode + String(1000000000 + id * 7).padStart(10, '0'),
      orderId: order.id, orderCode: order.code,
      customerName: order.customerName,
      partner, partnerCode, fee,
      cod: order.payment === 'cod' ? order.total : 0,
      status: 'pending', updatedAt: nowStr(),
    }
    shipments.value.unshift(ship)
    order.shipmentId = ship.id
    return ship
  }

  // Tạo phiếu nhập hàng (Purchase Order → +Stock + Supplier debt)
  function createPurchaseOrder(supplierId: number, lines: OrderLine[], note?: string): PurchaseOrder | null {
    const sup = getSupplier(supplierId)
    if (!sup || !lines.length) return null
    const total = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0)
    const id = Math.max(0, ...purchaseOrders.value.map((p) => p.id)) + 1
    const po: PurchaseOrder = {
      id, code: 'NH' + String(id + 130).padStart(5, '0'),
      supplierId: sup.id, supplierCode: sup.code, supplierName: sup.name,
      lines, total, paid: 0, status: 'draft', invoiceId: null,
      createdAt: nowStr(), note,
    }
    purchaseOrders.value.unshift(po)
    return po
  }

  // Xác nhận đã nhận hàng → +Stock
  function receivePurchaseOrder(poId: number) {
    const po = getPO(poId)
    if (!po || po.status === 'received' || po.status === 'cancelled') return
    po.status = 'received'
    for (const line of po.lines) {
      adminData.adjustStock(line.productId, line.quantity).catch(() => {})
      logMovement(line.productId, line.sku, line.name, 'in', line.quantity, po.code, 'purchase_order', 'Nhập từ ' + po.supplierName)
    }
    // Tăng công nợ NCC
    const sup = getSupplier(po.supplierId)
    if (sup) {
      sup.totalPurchase += po.total
      sup.totalDebt += po.total - po.paid
    }
  }

  // Log inventory movement
  function logMovement(productId: number, sku: string, name: string, type: StockMoveType, quantity: number, refCode: string, refType: InventoryMovement['refType'], reason?: string) {
    const id = Math.max(0, ...inventoryMovements.value.map((m) => m.id)) + 1
    inventoryMovements.value.unshift({
      id, productId, productSku: sku, productName: name,
      type, quantity, refCode, refType,
      by: 'Admin', reason, at: nowStr(),
    })
  }

  // Customer CRUD
  function addCustomer(c: Omit<Customer, 'id' | 'ordersCount' | 'totalSpent' | 'joinedAt' | 'initial' | 'avatarTone'>): Customer {
    const id = Math.max(0, ...customers.value.map((x) => x.id)) + 1
    const cust: Customer = {
      ...c, id,
      ordersCount: 0, totalSpent: 0, joinedAt: dateStr(),
      initial: c.name[0]?.toUpperCase() || '?',
      avatarTone: tones[id % tones.length],
    }
    customers.value.unshift(cust)
    return cust
  }
  function updateCustomer(id: number, patch: Partial<Customer>) {
    const idx = customers.value.findIndex((c) => c.id === id)
    if (idx >= 0) customers.value[idx] = { ...customers.value[idx], ...patch }
  }
  function removeCustomer(id: number) {
    customers.value = customers.value.filter((c) => c.id !== id)
  }

  // ─── Computed ───────────────────────────────────────────────────
  const totalRevenue = computed(() => invoices.value.reduce((s, i) => s + i.paid, 0))
  const totalReceivable = computed(() => invoices.value.reduce((s, i) => s + (i.total - i.paid), 0))
  const totalSupplierDebt = computed(() => suppliers.value.reduce((s, x) => s + x.totalDebt, 0))

  function ordersOfCustomer(customerId: number) {
    return orders.value.filter((o) => o.customerId === customerId)
  }
  function invoicesOfOrder(orderId: number) {
    return invoices.value.filter((i) => i.orderId === orderId)
  }
  function returnsOfInvoice(invoiceId: number) {
    return salesReturns.value.filter((r) => r.invoiceId === invoiceId)
  }
  function poOfSupplier(supplierId: number) {
    return purchaseOrders.value.filter((p) => p.supplierId === supplierId)
  }

  return {
    // collections
    priceLists, customerGroups, customers, suppliers,
    orders, invoices, salesReturns, shipments,
    purchaseOrders, purchaseInvoices, purchaseReturns,
    stockTransfers, stockChecks, stockInternals, stockDisposals,
    inventoryMovements,

    // lookups
    getCustomer, getCustomerGroup, getPriceList, getSupplier,
    getOrder, getInvoice, getShipment, getPO,
    customersInGroup, priceListForCustomer, priceForCustomer,
    ordersOfCustomer, invoicesOfOrder, returnsOfInvoice, poOfSupplier,

    // workflows
    createInvoiceFromOrder,
    createReturnFromInvoice, approveSalesReturn,
    createShipmentFromOrder,
    createPurchaseOrder, receivePurchaseOrder,
    logMovement,

    // customer CRUD
    addCustomer, updateCustomer, removeCustomer,

    // bootstrap
    ensureSeeded,

    // stats
    totalRevenue, totalReceivable, totalSupplierDebt,
  }
})
