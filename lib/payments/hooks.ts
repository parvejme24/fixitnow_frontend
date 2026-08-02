"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { useAuth } from "@/app/providers/AuthProvider"
import { ApiError } from "@/lib/api"
import { bookingKeys } from "@/lib/bookings/query-keys"
import {
  fetchPayment,
  getPaymentErrorMessage,
  goToShurjoPayCheckout,
  initiatePayment,
  refundPayment,
  type InitiatePaymentInput,
  type PaymentMethod,
} from "@/lib/payments/api"

export type { PaymentMethod, InitiatePaymentInput }
export { getPaymentErrorMessage, goToShurjoPayCheckout }

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
      void qc.invalidateQueries({ queryKey: bookingKeys.mine() })
      if (result.payment.bookingId) {
        void qc.invalidateQueries({
          queryKey: bookingKeys.detail(result.payment.bookingId),
        })
      }
      goToShurjoPayCheckout(result.checkoutUrl)
    },
  })
}

export function useRefundPayment() {
  const { token, user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => {
      if (user?.role && user.role !== "ADMIN") {
        throw new ApiError(
          "Only admins can refund payments.",
          "FORBIDDEN",
          403
        )
      }
      return refundPayment(id, requireToken(token))
    },
    onSuccess: (payment) => {
      qc.setQueryData(paymentKeys.detail(payment.id), payment)
      void qc.invalidateQueries({ queryKey: bookingKeys.admin() })
      void qc.invalidateQueries({ queryKey: bookingKeys.mine() })
      if (payment.bookingId) {
        void qc.invalidateQueries({
          queryKey: bookingKeys.detail(payment.bookingId),
        })
      }
    },
  })
}
