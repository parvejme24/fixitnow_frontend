import type { Metadata } from "next"

import RegisterPageClient from "./RegisterPageClient"

export const metadata: Metadata = {
  title: "Create your account — FixItNow",
}

export default function RegisterPage() {
  return <RegisterPageClient />
}
