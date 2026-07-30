import type { Metadata } from "next"

import AdminUsers from "@/app/components/Dashboard/AdminUsers"

export const metadata: Metadata = {
  title: "Users — FixItNow admin",
  description: "Manage platform accounts and roles.",
}

export default function AdminUsersPage() {
  return <AdminUsers />
}
