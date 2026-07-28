import type { Metadata } from "next"

import LoginPageView from "../../components/Auth/LoginPage/LoginPage"

export const metadata: Metadata = {
  title: "Log in — FixItNow",
}

export default function LoginPage() {
  return <LoginPageView />
}
