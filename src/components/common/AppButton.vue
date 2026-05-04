<script setup lang="ts">
withDefaults(defineProps<{
  type?: 'button' | 'submit' | 'reset'
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  block?: boolean
  disabled?: boolean
  loading?: boolean
  ariaLabel?: string
}>(), {
  type: 'button',
  variant: 'primary',
  size: 'md',
  block: false,
  disabled: false,
  loading: false
})
</script>

<template>
  <button
    :type="type"
    class="ym-btn"
    :class="[
      `ym-btn--${variant}`,
      `ym-btn--${size}`,
      { 'ym-btn--block': block, 'is-loading': loading }
    ]"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
    :aria-label="ariaLabel"
  >
    <span v-if="loading" class="ym-btn__spinner" aria-hidden="true"></span>
    <span class="ym-btn__content" :class="{ 'is-hidden': loading }">
      <slot></slot>
    </span>
  </button>
</template>

<style scoped>
.ym-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  position: relative;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  font-family: inherit;
  font-weight: 600;
  line-height: 1.2;
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
  min-height: 44px; /* a11y: touch target ≥44px */
  transition:
    background-color var(--transition-fast),
    border-color var(--transition-fast),
    color var(--transition-fast),
    box-shadow var(--transition-fast),
    transform var(--transition-fast);
}

.ym-btn:focus { outline: none; }
.ym-btn:focus-visible { box-shadow: var(--focus-ring); }
.ym-btn:active:not(:disabled) { transform: translateY(1px); }
.ym-btn:disabled { cursor: not-allowed; opacity: 0.55; }

.ym-btn--block { width: 100%; }

/* ── Sizes ── */
.ym-btn--sm { padding: 0.5rem 0.875rem; font-size: 0.875rem; min-height: 36px; }
.ym-btn--md { padding: 0.75rem 1.25rem; font-size: 0.9375rem; }
.ym-btn--lg { padding: 1rem 1.75rem; font-size: 1rem; min-height: 52px; }

/* ── Variants ── */
.ym-btn--primary {
  background: var(--color-primary);
  color: #fff;
}
.ym-btn--primary:hover:not(:disabled) { background: var(--color-primary-dark); }

.ym-btn--secondary {
  background: var(--color-primary-light);
  color: var(--color-primary-dark);
  border-color: var(--color-primary-light);
}
.ym-btn--secondary:hover:not(:disabled) {
  background: var(--color-primary-hover);
  border-color: var(--color-primary);
}

.ym-btn--outline {
  background: transparent;
  color: var(--color-primary);
  border-color: var(--color-primary);
}
.ym-btn--outline:hover:not(:disabled) {
  background: var(--color-primary);
  color: #fff;
}

.ym-btn--ghost {
  background: transparent;
  color: var(--color-text);
}
.ym-btn--ghost:hover:not(:disabled) { background: var(--color-bg-hover); }

.ym-btn--danger {
  background: var(--color-secondary);
  color: #fff;
}
.ym-btn--danger:hover:not(:disabled) { background: var(--color-secondary-dark); }

/* ── Loading ── */
.is-loading { cursor: progress; }
.ym-btn__content.is-hidden { visibility: hidden; }

.ym-btn__spinner {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 1.125rem;
  height: 1.125rem;
  margin: -0.5625rem 0 0 -0.5625rem;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: ym-btn-spin 0.7s linear infinite;
  opacity: 0.7;
}

@keyframes ym-btn-spin {
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .ym-btn { transition: none; }
  .ym-btn__spinner { animation-duration: 1.5s; }
}
</style>
