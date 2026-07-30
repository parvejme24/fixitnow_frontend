import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api"

export type ApiCategory = {
  id: string
  name: string
  slug: string
  icon: string
  isVisible: boolean
  sortOrder: number
  jobsDone: number
  serviceCount: number
  technicianCount: number
  createdAt?: string
  updatedAt?: string
}

export type CategoryStats = {
  categories: number
  liveInSearch: number
  servicesListed: number
  jobsAllTime: number
}

export type CategoryWriteInput = {
  name: string
  slug: string
  icon?: string
  isVisible?: boolean
  sortOrder?: number
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null
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

export function normalizeApiCategory(raw: unknown): ApiCategory {
  const obj = asRecord(raw) ?? {}
  return {
    id: str(obj.id),
    name: str(obj.name, "Category"),
    slug: str(obj.slug),
    icon: str(obj.icon, "🔧"),
    isVisible: bool(obj.isVisible ?? obj.active ?? obj.isActive, true),
    sortOrder: num(obj.sortOrder),
    jobsDone: num(obj.jobsDone),
    serviceCount: num(obj.serviceCount),
    technicianCount: num(obj.technicianCount),
    createdAt: str(obj.createdAt) || undefined,
    updatedAt: str(obj.updatedAt) || undefined,
  }
}

function listFromResponse(data: unknown): ApiCategory[] {
  if (Array.isArray(data)) return data.map(normalizeApiCategory)
  const obj = asRecord(data)
  if (!obj) return []
  return asArray(obj.categories ?? obj.items ?? obj.results).map(
    normalizeApiCategory
  )
}

function unwrapCategory(data: unknown): unknown {
  if (!data || typeof data !== "object" || Array.isArray(data)) return data
  const obj = data as Record<string, unknown>
  return obj.category ?? obj.item ?? data
}

/** Public: visible categories only (customer browse/search). */
export async function fetchPublicCategories() {
  const res = await apiGet<unknown>("/categories")
  return listFromResponse(res.data)
}

/** Admin: all categories including hidden. */
export async function fetchManageCategories(token: string) {
  const res = await apiGet<unknown>("/categories/manage", undefined, token)
  return listFromResponse(res.data)
}

/** Admin dashboard stats. */
export async function fetchCategoryStats(token: string): Promise<CategoryStats> {
  const res = await apiGet<unknown>("/categories/stats", undefined, token)
  const obj = asRecord(res.data) ?? {}
  return {
    categories: num(obj.categories ?? obj.total ?? obj.count),
    liveInSearch: num(obj.liveInSearch ?? obj.visible ?? obj.live),
    servicesListed: num(obj.servicesListed ?? obj.services ?? obj.serviceCount),
    jobsAllTime: num(obj.jobsAllTime ?? obj.jobsDone ?? obj.jobs),
  }
}

export async function fetchCategoryById(id: string, token?: string | null) {
  const res = await apiGet<unknown>(`/categories/${id}`, undefined, token)
  return normalizeApiCategory(unwrapCategory(res.data))
}

export async function createCategory(input: CategoryWriteInput, token: string) {
  const res = await apiPost<unknown>(
    "/categories",
    {
      name: input.name,
      slug: input.slug,
      icon: input.icon,
      isVisible: input.isVisible ?? true,
      sortOrder: input.sortOrder,
    },
    token
  )
  return normalizeApiCategory(
    unwrapCategory(res.data) ?? {
      ...input,
      id: `tmp-${Date.now()}`,
      isVisible: input.isVisible ?? true,
      icon: input.icon ?? "🔧",
      sortOrder: input.sortOrder ?? 0,
      jobsDone: 0,
      serviceCount: 0,
      technicianCount: 0,
      createdAt: new Date().toISOString(),
    }
  )
}

export async function updateCategory(
  id: string,
  input: Partial<CategoryWriteInput>,
  token: string
) {
  const body: Record<string, unknown> = {}
  if (input.name !== undefined) body.name = input.name
  if (input.slug !== undefined) body.slug = input.slug
  if (input.icon !== undefined) body.icon = input.icon
  if (input.isVisible !== undefined) body.isVisible = input.isVisible
  if (input.sortOrder !== undefined) body.sortOrder = input.sortOrder

  const res = await apiPatch<unknown>(`/categories/${id}`, body, token)
  const normalized = normalizeApiCategory(
    unwrapCategory(res.data) ?? { id, ...input }
  )
  return {
    ...normalized,
    id: normalized.id || id,
    name: normalized.name || input.name || "",
    slug: normalized.slug || input.slug || "",
    icon: normalized.icon || input.icon || "🔧",
    isVisible:
      typeof input.isVisible === "boolean"
        ? input.isVisible
        : normalized.isVisible,
  }
}

/** Dedicated hide/unhide endpoint. */
export async function toggleCategoryVisibility(
  id: string,
  isVisible: boolean,
  token: string
) {
  const res = await apiPatch<unknown>(
    `/categories/${id}/visibility`,
    { isVisible },
    token
  )
  const normalized = normalizeApiCategory(
    unwrapCategory(res.data) ?? { id, isVisible }
  )
  return {
    ...normalized,
    id: normalized.id || id,
    isVisible:
      typeof normalized.isVisible === "boolean" ? normalized.isVisible : isVisible,
  }
}

export async function deleteCategory(id: string, token: string) {
  await apiDelete<unknown>(`/categories/${id}`, token)
}
