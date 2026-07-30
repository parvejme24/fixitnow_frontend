"use client"

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import {
  createCategory,
  deleteCategory,
  fetchCategoryStats,
  fetchManageCategories,
  toggleCategoryVisibility,
  updateCategory,
  type ApiCategory,
  type CategoryStats,
  type CategoryWriteInput,
} from "@/lib/admin/categories-api"
import { useAuth } from "@/app/providers/AuthProvider"
import { catalogueKeys } from "@/lib/catalogue/query-keys"
import { ApiError } from "@/lib/api"
import type { AdminCategory } from "@/app/lib/admin-data"
import type { Category } from "@/lib/catalogue/types"

export const adminCategoryKeys = {
  all: ["admin", "categories"] as const,
  manage: () => [...adminCategoryKeys.all, "manage"] as const,
  stats: () => [...adminCategoryKeys.all, "stats"] as const,
}

export function toAdminCategory(raw: ApiCategory): AdminCategory {
  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    icon: raw.icon || "🔧",
    jobs: raw.jobsDone ?? 0,
    services: raw.serviceCount ?? 0,
    active: raw.isVisible,
    createdAt: raw.createdAt,
    sortOrder: raw.sortOrder,
    technicians: raw.technicianCount,
  }
}

function toPublicCategory(cat: AdminCategory): Category {
  return {
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    icon: cat.icon || "🔧",
    isVisible: cat.active,
    sortOrder: cat.sortOrder ?? 0,
    jobsDone: cat.jobs,
    serviceCount: cat.services,
    technicianCount: cat.technicians ?? 0,
  }
}

/** Keep home / browse filters in sync when visibility changes (no full reload). */
function syncPublicCategoryVisibility(
  qc: ReturnType<typeof useQueryClient>,
  category: AdminCategory,
  isVisible: boolean
) {
  qc.setQueryData<Category[]>(catalogueKeys.categories(), (prev) => {
    const current = prev ?? []
    if (isVisible) {
      const next = toPublicCategory({ ...category, active: true })
      const without = current.filter((c) => c.id !== category.id)
      return [...without, next].sort(
        (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
      )
    }
    return current.filter((c) => c.id !== category.id)
  })
}

function invalidatePublicCategories(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({
    queryKey: catalogueKeys.categories(),
    refetchType: "active",
  })
}

/** Newest first (createdAt desc), then sortOrder desc as fallback. */
export function sortCategoriesNewestFirst(rows: AdminCategory[]) {
  return [...rows].sort((a, b) => {
    const aTime = a.createdAt ? Date.parse(a.createdAt) : NaN
    const bTime = b.createdAt ? Date.parse(b.createdAt) : NaN
    if (!Number.isNaN(aTime) && !Number.isNaN(bTime) && aTime !== bTime) {
      return bTime - aTime
    }
    const aSort = a.sortOrder ?? 0
    const bSort = b.sortOrder ?? 0
    if (aSort !== bSort) return bSort - aSort
    return String(b.id).localeCompare(String(a.id))
  })
}

function requireToken(token: string | null | undefined): string {
  if (!token) throw new ApiError("Sign in required", "UNAUTHORIZED", 401)
  return token
}

export function useAdminCategoriesQuery() {
  const { token } = useAuth()
  return useQuery({
    queryKey: adminCategoryKeys.manage(),
    queryFn: async () => {
      const rows = await fetchManageCategories(requireToken(token))
      return sortCategoriesNewestFirst(rows.map(toAdminCategory))
    },
    enabled: Boolean(token),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  })
}

export function useCategoryStatsQuery() {
  const { token } = useAuth()
  return useQuery({
    queryKey: adminCategoryKeys.stats(),
    queryFn: () => fetchCategoryStats(requireToken(token)),
    enabled: Boolean(token),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  })
}

function invalidateCategoryQueries(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: adminCategoryKeys.manage() })
  void qc.invalidateQueries({ queryKey: adminCategoryKeys.stats() })
  invalidatePublicCategories(qc)
}

export function useCreateCategory() {
  const { token } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CategoryWriteInput) => {
      const created = await createCategory(input, requireToken(token))
      return toAdminCategory({
        ...created,
        createdAt: created.createdAt ?? new Date().toISOString(),
      })
    },
    onSuccess: (created) => {
      qc.setQueryData<AdminCategory[]>(adminCategoryKeys.manage(), (prev) =>
        sortCategoriesNewestFirst([
          created,
          ...(prev ?? []).filter((c) => c.id !== created.id),
        ])
      )
      if (created.active) {
        syncPublicCategoryVisibility(qc, created, true)
      }
      invalidateCategoryQueries(qc)
    },
  })
}

export function useUpdateCategory() {
  const { token } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string
      input: Partial<CategoryWriteInput>
    }) => {
      const updated = await updateCategory(id, input, requireToken(token))
      return { id, updated: toAdminCategory(updated), input }
    },
    onSuccess: ({ id, updated, input }) => {
      const nextActive =
        typeof input.isVisible === "boolean"
          ? input.isVisible
          : updated.active
      const merged: AdminCategory = {
        ...updated,
        name: updated.name || input.name || updated.name,
        slug: updated.slug || input.slug || updated.slug,
        icon: updated.icon || input.icon || updated.icon,
        active: nextActive,
      }
      qc.setQueryData<AdminCategory[]>(adminCategoryKeys.manage(), (prev) => {
        if (!prev?.length) return prev
        return sortCategoriesNewestFirst(
          prev.map((c) =>
            c.id === id
              ? {
                  ...c,
                  ...merged,
                  jobs: updated.jobs || c.jobs,
                  services: updated.services || c.services,
                  createdAt: updated.createdAt || c.createdAt,
                  sortOrder: updated.sortOrder ?? c.sortOrder,
                }
              : c
          )
        )
      })
      syncPublicCategoryVisibility(qc, merged, nextActive)
      invalidateCategoryQueries(qc)
    },
  })
}

export function useToggleCategoryVisibility() {
  const { token } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      category,
      active,
    }: {
      category: AdminCategory
      active: boolean
    }) => {
      // Optimistic admin list — never remove the card
      qc.setQueryData<AdminCategory[]>(adminCategoryKeys.manage(), (prev) =>
        (prev ?? []).map((c) =>
          c.id === category.id ? { ...c, active } : c
        )
      )
      // Optimistic public catalogue — hide/show immediately on home & browse
      syncPublicCategoryVisibility(qc, category, active)

      const result = await toggleCategoryVisibility(
        category.id,
        active,
        requireToken(token)
      )
      return { id: category.id, active: result.isVisible, category }
    },
    onSuccess: ({ id, active, category }) => {
      qc.setQueryData<AdminCategory[]>(adminCategoryKeys.manage(), (prev) =>
        (prev ?? []).map((c) => (c.id === id ? { ...c, active } : c))
      )
      syncPublicCategoryVisibility(qc, { ...category, active }, active)
      void qc.invalidateQueries({ queryKey: adminCategoryKeys.stats() })
      invalidatePublicCategories(qc)
    },
    onError: (_err, vars) => {
      qc.setQueryData<AdminCategory[]>(adminCategoryKeys.manage(), (prev) =>
        (prev ?? []).map((c) =>
          c.id === vars.category.id
            ? { ...c, active: vars.category.active }
            : c
        )
      )
      syncPublicCategoryVisibility(
        qc,
        vars.category,
        vars.category.active
      )
    },
  })
}

export function useDeleteCategory() {
  const { token } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await deleteCategory(id, requireToken(token))
      return id
    },
    onSuccess: (id) => {
      qc.setQueryData<AdminCategory[]>(adminCategoryKeys.manage(), (prev) =>
        (prev ?? []).filter((c) => c.id !== id)
      )
      qc.setQueryData<Category[]>(catalogueKeys.categories(), (prev) =>
        (prev ?? []).filter((c) => c.id !== id)
      )
      invalidateCategoryQueries(qc)
    },
  })
}

export function getCategoryErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return "Something went wrong. Please try again."
}

export type { CategoryStats, CategoryWriteInput }
