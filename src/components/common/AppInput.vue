<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelValue: string | number
  label?: string
  placeholder?: string
  type?: string
  error?: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void
}>()

const onInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}

const hasError = computed(() => !!props.error)
</script>

<template>
  <div class="app-input-wrapper">
    <label v-if="label" class="app-label">
      {{ label }}
    </label>
    <div class="input-container">
      <input
        :type="type || 'text'"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        class="app-input"
        :class="{ 'is-invalid': hasError }"
        @input="onInput"
      />
    </div>
    <span v-if="hasError" class="error-message">{{ error }}</span>
  </div>
</template>

<style scoped>
.app-input-wrapper {
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
}
.app-label {
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--color-text);
}
.app-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 1rem;
  transition: border-color 0.2s;
}
.app-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(52, 144, 220, 0.2);
}
.app-input.is-invalid {
  border-color: var(--color-secondary);
}
.app-input:disabled {
  background-color: var(--color-bg-hover);
  cursor: not-allowed;
}
.error-message {
  color: var(--color-secondary);
  font-size: 0.875rem;
  margin-top: 0.25rem;
}
</style>
