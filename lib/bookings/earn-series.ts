import type { Booking } from "@/lib/bookings/types"

export type EarnPoint = { key: string; label: string; value: number }

/** Bookings that count toward gross platform / technician earnings. */
export const REVENUE_STATUSES = [
  "PAID",
  "COMPLETED",
  "IN_PROGRESS",
  "EN_ROUTE",
  "ON_SITE",
] as const

export function isRevenueBooking(status: string) {
  return (REVENUE_STATUSES as readonly string[]).includes(status)
}

function localDayKey(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function startOfLocalDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function parseEarnDate(b: { createdAt?: string; date: string }) {
  for (const src of [b.createdAt, b.date]) {
    if (!src) continue
    const direct = new Date(src)
    if (!Number.isNaN(direct.getTime())) return startOfLocalDay(direct)
    const match = src
      .trim()
      .match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/)
    if (match) {
      const parsed = new Date(`${match[2]} ${match[1]}, ${match[3]}`)
      if (!Number.isNaN(parsed.getTime())) return startOfLocalDay(parsed)
    }
  }
  return null
}

export function buildDailyEarnPoints(
  paid: Booking[],
  days: number
): EarnPoint[] {
  const today = startOfLocalDay(new Date())
  const points: EarnPoint[] = []
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    points.push({
      key: localDayKey(d),
      label:
        days <= 7
          ? d.toLocaleDateString("en-US", { weekday: "short" })
          : String(d.getDate()),
      value: 0,
    })
  }
  const byKey = new Map(points.map((p) => [p.key, p]))
  for (const b of paid) {
    const d = parseEarnDate(b)
    if (!d) continue
    const row = byKey.get(localDayKey(d))
    if (row) row.value += b.amount
  }
  return points
}

export function buildMonthlyEarnPoints(
  paid: Booking[],
  months = 6
): EarnPoint[] {
  const today = startOfLocalDay(new Date())
  const points: EarnPoint[] = []
  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    points.push({
      key,
      label: d.toLocaleString("en-US", { month: "short" }),
      value: 0,
    })
  }
  const byKey = new Map(points.map((p) => [p.key, p]))
  for (const b of paid) {
    const d = parseEarnDate(b)
    if (!d) continue
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    const row = byKey.get(key)
    if (row) row.value += b.amount
  }
  return points
}
