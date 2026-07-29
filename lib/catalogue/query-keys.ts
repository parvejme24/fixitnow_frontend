import type {
  ServicesQuery,
  TechniciansQuery,
} from "@/lib/catalogue/types"

export const catalogueKeys = {
  all: ["catalogue"] as const,
  categories: () => [...catalogueKeys.all, "categories"] as const,
  category: (id: string) => [...catalogueKeys.categories(), id] as const,
  areas: () => [...catalogueKeys.all, "areas"] as const,
  services: (query: ServicesQuery = {}) =>
    [...catalogueKeys.all, "services", query] as const,
  featuredServices: () =>
    [...catalogueKeys.all, "services", "featured"] as const,
  service: (id: string) => [...catalogueKeys.all, "service", id] as const,
  technicians: (query: TechniciansQuery = {}) =>
    [...catalogueKeys.all, "technicians", query] as const,
  topTechnicians: () =>
    [...catalogueKeys.all, "technicians", "top"] as const,
  technician: (id: string) =>
    [...catalogueKeys.all, "technician", id] as const,
  technicianSlots: (id: string) =>
    [...catalogueKeys.all, "technician", id, "slots"] as const,
}
