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
    socios: ['CHIQUINHO'],
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

  it('allows a blank clienteNome (cliente é opcional)', () => {
    expect(validateTransactionForm(baseForm({ clienteNome: '' })).clienteNome).toBeUndefined()
  })

  it('requires categoriaId', () => {
    expect(validateTransactionForm(baseForm({ categoriaId: '' })).categoriaId).toBeDefined()
  })

  it('requires a valid data', () => {
    expect(validateTransactionForm(baseForm({ data: '' })).data).toBeDefined()
    expect(validateTransactionForm(baseForm({ data: '2026-13-40' })).data).toBeDefined()
  })

  it('requires at least one sócio', () => {
    expect(validateTransactionForm(baseForm({ socios: [] })).socios).toBeDefined()
  })
})

function basePrecatorioForm(overrides: Partial<PrecatorioFormInput> = {}): PrecatorioFormInput {
  return {
    cedente: 'Empresa XYZ Ltda',
    valorAtualizado: '1.500,00',
    valorVendido: '',
    valorPago: '500,00',
    comissoes: [],
    tipoDocumento: '',
    numeroDocumento: '',
    livro: '',
    folha: '',
    origem: 'GDF',
    origemOutro: '',
    comprador: '',
    ...overrides,
  }
}

describe('validatePrecatorioForm', () => {
  it('passes for a fully valid form', () => {
    const errors = validatePrecatorioForm(basePrecatorioForm())
    expect(hasErrors(errors)).toBe(false)
  })

  it('requires cedente', () => {
    expect(validatePrecatorioForm(basePrecatorioForm({ cedente: '' })).cedente).toBeDefined()
    expect(validatePrecatorioForm(basePrecatorioForm({ cedente: '   ' })).cedente).toBeDefined()
  })

  it('requires a positive valorAtualizado', () => {
    expect(validatePrecatorioForm(basePrecatorioForm({ valorAtualizado: '' })).valorAtualizado).toBeDefined()
    expect(validatePrecatorioForm(basePrecatorioForm({ valorAtualizado: '0' })).valorAtualizado).toBeDefined()
    expect(validatePrecatorioForm(basePrecatorioForm({ valorAtualizado: '-5' })).valorAtualizado).toBeDefined()
  })

  it('requires valorPago (não pode ficar em branco)', () => {
    expect(validatePrecatorioForm(basePrecatorioForm({ valorPago: '' })).valorPago).toBeDefined()
  })

  it('rejects valorPago negativo', () => {
    expect(validatePrecatorioForm(basePrecatorioForm({ valorPago: '-5' })).valorPago).toBeDefined()
  })

  it('allows a blank valorVendido (venda ainda não registrada)', () => {
    expect(validatePrecatorioForm(basePrecatorioForm({ valorVendido: '' })).valorVendido).toBeUndefined()
  })

  it('rejects valorVendido negativo quando informado', () => {
    expect(validatePrecatorioForm(basePrecatorioForm({ valorVendido: '-5' })).valorVendido).toBeDefined()
  })

  it('requires origem', () => {
    expect(validatePrecatorioForm(basePrecatorioForm({ origem: '' })).origem).toBeDefined()
  })

  it('requires origemOutro quando origem é OUTRO', () => {
    expect(validatePrecatorioForm(basePrecatorioForm({ origem: 'OUTRO', origemOutro: '' })).origemOutro).toBeDefined()
    expect(validatePrecatorioForm(basePrecatorioForm({ origem: 'OUTRO', origemOutro: 'Tribunal X' })).origemOutro).toBeUndefined()
  })
})
