"use client"

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import {
  createArea,
  deleteArea,
  fetchAreasList,
  updateArea,
  type AreaWriteInput,
} from "@/lib/admin/areas-api"
import { useAuth } from "@/app/providers/AuthProvider"
import { ApiError } from "@/lib/api"
import { catalogueKeys } from "@/lib/catalogue/query-keys"
import type { Area } from "@/lib/catalogue/types"

export const adminAreaKeys = {
  all: ["admin", "areas"] as const,
  list: () => [...adminAreaKeys.all, "list"] as const,
}

function requireToken(token: string | null | undefined): string {
  if (!token) throw new ApiError("Sign in required", "UNAUTHORIZED", 401)
  return token
}

function sortAreas(rows: Area[]) {
  return [...rows].sort((a, b) => a.name.localeCompare(b.name))
}

function invalidatePublicAreas(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({
    queryKey: catalogueKeys.areas(),
    refetchType: "active",
  })
}

export function useAdminAreasQuery() {
  const { token } = useAuth()
  return useQuery({
    queryKey: adminAreaKeys.list(),
    queryFn: async () => sortAreas(await fetchAreasList()),
    enabled: Boolean(token),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  })
}

export function useCreateArea() {
  const { token } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: AreaWriteInput) =>
      createArea(input, requireToken(token)),
    onSuccess: (created) => {
      qc.setQueryData<Area[]>(adminAreaKeys.list(), (prev) =>
        sortAreas([created, ...(prev ?? []).filter((a) => a.id !== created.id)])
      )
      invalidatePublicAreas(qc)
    },
  })
}

export function useUpdateArea() {
  const { token } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string
      input: Partial<AreaWriteInput>
    }) => updateArea(id, input, requireToken(token)),
    onSuccess: (updated) => {
      qc.setQueryData<Area[]>(adminAreaKeys.list(), (prev) =>
        sortAreas(
          (prev ?? []).map((a) => (a.id === updated.id ? { ...a, ...updated } : a))
        )
      )
      invalidatePublicAreas(qc)
    },
  })
}

export function useDeleteArea() {
  const { token } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await deleteArea(id, requireToken(token))
      return id
    },
    onSuccess: (id) => {
      qc.setQueryData<Area[]>(adminAreaKeys.list(), (prev) =>
        (prev ?? []).filter((a) => a.id !== id)
      )
      qc.setQueryData<Area[]>(catalogueKeys.areas(), (prev) =>
        (prev ?? []).filter((a) => a.id !== id)
      )
      invalidatePublicAreas(qc)
    },
  })
}

export function getAreaErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return "Something went wrong. Please try again."
}

export type { AreaWriteInput }
