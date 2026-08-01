export const technicianKeys = {
  all: ["technicians"] as const,
  me: () => [...technicianKeys.all, "me"] as const,
  meSlots: () => [...technicianKeys.all, "me", "slots"] as const,
  detail: (id: string) => [...technicianKeys.all, "detail", id] as const,
  slots: (id: string) => [...technicianKeys.all, "slots", id] as const,
  reviews: (id: string) => [...technicianKeys.all, "reviews", id] as const,
}
