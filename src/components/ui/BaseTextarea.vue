<template>
  <div class="textarea-wrapper">
    <label v-if="label" :for="id" class="textarea-label">
      {{ label }}
      <span v-if="required" class="textarea-required">*</span>
    </label>
    <textarea
      :id="id"
      v-model="model"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required"
      :rows="rows"
      :class="['textarea', { 'textarea--error': error, 'textarea--monospace': monospace }]"
      @blur="$emit('blur')"
    />
    <p v-if="error" class="textarea-error">{{ error }}</p>
    <p v-else-if="hint" class="textarea-hint">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  modelValue: string
  id?: string
  label?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
  error?: string
  hint?: string
  rows?: number
  monospace?: boolean
}>(), {
  rows: 10,
  monospace: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  blur: []
}>()

const model = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const id = computed(() => props.id || `textarea-${Math.random().toString(36).slice(2, 9)}`)
</script>

<style scoped>
.textarea-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.textarea-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text);
}

.textarea-required {
  color: var(--color-danger);
}

.textarea {
  width: 100%;
  padding: 0.75rem;
  font-size: 0.9rem;
  font-family: inherit;
  color: var(--color-text);
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  resize: vertical;
  min-height: 100px;
}

.textarea--monospace {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.85rem;
  line-height: 1.5;
  tab-size: 2;
}

.textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-alpha);
}

.textarea:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.textarea::placeholder {
  color: var(--color-text-muted);
}

.textarea--error {
  border-color: var(--color-danger);
}

.textarea--error:focus {
  box-shadow: 0 0 0 3px var(--color-danger-alpha);
}

.textarea-error {
  font-size: 0.75rem;
  color: var(--color-danger);
  margin: 0;
}

.textarea-hint {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin: 0;
}
</style>
