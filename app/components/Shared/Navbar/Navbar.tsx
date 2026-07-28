"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useId, useState } from "react"
import { ArrowRightIcon, WrenchIcon } from "lucide-react"

import { cn } from "@/lib/utils"

const navLinks = [
  { label: "Home", href: "/", index: "01" },
  { label: "Browse services", href: "/services", index: "02" },
  { label: "Technicians", href: "/technicians", index: "03" },
  { label: "My bookings", href: "/bookings", index: "04" },
] as const

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(`${href}/`)
}

function Logo({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link
      href="/"
      onClick={onNavigate}
      className="group/logo flex min-w-0 items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC93C] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0E141B]"
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-[6px] bg-[#131B24] ring-1 ring-[#2A3642] transition-transform duration-300 ease-out motion-safe:group-hover/logo:rotate-12 motion-reduce:transition-none">
        <WrenchIcon className="size-4 text-[#FFC93C]" strokeWidth={2.25} />
      </span>

      <span className="flex min-w-0 flex-col leading-none">
        <span
          className="truncate text-[1.15rem] tracking-tight text-white sm:text-[1.25rem]"
          style={{ fontFamily: "var(--font-dispatch-display), sans-serif" }}
        >
          Fix<span className="text-[#FFC93C]">It</span>Now
        </span>
        <span
          className="mt-0.5 hidden text-[9px] tracking-[0.18em] text-[#6B7F8C] uppercase sm:block"
          style={{ fontFamily: "var(--font-dispatch-mono), monospace" }}
        >
          Dhaka · Live
        </span>
      </span>
    </Link>
  )
}

function BurgerIcon({ open }: { open: boolean }) {
  return (
    <span className="relative block size-5" aria-hidden>
      <span
        className={cn(
          "absolute left-0 block h-[2px] w-5 bg-white transition-all duration-300 ease-out motion-reduce:transition-none",
          open ? "top-[9px] rotate-45" : "top-[4px] rotate-0"
        )}
      />
      <span
        className={cn(
          "absolute top-[9px] left-0 block h-[2px] w-5 bg-white transition-all duration-300 ease-out motion-reduce:transition-none",
          open ? "scale-x-0 opacity-0" : "scale-x-100 opacity-100"
        )}
      />
      <span
        className={cn(
          "absolute left-0 block h-[2px] w-5 bg-white transition-all duration-300 ease-out motion-reduce:transition-none",
          open ? "top-[9px] -rotate-45" : "top-[14px] rotate-0"
        )}
      />
    </span>
  )
}

export default function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [elevated, setElevated] = useState(false)
  const [lastPathname, setLastPathname] = useState(pathname)
  const menuId = useId()

  // Close mobile menu when the route changes (React-recommended render sync)
  if (pathname !== lastPathname) {
    setLastPathname(pathname)
    setOpen(false)
  }

  useEffect(() => {
    const onScroll = () => setElevated(window.scrollY > 4)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open])

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full bg-[#0E141B] transition-shadow duration-300 ease-out motion-reduce:transition-none",
        elevated && "shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
      )}
    >
      {/* Hi-vis hazard stripe — top edge only */}
      <div
        className="h-[3px] w-full bg-[#FFC93C]"
        aria-hidden
      />

      <div className="mx-auto flex h-[68px] w-full max-w-[1240px] items-center gap-4 px-4 sm:px-6">
        <Logo onNavigate={() => setOpen(false)} />

        <nav
          aria-label="Primary"
          className="hidden flex-1 items-center justify-center gap-1 lg:flex"
          style={{ fontFamily: "var(--font-dispatch-sans), sans-serif" }}
        >
          {navLinks.map((link) => {
            const active = isActive(pathname, link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group/link flex items-center gap-2 px-3 py-2 text-[0.9375rem] font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC93C] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0E141B]",
                  active
                    ? "text-white"
                    : "text-[#9AABB8] hover:text-[#D5DEE5]"
                )}
              >
                <span
                  className={cn(
                    "h-4 w-[3px] shrink-0 rounded-full transition-colors",
                    active ? "bg-[#FFC93C]" : "bg-transparent"
                  )}
                  aria-hidden
                />
                <span
                  className={cn(
                    "font-normal tracking-wider transition-colors",
                    active
                      ? "text-[#FFC93C]"
                      : "text-[#4A5C6A] group-hover/link:text-[#6B7F8C]"
                  )}
                  style={{
                    fontFamily: "var(--font-dispatch-mono), monospace",
                    fontSize: "0.68rem",
                  }}
                >
                  {link.index}
                </span>
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div
          className="ml-auto hidden items-center gap-2.5 lg:flex"
          style={{ fontFamily: "var(--font-dispatch-sans), sans-serif" }}
        >
          <Link
            href="/auth/login"
            className="inline-flex h-9 items-center justify-center rounded-[9px] border border-[#4A5C6A] bg-transparent px-4 text-sm font-medium text-white transition-colors hover:border-[#9AABB8] hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC93C] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0E141B]"
          >
            Log in
          </Link>
          <Link
            href="/auth/register"
            className="group/cta inline-flex h-9 items-center justify-center gap-1.5 rounded-[9px] bg-[#FFC93C] px-4 text-sm font-semibold text-[#0E141B] transition-colors hover:bg-[#FFD45C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC93C] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0E141B]"
          >
            Get started
            <ArrowRightIcon className="size-3.5 transition-transform duration-300 ease-out motion-safe:group-hover/cta:translate-x-0.5 motion-reduce:transition-none" />
          </Link>
        </div>

        <button
          type="button"
          className="ml-auto inline-flex size-10 items-center justify-center rounded-[9px] text-white transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC93C] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0E141B] lg:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => setOpen((v) => !v)}
        >
          <BurgerIcon open={open} />
        </button>
      </div>

      {/* Mobile dropdown — under the bar */}
      <div
        id={menuId}
        className={cn(
          "grid overflow-hidden border-t border-[#1C2733] bg-[#131B24] transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none lg:hidden",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="min-h-0">
          <nav
            aria-label="Mobile"
            className="mx-auto flex max-w-[1240px] flex-col px-4 py-3 sm:px-6"
            style={{ fontFamily: "var(--font-dispatch-sans), sans-serif" }}
          >
            {navLinks.map((link) => {
              const active = isActive(pathname, link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 border-b border-[#1C2733] py-3.5 text-lg font-semibold transition-colors last:border-b-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC93C] focus-visible:ring-inset",
                    active ? "text-white" : "text-[#9AABB8] hover:text-white"
                  )}
                >
                  <span
                    className={cn(
                      "w-6 text-[0.7rem] tracking-wider",
                      active ? "text-[#FFC93C]" : "text-[#4A5C6A]"
                    )}
                    style={{
                      fontFamily: "var(--font-dispatch-mono), monospace",
                    }}
                  >
                    {link.index}
                  </span>
                  {active && (
                    <span
                      className="h-5 w-[3px] rounded-full bg-[#FFC93C]"
                      aria-hidden
                    />
                  )}
                  {link.label}
                </Link>
              )
            })}

            <div className="flex flex-col gap-2.5 pt-5 pb-3">
              <Link
                href="/auth/login"
                onClick={() => setOpen(false)}
                className="inline-flex h-11 items-center justify-center rounded-[9px] border border-[#4A5C6A] text-sm font-medium text-white transition-colors hover:border-[#9AABB8] hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC93C] focus-visible:ring-offset-2 focus-visible:ring-offset-[#131B24]"
              >
                Log in
              </Link>
              <Link
                href="/auth/register"
                onClick={() => setOpen(false)}
                className="group/cta inline-flex h-11 items-center justify-center gap-2 rounded-[9px] bg-[#FFC93C] text-sm font-semibold text-[#0E141B] transition-colors hover:bg-[#FFD45C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC93C] focus-visible:ring-offset-2 focus-visible:ring-offset-[#131B24]"
              >
                Get started
                <ArrowRightIcon className="size-4 transition-transform duration-300 ease-out motion-safe:group-hover/cta:translate-x-0.5 motion-reduce:transition-none" />
              </Link>
            </div>
          </nav>
        </div>
      </div>
    </header>
  )
}
