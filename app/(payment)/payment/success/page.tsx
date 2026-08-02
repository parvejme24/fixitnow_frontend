"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense, useEffect } from "react"
import { CheckCircle2Icon, LoaderCircleIcon } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"

import { useAuth } from "@/app/providers/AuthProvider"
import { formatTaka } from "@/app/lib/dashboard-data"
import { bookingKeys } from "@/lib/bookings/query-keys"
import { usePayment } from "@/lib/payments/hooks"
import "@/app/components/Dashboard/dashboard.css"

import "../payment-result.css"

function paymentIdFromParams(params: URLSearchParams) {
  return params.get("paymentId") || params.get("id") || ""
}

function PaymentSuccessInner() {
  const params = useSearchParams()
  const id = paymentIdFromParams(params)
  const { token } = useAuth()
  const qc = useQueryClient()
  const paymentQuery = usePayment(id, Boolean(token && id))

  const payment = paymentQuery.data
  const ok =
    payment &&
    ["SUCCESS", "PAID"].includes(String(payment.status).toUpperCase())

  useEffect(() => {
    if (!ok) return
    void qc.invalidateQueries({ queryKey: bookingKeys.all })
  }, [ok, qc])

  if (!id) {
    return (
      <div className="pay-result">
        <div className="pay-result__card">
          <h1>Payment</h1>
          <p className="pay-result__meta">Missing payment id.</p>
          <div className="pay-result__actions">
            <Link href="/bookings" className="dash-btn dash-btn--primary">
              Back to bookings
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!token) {
    return (
      <div className="pay-result">
        <div className="pay-result__card">
          <h1>Sign in required</h1>
          <p className="pay-result__meta">
            <Link
              href={`/auth/login?next=/payment/success?paymentId=${encodeURIComponent(id)}`}
            >
              Log in
            </Link>{" "}
            to see payment status.
          </p>
        </div>
      </div>
    )
  }

  if (paymentQuery.isLoading) {
    return (
      <div className="pay-result">
        <div className="pay-result__card">
          <LoaderCircleIcon className="pay-result__icon animate-spin" size={48} />
          <p className="pay-result__meta">Confirming payment…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="pay-result">
      <div className="pay-result__card">
        <CheckCircle2Icon
          className="pay-result__icon"
          size={48}
          color={ok ? "#12b886" : "#e5a900"}
          aria-hidden
        />
        <h1>{ok ? "Payment received" : "Payment status"}</h1>
        <p className="pay-result__meta">
          {payment
            ? `${payment.method} · ${payment.status}${
                payment.bookingRef ? ` · ${payment.bookingRef}` : ""
              }`
            : paymentQuery.isError
              ? "Could not load this payment."
              : "Waiting for confirmation…"}
        </p>
        {payment ? (
          <p className="pay-result__amount">{formatTaka(payment.amount)}</p>
        ) : null}
        <div className="pay-result__actions">
          <Link href="/bookings" className="dash-btn dash-btn--primary">
            My bookings
          </Link>
          <button
            type="button"
            className="dash-btn dash-btn--ghost"
            onClick={() => void paymentQuery.refetch()}
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="pay-result">
          <div className="pay-result__card">
            <LoaderCircleIcon className="pay-result__icon animate-spin" size={48} />
            <p>Loading…</p>
          </div>
        </div>
      }
    >
      <PaymentSuccessInner />
    </Suspense>
  )
}
