import { apiClient } from './client'
import type { Category, TransactionType } from '@/types'

export async function fetchCategories(type: TransactionType): Promise<Category[]> {
  const { data } = await apiClient.get<Category[]>('/categories', { params: { type } })
  return data
}

export async function createCategory(name: string, type: TransactionType): Promise<Category> {
  const { data } = await apiClient.post<Category>('/categories', { name, type })
  return data
}

export async function updateCategory(id: string, name: string): Promise<Category> {
  const { data } = await apiClient.put<Category>(`/categories/${id}`, { name })
  return data
}
