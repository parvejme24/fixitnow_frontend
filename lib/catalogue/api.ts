import { apiGet, type ApiSuccess } from "@/lib/api"
import {
  normalizeArea,
  normalizeCategory,
  normalizeService,
  normalizeTechnician,
} from "@/lib/catalogue/normalize"
import type {
  Area,
  Category,
  ListMeta,
  Service,
  ServicesQuery,
  Technician,
  TechnicianSlot,
  TechniciansQuery,
} from "@/lib/catalogue/types"

function listPayload<T>(
  res: ApiSuccess<unknown>,
  mapItem: (raw: unknown) => T
): { items: T[]; meta?: ListMeta } {
  const data = res.data
  const items = Array.isArray(data) ? data.map(mapItem) : []
  const meta = res.meta
    ? {
        page: res.meta.page ?? 1,
        limit: res.meta.limit ?? items.length,
        total: res.meta.total ?? items.length,
        totalPages: res.meta.totalPages ?? 1,
      }
    : undefined
  return { items, meta }
}

export async function fetchCategories() {
  const res = await apiGet<unknown>("/categories")
  return listPayload(res, normalizeCategory).items.filter(
    (cat) => cat.isVisible !== false
  ) as Category[]
}

export async function fetchCategory(id: string) {
  const res = await apiGet<unknown>(`/categories/${id}`)
  return normalizeCategory(res.data)
}

export async function fetchAreas() {
  const res = await apiGet<unknown>("/areas")
  return listPayload(res, normalizeArea).items as Area[]
}

export async function fetchArea(id: string) {
  const res = await apiGet<unknown>(`/areas/${id}`)
  const data = res.data
  const obj =
    data && typeof data === "object" && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : null
  return normalizeArea(obj?.area ?? obj?.item ?? data)
}

export async function fetchServices(query: ServicesQuery = {}) {
  const res = await apiGet<unknown>("/services", {
    page: query.page ?? 1,
    limit: query.limit ?? 50,
    categoryId: query.categoryId,
    q: query.q,
    featured: query.featured,
  })
  return listPayload(res, normalizeService) as {
    items: Service[]
    meta?: ListMeta
  }
}

export async function fetchFeaturedServices() {
  const res = await apiGet<unknown>("/services/featured")
  return listPayload(res, normalizeService).items as Service[]
}

export async function fetchService(id: string) {
  const res = await apiGet<unknown>(`/services/${id}`)
  return normalizeService(res.data)
}

export async function fetchTechnicians(query: TechniciansQuery = {}) {
  const res = await apiGet<unknown>("/technicians", {
    page: query.page ?? 1,
    limit: query.limit ?? 50,
    categoryId: query.categoryId,
    areaId: query.areaId,
    q: query.q,
    online: query.online,
  })
  return listPayload(res, normalizeTechnician) as {
    items: Technician[]
    meta?: ListMeta
  }
}

export async function fetchTopTechnicians() {
  const res = await apiGet<unknown>("/technicians/top")
  return listPayload(res, normalizeTechnician).items as Technician[]
}

export async function fetchTechnician(id: string) {
  const res = await apiGet<unknown>(`/technicians/${id}`)
  return normalizeTechnician(res.data)
}

export async function fetchTechnicianSlots(id: string) {
  const res = await apiGet<unknown>(`/technicians/${id}/slots`)
  const data = res.data
  const items = Array.isArray(data)
    ? data
    : data && typeof data === "object" && Array.isArray((data as { slots?: unknown }).slots)
      ? ((data as { slots: unknown[] }).slots)
      : []

  return items.map((raw): TechnicianSlot => {
    const obj =
      raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}
    const dateRaw = String(obj.date ?? "")
    // API sends ISO midnight UTC, e.g. "2026-07-31T00:00:00.000Z"
    const date = /^\d{4}-\d{2}-\d{2}/.test(dateRaw)
      ? dateRaw.slice(0, 10)
      : dateRaw
    return {
      id: String(obj.id ?? ""),
      date,
      startTime: String(obj.startTime ?? obj.start ?? ""),
      endTime: String(obj.endTime ?? obj.end ?? ""),
      isBooked: Boolean(obj.isBooked ?? obj.booked),
    }
  })
}
