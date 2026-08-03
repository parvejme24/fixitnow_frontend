import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api"
import { normalizeReview } from "@/lib/technicians/api"
import type { Review } from "@/lib/catalogue/types"

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

export type CreateReviewInput = {
  target: "SERVICE" | "TECHNICIAN"
  serviceId?: string
  technicianId?: string
  bookingId?: string
  rating: number
  body: string
  /** Some backends use `comment` instead of `body` */
  comment?: string
}

export type UpdateReviewInput = {
  rating?: number
  body?: string
  comment?: string
}

export type ReviewRecord = Review & {
  id?: string
}

function listReviews(data: unknown): ReviewRecord[] {
  const items = Array.isArray(data)
    ? data
    : asArray(asRecord(data)?.reviews ?? asRecord(data)?.items)
  return items.map((raw) => {
    const base = normalizeReview(raw)
    const obj = asRecord(raw) ?? {}
    return { ...base, id: str(obj.id) || undefined }
  })
}

function unwrapReview(data: unknown): ReviewRecord {
  const obj = asRecord(data)
  const raw = obj?.review ?? obj?.item ?? data
  const base = normalizeReview(raw)
  return { ...base, id: str(asRecord(raw)?.id) || undefined }
}

/** Public: reviews for a service. */
export async function fetchServiceReviews(serviceId: string) {
  const res = await apiGet<unknown>(`/services/${serviceId}/reviews`)
  return listReviews(res.data)
}

/** Customer: create a review. */
export async function createReview(input: CreateReviewInput, token: string) {
  const payload = {
    ...input,
    comment: input.comment ?? input.body,
    body: input.body,
  }
  const res = await apiPost<unknown>("/reviews", payload, token)
  return unwrapReview(res.data)
}

/** Owner: update own review when the API supports PATCH /reviews/:id. */
export async function updateReview(
  id: string,
  input: UpdateReviewInput,
  token: string
) {
  const payload = {
    ...input,
    comment: input.comment ?? input.body,
    body: input.body,
  }
  const res = await apiPatch<unknown>(`/reviews/${id}`, payload, token)
  return unwrapReview(res.data)
}

/** Owner or technician: delete a review. */
export async function deleteReview(id: string, token: string) {
  await apiDelete<unknown>(`/reviews/${id}`, token)
  return id
}
