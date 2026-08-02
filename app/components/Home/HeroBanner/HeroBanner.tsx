"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { useReducedMotion } from "framer-motion"

import { cn } from "@/lib/utils"
import TradeMarquee from "@/app/components/Home/TradeMarquee/TradeMarquee"
import "./HeroBanner.css"

type Status = "matching" | "enroute" | "onsite" | "done"

const STATUS_CYCLE: Status[] = ["matching", "enroute", "onsite", "done"]

const STATUS_LABEL: Record<Status, string> = {
  matching: "Matching",
  enroute: "En route",
  onsite: "On site",
  done: "Completed",
}

const STATUS_CLASS: Record<Status, string> = {
  matching: "bg-[rgba(240,152,25,.16)] text-[#FFC86B]",
  enroute: "bg-[rgba(61,143,224,.16)] text-[#8CC2F5]",
  onsite: "bg-[rgba(124,107,255,.16)] text-[#B7ADFF]",
  done: "bg-[rgba(18,184,134,.16)] text-[#6FE0BC]",
}

const INITIAL_JOBS: {
  code: string
  job: string
  tech: string
  status: Status
}[] = [
  {
    code: "PLB",
    job: "Leaking tap — Dhanmondi 27",
    tech: "Rakib H.",
    status: "enroute",
  },
  {
    code: "ELC",
    job: "Short circuit — Mohammadpur",
    tech: "Shamim A.",
    status: "onsite",
  },
  {
    code: "A/C",
    job: "Gas refill — Gulshan 2",
    tech: "Nasima A.",
    status: "matching",
  },
  {
    code: "CLN",
    job: "Deep clean — Bashundhara R/A",
    tech: "Farhana I.",
    status: "onsite",
  },
  {
    code: "APL",
    job: "Fridge repair — Uttara 4",
    tech: "Jubayer R.",
    status: "done",
  },
  {
    code: "CRP",
    job: "Wardrobe build — Mirpur 10",
    tech: "Milon S.",
    status: "enroute",
  },
]

type StatConfig = {
  target: number
  decimals: number
  suffix: string
  label: string
}

const STATS: StatConfig[] = [
  { target: 1204, decimals: 0, suffix: "+", label: "Jobs this week" },
  { target: 4.8, decimals: 1, suffix: "", label: "Average rating" },
  { target: 31, decimals: 0, suffix: " min", label: "Median arrival" },
]

function easeOutCubic(p: number) {
  return 1 - (1 - p) ** 3
}

function formatStat(value: number, decimals: number, suffix: string) {
  const fixed = value.toFixed(decimals)
  const [whole, frac] = fixed.split(".")
  const grouped = Number(whole).toLocaleString("en-IN")
  return decimals > 0 ? `${grouped}.${frac}${suffix}` : `${grouped}${suffix}`
}

function useCountUp(active: boolean, target: number, duration = 1300) {
  const [value, setValue] = useState(0)
  const started = useRef(false)

  useEffect(() => {
    if (!active || started.current) return
    started.current = true
    const start = performance.now()

    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration)
      setValue(target * easeOutCubic(p))
      if (p < 1) requestAnimationFrame(tick)
      else setValue(target)
    }

    requestAnimationFrame(tick)
  }, [active, target, duration])

  return value
}

function ProofStat({
  active,
  target,
  decimals,
  suffix,
  label,
  reduceMotion,
}: StatConfig & { active: boolean; reduceMotion: boolean }) {
  const value = useCountUp(active && !reduceMotion, target)
  const display = reduceMotion
    ? formatStat(target, decimals, suffix)
    : formatStat(active ? value : 0, decimals, suffix)

  return (
    <div>
      <b
        className="block font-black text-[1.85rem] tracking-[-0.035em] text-[#FFC93C] tabular-nums"
        style={{
          fontFamily: "var(--font-dispatch-display), Archivo Black, sans-serif",
        }}
      >
        {display}
      </b>
      <span
        className="text-[0.68rem] tracking-[0.13em] text-[#6E8091] uppercase"
        style={{
          fontFamily: "var(--font-hivis-mono), IBM Plex Mono, monospace",
        }}
      >
        {label}
      </span>
    </div>
  )
}

function StatusFlap({
  status,
  flipping,
}: {
  status: Status
  flipping: boolean
}) {
  return (
    <span
      className={cn(
        "hero__flap inline-flex min-w-[92px] items-center justify-center rounded px-[9px] py-[5px] text-center text-[0.67rem] font-bold tracking-[0.1em] uppercase",
        STATUS_CLASS[status],
        flipping && "is-flipping"
      )}
      style={{
        fontFamily: "var(--font-hivis-mono), IBM Plex Mono, monospace",
        perspective: "400px",
      }}
    >
      {STATUS_LABEL[status]}
    </span>
  )
}

export default function HeroBanner() {
  const reduceMotion = useReducedMotion() ?? false
  const proofRef = useRef<HTMLDivElement>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  const [proofVisible, setProofVisible] = useState(false)
  const [boardVisible, setBoardVisible] = useState(false)
  const [jobs, setJobs] = useState(INITIAL_JOBS)
  const [flippingIndex, setFlippingIndex] = useState<number | null>(null)

  const showProof = reduceMotion || proofVisible
  const showBoard = reduceMotion || boardVisible

  useEffect(() => {
    if (reduceMotion) return

    const proofEl = proofRef.current
    const boardEl = boardRef.current
    if (!proofEl || !boardEl) return

    const proofObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setProofVisible(true)
          proofObserver.disconnect()
        }
      },
      { threshold: 0.5 }
    )

    const boardObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setBoardVisible(true)
          boardObserver.disconnect()
        }
      },
      { threshold: 0.35 }
    )

    proofObserver.observe(proofEl)
    boardObserver.observe(boardEl)

    return () => {
      proofObserver.disconnect()
      boardObserver.disconnect()
    }
  }, [reduceMotion])

  useEffect(() => {
    if (reduceMotion) return

    const interval = window.setInterval(() => {
      const index = Math.floor(Math.random() * INITIAL_JOBS.length)
      setFlippingIndex(index)

      window.setTimeout(() => {
        setJobs((prev) =>
          prev.map((job, i) => {
            if (i !== index) return job
            const next =
              STATUS_CYCLE[
                (STATUS_CYCLE.indexOf(job.status) + 1) % STATUS_CYCLE.length
              ]
            return { ...job, status: next }
          })
        )
      }, 250)

      window.setTimeout(() => setFlippingIndex(null), 520)
    }, 2200)

    return () => window.clearInterval(interval)
  }, [reduceMotion])

  return (
    <section className="hero" aria-label="Hero">
      <div
        className="hero__glow"
        aria-hidden="true"
        style={reduceMotion ? { animation: "none" } : undefined}
      />

      <div className="hero__body">
      <div className="relative z-[1] mx-auto grid w-full max-w-[1240px] grid-cols-1 items-center gap-11 px-6 min-[1081px]:grid-cols-[1.05fr_.95fr] min-[1081px]:gap-[52px]">
        {/* Left column */}
        <div>
          <p
            className="inline-flex items-center gap-[9px] text-[0.69rem] font-semibold tracking-[0.22em] text-[#9AABB8] uppercase before:block before:h-[3px] before:w-[22px] before:shrink-0 before:rounded-[2px] before:bg-[#FFC93C] before:content-['']"
            style={{
              fontFamily: "var(--font-hivis-mono), IBM Plex Mono, monospace",
            }}
          >
            Dhaka · 8 trades · same-day slots
          </p>

          <h1
            className="mt-4 text-[2.5rem] leading-[1.02] font-black tracking-[-0.045em] text-white uppercase min-[561px]:text-[clamp(2.4rem,4.2vw,3.5rem)]"
            style={{
              fontFamily:
                "var(--font-dispatch-display), Archivo Black, sans-serif",
            }}
          >
            Someone good
            <br />
            is already
            <em className="block not-italic text-[#FFC93C]">on the way.</em>
          </h1>

          <p
            className="mt-[18px] max-w-[60ch] text-[clamp(1rem,1.5vw,1.14rem)] text-[#9AABB8]"
            style={{
              fontFamily: "var(--font-dispatch-sans), Instrument Sans, sans-serif",
            }}
          >
            Pick the job, pick the hour, pick the person. Your technician
            confirms before you pay a taka — and you can watch the whole thing
            move from your dashboard.
          </p>

          <div className="mt-[30px] flex flex-wrap gap-3 max-[560px]:flex-col">
            <Link
              href="/services"
              className="inline-flex items-center justify-center rounded-[10px] bg-[#FFC93C] px-[30px] py-[17px] text-[1.05rem] font-bold text-[#0E141B] transition-[transform,box-shadow] duration-[180ms] ease-[cubic-bezier(.22,.68,.32,1)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(229,169,0,.32)] active:translate-y-0 active:scale-[0.985] max-[560px]:w-full motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              style={{
                fontFamily:
                  "var(--font-dispatch-display), Archivo Black, sans-serif",
              }}
            >
              Find a technician
            </Link>
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center rounded-[10px] border-2 border-white/26 bg-transparent px-[30px] py-[17px] text-[1.05rem] font-bold text-white transition-[background-color,border-color] duration-[180ms] ease-[cubic-bezier(.22,.68,.32,1)] hover:border-[#FFC93C] hover:bg-white/10 max-[560px]:w-full"
              style={{
                fontFamily:
                  "var(--font-dispatch-display), Archivo Black, sans-serif",
              }}
            >
              Work with us
            </Link>
          </div>

          <div
            ref={proofRef}
            className="mt-[38px] flex flex-wrap gap-5 min-[561px]:gap-7"
          >
            {STATS.map((stat) => (
              <ProofStat
                key={stat.label}
                {...stat}
                active={showProof}
                reduceMotion={reduceMotion}
              />
            ))}
          </div>
        </div>

        {/* Right column — dispatch board */}
        <div
          ref={boardRef}
          className={cn(
            "hero__board",
            "transition-[opacity,transform] duration-[720ms] ease-[cubic-bezier(.16,1,.3,1)]",
            showBoard
              ? "translate-x-0 opacity-100"
              : "translate-x-8 opacity-0",
            reduceMotion && "translate-x-0 opacity-100 transition-none"
          )}
        >
          <div className="overflow-hidden rounded-2xl bg-[#0E141B] shadow-[0_30px_70px_rgba(0,0,0,.5),inset_0_0_0_1px_rgba(255,255,255,.07)]">
            <div className="flex items-center justify-between border-b border-white/7 bg-white/[0.04] px-4 py-[13px]">
              <h2
                className="text-[0.7rem] font-semibold tracking-[0.18em] text-[#9AABB8] uppercase"
                style={{
                  fontFamily:
                    "var(--font-hivis-mono), IBM Plex Mono, monospace",
                }}
              >
                Live dispatch board
              </h2>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#DDF6EE] px-2.5 py-1 text-[0.62rem] font-semibold tracking-[0.08em] text-[#07785A] uppercase">
                <span
                  className="hero__pulse size-1.5 shrink-0 rounded-full bg-current"
                  aria-hidden="true"
                />
                On air
              </span>
            </div>

            <ul className="m-0 list-none p-0">
              {jobs.map((job, index) => (
                <li
                  key={`${job.code}-${job.job}`}
                  className={cn(
                    "grid grid-cols-[34px_1fr_auto] items-center gap-3 rounded-[6px] px-2.5 py-[11px] transition-colors hover:bg-white/[0.04]",
                    index > 0 && "border-t border-white/5"
                  )}
                >
                  <span
                    className="inline-flex h-[26px] items-center justify-center rounded bg-[#FFC93C] text-center text-[0.7rem] font-bold text-[#0E141B]"
                    style={{
                      fontFamily:
                        "var(--font-hivis-mono), IBM Plex Mono, monospace",
                    }}
                  >
                    {job.code}
                  </span>
                  <div className="min-w-0">
                    <p
                      className="m-0 truncate text-[0.87rem] font-semibold text-white"
                      style={{
                        fontFamily:
                          "var(--font-dispatch-sans), Instrument Sans, sans-serif",
                      }}
                    >
                      {job.job}
                    </p>
                    <p
                      className="m-0 truncate text-[0.68rem] text-[#6E8091]"
                      style={{
                        fontFamily:
                          "var(--font-hivis-mono), IBM Plex Mono, monospace",
                      }}
                    >
                      {job.tech}
                    </p>
                  </div>
                  <StatusFlap
                    status={job.status}
                    flipping={flippingIndex === index}
                  />
                </li>
              ))}
            </ul>
          </div>

          <p
            className="mt-4 text-[0.7rem] tracking-[0.14em] text-[#4A5C6B] uppercase"
            style={{
              fontFamily: "var(--font-hivis-mono), IBM Plex Mono, monospace",
            }}
          >
            Board refreshes every few seconds
          </p>
        </div>
      </div>
      </div>

      <div className="hero__marquee">
        <TradeMarquee />
      </div>
    </section>
  )
}
