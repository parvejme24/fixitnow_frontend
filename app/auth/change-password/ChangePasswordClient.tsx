"use client"

import AuthGuard from "@/app/providers/AuthGuard"
import ChangePasswordPageView from "@/app/components/Auth/ChangePasswordPage/ChangePasswordPage"

export default function ChangePasswordClient() {
  return (
    <AuthGuard>
      <ChangePasswordPageView />
    </AuthGuard>
  )
}
