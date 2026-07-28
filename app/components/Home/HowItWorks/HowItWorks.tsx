"use client"

import { useEffect, useRef } from "react"
import { useReducedMotion } from "framer-motion"

import "./HowItWorks.css"

const STEPS = [
  {
    num: "01",
    title: "Pick the job",
    body: "Search by trade or area. Every price shown is the starting price, not a teaser.",
  },
  {
    num: "02",
    title: "Choose a slot",
    body: "Booked hours are struck through. What you can click is genuinely free.",
  },
  {
    num: "03",
    title: "Get accepted",
    body: "The technician confirms within minutes. Declined? You keep looking, nothing charged.",
  },
  {
    num: "04",
    title: "Pay and track",
    body: "bKash, Nagad or card. Watch the status move from paid to completed.",
  },
] as const

export default function HowItWorks() {
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
    <section className="section hiw-section" aria-labelledby="hiw-heading">
      <div className="hiw-wrap">
        <div className="section-head">
          <p className="hiw-eyebrow">The order things happen in</p>
          <h2 id="hiw-heading" className="display-lg">
            Request, confirm, pay, done
          </h2>
          <p className="lede">
            Payment sits after acceptance on purpose. Nobody takes your money
            for a slot that was never available.
          </p>
        </div>

        <div ref={gridRef} className="grid grid-4">
          {STEPS.map((step, index) => (
            <article
              key={step.num}
              className="card card--pad"
              data-reveal
              style={{ transitionDelay: `${index * 55}ms` }}
            >
              <span className="hiw-num">{step.num}</span>
              <h3 className="display-sm">{step.title}</h3>
              <p>{step.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
