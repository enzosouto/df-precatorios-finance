import { normalizeAmountInput } from './format'

export interface TransactionFormInput {
  tipo: 'RECEITA' | 'DESPESA' | ''
  valor: string
  descricao: string
  clienteNome: string
  categoriaId: string
  data: string
  socios: Array<'CHIQUINHO' | 'FILIPI' | 'LOMAR'>
}

export interface TransactionFormErrors {
  tipo?: string
  valor?: string
  descricao?: string
  clienteNome?: string
  categoriaId?: string
  data?: string
  socios?: string
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

  if (!input.categoriaId) {
    errors.categoriaId = 'Selecione uma categoria.'
  }

  if (!input.data || input.data.trim() === '') {
    errors.data = 'Informe a data.'
  } else if (!isValidIsoDate(input.data)) {
    errors.data = 'Data inválida.'
  }

  if (input.socios.length === 0) {
    errors.socios = 'Selecione ao menos um sócio.'
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
  valorAtualizado: string
  valorVendido: string
  valorPago: string
  comissoes: string[]
  tipoDocumento: 'PROCURACAO' | 'ESCRITURA' | ''
  numeroDocumento: string
  livro: string
  folha: string
  origem: 'GDF' | 'FEDERAL' | 'OUTRO' | ''
  origemOutro: string
  comprador: string
}

export interface PrecatorioFormErrors {
  cedente?: string
  valorAtualizado?: string
  valorVendido?: string
  valorPago?: string
  comissoes?: string
  numeroDocumento?: string
  folha?: string
  origem?: string
  origemOutro?: string
  comprador?: string
}

const LIVRO_REGEX = /^\d+[A-Za-z]?$/
const FOLHA_REGEX = /^\d+(-\d+)?$/

export function validatePrecatorioForm(input: PrecatorioFormInput): PrecatorioFormErrors {
  const errors: PrecatorioFormErrors = {}

  if (!input.cedente || input.cedente.trim() === '') {
    errors.cedente = 'Informe o cedente.'
  }

  const normalizedAtualizado = normalizeAmountInput(input.valorAtualizado)
  if (!input.valorAtualizado || input.valorAtualizado.trim() === '') {
    errors.valorAtualizado = 'Informe o valor do precatório.'
  } else if (normalizedAtualizado === '' || Number(normalizedAtualizado) <= 0) {
    errors.valorAtualizado = 'O valor do precatório deve ser maior que zero.'
  }

  if (!input.valorPago || input.valorPago.trim() === '') {
    errors.valorPago = 'Informe quanto você pagou.'
  } else {
    const normalizedPago = normalizeAmountInput(input.valorPago)
    if (normalizedPago === '' || Number(normalizedPago) < 0) {
      errors.valorPago = 'O valor pago deve ser maior ou igual a zero.'
    }
  }

  if (input.valorVendido && input.valorVendido.trim() !== '') {
    const normalizedVendido = normalizeAmountInput(input.valorVendido)
    if (normalizedVendido === '' || Number(normalizedVendido) < 0) {
      errors.valorVendido = 'O valor vendido deve ser maior ou igual a zero.'
    }
  }

  const comissaoInvalida = input.comissoes.some((c) => {
    if (c.trim() === '') return false
    const normalized = normalizeAmountInput(c)
    return normalized === '' || Number(normalized) < 0
  })
  if (comissaoInvalida) {
    errors.comissoes = 'Cada comissão deve ser maior ou igual a zero.'
  }

  const temTipoDocumento = input.tipoDocumento.trim() !== ''
  const temNumeroDocumento = input.numeroDocumento.trim() !== ''
  if (temTipoDocumento !== temNumeroDocumento) {
    errors.numeroDocumento = 'Informe o tipo e o número do documento juntos, ou deixe ambos em branco.'
  }

  const temLivro = input.livro.trim() !== ''
  const temFolha = input.folha.trim() !== ''
  if (temLivro !== temFolha) {
    errors.folha = 'Informe o livro e a folha juntos, ou deixe ambos em branco.'
  } else if (temLivro && !LIVRO_REGEX.test(input.livro.trim())) {
    errors.folha = 'Livro deve ser um número, opcionalmente seguido de uma letra (ex: "42" ou "42A").'
  } else if (temFolha && !FOLHA_REGEX.test(input.folha.trim())) {
    errors.folha = 'Folha deve ser um número (ex: "15") ou um intervalo (ex: "15-17").'
  }

  if (input.origem !== 'GDF' && input.origem !== 'FEDERAL' && input.origem !== 'OUTRO') {
    errors.origem = 'Selecione a origem (GDF, Federal ou Outro).'
  } else if (input.origem === 'OUTRO' && input.origemOutro.trim() === '') {
    errors.origemOutro = 'Descreva a origem.'
  }

  return errors
}
