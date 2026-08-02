import type { Metadata } from "next"
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query"
import { Suspense } from "react"

import BrowseServices from "../../components/Services/BrowseServices/BrowseServices"
import { fetchCategories, fetchServices } from "@/lib/catalogue/api"
import { catalogueKeys } from "@/lib/catalogue/query-keys"

export const metadata: Metadata = {
  title: "Browse services — FixItNow",
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

export default async function ServicesPage() {
  const queryClient = new QueryClient()

  await Promise.all([
    safePrefetch(queryClient, {
      queryKey: catalogueKeys.categories(),
      queryFn: fetchCategories,
    }),
    safePrefetch(queryClient, {
      queryKey: catalogueKeys.services({ limit: 100 }),
      queryFn: () => fetchServices({ limit: 100 }),
    }),
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense
        fallback={
          <div className="browse-page" style={{ minHeight: "50vh" }} />
        }
      >
        <BrowseServices />
      </Suspense>
    </HydrationBoundary>
  )
}
