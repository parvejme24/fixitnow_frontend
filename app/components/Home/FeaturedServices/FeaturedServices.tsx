"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef } from "react"
import { useReducedMotion } from "framer-motion"

import { formatTaka } from "@/app/lib/catalogue"
import ServiceMedia from "@/app/components/Shared/ServiceMedia"
import { formatServiceTag } from "@/lib/catalogue/normalize"
import { useServices } from "@/lib/catalogue/hooks"

import "./FeaturedServices.css"

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
  const gridRef = useRef<HTMLDivElement>(null)
  const servicesQuery = useServices({ limit: 100 })
  const featured = useMemo(() => {
    const items = servicesQuery.data?.items ?? []
    const active = items.filter((s) => s.isActive !== false)
    const preferred = active.filter((s) => s.isFeatured)
    const pool = preferred.length ? preferred : active
    return [...pool]
      .sort((a, b) => b.reviews - a.reviews || b.rating - a.rating)
      .slice(0, 4)
  }, [servicesQuery.data?.items])

  const showSkeleton = servicesQuery.isLoading && featured.length === 0
  const showError =
    !showSkeleton && featured.length === 0 && servicesQuery.isError

  useEffect(() => {
    const root = gridRef.current
    if (!root || showSkeleton) return
    const cards = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"))

    if (reduceMotion) {
      cards.forEach((el) => el.classList.add("is-in"))
      return
    }

    // Reveal immediately if already in viewport; observe the rest.
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in")
            io.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -4% 0px" }
    )

    cards.forEach((el) => {
      const rect = el.getBoundingClientRect()
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        el.classList.add("is-in")
      } else {
        io.observe(el)
      }
    })
    // Safety: never leave cards invisible
    const t = window.setTimeout(() => {
      cards.forEach((el) => el.classList.add("is-in"))
    }, 900)
    return () => {
      io.disconnect()
      window.clearTimeout(t)
    }
  }, [showSkeleton, reduceMotion, featured.length])

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
            : showError
              ? (
                <p style={{ gridColumn: "1 / -1", color: "var(--steel-400)" }}>
                  Could not load services right now.
                </p>
              )
            : featured.map((svc, index) => (
                <Link
                  key={svc.id}
                  href={`/services/${svc.id}`}
                  className="svc-card is-in"
                  data-reveal
                  style={{ transitionDelay: `${index * 55}ms` }}
                >
                  <div className="svc-card__media">
                    {svc.tag && (
                      <span className="badge badge--hivis">
                        <i />
                        {formatServiceTag(svc.tag)}
                      </span>
                    )}
                    <ServiceMedia
                      image={svc.image}
                      title={svc.title}
                      className="svc-card__photo"
                    />
                    <span className="svc-card__price">
                      {formatTaka(svc.price)}
                    </span>
                  </div>
                  <div className="svc-card__body">
                    <p className="svc-card__cat">{svc.catName}</p>
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
