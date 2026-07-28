"use client"

import Link from "next/link"
import { useEffect, useRef } from "react"
import { useReducedMotion } from "framer-motion"

import "./CategoriesSection.css"

const CATEGORIES = [
  { id: "c1", name: "Plumbing", jobs: 1284, icon: "pipe" },
  { id: "c2", name: "Electrical", jobs: 1102, icon: "bolt" },
  { id: "c3", name: "AC & Cooling", jobs: 968, icon: "snow" },
  { id: "c4", name: "Appliance Repair", jobs: 741, icon: "chip" },
  { id: "c5", name: "Carpentry", jobs: 620, icon: "saw" },
  { id: "c6", name: "Painting", jobs: 512, icon: "brush" },
  { id: "c7", name: "Deep Cleaning", jobs: 889, icon: "spray" },
  { id: "c8", name: "Pest Control", jobs: 304, icon: "bug" },
] as const

function formatJobs(n: number) {
  return n.toLocaleString("en-IN")
}

function CategoryIcon({ type }: { type: (typeof CATEGORIES)[number]["icon"] }) {
  const common = {
    width: 21,
    height: 21,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  }

  switch (type) {
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
          <path d="m3.5 14 3.5-2-1-4" />
          <path d="m20.5 14-3.5-2 1-4" />
        </svg>
      )
    case "chip":
      return (
        <svg {...common}>
          <rect x="7" y="7" width="10" height="10" rx="1.5" />
          <path d="M9 1v3M12 1v3M15 1v3M9 20v3M12 20v3M15 20v3M1 9h3M1 12h3M1 15h3M20 9h3M20 12h3M20 15h3" />
        </svg>
      )
    case "saw":
      return (
        <svg {...common}>
          <path d="M3 18 14 4l4 4L9 20z" />
          <path d="m14 4 3-1 3 3-1 3" />
          <path d="M6.5 14.5 8 16M8.5 12.5 10 14M10.5 10.5 12 12" />
        </svg>
      )
    case "brush":
      return (
        <svg {...common}>
          <path d="M9.5 21a3.5 3.5 0 0 1-3.5-3.5V15h7v2.5A3.5 3.5 0 0 1 9.5 21z" />
          <path d="M6 15V9.5A2.5 2.5 0 0 1 8.5 7h2A2.5 2.5 0 0 1 13 9.5V15" />
          <path d="M10.5 7V3.5a1.5 1.5 0 0 1 3 0V5l4 2v2.5" />
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
    case "bug":
      return (
        <svg {...common}>
          <ellipse cx="12" cy="13" rx="5" ry="6" />
          <path d="M12 7V4" />
          <path d="M9.5 5.5 8 4M14.5 5.5 16 4" />
          <path d="M7 11H3M21 11h-4M7 15H4M20 15h-3M7.5 18.5 5 21M16.5 18.5 19 21" />
          <path d="M12 9v8" />
        </svg>
      )
  }
}

export default function CategoriesSection() {
  const reduceMotion = useReducedMotion() ?? false
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
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
  }, [reduceMotion])

  return (
    <section className="cats-section" aria-labelledby="cats-heading">
      <div className="cats-wrap">
        <div className="section-head">
          <div>
            <p className="cats-eyebrow">What needs fixing</p>
            <h2 id="cats-heading" className="display-lg">
              Eight trades, one booking flow
            </h2>
          </div>
          <Link href="/services" className="cats-ghost">
            See every service
          </Link>
        </div>

        <div ref={gridRef} className="grid grid-4">
          {CATEGORIES.map((cat, index) => (
            <Link
              key={cat.id}
              href={`/services?cat=${cat.id}`}
              className="card card--pad card--hover"
              data-reveal
              style={{ transitionDelay: `${index * 55}ms` }}
            >
              <span className="cats-icon">
                <CategoryIcon type={cat.icon} />
              </span>
              <b className="display-sm">{cat.name}</b>
              <span className="cats-meta">
                {formatJobs(cat.jobs)} jobs done
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
