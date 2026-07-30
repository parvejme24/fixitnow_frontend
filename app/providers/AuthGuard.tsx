"use client"

import { useEffect, type ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import { LoaderCircleIcon } from "lucide-react"

import { useAuth } from "@/app/providers/AuthProvider"
import { dashboardForRole, type AuthRole } from "@/lib/auth/types"

type AuthGuardProps = {
  children: ReactNode
  roles?: AuthRole[]
  redirectTo?: string
}

function normalizeRole(role: string | undefined | null): AuthRole | null {
  if (!role) return null
  const r = role.toUpperCase()
  if (r === "ADMIN" || r === "TECHNICIAN" || r === "CUSTOMER") return r
  return null
}

function AuthLoadingScreen() {
  return (
    <div
      className="flex min-h-[100dvh] w-full items-center justify-center bg-[#F7F9FB]"
      role="status"
      aria-label="Loading"
    >
      <LoaderCircleIcon
        size={36}
        className="animate-spin text-[#FFC93C]"
        aria-hidden
      />
      <span className="sr-only">Loading</span>
    </div>
  )
}

export default function AuthGuard({
  children,
  roles,
  redirectTo = "/auth/login",
}: AuthGuardProps) {
  const { user, token, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const userRole = normalizeRole(user?.role)
  const allowed =
    !roles || (userRole != null && roles.includes(userRole))

  useEffect(() => {
    if (isLoading) return
    if (!token || !isAuthenticated || !userRole) {
      const next = encodeURIComponent(pathname || "/")
      router.replace(`${redirectTo}?next=${next}`)
      return
    }
    if (roles && !roles.includes(userRole)) {
      router.replace(dashboardForRole(userRole))
    }
  }, [
    isLoading,
    token,
    isAuthenticated,
    roles,
    userRole,
    router,
    pathname,
    redirectTo,
  ])

  if (isLoading || !isAuthenticated || !userRole || !allowed) {
    return <AuthLoadingScreen />
  }

  return <>{children}</>
}
