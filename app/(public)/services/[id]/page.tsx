import type { Metadata } from "next"

import ServiceDetail from "../../../components/Services/ServiceDetail/ServiceDetail"
import { fetchService } from "@/lib/catalogue/api"

type Params = Promise<{ id: string }>

export async function generateMetadata({
  params,
}: {
  params: Params
}): Promise<Metadata> {
  const { id } = await params
  try {
    const service = await fetchService(id)
    return { title: `${service.title} — FixItNow` }
  } catch {
    return { title: "Service — FixItNow" }
  }
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Params
}) {
  const { id } = await params
  return <ServiceDetail serviceId={id} />
}
