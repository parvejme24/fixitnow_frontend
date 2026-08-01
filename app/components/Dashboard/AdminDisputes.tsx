"use client"

import Link from "next/link"
import { useMemo, type RefObject } from "react"
import {
  AlertTriangleIcon,
  LoaderCircleIcon,
  ShieldAlertIcon,
  WalletIcon,
} from "lucide-react"

import { useAdminBookingsQuery } from "@/lib/bookings/hooks"
import { useAdminUsersQuery } from "@/lib/admin/use-admin-users"
import { useReveal } from "./DashShell"
import AdminShell from "./AdminShell"
import { StatCard } from "./DashShared"

type QueueItem = {
  id: string
  title: string
  detail: string
  tag: string
  tone: "hot" | "warm" | "cool"
  href: string
}

export default function AdminDisputes() {
  const bookingsQuery = useAdminBookingsQuery()
  const usersQuery = useAdminUsersQuery()
  const bookings = bookingsQuery.data ?? []
  const users = usersQuery.data ?? []
  const revealRef = useReveal([bookingsQuery.isFetching, usersQuery.isFetching])

  const queue = useMemo(() => {
    const items: QueueItem[] = []

    for (const u of users) {
      if (u.role === "Technician" && !u.technicianVerified && u.technicianId) {
        items.push({
          id: `verify-${u.id}`,
          title: `Verify ${u.name}`,
          detail: `${u.email} · technician profile awaiting verification`,
          tag: "Verify",
          tone: "warm",
          href: "/dashboard/admin/users",
        })
      }
      if (u.status === "Suspended" || u.status === "Banned") {
        items.push({
          id: `status-${u.id}`,
          title: `${u.name} is ${u.status.toLowerCase()}`,
          detail: "Review account status on the users page",
          tag: u.status,
          tone: "hot",
          href: "/dashboard/admin/users",
        })
      }
    }

    for (const b of bookings) {
      if (b.status === "ACCEPTED") {
        items.push({
          id: `pay-${b.id}`,
          title: `${b.reference} awaiting payment`,
          detail: `${b.customer.name} · ${b.service} · ${b.date}`,
          tag: "Unpaid",
          tone: "warm",
          href: `/bookings/${b.id}`,
        })
      }
      if (b.status === "REQUESTED") {
        items.push({
          id: `req-${b.id}`,
          title: `${b.reference} waiting on technician`,
          detail: `${b.technician.name} · ${b.service}`,
          tag: "Pending",
          tone: "cool",
          href: `/bookings/${b.id}`,
        })
      }
      if (
        (b.status === "CANCELLED" || b.status === "DECLINED") &&
        b.paymentId
      ) {
        items.push({
          id: `refund-${b.id}`,
          title: `Possible refund · ${b.reference}`,
          detail: `Cancelled/declined booking still has payment ${b.paymentId.slice(0, 8)}…`,
          tag: "Refund?",
          tone: "hot",
          href: `/bookings/${b.id}`,
        })
      }
    }

    return items.slice(0, 40)
  }, [bookings, users])

  const hot = queue.filter((q) => q.tone === "hot").length
  const warm = queue.filter((q) => q.tone === "warm").length

  return (
    <AdminShell page="disputes">
      <div ref={revealRef as RefObject<HTMLDivElement>}>
        <header className="dash-head">
          <div>
            <p className="dash-eyebrow">Admin console</p>
            <h1 className="dash-title">Action queue</h1>
            <p className="dash-sub">
              Live items from unverified technicians, unpaid bookings, and
              refund candidates — no mock disputes API.
            </p>
          </div>
          <div className="dash-head__actions">
            <button
              type="button"
              className="dash-btn dash-btn--ghost"
              onClick={() => {
                void bookingsQuery.refetch()
                void usersQuery.refetch()
              }}
              disabled={bookingsQuery.isFetching || usersQuery.isFetching}
            >
              {bookingsQuery.isFetching || usersQuery.isFetching ? (
                <>
                  <LoaderCircleIcon size={16} className="animate-spin" />
                  Refreshing…
                </>
              ) : (
                "Refresh"
              )}
            </button>
            <Link href="/dashboard/admin" className="dash-btn dash-btn--ghost">
              Overview
            </Link>
          </div>
        </header>

        <div className="stat-row">
          <StatCard
            icon={<AlertTriangleIcon size={18} />}
            value={queue.length}
            label="Open items"
            delta="From live data"
            delay={0}
            animate={!bookingsQuery.isLoading}
          />
          <StatCard
            icon={<ShieldAlertIcon size={18} />}
            value={hot}
            label="Urgent"
            delta="Refunds / bans"
            variant="flare"
            delay={55}
            animate={!bookingsQuery.isLoading}
          />
          <StatCard
            icon={<WalletIcon size={18} />}
            value={warm}
            label="Needs follow-up"
            delta="Pay / verify"
            variant="sky"
            delay={110}
            animate={!bookingsQuery.isLoading}
          />
        </div>

        <section className="dash-card" style={{ marginTop: 14 }}>
          <h2 className="dash-card__title">Needs a decision</h2>
          {bookingsQuery.isLoading || usersQuery.isLoading ? (
            <div style={{ marginTop: 12 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skel skel-row" />
              ))}
            </div>
          ) : queue.length === 0 ? (
            <div className="dash-empty" style={{ marginTop: 12 }}>
              <h3>Queue clear</h3>
              <p>No unpaid bookings or unverified technicians right now.</p>
            </div>
          ) : (
            <div className="queue-list" style={{ marginTop: 12 }}>
              {queue.map((row) => (
                <Link
                  key={row.id}
                  href={row.href}
                  className="queue-row"
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div>
                    <p className="queue-row__title">{row.title}</p>
                    <p className="queue-row__detail">{row.detail}</p>
                  </div>
                  <span className={`urgency urgency--${row.tone}`}>{row.tag}</span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </AdminShell>
  )
}
