import type { Metadata } from "next"

import CustomerDashboard from "@/app/components/Dashboard/CustomerDashboard"
import AuthGuard from "@/app/providers/AuthGuard"

export const metadata: Metadata = {
  title: "My bookings — FixItNow",
}

export default function BookingsPage() {
  return (
    <AuthGuard roles={["CUSTOMER"]}>
      <CustomerDashboard />
    </AuthGuard>
  )
}
