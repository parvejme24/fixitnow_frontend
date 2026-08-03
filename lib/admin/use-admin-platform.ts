"use client"

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import { useAuth } from "@/app/providers/AuthProvider"
import { ApiError } from "@/lib/api"
import { fetchAdminStats } from "@/lib/admin/stats-api"
import {
  createService,
  deleteService,
  fetchAdminServices,
  mergeAdminServicesWithInactive,
  updateService,
  type ServiceWriteInput,
} from "@/lib/admin/services-api"
import { catalogueKeys } from "@/lib/catalogue/query-keys"
import type { Service } from "@/lib/catalogue/types"

function requireToken(token: string | null | undefined): string {
  if (!token) throw new ApiError("Sign in required", "UNAUTHORIZED", 401)
  return token
}

export const adminStatsKeys = {
  all: ["admin", "stats"] as const,
  overview: () => [...adminStatsKeys.all, "overview"] as const,
}

export const adminServiceKeys = {
  all: ["admin", "services"] as const,
  list: () => [...adminServiceKeys.all, "list"] as const,
}

export function useAdminStatsQuery() {
  const { token } = useAuth()
  return useQuery({
    queryKey: adminStatsKeys.overview(),
    queryFn: () => fetchAdminStats(requireToken(token)),
    enabled: Boolean(token),
    placeholderData: keepPreviousData,
    staleTime: 5_000,
    refetchInterval: 8_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
}

export function useAdminServicesQuery() {
  const { token } = useAuth()
  const qc = useQueryClient()
  return useQuery({
    queryKey: adminServiceKeys.list(),
    queryFn: async () => {
      const previous = qc.getQueryData<Service[]>(adminServiceKeys.list())
      const fresh = await fetchAdminServices(requireToken(token))
      // Public list omits inactive — keep toggled-off services in the admin UI.
      return mergeAdminServicesWithInactive(fresh, previous)
    },
    enabled: Boolean(token),
    staleTime: 20_000,
    placeholderData: keepPreviousData,
  })
}

export function useCreateService() {
  const { token } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ServiceWriteInput) =>
      createService(input, requireToken(token)),
    onSuccess: (svc) => {
      qc.setQueryData<Service[]>(adminServiceKeys.list(), (prev) => [
        svc,
        ...(prev ?? []).filter((s) => s.id !== svc.id),
      ])
      void qc.invalidateQueries({ queryKey: catalogueKeys.services() })
      void qc.invalidateQueries({ queryKey: catalogueKeys.featuredServices() })
    },
  })
}

export function useUpdateService() {
  const { token } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string
      input: Partial<ServiceWriteInput>
    }) => {
      const svc = await updateService(id, input, requireToken(token))
      // Ensure status flips stick even if the PATCH payload omits isActive.
      return {
        ...svc,
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        ...(input.isFeatured !== undefined
          ? { isFeatured: input.isFeatured }
          : {}),
      }
    },
    onSuccess: (svc) => {
      qc.setQueryData<Service[]>(adminServiceKeys.list(), (prev) => {
        const list = prev ?? []
        const idx = list.findIndex((s) => s.id === svc.id)
        if (idx < 0) return mergeAdminServicesWithInactive([svc], list)
        const next = [...list]
        next[idx] = { ...next[idx], ...svc }
        return next
      })
      // Do not wipe inactive rows: public GET /services only returns active.
      void qc.invalidateQueries({ queryKey: catalogueKeys.services() })
      void qc.invalidateQueries({ queryKey: catalogueKeys.service(svc.id) })
      void qc.invalidateQueries({ queryKey: catalogueKeys.featuredServices() })
    },
  })
}

export function useDeleteService() {
  const { token } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteService(id, requireToken(token)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminServiceKeys.list() })
      void qc.invalidateQueries({ queryKey: catalogueKeys.services() })
      void qc.invalidateQueries({ queryKey: catalogueKeys.featuredServices() })
    },
  })
}

export function getAdminServiceErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return "Something went wrong. Please try again."
}

export function getAdminStatsErrorMessage(error: unknown) {
  return getAdminServiceErrorMessage(error)
}
