import type { RouteRecordRaw } from 'vue-router'

const adminMeta = { module: 'admin', requiresAuth: true, layout: 'AdminLayout' }

const routes: RouteRecordRaw[] = [
  // Tổng quan
  { path: '/admin', name: 'admin', component: () => import('../views/DashboardView.vue'), meta: { ...adminMeta, title: 'Dashboard' } },

  // Hàng hóa
  { path: '/admin/products', name: 'admin-products', component: () => import('../views/ProductsView.vue'), meta: { ...adminMeta, title: 'Sản phẩm' } },
  { path: '/admin/categories', name: 'admin-categories', component: () => import('../views/CategoriesView.vue'), meta: { ...adminMeta, title: 'Danh mục' } },
  { path: '/admin/product-comments', name: 'admin-product-comments', component: () => import('../views/ProductCommentsView.vue'), meta: { ...adminMeta, title: 'Bình luận sản phẩm' } },
  { path: '/admin/price-list', name: 'admin-price-list', component: () => import('../views/PriceListView.vue'), meta: { ...adminMeta, title: 'Thiết lập giá' } },
  { path: '/admin/sections', name: 'admin-sections', component: () => import('../views/ShopSectionsView.vue'), meta: { ...adminMeta, title: 'Khu vực hiển thị' } },

  // Nội dung
  { path: '/admin/brands', name: 'admin-brands', component: () => import('../views/BrandsView.vue'), meta: { ...adminMeta, title: 'Thương hiệu nổi bật' } },
  { path: '/admin/news', name: 'admin-news', component: () => import('../views/NewsAdminView.vue'), meta: { ...adminMeta, title: 'Tin tức' } },
  { path: '/admin/promotions', name: 'admin-promotions', component: () => import('../views/PromotionsAdminView.vue'), meta: { ...adminMeta, title: 'Khuyến mãi' } },

  // Kho hàng
  { path: '/admin/inventory', name: 'admin-inventory', component: () => import('../views/InventoryView.vue'), meta: { ...adminMeta, title: 'Tồn kho' } },
  { path: '/admin/stock-transfer', name: 'admin-stock-transfer', component: () => import('../views/StockTransferView.vue'), meta: { ...adminMeta, title: 'Chuyển hàng' } },
  { path: '/admin/stock-check', name: 'admin-stock-check', component: () => import('../views/StockCheckView.vue'), meta: { ...adminMeta, title: 'Kiểm kho' } },
  { path: '/admin/stock-internal', name: 'admin-stock-internal', component: () => import('../views/StockInternalView.vue'), meta: { ...adminMeta, title: 'Xuất dùng nội bộ' } },
  { path: '/admin/stock-disposal', name: 'admin-stock-disposal', component: () => import('../views/StockDisposalView.vue'), meta: { ...adminMeta, title: 'Xuất hủy' } },

  // Mua hàng
  { path: '/admin/suppliers', name: 'admin-suppliers', component: () => import('../views/SuppliersView.vue'), meta: { ...adminMeta, title: 'Nhà cung cấp' } },
  { path: '/admin/purchase-invoices', name: 'admin-purchase-invoices', component: () => import('../views/PurchaseInvoicesView.vue'), meta: { ...adminMeta, title: 'Hóa đơn đầu vào' } },
  { path: '/admin/purchase-orders', name: 'admin-purchase-orders', component: () => import('../views/PurchaseOrdersView.vue'), meta: { ...adminMeta, title: 'Nhập hàng' } },
  { path: '/admin/purchase-returns', name: 'admin-purchase-returns', component: () => import('../views/PurchaseReturnsView.vue'), meta: { ...adminMeta, title: 'Trả hàng nhập' } },

  // Đơn hàng
  { path: '/admin/orders', name: 'admin-orders', component: () => import('../views/OrdersView.vue'), meta: { ...adminMeta, title: 'Đặt hàng' } },
  { path: '/admin/invoices', name: 'admin-invoices', component: () => import('../views/InvoicesView.vue'), meta: { ...adminMeta, title: 'Hóa đơn' } },
  { path: '/admin/sales-returns', name: 'admin-sales-returns', component: () => import('../views/SalesReturnsView.vue'), meta: { ...adminMeta, title: 'Trả hàng' } },
  { path: '/admin/shipping-partners', name: 'admin-shipping-partners', component: () => import('../views/ShippingPartnersView.vue'), meta: { ...adminMeta, title: 'Đối tác giao hàng' } },
  { path: '/admin/shipments', name: 'admin-shipments', component: () => import('../views/ShipmentsView.vue'), meta: { ...adminMeta, title: 'Vận đơn' } },

  // Khách hàng
  { path: '/admin/customers', name: 'admin-customers', component: () => import('../views/CustomersView.vue'), meta: { ...adminMeta, title: 'Khách hàng' } },
  { path: '/admin/customer-groups', name: 'admin-customer-groups', component: () => import('../views/CustomerGroupsView.vue'), meta: { ...adminMeta, title: 'Nhóm khách hàng' } },

  // Báo cáo
  { path: '/admin/reports/sales', name: 'admin-report-sales', component: () => import('../views/ReportSalesView.vue'), meta: { ...adminMeta, title: 'Báo cáo bán hàng' } },
  { path: '/admin/reports/inventory', name: 'admin-report-inventory', component: () => import('../views/ReportInventoryView.vue'), meta: { ...adminMeta, title: 'Báo cáo tồn kho' } },
  { path: '/admin/reports/finance', name: 'admin-report-finance', component: () => import('../views/ReportFinanceView.vue'), meta: { ...adminMeta, title: 'Báo cáo tài chính' } },

  // Hệ thống
  { path: '/admin/activity-log', name: 'admin-activity-log', component: () => import('../views/ActivityLogView.vue'), meta: { ...adminMeta, title: 'Nhật ký hệ thống' } },
  { path: '/admin/settings', name: 'admin-settings', component: () => import('../views/SettingsView.vue'), meta: { ...adminMeta, title: 'Cài đặt' } },
]

export default routes
