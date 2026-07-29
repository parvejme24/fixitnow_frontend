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

export default async function ServicesPage() {
  const queryClient = new QueryClient()

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: catalogueKeys.categories(),
      queryFn: fetchCategories,
    }),
    queryClient.prefetchQuery({
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
