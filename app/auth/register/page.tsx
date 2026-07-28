import type { Metadata } from "next"

import RegisterPageView from "../../components/Auth/RegisterPage/RegisterPage"

export const metadata: Metadata = {
  title: "Create your account — FixItNow",
}

export default function RegisterPage() {
  return <RegisterPageView />
}
