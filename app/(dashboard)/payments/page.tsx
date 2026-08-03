import type { Metadata } from "next"

import CustomerDashboard from "@/app/components/Dashboard/CustomerDashboard"
import AuthGuard from "@/app/providers/AuthGuard"

export const metadata: Metadata = {
  title: "Payment history — FixItNow",
  description: "View your FixItNow payment receipts and history.",
}

export default function PaymentsPage() {
  return (
    <AuthGuard roles={["CUSTOMER"]}>
      <CustomerDashboard view="payments" />
    </AuthGuard>
  )
}
