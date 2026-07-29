import type { Metadata } from "next"
import { Suspense } from "react"

import LoginPageView from "@/app/components/Auth/LoginPage/LoginPage"

export const metadata: Metadata = {
  title: "Log in — FixItNow",
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageView />
    </Suspense>
  )
}
