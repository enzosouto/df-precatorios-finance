import axios, { AxiosError } from 'axios'
import type { ApiErrorBody } from '@/types'

const baseURL = import.meta.env.VITE_API_URL as string

export const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

/** Callback set by the auth store so the client can react to 401s without a circular import. */
let unauthorizedHandler: (() => void) | null = null

export function setUnauthorizedHandler(handler: () => void): void {
  unauthorizedHandler = handler
}

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    if (error.response?.status === 401 && unauthorizedHandler) {
      unauthorizedHandler()
    }
    return Promise.reject(error)
  },
)

/** Extracts a friendly pt-BR error message from an API error response. */
export function extractErrorMessage(error: unknown, fallback = 'Ocorreu um erro. Tente novamente.'): string {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as ApiErrorBody | undefined
    if (body?.error) return body.error
    if (error.code === 'ERR_NETWORK') return 'Não foi possível conectar ao servidor.'
  }
  return fallback
}
