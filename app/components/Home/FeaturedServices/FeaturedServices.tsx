"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { useReducedMotion } from "framer-motion"

import "./FeaturedServices.css"

type IconType = "snow" | "spray" | "pipe" | "bolt"

const FEATURED = [
  {
    id: "s5",
    cat: "AC & Cooling",
    title: "AC Servicing & Gas Refill",
    desc: "Full coil wash, filter clean and R-32 top up.",
    price: 1400,
    dur: "1.5 hrs",
    rating: 4.9,
    reviews: 428,
    tag: "Top rated",
    icon: "snow" as IconType,
  },
  {
    id: "s12",
    cat: "Deep Cleaning",
    title: "Full Apartment Deep Clean",
    desc: "Kitchen degrease, bathroom scrub and floor polish.",
    price: 3600,
    dur: "5 hrs",
    rating: 4.9,
    reviews: 356,
    tag: "Most booked",
    icon: "spray" as IconType,
  },
  {
    id: "s1",
    cat: "Plumbing",
    title: "Leaking Tap & Pipe Fix",
    desc: "Drips, joint leaks and burst lines sealed in one visit.",
    price: 450,
    dur: "45 min",
    rating: 4.9,
    reviews: 312,
    tag: "Most booked",
    icon: "pipe" as IconType,
  },
  {
    id: "s3",
    cat: "Electrical",
    title: "Wiring Fault Diagnosis",
    desc: "Trace short circuits and restore power safely.",
    price: 700,
    dur: "1 hr",
    rating: 4.8,
    reviews: 264,
    tag: "Emergency",
    icon: "bolt" as IconType,
  },
] as const

function formatTaka(n: number) {
  return `৳${n.toLocaleString("en-IN")}`
}

function TradeGlyph({ type }: { type: IconType }) {
  const common = {
    width: 42,
    height: 42,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  }

  switch (type) {
    case "snow":
      return (
        <svg {...common}>
          <path d="M12 2v20" />
          <path d="m4.9 6.5 14.2 11" />
          <path d="m19.1 6.5-14.2 11" />
          <path d="m8 4 4 3 4-3" />
          <path d="m8 20 4-3 4 3" />
          <path d="m3.5 10 3.5 2-1 4" />
          <path d="m20.5 10-3.5 2 1 4" />
        </svg>
      )
    case "spray":
      return (
        <svg {...common}>
          <path d="M9 10h6v11H9z" />
          <path d="M11 10V7h2v3" />
          <path d="M12 7V4" />
          <path d="M12 4h3.5" />
          <path d="M16 3.5c1.2.4 2.2 1.2 2.8 2.2M16 6c.8.3 1.5.8 2 1.5" />
        </svg>
      )
    case "pipe":
      return (
        <svg {...common}>
          <path d="M4 10h6v4H4z" />
          <path d="M10 12h4" />
          <path d="M14 8h6v8h-6" />
          <path d="M7 10V7a2 2 0 0 1 2-2h1" />
        </svg>
      )
    case "bolt":
      return (
        <svg {...common}>
          <path d="M13 2 4 14h7l-1 8 10-14h-7l0-6z" />
        </svg>
      )
  }
}

function RatingStars({ rating }: { rating: number }) {
  const filled = Math.round(rating)
  return (
    <span className="fs-stars" aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < filled ? "is-on" : ""}>
          ★
        </span>
      ))}
    </span>
  )
}

function SkeletonCard() {
  return (
    <div className="sk-card" aria-hidden>
      <div className="sk-media" />
      <div className="sk-body">
        <div className="sk-line" style={{ width: "60%" }} />
        <div className="sk-line" style={{ width: "80%" }} />
        <div className="sk-line" style={{ width: "40%" }} />
      </div>
    </div>
  )
}

export default function FeaturedServices() {
  const reduceMotion = useReducedMotion() ?? false
  const [loading, setLoading] = useState(true)
  const gridRef = useRef<HTMLDivElement>(null)
  const showSkeleton = loading && !reduceMotion

  useEffect(() => {
    if (reduceMotion) return
    const id = window.setTimeout(() => setLoading(false), 900)
    return () => window.clearTimeout(id)
  }, [reduceMotion])

  useEffect(() => {
    if (showSkeleton) return
    const root = gridRef.current
    if (!root) return
    const cards = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"))

    if (reduceMotion) {
      cards.forEach((el) => el.classList.add("is-in"))
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in")
            io.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.12 }
    )

    cards.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [showSkeleton, reduceMotion])

  return (
    <section
      className="section section--concrete fs-section"
      aria-labelledby="featured-heading"
    >
      <div className="fs-wrap">
        <div className="section-head">
          <div>
            <p className="fs-eyebrow">Booked most this month</p>
            <h2 id="featured-heading" className="display-lg">
              Popular right now
            </h2>
          </div>
          <Link href="/services" className="fs-ghost">
            Browse all
          </Link>
        </div>

        <div
          ref={gridRef}
          className="grid grid-auto"
          aria-busy={showSkeleton}
        >
          {showSkeleton
            ? Array.from({ length: 4 }, (_, i) => <SkeletonCard key={i} />)
            : FEATURED.map((svc, index) => (
                <Link
                  key={svc.id}
                  href={`/technician?service=${svc.id}`}
                  className="svc-card"
                  data-reveal
                  style={{ transitionDelay: `${index * 55}ms` }}
                >
                  <div className="svc-card__media">
                    {svc.tag && (
                      <span className="badge badge--hivis">
                        <i />
                        {svc.tag}
                      </span>
                    )}
                    <span className="svc-card__glyph">
                      <TradeGlyph type={svc.icon} />
                    </span>
                    <span className="svc-card__price">
                      {formatTaka(svc.price)}
                    </span>
                  </div>
                  <div className="svc-card__body">
                    <p className="svc-card__cat">{svc.cat}</p>
                    <h3 className="svc-card__title">{svc.title}</h3>
                    <p className="svc-card__desc">{svc.desc}</p>
                    <div className="svc-card__foot">
                      <span className="svc-card__rating">
                        <RatingStars rating={svc.rating} />
                        <b>{svc.rating.toFixed(1)}</b>
                        <em>({svc.reviews})</em>
                      </span>
                      <span className="svc-card__dur">{svc.dur}</span>
                    </div>
                  </div>
                </Link>
              ))}
        </div>
      </div>
    </section>
  )
}
