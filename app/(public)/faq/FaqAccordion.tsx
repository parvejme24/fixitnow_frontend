"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const faqs = [
  {
    value: "book",
    q: "How do I book a technician?",
    a: "Browse services or technicians, pick an open time slot, and submit the booking. After the technician accepts, you can pay and track the job status.",
  },
  {
    value: "pay",
    q: "When do I pay?",
    a: "Payment happens after the booking is accepted—not when you first request the slot—so you are not charged for unavailable time.",
  },
  {
    value: "verified",
    q: "Are technicians verified?",
    a: "Yes. Technicians on FixItNow go through profile verification before they appear for public booking.",
  },
  {
    value: "areas",
    q: "What areas do you cover?",
    a: "FixItNow focuses on Dhaka neighbourhoods. Coverage depends on technician availability in each area.",
  },
  {
    value: "cancel",
    q: "Can I cancel a booking?",
    a: "Yes. Cancel as early as you can from your bookings. If payment was already made, refund handling depends on job status and support review.",
  },
  {
    value: "join",
    q: "How do technicians join?",
    a: "Create a technician account, complete your profile and areas, wait for verification, then set availability and accept jobs.",
  },
  {
    value: "help",
    q: "Who do I contact for help?",
    a: "Email support@fixitnow.com or call +880 1712-345678. Our main branch is in Banani, Dhaka 1213.",
  },
] as const

export default function FaqAccordion() {
  return (
    <Accordion defaultValue={["book"]} className="w-full gap-0">
      {faqs.map((item) => (
        <AccordionItem
          key={item.value}
          value={item.value}
          className="border-b border-[#E2E8ED] last:border-b-0"
        >
          <AccordionTrigger className="px-0 py-3.5 text-[0.98rem] font-semibold text-[#0E141B] hover:no-underline hover:text-[#0d9b70] data-panel-open:text-[#0d9b70]">
            {item.q}
          </AccordionTrigger>
          <AccordionContent className="pb-4 text-[0.95rem] leading-[1.65] text-[#4A5C6B]">
            <p>{item.a}</p>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
