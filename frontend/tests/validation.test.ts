import { describe, expect, it } from 'vitest'
import { hasErrors, isValidEmail, isValidIsoDate, validatePrecatorioForm, validateTransactionForm } from '@/utils/validation'
import type { PrecatorioFormInput, TransactionFormInput } from '@/utils/validation'

function baseForm(overrides: Partial<TransactionFormInput> = {}): TransactionFormInput {
  return {
    tipo: 'DESPESA',
    valor: '100,00',
    descricao: 'Pagamento de honorários',
    clienteNome: 'Empresa XYZ Ltda',
    categoriaId: 'cat-1',
    data: '2026-09-01',
    ...overrides,
  }
}

describe('isValidIsoDate', () => {
  it('accepts valid dates', () => {
    expect(isValidIsoDate('2026-09-01')).toBe(true)
    expect(isValidIsoDate('2024-02-29')).toBe(true) // leap year
  })

  it('rejects malformed or out-of-range dates', () => {
    expect(isValidIsoDate('2026-13-01')).toBe(false)
    expect(isValidIsoDate('2026-02-30')).toBe(false)
    expect(isValidIsoDate('not-a-date')).toBe(false)
    expect(isValidIsoDate('2026/09/01')).toBe(false)
  })
})

describe('isValidEmail', () => {
  it('accepts well-formed emails', () => {
    expect(isValidEmail('user@example.com')).toBe(true)
  })

  it('rejects malformed emails', () => {
    expect(isValidEmail('not-an-email')).toBe(false)
    expect(isValidEmail('user@')).toBe(false)
    expect(isValidEmail('')).toBe(false)
  })
})

describe('validateTransactionForm', () => {
  it('passes for a fully valid form', () => {
    const errors = validateTransactionForm(baseForm())
    expect(hasErrors(errors)).toBe(false)
  })

  it('requires tipo', () => {
    const errors = validateTransactionForm(baseForm({ tipo: '' }))
    expect(errors.tipo).toBeDefined()
  })

  it('requires a positive valor', () => {
    expect(validateTransactionForm(baseForm({ valor: '' })).valor).toBeDefined()
    expect(validateTransactionForm(baseForm({ valor: '0' })).valor).toBeDefined()
    expect(validateTransactionForm(baseForm({ valor: '-5' })).valor).toBeDefined()
  })

  it('requires descricao', () => {
    expect(validateTransactionForm(baseForm({ descricao: '  ' })).descricao).toBeDefined()
  })

  it('requires clienteNome regardless of tipo', () => {
    expect(validateTransactionForm(baseForm({ tipo: 'RECEITA', clienteNome: '' })).clienteNome).toBeDefined()
    expect(validateTransactionForm(baseForm({ tipo: 'DESPESA', clienteNome: '' })).clienteNome).toBeDefined()
  })

  it('requires categoriaId', () => {
    expect(validateTransactionForm(baseForm({ categoriaId: '' })).categoriaId).toBeDefined()
  })

  it('requires a valid data', () => {
    expect(validateTransactionForm(baseForm({ data: '' })).data).toBeDefined()
    expect(validateTransactionForm(baseForm({ data: '2026-13-40' })).data).toBeDefined()
  })
})

function basePrecatorioForm(overrides: Partial<PrecatorioFormInput> = {}): PrecatorioFormInput {
  return {
    cedente: 'Empresa XYZ Ltda',
    valorOriginal: '1.000,00',
    valorAtualizado: '1.500,00',
    valorPago: '',
    ...overrides,
  }
}

describe('validatePrecatorioForm', () => {
  it('passes for a fully valid form with no valorPago', () => {
    const errors = validatePrecatorioForm(basePrecatorioForm())
    expect(hasErrors(errors)).toBe(false)
  })

  it('passes for a fully valid form with a valorPago', () => {
    const errors = validatePrecatorioForm(basePrecatorioForm({ valorPago: '500,00' }))
    expect(hasErrors(errors)).toBe(false)
  })

  it('requires cedente', () => {
    expect(validatePrecatorioForm(basePrecatorioForm({ cedente: '' })).cedente).toBeDefined()
    expect(validatePrecatorioForm(basePrecatorioForm({ cedente: '   ' })).cedente).toBeDefined()
  })

  it('requires a positive valorOriginal', () => {
    expect(validatePrecatorioForm(basePrecatorioForm({ valorOriginal: '' })).valorOriginal).toBeDefined()
    expect(validatePrecatorioForm(basePrecatorioForm({ valorOriginal: '0' })).valorOriginal).toBeDefined()
    expect(validatePrecatorioForm(basePrecatorioForm({ valorOriginal: '-5' })).valorOriginal).toBeDefined()
  })

  it('requires a positive valorAtualizado', () => {
    expect(validatePrecatorioForm(basePrecatorioForm({ valorAtualizado: '' })).valorAtualizado).toBeDefined()
    expect(validatePrecatorioForm(basePrecatorioForm({ valorAtualizado: '0' })).valorAtualizado).toBeDefined()
    expect(validatePrecatorioForm(basePrecatorioForm({ valorAtualizado: '-5' })).valorAtualizado).toBeDefined()
  })

  it('allows a blank valorPago (not yet paid)', () => {
    expect(validatePrecatorioForm(basePrecatorioForm({ valorPago: '' })).valorPago).toBeUndefined()
    expect(validatePrecatorioForm(basePrecatorioForm({ valorPago: '   ' })).valorPago).toBeUndefined()
  })

  it('rejects a non-positive valorPago when provided', () => {
    expect(validatePrecatorioForm(basePrecatorioForm({ valorPago: '0' })).valorPago).toBeDefined()
    expect(validatePrecatorioForm(basePrecatorioForm({ valorPago: '-5' })).valorPago).toBeDefined()
  })
})
