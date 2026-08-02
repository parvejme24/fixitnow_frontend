"use client"

import Link from "next/link"
import { Suspense } from "react"

import "@/app/components/Dashboard/dashboard.css"
import "../payment-result.css"

/**
 * Legacy local checkout removed — payments go through ShurjoPay
 * via `checkoutUrl` from `POST /payments/initiate`.
 */
function CheckoutInner() {
  return (
    <div className="pay-result">
      <div className="pay-result__card">
        <h1>Continue from bookings</h1>
        <p className="pay-result__meta">
          Payments open on ShurjoPay after you tap Pay now on a booking.
        </p>
        <div className="pay-result__actions">
          <Link href="/bookings" className="dash-btn dash-btn--primary">
            My bookings
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function PaymentCheckoutPage() {
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
      <CheckoutInner />
    </Suspense>
  )
}
