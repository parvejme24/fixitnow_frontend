import type { Metadata } from "next"

import ForgotPasswordPageView from "../../components/Auth/ForgotPasswordPage/ForgotPasswordPage"

export const metadata: Metadata = {
  title: "Forgot password — FixItNow",
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordPageView />
}
