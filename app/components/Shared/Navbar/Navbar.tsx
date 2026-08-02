"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useId, useState } from "react"
import {
  ArrowRightIcon,
  KeyRoundIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  UserRoundIcon,
  WrenchIcon,
} from "lucide-react"

import BrandLogo from "@/app/components/Shared/BrandLogo"
import { useAuth } from "@/app/providers/AuthProvider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { AuthRole, AuthUser } from "@/lib/auth/types"
import { absoluteMediaUrl, initialsFromName } from "@/lib/auth/types"
import { cn } from "@/lib/utils"

const baseNavLinks = [
  { label: "Home", href: "/" },
  { label: "Browse services", href: "/services" },
  { label: "Technicians", href: "/technicians" },
] as const

function primaryNavLinks(role?: AuthRole | null) {
  if (role === "TECHNICIAN") {
    return [
      ...baseNavLinks,
      { label: "Dashboard", href: "/dashboard/technician" },
    ]
  }
  if (role === "ADMIN") {
    return [...baseNavLinks, { label: "Admin console", href: "/dashboard/admin" }]
  }
  if (role === "CUSTOMER") {
    return [...baseNavLinks, { label: "My bookings", href: "/bookings" }]
  }
  return [...baseNavLinks, { label: "My bookings", href: "/bookings" }]
}

function dashboardLinksForRole(role: AuthRole) {
  if (role === "TECHNICIAN") {
    return [
      {
        label: "Technician dashboard",
        href: "/dashboard/technician",
        icon: LayoutDashboardIcon,
      },
      { label: "Browse services", href: "/services", icon: WrenchIcon },
      { label: "Technicians", href: "/technicians", icon: WrenchIcon },
    ]
  }
  if (role === "ADMIN") {
    return [
      {
        label: "Admin console",
        href: "/dashboard/admin",
        icon: LayoutDashboardIcon,
      },
      { label: "Browse services", href: "/services", icon: WrenchIcon },
      { label: "Technicians", href: "/technicians", icon: WrenchIcon },
    ]
  }
  return [
    { label: "My bookings", href: "/bookings", icon: LayoutDashboardIcon },
    { label: "Browse services", href: "/services", icon: WrenchIcon },
    { label: "Technicians", href: "/technicians", icon: WrenchIcon },
  ]
}

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

function UserAvatarButton({
  user,
  className,
}: {
  user: AuthUser
  className?: string
}) {
  const initials = user.initials || initialsFromName(user.name)
  const image = absoluteMediaUrl(user.image)

  return (
    <Avatar
      className={cn(
        "size-9 overflow-hidden rounded-full bg-[#FFC93C] after:border-[#FFC93C]/40",
        className
      )}
    >
      {image ? (
        <AvatarImage src={image} alt="" className="object-cover" />
      ) : null}
      <AvatarFallback className="bg-[#FFC93C] text-[0.75rem] font-bold tracking-wide text-[#0E141B]">
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}

function UserMenu({ user }: { user: AuthUser }) {
  const router = useRouter()
  const { logout } = useAuth()
  const [busy, setBusy] = useState(false)
  const links = dashboardLinksForRole(user.role)

  const handleLogout = async () => {
    if (busy) return
    setBusy(true)
    try {
      await logout()
      router.push("/")
    } finally {
      setBusy(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#FFC93C] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0E141B]"
        aria-label="Open account menu"
      >
        <UserAvatarButton
          user={user}
          className="transition-transform duration-200 hover:scale-[1.04] active:scale-95"
        />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="z-[120] w-64 min-w-64 rounded-[12px] border border-[#1C2733] bg-[#131B24] p-1.5 text-white shadow-[0_16px_40px_rgba(0,0,0,0.45)] ring-0"
        style={{ fontFamily: "var(--font-dispatch-sans), sans-serif" }}
      >
        <div className="px-2.5 py-2.5">
          <p className="truncate text-sm font-semibold text-white">
            {user.name}
          </p>
          <p className="mt-0.5 truncate text-xs text-[#9AABB8]">{user.email}</p>
          <p className="mt-1.5 text-[0.65rem] font-medium tracking-wide text-[#FFC93C] uppercase">
            {user.role.toLowerCase()}
          </p>
        </div>

        <DropdownMenuSeparator className="mx-1 bg-[#1C2733]" />

        {links.map((link) => {
          const Icon = link.icon
          return (
            <DropdownMenuItem
              key={link.href + link.label}
              className="cursor-pointer rounded-[8px] px-2.5 py-2 text-sm text-[#D5DEE5] focus:bg-white/8 focus:text-white"
              onClick={() => router.push(link.href)}
            >
              <Icon className="size-4 text-[#9AABB8]" />
              {link.label}
            </DropdownMenuItem>
          )
        })}

        <DropdownMenuItem
          className="cursor-pointer rounded-[8px] px-2.5 py-2 text-sm text-[#D5DEE5] focus:bg-white/8 focus:text-white"
          onClick={() => router.push("/dashboard/profile")}
        >
          <UserRoundIcon className="size-4 text-[#9AABB8]" />
          My profile
        </DropdownMenuItem>

        <DropdownMenuItem
          className="cursor-pointer rounded-[8px] px-2.5 py-2 text-sm text-[#D5DEE5] focus:bg-white/8 focus:text-white"
          onClick={() => router.push("/auth/change-password")}
        >
          <KeyRoundIcon className="size-4 text-[#9AABB8]" />
          Change password
        </DropdownMenuItem>

        <DropdownMenuSeparator className="mx-1 bg-[#1C2733]" />

        <DropdownMenuItem
          disabled={busy}
          className="cursor-pointer rounded-[8px] px-2.5 py-2 text-sm text-[#FF8A7A] focus:bg-[#FF8A7A]/10 focus:text-[#FF8A7A]"
          onClick={handleLogout}
        >
          <LogOutIcon className="size-4" />
          {busy ? "Signing out…" : "Log out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function GuestActions({
  mobile = false,
  onNavigate,
}: {
  mobile?: boolean
  onNavigate?: () => void
}) {
  if (mobile) {
    return (
      <div className="flex flex-col gap-2.5 pt-5 pb-3">
        <Link
          href="/auth/login"
          onClick={onNavigate}
          className="inline-flex h-11 cursor-pointer items-center justify-center rounded-[9px] border border-[#4A5C6A] text-sm font-medium text-white transition-colors hover:border-[#9AABB8] hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC93C] focus-visible:ring-offset-2 focus-visible:ring-offset-[#131B24]"
        >
          Log in
        </Link>
        <Link
          href="/auth/register"
          onClick={onNavigate}
          className="group/cta inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-[9px] bg-[#FFC93C] text-sm font-semibold text-[#0E141B] transition-colors hover:bg-[#FFD45C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC93C] focus-visible:ring-offset-2 focus-visible:ring-offset-[#131B24]"
        >
          Get started
          <ArrowRightIcon className="size-4 transition-transform duration-300 ease-out motion-safe:group-hover/cta:translate-x-0.5 motion-reduce:transition-none" />
        </Link>
      </div>
    )
  }

  return (
    <div className="ml-2 flex items-center gap-2.5">
      <Link
        href="/auth/login"
        className="inline-flex h-9 cursor-pointer items-center justify-center rounded-[9px] border border-[#4A5C6A] bg-transparent px-4 text-sm font-medium text-white transition-colors hover:border-[#9AABB8] hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC93C] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0E141B]"
      >
        Log in
      </Link>
      <Link
        href="/auth/register"
        className="group/cta inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-[9px] bg-[#FFC93C] px-4 text-sm font-semibold text-[#0E141B] transition-colors hover:bg-[#FFD45C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC93C] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0E141B]"
      >
        Get started
        <ArrowRightIcon className="size-3.5 transition-transform duration-300 ease-out motion-safe:group-hover/cta:translate-x-0.5 motion-reduce:transition-none" />
      </Link>
    </div>
  )
}

function AuthSlot({
  mobile = false,
  onNavigate,
}: {
  mobile?: boolean
  onNavigate?: () => void
}) {
  const { user, isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <span
        className={cn(
          "inline-block size-9 animate-pulse rounded-full bg-[#1C2733]",
          mobile ? "hidden" : "ml-2"
        )}
        aria-hidden
      />
    )
  }

  if (isAuthenticated && user) {
    // Mobile sheet: account lives on the avatar in the header bar
    if (mobile) return null
    return (
      <div className="ml-2">
        <UserMenu user={user} />
      </div>
    )
  }

  return <GuestActions mobile={mobile} onNavigate={onNavigate} />
}

export default function Navbar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const navLinks = primaryNavLinks(user?.role)
  const [open, setOpen] = useState(false)
  const [elevated, setElevated] = useState(false)
  const menuId = useId()

  useEffect(() => {
    setOpen(false)
  }, [pathname])

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
      <div className="h-[3px] w-full bg-[#FFC93C]" aria-hidden />

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
                    "relative cursor-pointer px-3 py-2 text-[0.9375rem] font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC93C] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0E141B]",
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

          <AuthSlot />
        </div>

        <div className="ml-auto flex items-center gap-1.5 lg:hidden">
          <MobileUserAvatar />
          <button
            type="button"
            className="inline-flex size-10 cursor-pointer items-center justify-center rounded-[9px] text-white transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC93C] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0E141B]"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls={menuId}
            onClick={() => setOpen((v) => !v)}
          >
            <BurgerIcon open={open} />
          </button>
        </div>
      </div>

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
                  "cursor-pointer border-b border-[#1C2733] py-3.5 text-lg font-semibold transition-colors last:border-b-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC93C] focus-visible:ring-inset",
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

          <AuthSlot mobile onNavigate={() => setOpen(false)} />
        </nav>
      </div>
    </header>
  )
}

function MobileUserAvatar() {
  const { user, isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <span
        className="inline-block size-9 animate-pulse rounded-full bg-[#1C2733]"
        aria-hidden
      />
    )
  }

  if (!isAuthenticated || !user) return null

  return <UserMenu user={user} />
}
