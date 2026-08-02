"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ArrowLeftIcon, LoaderCircleIcon } from "lucide-react"

import { useAuth } from "@/app/providers/AuthProvider"
import { formatTaka } from "@/app/lib/dashboard-data"
import {
  getBookingErrorMessage,
  useBooking,
  useUpdateBookingStatus,
} from "@/lib/bookings/hooks"
import {
  DashToastHost,
  StatusBadge,
  useDashToasts,
} from "@/app/components/Dashboard/DashShared"
import BookingStatusFlow from "@/app/components/Bookings/BookingStatusFlow"
import {
  advanceToastLabel,
  canShowJobFlow,
} from "@/lib/bookings/job-flow"
import "@/app/components/Dashboard/dashboard.css"
import "@/app/components/Technicians/TechnicianDetail/TechnicianDetail.css"
import "./BookingDetail.css"

export default function BookingDetail({ bookingId }: { bookingId: string }) {
  const { user } = useAuth()
  const router = useRouter()
  const { toasts, pushToast } = useDashToasts()
  const bookingQuery = useBooking(bookingId)
  const statusMutation = useUpdateBookingStatus()
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
      <div className="bd-page">
        <div
          className="bd-page__shell"
          style={{ justifyContent: "center", alignItems: "center", gap: 12 }}
        >
          <LoaderCircleIcon className="animate-spin" />
          <p>Loading booking…</p>
        </div>
      </div>
    )
  }

  if (bookingQuery.isError || !booking) {
    return (
      <div className="bd-page">
        <div className="bd-page__shell">
          <div className="bd-page__inner">
            <h1>Booking not found</h1>
            <p style={{ color: "var(--steel-400)" }}>
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
        </div>
      </div>
    )
  }

  const backHref =
    role === "ADMIN"
      ? "/dashboard/admin/bookings"
      : role === "TECHNICIAN"
        ? "/dashboard/technician?tab=Bookings"
        : "/bookings"

  return (
    <div className="bd-page">
      <div className="bd-page__shell">
        <div className="bd-page__inner">
          <p className="dash-breadcrumb" style={{ marginBottom: 16 }}>
            <Link href={backHref}>
              <ArrowLeftIcon
                size={14}
                style={{ display: "inline", marginRight: 6 }}
              />
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
            <div className="bd-page__status">
              <StatusBadge status={booking.status} />
            </div>
          </header>

          <section className="dash-card bd-page__card">
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

          {(role === "TECHNICIAN" || role === "ADMIN") &&
          canShowJobFlow(booking.status) ? (
            <BookingStatusFlow
              status={booking.status}
              busy={busy}
              onAdvance={(next) => {
                void run(advanceToastLabel(next), () =>
                  statusMutation.mutateAsync({
                    id: booking.id,
                    status: next,
                  })
                )
              }}
            />
          ) : null}

          {role === "CUSTOMER" && canShowJobFlow(booking.status) ? (
            <BookingStatusFlow
              status={booking.status}
              readOnly
              onAdvance={() => undefined}
            />
          ) : null}
        </div>
      </div>

      <DashToastHost toasts={toasts} />
    </div>
  )
}
