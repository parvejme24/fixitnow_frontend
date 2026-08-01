"use client"

import Link from "next/link"
import { useEffect, useState, type RefObject } from "react"
import {
  AlertTriangleIcon,
  InboxIcon,
  UsersIcon,
  WalletIcon,
} from "lucide-react"
import { useReducedMotion } from "framer-motion"

import BrowseSelect from "@/app/components/Shared/BrowseSelect/BrowseSelect"
import { formatTakaK } from "@/app/lib/admin-data"
import { useAdminStatsQuery } from "@/lib/admin/use-admin-platform"
import { useAdminUsersQuery } from "@/lib/admin/use-admin-users"
import { useAdminBookingsQuery } from "@/lib/bookings/hooks"
import AdminShell from "./AdminShell"
import { useReveal } from "./DashShell"
import { StatCard } from "./DashShared"

export default function AdminDashboard() {
  const reduceMotion = useReducedMotion() ?? false
  const usersQuery = useAdminUsersQuery()
  const statsQuery = useAdminStatsQuery()
  const bookingsQuery = useAdminBookingsQuery()
  const users = usersQuery.data ?? []
  const stats = statsQuery.data
  const bookings = bookingsQuery.data ?? []
  const [range, setRange] = useState("30")
  const [barsReady, setBarsReady] = useState(false)
  const barsOn = reduceMotion || barsReady
  const revealRef = useReveal([barsOn, statsQuery.isFetching])

  useEffect(() => {
    const id = window.setTimeout(() => setBarsReady(true), reduceMotion ? 0 : 180)
    return () => window.clearTimeout(id)
  }, [reduceMotion])

  const grossMonths =
    stats?.monthlyRevenue?.length
      ? stats.monthlyRevenue
      : [{ label: "—", value: 0 }]
  const categories =
    stats?.topCategories?.length
      ? stats.topCategories
      : [{ name: "No data yet", jobs: 0 }]
  const statusCounts =
    stats?.statusCounts?.length
      ? stats.statusCounts
      : [{ status: "REQUESTED", count: 0 }]

  const maxGross = Math.max(...grossMonths.map((m) => m.value), 1)
  const maxCat = Math.max(...categories.map((c) => c.jobs), 1)
  const statusTotal = Math.max(
    statusCounts.reduce((s, x) => s + x.count, 0),
    1
  )
  const userTotal = stats?.users || users.length
  const activeBookings = stats?.activeBookings ?? 0
  const revenue = stats?.revenue ?? 0
  const disputes = stats?.disputes ?? 0

  return (
    <AdminShell page="overview">
      <div ref={revealRef as RefObject<HTMLDivElement>}>
        <header className="dash-head">
          <div>
            <p className="dash-eyebrow">Admin console</p>
            <h1 className="dash-title">Platform health</h1>
            <p className="dash-sub">
              Live overview from <code>/admin/stats</code>. Manage bookings,
              services, and users from the sidebar.
            </p>
          </div>
          <div className="dash-head__actions">
            <BrowseSelect
              aria-label="Date range"
              value={range}
              onValueChange={setRange}
              options={[
                { value: "30", label: "Last 30 days" },
                { value: "quarter", label: "Last quarter" },
                { value: "ytd", label: "Year to date" },
              ]}
              triggerClassName="min-w-[10.5rem]"
            />
            <Link
              href="/dashboard/admin/bookings"
              className="dash-btn dash-btn--ghost"
            >
              Bookings
            </Link>
            <Link
              href="/dashboard/admin/services"
              className="dash-btn dash-btn--ghost"
            >
              Services
            </Link>
          </div>
        </header>

        <div className="stat-row">
          <StatCard
            icon={<UsersIcon size={18} />}
            value={userTotal}
            label="Total users"
            delta={
              statsQuery.isLoading
                ? "Loading…"
                : `${stats?.technicians ?? 0} techs`
            }
            delay={0}
            animate={!statsQuery.isLoading && !usersQuery.isLoading}
          />
          <StatCard
            icon={<InboxIcon size={18} />}
            value={activeBookings}
            label="Active bookings"
            delta={`${stats?.awaitingPayment ?? 0} awaiting payment`}
            variant="sky"
            delay={55}
            animate={!statsQuery.isLoading}
          />
          <StatCard
            icon={<WalletIcon size={18} />}
            value={revenue}
            label="Gross value"
            delta={`${stats?.completedJobs ?? 0} completed`}
            variant="signal"
            prefix="৳"
            delay={110}
            animate={!statsQuery.isLoading}
          />
          <StatCard
            icon={<AlertTriangleIcon size={18} />}
            value={disputes}
            label="Open disputes"
            delta="From admin stats"
            deltaDir="down"
            variant="flare"
            delay={165}
            animate={!statsQuery.isLoading}
          />
        </div>

        <div className="admin-grid">
          <section className="dash-card">
            <div className="dash-card__head">
              <h2 className="dash-card__title">Gross value</h2>
            </div>
            <div className="chart">
              {grossMonths.map((m) => (
                <div key={m.label} className="chart__col">
                  <div className="chart__track">
                    <div
                      className="chart__bar"
                      style={{
                        height: barsOn
                          ? `${Math.round((m.value / maxGross) * 100)}%`
                          : "0%",
                      }}
                    />
                  </div>
                  <span>{m.label}</span>
                  <em>{formatTakaK(m.value > 1000 ? m.value / 1000 : m.value)}</em>
                </div>
              ))}
            </div>
          </section>

          <section className="dash-card">
            <div className="dash-card__head">
              <h2 className="dash-card__title">Busiest categories</h2>
            </div>
            <div className="rank-list">
              {categories.map((c, i) => (
                <div key={c.name} className="rank-row">
                  <span className="rank-row__idx">{i + 1}</span>
                  <div className="rank-row__body">
                    <strong>{c.name}</strong>
                    <div className="rank-row__bar">
                      <i
                        style={{
                          width: barsOn
                            ? `${Math.round((c.jobs / maxCat) * 100)}%`
                            : "0%",
                        }}
                      />
                    </div>
                  </div>
                  <span className="rank-row__jobs">
                    {c.jobs.toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
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
              {statusCounts.map((row) => (
                <div key={row.status} className="status-mix__row">
                  <span>{row.status.replace(/_/g, " ")}</span>
                  <div className="status-mix__track">
                    <i
                      style={{
                        width: barsOn
                          ? `${Math.round((row.count / statusTotal) * 100)}%`
                          : "0%",
                      }}
                    />
                  </div>
                  <em>{row.count}</em>
                </div>
              ))}
            </div>
            <Link
              href="/dashboard/admin/bookings"
              className="dash-btn dash-btn--ghost"
              style={{ marginTop: 12 }}
            >
              Open bookings
            </Link>
          </section>

          <section className="dash-card">
            <div className="dash-card__head">
              <h2 className="dash-card__title">Action queue</h2>
            </div>
            <div className="queue-list">
              {users
                .filter(
                  (u) =>
                    u.role === "Technician" &&
                    !u.technicianVerified &&
                    u.technicianId
                )
                .slice(0, 3)
                .map((u) => (
                  <div key={`v-${u.id}`} className="queue-row">
                    <div>
                      <p className="queue-row__title">Verify {u.name}</p>
                      <p className="queue-row__detail">{u.email}</p>
                    </div>
                    <span className="urgency urgency--warm">Verify</span>
                  </div>
                ))}
              {bookings
                .filter((b) => b.status === "ACCEPTED")
                .slice(0, 3)
                .map((b) => (
                  <Link
                    key={`p-${b.id}`}
                    href={`/bookings/${b.id}`}
                    className="queue-row"
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <div>
                      <p className="queue-row__title">
                        {b.reference} awaiting payment
                      </p>
                      <p className="queue-row__detail">
                        {b.customer.name} · {b.service}
                      </p>
                    </div>
                    <span className="urgency urgency--warm">Unpaid</span>
                  </Link>
                ))}
              {!users.some(
                (u) =>
                  u.role === "Technician" &&
                  !u.technicianVerified &&
                  u.technicianId
              ) &&
              !bookings.some((b) => b.status === "ACCEPTED") ? (
                <p style={{ color: "var(--steel-400)", margin: 0 }}>
                  Queue clear — nothing urgent right now.
                </p>
              ) : null}
            </div>
            <Link
              href="/dashboard/admin/disputes"
              className="dash-btn dash-btn--ghost"
              style={{ marginTop: 12 }}
            >
              Open full queue
            </Link>
          </section>
        </div>

        <section className="dash-card" id="users" style={{ marginTop: 14 }}>
          <div className="dash-card__head">
            <h2 className="dash-card__title">User management</h2>
          </div>
          <p className="dash-sub" style={{ marginBottom: 16 }}>
            {usersQuery.isLoading
              ? "Loading accounts…"
              : `${userTotal} accounts on the platform. Change roles from the Users page.`}
          </p>
          <div className="row-actions">
            <Link
              href="/dashboard/admin/users"
              className="dash-btn dash-btn--primary"
            >
              Open users
            </Link>
            <Link
              href="/dashboard/admin/services"
              className="dash-btn dash-btn--secondary"
            >
              Manage services
            </Link>
          </div>
        </section>
      </div>
    </AdminShell>
  )
}
