"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useId, useState } from "react"
import { ArrowRightIcon } from "lucide-react"

import BrandLogo from "@/app/components/Shared/BrandLogo"
import { cn } from "@/lib/utils"

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Browse services", href: "/services" },
  { label: "Technicians", href: "/technicians" },
  { label: "My bookings", href: "/bookings" },
] as const

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/"
  if (href === "/technicians") {
    return (
      pathname === "/technicians" ||
      pathname.startsWith("/technicians/") ||
      pathname === "/technician"
    )
  }
  return pathname === href || pathname.startsWith(`${href}/`)
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
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open])

  return (
    <header
      className={cn(
        "sticky top-0 z-[100] w-full bg-[#0E141B] transition-shadow duration-300 ease-out motion-reduce:transition-none",
        elevated && "shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
      )}
    >
      {/* Hi-vis hazard stripe — top edge only */}
      <div
        className="h-[3px] w-full bg-[#FFC93C]"
        aria-hidden
      />

      <div className="relative z-[102] mx-auto flex h-[68px] w-full max-w-[1240px] items-center gap-4 bg-[#0E141B] px-4 sm:px-6">
        <BrandLogo onNavigate={() => setOpen(false)} showTag />

        <div
          className="ml-auto hidden items-center gap-1 lg:flex"
          style={{ fontFamily: "var(--font-dispatch-sans), sans-serif" }}
        >
          <nav aria-label="Primary" className="flex items-center gap-0.5">
            {navLinks.map((link) => {
              const active = isActive(pathname, link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative px-3 py-2 text-[0.9375rem] font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC93C] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0E141B]",
                    active
                      ? "text-white"
                      : "text-[#9AABB8] hover:text-[#D5DEE5]"
                  )}
                >
                  {link.label}
                  <span
                    aria-hidden
                    className={cn(
                      "absolute inset-x-3 bottom-0 h-[2px] rounded-full bg-[#FFC93C] transition-opacity duration-200",
                      active ? "opacity-100" : "opacity-0"
                    )}
                  />
                </Link>
              )
            })}
          </nav>

          <div className="ml-2 flex items-center gap-2.5">
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

      {/* Backdrop — covers page, does not push layout */}
      <div
        className={cn(
          "fixed inset-0 top-[71px] z-[90] bg-black/45 transition-opacity duration-300 ease-out motion-reduce:transition-none lg:hidden",
          open
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        )}
        aria-hidden
        onClick={() => setOpen(false)}
      />

      {/* Mobile menu overlay — absolute so page content stays put */}
      <div
        id={menuId}
        className={cn(
          "absolute inset-x-0 top-full z-[110] border-t border-[#1C2733] bg-[#131B24] shadow-[0_16px_40px_rgba(0,0,0,0.45)] transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none motion-reduce:translate-y-0 lg:hidden",
          open
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-2 opacity-0 motion-reduce:translate-y-0"
        )}
        aria-hidden={!open}
      >
        <nav
          aria-label="Mobile"
          className="mx-auto flex max-h-[min(70vh,calc(100dvh-71px))] max-w-[1240px] flex-col overflow-y-auto px-4 py-3 sm:px-6"
          style={{ fontFamily: "var(--font-dispatch-sans), sans-serif" }}
        >
          {navLinks.map((link) => {
            const active = isActive(pathname, link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                tabIndex={open ? undefined : -1}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "border-b border-[#1C2733] py-3.5 text-lg font-semibold transition-colors last:border-b-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC93C] focus-visible:ring-inset",
                  active ? "text-white" : "text-[#9AABB8] hover:text-white"
                )}
              >
                <span
                  className={cn(
                    "inline-block border-b-2 pb-0.5",
                    active ? "border-[#FFC93C]" : "border-transparent"
                  )}
                >
                  {link.label}
                </span>
              </Link>
            )
          })}

          <div className="flex flex-col gap-2.5 pt-5 pb-3">
            <Link
              href="/auth/login"
              onClick={() => setOpen(false)}
              tabIndex={open ? undefined : -1}
              className="inline-flex h-11 items-center justify-center rounded-[9px] border border-[#4A5C6A] text-sm font-medium text-white transition-colors hover:border-[#9AABB8] hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC93C] focus-visible:ring-offset-2 focus-visible:ring-offset-[#131B24]"
            >
              Log in
            </Link>
            <Link
              href="/auth/register"
              onClick={() => setOpen(false)}
              tabIndex={open ? undefined : -1}
              className="group/cta inline-flex h-11 items-center justify-center gap-2 rounded-[9px] bg-[#FFC93C] text-sm font-semibold text-[#0E141B] transition-colors hover:bg-[#FFD45C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC93C] focus-visible:ring-offset-2 focus-visible:ring-offset-[#131B24]"
            >
              Get started
              <ArrowRightIcon className="size-4 transition-transform duration-300 ease-out motion-safe:group-hover/cta:translate-x-0.5 motion-reduce:transition-none" />
            </Link>
          </div>
        </nav>
      </div>
    </header>
  )
}
