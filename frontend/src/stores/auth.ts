import { defineStore } from 'pinia'
import { fetchCurrentUser, login as apiLogin, logout as apiLogout } from '@/api/auth'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  status: 'idle' | 'checking' | 'ready'
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    status: 'idle',
  }),
  getters: {
    isAuthenticated: (state) => state.user !== null,
  },
  actions: {
    /** Calls GET /auth/me to determine whether a session cookie is currently valid. */
    async checkSession(): Promise<void> {
      this.status = 'checking'
      try {
        this.user = await fetchCurrentUser()
      } catch {
        this.user = null
      } finally {
        this.status = 'ready'
      }
    },
    async login(email: string, password: string): Promise<void> {
      this.user = await apiLogin(email, password)
      this.status = 'ready'
    },
    async logout(): Promise<void> {
      try {
        await apiLogout()
      } finally {
        this.clearSession()
      }
    },
    clearSession(): void {
      this.user = null
      this.status = 'ready'
    },
  },
})
