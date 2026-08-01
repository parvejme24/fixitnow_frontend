import { ApiError, apiGet, apiPatch, apiPost, type ApiSuccess } from "@/lib/api"
import { getStoredToken } from "@/lib/auth/storage"
import type {
  AuthPayload,
  AuthUser,
  ChangePasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
  UpdateMeInput,
} from "@/lib/auth/types"
import { absoluteMediaUrl } from "@/lib/auth/types"

type LooseRecord = Record<string, unknown>

function asRecord(value: unknown): LooseRecord | null {
  return value && typeof value === "object" ? (value as LooseRecord) : null
}

function pickString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value
  }
  return null
}

function normalizeTechnicianProfile(
  raw: unknown
): AuthUser["technicianProfile"] {
  const obj = asRecord(raw)
  if (!obj) return null
  const id = pickString(obj.id)
  if (!id) return null
  return {
    id,
    trade: pickString(obj.trade) ?? null,
    visitFee: typeof obj.visitFee === "number" ? obj.visitFee : null,
    online: typeof obj.online === "boolean" ? obj.online : undefined,
    verified: typeof obj.verified === "boolean" ? obj.verified : undefined,
  }
}

export function normalizeUser(raw: unknown): AuthUser {
  const obj = asRecord(raw) ?? {}
  const roleRaw = String(obj.role ?? "CUSTOMER").toUpperCase()
  const role =
    roleRaw === "TECHNICIAN" || roleRaw === "ADMIN" ? roleRaw : "CUSTOMER"

  const image = absoluteMediaUrl(
    pickString(
      obj.image,
      obj.avatar,
      obj.profileImage,
      obj.profilePic,
      obj.photo,
      asRecord(obj.profile)?.image,
      asRecord(obj.profile)?.avatar
    )
  )

  return {
    id: String(obj.id ?? ""),
    name: String(obj.name ?? ""),
    email: String(obj.email ?? ""),
    phone: (obj.phone as string | null | undefined) ?? null,
    role,
    initials: (obj.initials as string | null | undefined) ?? null,
    image,
    isActive: typeof obj.isActive === "boolean" ? obj.isActive : undefined,
    createdAt: typeof obj.createdAt === "string" ? obj.createdAt : undefined,
    updatedAt: typeof obj.updatedAt === "string" ? obj.updatedAt : undefined,
    technicianProfile: normalizeTechnicianProfile(
      obj.technicianProfile ?? obj.technician
    ),
  }
}

function normalizeAuthPayload(data: unknown): AuthPayload {
  const obj = asRecord(data) ?? {}
  const nested = asRecord(obj.data)
  const tokens = asRecord(obj.tokens) ?? asRecord(nested?.tokens)

  const token = pickString(
    obj.token,
    obj.accessToken,
    obj.access_token,
    tokens?.accessToken,
    tokens?.token,
    nested?.token,
    nested?.accessToken
  )

  const userRaw = obj.user ?? nested?.user ?? (obj.email ? obj : null)
  if (!token || !userRaw) {
    throw new Error("Auth response missing token or user")
  }

  return {
    token,
    user: normalizeUser(userRaw),
  }
}

function withAuthToken(token?: string | null) {
  return token ?? getStoredToken()
}

export async function registerRequest(input: RegisterInput) {
  const res = await apiPost<unknown>("/auth/register", input)
  return normalizeAuthPayload(res.data)
}

export async function loginRequest(input: LoginInput) {
  const res = await apiPost<unknown>("/auth/login", input)
  return normalizeAuthPayload(res.data)
}

export async function logoutRequest(token?: string | null) {
  try {
    await apiPost<unknown>("/auth/logout", {}, withAuthToken(token))
  } catch {
    // Always clear local session even if server logout fails
  }
}

export async function getMeRequest(token?: string | null) {
  const res = await apiGet<unknown>("/auth/me", undefined, withAuthToken(token))
  const data = asRecord(res.data)
  const userRaw = data?.user ?? res.data
  return normalizeUser(userRaw)
}

export async function updateMeRequest(
  input: UpdateMeInput,
  token?: string | null
) {
  const auth = withAuthToken(token)
  let body: FormData | Record<string, string>

  if (input.image instanceof File) {
    const allowed = new Set([
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ])
    if (!allowed.has(input.image.type)) {
      throw new ApiError(
        "Only JPEG, PNG, WEBP, or GIF images are allowed",
        "INVALID_FILE",
        400
      )
    }
    if (input.image.size > 5 * 1024 * 1024) {
      throw new ApiError(
        "Image must be 5MB or smaller",
        "FILE_TOO_LARGE",
        400
      )
    }

    const form = new FormData()
    if (input.name !== undefined) form.append("name", input.name)
    if (input.phone !== undefined) form.append("phone", input.phone)
    if (input.initials !== undefined) form.append("initials", input.initials)
    // Multer: uploadProfileImageMiddleware.single("profileImage")
    const filename =
      input.image.name?.trim() ||
      `profile.${input.image.type.split("/")[1] || "jpg"}`
    form.append("profileImage", input.image, filename)
    body = form
  } else {
    body = {}
    if (input.name !== undefined) body.name = input.name
    if (input.phone !== undefined) body.phone = input.phone
    if (input.initials !== undefined) body.initials = input.initials
  }

  const res = await apiPatch<unknown>("/auth/me", body, auth)
  const data = asRecord(res.data)
  const userRaw = data?.user ?? res.data
  return normalizeUser(userRaw)
}

export async function forgotPasswordRequest(email: string) {
  return apiPost<{ message?: string }>("/auth/forgot-password", { email })
}

export async function resetPasswordRequest(input: ResetPasswordInput) {
  return apiPost<{ message?: string }>("/auth/reset-password", {
    token: input.token,
    password: input.password,
    newPassword: input.password,
  })
}

export async function changePasswordRequest(
  input: ChangePasswordInput,
  token?: string | null
) {
  return apiPost<{ message?: string }>(
    "/auth/change-password",
    {
      currentPassword: input.currentPassword,
      newPassword: input.newPassword,
      oldPassword: input.currentPassword,
      password: input.newPassword,
    },
    withAuthToken(token)
  )
}

export type { ApiSuccess }
