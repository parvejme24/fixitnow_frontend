import type { Metadata } from "next"

import AdminDashboard from "@/app/components/Dashboard/AdminDashboard"

export const metadata: Metadata = {
  title: "Admin console — FixItNow",
}

export default function AdminDashboardPage() {
  return <AdminDashboard />
}
