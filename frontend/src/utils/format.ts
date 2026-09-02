/**
 * Centralized formatting helpers.
 * Money amounts travel over the wire as decimal strings, e.g. "1500.00".
 * Dates travel over the wire as "YYYY-MM-DD" strings with no time/timezone component.
 */

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

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

/** Parses a decimal-string amount from the API into a JS number for display purposes only. */
export function parseAmount(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : 0
}

/** Formats a decimal-string (or number) amount as "R$ 1.250,00". */
export function formatCurrency(value: string | number | null | undefined): string {
  return currencyFormatter.format(parseAmount(value))
}

/** Formats a signed amount with an explicit "+"/"-" prefix, never relying on color alone. */
export function formatSignedCurrency(value: string | number | null | undefined, type: 'RECEITA' | 'DESPESA'): string {
  const abs = Math.abs(parseAmount(value))
  const prefix = type === 'RECEITA' ? '+ ' : '- '
  return prefix + currencyFormatter.format(abs)
}

/**
 * Formats a signed decimal-string amount, deriving the "+"/"-" prefix from the value's own sign.
 * Used for server-computed derived values (e.g. a precatório's diferença) where there is no
 * separate RECEITA/DESPESA type to signal the sign.
 */
export function formatSignedAmount(value: string | number | null | undefined): string {
  const n = parseAmount(value)
  const prefix = n < 0 ? '- ' : '+ '
  return prefix + currencyFormatter.format(Math.abs(n))
}

/** Parses a "YYYY-MM-DD" date string into a local Date (no timezone shifting). */
export function parseIsoDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, (month ?? 1) - 1, day ?? 1)
}

/** Formats a "YYYY-MM-DD" string as "dd/mm/yyyy". */
export function formatDate(isoDate: string | null | undefined): string {
  if (!isoDate) return ''
  return dateFormatter.format(parseIsoDate(isoDate))
}

/** Formats a Date object as "YYYY-MM-DD" (no time/timezone component). */
export function toIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Returns today as "YYYY-MM-DD". */
export function todayIso(): string {
  return toIsoDate(new Date())
}

export function monthLabel(year: number, monthIndex0: number): string {
  return `${MONTH_NAMES[monthIndex0]} ${year}`
}

/** "YYYY-MM" -> "Set/2026" (short label, used for chart axis). */
export function monthKeyToShortLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number)
  const name = MONTH_NAMES[(month ?? 1) - 1] ?? ''
  return `${name.slice(0, 3)}/${year}`
}

/**
 * Normalizes a BRL-formatted user input (e.g. "1.500,00", "1500,00", "1500.00", "1500")
 * into the wire format expected by the API, e.g. "1500.00".
 */
export function normalizeAmountInput(raw: string): string {
  let s = raw.trim()
  if (s === '') return ''
  // Remove currency symbol and spaces
  s = s.replace(/R\$\s?/gi, '').replace(/\s/g, '')
  const hasComma = s.includes(',')
  const hasDot = s.includes('.')

  if (hasComma && hasDot) {
    // Assume dot = thousands separator, comma = decimal separator (pt-BR style)
    s = s.replace(/\./g, '').replace(',', '.')
  } else if (hasComma && !hasDot) {
    // Comma is the decimal separator
    s = s.replace(',', '.')
  }
  // If only dot or neither, assume it's already a plain decimal number

  const n = Number(s)
  if (!Number.isFinite(n)) return ''
  return n.toFixed(2)
}

/** Formats a numeric value as a BRL input string without the currency symbol, e.g. "1.500,00". */
export function formatAmountForInput(value: string | number | null | undefined): string {
  const n = parseAmount(value)
  if (n === 0 && (value === null || value === undefined || value === '')) return ''
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}
