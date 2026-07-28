import type { Metadata } from "next"
import { notFound } from "next/navigation"

import ServiceDetail from "../../../components/Services/ServiceDetail/ServiceDetail"
import { getServiceById } from "@/app/lib/catalogue"

type Params = Promise<{ id: string }>

export async function generateMetadata({
  params,
}: {
  params: Params
}): Promise<Metadata> {
  const { id } = await params
  const service = getServiceById(id)
  if (!service) return { title: "Service — FixItNow" }
  return { title: `${service.title} — FixItNow` }
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Params
}) {
  const { id } = await params
  if (!getServiceById(id)) notFound()
  return <ServiceDetail serviceId={id} />
}
