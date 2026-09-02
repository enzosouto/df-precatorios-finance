import { apiClient } from './client'
import type { User } from '@/types'

export async function login(email: string, password: string): Promise<User> {
  const { data } = await apiClient.post<{ user: User }>('/auth/login', { email, password })
  return data.user
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout')
}

export async function fetchCurrentUser(): Promise<User> {
  const { data } = await apiClient.get<{ user: User }>('/auth/me')
  return data.user
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await apiClient.put('/auth/password', { currentPassword, newPassword })
}
