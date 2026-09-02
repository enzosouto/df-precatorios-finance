import { apiClient } from './client'
import type { DashboardSummary, DateRange } from '@/types'

export async function fetchDashboardSummary(range: DateRange): Promise<DashboardSummary> {
  const { data } = await apiClient.get<DashboardSummary>('/dashboard/summary', { params: range })
  return data
}
