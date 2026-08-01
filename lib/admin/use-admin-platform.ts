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
  updateService,
  type ServiceWriteInput,
} from "@/lib/admin/services-api"
import { catalogueKeys } from "@/lib/catalogue/query-keys"

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
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  })
}

export function useAdminServicesQuery() {
  const { token } = useAuth()
  return useQuery({
    queryKey: adminServiceKeys.list(),
    queryFn: () => fetchAdminServices(requireToken(token)),
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
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminServiceKeys.list() })
      void qc.invalidateQueries({ queryKey: catalogueKeys.services() })
      void qc.invalidateQueries({ queryKey: catalogueKeys.featuredServices() })
    },
  })
}

export function useUpdateService() {
  const { token } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string
      input: Partial<ServiceWriteInput>
    }) => updateService(id, input, requireToken(token)),
    onSuccess: (svc) => {
      void qc.invalidateQueries({ queryKey: adminServiceKeys.list() })
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
