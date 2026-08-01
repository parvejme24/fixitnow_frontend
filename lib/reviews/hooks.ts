"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { useAuth } from "@/app/providers/AuthProvider"
import { ApiError } from "@/lib/api"
import { bookingKeys } from "@/lib/bookings/query-keys"
import { catalogueKeys } from "@/lib/catalogue/query-keys"
import { technicianKeys } from "@/lib/technicians/query-keys"
import {
  createReview,
  deleteReview,
  fetchServiceReviews,
  type CreateReviewInput,
} from "@/lib/reviews/api"

function requireToken(token: string | null | undefined): string {
  if (!token) throw new ApiError("Sign in required", "UNAUTHORIZED", 401)
  return token
}

export const reviewKeys = {
  all: ["reviews"] as const,
  service: (id: string) => [...reviewKeys.all, "service", id] as const,
}

export function useServiceReviewsQuery(serviceId: string, enabled = true) {
  return useQuery({
    queryKey: reviewKeys.service(serviceId),
    queryFn: () => fetchServiceReviews(serviceId),
    enabled: Boolean(serviceId) && enabled,
    staleTime: 30_000,
  })
}

export function useCreateReview() {
  const { token } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateReviewInput) =>
      createReview(input, requireToken(token)),
    onSuccess: (_review, input) => {
      if (input.technicianId) {
        void qc.invalidateQueries({
          queryKey: technicianKeys.reviews(input.technicianId),
        })
      }
      if (input.serviceId) {
        void qc.invalidateQueries({
          queryKey: reviewKeys.service(input.serviceId),
        })
        void qc.invalidateQueries({
          queryKey: catalogueKeys.service(input.serviceId),
        })
      }
      void qc.invalidateQueries({ queryKey: bookingKeys.mine() })
    },
  })
}

export function useDeleteReview() {
  const { token } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteReview(id, requireToken(token)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: reviewKeys.all })
      void qc.invalidateQueries({ queryKey: technicianKeys.all })
    },
  })
}

export function getReviewErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return "Could not save review. Please try again."
}
