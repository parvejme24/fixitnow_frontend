import type { Metadata } from "next"

import AdminCategories from "@/app/components/Dashboard/AdminCategories"

export const metadata: Metadata = {
  title: "Service categories — FixItNow admin",
}

export default function AdminCategoriesPage() {
  return <AdminCategories />
}
