"use client"

import Link from "next/link"
import { useEffect, useMemo, useState, type RefObject } from "react"
import {
  AlertTriangleIcon,
  FolderIcon,
  InboxIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  UsersIcon,
  WalletIcon,
} from "lucide-react"
import { useReducedMotion } from "framer-motion"

import { useAuth } from "@/app/providers/AuthProvider"
import BrowseSelect from "@/app/components/Shared/BrowseSelect/BrowseSelect"
import {
  ADMIN_CATEGORIES,
  ADMIN_STATUS_COUNTS,
  ADMIN_USERS,
  formatTakaK,
  GROSS_MONTHS,
  type AccountStatus,
  type DashUser,
} from "@/app/lib/dashboard-data"
import DashShell, { useReveal } from "./DashShell"
import {
  DashModal,
  DashToastHost,
  StatCard,
  StatusBadge,
  useDashToasts,
} from "./DashShared"

const PAGE_SIZE = 8

export default function AdminDashboard() {
  const { user } = useAuth()
  const name = user?.name || "Platform admin"
  const reduceMotion = useReducedMotion() ?? false
  const { toasts, pushToast } = useDashToasts()
  const [users, setUsers] = useState<DashUser[]>(ADMIN_USERS)
  const [range, setRange] = useState("30")
  const [q, setQ] = useState("")
  const [roleFilter, setRoleFilter] = useState("All")
  const [statusFilter, setStatusFilter] = useState("All")
  const [page, setPage] = useState(0)
  const [barsReady, setBarsReady] = useState(false)
  const [actionUser, setActionUser] = useState<{
    id: string
    next: AccountStatus
  } | null>(null)
  const barsOn = reduceMotion || barsReady
  const revealRef = useReveal([barsOn, page])

  useEffect(() => {
    const id = window.setTimeout(() => setBarsReady(true), reduceMotion ? 0 : 180)
    return () => window.clearTimeout(id)
  }, [reduceMotion])

  const maxGross = Math.max(...GROSS_MONTHS.map((m) => m.value))
  const maxCat = Math.max(...ADMIN_CATEGORIES.map((c) => c.jobs))
  const maxStatus = Math.max(...ADMIN_STATUS_COUNTS.map((s) => s.count))

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return users.filter((u) => {
      if (query && !`${u.name} ${u.email}`.toLowerCase().includes(query))
        return false
      if (roleFilter !== "All" && u.role !== roleFilter) return false
      if (statusFilter !== "All" && u.status !== statusFilter) return false
      return true
    })
  }, [users, q, roleFilter, statusFilter])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const pageRows = filtered.slice(
    safePage * PAGE_SIZE,
    safePage * PAGE_SIZE + PAGE_SIZE
  )
  const applyStatus = () => {
    if (!actionUser) return
    setUsers((prev) =>
      prev.map((u) =>
        u.id === actionUser.id ? { ...u, status: actionUser.next } : u
      )
    )
    const row = users.find((u) => u.id === actionUser.id)
    pushToast(
      `Account ${actionUser.next.toLowerCase()}`,
      row ? `${row.name} is now ${actionUser.next}.` : "Updated."
    )
    setActionUser(null)
  }

  const groups = [
    {
      label: "Oversight",
      items: [
        {
          label: "Overview",
          href: "/dashboard/admin",
          icon: <LayoutDashboardIcon />,
          active: true,
        },
        {
          label: "Users",
          href: "/dashboard/admin#users",
          icon: <UsersIcon />,
          pill: users.length,
        },
        {
          label: "Categories",
          href: "/services",
          icon: <FolderIcon />,
          pill: 8,
        },
        {
          label: "Disputes",
          href: "/dashboard/admin#disputes",
          icon: <AlertTriangleIcon />,
          pill: 3,
        },
      ],
    },
    {
      label: "Account",
      items: [{ label: "Log out", href: "#", icon: <LogOutIcon /> }],
    },
  ]

  return (
    <DashShell
      role="ADMIN"
      displayName={name}
      roleLabel="Admin"
      groups={groups}
    >
      <div ref={revealRef as RefObject<HTMLDivElement>}>
        <header className="dash-head">
          <div>
            <p className="dash-eyebrow">Admin console</p>
            <h1 className="dash-title">Platform health</h1>
            <p className="dash-sub">
              Everything below is live across all 18 accounts and 8 categories.
            </p>
          </div>
          <div className="dash-head__actions">
            <BrowseSelect
              aria-label="Date range"
              value={range}
              onValueChange={setRange}
              options={[
                { value: "30", label: "Last 30 days" },
                { value: "quarter", label: "This quarter" },
                { value: "ytd", label: "YTD" },
              ]}
              triggerClassName="min-w-[10.5rem]"
            />
            <Link href="/services" className="dash-btn dash-btn--ghost">
              Categories
            </Link>
          </div>
        </header>

        <div className="stat-row">
          <StatCard
            icon={<UsersIcon size={18} />}
            value={18420}
            label="Total users"
            delta="+412 this month"
            delay={0}
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
            label="Gross value 30 days"
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

        <div className="dash-grid-split">
          <section className="dash-card" data-reveal>
            <div className="dash-card__head">
              <div>
                <h2 className="dash-card__title">Gross booking value</h2>
                <p style={{ margin: "6px 0 0", color: "var(--steel-400)", fontSize: "0.85rem" }}>
                  Six months, in thousands of taka
                </p>
              </div>
              <span className="badge-soft">+18.5% vs June</span>
            </div>
            <div className="chart">
              {GROSS_MONTHS.map((m) => (
                <div key={m.label} className="chart__col">
                  <div
                    className={`chart__bar${barsOn ? " is-on" : ""}`}
                    style={{ ["--h" as string]: `${(m.value / maxGross) * 100}%` }}
                    data-tip={formatTakaK(m.value)}
                  />
                  <span className="chart__label">{m.label}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="dash-card" data-reveal>
            <h2 className="dash-card__title">Busiest categories</h2>
            <div className="rank-list" style={{ marginTop: 14 }}>
              {ADMIN_CATEGORIES.map((c, i) => (
                <div key={c.name} className="rank-row">
                  <span className="rank-row__n">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>{c.name}</div>
                    <div className="progress-track">
                      <div
                        className={`progress-fill${barsOn ? " is-on" : ""}`}
                        style={{
                          ["--w" as string]: `${(c.jobs / maxCat) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <strong style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem" }}>
                    {c.jobs.toLocaleString("en-IN")}
                  </strong>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="dash-grid-split">
          <section className="dash-card" data-reveal id="disputes">
            <h2 className="dash-card__title">Bookings by status</h2>
            <div className="progress-list" style={{ marginTop: 14 }}>
              {ADMIN_STATUS_COUNTS.map((s) => (
                <div key={s.status}>
                  <div className="progress-item__label">
                    <StatusBadge status={s.status} />
                    <strong>{s.count}</strong>
                  </div>
                  <div className="progress-track">
                    <div
                      className={`progress-fill${s.status === "COMPLETED" ? " progress-fill--signal" : ""}${s.status === "PAID" ? " progress-fill--sky" : ""}${barsOn ? " is-on" : ""}`}
                      style={{
                        ["--w" as string]: `${(s.count / maxStatus) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="dash-card" data-reveal>
            <h2 className="dash-card__title">Needs a decision</h2>
            <div style={{ marginTop: 12 }}>
              {[
                {
                  title: "Refund dispute FIX-4698",
                  detail: "Customer claims incomplete AC gas refill",
                  tag: "Urgent",
                  tone: "urgent",
                },
                {
                  title: "Verification · Milon Das",
                  detail: "ID documents waiting for review",
                  tag: "Pending",
                  tone: "pending",
                },
                {
                  title: "Solar category proposal",
                  detail: "New trade suggested by 4 technicians",
                  tag: "New",
                  tone: "new",
                },
                {
                  title: "Tanvir cancellation pattern",
                  detail: "3 late cancels in 10 days",
                  tag: "Review",
                  tone: "review",
                },
              ].map((row) => (
                <div key={row.title} className="queue-row">
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
            <h2 className="dash-card__title">All accounts</h2>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.4fr 1fr 1fr",
              gap: 10,
              marginBottom: 14,
            }}
          >
            <input
              className="dash-input"
              placeholder="Search name or email"
              value={q}
              onChange={(e) => {
                setQ(e.target.value)
                setPage(0)
              }}
            />
            <BrowseSelect
              value={roleFilter}
              onValueChange={(v) => {
                setRoleFilter(v)
                setPage(0)
              }}
              options={[
                { value: "All", label: "All roles" },
                { value: "Customer", label: "Customer" },
                { value: "Technician", label: "Technician" },
                { value: "Admin", label: "Admin" },
              ]}
            />
            <BrowseSelect
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v)
                setPage(0)
              }}
              options={[
                { value: "All", label: "All statuses" },
                { value: "Active", label: "Active" },
                { value: "Suspended", label: "Suspended" },
                { value: "Banned", label: "Banned" },
              ]}
            />
          </div>

          <div className="table-wrap" style={{ border: 0, boxShadow: "none" }}>
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Account</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Bookings</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="cell-person">
                        <span className="dash-avatar-sm">{u.initials}</span>
                        <div className="cell-stack">
                          <strong>{u.name}</strong>
                          <small>{u.email}</small>
                        </div>
                      </div>
                    </td>
                    <td>{u.role}</td>
                    <td>{u.joined}</td>
                    <td>{u.bookings}</td>
                    <td>
                      <StatusBadge status={u.status} />
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        {u.status === "Active" && (
                          <>
                            <button
                              type="button"
                              className="dash-btn dash-btn--ghost dash-btn--sm"
                              onClick={() =>
                                setActionUser({ id: u.id, next: "Suspended" })
                              }
                            >
                              Suspend
                            </button>
                            <button
                              type="button"
                              className="dash-btn dash-btn--ghost dash-btn--sm"
                              onClick={() =>
                                setActionUser({ id: u.id, next: "Banned" })
                              }
                            >
                              Ban
                            </button>
                          </>
                        )}
                        {u.status !== "Active" && (
                          <button
                            type="button"
                            className="dash-btn dash-btn--primary dash-btn--sm"
                            onClick={() =>
                              setActionUser({ id: u.id, next: "Active" })
                            }
                          >
                            Restore
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="table-foot">
              <span>
                Showing {pageRows.length} of {filtered.length} accounts
              </span>
              <div className="pager">
                <button
                  type="button"
                  disabled={safePage === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  Prev
                </button>
                <button
                  type="button"
                  disabled={safePage >= pageCount - 1}
                  onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      <DashModal
        open={Boolean(actionUser)}
        title="Confirm account action"
        onClose={() => setActionUser(null)}
        actions={
          <>
            <button
              type="button"
              className="dash-btn dash-btn--ghost"
              onClick={() => setActionUser(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="dash-btn dash-btn--primary"
              onClick={applyStatus}
            >
              Confirm
            </button>
          </>
        }
      >
        {actionUser
          ? `Set this account to ${actionUser.next}? The change applies immediately.`
          : null}
      </DashModal>

      <DashToastHost toasts={toasts} />
    </DashShell>
  )
}
