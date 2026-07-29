"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef, type ReactNode } from "react"
import { useReducedMotion } from "framer-motion"

import { useAuth } from "@/app/providers/AuthProvider"
import { initialsFromName } from "@/lib/auth/types"
import type { AuthRole } from "@/lib/auth/types"

import "./dashboard.css"

export type DashNavItem = {
  label: string
  href: string
  icon: ReactNode
  pill?: number | string
  active?: boolean
  onClick?: () => void
}

export type DashNavGroup = {
  label: string
  items: DashNavItem[]
}

type DashShellProps = {
  role: AuthRole
  displayName: string
  roleLabel: string
  online?: boolean
  groups: DashNavGroup[]
  children: ReactNode
}

export function useReveal(deps: unknown[] = []) {
  const reduceMotion = useReducedMotion() ?? false
  const rootRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const nodes = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"))
    if (reduceMotion) {
      nodes.forEach((el) => el.classList.add("is-in"))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in")
            io.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.12 }
    )
    nodes.forEach((el) => io.observe(el))
    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion, ...deps])

  return rootRef
}

function formatCount(value: number, decimals: number, grouped: boolean) {
  if (decimals > 0) return value.toFixed(decimals)
  const rounded = Math.round(value)
  return grouped ? rounded.toLocaleString("en-IN") : String(rounded)
}

export function useCountUp(
  target: number,
  enabled: boolean,
  decimals = 0,
  duration = 1300,
  grouped = false
) {
  const reduceMotion = useReducedMotion() ?? false
  const ref = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!enabled || reduceMotion) {
      el.textContent = formatCount(target, decimals, grouped)
      return
    }
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      const value = target * eased
      el.textContent = formatCount(value, decimals, grouped)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, enabled, decimals, duration, reduceMotion, grouped])

  return ref
}

export default function DashShell({
  role,
  displayName,
  roleLabel,
  online,
  groups,
  children,
}: DashShellProps) {
  const pathname = usePathname()
  const { logout } = useAuth()
  const initials = initialsFromName(displayName)
  const pageRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const root = pageRef.current
    if (!root) return
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      const btn = target?.closest(".dash-btn") as HTMLElement | null
      if (!btn || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
        return
      const rect = btn.getBoundingClientRect()
      const size = Math.max(rect.width, rect.height)
      const ripple = document.createElement("span")
      ripple.className = "dash-ripple"
      ripple.style.width = `${size}px`
      ripple.style.height = `${size}px`
      ripple.style.left = `${event.clientX - rect.left - size / 2}px`
      ripple.style.top = `${event.clientY - rect.top - size / 2}px`
      btn.appendChild(ripple)
      window.setTimeout(() => ripple.remove(), 520)
    }
    root.addEventListener("click", onClick)
    return () => root.removeEventListener("click", onClick)
  }, [])

  return (
    <div className="dash-page" data-role={role} ref={pageRef}>
      <div className="dash">
        <aside className="dash-side">
          <div className="dash-user">
            <span className="dash-avatar-sm">{initials}</span>
            <div>
              <div className="dash-user__name">
                {displayName}
                {online ? <span className="dash-user__online" /> : null}
              </div>
              <div className="dash-user__role">{roleLabel}</div>
            </div>
          </div>

          {groups.map((group) => (
            <div key={group.label}>
              <div className="dash-sec">{group.label}</div>
              <nav className="dash-nav" aria-label={group.label}>
                {group.items.map((item) => {
                  const active =
                    item.active ??
                    (item.href !== "#" &&
                      (pathname === item.href ||
                        pathname.startsWith(`${item.href}/`)))
                  if (item.onClick) {
                    return (
                      <button
                        key={item.label}
                        type="button"
                        className={`dash-link${active ? " is-active" : ""}`}
                        onClick={item.onClick}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                        {item.pill != null ? (
                          <span className="dash-link__pill">{item.pill}</span>
                        ) : null}
                      </button>
                    )
                  }
                  if (item.label === "Log out") {
                    return (
                      <button
                        key={item.label}
                        type="button"
                        className="dash-link"
                        onClick={() =>
                          void logout().then(() => {
                            window.location.href = "/"
                          })
                        }
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </button>
                    )
                  }
                  return (
                    <Link
                      key={item.label + item.href}
                      href={item.href}
                      className={`dash-link${active ? " is-active" : ""}`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                      {item.pill != null ? (
                        <span className="dash-link__pill">{item.pill}</span>
                      ) : null}
                    </Link>
                  )
                })}
              </nav>
            </div>
          ))}
        </aside>
        <div className="dash-main">{children}</div>
      </div>
    </div>
  )
}
