"use client"

import { Suspense } from "react"
import { LoaderCircleIcon } from "lucide-react"

import LoginPageView from "@/app/components/Auth/LoginPage/LoginPage"
import GuestGuard from "@/app/providers/GuestGuard"

function AuthFallback() {
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

export default function LoginPageClient() {
  return (
    <Suspense fallback={<AuthFallback />}>
      <GuestGuard>
        <LoginPageView />
      </GuestGuard>
    </Suspense>
  )
}
