"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import {
  ArrowLeftIcon,
  LoaderCircleIcon,
  WalletIcon,
} from "lucide-react"

import { useAuth } from "@/app/providers/AuthProvider"
import { formatTaka } from "@/app/lib/dashboard-data"
import {
  getBookingErrorMessage,
  useAcceptBooking,
  useBooking,
  useCancelBooking,
  useDeclineBooking,
  useUpdateBookingStatus,
} from "@/lib/bookings/hooks"
import {
  getPaymentErrorMessage,
  useInitiatePayment,
  useRefundPayment,
} from "@/lib/payments/hooks"
import {
  DashToastHost,
  StatusBadge,
  useDashToasts,
} from "@/app/components/Dashboard/DashShared"

export default function BookingDetail({ bookingId }: { bookingId: string }) {
  const { user } = useAuth()
  const router = useRouter()
  const { toasts, pushToast } = useDashToasts()
  const bookingQuery = useBooking(bookingId)
  const acceptMutation = useAcceptBooking()
  const declineMutation = useDeclineBooking()
  const cancelMutation = useCancelBooking()
  const statusMutation = useUpdateBookingStatus()
  const payMutation = useInitiatePayment()
  const refundMutation = useRefundPayment()
  const [busy, setBusy] = useState(false)

  const booking = bookingQuery.data
  const role = user?.role

  const run = async (label: string, fn: () => Promise<unknown>) => {
    setBusy(true)
    try {
      await fn()
      pushToast(label, "Booking updated.")
      void bookingQuery.refetch()
    } catch (error) {
      pushToast("Action failed", getBookingErrorMessage(error), "error")
    } finally {
      setBusy(false)
    }
  }

  if (bookingQuery.isLoading) {
    return (
      <div className="td-page" style={{ padding: 48, textAlign: "center" }}>
        <LoaderCircleIcon className="animate-spin" />
        <p>Loading booking…</p>
      </div>
    )
  }

  if (bookingQuery.isError || !booking) {
    return (
      <div className="td-page" style={{ padding: 48, maxWidth: 520, margin: "0 auto" }}>
        <h1>Booking not found</h1>
        <p style={{ color: "#6E8091" }}>
          {getBookingErrorMessage(bookingQuery.error) ||
            "We could not load this booking."}
        </p>
        <button
          type="button"
          className="dash-btn dash-btn--ghost"
          onClick={() => router.back()}
        >
          Go back
        </button>
      </div>
    )
  }

  const backHref =
    role === "ADMIN"
      ? "/dashboard/admin/bookings"
      : role === "TECHNICIAN"
        ? "/dashboard/technician"
        : "/bookings"

  return (
    <div className="td-page" style={{ padding: "32px 20px 64px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <p className="dash-breadcrumb" style={{ marginBottom: 16 }}>
          <Link href={backHref}>
            <ArrowLeftIcon size={14} style={{ display: "inline", marginRight: 6 }} />
            Back
          </Link>
          <span>/</span>
          <span>{booking.reference}</span>
        </p>

        <header className="dash-head" style={{ marginBottom: 18 }}>
          <div>
            <p className="dash-eyebrow">Booking detail</p>
            <h1 className="dash-title">{booking.reference}</h1>
            <p className="dash-sub">
              {booking.service} · {booking.date} · {booking.time}
            </p>
          </div>
          <StatusBadge status={booking.status} />
        </header>

        <section className="dash-card" style={{ marginBottom: 14 }}>
          <div className="td-receipt">
            <div className="td-receipt__row">
              <span>Service</span>
              <span>{booking.service}</span>
            </div>
            <div className="td-receipt__row">
              <span>Customer</span>
              <span>{booking.customer.name}</span>
            </div>
            <div className="td-receipt__row">
              <span>Technician</span>
              <span>{booking.technician.name}</span>
            </div>
            <div className="td-receipt__row">
              <span>Area</span>
              <span>{booking.area}</span>
            </div>
            <div className="td-receipt__row">
              <span>Slot</span>
              <span>
                {booking.date} · {booking.time}
              </span>
            </div>
            {booking.notes ? (
              <div className="td-receipt__row">
                <span>Notes</span>
                <span>{booking.notes}</span>
              </div>
            ) : null}
            <div className="td-receipt__row is-total">
              <span>Total</span>
              <span>{formatTaka(booking.amount)}</span>
            </div>
          </div>
        </section>

        <section className="dash-card">
          <h2 className="dash-card__title">Actions</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
            {role === "TECHNICIAN" && booking.status === "REQUESTED" ? (
              <>
                <button
                  type="button"
                  className="dash-btn dash-btn--primary"
                  disabled={busy}
                  onClick={() =>
                    void run("Accepted", () =>
                      acceptMutation.mutateAsync(booking.id)
                    )
                  }
                >
                  Accept
                </button>
                <button
                  type="button"
                  className="dash-btn dash-btn--ghost"
                  disabled={busy}
                  onClick={() =>
                    void run("Declined", () =>
                      declineMutation.mutateAsync(booking.id)
                    )
                  }
                >
                  Decline
                </button>
              </>
            ) : null}

            {role === "CUSTOMER" &&
            ["REQUESTED", "ACCEPTED", "PAID"].includes(booking.status) ? (
              <button
                type="button"
                className="dash-btn dash-btn--ghost"
                disabled={busy}
                onClick={() =>
                  void run("Cancelled", () =>
                    cancelMutation.mutateAsync(booking.id)
                  )
                }
              >
                Cancel booking
              </button>
            ) : null}

            {role === "CUSTOMER" && booking.status === "ACCEPTED" ? (
              <button
                type="button"
                className="dash-btn dash-btn--primary"
                disabled={busy || payMutation.isPending}
                onClick={() => {
                  void (async () => {
                    setBusy(true)
                    try {
                      const payment = await payMutation.mutateAsync({
                        bookingId: booking.id,
                        method: "BKASH",
                      })
                      if (payment.redirectUrl) {
                        window.location.href = payment.redirectUrl
                        return
                      }
                      router.push(`/payment/success?id=${payment.id}`)
                    } catch (error) {
                      pushToast(
                        "Payment failed",
                        getPaymentErrorMessage(error),
                        "error"
                      )
                    } finally {
                      setBusy(false)
                    }
                  })()
                }}
              >
                <WalletIcon size={16} /> Pay now
              </button>
            ) : null}

            {(role === "TECHNICIAN" || role === "ADMIN") &&
            ["ACCEPTED", "PAID"].includes(booking.status) ? (
              <button
                type="button"
                className="dash-btn dash-btn--ghost"
                disabled={busy}
                onClick={() =>
                  void run("In progress", () =>
                    statusMutation.mutateAsync({
                      id: booking.id,
                      status: "IN_PROGRESS",
                    })
                  )
                }
              >
                Mark in progress
              </button>
            ) : null}

            {(role === "TECHNICIAN" || role === "ADMIN") &&
            ["IN_PROGRESS", "EN_ROUTE", "ON_SITE", "PAID"].includes(
              booking.status
            ) ? (
              <button
                type="button"
                className="dash-btn dash-btn--primary"
                disabled={busy}
                onClick={() =>
                  void run("Completed", () =>
                    statusMutation.mutateAsync({
                      id: booking.id,
                      status: "COMPLETED",
                    })
                  )
                }
              >
                Mark completed
              </button>
            ) : null}

            {role === "ADMIN" && booking.paymentId ? (
              <button
                type="button"
                className="dash-btn dash-btn--ghost"
                disabled={busy || refundMutation.isPending}
                onClick={() => {
                  void (async () => {
                    setBusy(true)
                    try {
                      await refundMutation.mutateAsync(booking.paymentId!)
                      pushToast("Refund queued", "Payment refund started.")
                      void bookingQuery.refetch()
                    } catch (error) {
                      pushToast(
                        "Refund failed",
                        getPaymentErrorMessage(error),
                        "error"
                      )
                    } finally {
                      setBusy(false)
                    }
                  })()
                }}
              >
                Refund payment
              </button>
            ) : null}

            {booking.technicianId ? (
              <Link
                href={`/technician?id=${booking.technicianId}`}
                className="dash-btn dash-btn--ghost"
              >
                View technician
              </Link>
            ) : null}
          </div>
        </section>
      </div>
      <DashToastHost toasts={toasts} />
    </div>
  )
}
