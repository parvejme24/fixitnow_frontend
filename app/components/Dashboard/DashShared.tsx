"use client"

import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
  type RefObject,
} from "react"
import { createPortal } from "react-dom"

import { useCountUp } from "./DashShell"

export function StatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase().replace(/\s+/g, "_")
  return (
    <span className={`status-badge status-badge--${key}`}>
      {status.replace(/_/g, " ")}
    </span>
  )
}

export function StatCard({
  icon,
  value,
  label,
  delta,
  deltaDir = "up",
  variant,
  prefix = "",
  decimals = 0,
  delay = 0,
  animate = true,
}: {
  icon: ReactNode
  value: number
  label: string
  delta: string
  deltaDir?: "up" | "down"
  variant?: "sky" | "violet" | "signal" | "flare"
  prefix?: string
  decimals?: number
  delay?: number
  animate?: boolean
}) {
  const grouped = prefix === "৳"
  const ref = useCountUp(value, animate, decimals, 1300, grouped)
  return (
    <div
      className="stat-card"
      data-reveal
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className={`stat-card__icon${variant ? ` stat-card__icon--${variant}` : ""}`}
      >
        {icon}
      </div>
      <p className="stat-card__value">
        {prefix}
        <span ref={ref as RefObject<HTMLSpanElement>}>
          {decimals > 0
            ? value.toFixed(decimals)
            : grouped
              ? Math.round(value).toLocaleString("en-IN")
              : Math.round(value)}
        </span>
      </p>
      <p className="stat-card__label">{label}</p>
      <p className={`stat-card__delta ${deltaDir}`}>{delta}</p>
    </div>
  )
}

export function DashTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: string[]
  active: string
  onChange: (tab: string) => void
}) {
  return (
    <div className="dash-tabs" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          role="tab"
          aria-selected={active === tab}
          className={`dash-tab${active === tab ? " is-active" : ""}`}
          onClick={() => onChange(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}

export function DashToastHost({
  toasts,
}: {
  toasts: { id: string; title: string; message: string; tone?: "error" | "default" }[]
}) {
  if (!toasts.length || typeof document === "undefined") return null
  return createPortal(
    <div className="dash-toasts" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`dash-toast${t.tone === "error" ? " dash-toast--error" : ""}`}
          role="status"
        >
          <strong>{t.title}</strong>
          <span>{t.message}</span>
          <i className="dash-toast__bar" />
        </div>
      ))}
    </div>,
    document.body
  )
}

export function DashModal({
  open,
  title,
  children,
  onClose,
  actions,
}: {
  open: boolean
  title: string
  children: ReactNode
  onClose: () => void
  actions: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener("keydown", onKey)
    }
  }, [open, onClose])

  if (!open || typeof document === "undefined") return null

  return createPortal(
    <div className="dash-modal" role="dialog" aria-modal="true" aria-label={title}>
      <button
        type="button"
        className="dash-modal__backdrop"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        className="dash-modal__panel"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <h3 className="dash-modal__title">{title}</h3>
        <div className="dash-modal__body">{children}</div>
        <div className="dash-modal__actions">{actions}</div>
      </div>
    </div>,
    document.body
  )
}

export function useDashToasts() {
  const [toasts, setToasts] = useState<
    { id: string; title: string; message: string; tone?: "error" | "default" }[]
  >([])
  const pushToast = useCallback(
    (title: string, message: string, tone: "error" | "default" = "default") => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      setToasts((prev) => [...prev, { id, title, message, tone }])
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 3600)
    },
    []
  )
  return { toasts, pushToast }
}
