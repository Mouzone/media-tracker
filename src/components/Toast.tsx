import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import clsx from 'clsx'

type ToastTone = 'success' | 'error' | 'info'

interface Toast {
  id: number
  tone: ToastTone
  message: string
}

interface ToastContextValue {
  toast: (message: string, tone?: ToastTone) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

const TONE_STYLES: Record<ToastTone, { icon: typeof Info; accent: string }> = {
  success: { icon: CheckCircle2, accent: 'text-emerald-500 dark:text-emerald-400' },
  error: { icon: AlertCircle, accent: 'text-red-500 dark:text-red-400' },
  info: { icon: Info, accent: 'text-primary-500 dark:text-primary-400' },
}

const DISMISS_AFTER_MS = 4000

/**
 * Replaces the browser `alert()` calls that used to report save, upload, and
 * delete failures. Those blocked the main thread, couldn't be styled, and looked
 * broken in an installed PWA.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (message: string, tone: ToastTone = 'info') => {
      const id = nextId.current++
      setToasts((current) => [...current, { id, tone, message }])
      window.setTimeout(() => dismiss(id), DISMISS_AFTER_MS)
    },
    [dismiss],
  )

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-center gap-2 p-4 pt-[max(1rem,env(safe-area-inset-top))]"
        role="status"
        aria-live="polite"
      >
        {toasts.map((item) => {
          const { icon: Icon, accent } = TONE_STYLES[item.tone]
          return (
            <div
              key={item.id}
              className="glass-panel pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl px-4 py-3 motion-safe:animate-toast-in"
            >
              <Icon className={clsx('mt-0.5 h-5 w-5 shrink-0', accent)} aria-hidden="true" />
              <p className="flex-1 text-sm font-medium leading-snug text-gray-900 dark:text-gray-100">
                {item.message}
              </p>
              <button
                onClick={() => dismiss(item.id)}
                className="focus-ring -m-1 rounded-full p-1 text-gray-400 transition-colors hover:text-gray-900 dark:hover:text-gray-100"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context.toast
}
