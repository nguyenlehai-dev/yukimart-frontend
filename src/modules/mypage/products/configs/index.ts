/**
 * Products Module Config - Extended for Product Detail Page
 */
import dealSon from '@/assets/images/products/deal/son-li-maybelline-chilli-nude-3-9g-650x580.jpg'
import dealMelano from '@/assets/images/products/deal/57-34.jpg'
import dealSenka from '@/assets/images/products/deal/gel-sua-chong-nang-spf50-senka-80g.jpg'
import dealMatNa from '@/assets/images/products/deal/mat-na-duong-san-chac-da-banobagi-vita-genic-jelly-mask-30ml.jpg'
import dealCheKhuyetDiem from '@/assets/images/products/deal/che-khuyet-diem-130-medium-6ml-5.jpg'
import dealMascara from '@/assets/images/products/deal/tải-xuống-2.jpg'

import { type Product as HomeProduct } from '@/modules/mypage/home/configs'
import { useAdminDataStore } from '@/modules/admin/stores/adminData'

import type { ProductDetail, RelatedProduct, ProductQuestion } from '../models/Product'

export const PRODUCTS_PER_PAGE = 12

export const SORT_OPTIONS = [
  { label: 'Mới nhất', value: 'created_at:desc' },
  { label: 'Giá tăng dần', value: 'price:asc' },
  { label: 'Giá giảm dần', value: 'price:desc' },
  { label: 'Tên A-Z', value: 'name:asc' },
  { label: 'Tên Z-A', value: 'name:desc' },
] as const

export const DEFAULT_PRODUCT_IMAGE = '/images/product-placeholder.png'

// ── Format giá VNĐ ──
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('vi-VN').format(price) + ' đ'
}

// ── Collect tất cả sản phẩm từ store (đồng bộ với admin) ──
// Bao gồm cả 'draft' vì imported SP từ Excel mặc định 'draft' (BE chỉ set 'active'
// khi cột Trạng thái nhận giá trị hợp lệ). Chỉ ẩn 'out_of_stock'.
function getAllHomeProducts(): HomeProduct[] {
  const store = useAdminDataStore()
  const byId = new Map<number, any>()
  for (const product of store.products.filter((p) => p.status !== 'out_of_stock')) byId.set(product.id, product)
  for (const product of store.publicProducts) byId.set(product.id, product)
  return [...byId.values()] as unknown as HomeProduct[]
}

// ── Generate ProductDetail từ HomeProduct ──
function generateDetailFromHomeProduct(p: HomeProduct): ProductDetail {
  const allProducts = getAllHomeProducts()
  // Lấy 1 số sản phẩm khác làm ảnh gallery
  const otherImages = allProducts
    .filter(op => op.id !== p.id)
    .slice(0, 3)
    .map(op => op.image)

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: String(400000000 + p.id),
    brand: p.brand,
    brandOrigin: 'Đang cập nhật',
    category: p.category,
    categoryPath: ['Trang chủ', 'Sức Khỏe - Làm Đẹp', p.category, p.name.split(' ').slice(0, 3).join(' ')],
    images: [p.image, ...otherImages],
    customerImages: [dealCheKhuyetDiem, dealMascara, dealSenka],
    originalPrice: p.originalPrice,
    salePrice: p.salePrice,
    discount: p.discount,
    stock: Math.floor(Math.random() * 200) + 50,
    skinType: 'Mọi loại da',
    skinTypeOptions: [
      { label: 'Mọi loại da', image: p.image },
    ],
    volumes: ['1 sản phẩm'],
    selectedVolume: '1 sản phẩm',
    rating: +(4 + Math.random()).toFixed(1),
    ratingCount: Math.floor(Math.random() * 200) + 10,
    ratingDistribution: [1, 2, 5, 12, 80],
    questionCount: Math.floor(Math.random() * 100),
    flashDeal: p.discount >= 20 ? {
      endTime: '2026-03-20T23:59:59',
      label: 'FLASH DEAL',
    } : undefined,
    description: p.name,
    contentHtml: `
      <p><strong>${p.name}</strong> là sản phẩm thuộc thương hiệu <strong>${p.brand}</strong>, thuộc danh mục <strong>${p.category}</strong>.</p>
      <h3>Đặc điểm nổi bật</h3>
      <ul>
        <li>Công thức nhẹ nhàng, an toàn cho mọi loại da</li>
        <li>Thiết kế dành riêng cho phụ nữ Việt Nam</li>
        <li>Cam kết chính hãng 100%</li>
      </ul>
      <h3>Hướng dẫn sử dụng</h3>
      <p>Sử dụng theo hướng dẫn trên bao bì sản phẩm. Bảo quản nơi khô ráo, thoáng mát, tránh ánh nắng trực tiếp.</p>
      <h3>Lưu ý khi sử dụng</h3>
      <ul>
        <li>Tránh tiếp xúc với mắt. Nếu tiếp xúc, rửa kỹ với nước.</li>
        <li>Ngưng sử dụng nếu có dấu hiệu kích ứng.</li>
        <li>Để xa tầm tay trẻ em.</li>
      </ul>
    `,
    specs: [
      { label: 'Thương Hiệu', value: p.brand },
      { label: 'Danh mục', value: p.category },
      { label: 'Xuất xứ', value: 'Đang cập nhật' },
    ],
    ingredientsSections: [
      {
        title: p.name,
        mainIngredients: [
          { name: 'Thành phần chính', benefit: 'Đang cập nhật thông tin chi tiết.' },
        ],
        fullIngredients: 'Đang cập nhật thông tin thành phần đầy đủ.',
      },
    ],
    usage: [
      'Sử dụng theo hướng dẫn trên bao bì sản phẩm.',
      'Bảo quản nơi khô ráo, thoáng mát.',
    ],
    reviews: [
      { id: 1, author: 'Khách hàng', rating: 5, date: '15/03/2026', content: 'Sản phẩm rất tốt, đúng như mô tả. Giao hàng nhanh!', verified: true },
      { id: 2, author: 'Người dùng', rating: 4, date: '10/03/2026', content: 'Mình rất hài lòng, sẽ mua lại.', verified: true },
    ],
    questions: [
      { id: 1, author: 'Khách hàng', date: '2026-03-12, 14:30', content: 'Sản phẩm này có phù hợp cho da nhạy cảm không?', likes: 2, replies: [
        { id: 1, author: 'YukiMart', isStore: true, date: '2026-03-12, 15:00', content: 'Dạ sản phẩm phù hợp cho mọi loại da kể cả da nhạy cảm ạ.', likes: 1 },
      ] },
    ],
  }
}

// ── Mock Product Detail (CeraVe Foaming Cleanser) ──
export const mockProductDetail: ProductDetail = {
  id: 1,
  name: 'Sữa Rửa Mặt CeraVe Sạch Sâu Cho Da Thường Đến Da Dầu 473ml',
  slug: 'sua-rua-mat-cerave-sach-sau-cho-da-thuong-den-da-dau-473ml',
  sku: '422208973',
  brand: 'CeraVe',
  brandOrigin: 'Mỹ',
  category: 'Sữa Rửa Mặt',
  categoryPath: ['Trang chủ', 'Sức Khỏe - Làm Đẹp', 'Chăm Sóc Da Mặt', 'Làm Sạch Da', 'Sữa Rửa Mặt'],
  images: [
    dealSenka,
    dealMelano,
    dealMatNa,
    dealSon,
  ],
  customerImages: [
    dealCheKhuyetDiem,
    dealMascara,
    dealSenka,
    dealMelano,
    dealMatNa,
  ],
  originalPrice: 490000,
  salePrice: 360000,
  discount: 27,
  stock: 306,
  skinType: 'Da dầu/Hỗn hợp dầu',
  skinTypeOptions: [
    { label: 'Da dầu/Hỗn hợp dầu', image: dealSenka },
    { label: 'Da thường', image: dealMelano },
    { label: 'Da khô', image: dealMatNa },
  ],
  volumes: ['88ml', '236ml', '473ml'],
  selectedVolume: '473ml',
  rating: 4.9,
  ratingCount: 116,
  ratingDistribution: [1, 1, 3, 10, 85],
  questionCount: 584,
  flashDeal: {
    endTime: '2026-03-20T23:59:59',
    label: 'FLASH DEAL',
  },
  description: 'Foaming Cleanser',
  contentHtml: `
    <p><strong>Sữa Rửa Mặt Cerave Sạch Sâu</strong> là sản phẩm sữa rửa mặt đến từ thương hiệu mỹ phẩm <strong>Cerave</strong> của Mỹ, với sự kết hợp của ba Ceramides thiết yếu, Hyaluronic Acid sản phẩm giúp làm sạch và giữ ẩm cho làn da mà không ảnh hưởng đến hàng rào bảo vệ da mặt và cơ thể.</p>
    <p>Hiện sản phẩm <strong>Sữa Rửa Mặt Cerave Sạch Sâu</strong> đã có mặt tại Hasaki với 3 loại và 3 dung tích (88ml, 236ml, 473ml).</p>
    <ul>
      <li><strong>Sữa Rửa Mặt CeraVe Sạch Sâu Cho Da Thường Đến Da Dầu</strong></li>
      <li><strong>Sữa Rửa Mặt Cerave Cho Da Thường Đến Khô</strong></li>
      <li><strong>Sữa Rửa Mặt CeraVe Làm Sạch & Tẩy Tế Bào Chết Dịu Nhẹ</strong></li>
    </ul>
    <h3>1. Sữa Rửa Mặt Cerave Sạch Sâu Cho Da Thường Đến Da Dầu</h3>
    <p><strong>Sữa Rửa Mặt CeraVe Foaming Cleanser</strong> kết cấu dạng gel tạo bọt rất kỹ tưởng để loại bỏ dầu thừa, bụi bẩn và lớp trang điểm với công thức nhẹ nhàng, không phá vỡ hàng rào bảo vệ tự nhiên của da và chứa các thành phần giúp duy trì độ ẩm cân bằng da. Cerave Foaming Cleanser chứa <strong>Ceramides</strong>, <strong>Axit Hyaluronic</strong> và <strong>Niacinamide</strong> giúp duy trì hàng rào bảo vệ da, khoá ẩm và làm dịu làn da của bạn.</p>
  `,
  specs: [
    { label: 'Barcode', value: '3337875597197' },
    { label: 'Thương Hiệu', value: 'CeraVe' },
    { label: 'Xuất xứ thương hiệu', value: 'Mỹ' },
    { label: 'Nơi sản xuất', value: '' },
    { label: 'Loại da', value: 'Da dầu/Hỗn hợp dầu' },
    { label: 'Dung Tích', value: '473ml' },
  ],
  ingredientsSections: [
    {
      title: '1. Sữa Rửa Mặt Cerave Sạch Sâu Cho Da Thường Đến Da Dầu',
      mainIngredients: [
        { name: '3 loại Ceramides (1, 3, 6-II)', benefit: 'thiết yếu giúp khôi phục hàng rào độ ẩm da.' },
        { name: 'Hyaluronic Acid', benefit: 'giúp duy trì độ ẩm tự nhiên của da.' },
        { name: 'Niacinamide', benefit: 'giúp làm dịu, nuôi dưỡng, cũng cố hàng rào da.' },
      ],
      fullIngredients: 'Purified Water (Aqua), Cocamidopropyl Hydroxysultaine, Glycerin, Sodium Lauroyl Sarcosinate, Peg-150 Pentaerythrityl Tetrastearate (And) Peg-6 Caprylic/Capric Glycerides, Niacinamide, Propylene Glycol, Sodium Methyl Cocoyl Taurate, Ceramide 3, Ceramide 6-II, Ceramide 1, Hyaluronic Acid, Cholesterol, Sodium Chloride, Phytosphingosine, Citric Acid, Edetate Disodium Dihydrate, Sodium Lauroyl Lactylate, Methylparaben, Propylparaben, Carbomer, Xanthan Gum.',
    },
    {
      title: '2. Sữa Rửa Mặt Cerave Cho Da Thường Đến Khô',
      mainIngredients: [
        { name: '3 loại Ceramides (1, 3, 6-II)', benefit: 'thiết yếu giúp khôi phục hàng rào độ ẩm da.' },
        { name: 'Công nghệ MVE độc quyền', benefit: 'khoá ẩm cho da suốt 24 giờ.' },
        { name: 'Hyaluronic Acid', benefit: 'giúp duy trì độ ẩm tự nhiên của da.' },
      ],
      fullIngredients: 'Purified Water, Glycerin, Behentrimonium Methosulfate, Cetearyl Alcohol, Ceramide 3, Ceramide 6-II, Ceramide 1, Hyaluronic Acid, Cholesterol, Polyoxyl 40 Stearate, Glyceryl Monostearate, Polysorbate 20, Potassium Phosphate, Dipotassium Phosphate, Sodium Lauroyl Lactylate, Cetyl Alcohol, Disodium Edta, Phytosphingosine, Methylparaben, Propylparaben, Carbomer, Xanthan Gum.',
    },
  ],
  usage: [
    'Làm ướt da.',
    'Mát xa sữa rửa mặt theo chuyển động tròn.',
    'Nhẹ nhàng rửa sạch lại với nước.',
  ],
  reviews: [
    { id: 1, author: 'Nguyễn Thị A', rating: 5, date: '15/03/2026', content: 'Sản phẩm rất tốt, da sạch mà không bị khô. Mình dùng đã 3 tháng rồi rất hài lòng!', verified: true },
    { id: 2, author: 'Trần Văn B', rating: 5, date: '10/03/2026', content: 'Da dầu mà dùng em này thích lắm, rửa sạch nhưng không tight da. Recommend cho ai da dầu nhé!', verified: true },
    { id: 3, author: 'Lê Thị C', rating: 4, date: '05/03/2026', content: 'Dùng tốt, bọt mịn, không gây kích ứng. Giao hàng nhanh.', verified: true },
    { id: 4, author: 'Phạm Văn D', rating: 5, date: '01/03/2026', content: 'Mình đã dùng sữa rửa mặt này được 6 tháng. Da cải thiện rõ rệt, ít mụn hơn, lỗ chân lông se lại. Rất đáng mua!', verified: true },
    { id: 5, author: 'Hoàng Thị E', rating: 5, date: '28/02/2026', content: 'Sản phẩm xịn, có tem chính hãng. Dùng xong da mềm mịn, không khô căng. 10 điểm!' },
    { id: 6, author: 'Vũ Minh F', rating: 4, date: '20/02/2026', content: 'Gel rửa mặt dịu nhẹ, bọt mịn. Chỉ tiếc là không có mùi thơm gì.' },
  ],
  questions: [
    { id: 1, author: 'Hùng Xuân', date: '2026-03-18, 17:08', content: 'ff', likes: 0, replies: [
      { id: 1, author: 'YukiMart', isStore: true, date: '2026-03-18, 19:43', content: 'Cảm ơn bạn đã liên hệ đến YukiMart! Bạn đang cần hỗ trợ về vấn đề gì ạ?', likes: 0 },
    ] },
    { id: 2, author: 'Hùng Xuân', date: '2026-03-17, 17:08', content: 'Xem hdsd ở đâu nhỉ', likes: 1, replies: [
      { id: 2, author: 'Hùng Xuân', isStore: false, date: '2026-03-17, 17:09', content: 'em không thấy', likes: 0 },
      { id: 3, author: 'YukiMart', isStore: true, date: '2026-03-17, 18:00', content: 'Dạ bạn có thể xem HDSD ở phần tab bên trên ạ. Nếu không thấy bạn kéo xuống phần "HDSD" nhé!', likes: 1 },
    ] },
    { id: 3, author: 'Phạm Khả Nhật Tân', date: '2026-03-15, 08:25', content: 'Lúc đặt hàng thấy được tặng chai 30ml, mà hàng về không thấy đâu', likes: 0, replies: [
      { id: 4, author: 'YukiMart', isStore: true, date: '2026-03-15, 15:11', content: 'Dạ bạn chat inbox cho YukiMart xin thông tin đơn hàng hoặc SDT liên quan để kiểm tra hoặc liên hệ hotline 0933738798 để được hỗ trợ giải đáp nhé. Cảm ơn bạn đã tin tưởng và mua sắm tại YukiMart!', likes: 0 },
    ] },
    { id: 4, author: 'Phương Võ', date: '2026-03-14, 11:41', content: 'Để 330k từ 10h 10h vô 363k nhân viên báo hết deal =)))))', likes: 0, replies: [
      { id: 5, author: 'YukiMart', isStore: true, date: '2026-03-14, 15:32', content: 'Dạ Deal sẽ có giới hạn số lượng thôi ạ, nếu Deal hết hệ thống sẽ quay lại giá ban đầu hoặc chuyển sang 1 deal mới mong bạn thông cảm và có thể theo dõi sản phẩm với deal mới trên web/app YukiMart ạ', likes: 0 },
    ] },
    { id: 5, author: 'ĐỖ THỊ THU HƯƠNG', date: '2026-03-14, 11:20', content: 'mình mới đặt hàng ngày 14/03/2026 sữa rửa mặt CeraVe cho da dầu 473ml giá 332k, ko biết date như thế nào ah', likes: 0, replies: [
      { id: 6, author: 'YukiMart', isStore: true, date: '2026-03-14, 15:32', content: 'Dạ chào bạn, bạn nhắn vào mục "Chat với chúng tôi" cho YukiMart xin thêm thông tin mua hàng để kiểm tra chính xác nhất cho bạn nhé', likes: 0 },
    ] },
  ],
}

// ── Sản phẩm xem cùng ──
export const relatedProducts: RelatedProduct[] = [
  { id: 10, name: 'Gel Rửa Mặt Cosrx Low pH Good Morning Gel Cleanser 150ml', slug: 'cosrx-low-ph', brand: 'Cosrx', image: dealSenka, originalPrice: 269000, salePrice: 129000, discount: 37 },
  { id: 11, name: 'Sữa Rửa Mặt Cetaphil Gentle Skin Cleanser 500ml', slug: 'cetaphil-gentle', brand: 'Cetaphil', image: dealMelano, originalPrice: 433000, salePrice: 327000, discount: 24 },
  { id: 12, name: 'Sữa Rửa Mặt Cetaphil Gentle Skin Cleanser 250ml', slug: 'cetaphil-gentle-250', brand: 'Cetaphil', image: dealMatNa, originalPrice: 455000, salePrice: 320000, discount: 30 },
  { id: 13, name: 'Gel Rửa Mặt SVR Sebiaclear Gel Moussant 200ml', slug: 'svr-sebiaclear', brand: 'SVR', image: dealCheKhuyetDiem, originalPrice: 645000, salePrice: 376000, discount: 25 },
  { id: 14, name: 'La Roche-Posay Effaclar Purifying Foaming Gel 200ml', slug: 'laroche-effaclar', brand: 'La Roche-Posay', image: dealMascara, originalPrice: 655000, salePrice: 499000, discount: 29 },
]

// ── Sản phẩm cùng thương hiệu ──
export const sameBrandProducts: RelatedProduct[] = [
  { id: 20, name: 'Sữa Rửa Mặt CeraVe Hydrating Cleanser 236ml', slug: 'cerave-hydrating', brand: 'CeraVe', image: dealSon, originalPrice: 310000, salePrice: 282000, discount: 10 },
  { id: 21, name: 'Sữa Rửa Mặt CeraVe Hydrating Cleanser 473ml', slug: 'cerave-hydrating-473', brand: 'CeraVe', image: dealMelano, originalPrice: 470000, salePrice: 363000, discount: 23 },
  { id: 22, name: 'Sữa Rửa Mặt CeraVe Foaming Cleanser 236ml', slug: 'cerave-foaming-236', brand: 'CeraVe', image: dealSenka, originalPrice: 300000, salePrice: 152000, discount: 16 },
  { id: 23, name: 'CeraVe Hydrating Cream-to-Foam Cleanser 236ml', slug: 'cerave-cream-foam', brand: 'CeraVe', image: dealMatNa, originalPrice: 390000, salePrice: 265000, discount: 20 },
  { id: 24, name: 'CeraVe Kem Dưỡng Ẩm Moisturising Cream 340g', slug: 'cerave-moisturising', brand: 'CeraVe', image: dealCheKhuyetDiem, originalPrice: 460000, salePrice: 152000, discount: 16 },
]

// ── Lookup: Lấy ProductDetail theo ID ──
export function getProductDetailById(id: number): ProductDetail {
  // ID 1 = mock CeraVe đầy đủ
  if (id === 1) return mockProductDetail

  // Tìm trong tất cả HomeProduct
  const allProducts = getAllHomeProducts()
  const found = allProducts.find(p => p.id === id)

  if (found) return generateDetailFromHomeProduct(found)

  // Fallback: trả về CeraVe mock
  return mockProductDetail
}

// ── Lấy related products cho 1 product (cùng category, trừ chính nó) ──
export function getRelatedProductsFor(id: number): RelatedProduct[] {
  const allProducts = getAllHomeProducts()
  const current = allProducts.find(p => p.id === id)
  if (!current) return relatedProducts

  const sameCategory = allProducts
    .filter(p => p.id !== id && p.category === current.category)
    .slice(0, 5)
    .map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      brand: p.brand,
      image: p.image,
      originalPrice: p.originalPrice,
      salePrice: p.salePrice,
      discount: p.discount,
    }))

  if (sameCategory.length > 0) return sameCategory
  return relatedProducts
}

// ── Lấy sản phẩm cùng thương hiệu ──
export function getSameBrandProductsFor(id: number): RelatedProduct[] {
  const allProducts = getAllHomeProducts()
  const current = allProducts.find(p => p.id === id)
  if (!current) return sameBrandProducts

  const sameBrand = allProducts
    .filter(p => p.id !== id && p.brand === current.brand)
    .slice(0, 5)
    .map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      brand: p.brand,
      image: p.image,
      originalPrice: p.originalPrice,
      salePrice: p.salePrice,
      discount: p.discount,
    }))

  if (sameBrand.length > 0) return sameBrand
  return sameBrandProducts
}

