"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { useAuth } from "@/app/providers/AuthProvider"
import { ApiError } from "@/lib/api"
import { bookingKeys } from "@/lib/bookings/query-keys"
import {
  fetchPayment,
  initiatePayment,
  refundPayment,
  type PaymentMethod,
} from "@/lib/payments/api"

function requireToken(token: string | null | undefined): string {
  if (!token) throw new ApiError("Sign in required", "UNAUTHORIZED", 401)
  return token
}

export const paymentKeys = {
  all: ["payments"] as const,
  detail: (id: string) => [...paymentKeys.all, id] as const,
}

export function usePayment(id: string, enabled = true) {
  const { token } = useAuth()
  return useQuery({
    queryKey: paymentKeys.detail(id),
    queryFn: () => fetchPayment(id, requireToken(token)),
    enabled: Boolean(token && id) && enabled,
    refetchInterval: (q) => {
      const status = q.state.data?.status
      if (status === "PENDING" || status === "INITIATED") return 3000
      return false
    },
  })
}

export function useInitiatePayment() {
  const { token } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { bookingId: string; method: PaymentMethod }) =>
      initiatePayment(input, requireToken(token)),
    onSuccess: (payment) => {
      qc.setQueryData(paymentKeys.detail(payment.id), payment)
      void qc.invalidateQueries({ queryKey: bookingKeys.mine() })
    },
  })
}

export function useRefundPayment() {
  const { token } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => refundPayment(id, requireToken(token)),
    onSuccess: (payment) => {
      qc.setQueryData(paymentKeys.detail(payment.id), payment)
      void qc.invalidateQueries({ queryKey: bookingKeys.admin() })
      void qc.invalidateQueries({ queryKey: bookingKeys.mine() })
    },
  })
}

export function getPaymentErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return "Payment failed. Please try again."
}
