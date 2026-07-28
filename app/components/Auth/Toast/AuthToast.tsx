"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { AlertCircleIcon, CheckCircle2Icon } from "lucide-react"

type ToastKind = "success" | "error"

type ToastItem = {
  id: string
  kind: ToastKind
  title: string
  message: string
  leaving?: boolean
}

type ToastContextValue = {
  pushToast: (toast: Omit<ToastItem, "id" | "leaving">) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useAuthToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useAuthToast must be used within AuthToastProvider")
  return ctx
}

export function AuthToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, leaving: true } : t))
    )
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 300)
  }, [])

  const pushToast = useCallback(
    (toast: Omit<ToastItem, "id" | "leaving">) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      setToasts((prev) => [...prev, { ...toast, id }])
      window.setTimeout(() => removeToast(id), 3600)
    },
    [removeToast]
  )

  const value = useMemo(() => ({ pushToast }), [pushToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="auth-toasts" aria-live="polite">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`auth-toast auth-toast--${toast.kind}${toast.leaving ? " is-leaving" : ""}`}
            role="status"
          >
            <div className="auth-toast__row">
              {toast.kind === "success" ? (
                <CheckCircle2Icon className="auth-toast__icon size-4 shrink-0" />
              ) : (
                <AlertCircleIcon className="auth-toast__icon size-4 shrink-0" />
              )}
              <div>
                <p className="auth-toast__title">{toast.title}</p>
                <p className="auth-toast__msg">{toast.message}</p>
              </div>
            </div>
            <span className="auth-toast__bar" aria-hidden="true" />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useReveal() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setVisible(true))
    return () => window.cancelAnimationFrame(id)
  }, [])

  return visible
}
