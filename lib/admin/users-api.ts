import { apiGet, apiPatch } from "@/lib/api"
import { normalizeUser } from "@/lib/auth/auth-api"
import type { AuthRole, AuthUser } from "@/lib/auth/types"
import { absoluteMediaUrl, initialsFromName } from "@/lib/auth/types"
import type { AccountStatus, AdminUser } from "@/app/lib/admin-data"

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function formatJoined(iso?: string) {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function roleLabel(role: AuthRole): AdminUser["role"] {
  if (role === "TECHNICIAN") return "Technician"
  if (role === "ADMIN") return "Admin"
  return "Customer"
}

function statusFromUser(user: AuthUser): AccountStatus {
  if (user.isActive === false) return "Banned"
  return "Active"
}

function statusFromRaw(raw: unknown, user: AuthUser): AccountStatus {
  const obj = asRecord(raw)
  const status = String(obj?.status ?? obj?.accountStatus ?? "").toUpperCase()
  if (status === "SUSPENDED") return "Suspended"
  if (status === "BANNED" || status === "INACTIVE") return "Banned"
  if (status === "ACTIVE") return "Active"
  if (obj?.isActive === false) return "Banned"
  return statusFromUser(user)
}

export function toAdminUser(user: AuthUser, raw?: unknown): AdminUser {
  return {
    id: user.id,
    name: user.name || "User",
    email: user.email,
    initials: user.initials || initialsFromName(user.name || user.email),
    image: absoluteMediaUrl(user.image),
    role: roleLabel(user.role),
    joined: formatJoined(user.createdAt),
    bookings: 0,
    status: statusFromRaw(raw, user),
    technicianId: user.technicianProfile?.id ?? null,
    technicianVerified: user.technicianProfile?.verified ?? false,
  }
}

export function adminRoleToApi(role: AdminUser["role"]): AuthRole {
  if (role === "Technician") return "TECHNICIAN"
  if (role === "Admin") return "ADMIN"
  return "CUSTOMER"
}

function listUsersFromResponse(data: unknown): AdminUser[] {
  if (Array.isArray(data)) {
    return data.map((row) => toAdminUser(normalizeUser(row), row))
  }
  const obj = asRecord(data)
  if (!obj) return []
  return asArray(obj.users ?? obj.items ?? obj.results ?? obj.data).map(
    (row) => toAdminUser(normalizeUser(row), row)
  )
}

/** Admin: list every account (`/admin/users`, fallback `/auth/users`). */
export async function fetchUsers(token: string) {
  try {
    const res = await apiGet<unknown>("/admin/users", undefined, token)
    return listUsersFromResponse(res.data)
  } catch {
    const res = await apiGet<unknown>("/auth/users", undefined, token)
    return listUsersFromResponse(res.data)
  }
}

/** Admin: change a user's role. */
export async function updateUserRole(
  id: string,
  role: AuthRole,
  token: string
) {
  const res = await apiPatch<unknown>(
    `/auth/users/${id}/role`,
    { role },
    token
  )
  const obj = asRecord(res.data)
  const raw = obj?.user ?? res.data
  return toAdminUser(normalizeUser(raw), raw)
}

/** Admin: suspend / restore / ban via PATCH /admin/users/:id */
export async function updateUserStatus(
  id: string,
  status: AccountStatus,
  token: string
) {
  const body = {
    status: status.toUpperCase(),
    isActive: status === "Active",
  }
  const res = await apiPatch<unknown>(`/admin/users/${id}`, body, token)
  const obj = asRecord(res.data)
  const raw = obj?.user ?? res.data
  return toAdminUser(normalizeUser(raw), raw)
}
