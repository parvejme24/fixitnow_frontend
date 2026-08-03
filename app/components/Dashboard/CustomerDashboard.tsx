"use client"

import Link from "next/link"
import { useMemo, useState, type RefObject } from "react"
import { useQueries } from "@tanstack/react-query"
import {
  CalendarDaysIcon,
  DownloadIcon,
  EyeIcon,
  InboxIcon,
  LogOutIcon,
  PencilIcon,
  StarIcon,
  Trash2Icon,
  UserRoundIcon,
  WalletIcon,
  WrenchIcon,
} from "lucide-react"

import { useAuth } from "@/app/providers/AuthProvider"
import ProfileFace from "@/app/components/Shared/ProfileFace"
import {
  formatTaka,
  isActiveStatus,
  type BookingStatus,
  type DashBooking,
  type DashReview,
} from "@/app/lib/dashboard-data"
import { toDashBooking } from "@/lib/bookings/api"
import {
  getBookingErrorMessage,
  useCancelBooking,
  useMyBookings,
} from "@/lib/bookings/hooks"
import type { Booking } from "@/lib/bookings/types"
import {
  getPaymentErrorMessage,
  useInitiatePayment,
  useMyPaymentSummaryQuery,
  useMyPaymentsQuery,
} from "@/lib/payments/hooks"
import { type Payment } from "@/lib/payments/api"
import {
  downloadPaymentReceipt,
  downloadPaymentsCsv,
} from "@/lib/payments/export"
import {
  getReviewErrorMessage,
  isReviewOwner,
  useCreateReview,
  useDeleteReview,
  useUpdateReview,
} from "@/lib/reviews/hooks"
import { ApiError } from "@/lib/api"
import { fetchTechnicianReviews } from "@/lib/technicians/api"
import { technicianKeys } from "@/lib/technicians/query-keys"
import DashShell, { useReveal } from "./DashShell"
import {
  DashModal,
  DashTabs,
  DashToastHost,
  StatCard,
  StatusBadge,
  useDashToasts,
} from "./DashShared"

type Filter = "All" | "Requested" | "Completed" | "Cancelled"

const BOOKING_FILTERS: Filter[] = [
  "All",
  "Requested",
  "Completed",
  "Cancelled",
]

const TABS = ["Bookings", "Track a job", "Reviews"]

type PaymentFilter = "All" | "Paid" | "Pending" | "Failed" | "Refunded"

const PAYMENT_FILTERS: PaymentFilter[] = [
  "All",
  "Paid",
  "Pending",
  "Failed",
  "Refunded",
]

type PaymentHistoryRow = {
  id: string
  bookingId: string
  bookingRef: string
  service: string
  amount: number
  method: string
  status: string
  date: string
  providerTxnId?: string | null
  area?: string
  slotDate?: string
  slotTime?: string
  trade?: string
  notes?: string | null
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  technicianName?: string
  technicianTrade?: string
}

function isPersistedReviewId(id: string) {
  return (
    Boolean(id) &&
    !id.startsWith("rv-") &&
    !id.startsWith("api-") &&
    !id.startsWith("reviewed-")
  )
}

export default function CustomerDashboard({
  view = "bookings",
}: {
  view?: "bookings" | "payments"
}) {
  const { user } = useAuth()
  const name = user?.name || "Customer"
  const first = name.split(" ")[0] || "there"
  const { toasts, pushToast } = useDashToasts()
  const [tab, setTab] = useState("Bookings")
  const [filter, setFilter] = useState<Filter>("All")
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("All")
  const [reviews, setReviews] = useState<DashReview[]>([])
  const [cancelId, setCancelId] = useState<string | null>(null)
  const [leavingIds, setLeavingIds] = useState<string[]>([])
  const [reviewId, setReviewId] = useState<string | null>(null)
  const [trackId, setTrackId] = useState<string | null>(null)
  const [stars, setStars] = useState(0)
  const [hoverStar, setHoverStar] = useState(0)
  const [reviewBody, setReviewBody] = useState("")
  const [payingId, setPayingId] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [reviewing, setReviewing] = useState(false)
  const [editReview, setEditReview] = useState<DashReview | null>(null)
  const [deleteReviewTarget, setDeleteReviewTarget] =
    useState<DashReview | null>(null)
  const [hiddenReviewIds, setHiddenReviewIds] = useState<string[]>([])
  const [paymentDetail, setPaymentDetail] =
    useState<PaymentHistoryRow | null>(null)

  const bookingsQuery = useMyBookings()
  const paymentsListQuery = useMyPaymentsQuery(view === "payments")
  const paymentsSummaryQuery = useMyPaymentSummaryQuery(view === "payments")
  const cancelBooking = useCancelBooking()
  const initiatePayment = useInitiatePayment()
  const createReview = useCreateReview()
  const updateReviewMut = useUpdateReview()
  const deleteReviewMut = useDeleteReview()

  const rawById = useMemo(() => {
    const map = new Map<string, Booking>()
    for (const b of bookingsQuery.data ?? []) {
      map.set(b.id, b)
    }
    return map
  }, [bookingsQuery.data])

  const bookings = useMemo(
    () => (bookingsQuery.data ?? []).map(toDashBooking),
    [bookingsQuery.data]
  )
  const loading = bookingsQuery.isLoading

  const formatPaymentDate = (value?: string | null, fallback = "—") => {
    if (!value) return fallback
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return value
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  const paymentBucket = (status: string): PaymentFilter | "Other" => {
    const s = status.toUpperCase().replace(/\s+/g, "_")
    if (
      s === "SUCCESS" ||
      s === "SUCCESSFUL" ||
      s === "PAID" ||
      s === "COMPLETED" ||
      s === "COMPLETE"
    ) {
      return "Paid"
    }
    if (s === "PENDING" || s === "INITIATED" || s === "PROCESSING") {
      return "Pending"
    }
    if (s === "FAILED" || s === "CANCELLED" || s === "CANCELED") {
      return "Failed"
    }
    if (s === "REFUNDED" || s === "REFUND" || s === "PARTIAL_REFUND") {
      return "Refunded"
    }
    return "Other"
  }

  const paymentHistory = useMemo(() => {
    const apiPayments = paymentsListQuery.data
    if (!Array.isArray(apiPayments)) return [] as PaymentHistoryRow[]

    const bookingById = new Map(
      (bookingsQuery.data ?? []).map((b) => [b.id, b] as const)
    )
    const bookingByPaymentId = new Map<string, Booking>()
    for (const b of bookingsQuery.data ?? []) {
      if (b.paymentId) bookingByPaymentId.set(b.paymentId, b)
    }

    return apiPayments.map((payment: Payment): PaymentHistoryRow => {
      const booking =
        bookingById.get(payment.bookingId) ||
        bookingByPaymentId.get(payment.id)
      const amount =
        payment.amount > 0 ? payment.amount : booking?.amount || 0
      return {
        id: payment.id,
        bookingId: payment.bookingId || booking?.id || "",
        bookingRef:
          payment.bookingRef || booking?.reference || payment.id.slice(0, 8),
        service: payment.service || booking?.service || "Service",
        amount,
        method: payment.method || "SHURJOPAY",
        status: payment.status || "PENDING",
        date: formatPaymentDate(
          payment.paidAt || payment.createdAt,
          booking?.date || "—"
        ),
        providerTxnId: payment.providerTxnId || null,
        area: booking?.area,
        slotDate: booking?.date,
        slotTime: booking?.time,
        trade: booking?.trade,
        notes: booking?.notes,
        customerName: booking?.customer.name || name,
        customerEmail: user?.email,
        customerPhone: user?.phone || undefined,
        technicianName: booking?.technician.name,
        technicianTrade: booking?.trade,
      }
    })
  }, [bookingsQuery.data, paymentsListQuery.data, name, user?.email, user?.phone])

  const paymentsLoading =
    (paymentsListQuery.isLoading && !paymentsListQuery.data) ||
    (paymentsListQuery.isFetching && !paymentHistory.length)

  const filteredPayments = useMemo(() => {
    return paymentHistory.filter((p) => {
      if (paymentFilter === "All") return true
      return paymentBucket(p.status) === paymentFilter
    })
  }, [paymentHistory, paymentFilter])

  const paymentFilterCounts = useMemo(() => {
    const counts: Record<PaymentFilter, number> = {
      All: paymentHistory.length,
      Paid: 0,
      Pending: 0,
      Failed: 0,
      Refunded: 0,
    }
    for (const p of paymentHistory) {
      const bucket = paymentBucket(p.status)
      if (bucket !== "Other") counts[bucket] += 1
    }
    return counts
  }, [paymentHistory])

  /** Prefer live list math — summary API often returns 0 for totals. */
  const paymentStats = useMemo(() => {
    const fromList = {
      count: paymentHistory.length,
      paidTotal: 0,
      pendingCount: 0,
      refundedCount: 0,
      refundedTotal: 0,
    }
    for (const p of paymentHistory) {
      const bucket = paymentBucket(p.status)
      if (bucket === "Paid") fromList.paidTotal += p.amount
      if (bucket === "Pending") fromList.pendingCount += 1
      if (bucket === "Refunded") {
        fromList.refundedCount += 1
        fromList.refundedTotal += p.amount
      }
    }

    const summary = paymentsSummaryQuery.data
    if (!paymentHistory.length && summary) {
      return {
        count: summary.count,
        paidTotal: summary.totalPaid,
        pendingCount: summary.pendingCount,
        refundedCount: summary.refundedCount,
      }
    }

    return {
      count: fromList.count || summary?.count || 0,
      paidTotal: fromList.paidTotal,
      pendingCount: fromList.pendingCount,
      refundedCount: fromList.refundedCount,
    }
  }, [paymentHistory, paymentsSummaryQuery.data])

  const paidTotal = paymentStats.paidTotal
  const pendingPayCount = paymentStats.pendingCount
  const refundedCount = paymentStats.refundedCount
  const paymentRecordCount = paymentStats.count

  const downloadAllPayments = () => {
    const rows = filteredPayments.length ? filteredPayments : paymentHistory
    if (!rows.length) {
      pushToast("Nothing to download", "No payment records to export.", "error")
      return
    }
    downloadPaymentsCsv(rows)
    pushToast(
      "Download started",
      `${rows.length} payment${rows.length === 1 ? "" : "s"} exported as CSV.`
    )
  }

  const downloadOnePayment = (payment: PaymentHistoryRow) => {
    downloadPaymentReceipt(payment)
    pushToast("PDF downloaded", `Receipt saved for ${payment.bookingRef}.`)
  }

  const revealRef = useReveal([tab, loading, paymentsLoading])

  const activeCount = bookings.filter((b) => isActiveStatus(b.status)).length
  const needsPayment = bookings.filter((b) => b.status === "ACCEPTED").length
  const spent = bookings
    .filter((b) => ["PAID", "IN_PROGRESS", "COMPLETED"].includes(b.status))
    .reduce((sum, b) => sum + b.amount, 0)
  const reviewsDue = bookings.filter(
    (b) => b.status === "COMPLETED" && !b.reviewed
  ).length

  const techIdsForReviews = useMemo(() => {
    const ids = new Set<string>()
    for (const b of bookingsQuery.data ?? []) {
      if (b.technicianId) ids.add(b.technicianId)
    }
    return Array.from(ids)
  }, [bookingsQuery.data])

  const techReviewQueries = useQueries({
    queries: techIdsForReviews.map((id) => ({
      queryKey: technicianKeys.reviews(id),
      queryFn: () => fetchTechnicianReviews(id),
      enabled: Boolean(id),
      staleTime: 8_000,
    })),
  })

  const reviewsLoading = techReviewQueries.some(
    (q) => q.isLoading || q.isFetching
  )

  const displayReviews = useMemo(() => {
    const bookingsByTech = new Map<string, Booking[]>()
    for (const b of bookingsQuery.data ?? []) {
      if (!b.technicianId) continue
      const list = bookingsByTech.get(b.technicianId) ?? []
      list.push(b)
      bookingsByTech.set(b.technicianId, list)
    }

    const pickBooking = (techId: string) => {
      const list = bookingsByTech.get(techId) ?? []
      return (
        list.find((b) => b.reviewed) ||
        list.find((b) => b.status === "COMPLETED") ||
        list[0]
      )
    }

    const fromApi: DashReview[] = []
    techIdsForReviews.forEach((techId, index) => {
      const rows = techReviewQueries[index]?.data ?? []
      const booking = pickBooking(techId)
      for (const review of rows) {
        if (!isReviewOwner(user, review)) continue
        fromApi.push({
          id: review.id || `api-${techId}-${review.date}-${review.rating}`,
          technician: booking?.technician.name || "Technician",
          initials: booking?.technician.initials || "T",
          rating: review.rating,
          body: review.body,
          date: review.date,
          bookingRef: booking?.reference || "",
          bookingId: booking?.id,
          service: booking?.service,
          technicianId: techId,
        })
      }
    })

    const seen = new Set(
      fromApi.map((r) => `${r.technician}|${r.date}|${r.body}`)
    )
    const locals = reviews.filter((r) => {
      const key = `${r.technician}|${r.date}|${r.body}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    return [...locals, ...fromApi].filter(
      (r) => !hiddenReviewIds.includes(r.id)
    )
    // techReviewQueries.data identities change when fetches settle
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    bookingsQuery.data,
    reviews,
    techIdsForReviews,
    user,
    hiddenReviewIds,
    techReviewQueries.map((q) => q.dataUpdatedAt).join(","),
  ])

  const myReviewCount = displayReviews.length

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      if (filter === "Requested") return b.status === "REQUESTED"
      if (filter === "Completed") return b.status === "COMPLETED"
      if (filter === "Cancelled")
        return b.status === "CANCELLED" || b.status === "DECLINED"
      return true
    })
  }, [bookings, filter])

  const filterCounts = useMemo(() => {
    const counts: Record<Filter, number> = {
      All: bookings.length,
      Requested: bookings.filter((b) => b.status === "REQUESTED").length,
      Completed: bookings.filter((b) => b.status === "COMPLETED").length,
      Cancelled: bookings.filter(
        (b) => b.status === "CANCELLED" || b.status === "DECLINED"
      ).length,
    }
    return counts
  }, [bookings])

  const trackBooking = useMemo(() => {
    if (trackId) {
      const picked = bookings.find((b) => b.id === trackId)
      if (picked) return picked
    }
    return (
      bookings.find((b) => b.status === "IN_PROGRESS") ||
      bookings.find((b) => b.status === "PAID") ||
      bookings.find((b) => isActiveStatus(b.status)) ||
      null
    )
  }, [bookings, trackId])

  const cancelTarget = bookings.find((b) => b.id === cancelId)
  const reviewTarget = bookings.find((b) => b.id === reviewId)

  const openTrack = (id: string) => {
    setTrackId(id)
    setTab("Track a job")
  }

  const confirmCancel = async () => {
    if (!cancelTarget || cancelling) return
    const id = cancelTarget.id
    const wasPaid = cancelTarget.status === "PAID"
    const reference = cancelTarget.reference
    setCancelId(null)
    setLeavingIds((prev) => [...prev, id])
    setCancelling(true)
    try {
      await cancelBooking.mutateAsync(id)
      pushToast(
        "Booking cancelled",
        wasPaid
          ? `${reference} cancelled. Refund will post in 3–5 days.`
          : `${reference} was cancelled.`
      )
    } catch (error) {
      pushToast(
        "Could not cancel",
        getBookingErrorMessage(error),
        "error"
      )
    } finally {
      setLeavingIds((prev) => prev.filter((x) => x !== id))
      setCancelling(false)
    }
  }

  const payNow = async (b: DashBooking) => {
    if (payingId) return
    setPayingId(b.id)
    try {
      await initiatePayment.mutateAsync({ bookingId: b.id })
      // Browser navigates to ShurjoPay checkoutUrl
    } catch (error) {
      pushToast("Payment failed", getPaymentErrorMessage(error), "error")
      setPayingId(null)
    }
  }

  const submitReview = async () => {
    if (!reviewTarget || stars < 1 || reviewing) return
    const raw = rawById.get(reviewTarget.id)
    setReviewing(true)
    try {
      const saved = await createReview.mutateAsync({
        target: "TECHNICIAN",
        technicianId: raw?.technicianId ?? undefined,
        bookingId: reviewTarget.id,
        rating: stars,
        body: reviewBody.trim() || "Great work.",
      })
      const next: DashReview = {
        id: saved.id || `rv-${Date.now()}`,
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
        bookingId: reviewTarget.id,
        service: reviewTarget.service,
        technicianId: raw?.technicianId || undefined,
      }
      setReviews((prev) => [next, ...prev])
      setReviewId(null)
      setStars(0)
      setReviewBody("")
      pushToast(
        "Review posted",
        `Thanks — ${reviewTarget.technician.name} got your rating.`
      )
    } catch (error) {
      pushToast(
        "Could not save review",
        getReviewErrorMessage(error),
        "error"
      )
    } finally {
      setReviewing(false)
    }
  }

  const openEditReview = (r: DashReview) => {
    if (!isPersistedReviewId(r.id)) {
      pushToast(
        "Cannot edit yet",
        "This review is missing a server id. Refresh and try again.",
        "error"
      )
      return
    }
    setEditReview(r)
    setStars(r.rating)
    setHoverStar(0)
    setReviewBody(r.body)
  }

  const submitEditReview = async () => {
    if (!editReview || stars < 1 || reviewing) return
    setReviewing(true)
    try {
      const saved = await updateReviewMut.mutateAsync({
        id: editReview.id,
        input: {
          rating: stars,
          body: reviewBody.trim() || "Great work.",
        },
      })
      setReviews((prev) => {
        const nextRow: DashReview = {
          ...editReview,
          rating: saved.rating || stars,
          body: saved.body || reviewBody.trim() || "Great work.",
          date: saved.date || editReview.date,
        }
        const without = prev.filter((r) => r.id !== editReview.id)
        return [nextRow, ...without]
      })
      setEditReview(null)
      setStars(0)
      setReviewBody("")
      pushToast("Review updated", "Your changes were saved.")
    } catch (error) {
      const unavailable =
        error instanceof ApiError &&
        (error.status === 404 || error.code === "NOT_FOUND")
      pushToast(
        unavailable ? "Update not available" : "Could not update review",
        unavailable
          ? "The server does not support editing reviews yet."
          : getReviewErrorMessage(error),
        "error"
      )
    } finally {
      setReviewing(false)
    }
  }

  const confirmDeleteReview = async () => {
    if (!deleteReviewTarget || reviewing) return
    if (!isPersistedReviewId(deleteReviewTarget.id)) {
      setReviews((prev) =>
        prev.filter((r) => r.id !== deleteReviewTarget.id)
      )
      setHiddenReviewIds((prev) => [...prev, deleteReviewTarget.id])
      setDeleteReviewTarget(null)
      pushToast("Review removed", "That review was removed from your list.")
      return
    }
    setReviewing(true)
    try {
      await deleteReviewMut.mutateAsync(deleteReviewTarget.id)
      setReviews((prev) =>
        prev.filter((r) => r.id !== deleteReviewTarget.id)
      )
      setHiddenReviewIds((prev) => [...prev, deleteReviewTarget.id])
      setDeleteReviewTarget(null)
      pushToast("Review deleted", "Your review was removed.")
    } catch (error) {
      pushToast("Could not delete review", getReviewErrorMessage(error), "error")
    } finally {
      setReviewing(false)
    }
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
          active: view === "bookings",
        },
        {
          label: "Payment history",
          href: "/payments",
          icon: <WalletIcon />,
          pill: paymentHistory.length || undefined,
          active: view === "payments",
        },
        {
          label: "Browse services",
          href: "/services",
          icon: <WrenchIcon />,
        },
      ],
    },
    {
      label: "Account",
      items: [
        {
          label: "My profile",
          href: "/dashboard/profile",
          icon: <UserRoundIcon />,
        },
        { label: "Log out", href: "#", icon: <LogOutIcon /> },
      ],
    },
  ]

  const actionFor = (b: DashBooking) => {
    if (b.status === "ACCEPTED") {
      return (
        <div className="dash-actions">
          <button
            type="button"
            className="dash-btn dash-btn--primary dash-btn--sm"
            disabled={payingId === b.id}
            onClick={() => void payNow(b)}
          >
            {payingId === b.id ? "Starting…" : "Pay now"}
          </button>
          <button
            type="button"
            className="dash-btn dash-btn--danger dash-btn--sm"
            onClick={() => setCancelId(b.id)}
          >
            Cancel
          </button>
        </div>
      )
    }

    if (b.status === "PAID" || b.status === "IN_PROGRESS") {
      return (
        <button
          type="button"
          className="dash-btn dash-btn--primary dash-btn--sm"
          onClick={() => openTrack(b.id)}
        >
          Track job
        </button>
      )
    }

    if (b.status === "COMPLETED") {
      return (
        <div className="dash-actions">
          <Link
            href={`/bookings/${b.id}`}
            className="dash-btn dash-btn--completed dash-btn--sm"
          >
            Job completed
          </Link>
          {b.reviewed ? (
            <span className="badge-soft">Reviewed</span>
          ) : (
            <button
              type="button"
              className="dash-btn dash-btn--review dash-btn--sm"
              onClick={() => {
                setEditReview(null)
                setStars(0)
                setHoverStar(0)
                setReviewBody("")
                setReviewId(b.id)
              }}
            >
              <StarIcon size={14} aria-hidden />
              Make a review
            </button>
          )}
        </div>
      )
    }

    if (b.status === "REQUESTED") {
      return (
        <button
          type="button"
          className="dash-btn dash-btn--danger dash-btn--sm"
          onClick={() => setCancelId(b.id)}
        >
          Cancel
        </button>
      )
    }

    return (
      <Link
        href={`/bookings/${b.id}`}
        className="dash-btn dash-btn--ghost dash-btn--sm"
      >
        Details
      </Link>
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

  const subline =
    view === "payments"
      ? paymentsLoading
        ? "Loading your payment history…"
        : paymentHistory.length
          ? `${paymentHistory.length} payment record${paymentHistory.length === 1 ? "" : "s"} on file.`
          : "Receipts appear here after you pay for a booking."
      : needsPayment > 0 && activeCount > 0
        ? `${activeCount} active job${activeCount === 1 ? "" : "s"} · ${needsPayment} waiting for payment.`
        : activeCount > 0
          ? `${activeCount} active job${activeCount === 1 ? "" : "s"} right now.`
          : "Book a service when you need a hand."

  return (
    <DashShell
      role="CUSTOMER"
      displayName={name}
      roleLabel="Customer"
      online
      initials={user?.initials || undefined}
      image={user?.image}
      groups={groups}
    >
      <div ref={revealRef as RefObject<HTMLDivElement>}>
        <header className="dash-head">
          <div>
            <p className="dash-eyebrow">
              {view === "payments" ? "Payments" : "Customer dashboard"}
            </p>
            <h1 className="dash-title">
              {view === "payments" ? "Payment history" : `Hello, ${first}`}
            </h1>
            <p className="dash-sub">{subline}</p>
          </div>
          <div className="dash-head__actions">
            {view === "payments" ? (
              <button
                type="button"
                className="dash-btn dash-btn--primary"
                disabled={!paymentHistory.length || paymentsLoading}
                onClick={downloadAllPayments}
              >
                <DownloadIcon size={16} />
                Download all
              </button>
            ) : (
              <Link href="/services" className="dash-btn dash-btn--primary">
                Book another job →
              </Link>
            )}
          </div>
        </header>

        <div className="stat-row">
          {view === "payments" ? (
            <>
              <StatCard
                icon={<WalletIcon size={18} />}
                value={paymentRecordCount}
                label="Payment records"
                delta={paymentsLoading ? "Loading…" : "Your history"}
                variant="hivis"
                delay={0}
                animate={!paymentsLoading}
              />
              <StatCard
                icon={<WalletIcon size={18} />}
                value={paidTotal}
                label="Total paid"
                delta="Successful payments"
                variant="signal"
                prefix="৳"
                delay={55}
                animate={!paymentsLoading}
              />
              <StatCard
                icon={<CalendarDaysIcon size={18} />}
                value={pendingPayCount}
                label="Pending"
                delta="Awaiting confirmation"
                variant="sky"
                delay={110}
                animate={!paymentsLoading}
              />
              <StatCard
                icon={<InboxIcon size={18} />}
                value={refundedCount}
                label="Refunded"
                delta="Returned payments"
                variant="flare"
                delay={165}
                animate={!paymentsLoading}
              />
            </>
          ) : (
            <>
              <StatCard
                icon={<InboxIcon size={18} />}
                value={bookings.length}
                label="Total bookings"
                delta={loading ? "Loading…" : "Your jobs"}
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
                delta="Paid & completed"
                variant="violet"
                prefix="৳"
                delay={110}
              />
              <StatCard
                icon={<StarIcon size={18} />}
                value={myReviewCount}
                label="Your reviews"
                delta={
                  reviewsDue
                    ? `${reviewsDue} still to write`
                    : "Posted by you"
                }
                deltaDir={reviewsDue ? "down" : "up"}
                variant="signal"
                delay={165}
              />
            </>
          )}
        </div>

        {view === "payments" ? (
          <section>
            <div className="chip-row">
              {PAYMENT_FILTERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  className={`dash-chip${paymentFilter === f ? " is-active" : ""}`}
                  onClick={() => setPaymentFilter(f)}
                >
                  {f}
                  <span className="dash-chip__count">
                    {paymentFilterCounts[f]}
                  </span>
                </button>
              ))}
            </div>
            <div className="table-wrap table-wrap--scroll">
              {paymentsLoading ? (
                <>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="skel skel-row" />
                  ))}
                </>
              ) : filteredPayments.length === 0 ? (
                <div className="dash-empty">
                  <div className="dash-empty__icon">
                    <WalletIcon size={22} />
                  </div>
                  <h3>No payments yet</h3>
                  <p>
                    After you pay for a booking, the receipt will show up here.
                  </p>
                </div>
              ) : (
                <>
                  <div className="table-scroll">
                    <table className="dash-table dash-table--payments">
                      <thead>
                        <tr>
                          <th>Payment</th>
                          <th>Method</th>
                          <th>Service</th>
                          <th>Booking</th>
                          <th>Amount</th>
                          <th>Date</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPayments.map((p) => (
                          <tr key={p.id}>
                            <td>
                              <strong>
                                PAY-{p.id.slice(0, 8).toUpperCase()}
                              </strong>
                            </td>
                            <td>{p.method.replace(/_/g, " ")}</td>
                            <td>{p.service}</td>
                            <td>
                              {p.bookingId ? (
                                <Link href={`/bookings/${p.bookingId}`}>
                                  {p.bookingRef}
                                </Link>
                              ) : (
                                p.bookingRef
                              )}
                            </td>
                            <td>{formatTaka(p.amount)}</td>
                            <td>{p.date}</td>
                            <td>
                              <StatusBadge status={p.status} />
                            </td>
                            <td>
                              <div className="row-actions">
                                <button
                                  type="button"
                                  className="dash-btn dash-btn--ghost dash-btn--sm"
                                  onClick={() => setPaymentDetail(p)}
                                >
                                  <EyeIcon size={14} />
                                  Details
                                </button>
                                <button
                                  type="button"
                                  className="dash-btn dash-btn--secondary dash-btn--sm"
                                  onClick={() => downloadOnePayment(p)}
                                >
                                  <DownloadIcon size={14} />
                                  Download
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="table-foot">
                    <span>
                      Showing {filteredPayments.length} of{" "}
                      {paymentHistory.length} payments
                    </span>
                  </div>
                </>
              )}
            </div>
          </section>
        ) : (
          <>
        <DashTabs tabs={TABS} active={tab} onChange={setTab} />

        {tab === "Bookings" && (
          <section>
            <div className="chip-row">
              {BOOKING_FILTERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  className={`dash-chip${filter === f ? " is-active" : ""}`}
                  onClick={() => setFilter(f)}
                >
                  {f}
                  <span className="dash-chip__count">{filterCounts[f]}</span>
                </button>
              ))}
            </div>
            <div className="table-wrap table-wrap--scroll">
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
                  <div className="table-scroll">
                    <table className="dash-table dash-table--bookings">
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
                            className={
                              leavingIds.includes(b.id)
                                ? "is-leaving"
                                : undefined
                            }
                          >
                            <td>
                              <Link href={`/bookings/${b.id}`}>
                                <strong>{b.reference}</strong>
                              </Link>
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
                  </div>
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

        {tab === "Reviews" && (
          <section>
            {reviewsLoading && !displayReviews.length ? (
              <>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="skel skel-row" />
                ))}
              </>
            ) : null}
            {displayReviews.map((r) => {
              const bookingHref = r.bookingId
                ? `/bookings/${r.bookingId}`
                : null
              const techHref = r.technicianId
                ? `/technician?id=${r.technicianId}`
                : null
              const serviceLabel = r.service || "View booking"

              return (
                <article key={r.id} className="review-card">
                  <div className="review-card__top">
                    <ProfileFace
                      image={user?.image}
                      initials={
                        user?.initials || name.slice(0, 2).toUpperCase()
                      }
                      className="dash-avatar-sm"
                    />
                    <div>
                      <strong>{name}</strong>
                      <p className="review-card__for">
                        Reviewed{" "}
                        {techHref ? (
                          <Link href={techHref} className="review-card__tech">
                            {r.technician}
                          </Link>
                        ) : (
                          r.technician
                        )}
                      </p>
                      <div style={{ color: "var(--hivis-deep)" }}>
                        {"★".repeat(r.rating)}
                        {"☆".repeat(5 - r.rating)}
                      </div>
                    </div>
                    <small
                      style={{ marginLeft: "auto", color: "var(--steel-400)" }}
                    >
                      {r.date}
                    </small>
                  </div>
                  <p style={{ margin: "10px 0 0", color: "var(--steel-500)" }}>
                    {r.body}
                  </p>
                  {bookingHref ? (
                    <Link href={bookingHref} className="review-card__post">
                      <span className="review-card__post-title">
                        <em className="review-card__post-kicker">Service:</em>{" "}
                        {serviceLabel}
                      </span>
                      <span className="review-card__post-go" aria-hidden>
                        →
                      </span>
                    </Link>
                  ) : null}
                  <div className="review-card__actions">
                    <button
                      type="button"
                      className="dash-btn dash-btn--ghost dash-btn--sm"
                      onClick={() => openEditReview(r)}
                    >
                      <PencilIcon size={14} aria-hidden />
                      Edit
                    </button>
                    <button
                      type="button"
                      className="dash-btn dash-btn--danger dash-btn--sm"
                      onClick={() => setDeleteReviewTarget(r)}
                    >
                      <Trash2Icon size={14} aria-hidden />
                      Delete
                    </button>
                  </div>
                </article>
              )
            })}
            {!reviewsLoading && !displayReviews.length ? (
              <div className="dash-empty">
                <h3>No reviews yet</h3>
                <p>
                  After a completed job, use Make a review on that booking —
                  your ratings will show up here.
                </p>
              </div>
            ) : null}
          </section>
        )}

        {tab === "Track a job" && (
          <section className="dash-card">
            {trackBooking ? (
              <>
                <div className="dash-card__head">
                  <h2 className="dash-card__title">
                    Tracking{" "}
                    <Link href={`/bookings/${trackBooking.id}`}>
                      {trackBooking.reference}
                    </Link>
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
                      <p className="timeline__title">
                        {step.replace(/_/g, " ")}
                      </p>
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
          </>
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
              disabled={cancelling}
              onClick={() => void confirmCancel()}
            >
              {cancelling ? "Cancelling…" : "Cancel booking"}
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
              disabled={stars < 1 || reviewing}
              onClick={() => void submitReview()}
            >
              {reviewing ? "Submitting…" : "Submit review"}
            </button>
          </>
        }
      >
        {reviewTarget && (
          <>
            <div className="cell-person" style={{ marginBottom: 8 }}>
              <span className="dash-avatar">
                {reviewTarget.technician.initials}
              </span>
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

      <DashModal
        open={Boolean(editReview)}
        title="Edit your review"
        onClose={() => {
          setEditReview(null)
          setStars(0)
          setReviewBody("")
        }}
        actions={
          <>
            <button
              type="button"
              className="dash-btn dash-btn--ghost"
              onClick={() => {
                setEditReview(null)
                setStars(0)
                setReviewBody("")
              }}
            >
              Close
            </button>
            <button
              type="button"
              className="dash-btn dash-btn--primary"
              disabled={stars < 1 || reviewing}
              onClick={() => void submitEditReview()}
            >
              {reviewing ? "Saving…" : "Save changes"}
            </button>
          </>
        }
      >
        {editReview ? (
          <>
            <div className="cell-person" style={{ marginBottom: 8 }}>
              <span className="dash-avatar">{editReview.initials}</span>
              <strong>{editReview.technician}</strong>
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
              placeholder="Update your review"
              value={reviewBody}
              onChange={(e) => setReviewBody(e.target.value)}
            />
          </>
        ) : null}
      </DashModal>

      <DashModal
        open={Boolean(deleteReviewTarget)}
        title="Delete this review?"
        onClose={() => setDeleteReviewTarget(null)}
        actions={
          <>
            <button
              type="button"
              className="dash-btn dash-btn--ghost"
              onClick={() => setDeleteReviewTarget(null)}
            >
              Keep review
            </button>
            <button
              type="button"
              className="dash-btn dash-btn--danger"
              disabled={reviewing}
              onClick={() => void confirmDeleteReview()}
            >
              {reviewing ? "Deleting…" : "Delete review"}
            </button>
          </>
        }
      >
        {deleteReviewTarget
          ? `Remove your review for ${deleteReviewTarget.technician}? This cannot be undone.`
          : null}
      </DashModal>

      <DashModal
        open={Boolean(paymentDetail)}
        title="Payment receipt"
        onClose={() => setPaymentDetail(null)}
        actions={
          <>
            <button
              type="button"
              className="dash-btn dash-btn--ghost"
              onClick={() => setPaymentDetail(null)}
            >
              Close
            </button>
            {paymentDetail ? (
              <button
                type="button"
                className="dash-btn dash-btn--primary"
                onClick={() => {
                  downloadOnePayment(paymentDetail)
                }}
              >
                <DownloadIcon size={16} />
                Download PDF
              </button>
            ) : null}
          </>
        }
      >
        {paymentDetail ? (
          <div className="pay-receipt">
            <div className="pay-receipt__brand">
              <span className="pay-receipt__mark" aria-hidden>
                <WrenchIcon size={16} />
              </span>
              <div>
                <p className="pay-receipt__logo">
                  Fix<span>It</span>Now
                </p>
                <p className="pay-receipt__tag">Payment receipt · Dhaka</p>
              </div>
              <div className="pay-receipt__code">
                <StatusBadge status={paymentDetail.status} />
                <strong>
                  PAY-{paymentDetail.id.slice(0, 8).toUpperCase()}
                </strong>
              </div>
            </div>

            <div className="pay-receipt__hero">
              <span>Amount paid</span>
              <strong>{formatTaka(paymentDetail.amount)}</strong>
            </div>

            <div className="pay-receipt__grid">
              <section className="pay-receipt__card">
                <h4>Customer</h4>
                <dl>
                  <div>
                    <dt>Name</dt>
                    <dd>{paymentDetail.customerName || name}</dd>
                  </div>
                  {paymentDetail.customerEmail ? (
                    <div>
                      <dt>Email</dt>
                      <dd>{paymentDetail.customerEmail}</dd>
                    </div>
                  ) : null}
                  {paymentDetail.customerPhone ? (
                    <div>
                      <dt>Phone</dt>
                      <dd>{paymentDetail.customerPhone}</dd>
                    </div>
                  ) : null}
                </dl>
              </section>

              <section className="pay-receipt__card">
                <h4>Technician</h4>
                <dl>
                  <div>
                    <dt>Name</dt>
                    <dd>{paymentDetail.technicianName || "—"}</dd>
                  </div>
                  <div>
                    <dt>Trade</dt>
                    <dd>
                      {paymentDetail.technicianTrade ||
                        paymentDetail.trade ||
                        "—"}
                    </dd>
                  </div>
                </dl>
              </section>

              <section className="pay-receipt__card pay-receipt__card--wide">
                <h4>Service</h4>
                <dl>
                  <div>
                    <dt>Service</dt>
                    <dd>{paymentDetail.service}</dd>
                  </div>
                  <div>
                    <dt>Area</dt>
                    <dd>{paymentDetail.area || "—"}</dd>
                  </div>
                  <div>
                    <dt>Booking</dt>
                    <dd>
                      {paymentDetail.bookingId ? (
                        <Link href={`/bookings/${paymentDetail.bookingId}`}>
                          {paymentDetail.bookingRef}
                        </Link>
                      ) : (
                        paymentDetail.bookingRef
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>Slot</dt>
                    <dd>
                      {[paymentDetail.slotDate, paymentDetail.slotTime]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </dd>
                  </div>
                  {paymentDetail.notes ? (
                    <div className="pay-receipt__notes">
                      <dt>Notes</dt>
                      <dd>{paymentDetail.notes}</dd>
                    </div>
                  ) : null}
                </dl>
              </section>

              <section className="pay-receipt__card pay-receipt__card--wide">
                <h4>Payment</h4>
                <dl>
                  <div>
                    <dt>Method</dt>
                    <dd>{paymentDetail.method.replace(/_/g, " ")}</dd>
                  </div>
                  <div>
                    <dt>Paid on</dt>
                    <dd>{paymentDetail.date}</dd>
                  </div>
                  <div>
                    <dt>Payment ID</dt>
                    <dd className="pay-detail__mono">{paymentDetail.id}</dd>
                  </div>
                  {paymentDetail.providerTxnId ? (
                    <div>
                      <dt>Provider txn</dt>
                      <dd className="pay-detail__mono">
                        {paymentDetail.providerTxnId}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </section>
            </div>
          </div>
        ) : null}
      </DashModal>

      <DashToastHost toasts={toasts} />
    </DashShell>
  )
}
