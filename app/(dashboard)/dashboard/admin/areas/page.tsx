import type { Metadata } from "next"

import AdminAreas from "@/app/components/Dashboard/AdminAreas"

export const metadata: Metadata = {
  title: "Service areas — FixItNow admin",
}

export default function AdminAreasPage() {
  return <AdminAreas />
}
