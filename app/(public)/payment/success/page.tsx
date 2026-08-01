"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { CheckCircle2Icon, LoaderCircleIcon } from "lucide-react"

import { useAuth } from "@/app/providers/AuthProvider"
import { formatTaka } from "@/app/lib/dashboard-data"
import { usePayment } from "@/lib/payments/hooks"

function PaymentSuccessInner() {
  const params = useSearchParams()
  const id = params.get("id") || ""
  const { token } = useAuth()
  const paymentQuery = usePayment(id, Boolean(token && id))

  if (!id) {
    return (
      <div className="td-page" style={{ padding: 48, textAlign: "center" }}>
        <h1>Payment</h1>
        <p>Missing payment id.</p>
        <Link href="/bookings">Back to bookings</Link>
      </div>
    )
  }

  if (!token) {
    return (
      <div className="td-page" style={{ padding: 48, textAlign: "center" }}>
        <h1>Sign in required</h1>
        <p>
          <Link href={`/login?next=/payment/success?id=${id}`}>Log in</Link> to
          see payment status.
        </p>
      </div>
    )
  }

  if (paymentQuery.isLoading) {
    return (
      <div className="td-page" style={{ padding: 48, textAlign: "center" }}>
        <LoaderCircleIcon className="animate-spin" />
        <p>Confirming payment…</p>
      </div>
    )
  }

  const payment = paymentQuery.data
  const ok =
    payment &&
    ["SUCCESS", "PAID"].includes(String(payment.status).toUpperCase())

  return (
    <div className="td-page" style={{ padding: "48px 20px", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ textAlign: "center" }}>
        <CheckCircle2Icon
          size={48}
          color={ok ? "#12b886" : "#e5a900"}
          style={{ marginBottom: 12 }}
        />
        <h1>{ok ? "Payment received" : "Payment status"}</h1>
        <p style={{ color: "#6E8091" }}>
          {payment
            ? `${payment.method} · ${payment.status}${
                payment.bookingRef ? ` · ${payment.bookingRef}` : ""
              }`
            : paymentQuery.isError
              ? "Could not load this payment."
              : "Waiting for confirmation…"}
        </p>
        {payment ? (
          <p style={{ fontSize: "1.4rem", fontWeight: 800 }}>
            {formatTaka(payment.amount)}
          </p>
        ) : null}
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 24 }}>
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
        <div className="td-page" style={{ padding: 48, textAlign: "center" }}>
          Loading…
        </div>
      }
    >
      <PaymentSuccessInner />
    </Suspense>
  )
}
