"use client"

import { useEffect, type ReactNode } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { LoaderCircleIcon } from "lucide-react"

import { useAuth } from "@/app/providers/AuthProvider"
import {
  dashboardForRole,
  safeReturnPath,
  type AuthRole,
} from "@/lib/auth/types"

type GuestGuardProps = {
  children: ReactNode
}

function normalizeRole(role: string | undefined | null): AuthRole | null {
  if (!role) return null
  const r = role.toUpperCase()
  if (r === "ADMIN" || r === "TECHNICIAN" || r === "CUSTOMER") return r
  return null
}

function GuestLoadingScreen() {
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

/** Blocks login/register for users who are already signed in. */
export default function GuestGuard({ children }: GuestGuardProps) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const userRole = normalizeRole(user?.role)

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated || !userRole) return
    const next = searchParams.get("next")
    router.replace(safeReturnPath(userRole, next) || dashboardForRole(userRole))
  }, [isLoading, isAuthenticated, userRole, router, searchParams])

  if (isLoading) return <GuestLoadingScreen />
  if (isAuthenticated && userRole) return <GuestLoadingScreen />

  return <>{children}</>
}
