import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api"
import { normalizeArea } from "@/lib/catalogue/normalize"
import type { Area } from "@/lib/catalogue/types"

export type AreaWriteInput = {
  name: string
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function listFromResponse(data: unknown): Area[] {
  if (Array.isArray(data)) return data.map(normalizeArea)
  const obj = asRecord(data)
  if (!obj) return []
  return asArray(obj.areas ?? obj.items ?? obj.results).map(normalizeArea)
}

function unwrapArea(data: unknown): unknown {
  if (!data || typeof data !== "object" || Array.isArray(data)) return data
  const obj = data as Record<string, unknown>
  return obj.area ?? obj.item ?? data
}

/** Public: all service areas. */
export async function fetchAreasList() {
  const res = await apiGet<unknown>("/areas")
  return listFromResponse(res.data)
}

/** Public: one area by id. */
export async function fetchAreaById(id: string) {
  const res = await apiGet<unknown>(`/areas/${id}`)
  return normalizeArea(unwrapArea(res.data))
}

/** Admin: create area. */
export async function createArea(input: AreaWriteInput, token: string) {
  const res = await apiPost<unknown>(
    "/areas",
    { name: input.name.trim() },
    token
  )
  return normalizeArea(
    unwrapArea(res.data) ?? {
      id: `tmp-${Date.now()}`,
      name: input.name.trim(),
      technicianCount: 0,
    }
  )
}

/** Admin: rename / update area. */
export async function updateArea(
  id: string,
  input: Partial<AreaWriteInput>,
  token: string
) {
  const body: Record<string, unknown> = {}
  if (input.name !== undefined) body.name = input.name.trim()

  const res = await apiPatch<unknown>(`/areas/${id}`, body, token)
  const normalized = normalizeArea(unwrapArea(res.data) ?? { id, ...input })
  return {
    ...normalized,
    id: normalized.id || id,
    name: normalized.name || input.name || "",
  }
}

/** Admin: delete area. */
export async function deleteArea(id: string, token: string) {
  await apiDelete<unknown>(`/areas/${id}`, token)
}
