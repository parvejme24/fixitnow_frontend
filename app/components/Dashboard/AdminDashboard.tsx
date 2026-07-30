"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState, type RefObject } from "react"
import {
  AlertTriangleIcon,
  ChevronRightIcon,
  InboxIcon,
  SearchIcon,
  UsersIcon,
  WalletIcon,
} from "lucide-react"
import { useReducedMotion } from "framer-motion"

import BrowseSelect from "@/app/components/Shared/BrowseSelect/BrowseSelect"
import {
  ADMIN_STATUS_COUNTS,
  BAN_REASONS,
  BUSIEST_CATEGORIES,
  DECISION_QUEUE,
  formatTaka,
  formatTakaK,
  GROSS_MONTHS,
  lifetimeValue,
  type AdminUser,
} from "@/app/lib/admin-data"
import { useAdminUsers } from "@/app/lib/admin-store"
import AdminShell from "./AdminShell"
import { useReveal } from "./DashShell"
import {
  DashModal,
  DashToastHost,
  StatCard,
  StatusBadge,
  useDashToasts,
} from "./DashShared"

const PAGE_SIZE = 8

function useDebounced<T>(value: T, ms: number) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const id = window.setTimeout(() => setV(value), ms)
    return () => window.clearTimeout(id)
  }, [value, ms])
  return v
}

export default function AdminDashboard() {
  const { users, setUsers } = useAdminUsers()
  const reduceMotion = useReducedMotion() ?? false
  const { toasts, pushToast } = useDashToasts()
  const [range, setRange] = useState("30")
  const [q, setQ] = useState("")
  const debouncedQ = useDebounced(q, 200)
  const [roleFilter, setRoleFilter] = useState("Every role")
  const [statusFilter, setStatusFilter] = useState("Any status")
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [barsReady, setBarsReady] = useState(false)
  const [leavingIds, setLeavingIds] = useState<string[]>([])
  const [banUser, setBanUser] = useState<AdminUser | null>(null)
  const [banReason, setBanReason] = useState<string>(BAN_REASONS[0])
  const [viewUser, setViewUser] = useState<AdminUser | null>(null)
  const barsOn = reduceMotion || barsReady
  const revealRef = useReveal([barsOn, page, loading])
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const id = window.setTimeout(() => setLoading(false), 750)
    return () => window.clearTimeout(id)
  }, [])

  useEffect(() => {
    const id = window.setTimeout(() => setBarsReady(true), reduceMotion ? 0 : 180)
    return () => window.clearTimeout(id)
  }, [reduceMotion])

  const maxGross = Math.max(...GROSS_MONTHS.map((m) => m.value))
  const maxCat = Math.max(...BUSIEST_CATEGORIES.map((c) => c.jobs))
  const statusTotal = ADMIN_STATUS_COUNTS.reduce((s, x) => s + x.count, 0)

  const filtered = useMemo(() => {
    const query = debouncedQ.trim().toLowerCase()
    return users.filter((u) => {
      if (query && !`${u.name} ${u.email}`.toLowerCase().includes(query))
        return false
      if (roleFilter !== "Every role" && u.role !== roleFilter) return false
      if (statusFilter !== "Any status" && u.status !== statusFilter)
        return false
      return true
    })
  }, [users, debouncedQ, roleFilter, statusFilter])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const start = safePage * PAGE_SIZE
  const pageRows = filtered.slice(start, start + PAGE_SIZE)
  const showingFrom = filtered.length ? start + 1 : 0
  const showingTo = Math.min(start + PAGE_SIZE, filtered.length)

  const resetFilters = () => {
    setQ("")
    setRoleFilter("Every role")
    setStatusFilter("Any status")
    setPage(0)
  }

  const confirmBan = () => {
    if (!banUser) return
    const id = banUser.id
    const name = banUser.name
    setBanUser(null)
    setLeavingIds((prev) => [...prev, id])
    window.setTimeout(() => {
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, status: "Banned" } : u))
      )
      setLeavingIds((prev) => prev.filter((x) => x !== id))
      pushToast("Account banned", `${name} can no longer sign in.`)
    }, 320)
  }

  const unban = (u: AdminUser) => {
    setUsers((prev) =>
      prev.map((row) =>
        row.id === u.id ? { ...row, status: "Active" } : row
      )
    )
    pushToast("Account restored", `${u.name} can sign in again.`)
  }

  return (
    <AdminShell page="overview">
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
                { value: "quarter", label: "Last quarter" },
                { value: "ytd", label: "Year to date" },
              ]}
              triggerClassName="min-w-[10.5rem]"
            />
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

        <div className="dash-grid-split">
          <section className="dash-card" data-reveal>
            <div className="dash-card__head">
              <div>
                <h2 className="dash-card__title">Gross booking value</h2>
                <p className="dash-card__sub">Six months, in thousands of taka</p>
              </div>
              <span className="badge-soft badge-soft--progress">
                +18.5% vs June
              </span>
            </div>
            <div className="chart">
              {GROSS_MONTHS.map((m) => (
                <div key={m.label} className="chart__col">
                  <div
                    className={`chart__bar${barsOn ? " is-on" : ""}`}
                    style={{
                      ["--h" as string]: `${(m.value / maxGross) * 100}%`,
                    }}
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
              {BUSIEST_CATEGORIES.map((c, i) => (
                <div key={c.name} className="rank-row">
                  <span className="rank-row__n">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>{c.name}</div>
                    <div className="progress-track progress-track--thin">
                      <div
                        className={`progress-fill${barsOn ? " is-on" : ""}`}
                        style={{
                          ["--w" as string]: `${(c.jobs / maxCat) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <strong className="rank-row__jobs">
                    {c.jobs.toLocaleString("en-IN")}
                  </strong>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="dash-grid-split">
          <section className="dash-card" data-reveal>
            <h2 className="dash-card__title">Bookings by status, right now</h2>
            <div className="progress-list" style={{ marginTop: 14 }}>
              {ADMIN_STATUS_COUNTS.map((s) => (
                <div key={s.status}>
                  <div className="progress-item__label">
                    <StatusBadge status={s.status} />
                    <strong className="mono-count">{s.count}</strong>
                  </div>
                  <div className="progress-track">
                    <div
                      className={`progress-fill${s.status === "COMPLETED" ? " progress-fill--signal" : ""}${s.status === "PAID" ? " progress-fill--sky" : ""}${barsOn ? " is-on" : ""}`}
                      style={{
                        ["--w" as string]: `${(s.count / statusTotal) * 100}%`,
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
            <h2 className="dash-card__title">All accounts</h2>
          </div>

          <div className="admin-filters">
            <label className="dash-search">
              <SearchIcon size={16} />
              <input
                ref={searchRef}
                className="dash-input"
                placeholder="Search name or email"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value)
                  setPage(0)
                }}
              />
            </label>
            <BrowseSelect
              value={roleFilter}
              onValueChange={(v) => {
                setRoleFilter(v)
                setPage(0)
              }}
              options={[
                { value: "Every role", label: "Every role" },
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
                { value: "Any status", label: "Any status" },
                { value: "Active", label: "Active" },
                { value: "Suspended", label: "Suspended" },
                { value: "Banned", label: "Banned" },
              ]}
            />
          </div>

          <div className="table-wrap" style={{ border: 0, boxShadow: "none" }}>
            {loading ? (
              <div>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="skel skel-row" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="dash-empty">
                <h3>No accounts match</h3>
                <p>Try clearing search or resetting filters.</p>
                <button
                  type="button"
                  className="dash-btn dash-btn--ghost"
                  onClick={resetFilters}
                >
                  Reset filters
                </button>
              </div>
            ) : (
              <>
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
                      <tr
                        key={u.id}
                        className={
                          leavingIds.includes(u.id) ? "is-leaving" : undefined
                        }
                      >
                        <td>
                          <div className="cell-person">
                            <span className="dash-avatar-sm">{u.initials}</span>
                            <div className="cell-stack">
                              <strong>{u.name}</strong>
                              <small className="mono-muted">{u.email}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="skill-tag">{u.role}</span>
                        </td>
                        <td className="mono-muted">{u.joined}</td>
                        <td>
                          <strong className="mono-count">{u.bookings}</strong>
                        </td>
                        <td>
                          <StatusBadge status={u.status} />
                        </td>
                        <td>
                          <div className="row-actions">
                            {u.status === "Banned" ? (
                              <button
                                type="button"
                                className="dash-btn dash-btn--signal dash-btn--sm"
                                onClick={() => unban(u)}
                              >
                                Unban
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="dash-btn dash-btn--ghost dash-btn--sm"
                                onClick={() => {
                                  setBanReason(BAN_REASONS[0])
                                  setBanUser(u)
                                }}
                              >
                                Ban
                              </button>
                            )}
                            <button
                              type="button"
                              className="dash-icon-btn"
                              aria-label={`View ${u.name}`}
                              onClick={() => setViewUser(u)}
                            >
                              <ChevronRightIcon size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="table-foot">
                  <span>
                    Showing {showingFrom}–{showingTo} of {filtered.length}{" "}
                    accounts
                  </span>
                  <div className="pager pager--nums">
                    <button
                      type="button"
                      disabled={safePage === 0}
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                    >
                      Prev
                    </button>
                    {Array.from({ length: pageCount }).map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        className={i === safePage ? "is-active" : undefined}
                        onClick={() => setPage(i)}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      type="button"
                      disabled={safePage >= pageCount - 1}
                      onClick={() =>
                        setPage((p) => Math.min(pageCount - 1, p + 1))
                      }
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      <DashModal
        open={Boolean(banUser)}
        title={banUser ? `Ban ${banUser.name}?` : "Ban account"}
        onClose={() => setBanUser(null)}
        actions={
          <>
            <button
              type="button"
              className="dash-btn dash-btn--ghost"
              onClick={() => setBanUser(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="dash-btn dash-btn--danger"
              onClick={confirmBan}
            >
              Ban account
            </button>
          </>
        }
      >
        {banUser ? (
          <div className="modal-stack">
            <p>
              This removes access immediately and cancels any open bookings on
              the account.
            </p>
            <label className="field">
              <span>Reason</span>
              <BrowseSelect
                value={banReason}
                onValueChange={setBanReason}
                options={BAN_REASONS.map((r) => ({ value: r, label: r }))}
              />
            </label>
            <div className="warn-box">
              <AlertTriangleIcon size={18} />
              <p>
                {banUser.bookings} bookings sit on this account. Anything unpaid
                will be refunded automatically.
              </p>
            </div>
          </div>
        ) : null}
      </DashModal>

      <DashModal
        open={Boolean(viewUser)}
        title="Account detail"
        onClose={() => setViewUser(null)}
        actions={
          <button
            type="button"
            className="dash-btn dash-btn--ghost"
            onClick={() => setViewUser(null)}
          >
            Close
          </button>
        }
      >
        {viewUser ? (
          <div className="account-detail">
            <div className="account-detail__hero">
              <span className="dash-avatar dash-avatar--lg">
                {viewUser.initials}
              </span>
              <div>
                <h4>{viewUser.name}</h4>
                <p className="mono-muted">{viewUser.email}</p>
                <StatusBadge status={viewUser.status} />
              </div>
            </div>
            <div className="receipt-list">
              <div>
                <span>Role</span>
                <strong>{viewUser.role}</strong>
              </div>
              <div>
                <span>Joined</span>
                <strong>{viewUser.joined}</strong>
              </div>
              <div>
                <span>Bookings</span>
                <strong>{viewUser.bookings}</strong>
              </div>
              <div>
                <span>Disputes raised</span>
                <strong>{viewUser.status === "Banned" ? 4 : 0}</strong>
              </div>
              <div>
                <span>Lifetime value</span>
                <strong>{formatTaka(lifetimeValue(viewUser.bookings))}</strong>
              </div>
            </div>
          </div>
        ) : null}
      </DashModal>

      <DashToastHost toasts={toasts} />
    </AdminShell>
  )
}
