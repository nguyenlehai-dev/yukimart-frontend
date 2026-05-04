import { reactive } from 'vue'

export type ToastTone = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: number
  tone: ToastTone
  title: string
  message?: string
}

const state = reactive<{ toasts: Toast[] }>({ toasts: [] })

let nextId = 1

function push(tone: ToastTone, title: string, message?: string) {
  const id = nextId++
  state.toasts.push({ id, tone, title, message })
  setTimeout(() => {
    const idx = state.toasts.findIndex((t) => t.id === id)
    if (idx >= 0) state.toasts.splice(idx, 1)
  }, 3500)
}

export function useToast() {
  return {
    toasts: state.toasts,
    success: (title: string, message?: string) => push('success', title, message),
    error: (title: string, message?: string) => push('error', title, message),
    info: (title: string, message?: string) => push('info', title, message),
    warning: (title: string, message?: string) => push('warning', title, message),
    dismiss: (id: number) => {
      const idx = state.toasts.findIndex((t) => t.id === id)
      if (idx >= 0) state.toasts.splice(idx, 1)
    },
  }
}
