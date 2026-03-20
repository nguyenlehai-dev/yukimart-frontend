<script setup lang="ts">
import type { ProductDetail, RelatedProduct } from '../models/Product'
import { formatPrice } from '../configs'

const props = defineProps<{
  product: ProductDetail
  relatedProducts: RelatedProduct[]
  sameBrandProducts: RelatedProduct[]
}>()
</script>

<template>
  <aside class="ym-pdp-sidebar">
    <!-- Shipping policy -->
    <div class="ym-pdp-sidebar__box ym-pdp-sidebar__policy">
      <h3 class="ym-pdp-sidebar__policy-header">
        <i class="ri-truck-fill"></i> MIỄN PHÍ VẬN CHUYỂN
      </h3>
      <ul class="ym-pdp-sidebar__policy-list">
        <li>
          <i class="ri-time-fill ym-pdp-sidebar__policy-icon ym-pdp-sidebar__policy-icon--green"></i>
          <div>
            <strong>Giao Nhanh Miễn Phí 2H.</strong>
            <span>Trẻ tặng 100K</span>
          </div>
        </li>
        <li>
          <i class="ri-shield-check-fill ym-pdp-sidebar__policy-icon ym-pdp-sidebar__policy-icon--green"></i>
          <div>
            <strong>Hasaki đền bù 100%</strong> hàng đền bù 100% nếu phát hiện hàng giả
          </div>
        </li>
        <li>
          <i class="ri-truck-line ym-pdp-sidebar__policy-icon ym-pdp-sidebar__policy-icon--blue"></i>
          <div>
            <strong>Giao Hàng Miễn Phí</strong> (từ 90K tại 60 Tỉnh Thành trừ huyện, toàn Quốc từ 249K)
          </div>
        </li>
        <li>
          <i class="ri-arrow-go-back-fill ym-pdp-sidebar__policy-icon ym-pdp-sidebar__policy-icon--orange"></i>
          <div>
            <strong>Đổi trả</strong> trong <strong>30 ngày</strong>
          </div>
        </li>
      </ul>
      <a href="#" class="ym-pdp-sidebar__policy-more">Xem thêm</a>
    </div>

    <!-- Brand box -->
    <div class="ym-pdp-sidebar__box ym-pdp-sidebar__brand-box">
      <div class="ym-pdp-sidebar__brand-header">
        <div class="ym-pdp-sidebar__brand-logo">{{ product.brand }}</div>
        <button class="ym-pdp-sidebar__brand-follow">Theo dõi +</button>
      </div>
    </div>

    <!-- Related products -->
    <div class="ym-pdp-sidebar__box">
      <h3 class="ym-pdp-sidebar__title">Sản phẩm xem cùng</h3>
      <div class="ym-pdp-sidebar__products">
        <RouterLink
          v-for="p in relatedProducts"
          :key="p.id"
          :to="`/products/${p.id}`"
          class="ym-pdp-sidebar__product-item"
        >
          <div class="ym-pdp-sidebar__product-img-wrap">
            <img :src="p.image" :alt="p.name" class="ym-pdp-sidebar__product-img" />
            <span v-if="p.discount" class="ym-pdp-sidebar__product-badge">-{{ p.discount }}%</span>
          </div>
          <div class="ym-pdp-sidebar__product-info">
            <span class="ym-pdp-sidebar__product-price">{{ formatPrice(p.salePrice) }}</span>
            <span class="ym-pdp-sidebar__product-old-price">{{ formatPrice(p.originalPrice) }}</span>
            <span class="ym-pdp-sidebar__product-brand">{{ p.brand }}</span>
            <span class="ym-pdp-sidebar__product-name">{{ p.name }}</span>
          </div>
        </RouterLink>
      </div>
    </div>

    <!-- Same brand products -->
    <div class="ym-pdp-sidebar__box">
      <h3 class="ym-pdp-sidebar__title">Sản phẩm cùng thương hiệu</h3>
      <div class="ym-pdp-sidebar__products">
        <RouterLink
          v-for="p in sameBrandProducts"
          :key="p.id"
          :to="`/products/${p.id}`"
          class="ym-pdp-sidebar__product-item"
        >
          <div class="ym-pdp-sidebar__product-img-wrap">
            <img :src="p.image" :alt="p.name" class="ym-pdp-sidebar__product-img" />
            <span v-if="p.discount" class="ym-pdp-sidebar__product-badge">-{{ p.discount }}%</span>
          </div>
          <div class="ym-pdp-sidebar__product-info">
            <span class="ym-pdp-sidebar__product-price">{{ formatPrice(p.salePrice) }}</span>
            <span class="ym-pdp-sidebar__product-old-price">{{ formatPrice(p.originalPrice) }}</span>
            <span class="ym-pdp-sidebar__product-brand">{{ p.brand }}</span>
            <span class="ym-pdp-sidebar__product-name">{{ p.name }}</span>
          </div>
        </RouterLink>
      </div>
    </div>
  </aside>
</template>
