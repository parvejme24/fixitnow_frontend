import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query"

import CategoriesSection from "../components/Home/CategoriesSection/CategoriesSection"
import FeaturedServices from "../components/Home/FeaturedServices/FeaturedServices"
import ForTechnicians from "../components/Home/ForTechnicians/ForTechnicians"
import HeroBanner from "../components/Home/HeroBanner/HeroBanner"
import HowItWorks from "../components/Home/HowItWorks/HowItWorks"
import TopTechnicians from "../components/Home/TopTechnicians/TopTechnicians"
import {
  fetchCategories,
  fetchServices,
  fetchTechnicians,
} from "@/lib/catalogue/api"
import { catalogueKeys } from "@/lib/catalogue/query-keys"

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
    // Client hooks will fetch — never bake a failed query into the HTML.
    queryClient.removeQueries({ queryKey: options.queryKey })
  }
}

export default async function HomePage() {
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
    safePrefetch(queryClient, {
      queryKey: catalogueKeys.technicians({ limit: 100 }),
      queryFn: () => fetchTechnicians({ limit: 100 }),
    }),
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HeroBanner />
      <CategoriesSection />
      <FeaturedServices />
      <HowItWorks />
      <TopTechnicians />
      <ForTechnicians />
    </HydrationBoundary>
  )
}
