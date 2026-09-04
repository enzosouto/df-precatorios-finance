<script setup lang="ts">
import { computed } from 'vue'
import type { Component } from 'vue'
import { formatCurrency } from '@/utils/format'

const props = defineProps<{
  label: string
  value: string | number
  tone?: 'neutral' | 'receita' | 'despesa'
  icon?: Component
}>()

const toneClasses = computed(() => {
  switch (props.tone) {
    case 'receita':
      return 'border-receita-500/30 bg-receita-50 text-receita-700'
    case 'despesa':
      return 'border-despesa-500/30 bg-despesa-50 text-despesa-700'
    default:
      return 'border-brand-500/30 bg-brand-50 text-brand-800'
  }
})
</script>

<template>
  <div class="flex flex-col gap-2 rounded-2xl border-2 p-5 shadow-sm" :class="toneClasses">
    <div class="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide opacity-80">
      <component :is="icon" v-if="icon" class="h-4 w-4" aria-hidden="true" />
      <span>{{ label }}</span>
    </div>
    <p class="text-2xl font-bold sm:text-3xl">{{ formatCurrency(value) }}</p>
  </div>
</template>
