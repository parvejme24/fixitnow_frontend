import { apiGet, apiPatch, apiPost, type ApiSuccess } from "@/lib/api"
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

function normalizeUser(raw: unknown): AuthUser {
  const obj = asRecord(raw) ?? {}
  const roleRaw = String(obj.role ?? "CUSTOMER").toUpperCase()
  const role =
    roleRaw === "TECHNICIAN" || roleRaw === "ADMIN" ? roleRaw : "CUSTOMER"

  return {
    id: String(obj.id ?? ""),
    name: String(obj.name ?? ""),
    email: String(obj.email ?? ""),
    phone: (obj.phone as string | null | undefined) ?? null,
    role,
    initials: (obj.initials as string | null | undefined) ?? null,
    isActive: typeof obj.isActive === "boolean" ? obj.isActive : undefined,
    createdAt: typeof obj.createdAt === "string" ? obj.createdAt : undefined,
    updatedAt: typeof obj.updatedAt === "string" ? obj.updatedAt : undefined,
    technicianProfile:
      (obj.technicianProfile as AuthUser["technicianProfile"]) ?? null,
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
  const res = await apiPatch<unknown>(
    "/auth/me",
    input,
    withAuthToken(token)
  )
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
