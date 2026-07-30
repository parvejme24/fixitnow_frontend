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
import {
  ADMIN_STATUS_COUNTS,
  BUSIEST_CATEGORIES,
  DECISION_QUEUE,
  formatTakaK,
  GROSS_MONTHS,
} from "@/app/lib/admin-data"
import { useAdminUsersQuery } from "@/lib/admin/use-admin-users"
import AdminShell from "./AdminShell"
import { useReveal } from "./DashShell"
import { StatCard } from "./DashShared"

export default function AdminDashboard() {
  const reduceMotion = useReducedMotion() ?? false
  const usersQuery = useAdminUsersQuery()
  const users = usersQuery.data ?? []
  const [range, setRange] = useState("30")
  const [barsReady, setBarsReady] = useState(false)
  const barsOn = reduceMotion || barsReady
  const revealRef = useReveal([barsOn])

  useEffect(() => {
    const id = window.setTimeout(() => setBarsReady(true), reduceMotion ? 0 : 180)
    return () => window.clearTimeout(id)
  }, [reduceMotion])

  const maxGross = Math.max(...GROSS_MONTHS.map((m) => m.value))
  const maxCat = Math.max(...BUSIEST_CATEGORIES.map((c) => c.jobs))
  const statusTotal = ADMIN_STATUS_COUNTS.reduce((s, x) => s + x.count, 0)
  const userTotal = users.length

  return (
    <AdminShell page="overview">
      <div ref={revealRef as RefObject<HTMLDivElement>}>
        <header className="dash-head">
          <div>
            <p className="dash-eyebrow">Admin console</p>
            <h1 className="dash-title">Platform health</h1>
            <p className="dash-sub">
              Overview of bookings and categories. Manage accounts on the Users
              page.
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
              href="/dashboard/admin/users"
              className="dash-btn dash-btn--ghost"
            >
              Users
            </Link>
            <Link
              href="/dashboard/admin/categories"
              className="dash-btn dash-btn--ghost"
            >
              Categories
            </Link>
          </div>
        </header>

        <div className="stat-row">
          <StatCard
            icon={<UsersIcon size={18} />}
            value={userTotal}
            label="Total users"
            delta={usersQuery.isLoading ? "Loading…" : "Live from API"}
            delay={0}
            animate={!usersQuery.isLoading}
          />
          <StatCard
            icon={<InboxIcon size={18} />}
            value={1204}
            label="Active bookings"
            delta="92 awaiting payment"
            variant="sky"
            delay={55}
          />
          <StatCard
            icon={<WalletIcon size={18} />}
            value={4412000}
            label="Gross value, 30 days"
            delta="+18.5%"
            variant="signal"
            prefix="৳"
            delay={110}
          />
          <StatCard
            icon={<AlertTriangleIcon size={18} />}
            value={3}
            label="Open disputes"
            delta="2 older than 48h"
            deltaDir="down"
            variant="flare"
            delay={165}
          />
        </div>

        <div className="admin-grid">
          <section className="dash-card">
            <div className="dash-card__head">
              <h2 className="dash-card__title">Gross value</h2>
            </div>
            <div className="chart">
              {GROSS_MONTHS.map((m) => (
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
                  <em>{formatTakaK(m.value)}</em>
                </div>
              ))}
            </div>
          </section>

          <section className="dash-card">
            <div className="dash-card__head">
              <h2 className="dash-card__title">Busiest categories</h2>
            </div>
            <div className="rank-list">
              {BUSIEST_CATEGORIES.map((c, i) => (
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
              {ADMIN_STATUS_COUNTS.map((row) => (
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
          </section>

          <section className="dash-card">
            <div className="dash-card__head">
              <h2 className="dash-card__title">Decision queue</h2>
            </div>
            <div className="queue-list">
              {DECISION_QUEUE.map((row) => (
                <div key={row.id} className="queue-row">
                  <div>
                    <p className="queue-row__title">{row.title}</p>
                    <p className="queue-row__detail">{row.detail}</p>
                  </div>
                  <span className={`urgency urgency--${row.tone}`}>{row.tag}</span>
                </div>
              ))}
            </div>
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
            <Link href="/profile" className="dash-btn dash-btn--secondary">
              My profile
            </Link>
          </div>
        </section>
      </div>
    </AdminShell>
  )
}
