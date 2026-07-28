"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState, type CSSProperties } from "react"
import {
  CheckCircle2Icon,
  Clock3Icon,
  MapPinIcon,
  ShieldCheckIcon,
  StarIcon,
} from "lucide-react"
import { useReducedMotion } from "framer-motion"

import {
  formatTaka,
  firstName,
  resolveTechnician,
  reviewsForTechnician,
  servicesForTechnician,
  type Review,
  type Service,
  type Technician,
} from "@/app/lib/catalogue"
import ReviewForm from "@/app/components/Shared/ReviewForm/ReviewForm"

import "./TechnicianDetail.css"

const DEMO_START = new Date(2026, 6, 29)
const BOOKED_SEEDS = [1, 4, 7, 2, 9, 3, 6]
const SLOT_TIMES = [
  "08:00 AM",
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "01:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
  "05:00 PM",
  "06:00 PM",
  "07:00 PM",
] as const

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

type DayInfo = {
  index: number
  date: Date
  dow: string
  dom: number
  mon: string
  isFriday: boolean
}

type ToastItem = {
  id: string
  title: string
  message: string
}

function buildDays(): DayInfo[] {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(DEMO_START)
    date.setDate(DEMO_START.getDate() + index)
    return {
      index,
      date,
      dow: DOW[date.getDay()],
      dom: date.getDate(),
      mon: MON[date.getMonth()],
      isFriday: date.getDay() === 5,
    }
  })
}

function slotLabel(time: string) {
  return time.replace(":00 ", " ")
}

function isSlotBooked(dayIndex: number, slotIndex: number) {
  const seed = BOOKED_SEEDS[dayIndex % 7]
  return (slotIndex * 3 + seed) % 5 === 0
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

  const id = searchParams.get("id")
  const serviceParam = searchParams.get("service")

  const tech = useMemo(
    () => resolveTechnician(id, serviceParam),
    [id, serviceParam]
  )
  const services = useMemo(() => servicesForTechnician(tech), [tech])
  const baseReviews = useMemo(() => reviewsForTechnician(tech), [tech])
  const [extraReviews, setExtraReviews] = useState<Review[]>([])
  const reviewList = useMemo(
    () => [...extraReviews, ...baseReviews],
    [extraReviews, baseReviews]
  )
  const days = useMemo(() => buildDays(), [])
  const fname = firstName(tech.name)

  const defaultServiceId = useMemo(() => {
    if (serviceParam && services.some((s) => s.id === serviceParam)) {
      return serviceParam
    }
    return ""
  }, [serviceParam, services])

  const [selectedServiceId, setSelectedServiceId] = useState(defaultServiceId)
  const [dayIndex, setDayIndex] = useState(() => {
    const firstFree = days.findIndex((d) => !d.isFriday)
    return firstFree >= 0 ? firstFree : 0
  })
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [reviewsReady, setReviewsReady] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [requestRef, setRequestRef] = useState<string | null>(null)
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [lastTechId, setLastTechId] = useState(tech.id)
  const [lastDefaultService, setLastDefaultService] = useState(defaultServiceId)

  // Sync selection when query resolution changes (React render-time sync)
  if (tech.id !== lastTechId || defaultServiceId !== lastDefaultService) {
    if (tech.id !== lastTechId) setReviewsReady(false)
    setLastTechId(tech.id)
    setLastDefaultService(defaultServiceId)
    setSelectedServiceId(defaultServiceId)
    setSelectedSlot(null)
    setRequestRef(null)
    setExtraReviews([])
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
  const selectedDay = days[dayIndex]
  const total =
    selectedService != null ? selectedService.price + tech.rate : null

  const slotSummary =
    selectedDay && selectedSlot
      ? `${selectedDay.dow} ${selectedDay.dom} ${selectedDay.mon} · ${slotLabel(selectedSlot)}`
      : "—"

  const canRequest = Boolean(selectedService && selectedSlot) && !requestRef

  const pushToast = (title: string, message: string) => {
    const toastId = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    setToasts((prev) => [...prev, { id: toastId, title, message }])
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toastId))
    }, 3600)
  }

  const onPickDay = (index: number) => {
    if (days[index]?.isFriday) return
    setDayIndex(index)
    setSelectedSlot(null)
  }

  const sendRequest = () => {
    const ref = `FIX-${4830 + Math.floor(Math.random() * 60)}`
    setModalOpen(false)
    window.setTimeout(() => {
      setRequestRef(ref)
      pushToast(
        "Request sent",
        `${ref} is waiting for ${fname} to accept.`
      )
      window.setTimeout(() => {
        pushToast(
          "Slot accepted",
          "Head to your dashboard to pay and lock it in."
        )
      }, 3200)
    }, 260)
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
            <IdentityCard
              tech={tech}
              style={revealDelay(0)}
            />
            <SkillsCard
              tech={tech}
              services={services}
              fname={fname}
              style={revealDelay(1)}
            />
            <ReviewsCard
              tech={tech}
              fname={fname}
              reviews={reviewList}
              ready={reviewsReady}
              style={revealDelay(2)}
              onAddReview={(review) => {
                setExtraReviews((prev) => [review, ...prev])
                pushToast(
                  "Review posted",
                  `Thanks — your rating for ${fname} is live.`
                )
              }}
            />
          </div>

          <aside className="td-book">
            <div className="td-book__head">
              <h2>Book a slot</h2>
              {tech.online ? (
                <span className="td-badge td-badge--live">Available</span>
              ) : (
                <span className="td-badge td-badge--completed">
                  Next free Sunday
                </span>
              )}
            </div>

            <div className="td-step">
              <p className="td-step__label">Step 1 · Choose the job</p>
              {services.map((svc) => (
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
                  <span className="svc-opt__price">{formatTaka(svc.price)}</span>
                </button>
              ))}
            </div>

            <div className="td-step">
              <p className="td-step__label">Step 2 · Pick a day</p>
              <div className="daystrip">
                {days.map((day) => (
                  <button
                    key={day.index}
                    type="button"
                    className={`${dayIndex === day.index ? "is-on" : ""}${day.isFriday ? " is-off" : ""}`}
                    disabled={day.isFriday}
                    onClick={() => onPickDay(day.index)}
                  >
                    <span className="daystrip__dow">{day.dow}</span>
                    <span className="daystrip__dom">{day.dom}</span>
                    <span className="daystrip__mon">{day.mon}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="td-step">
              <p className="td-step__label">Step 3 · Pick a time</p>
              <div className="slot-grid">
                {SLOT_TIMES.map((time, i) => {
                  const booked = isSlotBooked(dayIndex, i)
                  const on = selectedSlot === time
                  return (
                    <button
                      key={time}
                      type="button"
                      className={`${on ? "is-on" : ""}${booked ? " is-booked" : ""}`}
                      disabled={booked || Boolean(requestRef)}
                      onClick={() => setSelectedSlot(time)}
                    >
                      {slotLabel(time)}
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

      {modalOpen && selectedService && selectedSlot && (
        <div
          className="td-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="td-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false)
          }}
        >
          <div className="td-modal__panel">
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
                <span>{formatTaka(selectedService.price + tech.rate)}</span>
              </div>
            </div>
            <p className="td-modal__note">
              {fname} usually replies in about 8 minutes. You&apos;ll get a Pay
              now button on your dashboard once the slot is confirmed.
            </p>
            <div className="td-modal__actions">
              <button
                type="button"
                className="td-btn-ghost"
                onClick={() => setModalOpen(false)}
              >
                Not yet
              </button>
              <button
                type="button"
                className="td-btn-primary"
                onClick={sendRequest}
              >
                Send request
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="td-toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="td-toast" role="status">
            <strong>{t.title}</strong>
            <span>{t.message}</span>
            <i className="td-toast__bar" aria-hidden />
          </div>
        ))}
      </div>
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
    <article
      className="td-card td-reveal"
      data-reveal="zoom"
      style={style}
    >
      <div className="td-identity">
        <div className="td-avatar">
          {tech.initials}
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
            {tech.trade} · {tech.area}, Dhaka
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
        <p className="td-bio">{tech.bio}</p>
        <div className="td-facts">
          <div className="td-fact">
            <ShieldCheckIcon size={16} />
            <span>{tech.exp} years in the trade</span>
          </div>
          <div className="td-fact">
            <Clock3Icon size={16} />
            <span>Replies in ~8 min</span>
          </div>
          <div className="td-fact">
            <MapPinIcon size={16} />
            <span>Covers {tech.area} + 4 km</span>
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
  return (
    <article className="td-card td-reveal" style={style}>
      <h2>What {fname} handles</h2>
      <div className="td-skills">
        {tech.skills.map((skill) => (
          <span key={skill}>{skill}</span>
        ))}
      </div>
      <p className="td-subhead">Services offered</p>
      <div className="td-svc-grid">
        {services.map((svc) => (
          <Link key={svc.id} href={`/services/${svc.id}`} className="td-svc-mini">
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
}: {
  tech: Technician
  fname: string
  reviews: Review[]
  ready: boolean
  style?: CSSProperties
  onAddReview: (review: Review) => void
}) {
  return (
    <article className="td-card td-reveal" style={style}>
      <div className="td-reviews-head">
        <h2>Reviews from customers</h2>
        <span>
          {stars(tech.rating)} {tech.rating.toFixed(1)} · {reviews.length}
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
        : reviews.map((review) => (
            <div
              key={`${review.author}-${review.date}-${review.body.slice(0, 20)}`}
              className="td-review"
            >
              <div className="td-review__avatar">{review.initials}</div>
              <div>
                <div className="td-review__top">
                  <strong>{review.author}</strong>
                  <em>{review.date}</em>
                </div>
                <div className="td-review__stars">{stars(review.rating)}</div>
                <p>{review.body}</p>
              </div>
            </div>
          ))}
    </article>
  )
}
