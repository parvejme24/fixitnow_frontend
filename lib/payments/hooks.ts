"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { useAuth } from "@/app/providers/AuthProvider"
import { ApiError } from "@/lib/api"
import { bookingKeys } from "@/lib/bookings/query-keys"
import {
  fetchMyPaymentSummary,
  fetchMyPayments,
  fetchPayment,
  getPaymentErrorMessage,
  goToShurjoPayCheckout,
  initiatePayment,
  refundPayment,
  type InitiatePaymentInput,
  type Payment,
  type PaymentMethod,
  type PaymentSummary,
} from "@/lib/payments/api"
import { liveQueryOptions } from "@/lib/query/live"

export type { Payment, PaymentMethod, PaymentSummary, InitiatePaymentInput }
export { getPaymentErrorMessage, goToShurjoPayCheckout }

function requireToken(token: string | null | undefined): string {
  if (!token) throw new ApiError("Sign in required", "UNAUTHORIZED", 401)
  return token
}

export const paymentKeys = {
  all: ["payments"] as const,
  mine: () => [...paymentKeys.all, "mine"] as const,
  summary: () => [...paymentKeys.all, "summary"] as const,
  detail: (id: string) => [...paymentKeys.all, id] as const,
}

/** Customer: `GET /payments/me` payment history. */
export function useMyPaymentsQuery(enabled = true) {
  const { token } = useAuth()
  return useQuery({
    queryKey: paymentKeys.mine(),
    queryFn: () => fetchMyPayments(requireToken(token)),
    enabled: Boolean(token) && enabled,
    ...liveQueryOptions,
  })
}

/** Customer: `GET /payments/me/summary`. */
export function useMyPaymentSummaryQuery(enabled = true) {
  const { token } = useAuth()
  return useQuery({
    queryKey: paymentKeys.summary(),
    queryFn: () => fetchMyPaymentSummary(requireToken(token)),
    enabled: Boolean(token) && enabled,
    ...liveQueryOptions,
  })
}

export function usePayment(id: string, enabled = true) {
  const { token } = useAuth()
  return useQuery({
    queryKey: paymentKeys.detail(id),
    queryFn: () => fetchPayment(id, requireToken(token)),
    enabled: Boolean(token && id) && enabled,
    refetchInterval: (q) => {
      const status = String(q.state.data?.status ?? "").toUpperCase()
      if (status === "PENDING" || status === "INITIATED") return 2500
      return false
    },
  })
}

/**
 * Customer: initiate payment, then redirect to ShurjoPay `checkoutUrl`.
 * After pay, gateway hits backend `/payments/shurjopay/callback`, then
 * browser lands on `/payment/success` or `/payment/cancel`.
 */
export function useInitiatePayment() {
  const { token, user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: InitiatePaymentInput) => {
      if (user?.role && user.role !== "CUSTOMER") {
        throw new ApiError(
          "Only customers can initiate payments.",
          "FORBIDDEN",
          403
        )
      }
      return initiatePayment(input, requireToken(token))
    },
    onSuccess: (result) => {
      qc.setQueryData(paymentKeys.detail(result.payment.id), result.payment)
      void qc.invalidateQueries({ queryKey: bookingKeys.all })
      void qc.invalidateQueries({ queryKey: paymentKeys.mine() })
      void qc.invalidateQueries({ queryKey: paymentKeys.summary() })
      goToShurjoPayCheckout(result.checkoutUrl)
    },
  })
}

/** Technician or admin: refund a payment. */
export function useRefundPayment() {
  const { token, user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => {
      const role = user?.role
      if (role && role !== "ADMIN" && role !== "TECHNICIAN") {
        throw new ApiError(
          "Only technicians or admins can refund payments.",
          "FORBIDDEN",
          403
        )
      }
      return refundPayment(id, requireToken(token))
    },
    onSuccess: (payment) => {
      qc.setQueryData(paymentKeys.detail(payment.id), payment)
      void qc.invalidateQueries({ queryKey: bookingKeys.all })
      void qc.invalidateQueries({ queryKey: paymentKeys.mine() })
      void qc.invalidateQueries({ queryKey: paymentKeys.summary() })
      void qc.invalidateQueries({ queryKey: paymentKeys.all })
    },
  })
}
