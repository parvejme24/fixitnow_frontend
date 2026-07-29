import type { Metadata } from "next"

import AdminDashboard from "@/app/components/Dashboard/AdminDashboard"
import AuthGuard from "@/app/providers/AuthGuard"

export const metadata: Metadata = {
  title: "Admin console — FixItNow",
}

export default function AdminDashboardPage() {
  return (
    <AuthGuard roles={["ADMIN"]}>
      <AdminDashboard />
    </AuthGuard>
  )
}
