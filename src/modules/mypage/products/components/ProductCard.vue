<script setup lang="ts">
import type { Product } from '../models/Product'
import { useProductFormat } from '../composables/useProductFormat'

defineProps<{
  product: Product
}>()

const { formatPrice, formatStock } = useProductFormat()
</script>

<template>
  <RouterLink :to="`/products/${product.id}`" class="card">
    <div class="card-image">
      <img
        :src="product.image"
        :alt="product.name || ''"
        loading="lazy"
        decoding="async"
        class="card-image__img"
      />
    </div>
    <div class="card-body">
      <span class="card-category">{{ product.category }}</span>
      <h3 class="card-title">{{ product.name }}</h3>
      <p class="card-description">{{ product.description }}</p>
      <div class="card-footer">
        <span class="card-price" :aria-label="`Giá ${formatPrice(product.price)}`">{{ formatPrice(product.price) }}</span>
        <span class="badge" :aria-label="`Tồn kho: ${formatStock(product.stock)}`">{{ formatStock(product.stock) }}</span>
      </div>
    </div>
  </RouterLink>
</template>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--color-border);
  transition: box-shadow var(--transition-fast), transform var(--transition-fast);
  text-decoration: none;
  color: inherit;
}
.card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
.card:focus { outline: none; }
.card:focus-visible { box-shadow: var(--focus-ring); }

.card-image {
  aspect-ratio: 4 / 3;
  background: var(--color-bg);
  overflow: hidden;
}
.card-image__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-base);
}
.card:hover .card-image__img { transform: scale(1.04); }

.card-body {
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.card-category {
  font-size: var(--text-xs);
  text-transform: uppercase;
  color: var(--color-text-muted);
  letter-spacing: 0.04em;
}
.card-title {
  font-size: var(--text-base);
  font-weight: var(--font-weight-semibold);
  margin: 0;
  line-height: var(--leading-tight);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.card-description {
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding-top: var(--space-2);
}
.card-price {
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  font-size: var(--text-base);
}
.badge {
  font-size: var(--text-xs);
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--color-bg-hover);
  color: var(--color-primary);
  font-weight: var(--font-weight-medium);
}

@media (prefers-reduced-motion: reduce) {
  .card,
  .card-image__img { transition: none; }
  .card:hover { transform: none; }
}
</style>
