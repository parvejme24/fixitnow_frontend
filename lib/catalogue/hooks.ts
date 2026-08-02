"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"

import {
  fetchArea,
  fetchAreas,
  fetchCategories,
  fetchFeaturedServices,
  fetchService,
  fetchServices,
  fetchTechnician,
  fetchTechnicianSlots,
  fetchTechnicians,
  fetchTopTechnicians,
} from "@/lib/catalogue/api"
import { catalogueKeys } from "@/lib/catalogue/query-keys"
import { liveQueryOptions } from "@/lib/query/live"
import type {
  ServicesQuery,
  TechniciansQuery,
} from "@/lib/catalogue/types"

export function useCategories() {
  return useQuery({
    queryKey: catalogueKeys.categories(),
    queryFn: fetchCategories,
    staleTime: 15_000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  })
}

export function useAreas() {
  return useQuery({
    queryKey: catalogueKeys.areas(),
    queryFn: fetchAreas,
    staleTime: 60_000,
  })
}

export function useArea(id: string, enabled = true) {
  return useQuery({
    queryKey: catalogueKeys.area(id),
    queryFn: () => fetchArea(id),
    enabled: Boolean(id) && enabled,
    staleTime: 60_000,
    retry: false,
  })
}

export function useServices(query: ServicesQuery = {}) {
  return useQuery({
    queryKey: catalogueKeys.services(query),
    queryFn: () => fetchServices(query),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
    refetchOnMount: "always",
  })
}

export function useFeaturedServices() {
  return useQuery({
    queryKey: catalogueKeys.featuredServices(),
    queryFn: fetchFeaturedServices,
    staleTime: 60_000,
    refetchOnMount: "always",
  })
}

export function useService(id: string, enabled = true) {
  return useQuery({
    queryKey: catalogueKeys.service(id),
    queryFn: () => fetchService(id),
    enabled: Boolean(id) && enabled,
    staleTime: 30_000,
    retry: false,
  })
}

export function useTechnicians(query: TechniciansQuery = {}) {
  return useQuery({
    queryKey: catalogueKeys.technicians(query),
    queryFn: () => fetchTechnicians(query),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
    refetchOnMount: "always",
  })
}

export function useTopTechnicians() {
  return useQuery({
    queryKey: catalogueKeys.topTechnicians(),
    queryFn: fetchTopTechnicians,
    staleTime: 60_000,
    refetchOnMount: "always",
  })
}

export function useTechnician(id: string, enabled = true) {
  return useQuery({
    queryKey: catalogueKeys.technician(id),
    queryFn: () => fetchTechnician(id),
    enabled: Boolean(id) && enabled,
    staleTime: 30_000,
    retry: false,
  })
}

export function useTechnicianSlots(id: string, enabled = true) {
  return useQuery({
    queryKey: catalogueKeys.technicianSlots(id),
    queryFn: () => fetchTechnicianSlots(id),
    enabled: Boolean(id) && enabled,
    ...liveQueryOptions,
  })
}
