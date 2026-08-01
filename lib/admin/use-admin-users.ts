"use client"

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import {
  adminRoleToApi,
  fetchUsers,
  updateUserRole,
  updateUserStatus,
} from "@/lib/admin/users-api"
import { useAuth } from "@/app/providers/AuthProvider"
import { ApiError } from "@/lib/api"
import type { AccountStatus, AdminUser } from "@/app/lib/admin-data"

export const adminUserKeys = {
  all: ["admin", "users"] as const,
  list: () => [...adminUserKeys.all, "list"] as const,
}

function requireToken(token: string | null | undefined): string {
  if (!token) throw new ApiError("Sign in required", "UNAUTHORIZED", 401)
  return token
}

export function useAdminUsersQuery() {
  const { token } = useAuth()
  return useQuery({
    queryKey: adminUserKeys.list(),
    queryFn: () => fetchUsers(requireToken(token)),
    enabled: Boolean(token),
    staleTime: 20_000,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: true,
  })
}

export function useUpdateUserRole() {
  const { token, user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      role,
    }: {
      id: string
      role: AdminUser["role"]
    }) => {
      if (user?.id && id === user.id) {
        throw new ApiError(
          "You cannot change your own account role.",
          "FORBIDDEN",
          403
        )
      }
      const updated = await updateUserRole(
        id,
        adminRoleToApi(role),
        requireToken(token)
      )
      return { id, role, updated }
    },
    onSuccess: ({ id, role, updated }) => {
      qc.setQueryData<AdminUser[]>(adminUserKeys.list(), (prev) =>
        (prev ?? []).map((u) =>
          u.id === id
            ? {
                ...u,
                role: updated.role || role,
                name: updated.name || u.name,
                email: updated.email || u.email,
                initials: updated.initials || u.initials,
                image: updated.image ?? u.image,
                status: updated.status || u.status,
                joined: updated.joined || u.joined,
              }
            : u
        )
      )
      void qc.invalidateQueries({ queryKey: adminUserKeys.list() })
    },
  })
}

export function useUpdateUserStatus() {
  const { token } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string
      status: AccountStatus
    }) => {
      const updated = await updateUserStatus(id, status, requireToken(token))
      return { id, status, updated }
    },
    onSuccess: ({ id, status, updated }) => {
      qc.setQueryData<AdminUser[]>(adminUserKeys.list(), (prev) =>
        (prev ?? []).map((u) =>
          u.id === id
            ? { ...u, status: updated.status || status }
            : u
        )
      )
      void qc.invalidateQueries({ queryKey: adminUserKeys.list() })
    },
  })
}

export function getUserErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return "Something went wrong. Please try again."
}
