import type { Metadata } from "next"

import LegalPage from "@/app/components/Shared/LegalPage/LegalPage"
import PrivacyAccordion from "./PrivacyAccordion"

export const metadata: Metadata = {
  title: "Privacy Policy — FixItNow",
  description: "How FixItNow collects, uses, and protects your information.",
}

export default function PrivacyPage() {
  return (
    <LegalPage eyebrow="Legal" title="Privacy Policy" updated="3 August 2026">
      <PrivacyAccordion />
    </LegalPage>
  )
}
