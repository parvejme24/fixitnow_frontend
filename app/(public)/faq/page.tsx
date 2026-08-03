import type { Metadata } from "next"

import LegalPage from "@/app/components/Shared/LegalPage/LegalPage"
import FaqAccordion from "./FaqAccordion"

export const metadata: Metadata = {
  title: "FAQ — FixItNow",
  description: "Frequently asked questions about booking on FixItNow.",
}

export default function FaqPage() {
  return (
    <LegalPage eyebrow="Help" title="Frequently asked questions">
      <FaqAccordion />
    </LegalPage>
  )
}
