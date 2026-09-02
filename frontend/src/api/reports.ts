import { apiClient } from './client'
import type { DateRange, ReportsResponse } from '@/types'

export async function fetchReports(range: DateRange): Promise<ReportsResponse> {
  const { data } = await apiClient.get<ReportsResponse>('/reports', { params: range })
  return data
}
