import { reactive } from 'vue'

export type ToastKind = 'success' | 'error' | 'info'

export interface ToastItem {
  id: number
  message: string
  kind: ToastKind
}

const toasts = reactive<ToastItem[]>([])
let nextId = 1
const TIMEOUT_MS = 4500

function dismiss(id: number): void {
  const index = toasts.findIndex((t) => t.id === id)
  if (index !== -1) toasts.splice(index, 1)
}

function push(message: string, kind: ToastKind): void {
  const id = nextId++
  toasts.push({ id, message, kind })
  setTimeout(() => dismiss(id), TIMEOUT_MS)
}

/** Tiny app-wide toast/snackbar system. No alert()/confirm() usage anywhere in the app. */
export function useToast() {
  return {
    toasts,
    success: (message: string) => push(message, 'success'),
    error: (message: string) => push(message, 'error'),
    info: (message: string) => push(message, 'info'),
    dismiss,
  }
}
