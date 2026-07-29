"use client"

import Link from "next/link"
import { useEffect, useMemo, useState, type RefObject } from "react"
import {
  CalendarDaysIcon,
  InboxIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  StarIcon,
  WalletIcon,
  WrenchIcon,
} from "lucide-react"
import { useReducedMotion } from "framer-motion"

import { useAuth } from "@/app/providers/AuthProvider"
import {
  formatTaka,
  SLOT_TIMES,
  TECH_BOOKINGS,
  TECH_EARNINGS_MONTHS,
  WEEK_DAYS,
  type BookingStatus,
  type DashBooking,
} from "@/app/lib/dashboard-data"
import DashShell, { useReveal } from "./DashShell"
import {
  DashTabs,
  DashToastHost,
  StatCard,
  StatusBadge,
  useDashToasts,
} from "./DashShared"

const TABS = ["Overview", "Availability", "Profile & services", "Earnings"]

function buildSchedule() {
  const map: Record<string, "open" | "booked" | "off"> = {}
  WEEK_DAYS.forEach((day, di) => {
    SLOT_TIMES.forEach((time, ti) => {
      const key = `${di}-${ti}`
      if (day === "Fri") {
        map[key] = "off"
        return
      }
      if ((ti + di) % 7 === 0) map[key] = "booked"
      else if ((ti + di) % 3 !== 0) map[key] = "open"
      else map[key] = "off"
    })
  })
  return map
}

export default function TechnicianDashboard() {
  const { user } = useAuth()
  const name = user?.name || "Shamim Ahmed"
  const first = name.split(" ")[0] || "Shamim"
  const reduceMotion = useReducedMotion() ?? false
  const { toasts, pushToast } = useDashToasts()
  const [tab, setTab] = useState("Overview")
  const [bookings, setBookings] = useState<DashBooking[]>(TECH_BOOKINGS)
  const [takingJobs, setTakingJobs] = useState(true)
  const [loading, setLoading] = useState(true)
  const [schedule, setSchedule] = useState(buildSchedule)
  const [barsReady, setBarsReady] = useState(false)
  const [leavingIds, setLeavingIds] = useState<string[]>([])
  const barsOn = reduceMotion || barsReady
  const revealRef = useReveal([tab, loading, barsOn])

  useEffect(() => {
    const id = window.setTimeout(() => setLoading(false), 700)
    return () => window.clearTimeout(id)
  }, [])

  useEffect(() => {
    let onId = 0
    const offId = window.setTimeout(() => {
      setBarsReady(false)
      onId = window.setTimeout(() => setBarsReady(true), reduceMotion ? 0 : 200)
    }, 0)
    return () => {
      window.clearTimeout(offId)
      window.clearTimeout(onId)
    }
  }, [tab, reduceMotion])

  const pending = bookings.filter((b) => b.status === "REQUESTED")
  const upcoming = bookings.filter((b) =>
    ["ACCEPTED", "PAID", "IN_PROGRESS"].includes(b.status)
  )
  const monthEarn = bookings
    .filter((b) => ["PAID", "COMPLETED", "IN_PROGRESS"].includes(b.status))
    .reduce((s, b) => s + b.amount, 0)

  const respond = (id: string, next: BookingStatus) => {
    const row = bookings.find((b) => b.id === id)
    setLeavingIds((prev) => [...prev, id])
    window.setTimeout(() => {
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: next } : b))
      )
      setLeavingIds((prev) => prev.filter((x) => x !== id))
      pushToast(
        next === "ACCEPTED" ? "Request accepted" : "Request declined",
        row
          ? `${row.reference} is now ${next.replace(/_/g, " ").toLowerCase()}.`
          : ""
      )
    }, 280)
  }

  const toggleCell = (key: string) => {
    setSchedule((prev) => {
      const cur = prev[key]
      if (cur === "booked") return prev
      return { ...prev, [key]: cur === "open" ? "off" : "open" }
    })
  }

  const maxEarn = Math.max(...TECH_EARNINGS_MONTHS.map((m) => m.value))

  const groups = [
    {
      label: "Work",
      items: [
        {
          label: "Overview",
          href: "/dashboard/technician",
          icon: <LayoutDashboardIcon />,
          active: tab === "Overview",
          onClick: () => setTab("Overview"),
        },
        {
          label: "Bookings",
          href: "/dashboard/technician",
          icon: <InboxIcon />,
          pill: pending.length || undefined,
          active: false,
          onClick: () => setTab("Overview"),
        },
        {
          label: "Availability",
          href: "/dashboard/technician",
          icon: <CalendarDaysIcon />,
          active: tab === "Availability",
          onClick: () => setTab("Availability"),
        },
        {
          label: "Earnings",
          href: "/dashboard/technician",
          icon: <WalletIcon />,
          active: tab === "Earnings",
          onClick: () => setTab("Earnings"),
        },
      ],
    },
    {
      label: "Profile",
      items: [
        {
          label: "My services",
          href: "/dashboard/technician",
          icon: <WrenchIcon />,
          active: tab === "Profile & services",
          onClick: () => setTab("Profile & services"),
        },
        {
          label: "Public profile",
          href: "/technician?id=t1",
          icon: <StarIcon />,
        },
      ],
    },
    {
      label: "Account",
      items: [{ label: "Log out", href: "#", icon: <LogOutIcon /> }],
    },
  ]

  const todayTomorrow = useMemo(
    () =>
      upcoming.filter((b) =>
        b.date.includes("30 Jul") || b.date.includes("31 Jul") || b.date.includes("01 Aug")
      ),
    [upcoming]
  )

  return (
    <DashShell
      role="TECHNICIAN"
      displayName={name}
      roleLabel="Technician"
      online={takingJobs}
      groups={groups}
    >
      <div ref={revealRef as RefObject<HTMLDivElement>}>
        <header className="dash-head">
          <div>
            <p className="dash-eyebrow">Technician dashboard</p>
            <h1 className="dash-title">Good morning, {first}</h1>
            <p className="dash-sub">
              Two requests are waiting on your answer. One job starts at 8:00 AM.
            </p>
          </div>
          <div className="dash-head__actions">
            <div className="switch-wrap">
              <button
                type="button"
                className={`switch${takingJobs ? " is-on" : ""}`}
                aria-pressed={takingJobs}
                onClick={() => setTakingJobs((v) => !v)}
              >
                <i />
              </button>
              Taking jobs
            </div>
            <Link href="/technicians" className="dash-btn dash-btn--primary">
              Manage bookings →
            </Link>
          </div>
        </header>

        <div className="stat-row">
          <StatCard
            icon={<InboxIcon size={18} />}
            value={pending.length}
            label="Pending requests"
            delta="Answer within 30 min"
            delay={0}
          />
          <StatCard
            icon={<CalendarDaysIcon size={18} />}
            value={upcoming.length}
            label="Upcoming jobs"
            delta="Next at 8:00 AM"
            variant="sky"
            delay={55}
          />
          <StatCard
            icon={<WalletIcon size={18} />}
            value={monthEarn}
            label="Earnings this month"
            delta="+18% vs June"
            variant="signal"
            prefix="৳"
            delay={110}
          />
          <StatCard
            icon={<StarIcon size={18} />}
            value={4.8}
            label="Your rating"
            delta="264 reviews"
            variant="violet"
            decimals={1}
            delay={165}
          />
        </div>

        <DashTabs tabs={TABS} active={tab} onChange={setTab} />

        {tab === "Overview" && (
          <>
            <section className="dash-card" style={{ marginBottom: 14 }}>
              <div className="dash-card__head">
                <h2 className="dash-card__title">Waiting on your answer</h2>
                <button
                  type="button"
                  className="dash-card__link"
                  onClick={() => setTab("Overview")}
                >
                  See all requests →
                </button>
              </div>
              {loading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="skel skel-row" />
                ))
              ) : pending.length === 0 ? (
                <div className="dash-empty">
                  <h3>Inbox clear</h3>
                  <p>No requests waiting right now.</p>
                </div>
              ) : (
                pending.map((b) => (
                  <div
                    key={b.id}
                    className={`req-row${leavingIds.includes(b.id) ? " is-leaving" : ""}`}
                  >
                    <span className="dash-avatar">{b.customer.initials}</span>
                    <div className="req-row__meta">
                      <strong>{b.service}</strong>
                      <div style={{ color: "var(--steel-400)", fontSize: "0.85rem" }}>
                        {b.customer.name} · {b.area} · {b.date} · {b.time}
                      </div>
                    </div>
                    <strong>{formatTaka(b.amount)}</strong>
                    <div className="req-row__actions">
                      <button
                        type="button"
                        className="dash-btn dash-btn--ghost dash-btn--sm"
                        onClick={() => respond(b.id, "DECLINED")}
                      >
                        Decline
                      </button>
                      <button
                        type="button"
                        className="dash-btn dash-btn--primary dash-btn--sm"
                        onClick={() => respond(b.id, "ACCEPTED")}
                      >
                        Accept
                      </button>
                    </div>
                  </div>
                ))
              )}
            </section>

            <div className="dash-grid-2">
              <section className="dash-card">
                <h2 className="dash-card__title">Today and tomorrow</h2>
                <div className="job-strip" style={{ marginTop: 14 }}>
                  {todayTomorrow.map((b) => (
                    <div key={b.id} className="job-mini">
                      <div className="job-mini__top">
                        <StatusBadge status={b.status} />
                        <strong>{formatTaka(b.amount)}</strong>
                      </div>
                      <strong>{b.service}</strong>
                      <div style={{ color: "var(--steel-400)", fontSize: "0.85rem" }}>
                        {b.customer.name} · {b.area}
                      </div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", marginTop: 6 }}>
                        {b.date} · {b.time}
                      </div>
                    </div>
                  ))}
                  {!todayTomorrow.length && (
                    <p style={{ color: "var(--steel-400)" }}>No jobs in the next two days.</p>
                  )}
                </div>
              </section>

              <section className="dash-card">
                <h2 className="dash-card__title">This week at a glance</h2>
                <div className="progress-list" style={{ marginTop: 14 }}>
                  {[
                    { label: "Slots filled", value: 68, tone: "" },
                    { label: "Acceptance rate", value: 92, tone: "signal" },
                    { label: "On-time", value: 87, tone: "sky" },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="progress-item__label">
                        <span>{item.label}</span>
                        <strong>{item.value}%</strong>
                      </div>
                      <div className="progress-track">
                        <div
                          className={`progress-fill${item.tone ? ` progress-fill--${item.tone}` : ""}${barsOn ? " is-on" : ""}`}
                          style={{ ["--w" as string]: `${item.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="tip-box">
                  Thursday evenings are your busiest. Keep Fridays 6–8 PM open for emergency calls.
                </div>
              </section>
            </div>
          </>
        )}

        {tab === "Availability" && (
          <section className="dash-card">
            <h2 className="dash-card__title">Weekly availability</h2>
            <p style={{ color: "var(--steel-400)" }}>
              Tap a cell to open or close a slot. Booked slots stay locked.
            </p>
            <div className="sched" style={{ marginTop: 14 }}>
              <div />
              {WEEK_DAYS.map((d) => (
                <div key={d} className="sched__head">
                  {d}
                </div>
              ))}
              {SLOT_TIMES.map((time, ti) => (
                <div key={time} style={{ display: "contents" }}>
                  <div className="sched__time">
                    {time.replace(":00 ", " ")}
                  </div>
                  {WEEK_DAYS.map((day, di) => {
                    const key = `${di}-${ti}`
                    const state = schedule[key]
                    return (
                      <button
                        key={key}
                        type="button"
                        className={`sched__cell is-${state}`}
                        disabled={state === "booked" || day === "Fri"}
                        onClick={() => toggleCell(key)}
                        aria-label={`${day} ${time}`}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
            <div className="sched-legend">
              <span>
                <i style={{ background: "var(--hivis)" }} /> Open
              </span>
              <span>
                <i style={{ background: "var(--steel-700)" }} /> Booked
              </span>
              <span>
                <i style={{ background: "var(--concrete)" }} /> Closed
              </span>
            </div>
          </section>
        )}

        {tab === "Profile & services" && (
          <div className="dash-grid-2">
            <section className="dash-card">
              <h2 className="dash-card__title">Profile</h2>
              <p>
                <StatusBadge status="Active" />{" "}
                <span className="badge-soft">Verified</span>
              </p>
              <p>
                <strong>Trade:</strong> Plumbing
              </p>
              <p>
                <strong>Visit fee:</strong> {formatTaka(250)}
              </p>
              <p style={{ color: "var(--steel-400)" }}>
                Experienced plumber covering Dhanmondi emergencies and pipe overhauls.
              </p>
              <div className="chip-row">
                {["Pipe repair", "Leak fix", "Tap install", "Emergency"].map((s) => (
                  <span key={s} className="dash-chip is-active">
                    {s}
                  </span>
                ))}
              </div>
            </section>
            <section className="dash-card">
              <h2 className="dash-card__title">Services you offer</h2>
              {[
                { title: "Kitchen Sink & Tap Fix", price: 900 },
                { title: "Bathroom Leak & Pipe Repair", price: 1500 },
              ].map((s) => (
                <div
                  key={s.title}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "12px 0",
                    borderTop: "1px solid var(--steel-100)",
                  }}
                >
                  <span>{s.title}</span>
                  <strong>{formatTaka(s.price)}</strong>
                </div>
              ))}
            </section>
          </div>
        )}

        {tab === "Earnings" && (
          <div className="dash-grid-2">
            <section className="dash-card">
              <div className="dash-card__head">
                <h2 className="dash-card__title">Monthly earnings</h2>
                <span className="badge-soft">Feb–Jul</span>
              </div>
              <div className="chart chart--sm">
                {TECH_EARNINGS_MONTHS.map((m) => (
                  <div key={m.label} className="chart__col">
                    <div
                      className={`chart__bar${barsOn ? " is-on" : ""}`}
                      style={{
                        ["--h" as string]: `${(m.value / maxEarn) * 100}%`,
                      }}
                      data-tip={formatTaka(m.value * 1000)}
                    />
                    <span className="chart__label">{m.label}</span>
                  </div>
                ))}
              </div>
            </section>
            <section className="dash-card">
              <h2 className="dash-card__title">Paid jobs</h2>
              {bookings
                .filter((b) => ["PAID", "COMPLETED"].includes(b.status))
                .map((b) => (
                  <div
                    key={b.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                      padding: "10px 0",
                      borderTop: "1px solid var(--steel-100)",
                    }}
                  >
                    <div>
                      <strong>{b.reference}</strong>
                      <div style={{ color: "var(--steel-400)", fontSize: "0.82rem" }}>
                        {b.service}
                      </div>
                    </div>
                    <strong>{formatTaka(b.amount)}</strong>
                  </div>
                ))}
            </section>
          </div>
        )}
      </div>
      <DashToastHost toasts={toasts} />
    </DashShell>
  )
}
