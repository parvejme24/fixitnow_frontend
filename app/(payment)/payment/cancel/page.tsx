"use client"

import Link from "next/link"
import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { XCircleIcon } from "lucide-react"

import "@/app/components/Dashboard/dashboard.css"

import "../payment-result.css"

function PaymentCancelInner() {
  const params = useSearchParams()
  const id = params.get("paymentId") || params.get("id")

  return (
    <div className="pay-result">
      <div className="pay-result__card">
        <XCircleIcon
          className="pay-result__icon"
          size={48}
          color="#c92a2a"
          aria-hidden
        />
        <h1>Payment cancelled</h1>
        <p className="pay-result__meta">
          {id
            ? `Payment was cancelled. You can try again from your bookings.`
            : "No charge was made. You can retry from My bookings."}
        </p>
        <div className="pay-result__actions">
          <Link href="/bookings" className="dash-btn dash-btn--primary">
            My bookings
          </Link>
          <Link href="/services" className="dash-btn dash-btn--ghost">
            Browse services
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function PaymentCancelPage() {
  return (
    <Suspense
      fallback={
        <div className="pay-result">
          <div className="pay-result__card">
            <p>Loading…</p>
          </div>
        </div>
      }
    >
      <PaymentCancelInner />
    </Suspense>
  )
}
