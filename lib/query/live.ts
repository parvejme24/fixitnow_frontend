/**
 * Shared React Query options for data that changes across users
 * (bookings, slots, payments) without a websocket.
 */
export const LIVE_REFETCH_MS = 4_000
export const LIVE_STALE_MS = 2_000

export const liveQueryOptions = {
  staleTime: LIVE_STALE_MS,
  refetchInterval: LIVE_REFETCH_MS,
  refetchIntervalInBackground: false,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
} as const
