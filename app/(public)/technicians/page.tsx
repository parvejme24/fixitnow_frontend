import type { Metadata } from "next"
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query"
import { Suspense } from "react"

import BrowseTechnicians from "../../components/Technicians/BrowseTechnicians/BrowseTechnicians"
import {
  fetchAreas,
  fetchCategories,
  fetchTechnicians,
} from "@/lib/catalogue/api"
import { catalogueKeys } from "@/lib/catalogue/query-keys"

export const metadata: Metadata = {
  title: "Technicians — FixItNow",
}

async function safePrefetch(
  queryClient: QueryClient,
  options: {
    queryKey: readonly unknown[]
    queryFn: () => Promise<unknown>
  }
) {
  try {
    await queryClient.prefetchQuery(options)
  } catch {
    queryClient.removeQueries({ queryKey: options.queryKey })
  }
}

export default async function TechniciansPage() {
  const queryClient = new QueryClient()

  await Promise.all([
    safePrefetch(queryClient, {
      queryKey: catalogueKeys.categories(),
      queryFn: fetchCategories,
    }),
    safePrefetch(queryClient, {
      queryKey: catalogueKeys.areas(),
      queryFn: fetchAreas,
    }),
    safePrefetch(queryClient, {
      queryKey: catalogueKeys.technicians({ limit: 100 }),
      queryFn: () => fetchTechnicians({ limit: 100 }),
    }),
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense
        fallback={
          <div className="browse-page" style={{ minHeight: "50vh" }} />
        }
      >
        <BrowseTechnicians />
      </Suspense>
    </HydrationBoundary>
  )
}
