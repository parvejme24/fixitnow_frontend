"use client"

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import { useAuth } from "@/app/providers/AuthProvider"
import { ApiError } from "@/lib/api"
import { adminUserKeys } from "@/lib/admin/use-admin-users"
import { catalogueKeys } from "@/lib/catalogue/query-keys"
import type { AdminUser } from "@/app/lib/admin-data"
import {
  createMySlot,
  deleteMySlot,
  fetchSlotsForTechnician,
  fetchTechnicianById,
  fetchTechnicianReviews,
  updateMyCategories,
  updateMySkills,
  updateMySlot,
  updateMyTechnicianProfile,
  verifyTechnician,
  type SlotWriteInput,
  type TechnicianProfileUpdate,
} from "@/lib/technicians/api"
import { technicianKeys } from "@/lib/technicians/query-keys"
import type { Technician, TechnicianSlot } from "@/lib/catalogue/types"

function requireToken(token: string | null | undefined): string {
  if (!token) throw new ApiError("Sign in required", "UNAUTHORIZED", 401)
  return token
}

export function useMyTechnicianId() {
  const { user } = useAuth()
  return user?.technicianProfile?.id ?? null
}

export function useMyTechnicianProfile() {
  const { token } = useAuth()
  const id = useMyTechnicianId()
  return useQuery({
    queryKey: technicianKeys.me(),
    queryFn: () => fetchTechnicianById(id!, token),
    enabled: Boolean(token && id),
    staleTime: 20_000,
    placeholderData: keepPreviousData,
  })
}

export function useMyTechnicianSlots() {
  const { token } = useAuth()
  const id = useMyTechnicianId()
  return useQuery({
    queryKey: technicianKeys.meSlots(),
    queryFn: () => fetchSlotsForTechnician(id!, token),
    enabled: Boolean(token && id),
    staleTime: 15_000,
    placeholderData: keepPreviousData,
  })
}

export function useTechnicianReviewsQuery(id: string, enabled = true) {
  return useQuery({
    queryKey: technicianKeys.reviews(id),
    queryFn: () => fetchTechnicianReviews(id),
    enabled: Boolean(id) && enabled,
    staleTime: 30_000,
  })
}

export function useUpdateMyTechnicianProfile() {
  const { token } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: TechnicianProfileUpdate) =>
      updateMyTechnicianProfile(input, requireToken(token)),
    onSuccess: (tech) => {
      qc.setQueryData(technicianKeys.me(), tech)
      void qc.invalidateQueries({ queryKey: technicianKeys.me() })
      void qc.invalidateQueries({ queryKey: catalogueKeys.technician(tech.id) })
      void qc.invalidateQueries({ queryKey: catalogueKeys.topTechnicians() })
    },
  })
}

export function useUpdateMyCategories() {
  const { token } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (categoryIds: string[]) =>
      updateMyCategories(categoryIds, requireToken(token)),
    onSuccess: (tech) => {
      qc.setQueryData(technicianKeys.me(), tech)
      void qc.invalidateQueries({ queryKey: technicianKeys.me() })
      void qc.invalidateQueries({ queryKey: catalogueKeys.technician(tech.id) })
    },
  })
}

export function useUpdateMySkills() {
  const { token } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (skills: string[]) =>
      updateMySkills(skills, requireToken(token)),
    onSuccess: (tech) => {
      qc.setQueryData(technicianKeys.me(), tech)
      void qc.invalidateQueries({ queryKey: technicianKeys.me() })
      void qc.invalidateQueries({ queryKey: catalogueKeys.technician(tech.id) })
    },
  })
}

export function useCreateMySlot() {
  const { token } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: SlotWriteInput) =>
      createMySlot(input, requireToken(token)),
    onSuccess: (slot) => {
      qc.setQueryData<TechnicianSlot[]>(technicianKeys.meSlots(), (prev) => [
        ...(prev ?? []).filter((s) => s.id !== slot.id),
        slot,
      ])
      void qc.invalidateQueries({ queryKey: technicianKeys.meSlots() })
    },
  })
}

export function useUpdateMySlot() {
  const { token } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      slotId,
      input,
    }: {
      slotId: string
      input: Partial<SlotWriteInput>
    }) => updateMySlot(slotId, input, requireToken(token)),
    onSuccess: (slot) => {
      qc.setQueryData<TechnicianSlot[]>(technicianKeys.meSlots(), (prev) =>
        (prev ?? []).map((s) => (s.id === slot.id ? slot : s))
      )
      void qc.invalidateQueries({ queryKey: technicianKeys.meSlots() })
    },
  })
}

export function useDeleteMySlot() {
  const { token } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (slotId: string) => deleteMySlot(slotId, requireToken(token)),
    onSuccess: (slotId) => {
      qc.setQueryData<TechnicianSlot[]>(technicianKeys.meSlots(), (prev) =>
        (prev ?? []).filter((s) => s.id !== slotId)
      )
      void qc.invalidateQueries({ queryKey: technicianKeys.meSlots() })
    },
  })
}

export function useVerifyTechnician() {
  const { token } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => verifyTechnician(id, requireToken(token)),
    onSuccess: (tech) => {
      void qc.invalidateQueries({ queryKey: catalogueKeys.technician(tech.id) })
      void qc.invalidateQueries({ queryKey: catalogueKeys.topTechnicians() })
      void qc.invalidateQueries({ queryKey: technicianKeys.detail(tech.id) })
      qc.setQueryData<AdminUser[]>(adminUserKeys.list(), (prev) =>
        (prev ?? []).map((u) =>
          u.technicianId === tech.id
            ? { ...u, technicianVerified: true }
            : u
        )
      )
    },
  })
}

export function getTechnicianErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return "Something went wrong. Please try again."
}

export type { Technician, TechnicianSlot, TechnicianProfileUpdate, SlotWriteInput }
