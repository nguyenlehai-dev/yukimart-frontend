<script setup lang="ts">
withDefaults(defineProps<{
  type?: 'button' | 'submit' | 'reset'
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
}>(), {
  type: 'button',
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false
})
</script>

<template>
  <button 
    :type="type" 
    class="btn" 
    :class="[`btn-${variant}`, `btn-${size}`, { 'is-loading': loading }]"
    :disabled="disabled || loading"
  >
    <div v-if="loading" class="btn-spinner"></div>
    <span :class="{ 'invisible': loading }">
      <slot></slot>
    </span>
  </button>
</template>

<style scoped>
.btn-sm { padding: 0.5rem 1rem; font-size: 0.875rem; }
.btn-md { padding: 0.75rem 1.5rem; font-size: 1rem; }
.btn-lg { padding: 1rem 2rem; font-size: 1.125rem; }

.btn-danger {
  background: var(--color-secondary);
  color: white;
}
.btn-danger:hover {
  background: #e11d48; /* darker red */
}

.is-loading {
  position: relative;
  cursor: not-allowed;
  opacity: 0.8;
}

.btn-spinner {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 1.2rem;
  height: 1.2rem;
  margin-top: -0.6rem;
  margin-left: -0.6rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.invisible {
  opacity: 0;
}
</style>
