import type { Metadata } from "next"

import BookingDetail from "@/app/components/Bookings/BookingDetail"
import AuthGuard from "@/app/providers/AuthGuard"

export const metadata: Metadata = {
  title: "Booking — FixItNow",
}

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <AuthGuard roles={["CUSTOMER", "TECHNICIAN", "ADMIN"]}>
      <BookingDetail bookingId={id} />
    </AuthGuard>
  )
}
