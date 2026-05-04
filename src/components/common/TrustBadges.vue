<script setup lang="ts">
import trustIcon1 from '@/assets/images/header/icon/1.jpg'
import trustIcon2 from '@/assets/images/header/icon/2.jpg'
import trustIcon3 from '@/assets/images/header/icon/3.jpg'
import trustIcon4 from '@/assets/images/header/icon/img_quality_1.jpg'
</script>

<template>
  <div class="ym-trust-badges">
    <div class="container ym-trust-badges__inner">
      <ul class="ym-trust-badges__list">
        <li class="ym-trust-badges__item">
          <img :src="trustIcon1" alt="" loading="lazy" decoding="async" class="ym-trust-badges__icon" />
          <div>
            <strong>Thanh toán</strong>
            <span>khi nhận hàng</span>
          </div>
        </li>
        <li class="ym-trust-badges__item">
          <img :src="trustIcon2" alt="" loading="lazy" decoding="async" class="ym-trust-badges__icon" />
          <div>
            <strong>Giao nhanh</strong>
            <span>miễn phí 2H</span>
          </div>
        </li>
        <li class="ym-trust-badges__item">
          <img :src="trustIcon3" alt="" loading="lazy" decoding="async" class="ym-trust-badges__icon" />
          <div>
            <strong>30 ngày đổi trả</strong>
            <span>miễn phí</span>
          </div>
        </li>
        <li class="ym-trust-badges__item">
          <img :src="trustIcon4" alt="" loading="lazy" decoding="async" class="ym-trust-badges__icon" />
          <div>
            <strong>Thương hiệu</strong>
            <span>uy tín toàn cầu</span>
          </div>
        </li>
      </ul>
      <div class="ym-trust-badges__actions">
        <a href="tel:0933738798" class="ym-trust-badges__hotline" aria-label="Gọi hotline chăm sóc khách hàng">
          <i class="ri-questionnaire-line" aria-hidden="true"></i>
          <div>
            <span>HOTLINE CSKH</span>
            <strong>093 373 87 98</strong>
          </div>
        </a>
        <RouterLink to="/about" class="ym-trust-badges__store-locator" aria-label="Tìm chi nhánh YukiMart">
          <i class="ri-map-pin-line" aria-hidden="true"></i>
          <div>
            <span>TÌM CHI NHÁNH</span>
            <strong>Hệ thống YukiMart</strong>
          </div>
        </RouterLink>
      </div>
    </div>
  </div>
</template>
