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
  updateUserVerified,
  type AdminUsersQuery,
} from "@/lib/admin/users-api"
import { useAuth } from "@/app/providers/AuthProvider"
import { ApiError } from "@/lib/api"
import { catalogueKeys } from "@/lib/catalogue/query-keys"
import { liveQueryOptions } from "@/lib/query/live"
import type { AccountStatus, AdminUser } from "@/app/lib/admin-data"

export const adminUserKeys = {
  all: ["admin", "users"] as const,
  list: (query: AdminUsersQuery = {}) =>
    [...adminUserKeys.all, "list", query] as const,
}

function requireToken(token: string | null | undefined): string {
  if (!token) throw new ApiError("Sign in required", "UNAUTHORIZED", 401)
  return token
}

function patchUserInLists(
  qc: ReturnType<typeof useQueryClient>,
  id: string,
  patch: Partial<AdminUser>
) {
  qc.setQueriesData<AdminUser[]>(
    { queryKey: adminUserKeys.all },
    (prev) =>
      (prev ?? []).map((u) => (u.id === id ? { ...u, ...patch } : u))
  )
}

export function useAdminUsersQuery(query: AdminUsersQuery = {}) {
  const { token } = useAuth()
  return useQuery({
    queryKey: adminUserKeys.list(query),
    queryFn: () => fetchUsers(requireToken(token), query),
    enabled: Boolean(token),
    placeholderData: keepPreviousData,
    ...liveQueryOptions,
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
      patchUserInLists(qc, id, {
        role: updated.role || role,
        name: updated.name || undefined,
        email: updated.email || undefined,
        initials: updated.initials || undefined,
        image: updated.image,
        status: updated.status,
        joined: updated.joined || undefined,
        technicianId: updated.technicianId,
        technicianVerified: updated.technicianVerified,
      })
      void qc.invalidateQueries({ queryKey: adminUserKeys.all })
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
      patchUserInLists(qc, id, {
        status: updated.status || status,
      })
      void qc.invalidateQueries({ queryKey: adminUserKeys.all })
    },
  })
}

export function useUpdateUserVerified() {
  const { token } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      verified,
    }: {
      id: string
      verified: boolean
    }) => {
      const updated = await updateUserVerified(
        id,
        verified,
        requireToken(token)
      )
      return { id, verified, updated }
    },
    onSuccess: ({ id, verified, updated }) => {
      patchUserInLists(qc, id, {
        technicianVerified:
          updated.technicianVerified ?? verified,
        technicianId: updated.technicianId,
      })
      void qc.invalidateQueries({ queryKey: adminUserKeys.all })
      void qc.invalidateQueries({
        queryKey: [...catalogueKeys.all, "technicians"],
      })
      void qc.invalidateQueries({ queryKey: catalogueKeys.topTechnicians() })
      if (updated.technicianId) {
        void qc.invalidateQueries({
          queryKey: catalogueKeys.technician(updated.technicianId),
        })
      }
    },
  })
}

export function getUserErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return "Something went wrong. Please try again."
}
