import type { Metadata } from "next"
import { Suspense } from "react"

import BrowseTechnicians from "../../components/Technicians/BrowseTechnicians/BrowseTechnicians"

export const metadata: Metadata = {
  title: "Technicians — FixItNow",
}

export default function TechniciansPage() {
  return (
    <Suspense
      fallback={<div className="browse-page" style={{ minHeight: "50vh" }} />}
    >
      <BrowseTechnicians />
    </Suspense>
  )
}
