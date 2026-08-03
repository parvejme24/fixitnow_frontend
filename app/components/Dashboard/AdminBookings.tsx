"use client"

import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useMemo, useState, type RefObject } from "react"
import {
  CalendarDaysIcon,
  EyeIcon,
  InboxIcon,
  LoaderCircleIcon,
  SearchIcon,
  UserRoundIcon,
  WalletIcon,
} from "lucide-react"

import BrowseSelect from "@/app/components/Shared/BrowseSelect/BrowseSelect"
import {
  getBookingErrorMessage,
  useAdminBookingsQuery,
} from "@/lib/bookings/hooks"
import { toDashBooking } from "@/lib/bookings/api"
import { useAdminUsersQuery } from "@/lib/admin/use-admin-users"
import { useAreas } from "@/lib/catalogue/hooks"
import { formatTaka } from "@/app/lib/dashboard-data"
import AdminShell from "./AdminShell"
import { useReveal } from "./DashShell"
import {
  DashToastHost,
  StatCard,
  StatusBadge,
  useDashToasts,
} from "./DashShared"

const STATUS_FILTERS = [
  "Every status",
  "REQUESTED",
  "ACCEPTED",
  "PAID",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "DECLINED",
] as const

const EVERY_TECH = "every-technician"
const EVERY_AREA = "every-area"

export default function AdminBookings() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { toasts } = useDashToasts()
  const bookingsQuery = useAdminBookingsQuery()
  const techUsersQuery = useAdminUsersQuery({ role: "TECHNICIAN" })
  const areasQuery = useAreas()
  const bookings = bookingsQuery.data ?? []

  const [q, setQ] = useState("")
  const [statusFilter, setStatusFilter] = useState("Every status")
  const [areaFilter, setAreaFilter] = useState(EVERY_AREA)
  const revealRef = useReveal([
    bookingsQuery.isFetching,
    statusFilter,
    areaFilter,
    searchParams.get("technicianId"),
  ])

  const technicians = useMemo(() => {
    const map = new Map<string, { id: string; name: string; email?: string }>()
    for (const b of bookings) {
      const id = b.technicianId || `name:${b.technician.name}`
      if (!map.has(id)) {
        map.set(id, { id, name: b.technician.name || "Technician" })
      }
    }
    for (const u of techUsersQuery.data ?? []) {
      const id = u.technicianId
      if (!id) continue
      const existing = map.get(id)
      if (existing) {
        existing.email = u.email
        if (!existing.name || existing.name === "Technician") {
          existing.name = u.name
        }
      } else {
        map.set(id, { id, name: u.name, email: u.email })
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    )
  }, [bookings, techUsersQuery.data])

  const areas = useMemo(() => {
    const map = new Map<string, { name: string; technicianCount: number }>()
    for (const area of areasQuery.data ?? []) {
      if (!area.name) continue
      map.set(area.name.toLowerCase(), {
        name: area.name,
        technicianCount: area.technicianCount ?? 0,
      })
    }
    // Include any booking area names not yet in the catalogue list
    for (const b of bookings) {
      const name = b.area?.trim()
      if (!name) continue
      const key = name.toLowerCase()
      if (!map.has(key)) {
        map.set(key, { name, technicianCount: 0 })
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    )
  }, [areasQuery.data, bookings])

  const activeTechId = searchParams.get("technicianId") || EVERY_TECH

  const setTechnicianFilter = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === EVERY_TECH) params.delete("technicianId")
    else params.set("technicianId", value)
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return bookings.filter((b) => {
      if (activeTechId !== EVERY_TECH) {
        const id = b.technicianId || `name:${b.technician.name}`
        if (id !== activeTechId) return false
      }
      if (areaFilter !== EVERY_AREA) {
        if ((b.area || "").trim().toLowerCase() !== areaFilter.toLowerCase()) {
          return false
        }
      }
      if (statusFilter !== "Every status") {
        const mapped = toDashBooking(b).status
        if (statusFilter === "IN_PROGRESS") {
          if (
            !["IN_PROGRESS", "EN_ROUTE", "ON_SITE"].includes(b.status) &&
            mapped !== "IN_PROGRESS"
          )
            return false
        } else if (b.status !== statusFilter && mapped !== statusFilter) {
          return false
        }
      }
      if (!query) return true
      const hay =
        `${b.reference} ${b.service} ${b.customer.name} ${b.technician.name} ${b.area}`.toLowerCase()
      return hay.includes(query)
    })
  }, [bookings, q, statusFilter, areaFilter, activeTechId])

  const selectedTechName =
    activeTechId === EVERY_TECH
      ? null
      : technicians.find((t) => t.id === activeTechId)?.name ||
        bookings.find(
          (b) =>
            (b.technicianId || `name:${b.technician.name}`) === activeTechId
        )?.technician.name ||
        "Technician"

  const scoped = filtered
  const active = scoped.filter((b) =>
    [
      "REQUESTED",
      "ACCEPTED",
      "PAID",
      "EN_ROUTE",
      "ON_SITE",
      "IN_PROGRESS",
    ].includes(b.status)
  ).length
  const awaitingPay = scoped.filter((b) => b.status === "ACCEPTED").length
  const revenue = scoped
    .filter((b) =>
      ["PAID", "COMPLETED", "IN_PROGRESS", "ON_SITE", "EN_ROUTE"].includes(
        b.status
      )
    )
    .reduce((s, b) => s + b.amount, 0)

  return (
    <AdminShell page="bookings">
      <div ref={revealRef as RefObject<HTMLDivElement>}>
        <p className="dash-breadcrumb">
          <Link href="/dashboard/admin">Admin</Link>
          <span>/</span>
          <span>Bookings</span>
          {selectedTechName ? (
            <>
              <span>/</span>
              <span>{selectedTechName}</span>
            </>
          ) : null}
        </p>
        <header className="dash-head">
          <div>
            <h1 className="dash-title">
              {selectedTechName
                ? `${selectedTechName}’s bookings`
                : "All bookings"}
            </h1>
            <p className="dash-sub">
              View-only oversight from <code>/admin/bookings</code>
              {selectedTechName
                ? ` — filtered to ${selectedTechName}.`
                : " — filter by technician, status, or search."}{" "}
              Open a row for full booking details.
            </p>
          </div>
          <div className="dash-head__actions">
            {selectedTechName ? (
              <button
                type="button"
                className="dash-btn dash-btn--ghost"
                onClick={() => setTechnicianFilter(EVERY_TECH)}
              >
                Clear technician
              </button>
            ) : null}
            <button
              type="button"
              className="dash-btn dash-btn--ghost"
              onClick={() => void bookingsQuery.refetch()}
              disabled={bookingsQuery.isFetching}
            >
              {bookingsQuery.isFetching ? (
                <>
                  <LoaderCircleIcon size={16} className="animate-spin" />
                  Refreshing…
                </>
              ) : (
                "Refresh"
              )}
            </button>
          </div>
        </header>

        <div className="stat-row">
          <StatCard
            icon={<InboxIcon size={18} />}
            value={scoped.length}
            label={selectedTechName ? "Tech bookings" : "Total bookings"}
            delta={selectedTechName ? selectedTechName : "From API"}
            delay={0}
            animate={!bookingsQuery.isLoading}
          />
          <StatCard
            icon={<CalendarDaysIcon size={18} />}
            value={active}
            label="Active"
            delta="In flight"
            variant="sky"
            delay={55}
            animate={!bookingsQuery.isLoading}
          />
          <StatCard
            icon={<WalletIcon size={18} />}
            value={awaitingPay}
            label="Awaiting payment"
            delta="Accepted"
            variant="signal"
            delay={110}
            animate={!bookingsQuery.isLoading}
          />
          <StatCard
            icon={<WalletIcon size={18} />}
            value={revenue}
            label="Gross (paid+)"
            delta="Sum of paid jobs"
            variant="violet"
            prefix="৳"
            delay={165}
            animate={!bookingsQuery.isLoading}
          />
        </div>

        <section className="dash-card" style={{ marginTop: 14 }}>
          <div className="admin-filters admin-filters--bookings">
            <label className="dash-search">
              <SearchIcon size={16} />
              <input
                className="dash-input"
                placeholder="Search ref, service, names"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </label>
            <BrowseSelect
              aria-label="Filter by technician"
              value={activeTechId}
              onValueChange={setTechnicianFilter}
              searchable
              searchPlaceholder="Search technician…"
              placeholder="Every technician"
              options={[
                { value: EVERY_TECH, label: "Every technician" },
                ...technicians.map((t) => ({
                  value: t.id,
                  label: t.name,
                  keywords: t.email,
                })),
              ]}
            />
            <BrowseSelect
              aria-label="Filter by area"
              value={areaFilter}
              onValueChange={setAreaFilter}
              searchable
              searchPlaceholder="Search area…"
              placeholder={
                areasQuery.isLoading ? "Loading areas…" : "Every area"
              }
              options={[
                { value: EVERY_AREA, label: "Every area" },
                ...areas.map((area) => ({
                  value: area.name,
                  label: area.name,
                  keywords: String(area.technicianCount),
                })),
              ]}
            />
            <BrowseSelect
              aria-label="Filter by status"
              value={statusFilter}
              onValueChange={setStatusFilter}
              options={STATUS_FILTERS.map((s) => ({
                value: s,
                label: s === "Every status" ? s : s.replace(/_/g, " "),
              }))}
            />
          </div>

          {bookingsQuery.isError ? (
            <div className="dash-empty">
              <h3>Could not load bookings</h3>
              <p>{getBookingErrorMessage(bookingsQuery.error)}</p>
            </div>
          ) : bookingsQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skel skel-row" />
            ))
          ) : filtered.length === 0 ? (
            <div className="dash-empty">
              <h3>No bookings match</h3>
              <p>Try another technician, area, status, or search.</p>
            </div>
          ) : (
            <div className="table-wrap table-wrap--scroll">
              <div className="table-scroll">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Ref</th>
                      <th>Service</th>
                      <th>Customer</th>
                      <th>Technician</th>
                      <th>When</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((b) => {
                      const dash = toDashBooking(b)
                      const techKey =
                        b.technicianId || `name:${b.technician.name}`
                      return (
                        <tr key={b.id}>
                          <td className="mono-muted">
                            <Link href={`/bookings/${b.id}`}>{b.reference}</Link>
                          </td>
                          <td>
                            <strong>{b.service}</strong>
                            {b.area ? (
                              <div className="mono-muted" style={{ fontSize: "0.78rem" }}>
                                {b.area}
                              </div>
                            ) : null}
                          </td>
                          <td>{b.customer.name}</td>
                          <td>
                            <button
                              type="button"
                              className="admin-tech-link"
                              title={`Show only ${b.technician.name}`}
                              onClick={() => setTechnicianFilter(techKey)}
                            >
                              <UserRoundIcon size={14} />
                              {b.technician.name}
                            </button>
                          </td>
                          <td className="mono-muted">
                            {b.date} · {b.time}
                          </td>
                          <td>{formatTaka(b.amount)}</td>
                          <td>
                            <StatusBadge status={dash.status} />
                          </td>
                          <td>
                            <Link
                              href={`/bookings/${b.id}`}
                              className="dash-btn dash-btn--ghost dash-btn--sm"
                            >
                              <EyeIcon size={14} />
                              View
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="table-foot">
                <span>
                  Showing {filtered.length} booking
                  {filtered.length === 1 ? "" : "s"}
                  {selectedTechName ? ` for ${selectedTechName}` : ""}
                </span>
              </div>
            </div>
          )}
        </section>
      </div>
      <DashToastHost toasts={toasts} />
    </AdminShell>
  )
}
