import { computed, ref } from 'vue'
import type { DateRange, PeriodMode } from '@/types'
import { monthLabel, toIsoDate } from '@/utils/format'

const WEEKDAY_MONTH_DAY = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
})

/**
 * Shared period-navigation logic used by the Dashboard and Movimentações pages:
 * a segmented "Dia / Mês / Ano / Período" control plus a "< label >" navigator.
 */
export function usePeriod(initialMode: PeriodMode = 'mes') {
  const mode = ref<PeriodMode>(initialMode)
  const anchor = ref(new Date())
  const customStart = ref(toIsoDate(new Date()))
  const customEnd = ref(toIsoDate(new Date()))

  const range = computed<DateRange>(() => {
    const d = anchor.value
    if (mode.value === 'dia') {
      const iso = toIsoDate(d)
      return { startDate: iso, endDate: iso }
    }
    if (mode.value === 'mes') {
      const first = new Date(d.getFullYear(), d.getMonth(), 1)
      const last = new Date(d.getFullYear(), d.getMonth() + 1, 0)
      return { startDate: toIsoDate(first), endDate: toIsoDate(last) }
    }
    if (mode.value === 'ano') {
      return { startDate: `${d.getFullYear()}-01-01`, endDate: `${d.getFullYear()}-12-31` }
    }
    // personalizado
    return { startDate: customStart.value, endDate: customEnd.value }
  })

  const label = computed(() => {
    const d = anchor.value
    if (mode.value === 'dia') {
      const text = WEEKDAY_MONTH_DAY.format(d)
      return text.charAt(0).toUpperCase() + text.slice(1)
    }
    if (mode.value === 'mes') {
      return monthLabel(d.getFullYear(), d.getMonth())
    }
    if (mode.value === 'ano') {
      return String(d.getFullYear())
    }
    return 'Período personalizado'
  })

  const canNavigate = computed(() => mode.value !== 'personalizado')

  function step(direction: -1 | 1): void {
    const d = anchor.value
    if (mode.value === 'dia') {
      anchor.value = new Date(d.getFullYear(), d.getMonth(), d.getDate() + direction)
    } else if (mode.value === 'mes') {
      anchor.value = new Date(d.getFullYear(), d.getMonth() + direction, 1)
    } else if (mode.value === 'ano') {
      anchor.value = new Date(d.getFullYear() + direction, d.getMonth(), d.getDate())
    }
  }

  function goToToday(): void {
    anchor.value = new Date()
  }

  /** Jumps the anchor directly to an arbitrary date (used by the calendar date-picker). */
  function setAnchor(date: Date): void {
    anchor.value = date
  }

  return {
    mode,
    anchor,
    customStart,
    customEnd,
    range,
    label,
    canNavigate,
    step,
    goToToday,
    setAnchor,
  }
}
