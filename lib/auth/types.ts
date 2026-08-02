export type AuthRole = "CUSTOMER" | "TECHNICIAN" | "ADMIN"

export type AuthUser = {
  id: string
  name: string
  email: string
  phone?: string | null
  role: AuthRole
  initials?: string | null
  /** Profile image URL from API (avatar / image / profileImage) */
  image?: string | null
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
  technicianProfile?: {
    id: string
    trade?: string | null
    visitFee?: number | null
    online?: boolean
    verified?: boolean
  } | null
}

export type AuthPayload = {
  user: AuthUser
  token: string
}

export type RegisterInput = {
  name: string
  email: string
  phone: string
  password: string
  /** Public signup is customer or technician only; admins are seeded/promoted. */
  role: Exclude<AuthRole, "ADMIN">
  trade?: string
  experienceYrs?: number
  area?: string
}

export type LoginInput = {
  email: string
  password: string
}

export type UpdateMeInput = {
  name?: string
  phone?: string
  initials?: string
  /** Optional profile photo — sent as multipart field `profileImage` */
  image?: File | null
}

export type ChangePasswordInput = {
  currentPassword: string
  newPassword: string
}

export type ResetPasswordInput = {
  token: string
  password: string
}

export type UiRole = "customer" | "technician" | "admin"

/** API host without `/api/v1` — for uploaded media paths. */
const API_ORIGIN = (
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "https://fixitnow-backend-weld.vercel.app/api/v1"
).replace(/\/api\/v1\/?$/, "")

export function toApiRole(role: UiRole): AuthRole {
  return role.toUpperCase() as AuthRole
}

export function toUiRole(role: AuthRole): UiRole {
  return role.toLowerCase() as UiRole
}

export function dashboardForRole(role: AuthRole | UiRole) {
  const r = role.toUpperCase()
  if (r === "TECHNICIAN") return "/dashboard/technician"
  if (r === "ADMIN") return "/dashboard/admin"
  return "/bookings"
}

/** Only allow post-login redirects the user's role may open. */
export function safeReturnPath(
  role: AuthRole | UiRole,
  next: string | null | undefined
) {
  const fallback = dashboardForRole(role)
  if (!next || !next.startsWith("/") || next.startsWith("//")) return fallback

  const path = next.split("?")[0].split("#")[0]
  const r = role.toUpperCase()

  if (path === "/dashboard/admin" || path.startsWith("/dashboard/admin/")) {
    return r === "ADMIN" ? next : fallback
  }
  if (
    path === "/dashboard/technician" ||
    path.startsWith("/dashboard/technician/")
  ) {
    return r === "TECHNICIAN" ? next : fallback
  }
  if (path === "/bookings" || path.startsWith("/bookings/")) {
    return r === "CUSTOMER" ? next : fallback
  }
  if (path === "/dashboard/profile" || path.startsWith("/dashboard/profile/")) {
    return next
  }

  return next
}

export function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return "FN"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

export function absoluteMediaUrl(path?: string | null) {
  if (!path) return null
  const trimmed = path.trim()
  if (!trimmed) return null
  if (
    /^https?:\/\//i.test(trimmed) ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("data:")
  ) {
    return trimmed
  }
  const clean = trimmed.startsWith("/") ? trimmed : `/${trimmed}`
  return `${API_ORIGIN}${clean}`
}

/** Stable portrait when API has no profile photo. */
export function avatarFallbackUrl(name: string, initials?: string | null) {
  const label = (initials || name || "FN").trim() || "FN"
  const params = new URLSearchParams({
    name: label,
    background: "1b2631",
    color: "ffc93c",
    bold: "true",
    size: "128",
    format: "png",
  })
  return `https://ui-avatars.com/api/?${params.toString()}`
}
