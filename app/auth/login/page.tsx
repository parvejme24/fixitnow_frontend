import type { Metadata } from "next"

import LoginPageClient from "./LoginPageClient"

export const metadata: Metadata = {
  title: "Log in — FixItNow",
}

export default function LoginPage() {
  return <LoginPageClient />
}
