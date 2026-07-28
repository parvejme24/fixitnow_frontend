"use client"

import Link from "next/link"
import { useEffect, useRef, type MouseEvent } from "react"
import { useReducedMotion } from "framer-motion"

import "./ForTechnicians.css"

export default function ForTechnicians() {
  const reduceMotion = useReducedMotion() ?? false
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return

    if (reduceMotion) {
      panel.classList.add("is-in")
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

    io.observe(panel)
    return () => io.disconnect()
  }, [reduceMotion])

  const onRipple = (e: MouseEvent<HTMLAnchorElement>) => {
    if (reduceMotion) return
    const btn = e.currentTarget
    const rect = btn.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height) * 1.2
    const ripple = document.createElement("span")
    ripple.className = "ft-ripple"
    ripple.style.width = `${size}px`
    ripple.style.height = `${size}px`
    ripple.style.left = `${e.clientX - rect.left - size / 2}px`
    ripple.style.top = `${e.clientY - rect.top - size / 2}px`
    btn.appendChild(ripple)
    window.setTimeout(() => ripple.remove(), 520)
  }

  return (
    <section className="section ft-section" aria-labelledby="ft-heading">
      <div className="ft-wrap">
        <div ref={panelRef} className="ft-panel" data-reveal>
          <span className="ft-circle" aria-hidden />
          <div className="ft-row">
            <div className="ft-copy">
              <p className="ft-eyebrow">For technicians</p>
              <h2 id="ft-heading" className="display-md">
                Fill your week without chasing anyone
              </h2>
              <p>
                Set your hours once. Accept the jobs that fit. Payment lands
                after the customer confirms the work is done.
              </p>
            </div>
            <Link
              href="/auth/register"
              className="btn btn--dark btn--lg"
              onClick={onRipple}
            >
              Join the network
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
