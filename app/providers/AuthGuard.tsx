"use client"

import { useEffect, type ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"

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

  if (isLoading || !isAuthenticated || !userRole) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-[#6E8091]">
        Checking your session…
      </div>
    )
  }

  if (!allowed) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-[#6E8091]">
        Redirecting to your dashboard…
      </div>
    )
  }

  return <>{children}</>
}
