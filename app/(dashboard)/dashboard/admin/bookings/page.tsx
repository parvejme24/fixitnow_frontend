import { Suspense } from "react"

import AdminBookings from "@/app/components/Dashboard/AdminBookings"

export default function AdminBookingsPage() {
  return (
    <Suspense fallback={<div className="skel skel-row" />}>
      <AdminBookings />
    </Suspense>
  )
}
