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

export default async function TechniciansPage() {
  const queryClient = new QueryClient()

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: catalogueKeys.categories(),
      queryFn: fetchCategories,
    }),
    queryClient.prefetchQuery({
      queryKey: catalogueKeys.areas(),
      queryFn: fetchAreas,
    }),
    queryClient.prefetchQuery({
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
