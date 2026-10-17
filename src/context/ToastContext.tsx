import React, { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

export interface ToastItem {
  id: string
  title: string
  description?: string
  variant?: 'default' | 'success' | 'destructive' | 'ai'
  onUndo?: () => void
  duration?: number
}

interface ToastContextType {
  toast: (item: Omit<ToastItem, 'id'>) => void
  success: (title: string, description?: string, onUndo?: () => void) => void
  error: (title: string, description?: string) => void
  ai: (title: string, description?: string) => void
  info: (title: string, description?: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    ({ title, description, variant = 'default', onUndo, duration = 4000 }: Omit<ToastItem, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
      const newToast: ToastItem = { id, title, description, variant, onUndo, duration }
      setToasts((prev) => [...prev, newToast])

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id)
        }, duration)
      }
    },
    [removeToast]
  )

  const success = useCallback(
    (title: string, description?: string, onUndo?: () => void) => {
      toast({ title, description, variant: 'success', onUndo })
    },
    [toast]
  )

  const error = useCallback(
    (title: string, description?: string) => {
      toast({ title, description, variant: 'destructive' })
    },
    [toast]
  )

  const ai = useCallback(
    (title: string, description?: string) => {
      toast({ title, description, variant: 'ai' })
    },
    [toast]
  )

  const info = useCallback(
    (title: string, description?: string) => {
      toast({ title, description, variant: 'default' })
    },
    [toast]
  )

  return (
    <ToastContext.Provider value={{ toast, success, error, ai, info }}>
      {children}
      {/* Toast viewport */}
      <div
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-card border shadow-modal bg-surface text-fg text-sm animate-fade-in transition-all ${
              t.variant === 'ai'
                ? 'border-ai/40 bg-ai/5'
                : t.variant === 'success'
                ? 'border-success/30 bg-success/5'
                : t.variant === 'destructive'
                ? 'border-danger/30 bg-danger/5'
                : 'border-border bg-surface'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {t.variant === 'success' && <CheckCircle2 className="w-4 h-4 text-success" />}
              {t.variant === 'destructive' && <AlertCircle className="w-4 h-4 text-danger" />}
              {t.variant === 'ai' && <div className="w-2 h-2 rounded-full bg-ai animate-ping" />}
              {t.variant === 'default' && <Info className="w-4 h-4 text-primary" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-xs text-fg leading-tight">{t.title}</div>
              {t.description && (
                <div className="text-[11px] text-fg-muted mt-0.5 leading-snug">{t.description}</div>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {t.onUndo && (
                <button
                  onClick={() => {
                    t.onUndo?.()
                    removeToast(t.id)
                  }}
                  className="text-xs font-semibold text-primary hover:underline px-1 py-0.5"
                >
                  Undo
                </button>
              )}
              <button
                onClick={() => removeToast(t.id)}
                className="text-fg-muted hover:text-fg p-0.5 rounded"
                aria-label="Close notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
