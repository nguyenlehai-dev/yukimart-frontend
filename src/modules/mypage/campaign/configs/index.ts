// ── Campaign banner images ──
import banner1 from '@/assets/images/products/deal/campaign/18-3-deal-ngap-tran-san-ngan-qua-hot-640x240-1773739669.jpg'
import banner2 from '@/assets/images/products/deal/campaign/640x240-1773226149.jpg'
import banner3 from '@/assets/images/products/deal/campaign/1773051432747-640x240-1773051511.jpg'
import banner4 from '@/assets/images/products/deal/campaign/640x240-1773626638.jpg'
import banner5 from '@/assets/images/products/deal/campaign/Duocmypham640x2401685443000.jpg'
import banner6 from '@/assets/images/products/deal/campaign/640x240mobile-1773806203.jpg'
import banner7 from '@/assets/images/products/deal/campaign/UnileverSIScovermobile640x2401700822403.png'
import banner8 from '@/assets/images/products/deal/campaign/640-wap1687329460.jpg'

export interface CampaignBanner {
  id: number
  image: string
  title: string
  link: string
}

export const campaignBanners: CampaignBanner[] = [
  {
    id: 1,
    image: banner1,
    title: '18.3 Deal Ngập Tràn - Săn Ngàn Quà Hot',
    link: '#',
  },
  {
    id: 2,
    image: banner2,
    title: 'Khai trương chi nhánh 305, 306 - Chợ Mới, Long Xuyên, An Giang',
    link: '#',
  },
  {
    id: 3,
    image: banner3,
    title: 'Khai trương chi nhánh 307, 308 - Long An, Tây Ninh, TPHCM',
    link: '#',
  },
  {
    id: 4,
    image: banner4,
    title: 'Dược Mỹ Phẩm - Giải Pháp Cho Mọi Làn Da',
    link: '#',
  },
  {
    id: 5,
    image: banner5,
    title: 'Dược Mỹ Phẩm Chính Hãng - Giải Quyết Mọi Vấn Đề Của Làn Da',
    link: '#',
  },
  {
    id: 6,
    image: banner6,
    title: 'Đơn 99K Mua Giá Sốc',
    link: '#',
  },
  {
    id: 7,
    image: banner7,
    title: 'Unilever Nâng Niu Nét Đẹp Toàn Diện',
    link: '#',
  },
  {
    id: 8,
    image: banner8,
    title: 'Combo Tiết Kiệm - Mua 1 Tặng 1',
    link: '#',
  },
]
