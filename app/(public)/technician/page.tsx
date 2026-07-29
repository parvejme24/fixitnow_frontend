import type { Metadata } from "next"
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query"
import { Suspense } from "react"

import TechnicianDetail from "../../components/Technicians/TechnicianDetail/TechnicianDetail"
import {
  fetchTechnician,
  fetchTechnicianSlots,
  fetchTechnicians,
} from "@/lib/catalogue/api"
import { catalogueKeys } from "@/lib/catalogue/query-keys"

type SearchParams = Promise<{ id?: string; service?: string }>

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams
}): Promise<Metadata> {
  const params = await searchParams
  if (params.id) {
    try {
      const tech = await fetchTechnician(params.id)
      return { title: `${tech.name} — FixItNow` }
    } catch {
      /* fall through */
    }
  }
  return { title: "Technician — FixItNow" }
}

export default async function TechnicianPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const queryClient = new QueryClient()

  if (params.id) {
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: catalogueKeys.technician(params.id),
        queryFn: () => fetchTechnician(params.id!),
      }),
      queryClient.prefetchQuery({
        queryKey: catalogueKeys.technicianSlots(params.id),
        queryFn: () => fetchTechnicianSlots(params.id!),
      }),
    ])
  } else {
    await queryClient.prefetchQuery({
      queryKey: catalogueKeys.technicians({ limit: 50 }),
      queryFn: () => fetchTechnicians({ limit: 50 }),
    })
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense
        fallback={<div className="td-page" style={{ minHeight: "50vh" }} />}
      >
        <TechnicianDetail />
      </Suspense>
    </HydrationBoundary>
  )
}
