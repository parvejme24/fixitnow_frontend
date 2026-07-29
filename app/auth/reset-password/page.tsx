import type { Metadata } from "next"
import { Suspense } from "react"

import ResetPasswordPageView from "@/app/components/Auth/ResetPasswordPage/ResetPasswordPage"

export const metadata: Metadata = {
  title: "Reset password — FixItNow",
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordPageView />
    </Suspense>
  )
}
