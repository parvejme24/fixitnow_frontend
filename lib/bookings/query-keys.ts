export const bookingKeys = {
  all: ["bookings"] as const,
  mine: () => [...bookingKeys.all, "mine"] as const,
  admin: () => [...bookingKeys.all, "admin"] as const,
  detail: (id: string) => [...bookingKeys.all, "detail", id] as const,
}
