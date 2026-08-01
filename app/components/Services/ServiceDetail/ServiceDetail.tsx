"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import {
  CheckCircle2Icon,
  Clock3Icon,
  ShieldCheckIcon,
  WrenchIcon,
} from "lucide-react"

import ReviewForm from "@/app/components/Shared/ReviewForm/ReviewForm"
import ServiceMedia from "@/app/components/Shared/ServiceMedia"
import {
  formatTaka,
  techniciansForService,
  type Review,
  type Service,
  type Technician,
} from "@/app/lib/catalogue"
import { formatServiceTag } from "@/lib/catalogue/normalize"
import { useAuth } from "@/app/providers/AuthProvider"
import { useService, useTechnicians } from "@/lib/catalogue/hooks"
import {
  getReviewErrorMessage,
  useCreateReview,
  useDeleteReview,
  useServiceReviewsQuery,
} from "@/lib/reviews/hooks"

import "./ServiceDetail.css"

const INCLUDES = [
  "Verified technician matched to this trade",
  "Fixed starting price shown before you book",
  "Tools and basic consumables included",
  "30-day workmanship warranty",
]

const STEPS = [
  {
    title: "Pick this job",
    body: "Confirm the service fits your issue — or choose a nearby tech who handles it.",
  },
  {
    title: "Choose a slot",
    body: "On the technician page, select day and time. Nothing is charged until they accept.",
  },
  {
    title: "Pay after accept",
    body: "Once the tech confirms, pay from your dashboard and lock the visit in.",
  },
]

function stars(rating: number) {
  const full = Math.round(rating)
  return "★".repeat(full) + "☆".repeat(Math.max(0, 5 - full))
}

export default function ServiceDetail({ serviceId }: { serviceId: string }) {
  const serviceQuery = useService(serviceId)
  const techniciansQuery = useTechnicians({ limit: 50 })

  if (serviceQuery.isLoading) {
    return (
      <div className="sd-page">
        <div className="sd-missing">
          <h1>Loading service…</h1>
        </div>
      </div>
    )
  }

  if (serviceQuery.isError || !serviceQuery.data) {
    return (
      <div className="sd-page">
        <div className="sd-missing">
          <h1>Service not found</h1>
          <p>That job is not in the catalogue. Browse available services instead.</p>
          <Link href="/services" className="sd-panel__cta" style={{ display: "inline-block", width: "auto", paddingInline: 22 }}>
            Browse services
          </Link>
        </div>
      </div>
    )
  }

  return (
    <ServiceDetailView
      service={serviceQuery.data}
      technicians={techniciansQuery.data?.items ?? []}
    />
  )
}

function ServiceDetailView({
  service,
  technicians,
}: {
  service: Service
  technicians: Technician[]
}) {
  const { user, token } = useAuth()
  const reviewsQuery = useServiceReviewsQuery(service.id)
  const createReview = useCreateReview()
  const deleteReviewMut = useDeleteReview()
  const techs = useMemo(
    () => techniciansForService(service, technicians),
    [service, technicians]
  )
  const [extraReviews, setExtraReviews] = useState<Review[]>([])
  const reviews = useMemo(
    () => [...extraReviews, ...(reviewsQuery.data ?? [])],
    [extraReviews, reviewsQuery.data]
  )
  const [toast, setToast] = useState<{ title: string; message: string } | null>(
    null
  )
  const [newId, setNewId] = useState<string | null>(null)

  const avgRating = useMemo(() => {
    if (!reviews.length) return service.rating
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0)
    return Math.round((sum / reviews.length) * 10) / 10
  }, [reviews, service.rating])

  const onReview = async (review: Review) => {
    if (!token || user?.role !== "CUSTOMER") {
      setToast({
        title: "Sign in required",
        message: "Log in as a customer to post a review.",
      })
      window.setTimeout(() => setToast(null), 3400)
      return
    }
    try {
      const saved = await createReview.mutateAsync({
        target: "SERVICE",
        serviceId: service.id,
        rating: review.rating,
        body: review.body,
      })
      setExtraReviews((prev) => [saved, ...prev])
      setNewId(`${saved.author}-${saved.date}-${saved.body.slice(0, 12)}`)
      setToast({
        title: "Review posted",
        message: "Thanks — your rating helps the next customer choose.",
      })
    } catch (error) {
      setToast({
        title: "Could not post",
        message: getReviewErrorMessage(error),
      })
    }
    window.setTimeout(() => setToast(null), 3400)
    window.setTimeout(() => setNewId(null), 2200)
  }

  const onDelete = async (review: Review) => {
    if (!review.id) return
    try {
      await deleteReviewMut.mutateAsync(review.id)
      setExtraReviews((prev) => prev.filter((r) => r.id !== review.id))
      setToast({ title: "Review deleted", message: "The review was removed." })
      void reviewsQuery.refetch()
    } catch (error) {
      setToast({
        title: "Could not delete",
        message: getReviewErrorMessage(error),
      })
    }
    window.setTimeout(() => setToast(null), 3400)
  }

  return (
    <div className="sd-page">
      <section className="sd-hero">
        <div className="sd-hero__inner">
          <p className="sd-crumbs">
            <Link href="/">Home</Link>
            {" / "}
            <Link href="/services">Browse</Link>
            {" / "}
            <strong>{service.title}</strong>
          </p>
          {service.tag && (
            <span className="sd-hero__tag">{formatServiceTag(service.tag)}</span>
          )}
          <div className="sd-hero__visual">
            <ServiceMedia
              image={service.image}
              title={service.title}
              className="sd-hero__photo"
              glyphSize={56}
            />
          </div>
          <p
            style={{
              margin: "0 0 8px",
              fontFamily: "var(--font-hivis-mono), monospace",
              fontSize: "0.72rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#9AABB8",
            }}
          >
            {service.catName}
          </p>
          <h1>{service.title}</h1>
          <p className="sd-hero__lede">{service.desc}</p>
          <div className="sd-hero__meta">
            <span>
              <b>{stars(avgRating)}</b> {avgRating.toFixed(1)} · {reviews.length}{" "}
              reviews
            </span>
            <span>
              Duration <b>{service.dur}</b>
            </span>
            <span>
              From <b>{formatTaka(service.price)}</b>
            </span>
          </div>
        </div>
      </section>

      <div className="sd-wrap">
        <div className="sd-layout">
          <div>
            <article className="sd-card">
              <h2>What&apos;s included</h2>
              <ul className="sd-include">
                {INCLUDES.map((item) => (
                  <li key={item}>
                    <CheckCircle2Icon size={16} />
                    <span>{item}</span>
                  </li>
                ))}
                <li>
                  <Clock3Icon size={16} />
                  <span>Typical visit length: {service.dur}</span>
                </li>
                <li>
                  <ShieldCheckIcon size={16} />
                  <span>Starting service charge: {formatTaka(service.price)}</span>
                </li>
                <li>
                  <WrenchIcon size={16} />
                  <span>
                    Matched to {service.catName} specialists in Dhaka
                  </span>
                </li>
              </ul>
            </article>

            <article className="sd-card">
              <h2>How booking works</h2>
              <div className="sd-steps">
                {STEPS.map((step, i) => (
                  <div key={step.title} className="sd-step">
                    <span className="sd-step__n">{i + 1}</span>
                    <div>
                      <strong>{step.title}</strong>
                      <p>{step.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="sd-card">
              <h2>Technicians for this job</h2>
              <div className="sd-tech-grid">
                {techs.map((tech) => (
                  <Link
                    key={tech.id}
                    href={`/technician?id=${tech.id}&service=${service.id}`}
                    className="sd-tech"
                  >
                    <div className="sd-tech__av">
                      {tech.initials}
                      {tech.online && <i />}
                    </div>
                    <div>
                      <p className="sd-tech__name">{tech.name}</p>
                      <p className="sd-tech__meta">
                        {tech.area} · {tech.rating.toFixed(1)} ★ ·{" "}
                        {formatTaka(tech.rate)}/visit
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </article>

            <article className="sd-card">
              <div className="sd-reviews-head">
                <h2>Customer reviews</h2>
                <span>
                  {stars(avgRating)} {avgRating.toFixed(1)} · {reviews.length}
                </span>
              </div>

              <ReviewForm
                subjectLabel={`“${service.title}”`}
                onSubmit={(review) => {
                  void onReview(review)
                }}
              />

              {reviews.map((review) => {
                const key = `${review.id ?? ""}-${review.author}-${review.date}-${review.body.slice(0, 24)}`
                return (
                  <div
                    key={key}
                    className={`sd-review${newId === key ? " is-new" : ""}`}
                  >
                    <div className="sd-review__av">{review.initials}</div>
                    <div>
                      <div className="sd-review__top">
                        <strong>{review.author}</strong>
                        <em>{review.date}</em>
                      </div>
                      <div className="sd-review__stars">
                        {stars(review.rating)}
                      </div>
                      <p>{review.body}</p>
                      {(user?.role === "ADMIN" || user?.role === "CUSTOMER") &&
                      review.id ? (
                        <button
                          type="button"
                          className="sd-panel__ghost"
                          style={{ marginTop: 6, fontSize: "0.78rem" }}
                          onClick={() => void onDelete(review)}
                        >
                          Delete review
                        </button>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </article>
          </div>

          <aside className="sd-panel">
            <div className="sd-panel__price">
              <strong>{formatTaka(service.price)}</strong>
              <span>starting</span>
            </div>
            <div className="sd-panel__rows">
              <div className="sd-panel__row">
                <span>Trade</span>
                <b>{service.catName}</b>
              </div>
              <div className="sd-panel__row">
                <span>Duration</span>
                <b>{service.dur}</b>
              </div>
              <div className="sd-panel__row">
                <span>Rating</span>
                <b>
                  {avgRating.toFixed(1)} · {reviews.length}
                </b>
              </div>
              <div className="sd-panel__row">
                <span>Techs available</span>
                <b>{techs.length}</b>
              </div>
            </div>

            <Link
              href={`/technician?service=${service.id}`}
              className="sd-panel__cta"
            >
              Book this service
            </Link>
            <Link href="/technicians" className="sd-panel__ghost">
              Browse all technicians
            </Link>
            <p className="sd-panel__note">
              Visit fee is set by the technician and added at booking.
            </p>
          </aside>
        </div>
      </div>

      {toast && (
        <div className="sd-toast" role="status">
          <strong>{toast.title}</strong>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  )
}
