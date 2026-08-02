"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useId, useRef, useState, type ReactNode } from "react"
import { useReducedMotion } from "framer-motion"
import { MenuIcon, XIcon } from "lucide-react"

import { useAuth } from "@/app/providers/AuthProvider"
import ProfileFace from "@/app/components/Shared/ProfileFace"
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
  initials?: string
  /** Profile photo URL; falls back to the signed-in user's image */
  image?: string | null
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
  initials: initialsProp,
  image: imageProp,
  groups,
  children,
}: DashShellProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const initials = initialsProp || initialsFromName(displayName)
  const image = imageProp ?? user?.image ?? null
  const pageRef = useRef<HTMLDivElement | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const sideId = useId()

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false)
    }
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    document.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener("keydown", onKey)
    }
  }, [menuOpen])

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

  const closeMenu = () => setMenuOpen(false)

  const renderNavItem = (item: DashNavItem) => {
    const active =
      item.active ??
      (item.href !== "#" &&
        (pathname === item.href || pathname.startsWith(`${item.href}/`)))

    if (item.onClick) {
      return (
        <button
          key={item.label}
          type="button"
          className={`dash-link${active ? " is-active" : ""}`}
          onClick={() => {
            item.onClick?.()
            closeMenu()
          }}
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
          className="dash-link dash-link--logout"
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
        onClick={closeMenu}
      >
        {item.icon}
        <span>{item.label}</span>
        {item.pill != null ? (
          <span className="dash-link__pill">{item.pill}</span>
        ) : null}
      </Link>
    )
  }

  return (
    <div
      className={`dash-page${menuOpen ? " is-menu-open" : ""}`}
      data-role={role}
      ref={pageRef}
    >
      <div className="dash-topbar">
        <button
          type="button"
          className="dash-menu-btn"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls={sideId}
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? <XIcon size={22} /> : <MenuIcon size={22} />}
        </button>
        <div className="dash-topbar__brand">
          <ProfileFace
            image={image}
            initials={initials}
            className="dash-avatar-sm"
          />
          <div>
            <strong>{displayName}</strong>
            <small>{roleLabel}</small>
          </div>
        </div>
      </div>

      <button
        type="button"
        className="dash-backdrop"
        aria-label="Close menu"
        tabIndex={menuOpen ? 0 : -1}
        onClick={closeMenu}
      />

      <div className="dash">
        <aside
          id={sideId}
          className={`dash-side${menuOpen ? " is-open" : ""}`}
          aria-hidden={false}
        >
          <div className="dash-side__head">
            <div className="dash-user">
              <div className="dash-user__face">
                <ProfileFace
                  image={image}
                  initials={initials}
                  className="dash-avatar-sm"
                />
                {online ? (
                  <span
                    className="dash-user__online"
                    aria-label="Online"
                    title="Online"
                  />
                ) : null}
              </div>
              <div className="dash-user__meta">
                <div className="dash-user__name">{displayName}</div>
                <div className="dash-user__role">{roleLabel}</div>
              </div>
            </div>
            <button
              type="button"
              className="dash-side__close"
              aria-label="Close sidebar"
              onClick={closeMenu}
            >
              <XIcon size={18} />
            </button>
          </div>

          {groups.map((group) => (
            <div key={group.label} className="dash-side__group">
              <div className="dash-sec">{group.label}</div>
              <nav className="dash-nav" aria-label={group.label}>
                {group.items.map((item) => renderNavItem(item))}
              </nav>
            </div>
          ))}
        </aside>
        <div className="dash-main">{children}</div>
      </div>
    </div>
  )
}
