"use client"

import Link from "next/link"
import { useEffect, useMemo, useState, type RefObject } from "react"
import {
  CalendarDaysIcon,
  InboxIcon,
  LogOutIcon,
  StarIcon,
  UserRoundIcon,
  WalletIcon,
  WrenchIcon,
} from "lucide-react"

import { useAuth } from "@/app/providers/AuthProvider"
import {
  CUSTOMER_BOOKINGS,
  CUSTOMER_PAYMENTS,
  CUSTOMER_REVIEWS,
  formatTaka,
  isActiveStatus,
  type BookingStatus,
  type DashBooking,
  type DashReview,
} from "@/app/lib/dashboard-data"
import DashShell, { useReveal } from "./DashShell"
import {
  DashModal,
  DashTabs,
  DashToastHost,
  StatCard,
  StatusBadge,
  useDashToasts,
} from "./DashShared"

type Filter = "All" | "Active" | "Completed" | "Cancelled"

const TABS = ["Bookings", "Payments", "Reviews", "Track a job"]

export default function CustomerDashboard() {
  const { user } = useAuth()
  const name = user?.name || "Ayesha Siddika"
  const first = name.split(" ")[0] || "Ayesha"
  const { toasts, pushToast } = useDashToasts()
  const [tab, setTab] = useState("Bookings")
  const [filter, setFilter] = useState<Filter>("All")
  const [bookings, setBookings] = useState<DashBooking[]>(CUSTOMER_BOOKINGS)
  const [reviews, setReviews] = useState<DashReview[]>(CUSTOMER_REVIEWS)
  const [loading, setLoading] = useState(true)
  const [cancelId, setCancelId] = useState<string | null>(null)
  const [leavingIds, setLeavingIds] = useState<string[]>([])
  const [reviewId, setReviewId] = useState<string | null>(null)
  const [stars, setStars] = useState(0)
  const [hoverStar, setHoverStar] = useState(0)
  const [reviewBody, setReviewBody] = useState("")
  const revealRef = useReveal([tab, loading])

  useEffect(() => {
    const id = window.setTimeout(() => setLoading(false), 700)
    return () => window.clearTimeout(id)
  }, [])

  const activeCount = bookings.filter((b) => isActiveStatus(b.status)).length
  const needsPayment = bookings.filter((b) => b.status === "ACCEPTED").length
  const spent = bookings
    .filter((b) => ["PAID", "IN_PROGRESS", "COMPLETED"].includes(b.status))
    .reduce((sum, b) => sum + b.amount, 0)
  const reviewsDue = bookings.filter(
    (b) => b.status === "COMPLETED" && !b.reviewed
  ).length

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      if (filter === "Active") return isActiveStatus(b.status)
      if (filter === "Completed") return b.status === "COMPLETED"
      if (filter === "Cancelled")
        return b.status === "CANCELLED" || b.status === "DECLINED"
      return true
    })
  }, [bookings, filter])

  const trackBooking =
    bookings.find((b) => b.status === "IN_PROGRESS") ||
    bookings.find((b) => isActiveStatus(b.status))

  const cancelTarget = bookings.find((b) => b.id === cancelId)
  const reviewTarget = bookings.find((b) => b.id === reviewId)

  const confirmCancel = () => {
    if (!cancelTarget) return
    const id = cancelTarget.id
    const wasPaid = cancelTarget.status === "PAID"
    const reference = cancelTarget.reference
    setCancelId(null)
    setLeavingIds((prev) => [...prev, id])
    window.setTimeout(() => {
      setBookings((prev) =>
        prev.map((b) =>
          b.id === id ? { ...b, status: "CANCELLED" as BookingStatus } : b
        )
      )
      setLeavingIds((prev) => prev.filter((x) => x !== id))
      pushToast(
        "Booking cancelled",
        wasPaid
          ? `${reference} cancelled. Refund will post in 3–5 days.`
          : `${reference} was cancelled.`
      )
    }, 320)
  }

  const submitReview = () => {
    if (!reviewTarget || stars < 1) return
    const next: DashReview = {
      id: `rv-${Date.now()}`,
      technician: reviewTarget.technician.name,
      initials: reviewTarget.technician.initials,
      rating: stars,
      body: reviewBody.trim() || "Great work.",
      date: new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      bookingRef: reviewTarget.reference,
    }
    setReviews((prev) => [next, ...prev])
    setBookings((prev) =>
      prev.map((b) => (b.id === reviewTarget.id ? { ...b, reviewed: true } : b))
    )
    setReviewId(null)
    setStars(0)
    setReviewBody("")
    pushToast("Review posted", `Thanks — ${reviewTarget.technician.name} got your rating.`)
  }

  const groups = [
    {
      label: "Booking",
      items: [
        {
          label: "My bookings",
          href: "/bookings",
          icon: <InboxIcon />,
          pill: bookings.length,
          active: true,
        },
        {
          label: "Browse services",
          href: "/services",
          icon: <WrenchIcon />,
        },
        {
          label: "Pay a booking",
          href: "/bookings",
          icon: <WalletIcon />,
          pill: needsPayment || undefined,
          onClick: () => setTab("Payments"),
        },
      ],
    },
    {
      label: "Account",
      items: [
        {
          label: "Profile",
          href: "/profile",
          icon: <UserRoundIcon />,
        },
        { label: "Log out", href: "#", icon: <LogOutIcon /> },
      ],
    },
  ]

  const actionFor = (b: DashBooking) => {
    if (b.status === "ACCEPTED") {
      return (
        <Link className="dash-btn dash-btn--primary dash-btn--sm" href={`/payment/success?id=${b.reference}`}>
          Pay now
        </Link>
      )
    }
    if (b.status === "COMPLETED" && !b.reviewed) {
      return (
        <button
          type="button"
          className="dash-btn dash-btn--ghost dash-btn--sm"
          onClick={() => setReviewId(b.id)}
        >
          Leave review
        </button>
      )
    }
    if (["REQUESTED", "ACCEPTED", "PAID"].includes(b.status)) {
      return (
        <button
          type="button"
          className="dash-btn dash-btn--ghost dash-btn--sm"
          onClick={() => setCancelId(b.id)}
        >
          Cancel
        </button>
      )
    }
    return (
      <button type="button" className="dash-btn dash-btn--ghost dash-btn--sm">
        Details
      </button>
    )
  }

  const trackSteps = [
    "REQUESTED",
    "ACCEPTED",
    "PAID",
    "IN_PROGRESS",
    "COMPLETED",
  ] as BookingStatus[]
  const currentIdx = trackBooking
    ? Math.max(0, trackSteps.indexOf(trackBooking.status))
    : 0

  return (
    <DashShell
      role="CUSTOMER"
      displayName={name}
      roleLabel="Customer"
      online
      groups={groups}
    >
      <div ref={revealRef as RefObject<HTMLDivElement>}>
        <header className="dash-head">
          <div>
            <p className="dash-eyebrow">Customer dashboard</p>
            <h1 className="dash-title">Hello, {first}</h1>
            <p className="dash-sub">
              One job is in progress and one is waiting for your payment.
            </p>
          </div>
          <div className="dash-head__actions">
            <Link href="/services" className="dash-btn dash-btn--primary">
              Book another job →
            </Link>
          </div>
        </header>

        <div className="stat-row">
          <StatCard
            icon={<InboxIcon size={18} />}
            value={bookings.length}
            label="Total bookings"
            delta="+3 this month"
            delay={0}
          />
          <StatCard
            icon={<CalendarDaysIcon size={18} />}
            value={activeCount}
            label="Active right now"
            delta={`${needsPayment} needs payment`}
            variant="sky"
            delay={55}
          />
          <StatCard
            icon={<WalletIcon size={18} />}
            value={spent}
            label="Spent this year"
            delta="Across 4 trades"
            variant="violet"
            prefix="৳"
            delay={110}
          />
          <StatCard
            icon={<StarIcon size={18} />}
            value={reviewsDue}
            label="Reviews to write"
            delta="Techs are waiting"
            deltaDir="down"
            variant="signal"
            delay={165}
          />
        </div>

        <DashTabs tabs={TABS} active={tab} onChange={setTab} />

        {tab === "Bookings" && (
          <section>
            <div className="chip-row">
              {(["All", "Active", "Completed", "Cancelled"] as Filter[]).map(
                (f) => (
                  <button
                    key={f}
                    type="button"
                    className={`dash-chip${filter === f ? " is-active" : ""}`}
                    onClick={() => setFilter(f)}
                  >
                    {f}
                  </button>
                )
              )}
            </div>
            <div className="table-wrap">
              {loading ? (
                <>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="skel skel-row" />
                  ))}
                </>
              ) : filtered.length === 0 ? (
                <div className="dash-empty">
                  <div className="dash-empty__icon">
                    <InboxIcon size={22} />
                  </div>
                  <h3>Nothing here yet</h3>
                  <p>Try another filter or book a new job.</p>
                </div>
              ) : (
                <>
                  <table className="dash-table">
                    <thead>
                      <tr>
                        <th>Reference</th>
                        <th>Service</th>
                        <th>Technician</th>
                        <th>Slot</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((b) => (
                        <tr
                          key={b.id}
                          className={leavingIds.includes(b.id) ? "is-leaving" : undefined}
                        >
                          <td>
                            <strong>{b.reference}</strong>
                          </td>
                          <td>
                            <div className="cell-stack">
                              <span>{b.service}</span>
                              <small>{b.area}</small>
                            </div>
                          </td>
                          <td>
                            <div className="cell-person">
                              <span className="dash-avatar-sm">
                                {b.technician.initials}
                              </span>
                              <span>{b.technician.name}</span>
                            </div>
                          </td>
                          <td>
                            <div className="cell-stack">
                              <span>{b.date}</span>
                              <small>{b.time}</small>
                            </div>
                          </td>
                          <td>{formatTaka(b.amount)}</td>
                          <td>
                            <StatusBadge status={b.status} />
                          </td>
                          <td>{actionFor(b)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="table-foot">
                    <span>
                      Showing {filtered.length} of {bookings.length} bookings
                    </span>
                    <div className="pager">
                      <button type="button" disabled>
                        Prev
                      </button>
                      <button type="button" disabled>
                        Next
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        {tab === "Payments" && (
          <section className="table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Payment</th>
                  <th>Method</th>
                  <th>Booking</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {CUSTOMER_PAYMENTS.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong>PAY-{p.id.toUpperCase()}</strong>
                    </td>
                    <td>{p.method}</td>
                    <td>{p.bookingRef}</td>
                    <td>{formatTaka(p.amount)}</td>
                    <td>{p.date}</td>
                    <td>
                      <span
                        className={`badge-soft${p.status === "Refunded" ? " badge-soft--refund" : ""}`}
                      >
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {tab === "Reviews" && (
          <section>
            {reviewsDue > 0 && (
              <div className="dash-card" style={{ marginBottom: 14 }}>
                <p className="dash-card__title">Pending reviews</p>
                <p style={{ color: "var(--steel-400)", margin: "8px 0 0" }}>
                  {reviewsDue} completed job{reviewsDue === 1 ? "" : "s"} waiting
                  for your rating.
                </p>
              </div>
            )}
            {reviews.map((r) => (
              <article key={r.id} className="review-card">
                <div className="review-card__top">
                  <span className="dash-avatar-sm">{r.initials}</span>
                  <div>
                    <strong>{r.technician}</strong>
                    <div style={{ color: "var(--hivis-deep)" }}>
                      {"★".repeat(r.rating)}
                      {"☆".repeat(5 - r.rating)}
                    </div>
                  </div>
                  <small style={{ marginLeft: "auto", color: "var(--steel-400)" }}>
                    {r.date} · {r.bookingRef}
                  </small>
                </div>
                <p style={{ margin: 0, color: "var(--steel-500)" }}>{r.body}</p>
              </article>
            ))}
            {!reviews.length && (
              <div className="dash-empty">
                <h3>No reviews yet</h3>
                <p>After a job completes, you can rate the technician here.</p>
              </div>
            )}
          </section>
        )}

        {tab === "Track a job" && (
          <section className="dash-card">
            {trackBooking ? (
              <>
                <div className="dash-card__head">
                  <h2 className="dash-card__title">
                    Tracking {trackBooking.reference}
                  </h2>
                  <StatusBadge status={trackBooking.status} />
                </div>
                <p style={{ marginTop: 0, color: "var(--steel-400)" }}>
                  {trackBooking.service} · {trackBooking.technician.name} ·{" "}
                  {trackBooking.date} {trackBooking.time}
                </p>
                <div className="timeline">
                  {trackSteps.map((step, i) => (
                    <div
                      key={step}
                      className={`timeline__step${i < currentIdx ? " is-done" : ""}${i === currentIdx ? " is-current" : ""}`}
                    >
                      <span className="timeline__dot" />
                      <p className="timeline__title">{step.replace(/_/g, " ")}</p>
                      <p className="timeline__body">
                        {i < currentIdx
                          ? "Completed"
                          : i === currentIdx
                            ? "Current step"
                            : "Up next"}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="dash-empty">
                <h3>No active job to track</h3>
              </div>
            )}
          </section>
        )}
      </div>

      <DashModal
        open={Boolean(cancelTarget)}
        title="Cancel this booking?"
        onClose={() => setCancelId(null)}
        actions={
          <>
            <button
              type="button"
              className="dash-btn dash-btn--ghost"
              onClick={() => setCancelId(null)}
            >
              Keep booking
            </button>
            <button
              type="button"
              className="dash-btn dash-btn--danger"
              onClick={confirmCancel}
            >
              Cancel booking
            </button>
          </>
        }
      >
        {cancelTarget
          ? `Cancel ${cancelTarget.reference} (${cancelTarget.service})? This cannot be undone.`
          : null}
      </DashModal>

      <DashModal
        open={Boolean(reviewTarget)}
        title="Leave a review"
        onClose={() => setReviewId(null)}
        actions={
          <>
            <button
              type="button"
              className="dash-btn dash-btn--ghost"
              onClick={() => setReviewId(null)}
            >
              Close
            </button>
            <button
              type="button"
              className="dash-btn dash-btn--primary"
              disabled={stars < 1}
              onClick={submitReview}
            >
              Submit review
            </button>
          </>
        }
      >
        {reviewTarget && (
          <>
            <div className="cell-person" style={{ marginBottom: 8 }}>
              <span className="dash-avatar">{reviewTarget.technician.initials}</span>
              <strong>{reviewTarget.technician.name}</strong>
            </div>
            <div className="star-row">
              {Array.from({ length: 5 }, (_, i) => {
                const n = i + 1
                const on = n <= (hoverStar || stars)
                return (
                  <button
                    key={n}
                    type="button"
                    className={on ? "is-on" : ""}
                    onMouseEnter={() => setHoverStar(n)}
                    onMouseLeave={() => setHoverStar(0)}
                    onClick={() => setStars(n)}
                    aria-label={`${n} stars`}
                  >
                    <StarIcon size={28} fill={on ? "currentColor" : "none"} />
                  </button>
                )
              })}
            </div>
            <textarea
              className="dash-textarea"
              placeholder="What went well?"
              value={reviewBody}
              onChange={(e) => setReviewBody(e.target.value)}
            />
          </>
        )}
      </DashModal>

      <DashToastHost toasts={toasts} />
    </DashShell>
  )
}
