import type { Metadata } from "next"

import AdminDisputes from "@/app/components/Dashboard/AdminDisputes"

export const metadata: Metadata = {
  title: "Disputes — FixItNow admin",
}

export default function AdminDisputesPage() {
  return <AdminDisputes />
}
