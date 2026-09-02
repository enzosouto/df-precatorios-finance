import { apiClient } from './client'
import type { Transaction, TransactionListResponse, TransactionType } from '@/types'

export interface TransactionQuery {
  startDate?: string
  endDate?: string
  type?: TransactionType
  categoryId?: string
  search?: string
  clientName?: string
  page?: number
  pageSize?: number
}

export interface TransactionInput {
  type: TransactionType
  amount: string
  description: string
  clientName: string
  categoryId: string
  transactionDate: string
}

export async function fetchTransactions(query: TransactionQuery): Promise<TransactionListResponse> {
  const { data } = await apiClient.get<TransactionListResponse>('/transactions', { params: query })
  return data
}

export async function fetchTransaction(id: string): Promise<Transaction> {
  const { data } = await apiClient.get<Transaction>(`/transactions/${id}`)
  return data
}

export async function createTransaction(input: TransactionInput): Promise<Transaction> {
  const { data } = await apiClient.post<Transaction>('/transactions', input)
  return data
}

export async function updateTransaction(id: string, input: Partial<TransactionInput>): Promise<Transaction> {
  const { data } = await apiClient.put<Transaction>(`/transactions/${id}`, input)
  return data
}

export async function deleteTransaction(id: string): Promise<void> {
  await apiClient.delete(`/transactions/${id}`)
}
