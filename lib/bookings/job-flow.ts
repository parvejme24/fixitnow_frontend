import type { BookingStatus } from "@/lib/bookings/types"

export type JobFlowStepId = "PAID" | "EN_ROUTE" | "ON_SITE" | "COMPLETED"

export type JobFlowStep = {
  id: JobFlowStepId
  label: string
  hint: string
}

/** Post-payment job pipeline technicians advance through. */
export const JOB_FLOW_STEPS: JobFlowStep[] = [
  { id: "PAID", label: "Paid", hint: "Customer paid — ready to start" },
  { id: "EN_ROUTE", label: "En route", hint: "Heading to the customer" },
  { id: "ON_SITE", label: "On site", hint: "Working at the location" },
  { id: "COMPLETED", label: "Done", hint: "Job finished" },
]

export type AdvanceStatus = Extract<
  BookingStatus,
  "EN_ROUTE" | "ON_SITE" | "COMPLETED"
>

/** Map raw booking status onto the job pipeline index. */
export function jobFlowIndex(status: BookingStatus): number {
  switch (status) {
    case "ACCEPTED":
    case "PAID":
      return 0
    case "EN_ROUTE":
      return 1
    case "ON_SITE":
    case "IN_PROGRESS":
      return 2
    case "COMPLETED":
      return 3
    default:
      return -1
  }
}

export function canShowJobFlow(status: BookingStatus): boolean {
  return (
    status === "ACCEPTED" ||
    status === "PAID" ||
    status === "EN_ROUTE" ||
    status === "ON_SITE" ||
    status === "IN_PROGRESS" ||
    status === "COMPLETED"
  )
}

export function nextJobAdvance(status: BookingStatus): AdvanceStatus | null {
  if (status === "ACCEPTED" || status === "PAID") return "EN_ROUTE"
  if (status === "EN_ROUTE") return "ON_SITE"
  if (status === "ON_SITE" || status === "IN_PROGRESS") return "COMPLETED"
  return null
}

export function advanceActionLabel(next: AdvanceStatus): string {
  if (next === "EN_ROUTE") return "Mark en route"
  if (next === "ON_SITE") return "Mark on site"
  return "Mark completed"
}

export function advanceToastLabel(next: AdvanceStatus): string {
  if (next === "EN_ROUTE") return "En route"
  if (next === "ON_SITE") return "On site"
  return "Completed"
}
