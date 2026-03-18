/**
 * Simple Logger utility wrapper
 */

export const Logger = {
  info: (message: string, ...args: any[]) => {
    if (import.meta.env.DEV) {
      console.info(`[INFO] ${message}`, ...args)
    }
  },
  
  warn: (message: string, ...args: any[]) => {
    if (import.meta.env.DEV) {
      console.warn(`[WARN] ${message}`, ...args)
    }
  },

  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error)
    // Here we can also add logic to send this error to Sentry or another tracking service
  }
}
