"use client"

import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react"
import { createPortal } from "react-dom"
import {
  CheckCircle2Icon,
  Clock3Icon,
  LoaderCircleIcon,
  MapPinIcon,
  ShieldCheckIcon,
  StarIcon,
  Trash2Icon,
} from "lucide-react"
import { useReducedMotion } from "framer-motion"

import {
  formatTaka,
  firstName,
  reviewsForTechnician,
  servicesForTechnician,
  type Review,
  type Service,
  type Technician,
} from "@/app/lib/catalogue"
import { useAuth } from "@/app/providers/AuthProvider"
import ProfileFace from "@/app/components/Shared/ProfileFace"
import { initialsFromName } from "@/lib/auth/types"
import {
  getBookingErrorMessage,
  useCreateBooking,
} from "@/lib/bookings/hooks"
import {
  useCategories,
  useService,
  useServices,
  useTechnician,
  useTechnicianSlots,
  useTechnicians,
} from "@/lib/catalogue/hooks"
import type { TechnicianSlot } from "@/lib/catalogue/types"
import { technicianWithAuthImage } from "@/lib/catalogue/with-auth-image"
import { useTechnicianReviewsQuery } from "@/lib/technicians/hooks"
import { mergeReviews } from "@/lib/technicians/api"
import {
  canDeleteReview,
  getReviewErrorMessage,
  useCreateReview,
  useDeleteReview,
  withViewerReviewProfile,
} from "@/lib/reviews/hooks"
import ReviewForm from "@/app/components/Shared/ReviewForm/ReviewForm"

import "./TechnicianDetail.css"

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const
const MON = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const

type DayBucket = {
  index: number
  dateKey: string
  date: Date
  dow: string
  dom: number
  mon: string
  slots: TechnicianSlot[]
}

type ToastItem = {
  id: string
  title: string
  message: string
}

function slotDateKey(raw: string) {
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10)
  const d = new Date(raw)
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10)
  return raw.slice(0, 10)
}

function parseLocalDate(dateKey: string) {
  const [y, m, d] = dateKey.split("-").map(Number)
  return new Date(y, (m || 1) - 1, d || 1, 12, 0, 0, 0)
}

function timeToMinutes(time: string) {
  const m = time.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!m) return 0
  let h = Number(m[1])
  const min = Number(m[2])
  const ap = m[3].toUpperCase()
  if (ap === "AM") {
    if (h === 12) h = 0
  } else if (h !== 12) {
    h += 12
  }
  return h * 60 + min
}

function slotLabel(time: string) {
  return time.replace(":00 ", " ")
}

function groupSlotsByDay(apiSlots: TechnicianSlot[]): DayBucket[] {
  const byDate = new Map<string, TechnicianSlot[]>()
  for (const slot of apiSlots) {
    const key = slotDateKey(slot.date)
    if (!key) continue
    const list = byDate.get(key) ?? []
    list.push(slot)
    byDate.set(key, list)
  }

  return Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateKey, slots], index) => {
      const date = parseLocalDate(dateKey)
      return {
        index,
        dateKey,
        date,
        dow: DOW[date.getDay()],
        dom: date.getDate(),
        mon: MON[date.getMonth()],
        slots: [...slots].sort(
          (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
        ),
      }
    })
}

function nextFreeBadge(slots: TechnicianSlot[], online: boolean) {
  const free = [...slots]
    .filter((s) => !s.isBooked)
    .sort((a, b) => {
      const da = slotDateKey(a.date).localeCompare(slotDateKey(b.date))
      if (da !== 0) return da
      return timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
    })

  if (!free.length) return { label: "No open slots", live: false }
  if (online) return { label: "Available", live: true }

  const first = free[0]
  const day = parseLocalDate(slotDateKey(first.date))
  return { label: `Next free ${DOW[day.getDay()]}`, live: false }
}

function stars(rating: number) {
  const full = Math.round(rating)
  return "★".repeat(full) + "☆".repeat(Math.max(0, 5 - full))
}

function StarsInline({ rating }: { rating: number }) {
  return (
    <span aria-label={`${rating} stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <StarIcon
          key={i}
          size={13}
          className="inline"
          fill={i < Math.round(rating) ? "#E5A900" : "transparent"}
          color="#E5A900"
        />
      ))}{" "}
      {rating.toFixed(1)}
    </span>
  )
}

export default function TechnicianDetail() {
  const searchParams = useSearchParams()
  const reduceMotion = useReducedMotion() ?? false
  const { user } = useAuth()

  const id = searchParams.get("id")
  const serviceParam = searchParams.get("service")

  const techQuery = useTechnician(id ?? "", Boolean(id))
  const serviceQuery = useService(
    serviceParam ?? "",
    Boolean(serviceParam) && !id
  )
  const techniciansQuery = useTechnicians({
    limit: 50,
    categoryId: serviceQuery.data?.cat,
  })
  const servicesQuery = useServices({ limit: 100 })
  const slotsQuery = useTechnicianSlots(
    techQuery.data?.id ?? id ?? "",
    Boolean(techQuery.data?.id || id)
  )

  const tech = useMemo(() => {
    if (techQuery.data) return techQuery.data
    if (id && techQuery.isError) return null
    const list = techniciansQuery.data?.items ?? []
    if (serviceQuery.data) {
      const match = list.find((t) => t.cats.includes(serviceQuery.data.cat))
      if (match) return match
    }
    if (!id && !serviceParam) return null
    return list[0] ?? null
  }, [
    techQuery.data,
    techQuery.isError,
    techniciansQuery.data,
    serviceQuery.data,
    id,
    serviceParam,
  ])

  const canViewUnverified = useMemo(() => {
    if (!tech || !user) return false
    if (user.role === "ADMIN") return true
    if (user.role !== "TECHNICIAN") return false
    return (
      Boolean(user.technicianProfile?.id && user.technicianProfile.id === tech.id) ||
      Boolean(user.id && tech.userId && user.id === tech.userId)
    )
  }, [tech, user])

  const loading =
    (Boolean(id) && techQuery.isLoading) ||
    (!id &&
      Boolean(serviceParam) &&
      (serviceQuery.isLoading || techniciansQuery.isLoading))

  if (loading) {
    return (
      <div className="td-page" style={{ minHeight: "50vh", padding: 40 }}>
        <p style={{ color: "#6E8091" }}>Loading technician…</p>
      </div>
    )
  }

  if (id && techQuery.isError) {
    return (
      <div className="td-page" style={{ minHeight: "50vh", padding: 40 }}>
        <h1>Technician not found</h1>
        <p>We could not load this profile from the API.</p>
        <p>
          <Link href="/technicians">Browse technicians</Link>
        </p>
      </div>
    )
  }

  if (!tech) {
    return (
      <div className="td-page" style={{ minHeight: "50vh", padding: 40 }}>
        <h1>Pick a technician</h1>
        <p>
          Open a profile from the{" "}
          <Link href="/technicians">technicians list</Link>.
        </p>
      </div>
    )
  }

  if (!tech.verified && !canViewUnverified) {
    return (
      <div className="td-page" style={{ minHeight: "50vh", padding: 40 }}>
        <h1>Technician not listed</h1>
        <p>
          This profile is waiting for admin verification and is not shown to
          customers yet.
        </p>
        <p>
          <Link href="/technicians">Browse verified technicians</Link>
        </p>
      </div>
    )
  }

  return (
    <TechnicianDetailView
      tech={tech}
      serviceParam={serviceParam}
      allServices={servicesQuery.data?.items ?? []}
      servicesLoading={servicesQuery.isLoading}
      apiSlots={slotsQuery.data ?? []}
      slotsLoading={slotsQuery.isLoading}
      slotsError={slotsQuery.isError}
      onRetrySlots={() => void slotsQuery.refetch()}
      reduceMotion={reduceMotion}
    />
  )
}

function TechnicianDetailView({
  tech: techProp,
  serviceParam,
  allServices,
  servicesLoading,
  apiSlots,
  slotsLoading,
  slotsError,
  onRetrySlots,
  reduceMotion,
}: {
  tech: Technician
  serviceParam: string | null
  allServices: Service[]
  servicesLoading: boolean
  apiSlots: TechnicianSlot[]
  slotsLoading: boolean
  slotsError: boolean
  onRetrySlots: () => void
  reduceMotion: boolean
}) {
  const { user, isAuthenticated, token } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const createBooking = useCreateBooking()
  const createReview = useCreateReview()
  const deleteReview = useDeleteReview()

  const tech = useMemo(
    () => technicianWithAuthImage(techProp, user),
    [techProp, user]
  )

  const isOwnProfile =
    user?.role === "TECHNICIAN" &&
    (Boolean(user.technicianProfile?.id && user.technicianProfile.id === tech.id) ||
      Boolean(user.id && tech.userId && user.id === tech.userId))

  const availabilityHref = "/dashboard/technician?tab=Availability"

  const catalogueServices = useMemo(
    () => servicesForTechnician(tech, allServices),
    [tech, allServices]
  )

  const services = useMemo(() => {
    if (catalogueServices.length) return catalogueServices
    return [
      {
        id: `visit-${tech.id}`,
        cat: tech.cats[0] ?? "",
        catName: tech.trade,
        title: `${tech.trade} visit`,
        desc: tech.bio || `On-site visit with ${tech.name}`,
        price: 0,
        dur: "As agreed",
        rating: tech.rating,
        reviews: tech.reviews,
      } satisfies Service,
    ]
  }, [catalogueServices, tech])

  const reviewsQuery = useTechnicianReviewsQuery(tech.id)
  const [extraReviews, setExtraReviews] = useState<Review[]>([])
  const baseReviews = useMemo(() => {
    const remote = reviewsQuery.data ?? []
    if (remote.length > 0) return remote
    // Profile can show seeded rating/count while /reviews still returns [].
    if (
      !reviewsQuery.isLoading &&
      !reviewsQuery.isFetching &&
      (tech.reviews > 0 || tech.rating > 0)
    ) {
      return reviewsForTechnician(tech)
    }
    return []
  }, [
    reviewsQuery.data,
    reviewsQuery.isLoading,
    reviewsQuery.isFetching,
    tech,
  ])
  const reviewList = useMemo(
    () =>
      withViewerReviewProfile(mergeReviews(extraReviews, baseReviews), user),
    [extraReviews, baseReviews, user]
  )

  const days = useMemo(() => groupSlotsByDay(apiSlots), [apiSlots])
  const availability = useMemo(
    () => nextFreeBadge(apiSlots, tech.online),
    [apiSlots, tech.online]
  )
  const fname = firstName(tech.name)

  const defaultServiceId = useMemo(() => {
    if (serviceParam && services.some((s) => s.id === serviceParam)) {
      return serviceParam
    }
    return services[0]?.id ?? ""
  }, [serviceParam, services])

  const [selectedServiceId, setSelectedServiceId] = useState(defaultServiceId)
  const [dayIndex, setDayIndex] = useState(0)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [reviewsReady, setReviewsReady] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [requestRef, setRequestRef] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [portalReady, setPortalReady] = useState(false)
  const [lastTechId, setLastTechId] = useState(tech.id)
  const [lastDefaultService, setLastDefaultService] = useState(defaultServiceId)
  const [lastDaysKey, setLastDaysKey] = useState("")

  const daysKey = days.map((d) => d.dateKey).join("|")

  useEffect(() => {
    setPortalReady(true)
  }, [])

  useEffect(() => {
    if (!modalOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) setModalOpen(false)
    }
    document.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener("keydown", onKey)
    }
  }, [modalOpen, submitting])

  if (tech.id !== lastTechId || defaultServiceId !== lastDefaultService) {
    if (tech.id !== lastTechId) setReviewsReady(false)
    setLastTechId(tech.id)
    setLastDefaultService(defaultServiceId)
    setSelectedServiceId(defaultServiceId)
    setSelectedSlot(null)
    setRequestRef(null)
    setExtraReviews([])
    setDayIndex(0)
  }

  if (daysKey !== lastDaysKey) {
    setLastDaysKey(daysKey)
    setDayIndex(0)
    setSelectedSlot(null)
  }

  useEffect(() => {
    document.title = `${tech.name} — FixItNow`
  }, [tech.name])

  useEffect(() => {
    const timer = window.setTimeout(() => setReviewsReady(true), 900)
    return () => window.clearTimeout(timer)
  }, [tech.id])

  const selectedService: Service | undefined = services.find(
    (s) => s.id === selectedServiceId
  )
  const safeDayIndex = Math.min(dayIndex, Math.max(0, days.length - 1))
  const selectedDay = days[safeDayIndex]
  const total =
    selectedService != null ? selectedService.price + tech.rate : null

  const selectedSlotRow = useMemo(() => {
    if (!selectedSlot) return null
    return apiSlots.find((s) => s.id === selectedSlot) ?? null
  }, [selectedSlot, apiSlots])

  const slotSummary =
    selectedDay && selectedSlotRow
      ? `${selectedDay.dow} ${selectedDay.dom} ${selectedDay.mon} · ${slotLabel(selectedSlotRow.startTime)}`
      : "—"

  const canRequest = Boolean(selectedService && selectedSlotRow) && !requestRef

  const pushToast = (title: string, message: string) => {
    const toastId = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    setToasts((prev) => [...prev, { id: toastId, title, message }])
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toastId))
    }, 3600)
  }

  const onPickDay = (index: number) => {
    setDayIndex(index)
    setSelectedSlot(null)
  }

  const sendRequest = async () => {
    if (submitting) return
    if (!isAuthenticated || !user) {
      setModalOpen(false)
      const qs = searchParams.toString()
      const next = qs ? `${pathname}?${qs}` : pathname
      router.push(`/login?next=${encodeURIComponent(next)}`)
      return
    }
    if (user.role !== "CUSTOMER") {
      setModalOpen(false)
      if (user.role === "TECHNICIAN") {
        pushToast(
          "You’re not a customer",
          "Technicians can’t send booking requests. Sign in with a customer account to book this slot."
        )
      } else if (user.role === "ADMIN") {
        pushToast(
          "You’re not a customer",
          "Admins can’t send booking requests. Use a customer account to book."
        )
      } else {
        pushToast(
          "You’re not a customer",
          "Only customer accounts can request bookings."
        )
      }
      return
    }
    if (!selectedService || !selectedSlot) return
    if (selectedService.id.startsWith("visit-")) {
      pushToast(
        "Pick a catalogue service",
        "Choose a real service from the list before booking — visit-only placeholders cannot be booked."
      )
      return
    }

    setSubmitting(true)
    try {
      const booking = await createBooking.mutateAsync({
        serviceId: selectedService.id,
        technicianId: tech.id,
        slotId: selectedSlot,
      })
      setModalOpen(false)
      setRequestRef(booking.reference)
      pushToast(
        "Request sent",
        `${booking.reference} is waiting for ${fname} to accept.`
      )
    } catch (error) {
      pushToast("Could not send request", getBookingErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  const closeModal = () => {
    if (submitting) return
    setModalOpen(false)
  }

  const revealDelay = (n: number) =>
    reduceMotion ? undefined : { animationDelay: `${n * 70}ms` }

  return (
    <div className="td-page">
      <section className="td-hero">
        <div className="td-hero__inner">
          <p className="td-crumbs">
            <Link href="/">Home</Link>
            {" / "}
            <Link href="/services">Browse</Link>
            {" / "}
            <strong>{tech.name}</strong>
          </p>
        </div>
      </section>

      <div className="td-wrap">
        <div className="p-layout">
          <div>
            <IdentityCard tech={tech} style={revealDelay(0)} />
            <SkillsCard
              tech={tech}
              services={catalogueServices}
              fname={fname}
              style={revealDelay(1)}
            />
            <ReviewsCard
              tech={tech}
              fname={fname}
              reviews={reviewList}
              ready={reviewsReady}
              style={revealDelay(2)}
              canDeleteReview={(review) => canDeleteReview(user, review)}
              onDeleteReview={(review) => {
                void (async () => {
                  if (!review.id) {
                    pushToast("Cannot delete", "This review has no id yet.")
                    return
                  }
                  if (!canDeleteReview(user, review)) {
                    pushToast(
                      "Not allowed",
                      "Only the review owner or a technician can delete this review."
                    )
                    return
                  }
                  try {
                    await deleteReview.mutateAsync(review.id)
                    setExtraReviews((prev) =>
                      prev.filter((r) => r.id !== review.id)
                    )
                    pushToast("Review deleted", "The review was removed.")
                  } catch (error) {
                    pushToast("Could not delete", getReviewErrorMessage(error))
                  }
                })()
              }}
              onAddReview={(review) => {
                void (async () => {
                  if (!token || user?.role !== "CUSTOMER") {
                    pushToast(
                      "Sign in required",
                      "Log in as a customer to post a review."
                    )
                    return
                  }
                  try {
                    const saved = await createReview.mutateAsync({
                      target: "TECHNICIAN",
                      technicianId: tech.id,
                      rating: review.rating,
                      body: review.body,
                    })
                    const author =
                      (saved.author && saved.author !== "Customer"
                        ? saved.author
                        : review.author || user.name) || "Customer"
                    setExtraReviews((prev) => [
                      {
                        ...saved,
                        authorId: saved.authorId ?? user.id,
                        author,
                        initials:
                          saved.initials && saved.author !== "Customer"
                            ? saved.initials
                            : initialsFromName(author),
                        image: saved.image || user.image || null,
                      },
                      ...prev,
                    ])
                    pushToast(
                      "Review posted",
                      `Thanks — your rating for ${fname} is live.`
                    )
                  } catch (error) {
                    pushToast("Could not post", getReviewErrorMessage(error))
                  }
                })()
              }}
            />
          </div>

          <aside className="td-book">
            <div className="td-book__head">
              <h2>Book a slot</h2>
              {slotsLoading ? (
                <span className="td-badge td-badge--completed">Checking…</span>
              ) : availability.label === "No open slots" && isOwnProfile ? (
                <Link
                  href={availabilityHref}
                  className="td-badge td-badge--completed td-badge--link"
                  title="Open availability on your dashboard"
                >
                  No open slots · Add slots
                </Link>
              ) : (
                <span
                  className={`td-badge td-badge--${availability.live ? "live" : "completed"}`}
                >
                  {availability.label}
                </span>
              )}
            </div>

            <div className="td-step">
              <p className="td-step__label">Step 1 · Choose the job</p>
              {servicesLoading && !services.length ? (
                <p style={{ color: "#6E8091", fontSize: "0.9rem" }}>
                  Loading services…
                </p>
              ) : (
                services.map((svc) => (
                  <button
                    key={svc.id}
                    type="button"
                    className={`svc-opt${selectedServiceId === svc.id ? " is-on" : ""}`}
                    onClick={() => setSelectedServiceId(svc.id)}
                  >
                    <input
                      type="radio"
                      name="svc"
                      checked={selectedServiceId === svc.id}
                      onChange={() => setSelectedServiceId(svc.id)}
                      tabIndex={-1}
                    />
                    <span className="svc-opt__body">
                      <strong>{svc.title}</strong>
                      <small>{svc.dur}</small>
                    </span>
                    <span className="svc-opt__price">
                      {formatTaka(svc.price)}
                    </span>
                  </button>
                ))
              )}
            </div>

            <div className="td-step">
              <p className="td-step__label">Step 2 · Pick a day</p>
              {slotsLoading ? (
                <p style={{ color: "#6E8091", fontSize: "0.9rem" }}>
                  Loading available days…
                </p>
              ) : slotsError ? (
                <div>
                  <p style={{ color: "#6E8091", fontSize: "0.9rem" }}>
                    Could not load slots from the API.
                  </p>
                  <button
                    type="button"
                    className="td-btn-ghost"
                    style={{ marginTop: 8 }}
                    onClick={onRetrySlots}
                  >
                    Retry
                  </button>
                </div>
              ) : days.length === 0 ? (
                <p style={{ color: "#6E8091", fontSize: "0.9rem" }}>
                  {isOwnProfile ? (
                    <>
                      No open days yet.{" "}
                      <Link href={availabilityHref} className="td-inline-link">
                        Open your dashboard to add slots
                      </Link>
                      .
                    </>
                  ) : (
                    "No open days yet. This technician has not published slots."
                  )}
                </p>
              ) : (
                <div className="daystrip">
                  {days.map((day) => (
                    <button
                      key={day.dateKey}
                      type="button"
                      className={safeDayIndex === day.index ? "is-on" : ""}
                      onClick={() => onPickDay(day.index)}
                    >
                      <span className="daystrip__dow">{day.dow}</span>
                      <span className="daystrip__dom">{day.dom}</span>
                      <span className="daystrip__mon">{day.mon}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="td-step">
              <p className="td-step__label">Step 3 · Pick a time</p>
              {slotsLoading ? (
                <p style={{ color: "#6E8091", fontSize: "0.9rem" }}>
                  Loading available slots…
                </p>
              ) : selectedDay ? (
                <>
                  <div className="slot-grid">
                    {selectedDay.slots.map((slot) => {
                      const on = selectedSlot === slot.id
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          className={`${on ? "is-on" : ""}${slot.isBooked ? " is-booked" : ""}`}
                          disabled={slot.isBooked || Boolean(requestRef)}
                          onClick={() => setSelectedSlot(slot.id)}
                        >
                          {slotLabel(slot.startTime)}
                          {slot.endTime ? (
                            <small
                              style={{
                                display: "block",
                                fontSize: "0.65rem",
                                opacity: 0.75,
                              }}
                            >
                              – {slotLabel(slot.endTime)}
                            </small>
                          ) : null}
                        </button>
                      )
                    })}
                  </div>
                  <div className="slot-legend">
                    <span>
                      <i className="lg-free" /> Free
                    </span>
                    <span>
                      <i className="lg-sel" /> Selected
                    </span>
                    <span>
                      <i className="lg-booked" /> Booked
                    </span>
                  </div>
                </>
              ) : (
                <p style={{ color: "#6E8091", fontSize: "0.9rem" }}>
                  Pick a day to see times.
                </p>
              )}
            </div>

            <div className="td-summary">
              <div className="td-receipt">
                <div className="td-receipt__row">
                  <span>Service</span>
                  <span>
                    {selectedService ? selectedService.title : "—"}
                  </span>
                </div>
                <div className="td-receipt__row">
                  <span>Slot</span>
                  <span>{slotSummary}</span>
                </div>
                <div className="td-receipt__row">
                  <span>Visit fee</span>
                  <span>{formatTaka(tech.rate)}</span>
                </div>
                <div className="td-receipt__row is-total">
                  <span>Total</span>
                  <span>{total != null ? formatTaka(total) : "—"}</span>
                </div>
              </div>

              <button
                type="button"
                className="td-cta"
                disabled={!canRequest}
                onClick={() => setModalOpen(true)}
              >
                {requestRef
                  ? `Request sent · ${requestRef}`
                  : "Request this booking"}
              </button>
              <p className="td-helper">
                Nothing is charged until the technician accepts.
              </p>
            </div>
          </aside>
        </div>
      </div>

      {portalReady &&
        modalOpen &&
        selectedService &&
        selectedSlotRow &&
        createPortal(
          <div
            className="td-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="td-modal-title"
            aria-busy={submitting}
            onClick={(e) => {
              if (e.target === e.currentTarget) closeModal()
            }}
          >
            <div className="td-modal__panel">
              {submitting ? (
                <div className="td-modal__loading" aria-live="polite">
                  <LoaderCircleIcon
                    size={28}
                    className="td-modal__spinner"
                    aria-hidden
                  />
                  <span>Sending your request…</span>
                </div>
              ) : null}
              <h3 id="td-modal-title">Send this request?</h3>
              <div className="td-modal__receipt">
                <div className="td-receipt__row">
                  <span>Technician</span>
                  <span>{tech.name}</span>
                </div>
                <div className="td-receipt__row">
                  <span>Service</span>
                  <span>{selectedService.title}</span>
                </div>
                <div className="td-receipt__row">
                  <span>Slot</span>
                  <span>{slotSummary}</span>
                </div>
                <div className="td-receipt__row">
                  <span>Service charge</span>
                  <span>{formatTaka(selectedService.price)}</span>
                </div>
                <div className="td-receipt__row">
                  <span>Visit fee</span>
                  <span>{formatTaka(tech.rate)}</span>
                </div>
                <div className="td-receipt__row is-total">
                  <span>Payable after acceptance</span>
                  <span>
                    {formatTaka(selectedService.price + tech.rate)}
                  </span>
                </div>
              </div>
              <p className="td-modal__note">
                {fname} usually replies in about {tech.replyMins} minutes.
                You&apos;ll get a Pay now button on your dashboard once the slot
                is confirmed.
              </p>
              <div className="td-modal__actions">
                <button
                  type="button"
                  className="td-btn-ghost"
                  disabled={submitting}
                  onClick={closeModal}
                >
                  Not yet
                </button>
                <button
                  type="button"
                  className="td-btn-primary"
                  disabled={submitting}
                  onClick={() => void sendRequest()}
                >
                  {submitting ? (
                    <>
                      <LoaderCircleIcon
                        size={16}
                        className="td-modal__spinner"
                        aria-hidden
                      />
                      Sending…
                    </>
                  ) : (
                    "Send request"
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {portalReady &&
        createPortal(
          <div className="td-toasts" aria-live="polite">
            {toasts.map((t) => (
              <div key={t.id} className="td-toast" role="status">
                <strong>{t.title}</strong>
                <span>{t.message}</span>
                <i className="td-toast__bar" aria-hidden />
              </div>
            ))}
          </div>,
          document.body
        )}
    </div>
  )
}

function IdentityCard({
  tech,
  style,
}: {
  tech: Technician
  style?: CSSProperties
}) {
  return (
    <article className="td-card td-reveal" data-reveal="zoom" style={style}>
      <div className="td-identity">
        <div className="td-avatar">
          <ProfileFace
            image={tech.image}
            initials={tech.initials}
            name={tech.name}
            className="td-avatar__face"
          />
          {tech.online && <span className="td-avatar__dot" />}
        </div>
        <div className="td-identity__main">
          <div className="td-identity__title">
            <h1>{tech.name}</h1>
            {tech.verified ? (
              <span className="td-badge td-badge--live">Verified</span>
            ) : (
              <span className="td-badge td-badge--completed">Unverified</span>
            )}
          </div>
          <p className="td-meta">
            {tech.trade}
            {tech.area ? ` · ${tech.area}` : ""}
          </p>
          <p className="td-rating-line">
            <StarsInline rating={tech.rating} />
            <span>· {tech.reviews} reviews</span>
            <span className="td-jobs">{tech.jobs} jobs completed</span>
          </p>
        </div>
        <div className="td-fee">
          <strong>{formatTaka(tech.rate)}</strong>
          <span>visit fee</span>
        </div>
        {tech.bio ? <p className="td-bio">{tech.bio}</p> : null}
        <div className="td-facts">
          <div className="td-fact">
            <ShieldCheckIcon size={16} />
            <span>
              {tech.exp > 0
                ? `${tech.exp} years in the trade`
                : "New on FixItNow"}
            </span>
          </div>
          <div className="td-fact">
            <Clock3Icon size={16} />
            <span>Replies in ~{tech.replyMins} min</span>
          </div>
          <div className="td-fact">
            <MapPinIcon size={16} />
            <span>
              {tech.area
                ? `Covers ${tech.area} + ${tech.coverKm} km`
                : `Covers ${tech.coverKm} km radius`}
            </span>
          </div>
          <div className="td-fact">
            <CheckCircle2Icon size={16} />
            <span>30-day work warranty</span>
          </div>
        </div>
      </div>
    </article>
  )
}

function SkillsCard({
  tech,
  services,
  fname,
  style,
}: {
  tech: Technician
  services: Service[]
  fname: string
  style?: CSSProperties
}) {
  const categoriesQuery = useCategories()
  const categories = useMemo(() => {
    const names = tech.catNames ?? []
    if (names.length > 0) return names
    const byId = new Map(
      (categoriesQuery.data ?? []).map((c) => [c.id, c.name] as const)
    )
    return tech.cats
      .map((id) => byId.get(id))
      .filter((name): name is string => Boolean(name))
  }, [tech.catNames, tech.cats, categoriesQuery.data])

  return (
    <article className="td-card td-reveal" style={style}>
      <h2>What {fname} handles</h2>
      {categories.length ? (
        <>
          <p className="td-subhead" style={{ marginTop: 0 }}>
            Categories
          </p>
          <div className="td-skills td-skills--cats">
            {categories.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
        </>
      ) : null}
      {tech.skills.length ? (
        <>
          <p className="td-subhead">Skills</p>
          <div className="td-skills">
            {tech.skills.map((skill) => (
              <span key={skill}>{skill}</span>
            ))}
          </div>
        </>
      ) : null}
      {!categories.length && !tech.skills.length ? (
        <p style={{ color: "var(--steel-400)", margin: "0 0 12px" }}>
          {fname} has not listed categories or skills yet.
        </p>
      ) : null}
      <p className="td-subhead">Services offered</p>
      {services.length ? (
        <div className="td-svc-grid">
          {services.map((svc) => (
            <Link
              key={svc.id}
              href={`/services/${svc.id}`}
              className="td-svc-mini"
            >
              <div className="td-svc-mini__top">
                <h3>{svc.title}</h3>
                <b>{formatTaka(svc.price)}</b>
              </div>
              <p>{svc.desc}</p>
              <p className="td-svc-mini__meta">
                {svc.dur} · {svc.reviews} reviews
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <p style={{ color: "var(--steel-400)", margin: 0 }}>
          Book against {fname}&apos;s visit fee for this trade.
        </p>
      )}
    </article>
  )
}

function ReviewsCard({
  tech,
  fname,
  reviews,
  ready,
  style,
  onAddReview,
  onDeleteReview,
  canDeleteReview: canDeleteThisReview,
}: {
  tech: Technician
  fname: string
  reviews: Review[]
  ready: boolean
  style?: CSSProperties
  onAddReview: (review: Review) => void
  onDeleteReview?: (review: Review) => void
  canDeleteReview?: (review: Review) => boolean
}) {
  return (
    <article className="td-card td-reveal" style={style}>
      <div className="td-reviews-head">
        <h2>Reviews from customers</h2>
        <span>
          {stars(tech.rating)} {tech.rating.toFixed(1)} ·{" "}
          {Math.max(reviews.length, tech.reviews)}
        </span>
      </div>

      {ready && (
        <ReviewForm
          subjectLabel={`${fname}'s visit`}
          onSubmit={onAddReview}
        />
      )}

      {!ready
        ? Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="td-skel">
              <div className="td-skel__avatar" />
              <div className="td-skel__body">
                <div className="td-skel__line td-skel__line--sm" />
                <div className="td-skel__line td-skel__line--md" />
                <div className="td-skel__line" />
              </div>
            </div>
          ))
        : reviews.length === 0
          ? (
              <p style={{ color: "var(--steel-400)" }}>
                No reviews yet for {fname}.
              </p>
            )
          : reviews.map((review) => (
              <div
                key={`${review.id ?? ""}-${review.author}-${review.date}-${review.body.slice(0, 20)}`}
                className="td-review"
              >
                <ProfileFace
                  className="td-review__avatar"
                  imgClassName="td-review__avatar-img"
                  image={review.image}
                  initials={review.initials}
                  name={review.author}
                />
                <div className="td-review__body">
                  <div className="td-review__top">
                    <strong>{review.author}</strong>
                    <em>{review.date}</em>
                    {canDeleteThisReview?.(review) &&
                    review.id &&
                    onDeleteReview ? (
                      <button
                        type="button"
                        className="td-review__delete"
                        aria-label="Delete review"
                        title="Delete review"
                        onClick={() => onDeleteReview(review)}
                      >
                        <Trash2Icon size={15} />
                      </button>
                    ) : null}
                  </div>
                  <div className="td-review__stars">{stars(review.rating)}</div>
                  <p>{review.body}</p>
                </div>
              </div>
            ))}
    </article>
  )
}
