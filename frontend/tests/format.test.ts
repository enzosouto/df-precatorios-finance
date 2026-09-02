import { describe, expect, it } from 'vitest'
import {
  formatAmountForInput,
  formatCurrency,
  formatDate,
  formatSignedAmount,
  formatSignedCurrency,
  monthKeyToShortLabel,
  normalizeAmountInput,
  parseAmount,
  toIsoDate,
} from '@/utils/format'

describe('parseAmount', () => {
  it('parses decimal strings from the API', () => {
    expect(parseAmount('1500.00')).toBe(1500)
    expect(parseAmount('0.50')).toBe(0.5)
  })

  it('returns 0 for null/undefined/empty', () => {
    expect(parseAmount(null)).toBe(0)
    expect(parseAmount(undefined)).toBe(0)
    expect(parseAmount('')).toBe(0)
  })

  it('returns 0 for garbage input', () => {
    expect(parseAmount('abc')).toBe(0)
  })
})

describe('formatCurrency', () => {
  it('formats values as BRL', () => {
    expect(formatCurrency('1500.00')).toContain('1.500,00')
    expect(formatCurrency(0)).toContain('0,00')
  })
})

describe('formatSignedCurrency', () => {
  it('prefixes receitas with +', () => {
    expect(formatSignedCurrency('100.00', 'RECEITA')).toMatch(/^\+/)
  })

  it('prefixes despesas with -', () => {
    expect(formatSignedCurrency('100.00', 'DESPESA')).toMatch(/^-/)
  })
})

describe('formatSignedAmount', () => {
  it('prefixes positive values with +', () => {
    expect(formatSignedAmount('100.00')).toMatch(/^\+/)
  })

  it('prefixes negative values with -', () => {
    expect(formatSignedAmount('-100.00')).toMatch(/^-/)
  })

  it('treats zero as positive', () => {
    expect(formatSignedAmount('0.00')).toMatch(/^\+/)
  })
})

describe('toIsoDate / formatDate', () => {
  it('round-trips a date to YYYY-MM-DD without timezone shifting', () => {
    const date = new Date(2026, 8, 1) // Sept 1, 2026
    expect(toIsoDate(date)).toBe('2026-09-01')
  })

  it('formats an ISO date as dd/mm/yyyy', () => {
    expect(formatDate('2026-09-01')).toBe('01/09/2026')
  })

  it('returns empty string for falsy input', () => {
    expect(formatDate(null)).toBe('')
    expect(formatDate(undefined)).toBe('')
  })
})

describe('monthKeyToShortLabel', () => {
  it('converts YYYY-MM into a short pt-BR label', () => {
    expect(monthKeyToShortLabel('2026-09')).toBe('Set/2026')
    expect(monthKeyToShortLabel('2026-01')).toBe('Jan/2026')
  })
})

describe('normalizeAmountInput', () => {
  it('handles pt-BR formatted input with thousands and decimal separators', () => {
    expect(normalizeAmountInput('1.500,00')).toBe('1500.00')
  })

  it('handles comma as decimal separator only', () => {
    expect(normalizeAmountInput('1500,5')).toBe('1500.50')
  })

  it('handles plain decimal input', () => {
    expect(normalizeAmountInput('1500.00')).toBe('1500.00')
    expect(normalizeAmountInput('1500')).toBe('1500.00')
  })

  it('returns empty string for invalid input', () => {
    expect(normalizeAmountInput('')).toBe('')
    expect(normalizeAmountInput('abc')).toBe('')
  })

  it('strips currency symbols and spaces', () => {
    expect(normalizeAmountInput('R$ 1.500,00')).toBe('1500.00')
  })
})

describe('formatAmountForInput', () => {
  it('formats a decimal string without currency symbol', () => {
    expect(formatAmountForInput('1500.00')).toBe('1.500,00')
  })

  it('returns empty string for empty/null/undefined', () => {
    expect(formatAmountForInput('')).toBe('')
    expect(formatAmountForInput(null)).toBe('')
    expect(formatAmountForInput(undefined)).toBe('')
  })
})
