// Home module mock data configuration
import menuCategoryImage from '@/assets/images/products/menu-category-home-cham-soc-da-mat-210x400---27122024.png'

// ── Slide banners ──
import slide1 from '@/assets/images/header/650x440_copy_1.jpg'
import slide2 from '@/assets/images/header/app_2019-01-08_2.jpg'
import slide3 from '@/assets/images/header/hasaki_homepage_650x400.jpg'

// ── Side banners ──
import sideBanner1 from '@/assets/images/header/fit_me_2.jpg'
import sideBanner2 from '@/assets/images/header/cetaphi_vuong.jpg'

// ── Policy icons ──
import policyIcon1 from '@/assets/images/header/icon/1.jpg'
import policyIcon2 from '@/assets/images/header/icon/2.jpg'
import policyIcon3 from '@/assets/images/header/icon/3.jpg'
import policyIcon4 from '@/assets/images/header/icon/img_quality_1.jpg'

// ── Deal product images ──
import dealSon from '@/assets/images/products/deal/son-li-maybelline-chilli-nude-3-9g-650x580.jpg'
import dealMelano from '@/assets/images/products/deal/57-34.jpg'
import dealSenka from '@/assets/images/products/deal/gel-sua-chong-nang-spf50-senka-80g.jpg'
import dealMatNa from '@/assets/images/products/deal/mat-na-duong-san-chac-da-banobagi-vita-genic-jelly-mask-30ml.jpg'
import dealCheKhuyetDiem from '@/assets/images/products/deal/che-khuyet-diem-130-medium-6ml-5.jpg'
import dealMascara from '@/assets/images/products/deal/tải-xuống-2.jpg'

// ── Trademark logos ──
import logoLoreal from '@/assets/images/trademark/1505115115loreal-paris-logo_img_150x75_766519_fit_center.jpg'
import logoLaroche from '@/assets/images/trademark/1544069586laroche-posay_img_150x75_766519_fit_center.jpg'
import logoCetaphil from '@/assets/images/trademark/1467278639logo_cetaphil_img_150x75_766519_fit_center.jpg'
import logoEucerin from '@/assets/images/trademark/1473823224eucerin-logo_img_150x75_766519_fit_center.jpg'
import logoMaybelline from '@/assets/images/trademark/1505115725maybelline-logo_img_150x75_766519_fit_center.jpg'
import logoVichy from '@/assets/images/trademark/1544069455vichy-new_img_150x75_766519_fit_center.jpg'
import logoMerrirs from '@/assets/images/trademark/1515400908MERRIRS_img_150x75_766519_fit_center.jpg'
import logoMoony from '@/assets/images/trademark/1515401178moony_img_150x75_766519_fit_center.jpg'

// ── Skincare / category product images ──
import skincarePromo from '@/assets/images/products/skincare/220-x-350.jpg'
import skincareSon from '@/assets/images/products/skincare/son-li-maybelline-chilli-nude-3-9g-650x580.jpg'
import skincareSenka from '@/assets/images/products/skincare/gel-sua-chong-nang-spf50-senka-80g.jpg'
import skincareMelano from '@/assets/images/products/skincare/57-34.jpg'
import skincareOmg from '@/assets/images/products/skincare/omg-desktop_4.jpg'
import skincareLopNen from '@/assets/images/products/skincare/5_lopneni_366x200_1.jpg'
import skincareArtboard from '@/assets/images/products/skincare/artboard_5_copy.jpg'
import skincareBannerPromo from '@/assets/images/products/skincare/banner-b_n-h_ng_220x350.jpg'
import skincareDownload from '@/assets/images/products/skincare/tải-xuống-2.jpg'
import skincareImages from '@/assets/images/products/skincare/images.jpg'

// ── Brand logos ──
import logoCetaphilBrand from '@/assets/images/logo/1467278639logo_cetaphil_img_120x60_63ea52_fit_center.jpg'
import logoAgapan from '@/assets/images/logo/1471419239agapan-logo_img_120x60_63ea52_fit_center.jpg'
import logoArgussy from '@/assets/images/logo/1476268841argussy_logo_img_120x60_63ea52_fit_center.png'
import logo3wClinic from '@/assets/images/logo/14963736243w-clinic-logo_img_120x60_63ea52_fit_center.png'
import logoDeborah from '@/assets/images/logo/1506650932deborahmilano_img_120x60_63ea52_fit_center.jpg'
import logoAleda from '@/assets/images/logo/1538456535ALEDA_img_120x60_63ea52_fit_center.jpg'

export const brandLogoMap: Record<string, string> = {
  'Cetaphil': logoCetaphilBrand,
  'AGAPAN': logoAgapan,
  'Agapan': logoAgapan,
  'ARGUSSY': logoArgussy,
  'Argussy': logoArgussy,
  '3W Clinic': logo3wClinic,
  '3W CLINIC': logo3wClinic,
  'DEBORAH': logoDeborah,
  'Deborah': logoDeborah,
  'ALEDA': logoAleda,
  'Aleda': logoAleda,
}

export function getBrandLogo(brand: string): string | undefined {
  return brandLogoMap[brand]
}

export interface Banner {
  id: number
  image: string
  title: string
  link: string
}

export interface Product {
  id: number
  name: string
  slug: string
  category: string
  brand: string
  brandLogo?: string
  image: string
  originalPrice: number   // giá gốc (admin thấy)
  salePrice: number       // giá khách lẻ
  wholesalePrice: number  // giá khách sỉ
  discount: number
  stock: number
}

export interface Brand {
  id: number
  name: string
  logo: string
}

export interface CategorySectionData {
  id: string
  title: string
  color: string
  promoImage?: string
  banners: { image: string; title: string; subtitle: string; link: string }[]
  subTabs: string[]
  tags: string[]
  products: Product[]
}

export interface SubColumn {
  title: string
  items: string[]
}

export interface CategoryMenu {
  id: number
  name: string
  icon: string
  link: string
  submenu?: {
    columns: SubColumn[]
    image?: string
  }
}

// ──── Menu danh mục ────
export const categoryMenuItems: CategoryMenu[] = [
  {
    id: 1, name: 'Sức khỏe & Làm đẹp', icon: '', link: '/products?cat=suc-khoe',
    submenu: {
      columns: [
        { title: 'Chăm Sóc Sức Khỏe', items: ['Vitamin & Khoáng chất', 'Thực phẩm chức năng', 'Dụng cụ y tế', 'Sản phẩm hỗ trợ'] },
        { title: 'Làm Đẹp', items: ['Chăm sóc da', 'Chăm sóc tóc', 'Trang điểm', 'Nước hoa'] },
      ],
      image: menuCategoryImage,
    }
  },
  {
    id: 2, name: 'Chăm sóc da mặt', icon: '', link: '/products?cat=cham-soc-da',
    submenu: {
      columns: [
        { title: 'Làm Sạch Da', items: ['Tẩy Trang Mặt', 'Sữa Rửa Mặt', 'Tẩy Tế Bào Chết Da Mặt', 'Toner / Nước Cân Bằng Da'] },
        { title: 'Đặc Trị', items: ['Serum / Tinh Chất', 'Hỗ Trợ Trị Mụn', 'Sản Phẩm Đặc Trị Khác'] },
        { title: 'Dưỡng Ẩm', items: ['Xịt Khoáng', 'Lotion / Sữa Dưỡng', 'Kem / Gel / Dầu Dưỡng'] },
        { title: 'Bộ Chăm Sóc Da Mặt', items: ['Chống Nắng Da Mặt', 'Dưỡng Mắt', 'Dưỡng Môi', 'Mặt Nạ'] },
        { title: 'Vấn Đề Về Da', items: ['Da Dầu / Lỗ Chân Lông To', 'Da Khô / Mất Nước', 'Da Lão Hóa', 'Da Mụn', 'Thâm / Nám / Tàn Nhang'] },
        { title: 'Dụng Cụ / Phụ Kiện', items: ['Bông Tẩy Trang', 'Dụng Cụ / Máy Rửa Mặt', 'Máy Chăm Sóc Da'] },
      ],
      image: menuCategoryImage,
    }
  },
  {
    id: 3, name: 'Trang điểm', icon: '', link: '/products?cat=trang-diem',
    submenu: {
      columns: [
        { title: 'Trang Điểm Môi', items: ['Son môi', 'Son kem', 'Son dưỡng', 'Son bóng'] },
        { title: 'Trang Điểm Mặt', items: ['Kem nền', 'Phấn phủ', 'Cushion', 'Che khuyết điểm', 'Kem lót'] },
        { title: 'Trang Điểm Mắt', items: ['Mascara', 'Kẻ mắt', 'Phấn mắt', 'Kẻ chân mày'] },
      ],
      image: menuCategoryImage,
    }
  },
  {
    id: 4, name: 'Chăm sóc cơ thể', icon: '', link: '/products?cat=co-the',
    submenu: {
      columns: [
        { title: 'Sữa Tắm', items: ['Sữa tắm dưỡng ẩm', 'Sữa tắm trắng da', 'Xà bông tắm'] },
        { title: 'Dưỡng Thể', items: ['Kem dưỡng thể', 'Lotion dưỡng thể', 'Dầu dưỡng thể'] },
        { title: 'Khử Mùi', items: ['Lăn khử mùi', 'Xịt khử mùi'] },
      ],
      image: menuCategoryImage,
    }
  },
  {
    id: 5, name: 'Chăm sóc tóc', icon: '', link: '/products?cat=toc',
    submenu: {
      columns: [
        { title: 'Dầu Gội', items: ['Dầu gội trị gàu', 'Dầu gội dưỡng tóc', 'Dầu gội phục hồi'] },
        { title: 'Dầu Xả & Ủ Tóc', items: ['Dầu xả', 'Ủ tóc', 'Serum dưỡng tóc'] },
      ],
      image: menuCategoryImage,
    }
  },
  {
    id: 6, name: 'Nước hoa', icon: '', link: '/products?cat=nuoc-hoa',
    submenu: {
      columns: [
        { title: 'Nước Hoa Nam', items: ['Nước hoa EDP', 'Nước hoa EDT', 'Nước hoa mini'] },
        { title: 'Nước Hoa Nữ', items: ['Nước hoa EDP', 'Nước hoa EDT', 'Set quà tặng'] },
      ],
      image: menuCategoryImage,
    }
  },
  {
    id: 7, name: 'Thực phẩm chức năng', icon: '', link: '/products?cat=thuc-pham',
    submenu: {
      columns: [
        { title: 'Vitamin & Khoáng Chất', items: ['Vitamin C', 'Vitamin E', 'Canxi', 'Sắt'] },
        { title: 'Hỗ Trợ Sức Khỏe', items: ['Hỗ trợ tiêu hóa', 'Hỗ trợ giảm cân', 'Bổ sung collagen'] },
      ],
      image: menuCategoryImage,
    }
  },
  { id: 8, name: 'Đồ dùng cá nhân', icon: '', link: '/products?cat=ca-nhan' },
  { id: 9, name: 'Mẹ & Bé', icon: '', link: '/products?cat=me-be' },
  { id: 10, name: 'Thiết bị làm đẹp', icon: '', link: '/products?cat=thiet-bi' },
]

// ──── Banners chính ────
export const heroBanners: Banner[] = [
  { id: 1, image: slide1, title: 'Khuyến mãi mùa hè', link: '/products' },
  { id: 2, image: slide2, title: 'Deal hot cuối tuần', link: '/products' },
  { id: 3, image: slide3, title: 'Sản phẩm mới nhất', link: '/products' },
]

// ──── Side banners (bên phải hero) ────
export const hereSideBanners = [
  { id: 1, image: sideBanner1, link: '/products?brand=maybelline' },
  { id: 2, image: sideBanner2, link: '/products?brand=cetaphil' },
]

// ──── Policy icons ────
export const policyIcons = [
  { id: 1, image: policyIcon1, label: 'Thanh toán', sub: 'khi nhận hàng' },
  { id: 2, image: policyIcon2, label: 'Giao hàng', sub: 'dưới 120 phút' },
  { id: 3, image: policyIcon3, label: '14 ngày đổi trả', sub: 'miễn phí' },
  { id: 4, image: policyIcon4, label: 'Sản phẩm', sub: 'chính hãng' },
]

// ──── Thương hiệu nổi bật ────
export const featuredBrands: Brand[] = [
  { id: 1, name: "L'Oréal Paris", logo: logoLoreal },
  { id: 2, name: 'La Roche-Posay', logo: logoLaroche },
  { id: 3, name: 'Cetaphil', logo: logoCetaphil },
  { id: 4, name: 'Eucerin', logo: logoEucerin },
  { id: 5, name: 'Maybelline', logo: logoMaybelline },
  { id: 6, name: 'Vichy', logo: logoVichy },
  { id: 7, name: 'Merrirs', logo: logoMerrirs },
  { id: 8, name: 'Moony', logo: logoMoony },
]

// ──── Helper: format giá VNĐ ────
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('vi-VN').format(price) + 'đ'
}

// ──── Sản phẩm deal hot ────
export const hotDealProducts: Product[] = [
  {
    id: 1, name: 'Son Lì Maybelline Color Sensational Inti-Matte', slug: 'son-maybelline',
    category: 'TRANG ĐIỂM', brand: 'Maybelline', image: dealSon,
    originalPrice: 119000, salePrice: 100000, wholesalePrice: 65000, discount: 16, stock: 50,
  },
  {
    id: 2, name: 'Tinh Chất Melano CC Mờ Thâm, Nám Tàn Nhang', slug: 'tinh-chat-melano',
    category: 'CHĂM SÓC DA MẶT', brand: '3W Clinic', image: dealMelano,
    originalPrice: 300000, salePrice: 259000, wholesalePrice: 168000, discount: 14, stock: 30,
  },
  {
    id: 3, name: 'Gel Sữa Chống Nắng Senka SPF50/PA++++', slug: 'chong-nang-senka',
    category: 'CHĂM SÓC DA MẶT', brand: 'Senka', image: dealSenka,
    originalPrice: 86000, salePrice: 25000, wholesalePrice: 16000, discount: 31, stock: 100,
  },
  {
    id: 4, name: 'Mặt Nạ Dưỡng Săn Chắc Da Banobagi Vita Genic', slug: 'mat-na-banobagi',
    category: 'CHĂM SÓC DA MẶT', brand: 'Banobagi', image: dealMatNa,
    originalPrice: 163000, salePrice: 130000, wholesalePrice: 85000, discount: 20, stock: 45,
  },
  {
    id: 5, name: 'Che Khuyết Điểm Maybelline Fit Me 130 Medium', slug: 'che-khuyet-diem',
    category: 'TRANG ĐIỂM', brand: 'Maybelline', image: dealCheKhuyetDiem,
    originalPrice: 163000, salePrice: 130000, wholesalePrice: 85000, discount: 20, stock: 60,
  },
  {
    id: 6, name: 'Mascara Làm Dày Và Tơi Mi Maybelline Lash', slug: 'mascara-maybelline',
    category: 'TRANG ĐIỂM', brand: 'Maybelline', image: dealMascara,
    originalPrice: 260000, salePrice: 250000, wholesalePrice: 163000, discount: 15, stock: 80,
  },
]

// ──── Category sections ────
export const categorySections: CategorySectionData[] = [
  {
    id: 'trang-diem',
    title: 'TRANG ĐIỂM',
    color: '#e91e63',
    promoImage: skincarePromo,
    banners: [
      { image: skincareOmg, title: 'RA MẮT ĐẦU TIÊN', subtitle: 'Son SILKYGIRL OMG!', link: '#' },
      { image: skincareLopNen, title: 'LỚP NỀN CĂNG MƯỚT', subtitle: 'Mã Ưng Hồng Xinh', link: '#' },
      { image: skincareArtboard, title: 'LỚP NỀN MỊN LÌ', subtitle: 'Đa mín từ nhiên', link: '#' },
    ],
    subTabs: ['Trang điểm môi', 'Tẩy trang', 'Trang điểm vùng mắt', 'Trang điểm mặt'],
    tags: ['Son môi', 'Cushion', 'Phấn phủ', 'Kem nền', 'Che khuyết điểm'],
    products: [
      { id: 101, name: 'Son Lì Maybelline Chilli Nude 3.9g', slug: 'son-chilli', category: 'TRANG ĐIỂM', brand: '3W Clinic', image: skincareSon, originalPrice: 119000, salePrice: 100000, wholesalePrice: 65000, discount: 16, stock: 50 },
      { id: 102, name: 'Gel Sữa Chống Nắng Senka SPF50/PA++++ 80g', slug: 'senka-uv', category: 'CHĂM SÓC DA MẶT', brand: 'ALEDA', image: skincareSenka, originalPrice: 86000, salePrice: 25000, wholesalePrice: 16000, discount: 31, stock: 100 },
      { id: 103, name: 'Tinh Chất Melano CC Mờ Thâm 20ml Serum Vitamin C', slug: 'melano-cc', category: 'CHĂM SÓC DA MẶT', brand: 'Cetaphil', image: skincareMelano, originalPrice: 300000, salePrice: 259000, wholesalePrice: 168000, discount: 14, stock: 30 },
      { id: 104, name: 'Mặt Nạ Melano CC Dưỡng Sáng Da 20 Miếng', slug: 'melano-mask', category: 'CLINIC & SPA', brand: '3W Clinic', image: skincareImages, originalPrice: 163000, salePrice: 130000, wholesalePrice: 85000, discount: 20, stock: 55 },
      { id: 105, name: 'Nước Tẩy Trang Tươi Mặt L’Oreal 3-in-1 400ml', slug: 'loreal-tay-trang', category: 'CHĂM SÓC DA MẶT', brand: 'ARGUSSY', image: skincareDownload, originalPrice: 149000, salePrice: 96000, wholesalePrice: 62000, discount: 36, stock: 40 },
    ],
  },
  {
    id: 'cham-soc-da',
    title: 'CHĂM SÓC DA MẶT',
    color: '#2196f3',
    promoImage: skincareBannerPromo,
    banners: [
      { image: skincareOmg, title: 'VICHY', subtitle: 'Da sạch mụn chào thu', link: '#' },
      { image: skincareLopNen, title: 'LA ROCHE-POSAY', subtitle: 'Giảm & ngăn ngừa mụn', link: '#' },
      { image: skincareArtboard, title: 'LANEIGE', subtitle: 'Tỉnh giấc với làn da căng mượt', link: '#' },
    ],
    subTabs: ['Trang điểm môi', 'Tẩy trang', 'Trang điểm vùng mắt', 'Trang điểm mặt'],
    tags: ['Sữa rửa mặt', 'Nước hoa hồng', 'Nước cân bằng', 'Toner', 'Essenser', 'Tinh chất', 'Emulsion'],
    products: [
      { id: 201, name: 'Sữa Rửa Mặt Cetaphil Gentle Skin', slug: 'cetaphil-cleanser', category: 'CHĂM SÓC DA MẶT', brand: 'Cetaphil', image: skincareMelano, originalPrice: 200000, salePrice: 169000, wholesalePrice: 110000, discount: 16, stock: 70 },
      { id: 202, name: 'Nước Tẩy Trang Tươi Mặt L\'Oreal 3-in-1', slug: 'loreal-tay-trang', category: 'CHĂM SÓC DA MẶT', brand: "L'Oréal", image: skincareDownload, originalPrice: 149000, salePrice: 96000, wholesalePrice: 62000, discount: 36, stock: 90 },
      { id: 203, name: 'Nước Tẩy Trang Byphasse Cho Mọi Loại Da', slug: 'byphasse', category: 'CHĂM SÓC DA MẶT', brand: 'Byphasse', image: skincareImages, originalPrice: 191000, salePrice: 89000, wholesalePrice: 58000, discount: 53, stock: 55 },
      { id: 204, name: 'Mặt Nạ Melano CC Dưỡng Sáng Da 20 Miếng', slug: 'melano-mask', category: 'CHĂM SÓC DA MẶT', brand: '3W Clinic', image: skincareSon, originalPrice: 163000, salePrice: 130000, wholesalePrice: 85000, discount: 20, stock: 42 },
      { id: 205, name: 'Gel Sữa Chống Nắng Senka SPF50 80g', slug: 'senka-spf50', category: 'CHĂM SÓC DA MẶT', brand: 'Senka', image: skincareSenka, originalPrice: 350000, salePrice: 289000, wholesalePrice: 188000, discount: 17, stock: 35 },
    ],
  },
  {
    id: 'cham-soc-toan-than',
    title: 'CHĂM SÓC TOÀN THÂN',
    color: '#4caf50',
    promoImage: skincarePromo,
    banners: [
      { image: skincareLopNen, title: 'PURITÉ', subtitle: 'Mịt thơm nồng nàn từ nước Pháp', link: '#' },
      { image: skincareOmg, title: 'VICHY MINERAL 89', subtitle: 'Dưỡng ẩm toàn thân', link: '#' },
      { image: skincareArtboard, title: 'LANEIGE', subtitle: 'Tỉnh giấc với làn da mượt', link: '#' },
    ],
    subTabs: ['Dưỡng ẩm toàn thân', 'Sữa tắm - xà bông tắm', 'Khử mùi cơ thể', 'Tẩy tế bào chết toàn thân'],
    tags: ['Sữa tắm', 'Dưỡng thể', 'Tẩy tế bào chết', 'Dưỡng ẩm', 'Kem chống nắng'],
    products: [
      { id: 301, name: 'Sữa Tắm Dưỡng Ẩm Dove Deeply Nourishing', slug: 'dove-body', category: 'CHĂM SÓC TOÀN THÂN', brand: 'Dove', image: skincareImages, originalPrice: 120000, salePrice: 89000, wholesalePrice: 58000, discount: 26, stock: 80 },
      { id: 302, name: 'Kem Dưỡng Thể Vaseline Total Moisture', slug: 'vaseline-body', category: 'CHĂM SÓC TOÀN THÂN', brand: 'Vaseline', image: skincareSenka, originalPrice: 150000, salePrice: 119000, wholesalePrice: 77000, discount: 21, stock: 65 },
      { id: 303, name: 'Gel Tắm Trắng Da Senka Perfect Whip', slug: 'senka-whip', category: 'CHĂM SÓC TOÀN THÂN', brand: 'Senka', image: skincareMelano, originalPrice: 95000, salePrice: 72000, wholesalePrice: 47000, discount: 24, stock: 90 },
      { id: 304, name: 'Lăn Khử Mùi Nivea Dry Comfort White', slug: 'nivea-deodorant', category: 'CHĂM SÓC TOÀN THÂN', brand: 'Nivea', image: skincareSon, originalPrice: 75000, salePrice: 59000, wholesalePrice: 38000, discount: 21, stock: 100 },
      { id: 305, name: 'Tẩy Tế Bào Chết Body St.Ives Apricot', slug: 'stives-scrub', category: 'CHĂM SÓC TOÀN THÂN', brand: 'St.Ives', image: skincareDownload, originalPrice: 180000, salePrice: 139000, wholesalePrice: 90000, discount: 23, stock: 50 },
    ],
  },
  {
    id: 'clinic-spa',
    title: 'CLINIC & SPA',
    color: '#ff5722',
    promoImage: skincareBannerPromo,
    banners: [
      { image: skincareLopNen, title: 'VICHY', subtitle: 'Da sạch mụn chào thu', link: '#' },
      { image: skincareOmg, title: 'LA ROCHE-POSAY', subtitle: 'Da sạch mụn chào thu', link: '#' },
      { image: skincareArtboard, title: 'LANEIGE', subtitle: 'Tỉnh giấc với làn da căng mướt', link: '#' },
    ],
    subTabs: ['Triệt lông vĩnh viễn', 'Trị liệu toàn thân', 'Giảm béo', 'Điều trị sẹo rỗ'],
    tags: ['Triệt lông', 'Tẩy tế bào da', 'Điều trị mụn', 'Nâng cơ', 'Chăm sóc tóc', 'Giảm béo', 'Chăm sóc da mặt', 'Trị rạn nhang'],
    products: [
      { id: 401, name: 'Son Lì Maybelline Chilli Nude 3.9g Color Sensational Inti-Matte Nudes Lipstick', slug: 'son-chilli-clinic', category: 'TRANG ĐIỂM', brand: '3W CLINIC', image: skincareSon, originalPrice: 119000, salePrice: 100000, wholesalePrice: 65000, discount: 16, stock: 50 },
      { id: 402, name: 'Mặt Nạ Melano CC Dưỡng Sáng Da Hỗ Trợ Làm Mờ Thâm Nám 20 Miếng', slug: 'melano-clinic', category: 'CLINIC & SPA', brand: '3W CLINIC', image: skincareImages, originalPrice: 163000, salePrice: 130000, wholesalePrice: 85000, discount: 20, stock: 45 },
      { id: 403, name: 'Kem Nền Lì Fit Me Maybelline 100 Buff Beige 30ml Fit Me Matte + Poreless Foundation', slug: 'fitme-clinic', category: 'CHĂM SÓC DA MẶT', brand: 'ANGELA', image: dealCheKhuyetDiem, originalPrice: 163000, salePrice: 140000, wholesalePrice: 91000, discount: 14, stock: 60 },
      { id: 404, name: 'Combo 2 Son Kem Lì 2 Đầu LEMONADE Of Sugar + 05 Tea Perfect Couple Lip', slug: 'lemonade-clinic', category: 'CHĂM SÓC TÓC', brand: 'AGAPAN', image: skincareMelano, originalPrice: 163000, salePrice: 150000, wholesalePrice: 98000, discount: 8, stock: 40 },
      { id: 405, name: 'Mascara Làm Dày Và Tơi Mi Maybelline Lash Sensational 10ml Lash Sensational Waterproof Mascara', slug: 'mascara-clinic', category: 'CHĂM SÓC DA MẶT', brand: 'ALEDA', image: skincareDownload, originalPrice: 148000, salePrice: 120000, wholesalePrice: 78000, discount: 19, stock: 80 },
    ],
  },
]

// ──── Gợi ý dành riêng cho bạn ────
export const suggestedProducts: Product[] = [
  { id: 501, name: 'Son Lì Maybelline Chilli Nude 3.9g Color Sensational Inti-Matte Nudes Lipstick', slug: 'son-chilli-sug', category: 'TRANG ĐIỂM', brand: '3W CLINIC', image: skincareSon, originalPrice: 119000, salePrice: 100000, wholesalePrice: 65000, discount: 16, stock: 50 },
  { id: 502, name: 'Mặt Nạ Melano CC Dưỡng Sáng Da Hỗ Trợ Làm Mờ Thâm Nám 20 Miếng', slug: 'melano-sug', category: 'CLINIC & SPA', brand: '3W CLINIC', image: skincareImages, originalPrice: 163000, salePrice: 130000, wholesalePrice: 85000, discount: 20, stock: 45 },
  { id: 503, name: 'Kem Nền Mịn Lì Fit Me Maybelline 100 Buff Beige 30ml Fit Me Matte + Poreless Foundation', slug: 'fitme-sug', category: 'CHĂM SÓC DA MẶT', brand: 'ANGELA', image: dealCheKhuyetDiem, originalPrice: 163000, salePrice: 140000, wholesalePrice: 91000, discount: 14, stock: 60 },
  { id: 504, name: 'Combo 2 Son Kem Lì 2 Đầu LEMONADE Of Sugar + 05 Tea Perfect Couple Lip', slug: 'lemonade-sug', category: 'CHĂM SÓC TÓC', brand: 'AGAPAN', image: skincareMelano, originalPrice: 163000, salePrice: 150000, wholesalePrice: 98000, discount: 8, stock: 40 },
  { id: 505, name: 'Mascara Làm Dày Và Tơi Mi Maybelline Lash Sensational 10ml Waterproof Mascara', slug: 'mascara-sug', category: 'CHĂM SÓC DA MẶT', brand: 'ALEDA', image: skincareDownload, originalPrice: 148000, salePrice: 120000, wholesalePrice: 78000, discount: 19, stock: 80 },
  { id: 506, name: 'Kem Lót Trang Điểm Maybelline Baby Skin 22ml Baby Skin Pore Cream', slug: 'babyskin-sug', category: 'CHĂM SÓC DA MẶT', brand: 'Maybelline', image: dealMatNa, originalPrice: 299000, salePrice: 250000, wholesalePrice: 163000, discount: 21, stock: 35 },
  { id: 507, name: 'Gel Sữa Chống Nắng Senka SPF50/PA++++ 80g Perfect UV Gel', slug: 'senka-sug', category: 'CHĂM SÓC DA MẶT', brand: 'ALEDA', image: skincareSenka, originalPrice: 86000, salePrice: 25000, wholesalePrice: 16000, discount: 31, stock: 100 },
  { id: 508, name: 'Nước Tẩy Trang Tươi Mặt L\'Oreal 3-in-1 Dành Cho Da Dầu & Da Hỗn Hợp 400ml', slug: 'loreal-sug', category: 'CHĂM SÓC DA MẶT', brand: 'ARGUSSY', image: skincareDownload, originalPrice: 149000, salePrice: 96000, wholesalePrice: 62000, discount: 36, stock: 90 },
  { id: 509, name: 'Tinh Chất Melano CC Mờ Thâm Nám Tàn Nhang 20ml Serum Vitamin C', slug: 'melano2-sug', category: 'CHĂM SÓC DA MẶT', brand: 'Cetaphil', image: skincareMelano, originalPrice: 300000, salePrice: 259000, wholesalePrice: 168000, discount: 14, stock: 30 },
  { id: 510, name: 'Mặt Nạ BNBG Dưỡng Sáng Da Vitamin C Vita Genic Whitening Jelly Mask', slug: 'bnbg-sug', category: 'CHĂM SÓC DA MẶT', brand: 'BNBG', image: skincareImages, originalPrice: 43000, salePrice: 37000, wholesalePrice: 24000, discount: 14, stock: 55 },
  { id: 511, name: 'Nước Tẩy Trang Byphasse Cho Mọi Loại Da 500ml Solution Micellaire Face', slug: 'byphasse-sug', category: 'CHĂM SÓC DA MẶT', brand: 'BIODERMA', image: skincareSenka, originalPrice: 191000, salePrice: 89000, wholesalePrice: 58000, discount: 53, stock: 42 },
  { id: 512, name: 'Kem Che Khuyết Điểm Maybelline 110 Fair Anti Instant Age Rewind Eraser Dark Circles', slug: 'concealer-sug', category: 'TRANG ĐIỂM', brand: 'CARE:NEL', image: dealCheKhuyetDiem, originalPrice: 195000, salePrice: 117000, wholesalePrice: 76000, discount: 40, stock: 60 },
]

// ──── Navigation links ────
export const navLinks = [
  { label: 'DEAL HẤP DẪN', link: '/products?deal=hot', icon: '🔥', badge: 'new' },
  { label: 'THƯƠNG HIỆU', link: '/campaign/wow', icon: '' },
  { label: 'HÀNG MỚI VỀ', link: '/products?new', icon: '' },
  { label: 'SẢN PHẨM BÁN CHẠY', link: '/products?bestseller', icon: '' },
  { label: 'CLINIC & SPA', link: '/products?clinic', icon: '' },
  { label: 'TIN TỨC', link: '/news', icon: '' },
]
