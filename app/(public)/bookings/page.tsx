"use client"

import AuthGuard from "@/app/providers/AuthGuard"

export default function BookingsPage() {
  return (
    <AuthGuard>
      <div className="mx-auto w-full max-w-[1240px] px-4 py-10 sm:px-6">
        <h1
          className="text-3xl font-bold tracking-tight text-[#0E141B]"
          style={{ fontFamily: "var(--font-dispatch-display), sans-serif" }}
        >
          My bookings
        </h1>
        <p
          className="mt-2 text-[#4A5C6B]"
          style={{ fontFamily: "var(--font-dispatch-sans), sans-serif" }}
        >
          Your upcoming and past jobs will show up here once booking is wired to
          the API.
        </p>
      </div>
    </AuthGuard>
  )
}
