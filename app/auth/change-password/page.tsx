import type { Metadata } from "next"

import ChangePasswordClient from "./ChangePasswordClient"

export const metadata: Metadata = {
  title: "Change password — FixItNow",
}

export default function ChangePasswordPage() {
  return <ChangePasswordClient />
}
