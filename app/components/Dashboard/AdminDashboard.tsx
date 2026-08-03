"use client"

import Link from "next/link"
import { useEffect, useMemo, useState, type RefObject } from "react"
import {
  AlertTriangleIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  InboxIcon,
  UserRoundIcon,
  UsersIcon,
  WalletIcon,
  WrenchIcon,
} from "lucide-react"
import { useReducedMotion } from "framer-motion"

import {
  useAdminServicesQuery,
  useAdminStatsQuery,
} from "@/lib/admin/use-admin-platform"
import { useAdminCategoriesQuery } from "@/lib/admin/use-admin-categories"
import { useAdminUsersQuery } from "@/lib/admin/use-admin-users"
import { useAdminBookingsQuery } from "@/lib/bookings/hooks"
import {
  buildDailyEarnPoints,
  buildMonthlyEarnPoints,
  isRevenueBooking,
} from "@/lib/bookings/earn-series"
import AdminShell from "./AdminShell"
import { useReveal } from "./DashShell"
import { StatCard } from "./DashShared"
import {
  EarningsChartCard,
  type EarnChartType,
  type EarnRange,
} from "./EarningsChartCard"

const ACTIVE_STATUSES = [
  "REQUESTED",
  "ACCEPTED",
  "PAID",
  "EN_ROUTE",
  "ON_SITE",
  "IN_PROGRESS",
] as const

function statusTone(status: string) {
  const key = status.toLowerCase().replace(/\s+/g, "_")
  if (key.includes("complete")) return "completed"
  if (key.includes("cancel")) return "cancelled"
  if (key.includes("request")) return "requested"
  if (key.includes("decline")) return "declined"
  if (key.includes("accept")) return "accepted"
  if (key.includes("paid")) return "paid"
  if (key.includes("en_route") || key.includes("enroute")) return "en_route"
  if (key.includes("on_site") || key.includes("onsite")) return "on_site"
  if (key.includes("progress")) return "in_progress"
  return "default"
}

export default function AdminDashboard() {
  const reduceMotion = useReducedMotion() ?? false
  const usersQuery = useAdminUsersQuery()
  const statsQuery = useAdminStatsQuery()
  const bookingsQuery = useAdminBookingsQuery()
  const servicesQuery = useAdminServicesQuery()
  const categoriesQuery = useAdminCategoriesQuery()

  const users = usersQuery.data ?? []
  const stats = statsQuery.data
  const bookings = bookingsQuery.data ?? []
  const services = servicesQuery.data ?? []
  const categories = categoriesQuery.data ?? []

  const [earnRange, setEarnRange] = useState<EarnRange>("30d")
  const [earnChart, setEarnChart] = useState<EarnChartType>("bar")
  const [barsReady, setBarsReady] = useState(false)
  const barsOn = reduceMotion || barsReady
  const revealRef = useReveal([
    barsOn,
    statsQuery.isFetching,
    bookingsQuery.isFetching,
  ])

  const revenueBookings = useMemo(
    () => bookings.filter((b) => isRevenueBooking(b.status)),
    [bookings]
  )

  const revenueSeries = useMemo(() => {
    if (earnRange === "7d") return buildDailyEarnPoints(revenueBookings, 7)
    if (earnRange === "30d") return buildDailyEarnPoints(revenueBookings, 30)
    return buildMonthlyEarnPoints(revenueBookings)
  }, [revenueBookings, earnRange])

  const rangeRevenue = useMemo(
    () => revenueSeries.reduce((sum, p) => sum + p.value, 0),
    [revenueSeries]
  )
  const maxRevenue = Math.max(...revenueSeries.map((m) => m.value), 1)

  const earnTitle =
    earnRange === "7d"
      ? "Daily revenue"
      : earnRange === "30d"
        ? "Last 30 days revenue"
        : "Monthly revenue"
  const earnSubtitle =
    earnRange === "months"
      ? "Gross from paid & in-progress bookings · last 6 months"
      : "Gross from paid & in-progress bookings in range"

  const topCategories =
    stats?.topCategories?.length
      ? stats.topCategories
      : categories
          .map((c) => ({ name: c.name, jobs: c.jobs }))
          .sort((a, b) => b.jobs - a.jobs)
          .slice(0, 5)
  const statusCounts =
    stats?.statusCounts?.length
      ? stats.statusCounts
      : (() => {
          const map = new Map<string, number>()
          for (const b of bookings) {
            map.set(b.status, (map.get(b.status) ?? 0) + 1)
          }
          return [...map.entries()].map(([status, count]) => ({
            status,
            count,
          }))
        })()

  useEffect(() => {
    if (reduceMotion) {
      setBarsReady(true)
      return
    }
    // Wait until overview data is present so bars animate from empty → filled.
    if (statsQuery.isLoading || bookingsQuery.isLoading) {
      setBarsReady(false)
      return
    }
    setBarsReady(false)
    const id = window.setTimeout(() => setBarsReady(true), 120)
    return () => window.clearTimeout(id)
  }, [
    reduceMotion,
    earnRange,
    earnChart,
    statsQuery.isLoading,
    bookingsQuery.isLoading,
    topCategories.length,
    statusCounts.length,
  ])

  const maxCat = Math.max(...topCategories.map((c) => c.jobs), 1)
  const statusTotal = Math.max(
    statusCounts.reduce((s, x) => s + x.count, 0),
    1
  )

  const userTotal = stats?.users || users.length
  const technicians =
    stats?.technicians ??
    users.filter((u) => u.role === "Technician").length
  const customers =
    stats?.customers ?? users.filter((u) => u.role === "Customer").length
  const activeBookings =
    stats?.activeBookings ??
    bookings.filter((b) =>
      (ACTIVE_STATUSES as readonly string[]).includes(b.status)
    ).length
  const awaitingPayment =
    stats?.awaitingPayment ??
    bookings.filter((b) => b.status === "ACCEPTED").length
  const completedJobs =
    stats?.completedJobs ??
    bookings.filter((b) => b.status === "COMPLETED").length
  const disputes = stats?.disputes ?? 0
  const pendingVerify = users.filter(
    (u) =>
      u.role === "Technician" && !u.technicianVerified && u.technicianId
  ).length
  const allTimeRevenue =
    stats?.revenue ||
    revenueBookings.reduce((s, b) => s + b.amount, 0)

  const statsReady =
    !statsQuery.isLoading &&
    !usersQuery.isLoading &&
    !bookingsQuery.isLoading

  return (
    <AdminShell page="overview">
      <div ref={revealRef as RefObject<HTMLDivElement>}>
        <header className="dash-head">
          <div>
            <p className="dash-eyebrow">Admin console</p>
            <h1 className="dash-title">Platform overview</h1>
            <p className="dash-sub">
              Key platform health metrics, revenue trends, and items that need
              attention.
            </p>
          </div>
        </header>

        <div className="stat-row">
          <StatCard
            icon={<UsersIcon size={18} />}
            value={userTotal}
            label="Total users"
            delta={`${technicians} techs · ${customers} customers`}
            delay={0}
            animate={statsReady}
          />
          <StatCard
            icon={<WrenchIcon size={18} />}
            value={technicians}
            label="Technicians"
            delta={
              pendingVerify
                ? `${pendingVerify} awaiting verify`
                : "All verified"
            }
            deltaDir={pendingVerify ? "down" : "up"}
            variant="sky"
            delay={40}
            animate={statsReady}
          />
          <StatCard
            icon={<UserRoundIcon size={18} />}
            value={customers}
            label="Customers"
            delta="Registered accounts"
            variant="violet"
            delay={80}
            animate={statsReady}
          />
          <StatCard
            icon={<InboxIcon size={18} />}
            value={activeBookings}
            label="Active bookings"
            delta={`${awaitingPayment} awaiting payment`}
            variant="signal"
            delay={120}
            animate={statsReady}
          />
        </div>

        <div className="stat-row" style={{ marginTop: 12 }}>
          <StatCard
            icon={<WalletIcon size={18} />}
            value={rangeRevenue}
            label="Revenue in range"
            delta={
              earnRange === "7d"
                ? "Last 7 days"
                : earnRange === "30d"
                  ? "Last 30 days"
                  : "Last 6 months"
            }
            variant="signal"
            prefix="৳"
            delay={0}
            animate={statsReady && !bookingsQuery.isLoading}
          />
          <StatCard
            icon={<CheckCircle2Icon size={18} />}
            value={completedJobs}
            label="Completed jobs"
            delta={`৳${allTimeRevenue.toLocaleString("en-IN")} all-time`}
            delay={40}
            animate={statsReady}
          />
          <StatCard
            icon={<CalendarDaysIcon size={18} />}
            value={services.length || categories.reduce((s, c) => s + c.services, 0)}
            label="Services listed"
            delta={`${categories.length} categories`}
            variant="sky"
            delay={80}
            animate={!servicesQuery.isLoading && !categoriesQuery.isLoading}
          />
          <StatCard
            icon={<AlertTriangleIcon size={18} />}
            value={disputes + pendingVerify}
            label="Needs attention"
            delta={
              disputes
                ? `${disputes} disputes · ${pendingVerify} verify`
                : pendingVerify
                  ? `${pendingVerify} tech verify`
                  : "Queue clear"
            }
            deltaDir={disputes + pendingVerify ? "down" : "up"}
            variant="flare"
            delay={120}
            animate={statsReady}
          />
        </div>

        <EarningsChartCard
          className="mb-earn-overview"
          title={earnTitle}
          subtitle={earnSubtitle}
          range={earnRange}
          chartType={earnChart}
          onRangeChange={(r) => {
            setBarsReady(false)
            setEarnRange(r)
          }}
          onChartTypeChange={(t) => {
            setBarsReady(false)
            setEarnChart(t)
          }}
          series={revenueSeries}
          maxValue={maxRevenue}
          barsOn={barsOn}
        />

        <div className="admin-grid">
          <section className="dash-card">
            <div className="dash-card__head">
              <h2 className="dash-card__title">Busiest categories</h2>
            </div>
            <div className="rank-list">
              {(topCategories.length
                ? topCategories
                : [{ name: "No data yet", jobs: 0 }]
              ).map((c, i) => {
                const pct = barsOn
                  ? Math.round((c.jobs / maxCat) * 100)
                  : 0
                return (
                  <div key={c.name} className="rank-row">
                    <span className="rank-row__n">{i + 1}</span>
                    <div className="rank-row__body">
                      <strong>{c.name}</strong>
                      <div className="rank-row__bar" aria-hidden>
                        <i
                          className={`rank-row__fill${barsOn ? " is-on" : ""}`}
                          style={{
                            ["--w" as string]: `${pct}%`,
                            ["--delay" as string]: `${80 + i * 90}ms`,
                          }}
                        />
                      </div>
                    </div>
                    <span className="rank-row__jobs">
                      {c.jobs.toLocaleString("en-IN")}
                    </span>
                  </div>
                )
              })}
            </div>
            <Link
              href="/dashboard/admin/categories"
              className="dash-btn dash-btn--ghost"
              style={{ marginTop: 12 }}
            >
              Manage categories
            </Link>
          </section>

          <section className="dash-card">
            <div className="dash-card__head">
              <h2 className="dash-card__title">Booking status mix</h2>
            </div>
            <div className="status-mix">
              {(statusCounts.length
                ? [...statusCounts].sort((a, b) => b.count - a.count)
                : [{ status: "REQUESTED", count: 0 }]
              ).map((row, i) => {
                const tone = statusTone(row.status)
                const pct = barsOn
                  ? Math.round((row.count / statusTotal) * 100)
                  : 0
                return (
                  <div
                    key={row.status}
                    className={`status-mix__row status-mix__row--${tone}`}
                    style={{ animationDelay: `${i * 55}ms` }}
                  >
                    <span className="status-mix__label">
                      <i className="status-mix__dot" aria-hidden />
                      {row.status.replace(/_/g, " ")}
                    </span>
                    <div className="status-mix__track" aria-hidden>
                      <i
                        className={`status-mix__fill${barsOn ? " is-on" : ""}`}
                        style={{
                          ["--w" as string]: `${pct}%`,
                          ["--delay" as string]: `${120 + i * 70}ms`,
                        }}
                      />
                    </div>
                    <em>{row.count}</em>
                  </div>
                )
              })}
            </div>
            <Link
              href="/dashboard/admin/bookings"
              className="dash-btn dash-btn--ghost"
              style={{ marginTop: 12 }}
            >
              Open bookings
            </Link>
          </section>
        </div>
      </div>
    </AdminShell>
  )
}
