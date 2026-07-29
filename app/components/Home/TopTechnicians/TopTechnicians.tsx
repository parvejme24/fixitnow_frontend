"use client"

import Link from "next/link"
import { useEffect, useRef } from "react"
import { useReducedMotion } from "framer-motion"
import { CheckCircle2Icon } from "lucide-react"

import { useTopTechnicians } from "@/lib/catalogue/hooks"

import "./TopTechnicians.css"

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

export default function TopTechnicians() {
  const reduceMotion = useReducedMotion() ?? false
  const gridRef = useRef<HTMLDivElement>(null)
  const { data: techs = [], isLoading } = useTopTechnicians()
  const showSkeleton = isLoading && !reduceMotion

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
  }, [showSkeleton, reduceMotion, techs.length])

  return (
    <section
      className="section section--dark tt-section"
      aria-labelledby="tt-heading"
    >
      <div className="tt-wrap">
        <div className="section-head">
          <div>
            <p className="tt-eyebrow on-dark">Highest rated this quarter</p>
            <h2 id="tt-heading" className="display-lg">
              The people who show up
            </h2>
          </div>
          <Link href="/technicians" className="tt-ghost-light">
            All technicians
          </Link>
        </div>

        <div ref={gridRef} className="grid grid-3" aria-busy={showSkeleton}>
          {showSkeleton
            ? Array.from({ length: 3 }, (_, i) => <SkeletonCard key={i} />)
            : techs.slice(0, 3).map((tech, index) => (
                <Link
                  key={tech.id}
                  href={`/technician?id=${tech.id}`}
                  className="tech-card tech-card--hover"
                  data-reveal
                  style={{ transitionDelay: `${index * 55}ms` }}
                >
                  <div className="tech-card__head">
                    <div className="tech-card__avatar">
                      {tech.initials}
                      {tech.online && <span className="tech-card__online" />}
                    </div>
                    <div>
                      <h3 className="tech-card__name">
                        {tech.name}
                        {tech.verified && (
                          <CheckCircle2Icon
                            size={14}
                            className="tech-card__verified"
                            aria-label="Verified"
                          />
                        )}
                      </h3>
                      <p className="tech-card__role">
                        {tech.trade} · {tech.area}
                      </p>
                    </div>
                  </div>

                  <div className="tech-card__skills">
                    {tech.skills.slice(0, 3).map((skill) => (
                      <span key={skill} className="skill-tag">
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div className="tech-card__stats">
                    <div>
                      <b>{tech.rating.toFixed(1)}</b>
                      <span>Rating</span>
                    </div>
                    <div>
                      <b>{tech.jobs}</b>
                      <span>Jobs</span>
                    </div>
                    <div>
                      <b>{tech.exp}y</b>
                      <span>Experience</span>
                    </div>
                  </div>
                </Link>
              ))}
        </div>
      </div>
    </section>
  )
}
