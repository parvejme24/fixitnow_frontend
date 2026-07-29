/**
 * UI helpers + local review stubs used by detail pages.
 * Live catalogue data comes from `@/lib/catalogue` hooks/API.
 */

import type {
  Category,
  CategoryId,
  Review,
  Service,
  Technician,
} from "@/lib/catalogue/types"

export type {
  Category,
  CategoryId,
  Review,
  Service,
  Technician,
} from "@/lib/catalogue/types"

export const SHARED_REVIEWS: Review[] = [
  {
    author: "Mahmudul Hasan",
    initials: "MH",
    rating: 5,
    date: "24 Jul 2026",
    body: "Found the fault in twenty minutes and explained every step before touching the board. Clean finish.",
  },
  {
    author: "Shirin Akter",
    initials: "SA",
    rating: 5,
    date: "20 Jul 2026",
    body: "Arrived on the exact slot, worked quietly, and left the workspace cleaner than he found it.",
  },
  {
    author: "Kamrul Hasan",
    initials: "KH",
    rating: 4,
    date: "11 Jul 2026",
    body: "Good work overall. Took a little longer on the rearrange, but the result feels solid.",
  },
  {
    author: "Tasnim Jahan",
    initials: "TJ",
    rating: 5,
    date: "02 Jul 2026",
    body: "He refused to install the board until the earthing was fixed. That honesty is why I booked again.",
  },
]

export function categoryName(
  id: CategoryId,
  categories?: Pick<Category, "id" | "name">[]
) {
  return categories?.find((c) => c.id === id)?.name ?? id
}

export function formatTaka(n: number) {
  return `৳${n.toLocaleString("en-IN")}`
}

export function categoryCounts(
  categories: Category[],
  services: Service[]
): Record<string, number> {
  const counts = Object.fromEntries(categories.map((c) => [c.id, 0])) as Record<
    string,
    number
  >
  for (const s of services) {
    if (counts[s.cat] !== undefined) counts[s.cat] += 1
    else counts[s.cat] = 1
  }
  return counts
}

export function technicianCategoryCounts(
  categories: Category[],
  technicians: Technician[]
): Record<string, number> {
  const counts = Object.fromEntries(categories.map((c) => [c.id, 0])) as Record<
    string,
    number
  >
  for (const t of technicians) {
    for (const c of t.cats) {
      if (counts[c] !== undefined) counts[c] += 1
      else counts[c] = 1
    }
  }
  return counts
}

export function servicesForTechnician(
  tech: Technician,
  services: Service[]
) {
  if (tech.offeredServices?.length) return tech.offeredServices
  return services.filter((s) => tech.cats.includes(s.cat))
}

export function techniciansForService(
  service: Service,
  technicians: Technician[]
) {
  const list = technicians.filter((t) => t.cats.includes(service.cat))
  return list.length ? list : technicians.slice(0, 3)
}

export function reviewsForTechnician(_tech: Technician) {
  return SHARED_REVIEWS
}

export function reviewsForService(_service: Service) {
  return SHARED_REVIEWS
}

export function firstName(full: string) {
  return full.split(" ")[0] ?? full
}

export function formatReviewDate(d = new Date()) {
  const day = String(d.getDate()).padStart(2, "0")
  const mon = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ][d.getMonth()]
  return `${day} ${mon} ${d.getFullYear()}`
}

export function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return "YN"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}
