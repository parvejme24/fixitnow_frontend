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

export function toAdminUser(user: AuthUser): AdminUser {
  return {
    id: user.id,
    name: user.name || "User",
    email: user.email,
    initials: user.initials || initialsFromName(user.name || user.email),
    image: absoluteMediaUrl(user.image),
    role: roleLabel(user.role),
    joined: formatJoined(user.createdAt),
    bookings: 0,
    status: statusFromUser(user),
  }
}

export function adminRoleToApi(role: AdminUser["role"]): AuthRole {
  if (role === "Technician") return "TECHNICIAN"
  if (role === "Admin") return "ADMIN"
  return "CUSTOMER"
}

function listUsersFromResponse(data: unknown): AuthUser[] {
  if (Array.isArray(data)) return data.map(normalizeUser)
  const obj = asRecord(data)
  if (!obj) return []
  return asArray(obj.users ?? obj.items ?? obj.results ?? obj.data).map(
    normalizeUser
  )
}

/** Admin: list every account. */
export async function fetchUsers(token: string) {
  const res = await apiGet<unknown>("/auth/users", undefined, token)
  return listUsersFromResponse(res.data).map(toAdminUser)
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
  return toAdminUser(normalizeUser(raw))
}
