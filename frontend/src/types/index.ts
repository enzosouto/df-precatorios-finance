export type TransactionType = 'RECEITA' | 'DESPESA'

export interface User {
  id: string
  name: string
  email: string
}

export interface Category {
  id: string
  name: string
  type: TransactionType
}

export interface TransactionCategory {
  id: string
  name: string
}

export interface Transaction {
  id: string
  type: TransactionType
  amount: string
  description: string
  clientName: string | null
  category: TransactionCategory
  transactionDate: string
  createdAt: string
  updatedAt: string
}

export interface TransactionListResponse {
  items: Transaction[]
  total: number
}

export interface DashboardSummary {
  caixaTotal: string
  receitasPeriodo: string
  despesasPeriodo: string
  saldoPeriodo: string
  hasAnyTransactions: boolean
}

export interface TopCategoria {
  categoryName: string
  total: string
}

export interface MonthlyReportEntry {
  month: string
  receitas: string
  despesas: string
}

export interface ReportsResponse {
  receitas: string
  despesas: string
  saldo: string
  topDespesaCategorias: TopCategoria[]
  topReceitaCategorias: TopCategoria[]
  monthly: MonthlyReportEntry[]
}

export interface Precatorio {
  id: string
  cedente: string
  valorOriginal: string
  valorAtualizado: string
  diferenca: string
  valorPago: string | null
  createdAt: string
  updatedAt: string
}

export interface PrecatorioListResponse {
  items: Precatorio[]
  total: number
}

export interface ApiErrorBody {
  error: string
}

export type PeriodMode = 'dia' | 'mes' | 'ano' | 'personalizado'

export interface DateRange {
  startDate: string
  endDate: string
}
