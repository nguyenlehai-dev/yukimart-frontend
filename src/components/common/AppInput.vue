<script setup lang="ts">
import { computed, useId } from 'vue'

const props = defineProps<{
  modelValue: string | number
  label?: string
  placeholder?: string
  type?: string
  error?: string
  hint?: string
  disabled?: boolean
  required?: boolean
  autocomplete?: string
  inputmode?: 'text' | 'numeric' | 'decimal' | 'tel' | 'email' | 'url' | 'search'
  id?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void
  (e: 'blur', event: FocusEvent): void
}>()

const onInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}

const fallbackId = useId()
const inputId = computed(() => props.id || `app-input-${fallbackId}`)
const errorId = computed(() => `${inputId.value}-error`)
const hintId = computed(() => `${inputId.value}-hint`)
const hasError = computed(() => !!props.error)
const describedBy = computed(() => {
  const ids: string[] = []
  if (props.hint) ids.push(hintId.value)
  if (hasError.value) ids.push(errorId.value)
  return ids.length ? ids.join(' ') : undefined
})

const resolvedInputmode = computed(() => {
  if (props.inputmode) return props.inputmode
  if (props.type === 'tel') return 'tel'
  if (props.type === 'email') return 'email'
  if (props.type === 'number') return 'numeric'
  return undefined
})
</script>

<template>
  <div class="app-input-wrapper">
    <label v-if="label" :for="inputId" class="app-label">
      {{ label }}
      <span v-if="required" class="app-label__required" aria-hidden="true">*</span>
    </label>
    <div class="input-container">
      <input
        :id="inputId"
        :type="type || 'text'"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :autocomplete="autocomplete"
        :inputmode="resolvedInputmode"
        :aria-invalid="hasError || undefined"
        :aria-describedby="describedBy"
        :aria-required="required || undefined"
        class="app-input"
        :class="{ 'is-invalid': hasError }"
        @input="onInput"
        @blur="emit('blur', $event)"
      />
    </div>
    <span v-if="hint && !hasError" :id="hintId" class="hint-message">{{ hint }}</span>
    <span v-if="hasError" :id="errorId" class="error-message" role="alert">{{ error }}</span>
  </div>
</template>

<style scoped>
.app-input-wrapper {
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
}
.app-label {
  margin-bottom: 0.375rem;
  font-weight: 500;
  font-size: 0.9375rem;
  color: var(--color-text);
}
.app-label__required {
  color: var(--color-secondary);
  margin-left: 2px;
}
.app-input {
  width: 100%;
  padding: 0.6875rem 0.875rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: 1rem; /* ≥16px để iOS không zoom khi focus */
  line-height: 1.4;
  color: var(--color-text);
  background: #fff;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}
.app-input::placeholder {
  color: var(--color-text-light);
}
.app-input:hover:not(:disabled):not(.is-invalid) {
  border-color: var(--color-text-light);
}
.app-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--focus-ring);
}
.app-input.is-invalid {
  border-color: var(--color-secondary);
}
.app-input.is-invalid:focus {
  box-shadow: 0 0 0 3px rgba(208, 2, 27, 0.2);
}
.app-input:disabled {
  background-color: var(--color-bg-hover);
  color: var(--color-text-muted);
  cursor: not-allowed;
}
.error-message {
  color: var(--color-secondary);
  font-size: 0.8125rem;
  margin-top: 0.25rem;
  line-height: 1.4;
}
.hint-message {
  color: var(--color-text-muted);
  font-size: 0.8125rem;
  margin-top: 0.25rem;
  line-height: 1.4;
}
@media (prefers-reduced-motion: reduce) {
  .app-input { transition: none; }
}
</style>
