<script setup lang="ts">
import type { Product } from '../configs'
import { formatPrice, getBrandLogo } from '../configs'
import { useProductPricing } from '@/composables/useProductPricing'

const props = defineProps<{
  product: Product
}>()

const { displayPrice, crossedOutPrice, roleBadge } = useProductPricing(props.product)
</script>

<template>
  <RouterLink :to="`/products/${product.id}`" class="ym-product-card">
    <div class="ym-product-card__image-wrapper">
      <img :src="product.image" :alt="product.name" class="ym-product-card__image" />
      <span v-if="product.discount" class="ym-product-card__badge">-{{ product.discount }}%</span>
      <span v-if="roleBadge" class="ym-product-card__role-badge" :class="roleBadge.class">
        {{ roleBadge.text }}
      </span>
    </div>
    <div class="ym-product-card__body">
      <span class="ym-product-card__category">{{ product.category }}</span>
      <h4 class="ym-product-card__name" :title="product.name">{{ product.name }}</h4>
      <div class="ym-product-card__brand">
        <img
          v-if="getBrandLogo(product.brand)"
          :src="getBrandLogo(product.brand)"
          :alt="product.brand"
          class="ym-product-card__brand-logo"
        />
        <span v-else>{{ product.brand }}</span>
      </div>
      <div class="ym-product-card__pricing">
        <span v-if="crossedOutPrice > 0" class="ym-product-card__price-old">
          {{ formatPrice(crossedOutPrice) }}
        </span>
        <span class="ym-product-card__price-sale">{{ formatPrice(displayPrice) }}</span>
      </div>
    </div>
  </RouterLink>
</template>
