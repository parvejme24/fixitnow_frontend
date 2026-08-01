import { apiGet, apiPatch, apiPost } from "@/lib/api"
import type {
  Booking,
  BookingParty,
  BookingStatus,
  CreateBookingInput,
  UpdateBookingStatusInput,
} from "@/lib/bookings/types"
import { initialsFromName } from "@/lib/auth/types"

type Loose = Record<string, unknown>

function asRecord(value: unknown): Loose | null {
  return value && typeof value === "object" ? (value as Loose) : null
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function str(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback
}

function num(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

function party(
  raw: unknown,
  fallbackName: string
): BookingParty {
  const obj = asRecord(raw)
  const name = str(obj?.name ?? obj?.fullName, fallbackName)
  return {
    id: str(obj?.id) || undefined,
    name,
    initials: str(obj?.initials) || initialsFromName(name),
  }
}

const STATUS_SET = new Set<string>([
  "REQUESTED",
  "ACCEPTED",
  "DECLINED",
  "CANCELLED",
  "PAID",
  "EN_ROUTE",
  "ON_SITE",
  "IN_PROGRESS",
  "COMPLETED",
])

function normalizeStatus(raw: unknown): BookingStatus {
  const s = String(raw ?? "REQUESTED").toUpperCase().replace(/\s+/g, "_")
  if (STATUS_SET.has(s)) return s as BookingStatus
  if (s === "PENDING") return "REQUESTED"
  if (s === "CONFIRMED") return "ACCEPTED"
  return "REQUESTED"
}

function formatDate(raw: unknown) {
  const s = str(raw)
  if (!s) return "—"
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) {
    // already human or YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
      const local = new Date(`${s.slice(0, 10)}T12:00:00`)
      return local.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    }
    return s
  }
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function formatTime(raw: unknown) {
  const s = str(raw)
  if (!s) return "—"
  if (/AM|PM/i.test(s)) return s
  const m = s.match(/^(\d{1,2}):(\d{2})/)
  if (!m) return s
  let h = Number(m[1])
  const min = m[2]
  const ap = h >= 12 ? "PM" : "AM"
  if (h === 0) h = 12
  else if (h > 12) h -= 12
  return `${String(h).padStart(2, "0")}:${min} ${ap}`
}

export function normalizeBooking(raw: unknown): Booking {
  const obj = asRecord(raw) ?? {}
  const service = asRecord(obj.service)
  const slot = asRecord(obj.slot) ?? asRecord(obj.availability)
  const tech =
    asRecord(obj.technician) ??
    asRecord(asRecord(obj.technicianProfile)?.user) ??
    asRecord(obj.technicianProfile)
  const customer = asRecord(obj.customer) ?? asRecord(obj.user)
  const area =
    asRecord(obj.area) ??
    asRecord(tech?.area) ??
    asRecord(asRecord(obj.technician)?.area)

  const techUser = asRecord(tech?.user) ?? tech
  const amount = num(
    obj.totalAmount ?? obj.amount ?? obj.price ?? service?.price ?? obj.visitFee
  )

  const dateRaw =
    obj.date ??
    slot?.date ??
    obj.scheduledAt ??
    obj.slotDate ??
    obj.createdAt
  const timeRaw =
    obj.time ??
    slot?.startTime ??
    obj.startTime ??
    obj.slotTime

  const reference = str(
    obj.refCode ?? obj.reference ?? obj.code ?? obj.bookingRef,
    str(obj.id).slice(0, 8).toUpperCase() || "FIX"
  )

  return {
    id: str(obj.id),
    reference: reference.startsWith("FIX") ? reference : `FIX-${reference}`,
    status: normalizeStatus(obj.status),
    service: str(service?.title ?? obj.serviceTitle ?? obj.serviceName, "Service"),
    serviceId: str(obj.serviceId ?? service?.id) || null,
    area: str(area?.name ?? obj.areaName ?? obj.area, "Dhaka"),
    technician: party(techUser ?? tech, "Technician"),
    technicianId: str(obj.technicianId ?? tech?.id) || null,
    customer: party(customer, "Customer"),
    customerId: str(obj.customerId ?? customer?.id) || null,
    date: formatDate(dateRaw),
    time: formatTime(timeRaw),
    amount,
    notes: str(obj.notes) || null,
    slotId: str(obj.slotId ?? slot?.id) || null,
    paymentId: str(obj.paymentId ?? asRecord(obj.payment)?.id) || null,
    reviewed: Boolean(obj.reviewed ?? obj.hasReview),
    trade: str(obj.trade ?? service?.catName ?? asRecord(service?.category)?.name) || undefined,
    createdAt: str(obj.createdAt) || undefined,
  }
}

function listBookings(data: unknown): Booking[] {
  if (Array.isArray(data)) return data.map(normalizeBooking)
  const obj = asRecord(data)
  if (!obj) return []
  return asArray(obj.bookings ?? obj.items ?? obj.results ?? obj.data).map(
    normalizeBooking
  )
}

function unwrapBooking(data: unknown): unknown {
  const obj = asRecord(data)
  if (!obj) return data
  return obj.booking ?? obj.item ?? data
}

/** Customer: create a booking request. */
export async function createBooking(input: CreateBookingInput, token: string) {
  const res = await apiPost<unknown>("/bookings", input, token)
  return normalizeBooking(unwrapBooking(res.data))
}

/** Customer or technician: list my bookings. */
export async function fetchMyBookings(token: string) {
  const res = await apiGet<unknown>("/bookings", undefined, token)
  return listBookings(res.data)
}

/** Admin: list all bookings. */
export async function fetchAdminBookings(token: string) {
  const res = await apiGet<unknown>("/admin/bookings", undefined, token)
  return listBookings(res.data)
}

/** Owner: booking detail by id or FIX-xxxx. */
export async function fetchBooking(id: string, token: string) {
  const res = await apiGet<unknown>(`/bookings/${id}`, undefined, token)
  return normalizeBooking(unwrapBooking(res.data))
}

/** Technician: accept a request. */
export async function acceptBooking(id: string, token: string) {
  const res = await apiPost<unknown>(`/bookings/${id}/accept`, {}, token)
  return normalizeBooking(unwrapBooking(res.data))
}

/** Technician: decline a request. */
export async function declineBooking(id: string, token: string) {
  const res = await apiPost<unknown>(`/bookings/${id}/decline`, {}, token)
  return normalizeBooking(unwrapBooking(res.data))
}

/** Customer: cancel a booking. */
export async function cancelBooking(id: string, token: string) {
  const res = await apiPost<unknown>(`/bookings/${id}/cancel`, {}, token)
  return normalizeBooking(unwrapBooking(res.data))
}

/** Technician or admin: advance job status. */
export async function updateBookingStatus(
  id: string,
  input: UpdateBookingStatusInput,
  token: string
) {
  const res = await apiPatch<unknown>(`/bookings/${id}/status`, input, token)
  return normalizeBooking(unwrapBooking(res.data))
}

/** Map API booking → dashboard row shape used by existing UI. */
export function toDashBooking(b: Booking) {
  return {
    id: b.id,
    reference: b.reference,
    service: b.service,
    area: b.area,
    technician: {
      name: b.technician.name,
      initials: b.technician.initials,
    },
    customer: {
      name: b.customer.name,
      initials: b.customer.initials,
    },
    date: b.date,
    time: b.time,
    amount: b.amount,
    status: mapDashStatus(b.status),
    reviewed: b.reviewed,
    trade: b.trade,
  }
}

function mapDashStatus(
  status: BookingStatus
): import("@/app/lib/dashboard-data").BookingStatus {
  if (status === "EN_ROUTE" || status === "ON_SITE") return "IN_PROGRESS"
  if (
    status === "REQUESTED" ||
    status === "ACCEPTED" ||
    status === "DECLINED" ||
    status === "CANCELLED" ||
    status === "PAID" ||
    status === "IN_PROGRESS" ||
    status === "COMPLETED"
  ) {
    return status
  }
  return "REQUESTED"
}
