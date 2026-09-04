export type TransactionType = 'RECEITA' | 'DESPESA'

export type Socio = 'CHIQUINHO' | 'FILIPI' | 'LOMAR'

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
  socios: Socio[]
  category: TransactionCategory
  transactionDate: string
  createdAt: string
  updatedAt: string
}

export interface TransactionTotals {
  receitas: string
  despesas: string
  saldo: string
}

export interface TransactionListResponse {
  items: Transaction[]
  total: number
  totals: TransactionTotals
}

export interface SocioTotals {
  receitas: string
  despesas: string
  saldo: string
}

export interface SocioBreakdown extends SocioTotals {
  socio: Socio
}

export interface DashboardSummary {
  caixaTotal: string
  receitasPeriodo: string
  despesasPeriodo: string
  saldoPeriodo: string
  hasAnyTransactions: boolean
  porSocio: SocioBreakdown[]
  cotaIgualPeriodo: SocioTotals
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
  porSocio: SocioBreakdown[]
  cotaIgual: SocioTotals
}

export type DocumentoTipo = 'PROCURACAO' | 'ESCRITURA'
export type OrigemPrecatorio = 'GDF' | 'FEDERAL' | 'OUTRO'

export interface Precatorio {
  id: string
  cedente: string
  valorAtualizado: string
  valorVendido: string | null
  valorPago: string
  comissoes: string[]
  percentualPago: string
  percentualVendido: string | null
  lucro: string | null
  tipoDocumento: DocumentoTipo | null
  numeroDocumento: string | null
  livro: string | null
  folha: string | null
  origem: OrigemPrecatorio
  origemOutro: string | null
  comprador: string | null
  createdAt: string
  updatedAt: string
}

export interface PrecatorioTotals {
  valorAtualizado: string
  valorPago: string
  valorVendido: string
  lucro: string
}

export interface PrecatorioListResponse {
  items: Precatorio[]
  total: number
  totals: PrecatorioTotals
  porSocio: PrecatorioTotals
}

export interface ApiErrorBody {
  error: string
}

export type PeriodMode = 'dia' | 'mes' | 'ano' | 'personalizado'

export interface DateRange {
  startDate: string
  endDate: string
}
