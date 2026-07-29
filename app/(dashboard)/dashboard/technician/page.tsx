import type { Metadata } from "next"

import TechnicianDashboard from "@/app/components/Dashboard/TechnicianDashboard"
import AuthGuard from "@/app/providers/AuthGuard"

export const metadata: Metadata = {
  title: "Technician dashboard — FixItNow",
}

export default function TechnicianDashboardPage() {
  return (
    <AuthGuard roles={["TECHNICIAN"]}>
      <TechnicianDashboard />
    </AuthGuard>
  )
}
