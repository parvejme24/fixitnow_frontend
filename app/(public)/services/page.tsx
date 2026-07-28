import type { Metadata } from "next"
import { Suspense } from "react"

import BrowseServices from "../../components/Services/BrowseServices/BrowseServices"

export const metadata: Metadata = {
  title: "Browse services — FixItNow",
}

export default function ServicesPage() {
  return (
    <Suspense fallback={<div className="browse-page" style={{ minHeight: "50vh" }} />}>
      <BrowseServices />
    </Suspense>
  )
}
