import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "@/lib/api"
import { normalizeTechnician } from "@/lib/catalogue/normalize"
import type { Review, Technician, TechnicianSlot } from "@/lib/catalogue/types"

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

function bool(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback
}

export function normalizeSlot(raw: unknown): TechnicianSlot {
  const obj = asRecord(raw) ?? {}
  const dateRaw = str(obj.date)
  const date = /^\d{4}-\d{2}-\d{2}/.test(dateRaw)
    ? dateRaw.slice(0, 10)
    : dateRaw
  return {
    id: str(obj.id),
    date,
    startTime: str(obj.startTime ?? obj.start),
    endTime: str(obj.endTime ?? obj.end),
    isBooked: bool(obj.isBooked ?? obj.booked),
  }
}

export function normalizeReview(raw: unknown): Review {
  const obj = asRecord(raw) ?? {}
  const customer = asRecord(obj.customer) ?? asRecord(obj.user)
  const author = str(
    customer?.name ?? obj.author ?? obj.name,
    "Customer"
  )
  const dateRaw = str(obj.createdAt ?? obj.date)
  let date = dateRaw
  if (dateRaw) {
    const d = new Date(dateRaw)
    if (!Number.isNaN(d.getTime())) {
      date = d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    }
  }
  return {
    id: str(obj.id) || undefined,
    author,
    initials: str(obj.initials) || author.slice(0, 2).toUpperCase(),
    rating: num(obj.rating ?? obj.stars, 5),
    date,
    body: str(obj.comment ?? obj.body ?? obj.review ?? obj.text),
  }
}

function unwrapTechnician(data: unknown): unknown {
  const obj = asRecord(data)
  if (!obj) return data
  return obj.technician ?? obj.profile ?? obj.item ?? data
}

export type TechnicianProfileUpdate = {
  trade?: string
  bio?: string
  visitFee?: number
  online?: boolean
  experienceYrs?: number
  areaId?: string
  verified?: boolean
}

export type SlotWriteInput = {
  date: string
  startTime: string
  endTime: string
}

/** Public: all technicians (also in catalogue). */
export async function fetchTechniciansList(
  query: Record<string, string | number | boolean | undefined | null> = {},
  token?: string | null
) {
  const res = await apiGet<unknown>("/technicians", query, token)
  const data = res.data
  const items = Array.isArray(data)
    ? data
    : asArray(asRecord(data)?.technicians ?? asRecord(data)?.items)
  return items.map(normalizeTechnician) as Technician[]
}

/** Public: top technicians. */
export async function fetchTopTechniciansList(token?: string | null) {
  const res = await apiGet<unknown>("/technicians/top", undefined, token)
  const data = res.data
  const items = Array.isArray(data)
    ? data
    : asArray(asRecord(data)?.technicians ?? asRecord(data)?.items)
  return items.map(normalizeTechnician) as Technician[]
}

/** Public: one technician profile. */
export async function fetchTechnicianById(id: string, token?: string | null) {
  const res = await apiGet<unknown>(`/technicians/${id}`, undefined, token)
  return normalizeTechnician(unwrapTechnician(res.data))
}

/** Public: slots for a technician. */
export async function fetchSlotsForTechnician(
  id: string,
  token?: string | null
) {
  const res = await apiGet<unknown>(`/technicians/${id}/slots`, undefined, token)
  const data = res.data
  const items = Array.isArray(data)
    ? data
    : asArray(asRecord(data)?.slots ?? asRecord(data)?.items)
  return items.map(normalizeSlot)
}

/** Public: reviews for a technician. */
export async function fetchTechnicianReviews(
  id: string,
  token?: string | null
) {
  const res = await apiGet<unknown>(
    `/technicians/${id}/reviews`,
    undefined,
    token
  )
  const data = res.data
  const items = Array.isArray(data)
    ? data
    : asArray(asRecord(data)?.reviews ?? asRecord(data)?.items)
  return items.map(normalizeReview)
}

/** Technician: update own profile (trade, fee, online, bio…). */
export async function updateMyTechnicianProfile(
  input: TechnicianProfileUpdate,
  token: string
) {
  const res = await apiPatch<unknown>("/technicians/me", input, token)
  return normalizeTechnician(unwrapTechnician(res.data))
}

/** Technician: set category IDs. */
export async function updateMyCategories(
  categoryIds: string[],
  token: string
) {
  const res = await apiPut<unknown>(
    "/technicians/me/categories",
    { categoryIds, categories: categoryIds },
    token
  )
  return normalizeTechnician(unwrapTechnician(res.data))
}

/** Technician: set skills list. */
export async function updateMySkills(skills: string[], token: string) {
  const res = await apiPut<unknown>(
    "/technicians/me/skills",
    { skills },
    token
  )
  return normalizeTechnician(unwrapTechnician(res.data))
}

/** Technician: create availability slot. */
export async function createMySlot(input: SlotWriteInput, token: string) {
  const res = await apiPost<unknown>("/technicians/me/slots", input, token)
  const obj = asRecord(res.data)
  return normalizeSlot(obj?.slot ?? obj?.item ?? res.data)
}

/** Technician: update a slot. */
export async function updateMySlot(
  slotId: string,
  input: Partial<SlotWriteInput> & { isBooked?: boolean },
  token: string
) {
  const res = await apiPatch<unknown>(
    `/technicians/me/slots/${slotId}`,
    input,
    token
  )
  const obj = asRecord(res.data)
  return normalizeSlot(obj?.slot ?? obj?.item ?? res.data)
}

/** Technician: delete a slot. */
export async function deleteMySlot(slotId: string, token: string) {
  await apiDelete<unknown>(`/technicians/me/slots/${slotId}`, token)
  return slotId
}

/** Admin: verify a technician. */
export async function verifyTechnician(id: string, token: string) {
  const res = await apiPatch<unknown>(
    `/technicians/${id}/verify`,
    { verified: true },
    token
  )
  return normalizeTechnician(unwrapTechnician(res.data))
}

/** Convert "09:00 AM" ↔ "09:00" helpers for UI grids. */
export function to24h(time12: string) {
  const m = time12.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!m) {
    // already 24h-ish
    const t = time12.trim()
    return t.length === 5 ? t : t.slice(0, 5)
  }
  let h = Number(m[1])
  const min = m[2]
  const ap = m[3].toUpperCase()
  if (ap === "AM") {
    if (h === 12) h = 0
  } else if (h !== 12) h += 12
  return `${String(h).padStart(2, "0")}:${min}`
}

export function addOneHour(time24: string) {
  const [h, m] = time24.split(":").map(Number)
  const next = (h + 1) % 24
  return `${String(next).padStart(2, "0")}:${String(m || 0).padStart(2, "0")}`
}

export function slotKey(date: string, startTime: string) {
  return `${date.slice(0, 10)}|${to24h(startTime)}`
}
