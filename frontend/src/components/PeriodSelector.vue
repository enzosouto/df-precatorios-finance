<script setup lang="ts">
import { computed, ref } from 'vue'
import type { PeriodMode } from '@/types'
import { formatDate, toIsoDate } from '@/utils/format'
import DatePicker from '@/components/DatePicker.vue'

const props = defineProps<{
  mode: PeriodMode
  label: string
  canNavigate: boolean
  anchor: Date
  customStart: string
  customEnd: string
}>()

const emit = defineEmits<{
  (e: 'update:mode', value: PeriodMode): void
  (e: 'prev'): void
  (e: 'next'): void
  (e: 'jump', value: string): void
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

// Center-label calendar popover (dia / mes / ano modes).
const labelPickerOpen = ref(false)

const anchorIso = computed(() => toIsoDate(props.anchor))

const labelPickerGranularity = computed<'day' | 'month' | 'year'>(() => {
  if (props.mode === 'mes') return 'month'
  if (props.mode === 'ano') return 'year'
  return 'day'
})

function toggleLabelPicker(): void {
  labelPickerOpen.value = !labelPickerOpen.value
}

function onLabelPicked(iso: string): void {
  emit('jump', iso)
}

// Custom-range calendar popovers (período personalizado mode).
const startPickerOpen = ref(false)
const endPickerOpen = ref(false)

function toggleStartPicker(): void {
  startPickerOpen.value = !startPickerOpen.value
  endPickerOpen.value = false
}

function toggleEndPicker(): void {
  endPickerOpen.value = !endPickerOpen.value
  startPickerOpen.value = false
}

function onCustomStartPicked(iso: string): void {
  emit('update:customStart', iso)
}

function onCustomEndPicked(iso: string): void {
  emit('update:customEnd', iso)
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
      <div class="relative flex-1">
        <button
          type="button"
          class="w-full rounded-lg py-1 text-center text-lg font-bold capitalize text-slate-800 hover:bg-brand-50 hover:text-brand-700"
          @click="toggleLabelPicker"
        >
          {{ props.label }}
        </button>
        <DatePicker
          class="left-1/2 -translate-x-1/2"
          :model-value="anchorIso"
          :granularity="labelPickerGranularity"
          :open="labelPickerOpen"
          @update:model-value="onLabelPicked"
          @update:open="labelPickerOpen = $event"
        />
      </div>
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
      <div class="relative flex flex-col gap-1">
        <span class="text-sm font-medium text-slate-600">De</span>
        <button
          type="button"
          class="min-h-[44px] rounded-lg border border-slate-300 px-3 py-2 text-left text-base text-slate-800 hover:border-brand-400"
          @click="toggleStartPicker"
        >
          {{ formatDate(props.customStart) }}
        </button>
        <DatePicker
          :model-value="props.customStart"
          granularity="day"
          :open="startPickerOpen"
          @update:model-value="onCustomStartPicked"
          @update:open="startPickerOpen = $event"
        />
      </div>
      <div class="relative flex flex-col gap-1">
        <span class="text-sm font-medium text-slate-600">Até</span>
        <button
          type="button"
          class="min-h-[44px] rounded-lg border border-slate-300 px-3 py-2 text-left text-base text-slate-800 hover:border-brand-400"
          @click="toggleEndPicker"
        >
          {{ formatDate(props.customEnd) }}
        </button>
        <DatePicker
          :model-value="props.customEnd"
          granularity="day"
          :open="endPickerOpen"
          @update:model-value="onCustomEndPicked"
          @update:open="endPickerOpen = $event"
        />
      </div>
    </div>
  </div>
</template>
