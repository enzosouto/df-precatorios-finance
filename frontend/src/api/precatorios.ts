import { apiClient } from './client'
import type { Precatorio, PrecatorioListResponse } from '@/types'

export interface PrecatorioQuery {
  search?: string
  page?: number
  pageSize?: number
}

export interface PrecatorioInput {
  cedente: string
  valorOriginal: string
  valorAtualizado: string
  valorPago?: string | null
}

export async function fetchPrecatorios(query: PrecatorioQuery): Promise<PrecatorioListResponse> {
  const { data } = await apiClient.get<PrecatorioListResponse>('/precatorios', { params: query })
  return data
}

export async function fetchPrecatorio(id: string): Promise<Precatorio> {
  const { data } = await apiClient.get<Precatorio>(`/precatorios/${id}`)
  return data
}

export async function createPrecatorio(input: PrecatorioInput): Promise<Precatorio> {
  const { data } = await apiClient.post<Precatorio>('/precatorios', input)
  return data
}

export async function updatePrecatorio(id: string, input: Partial<PrecatorioInput>): Promise<Precatorio> {
  const { data } = await apiClient.put<Precatorio>(`/precatorios/${id}`, input)
  return data
}

export async function deletePrecatorio(id: string): Promise<void> {
  await apiClient.delete(`/precatorios/${id}`)
}
