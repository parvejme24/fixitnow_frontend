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
    staleTime: 5_000,
    refetchInterval: 8_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
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
      void qc.invalidateQueries({ queryKey: bookingKeys.all })
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

/**
 * Delete rules:
 * - Review owner can delete their own review
 * - Technicians can delete any review
 * - Everyone else cannot delete another person's review
 *
 * Note: list reviews from the API often omit `customerId` / `authorId` and only
 * return `authorName`, so ownership also matches the signed-in user's name.
 */
export function isReviewOwner(
  user: { id: string; name?: string | null } | null | undefined,
  review: { authorId?: string | null; author?: string | null }
): boolean {
  if (!user) return false
  if (review.authorId && review.authorId === user.id) return true
  const author = (review.author || "").trim().toLowerCase()
  const name = (user.name || "").trim().toLowerCase()
  return Boolean(author && name && author === name && author !== "customer")
}

export function canDeleteReview(
  user: { id: string; name?: string | null; role: string } | null | undefined,
  review: { authorId?: string | null; author?: string | null }
): boolean {
  if (!user) return false
  if (user.role === "TECHNICIAN") return true
  return isReviewOwner(user, review)
}

/** Fill name/photo for the signed-in customer's own reviews when the API omits them. */
export function withViewerReviewProfile<
  T extends {
    authorId?: string | null
    author: string
    initials: string
    image?: string | null
  },
>(
  reviews: T[],
  user: {
    id: string
    name: string
    initials?: string | null
    image?: string | null
  } | null | undefined
): T[] {
  if (!user) return reviews
  return reviews.map((review) => {
    if (!isReviewOwner(user, review)) return review
    const author =
      !review.author || review.author === "Customer" ? user.name : review.author
    return {
      ...review,
      authorId: review.authorId ?? user.id,
      author,
      initials:
        !review.initials || review.author === "Customer"
          ? user.initials || author.slice(0, 2).toUpperCase()
          : review.initials,
      image: review.image || user.image || null,
    }
  })
}
