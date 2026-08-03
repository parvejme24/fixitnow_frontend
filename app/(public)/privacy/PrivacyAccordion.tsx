"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const sections = [
  {
    value: "collect",
    title: "1. Information we collect",
    body: "When you use FixItNow we may collect your name, email, phone number, profile image, booking details, payment references, technician trade information, and service areas you select.",
  },
  {
    value: "use",
    title: "2. How we use information",
    body: "We use your data to create accounts, match bookings, process payments, send status updates, verify technicians, improve the product, and respond to support requests.",
  },
  {
    value: "sharing",
    title: "3. Sharing",
    body: "Booking details are shared with the relevant customer or technician so the job can be completed. Payment providers receive only what is needed to process transactions. We do not sell personal data.",
  },
  {
    value: "security",
    title: "4. Storage and security",
    body: "We store account and booking data on secured systems and limit access to staff who need it for operations. No method of transmission is fully risk-free; please use a strong password and keep devices safe.",
  },
  {
    value: "cookies",
    title: "5. Cookies and sessions",
    body: "FixItNow uses local storage and session data to keep you signed in and remember basic preferences while you browse.",
  },
  {
    value: "choices",
    title: "6. Your choices",
    body: (
      <>
        You can update profile details from your account. To request deletion or
        a copy of your data, contact{" "}
        <a
          href="mailto:support@fixitnow.com"
          className="font-medium text-[#0E141B] underline-offset-2 hover:underline"
        >
          support@fixitnow.com
        </a>
        .
      </>
    ),
  },
  {
    value: "contact",
    title: "7. Contact",
    body: "Privacy questions can be sent to support@fixitnow.com or raised at our Banani office in Dhaka.",
  },
] as const

export default function PrivacyAccordion() {
  return (
    <Accordion defaultValue={["collect"]} className="w-full gap-0">
      {sections.map((section) => (
        <AccordionItem
          key={section.value}
          value={section.value}
          className="border-b border-[#E2E8ED] last:border-b-0"
        >
          <AccordionTrigger className="px-0 py-3.5 text-[0.98rem] font-semibold text-[#0E141B] hover:no-underline hover:text-[#0d9b70] data-panel-open:text-[#0d9b70]">
            {section.title}
          </AccordionTrigger>
          <AccordionContent className="pb-4 text-[0.95rem] leading-[1.65] text-[#4A5C6B]">
            <p>{section.body}</p>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
