<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { parseIsoDate, toIsoDate } from '@/utils/format'

/**
 * Self-contained popover calendar date-picker.
 * Renders a day / month / year picker depending on `granularity` and emits the picked
 * value as an ISO "YYYY-MM-DD" string. Visibility is fully controlled by the parent via
 * the `open` prop / `update:open` event.
 */
const props = withDefaults(
  defineProps<{
    modelValue: string
    granularity?: 'day' | 'month' | 'year'
    open: boolean
  }>(),
  {
    granularity: 'day',
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'update:open', value: boolean): void
}>()

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTH_ABBR = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

const root = ref<HTMLElement | null>(null)

const selectedDate = computed(() => parseIsoDate(props.modelValue))
const today = new Date()

// Browsing state, independent from the selected value while the popover is open.
const viewYear = ref(selectedDate.value.getFullYear())
const viewMonth = ref(selectedDate.value.getMonth())
const viewDecadeStart = ref(Math.floor(selectedDate.value.getFullYear() / 10) * 10)

function resetViewFromSelection(): void {
  const d = selectedDate.value
  viewYear.value = d.getFullYear()
  viewMonth.value = d.getMonth()
  viewDecadeStart.value = Math.floor(d.getFullYear() / 10) * 10
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function close(): void {
  emit('update:open', false)
}

function handleClickOutside(event: MouseEvent): void {
  if (root.value && !root.value.contains(event.target as Node)) {
    close()
  }
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') close()
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      resetViewFromSelection()
      // Attach listeners on the next tick so the same click that opened the popover
      // (e.g. clicking the trigger button) doesn't immediately close it.
      void nextTick(() => {
        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('keydown', handleKeydown)
      })
    } else {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeydown)
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleClickOutside)
  document.removeEventListener('keydown', handleKeydown)
})

// ---- Day granularity ----

interface DayCell {
  date: Date
  iso: string
  inMonth: boolean
  isToday: boolean
  isSelected: boolean
}

const monthHeaderLabel = computed(() => {
  const text = `${MONTH_NAMES[viewMonth.value]} ${viewYear.value}`
  return text
})

const dayCells = computed<DayCell[]>(() => {
  const firstOfMonth = new Date(viewYear.value, viewMonth.value, 1)
  const startWeekday = firstOfMonth.getDay()
  const gridStart = new Date(viewYear.value, viewMonth.value, 1 - startWeekday)
  const cells: DayCell[] = []
  for (let i = 0; i < 42; i++) {
    const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i)
    cells.push({
      date,
      iso: toIsoDate(date),
      inMonth: date.getMonth() === viewMonth.value,
      isToday: isSameDay(date, today),
      isSelected: isSameDay(date, selectedDate.value),
    })
  }
  return cells
})

function prevMonth(): void {
  const d = new Date(viewYear.value, viewMonth.value - 1, 1)
  viewYear.value = d.getFullYear()
  viewMonth.value = d.getMonth()
}

function nextMonth(): void {
  const d = new Date(viewYear.value, viewMonth.value + 1, 1)
  viewYear.value = d.getFullYear()
  viewMonth.value = d.getMonth()
}

function pickDay(cell: DayCell): void {
  emit('update:modelValue', cell.iso)
  close()
}

function jumpToToday(): void {
  viewYear.value = today.getFullYear()
  viewMonth.value = today.getMonth()
  emit('update:modelValue', toIsoDate(today))
  close()
}

// ---- Month granularity ----

function prevYear(): void {
  viewYear.value -= 1
}

function nextYear(): void {
  viewYear.value += 1
}

function pickMonth(monthIndex: number): void {
  const iso = `${viewYear.value}-${String(monthIndex + 1).padStart(2, '0')}-01`
  emit('update:modelValue', iso)
  close()
}

function isMonthSelected(monthIndex: number): boolean {
  return viewYear.value === selectedDate.value.getFullYear() && monthIndex === selectedDate.value.getMonth()
}

function isMonthCurrent(monthIndex: number): boolean {
  return viewYear.value === today.getFullYear() && monthIndex === today.getMonth()
}

// ---- Year granularity ----

const decadeYears = computed(() => {
  const years: number[] = []
  for (let i = 0; i < 10; i++) years.push(viewDecadeStart.value + i)
  return years
})

const decadeLabel = computed(() => `${viewDecadeStart.value}–${viewDecadeStart.value + 9}`)

function prevDecade(): void {
  viewDecadeStart.value -= 10
}

function nextDecade(): void {
  viewDecadeStart.value += 10
}

function pickYear(year: number): void {
  emit('update:modelValue', `${year}-01-01`)
  close()
}
</script>

<template>
  <div
    v-if="props.open"
    ref="root"
    class="absolute z-20 mt-2 rounded-xl border border-slate-200 bg-white p-4 shadow-lg"
    role="dialog"
    aria-label="Selecionar data"
  >
    <!-- Day granularity: full month calendar -->
    <div v-if="props.granularity === 'day'" class="w-[19rem]">
      <div class="mb-2 flex items-center justify-between gap-2">
        <button
          type="button"
          class="flex h-9 w-9 items-center justify-center rounded-lg text-brand-700 hover:bg-brand-50"
          aria-label="Mês anterior"
          @click="prevMonth"
        >
          <ChevronLeft class="h-5 w-5" aria-hidden="true" />
        </button>
        <span class="flex-1 text-center text-base font-bold capitalize text-slate-800">{{ monthHeaderLabel }}</span>
        <button
          type="button"
          class="flex h-9 w-9 items-center justify-center rounded-lg text-brand-700 hover:bg-brand-50"
          aria-label="Próximo mês"
          @click="nextMonth"
        >
          <ChevronRight class="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div class="grid grid-cols-7 gap-1">
        <span
          v-for="wd in WEEKDAY_LABELS"
          :key="wd"
          class="flex h-8 items-center justify-center text-xs font-semibold uppercase tracking-wide text-slate-400"
        >
          {{ wd }}
        </span>
        <button
          v-for="cell in dayCells"
          :key="cell.iso"
          type="button"
          class="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-semibold transition-colors"
          :class="[
            cell.isSelected
              ? 'bg-brand-600 text-white'
              : cell.inMonth
                ? 'text-slate-700 hover:bg-brand-50'
                : 'text-slate-300 hover:bg-slate-50',
            cell.isToday && !cell.isSelected ? 'ring-2 ring-brand-300' : '',
          ]"
          @click="pickDay(cell)"
        >
          {{ cell.date.getDate() }}
        </button>
      </div>

      <button
        type="button"
        class="mt-3 min-h-[40px] w-full rounded-lg border border-slate-300 text-sm font-semibold text-brand-700 hover:bg-brand-50"
        @click="jumpToToday"
      >
        Hoje
      </button>
    </div>

    <!-- Month granularity: 12-month grid for a single year -->
    <div v-else-if="props.granularity === 'month'" class="w-64">
      <div class="mb-3 flex items-center justify-between gap-2">
        <button
          type="button"
          class="flex h-9 w-9 items-center justify-center rounded-lg text-brand-700 hover:bg-brand-50"
          aria-label="Ano anterior"
          @click="prevYear"
        >
          <ChevronLeft class="h-5 w-5" aria-hidden="true" />
        </button>
        <span class="flex-1 text-center text-base font-bold text-slate-800">{{ viewYear }}</span>
        <button
          type="button"
          class="flex h-9 w-9 items-center justify-center rounded-lg text-brand-700 hover:bg-brand-50"
          aria-label="Próximo ano"
          @click="nextYear"
        >
          <ChevronRight class="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div class="grid grid-cols-3 gap-2">
        <button
          v-for="(name, index) in MONTH_ABBR"
          :key="name"
          type="button"
          class="flex h-12 items-center justify-center rounded-lg text-sm font-semibold transition-colors"
          :class="[
            isMonthSelected(index) ? 'bg-brand-600 text-white' : 'text-slate-700 hover:bg-brand-50',
            isMonthCurrent(index) && !isMonthSelected(index) ? 'ring-2 ring-brand-300' : '',
          ]"
          @click="pickMonth(index)"
        >
          {{ name }}
        </button>
      </div>
    </div>

    <!-- Year granularity: 10-year grid, paged by decade -->
    <div v-else class="w-64">
      <div class="mb-3 flex items-center justify-between gap-2">
        <button
          type="button"
          class="flex h-9 w-9 items-center justify-center rounded-lg text-brand-700 hover:bg-brand-50"
          aria-label="Década anterior"
          @click="prevDecade"
        >
          <ChevronLeft class="h-5 w-5" aria-hidden="true" />
        </button>
        <span class="flex-1 text-center text-base font-bold text-slate-800">{{ decadeLabel }}</span>
        <button
          type="button"
          class="flex h-9 w-9 items-center justify-center rounded-lg text-brand-700 hover:bg-brand-50"
          aria-label="Próxima década"
          @click="nextDecade"
        >
          <ChevronRight class="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div class="grid grid-cols-2 gap-2">
        <button
          v-for="year in decadeYears"
          :key="year"
          type="button"
          class="flex h-12 items-center justify-center rounded-lg text-sm font-semibold transition-colors"
          :class="[
            year === selectedDate.getFullYear() ? 'bg-brand-600 text-white' : 'text-slate-700 hover:bg-brand-50',
            year === today.getFullYear() && year !== selectedDate.getFullYear() ? 'ring-2 ring-brand-300' : '',
          ]"
          @click="pickYear(year)"
        >
          {{ year }}
        </button>
      </div>
    </div>
  </div>
</template>
