import type { Metadata } from "next"
import { Suspense } from "react"

import TechnicianDetail from "../../components/Technicians/TechnicianDetail/TechnicianDetail"
import { resolveTechnician } from "@/app/lib/catalogue"

type SearchParams = Promise<{ id?: string; service?: string }>

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams
}): Promise<Metadata> {
  const params = await searchParams
  const tech = resolveTechnician(params.id, params.service)
  return {
    title: `${tech.name} — FixItNow`,
  }
}

export default function TechnicianPage() {
  return (
    <Suspense fallback={<div className="td-page" style={{ minHeight: "50vh" }} />}>
      <TechnicianDetail />
    </Suspense>
  )
}
