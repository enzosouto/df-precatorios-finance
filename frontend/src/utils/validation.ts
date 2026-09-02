import { normalizeAmountInput } from './format'

export interface TransactionFormInput {
  tipo: 'RECEITA' | 'DESPESA' | ''
  valor: string
  descricao: string
  clienteNome: string
  categoriaId: string
  data: string
}

export interface TransactionFormErrors {
  tipo?: string
  valor?: string
  descricao?: string
  clienteNome?: string
  categoriaId?: string
  data?: string
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE_RE.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  if (month < 1 || month > 12) return false
  const daysInMonth = new Date(year, month, 0).getDate()
  if (day < 1 || day > daysInMonth) return false
  return true
}

export function validateTransactionForm(input: TransactionFormInput): TransactionFormErrors {
  const errors: TransactionFormErrors = {}

  if (input.tipo !== 'RECEITA' && input.tipo !== 'DESPESA') {
    errors.tipo = 'Selecione o tipo (Receita ou Despesa).'
  }

  const normalized = normalizeAmountInput(input.valor)
  if (!input.valor || input.valor.trim() === '') {
    errors.valor = 'Informe o valor.'
  } else if (normalized === '' || Number(normalized) <= 0) {
    errors.valor = 'O valor deve ser maior que zero.'
  }

  if (!input.descricao || input.descricao.trim() === '') {
    errors.descricao = 'Informe a descrição.'
  }

  if (!input.clienteNome || input.clienteNome.trim() === '') {
    errors.clienteNome = 'Informe o cliente/empresa.'
  }

  if (!input.categoriaId) {
    errors.categoriaId = 'Selecione uma categoria.'
  }

  if (!input.data || input.data.trim() === '') {
    errors.data = 'Informe a data.'
  } else if (!isValidIsoDate(input.data)) {
    errors.data = 'Data inválida.'
  }

  return errors
}

export function hasErrors(errors: object): boolean {
  return Object.keys(errors).length > 0
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export interface PrecatorioFormInput {
  cedente: string
  valorOriginal: string
  valorAtualizado: string
  valorPago: string
}

export interface PrecatorioFormErrors {
  cedente?: string
  valorOriginal?: string
  valorAtualizado?: string
  valorPago?: string
}

export function validatePrecatorioForm(input: PrecatorioFormInput): PrecatorioFormErrors {
  const errors: PrecatorioFormErrors = {}

  if (!input.cedente || input.cedente.trim() === '') {
    errors.cedente = 'Informe o cedente.'
  }

  const normalizedOriginal = normalizeAmountInput(input.valorOriginal)
  if (!input.valorOriginal || input.valorOriginal.trim() === '') {
    errors.valorOriginal = 'Informe o valor original.'
  } else if (normalizedOriginal === '' || Number(normalizedOriginal) <= 0) {
    errors.valorOriginal = 'O valor original deve ser maior que zero.'
  }

  const normalizedAtualizado = normalizeAmountInput(input.valorAtualizado)
  if (!input.valorAtualizado || input.valorAtualizado.trim() === '') {
    errors.valorAtualizado = 'Informe o valor atualizado.'
  } else if (normalizedAtualizado === '' || Number(normalizedAtualizado) <= 0) {
    errors.valorAtualizado = 'O valor atualizado deve ser maior que zero.'
  }

  if (input.valorPago && input.valorPago.trim() !== '') {
    const normalizedPago = normalizeAmountInput(input.valorPago)
    if (normalizedPago === '' || Number(normalizedPago) <= 0) {
      errors.valorPago = 'O valor pago deve ser maior que zero.'
    }
  }

  return errors
}
