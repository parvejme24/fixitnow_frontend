"use client"

import { useEffect, type ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"

import { useAuth } from "@/app/providers/AuthProvider"
import type { AuthRole } from "@/lib/auth/types"

type AuthGuardProps = {
  children: ReactNode
  roles?: AuthRole[]
  redirectTo?: string
}

export default function AuthGuard({
  children,
  roles,
  redirectTo = "/auth/login",
}: AuthGuardProps) {
  const { user, token, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (isLoading) return
    if (!token || !isAuthenticated) {
      const next = encodeURIComponent(pathname || "/")
      router.replace(`${redirectTo}?next=${next}`)
      return
    }
    if (roles && user && !roles.includes(user.role)) {
      router.replace("/")
    }
  }, [
    isLoading,
    token,
    isAuthenticated,
    roles,
    user,
    router,
    pathname,
    redirectTo,
  ])

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-[#6E8091]">
        Checking your session…
      </div>
    )
  }

  if (roles && user && !roles.includes(user.role)) {
    return null
  }

  return <>{children}</>
}
