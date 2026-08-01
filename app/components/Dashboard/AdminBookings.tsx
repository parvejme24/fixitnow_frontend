"use client"

import Link from "next/link"
import { useMemo, useState, type RefObject } from "react"
import {
  CalendarDaysIcon,
  InboxIcon,
  LoaderCircleIcon,
  SearchIcon,
  WalletIcon,
} from "lucide-react"

import BrowseSelect from "@/app/components/Shared/BrowseSelect/BrowseSelect"
import {
  getBookingErrorMessage,
  useAdminBookingsQuery,
  useUpdateBookingStatus,
} from "@/lib/bookings/hooks"
import { toDashBooking } from "@/lib/bookings/api"
import type { Booking } from "@/lib/bookings/types"
import { formatTaka } from "@/app/lib/dashboard-data"
import { useRefundPayment } from "@/lib/payments/hooks"
import AdminShell from "./AdminShell"
import { useReveal } from "./DashShell"
import {
  DashToastHost,
  StatCard,
  StatusBadge,
  useDashToasts,
} from "./DashShared"

const STATUS_FILTERS = [
  "Every status",
  "REQUESTED",
  "ACCEPTED",
  "PAID",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "DECLINED",
] as const

export default function AdminBookings() {
  const { toasts, pushToast } = useDashToasts()
  const bookingsQuery = useAdminBookingsQuery()
  const statusMutation = useUpdateBookingStatus()
  const refundMutation = useRefundPayment()
  const bookings = bookingsQuery.data ?? []

  const [q, setQ] = useState("")
  const [statusFilter, setStatusFilter] = useState("Every status")
  const [busyId, setBusyId] = useState<string | null>(null)
  const revealRef = useReveal([bookingsQuery.isFetching, statusFilter])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return bookings.filter((b) => {
      if (statusFilter !== "Every status") {
        const mapped = toDashBooking(b).status
        if (statusFilter === "IN_PROGRESS") {
          if (
            !["IN_PROGRESS", "EN_ROUTE", "ON_SITE"].includes(b.status) &&
            mapped !== "IN_PROGRESS"
          )
            return false
        } else if (b.status !== statusFilter && mapped !== statusFilter) {
          return false
        }
      }
      if (!query) return true
      const hay = `${b.reference} ${b.service} ${b.customer.name} ${b.technician.name}`.toLowerCase()
      return hay.includes(query)
    })
  }, [bookings, q, statusFilter])

  const active = bookings.filter((b) =>
    ["REQUESTED", "ACCEPTED", "PAID", "EN_ROUTE", "ON_SITE", "IN_PROGRESS"].includes(
      b.status
    )
  ).length
  const awaitingPay = bookings.filter((b) => b.status === "ACCEPTED").length
  const revenue = bookings
    .filter((b) => ["PAID", "COMPLETED", "IN_PROGRESS", "ON_SITE", "EN_ROUTE"].includes(b.status))
    .reduce((s, b) => s + b.amount, 0)

  const advance = async (b: Booking, status: "IN_PROGRESS" | "COMPLETED") => {
    setBusyId(b.id)
    try {
      await statusMutation.mutateAsync({ id: b.id, status })
      pushToast("Status updated", `${b.reference} → ${status.replace(/_/g, " ")}`)
    } catch (error) {
      pushToast("Update failed", getBookingErrorMessage(error), "error")
    } finally {
      setBusyId(null)
    }
  }

  const refund = async (b: Booking) => {
    if (!b.paymentId) {
      pushToast("No payment", "This booking has no payment id to refund.", "error")
      return
    }
    setBusyId(b.id)
    try {
      await refundMutation.mutateAsync(b.paymentId)
      pushToast("Refund started", `Refund queued for ${b.reference}.`)
    } catch (error) {
      pushToast("Refund failed", getBookingErrorMessage(error), "error")
    } finally {
      setBusyId(null)
    }
  }

  return (
    <AdminShell page="bookings">
      <div ref={revealRef as RefObject<HTMLDivElement>}>
        <p className="dash-breadcrumb">
          <Link href="/dashboard/admin">Admin</Link>
          <span>/</span>
          <span>Bookings</span>
        </p>
        <header className="dash-head">
          <div>
            <h1 className="dash-title">All bookings</h1>
            <p className="dash-sub">
              Live from <code>/admin/bookings</code> — advance status or refund
              payments.
            </p>
          </div>
          <div className="dash-head__actions">
            <button
              type="button"
              className="dash-btn dash-btn--ghost"
              onClick={() => void bookingsQuery.refetch()}
              disabled={bookingsQuery.isFetching}
            >
              {bookingsQuery.isFetching ? (
                <>
                  <LoaderCircleIcon size={16} className="animate-spin" />
                  Refreshing…
                </>
              ) : (
                "Refresh"
              )}
            </button>
          </div>
        </header>

        <div className="stat-row">
          <StatCard
            icon={<InboxIcon size={18} />}
            value={bookings.length}
            label="Total bookings"
            delta="From API"
            delay={0}
            animate={!bookingsQuery.isLoading}
          />
          <StatCard
            icon={<CalendarDaysIcon size={18} />}
            value={active}
            label="Active"
            delta="In flight"
            variant="sky"
            delay={55}
            animate={!bookingsQuery.isLoading}
          />
          <StatCard
            icon={<WalletIcon size={18} />}
            value={awaitingPay}
            label="Awaiting payment"
            delta="Accepted"
            variant="signal"
            delay={110}
            animate={!bookingsQuery.isLoading}
          />
          <StatCard
            icon={<WalletIcon size={18} />}
            value={revenue}
            label="Gross (paid+)"
            delta="Sum of paid jobs"
            variant="violet"
            prefix="৳"
            delay={165}
            animate={!bookingsQuery.isLoading}
          />
        </div>

        <section className="dash-card" style={{ marginTop: 14 }}>
          <div className="admin-filters admin-filters--users">
            <label className="dash-search">
              <SearchIcon size={16} />
              <input
                className="dash-input"
                placeholder="Search ref, service, names"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </label>
            <BrowseSelect
              value={statusFilter}
              onValueChange={setStatusFilter}
              options={STATUS_FILTERS.map((s) => ({
                value: s,
                label: s === "Every status" ? s : s.replace(/_/g, " "),
              }))}
            />
          </div>

          {bookingsQuery.isError ? (
            <div className="dash-empty">
              <h3>Could not load bookings</h3>
              <p>{getBookingErrorMessage(bookingsQuery.error)}</p>
            </div>
          ) : bookingsQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skel skel-row" />
            ))
          ) : filtered.length === 0 ? (
            <div className="dash-empty">
              <h3>No bookings match</h3>
              <p>Try another filter or refresh.</p>
            </div>
          ) : (
            <div className="table-wrap table-wrap--scroll">
              <div className="table-scroll">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Ref</th>
                      <th>Service</th>
                      <th>Customer</th>
                      <th>Technician</th>
                      <th>When</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((b) => {
                      const dash = toDashBooking(b)
                      const busy = busyId === b.id
                      return (
                        <tr key={b.id}>
                          <td className="mono-muted">
                            <Link href={`/bookings/${b.id}`}>{b.reference}</Link>
                          </td>
                          <td>
                            <strong>{b.service}</strong>
                          </td>
                          <td>{b.customer.name}</td>
                          <td>{b.technician.name}</td>
                          <td className="mono-muted">
                            {b.date} · {b.time}
                          </td>
                          <td>{formatTaka(b.amount)}</td>
                          <td>
                            <StatusBadge status={dash.status} />
                          </td>
                          <td>
                            <div
                              style={{
                                display: "flex",
                                gap: 6,
                                flexWrap: "wrap",
                              }}
                            >
                              {["PAID", "ACCEPTED"].includes(b.status) ? (
                                <button
                                  type="button"
                                  className="dash-btn dash-btn--ghost dash-btn--sm"
                                  disabled={busy}
                                  onClick={() =>
                                    void advance(b, "IN_PROGRESS")
                                  }
                                >
                                  Start
                                </button>
                              ) : null}
                              {[
                                "IN_PROGRESS",
                                "EN_ROUTE",
                                "ON_SITE",
                                "PAID",
                              ].includes(b.status) ? (
                                <button
                                  type="button"
                                  className="dash-btn dash-btn--primary dash-btn--sm"
                                  disabled={busy}
                                  onClick={() => void advance(b, "COMPLETED")}
                                >
                                  Complete
                                </button>
                              ) : null}
                              {b.paymentId &&
                              ["PAID", "COMPLETED"].includes(b.status) ? (
                                <button
                                  type="button"
                                  className="dash-btn dash-btn--ghost dash-btn--sm"
                                  disabled={busy}
                                  onClick={() => void refund(b)}
                                >
                                  Refund
                                </button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>
      <DashToastHost toasts={toasts} />
    </AdminShell>
  )
}
