export type BookingStatus =
  | "REQUESTED"
  | "ACCEPTED"
  | "DECLINED"
  | "CANCELLED"
  | "PAID"
  | "EN_ROUTE"
  | "ON_SITE"
  | "IN_PROGRESS"
  | "COMPLETED"

export type BookingParty = {
  id?: string
  name: string
  initials: string
}

export type Booking = {
  id: string
  reference: string
  status: BookingStatus
  service: string
  serviceId?: string | null
  area: string
  technician: BookingParty
  technicianId?: string | null
  customer: BookingParty
  customerId?: string | null
  date: string
  time: string
  amount: number
  notes?: string | null
  slotId?: string | null
  paymentId?: string | null
  reviewed?: boolean
  trade?: string
  createdAt?: string
}

export type CreateBookingInput = {
  serviceId: string
  technicianId: string
  slotId: string
  notes?: string
}

export type UpdateBookingStatusInput = {
  status: Extract<
    BookingStatus,
    "EN_ROUTE" | "ON_SITE" | "IN_PROGRESS" | "COMPLETED" | "PAID"
  >
}
