import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api"
import { normalizeService } from "@/lib/catalogue/normalize"
import type { Service } from "@/lib/catalogue/types"

type Loose = Record<string, unknown>

function asRecord(value: unknown): Loose | null {
  return value && typeof value === "object" ? (value as Loose) : null
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function unwrap(data: unknown): unknown {
  const obj = asRecord(data)
  if (!obj) return data
  return obj.service ?? obj.item ?? data
}

export type ServiceWriteInput = {
  title: string
  description?: string
  price: number
  duration?: string
  categoryId: string
  tag?: "MOST_BOOKED" | "TOP_RATED" | "EMERGENCY" | null
  isFeatured?: boolean
  isActive?: boolean
  sortOrder?: number
  /** Multer field `image` via uploadServiceImageMiddleware */
  image?: File | null
}

function appendServiceFields(
  form: FormData,
  input: Partial<ServiceWriteInput>
) {
  if (input.title !== undefined) form.append("title", input.title)
  if (input.description !== undefined) {
    form.append("description", input.description)
  }
  if (input.price !== undefined) form.append("price", String(input.price))
  if (input.duration !== undefined) form.append("duration", input.duration)
  if (input.categoryId !== undefined) {
    form.append("categoryId", input.categoryId)
  }
  if (input.tag !== undefined) {
    if (input.tag) form.append("tag", input.tag)
    // Omit empty tag — API enum rejects ""
  }
  if (input.isFeatured !== undefined) {
    form.append("isFeatured", String(input.isFeatured))
  }
  if (input.isActive !== undefined) {
    form.append("isActive", String(input.isActive))
  }
  if (input.sortOrder !== undefined) {
    form.append("sortOrder", String(input.sortOrder))
  }
  if (input.image instanceof File) {
    const filename =
      input.image.name?.trim() ||
      `service.${input.image.type.split("/")[1] || "jpg"}`
    form.append("image", input.image, filename)
  }
}

/** Admin: list services (API max limit is 100).
 * Note: public `GET /services` only returns active rows. Callers should merge
 * any locally known inactive services after fetch.
 */
export async function fetchAdminServices(token: string) {
  const all: Service[] = []
  let page = 1
  let totalPages = 1

  do {
    const res = await apiGet<unknown>(
      "/services",
      { limit: 100, page },
      token
    )
    const data = res.data
    const items = Array.isArray(data)
      ? data
      : asArray(asRecord(data)?.services ?? asRecord(data)?.items)
    all.push(...(items.map(normalizeService) as Service[]))

    totalPages = Math.max(1, res.meta?.totalPages ?? 1)
    page += 1
  } while (page <= totalPages && page <= 20)

  const seen = new Set<string>()
  return all.filter((s) => {
    if (!s.id || seen.has(s.id)) return false
    seen.add(s.id)
    return true
  })
}

/** Keep inactive services that the public list endpoint omits. */
export function mergeAdminServicesWithInactive(
  fresh: Service[],
  previous?: Service[] | null
) {
  const byId = new Map(fresh.map((s) => [s.id, s] as const))
  for (const s of previous ?? []) {
    if (!s.id) continue
    if (s.isActive === false && !byId.has(s.id)) {
      byId.set(s.id, s)
    }
  }
  return Array.from(byId.values())
}

/** Admin: create a service (JSON or multipart when image is set). */
export async function createService(input: ServiceWriteInput, token: string) {
  if (input.image instanceof File) {
    const form = new FormData()
    appendServiceFields(form, input)
    const res = await apiPost<unknown>("/services", form, token)
    return normalizeService(unwrap(res.data))
  }

  const { image: _image, ...json } = input
  const res = await apiPost<unknown>("/services", json, token)
  return normalizeService(unwrap(res.data))
}

/** Admin: update a service (JSON or multipart when image is set). */
export async function updateService(
  id: string,
  input: Partial<ServiceWriteInput>,
  token: string
) {
  if (input.image instanceof File) {
    const form = new FormData()
    appendServiceFields(form, input)
    const res = await apiPatch<unknown>(`/services/${id}`, form, token)
    return normalizeService(unwrap(res.data))
  }

  const { image: _image, ...json } = input
  const res = await apiPatch<unknown>(`/services/${id}`, json, token)
  return normalizeService(unwrap(res.data))
}

/** Admin: delete a service. */
export async function deleteService(id: string, token: string) {
  await apiDelete<unknown>(`/services/${id}`, token)
  return id
}
