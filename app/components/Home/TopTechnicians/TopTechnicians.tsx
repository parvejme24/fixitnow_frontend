"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef } from "react"
import { useReducedMotion } from "framer-motion"
import { CheckCircle2Icon } from "lucide-react"

import { useTopTechnicians } from "@/lib/catalogue/hooks"
import { techniciansWithAuthImage } from "@/lib/catalogue/with-auth-image"
import ProfileFace from "@/app/components/Shared/ProfileFace"
import { useAuth } from "@/app/providers/AuthProvider"

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
  const { user } = useAuth()
  const { data: rawTechs = [], isLoading, isError } = useTopTechnicians()
  const techs = useMemo(
    () => techniciansWithAuthImage(rawTechs, user),
    [rawTechs, user]
  )
  const showSkeleton = isLoading && techs.length === 0

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
      { threshold: 0.08, rootMargin: "0px 0px -8% 0px" }
    )

    cards.forEach((el) => {
      const rect = el.getBoundingClientRect()
      const inView =
        rect.top < window.innerHeight * 0.92 && rect.bottom > 0
      if (inView) el.classList.add("is-in")
      else io.observe(el)
    })
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
            : isError && techs.length === 0
              ? (
                <p style={{ gridColumn: "1 / -1", color: "var(--steel-300)" }}>
                  Could not load technicians right now.
                </p>
              )
            : techs.slice(0, 3).map((tech, index) => {
                const tags =
                  (tech.catNames?.length ? tech.catNames : tech.skills).slice(
                    0,
                    3
                  )
                return (
                <Link
                  key={tech.id}
                  href={`/technician?id=${tech.id}`}
                  className="tech-card tech-card--hover"
                  data-reveal
                  style={{ transitionDelay: `${index * 55}ms` }}
                >
                  <div className="tech-card__head">
                    <div className="tech-card__avatar">
                      <ProfileFace
                        image={tech.image}
                        initials={tech.initials}
                        className="tech-card__face"
                      />
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
                        {tech.trade}
                        {tech.area ? ` · ${tech.area}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="tech-card__skills">
                    {tags.map((tag) => (
                      <span key={tag} className="skill-tag">
                        {tag}
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
                )
              })}
        </div>
      </div>
    </section>
  )
}
