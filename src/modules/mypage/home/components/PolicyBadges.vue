<script setup lang="ts">
import { policyIcons } from '../configs'
</script>

<template>
  <div class="ym-policy-badges">
    <h3 class="ym-policy-badges__title">Chất lượng cho tất cả</h3>

    <!-- Policy icons in 2x2 grid -->
    <div class="ym-policy-badges__icons">
      <div v-for="item in policyIcons" :key="item.id" class="ym-policy-badges__icon-item">
        <img :src="item.image" :alt="item.label" class="ym-policy-badges__icon-img" />
        <div class="ym-policy-badges__icon-text">
          <strong>{{ item.label }}</strong>
          <span>{{ item.sub }}</span>
        </div>
      </div>
    </div>

    <!-- Hotline -->
    <div class="ym-policy-badges__hotline">
      <div>Dịch vụ CSKH chu đáo</div>
      <a href="tel:1900636900">
        <i class="ri-phone-fill"></i> Hotline: 1900 636 900
      </a>
    </div>
  </div>
</template>
