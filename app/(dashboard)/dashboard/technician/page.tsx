import type { Metadata } from "next"
import { Suspense } from "react"

import TechnicianDashboard from "@/app/components/Dashboard/TechnicianDashboard"
import AuthGuard from "@/app/providers/AuthGuard"

export const metadata: Metadata = {
  title: "Technician dashboard — FixItNow",
}

export default function TechnicianDashboardPage() {
  return (
    <AuthGuard roles={["TECHNICIAN"]}>
      <Suspense fallback={<div style={{ minHeight: "40vh" }} />}>
        <TechnicianDashboard />
      </Suspense>
    </AuthGuard>
  )
}
