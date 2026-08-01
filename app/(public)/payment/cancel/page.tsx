"use client"

import Link from "next/link"
import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { XCircleIcon } from "lucide-react"

function PaymentCancelInner() {
  const params = useSearchParams()
  const id = params.get("id")

  return (
    <div
      className="td-page"
      style={{ padding: "48px 20px", maxWidth: 480, margin: "0 auto", textAlign: "center" }}
    >
      <XCircleIcon size={48} color="#c92a2a" style={{ marginBottom: 12 }} />
      <h1>Payment cancelled</h1>
      <p style={{ color: "#6E8091" }}>
        {id
          ? `Payment ${id} was cancelled. You can try again from your bookings.`
          : "No charge was made. You can retry from My bookings."}
      </p>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 24 }}>
        <Link href="/bookings" className="dash-btn dash-btn--primary">
          My bookings
        </Link>
        <Link href="/services" className="dash-btn dash-btn--ghost">
          Browse services
        </Link>
      </div>
    </div>
  )
}

export default function PaymentCancelPage() {
  return (
    <Suspense
      fallback={
        <div className="td-page" style={{ padding: 48, textAlign: "center" }}>
          Loading…
        </div>
      }
    >
      <PaymentCancelInner />
    </Suspense>
  )
}
