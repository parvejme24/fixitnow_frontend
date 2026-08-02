"use client"

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import { useAuth } from "@/app/providers/AuthProvider"
import { ApiError } from "@/lib/api"
import {
  acceptBooking,
  cancelBooking,
  createBooking,
  declineBooking,
  fetchAdminBookings,
  fetchBooking,
  fetchMyBookings,
  updateBookingStatus,
} from "@/lib/bookings/api"
import { bookingKeys } from "@/lib/bookings/query-keys"
import type {
  Booking,
  BookingStatus,
  CreateBookingInput,
  UpdateBookingStatusInput,
} from "@/lib/bookings/types"
import { liveQueryOptions } from "@/lib/query/live"
import { technicianKeys } from "@/lib/technicians/query-keys"
import { adminStatsKeys } from "@/lib/admin/use-admin-platform"
import { catalogueKeys } from "@/lib/catalogue/query-keys"

function requireToken(token: string | null | undefined): string {
  if (!token) throw new ApiError("Sign in required", "UNAUTHORIZED", 401)
  return token
}

function isTerminalBookingStatus(status: BookingStatus | undefined) {
  return (
    status === "COMPLETED" ||
    status === "CANCELLED" ||
    status === "DECLINED"
  )
}

function invalidateBookingUniverse(
  qc: ReturnType<typeof useQueryClient>,
  booking?: Booking | null
) {
  void qc.invalidateQueries({ queryKey: bookingKeys.all })
  void qc.invalidateQueries({ queryKey: adminStatsKeys.all })
  void qc.invalidateQueries({ queryKey: technicianKeys.meSlots() })
  if (booking?.technicianId) {
    void qc.invalidateQueries({
      queryKey: technicianKeys.slots(booking.technicianId),
    })
    void qc.invalidateQueries({
      queryKey: catalogueKeys.technicianSlots(booking.technicianId),
    })
  }
  if (booking?.id) {
    qc.setQueryData(bookingKeys.detail(booking.id), booking)
  }
}

export function useMyBookings(enabled = true) {
  const { token } = useAuth()
  return useQuery({
    queryKey: bookingKeys.mine(),
    queryFn: () => fetchMyBookings(requireToken(token)),
    enabled: Boolean(token) && enabled,
    placeholderData: keepPreviousData,
    ...liveQueryOptions,
  })
}

export function useAdminBookingsQuery(enabled = true) {
  const { token } = useAuth()
  return useQuery({
    queryKey: bookingKeys.admin(),
    queryFn: () => fetchAdminBookings(requireToken(token)),
    enabled: Boolean(token) && enabled,
    placeholderData: keepPreviousData,
    ...liveQueryOptions,
  })
}

export function useBooking(id: string, enabled = true) {
  const { token } = useAuth()
  return useQuery({
    queryKey: bookingKeys.detail(id),
    queryFn: () => fetchBooking(id, requireToken(token)),
    enabled: Boolean(token && id) && enabled,
    ...liveQueryOptions,
    refetchInterval: (query) => {
      if (isTerminalBookingStatus(query.state.data?.status)) return false
      return liveQueryOptions.refetchInterval
    },
  })
}

export function useCreateBooking() {
  const { token } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateBookingInput) =>
      createBooking(input, requireToken(token)),
    onSuccess: (booking) => {
      invalidateBookingUniverse(qc, booking)
    },
  })
}

export function useAcceptBooking() {
  const { token } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => acceptBooking(id, requireToken(token)),
    onSuccess: (booking) => {
      invalidateBookingUniverse(qc, booking)
    },
  })
}

export function useDeclineBooking() {
  const { token } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => declineBooking(id, requireToken(token)),
    onSuccess: (booking) => {
      invalidateBookingUniverse(qc, booking)
    },
  })
}

export function useCancelBooking() {
  const { token } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => cancelBooking(id, requireToken(token)),
    onSuccess: (booking) => {
      invalidateBookingUniverse(qc, booking)
    },
  })
}

export function useUpdateBookingStatus() {
  const { token } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string
      status: UpdateBookingStatusInput["status"]
    }) => updateBookingStatus(id, { status }, requireToken(token)),
    onSuccess: (booking) => {
      invalidateBookingUniverse(qc, booking)
    },
  })
}

export function getBookingErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return "Something went wrong. Please try again."
}
