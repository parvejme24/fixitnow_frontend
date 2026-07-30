"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"

import {
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

export function useServices(query: ServicesQuery = {}) {
  return useQuery({
    queryKey: catalogueKeys.services(query),
    queryFn: () => fetchServices(query),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  })
}

export function useFeaturedServices() {
  return useQuery({
    queryKey: catalogueKeys.featuredServices(),
    queryFn: fetchFeaturedServices,
    staleTime: 60_000,
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
  })
}

export function useTopTechnicians() {
  return useQuery({
    queryKey: catalogueKeys.topTechnicians(),
    queryFn: fetchTopTechnicians,
    staleTime: 60_000,
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
    staleTime: 30_000,
  })
}
