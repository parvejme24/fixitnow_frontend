import { apiGet } from "@/lib/api"

type Loose = Record<string, unknown>

function asRecord(value: unknown): Loose | null {
  return value && typeof value === "object" ? (value as Loose) : null
}

function num(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function str(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback
}

export type AdminStats = {
  users: number
  technicians: number
  customers: number
  activeBookings: number
  awaitingPayment: number
  completedJobs: number
  revenue: number
  disputes: number
  statusCounts: { status: string; count: number }[]
  topCategories: { name: string; jobs: number }[]
  monthlyRevenue: { label: string; value: number }[]
}

export function normalizeAdminStats(raw: unknown): AdminStats {
  const obj = asRecord(raw) ?? {}
  const nested = asRecord(obj.stats) ?? obj

  const statusRaw = asArray(
    nested.statusCounts ?? nested.bookingsByStatus ?? nested.statuses
  )
  const statusCounts = statusRaw.map((row) => {
    const r = asRecord(row) ?? {}
    return {
      status: str(r.status ?? r.label ?? r.name, "Unknown"),
      count: num(r.count ?? r.total ?? r.value),
    }
  })

  const catsRaw = asArray(
    nested.topCategories ?? nested.busiestCategories ?? nested.categories
  )
  const topCategories = catsRaw.map((row) => {
    const r = asRecord(row) ?? {}
    const cat = asRecord(r.category)
    return {
      name: str(r.name ?? cat?.name ?? r.label, "Category"),
      jobs: num(r.jobs ?? r.count ?? r.total),
    }
  })

  const monthsRaw = asArray(
    nested.monthlyRevenue ?? nested.revenueByMonth ?? nested.grossMonths
  )
  const monthlyRevenue = monthsRaw.map((row) => {
    const r = asRecord(row) ?? {}
    return {
      label: str(r.label ?? r.month ?? r.name, "—"),
      value: num(r.value ?? r.amount ?? r.revenue),
    }
  })

  return {
    users: num(nested.users ?? nested.totalUsers ?? nested.userCount),
    technicians: num(nested.technicians ?? nested.technicianCount),
    customers: num(nested.customers ?? nested.customerCount),
    activeBookings: num(
      nested.activeBookings ?? nested.bookingsActive ?? nested.openBookings
    ),
    awaitingPayment: num(
      nested.awaitingPayment ?? nested.pendingPayments ?? nested.unpaid
    ),
    completedJobs: num(nested.completedJobs ?? nested.completed ?? nested.jobs),
    revenue: num(nested.revenue ?? nested.grossRevenue ?? nested.totalRevenue),
    disputes: num(nested.disputes ?? nested.openDisputes),
    statusCounts,
    topCategories,
    monthlyRevenue,
  }
}

/** Admin: platform overview stats. */
export async function fetchAdminStats(token: string) {
  const res = await apiGet<unknown>("/admin/stats", undefined, token)
  return normalizeAdminStats(res.data)
}
