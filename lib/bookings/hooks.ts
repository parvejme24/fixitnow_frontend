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
  CreateBookingInput,
  UpdateBookingStatusInput,
} from "@/lib/bookings/types"

function requireToken(token: string | null | undefined): string {
  if (!token) throw new ApiError("Sign in required", "UNAUTHORIZED", 401)
  return token
}

export function useMyBookings(enabled = true) {
  const { token } = useAuth()
  return useQuery({
    queryKey: bookingKeys.mine(),
    queryFn: () => fetchMyBookings(requireToken(token)),
    enabled: Boolean(token) && enabled,
    staleTime: 15_000,
    placeholderData: keepPreviousData,
  })
}

export function useAdminBookingsQuery(enabled = true) {
  const { token } = useAuth()
  return useQuery({
    queryKey: bookingKeys.admin(),
    queryFn: () => fetchAdminBookings(requireToken(token)),
    enabled: Boolean(token) && enabled,
    staleTime: 15_000,
    placeholderData: keepPreviousData,
  })
}

export function useBooking(id: string, enabled = true) {
  const { token } = useAuth()
  return useQuery({
    queryKey: bookingKeys.detail(id),
    queryFn: () => fetchBooking(id, requireToken(token)),
    enabled: Boolean(token && id) && enabled,
  })
}

function invalidateBookingLists(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: bookingKeys.mine() })
  void qc.invalidateQueries({ queryKey: bookingKeys.admin() })
}

export function useCreateBooking() {
  const { token } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateBookingInput) =>
      createBooking(input, requireToken(token)),
    onSuccess: (booking) => {
      invalidateBookingLists(qc)
      qc.setQueryData(bookingKeys.detail(booking.id), booking)
    },
  })
}

export function useAcceptBooking() {
  const { token } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => acceptBooking(id, requireToken(token)),
    onSuccess: (booking) => {
      invalidateBookingLists(qc)
      qc.setQueryData(bookingKeys.detail(booking.id), booking)
    },
  })
}

export function useDeclineBooking() {
  const { token } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => declineBooking(id, requireToken(token)),
    onSuccess: (booking) => {
      invalidateBookingLists(qc)
      qc.setQueryData(bookingKeys.detail(booking.id), booking)
    },
  })
}

export function useCancelBooking() {
  const { token } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => cancelBooking(id, requireToken(token)),
    onSuccess: (booking) => {
      invalidateBookingLists(qc)
      qc.setQueryData(bookingKeys.detail(booking.id), booking)
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
      invalidateBookingLists(qc)
      qc.setQueryData(bookingKeys.detail(booking.id), booking)
    },
  })
}

export function getBookingErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return "Something went wrong. Please try again."
}
