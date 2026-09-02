<script setup lang="ts">
import type { PeriodMode } from '@/types'

const props = defineProps<{
  mode: PeriodMode
  label: string
  canNavigate: boolean
  customStart: string
  customEnd: string
}>()

const emit = defineEmits<{
  (e: 'update:mode', value: PeriodMode): void
  (e: 'prev'): void
  (e: 'next'): void
  (e: 'update:customStart', value: string): void
  (e: 'update:customEnd', value: string): void
}>()

const modes: { value: PeriodMode; label: string }[] = [
  { value: 'dia', label: 'Dia' },
  { value: 'mes', label: 'Mês' },
  { value: 'ano', label: 'Ano' },
  { value: 'personalizado', label: 'Período' },
]

function selectMode(value: PeriodMode): void {
  emit('update:mode', value)
}

function onCustomStart(event: Event): void {
  emit('update:customStart', (event.target as HTMLInputElement).value)
}

function onCustomEnd(event: Event): void {
  emit('update:customEnd', (event.target as HTMLInputElement).value)
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1" role="tablist" aria-label="Período">
      <button
        v-for="item in modes"
        :key="item.value"
        type="button"
        role="tab"
        class="min-h-[44px] flex-1 rounded-lg px-3 py-2 text-base font-semibold transition-colors"
        :class="
          props.mode === item.value
            ? 'bg-white text-brand-700 shadow-sm'
            : 'text-slate-500 hover:text-slate-700'
        "
        :aria-selected="props.mode === item.value"
        @click="selectMode(item.value)"
      >
        {{ item.label }}
      </button>
    </div>

    <div v-if="props.mode !== 'personalizado'" class="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 shadow-sm">
      <button
        type="button"
        class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-2xl font-bold text-brand-700 hover:bg-brand-50"
        aria-label="Período anterior"
        @click="emit('prev')"
      >
        ‹
      </button>
      <span class="flex-1 text-center text-lg font-bold capitalize text-slate-800">{{ props.label }}</span>
      <button
        type="button"
        class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-2xl font-bold text-brand-700 hover:bg-brand-50"
        aria-label="Próximo período"
        @click="emit('next')"
      >
        ›
      </button>
    </div>

    <div v-else class="flex flex-wrap items-end gap-4 rounded-xl bg-white p-4 shadow-sm">
      <label class="flex flex-col gap-1 text-sm font-medium text-slate-600">
        De
        <input
          type="date"
          class="min-h-[44px] rounded-lg border border-slate-300 px-3 py-2 text-base"
          :value="props.customStart"
          @change="onCustomStart"
        />
      </label>
      <label class="flex flex-col gap-1 text-sm font-medium text-slate-600">
        Até
        <input
          type="date"
          class="min-h-[44px] rounded-lg border border-slate-300 px-3 py-2 text-base"
          :value="props.customEnd"
          @change="onCustomEnd"
        />
      </label>
    </div>
  </div>
</template>
