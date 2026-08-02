"use client"

import {
  CheckIcon,
  LoaderCircleIcon,
  MapPinIcon,
  NavigationIcon,
  WalletIcon,
  WrenchIcon,
} from "lucide-react"

import type { BookingStatus } from "@/lib/bookings/types"
import {
  JOB_FLOW_STEPS,
  advanceActionLabel,
  jobFlowIndex,
  nextJobAdvance,
  type AdvanceStatus,
} from "@/lib/bookings/job-flow"

import "./BookingStatusFlow.css"

const STEP_ICONS = {
  PAID: WalletIcon,
  EN_ROUTE: NavigationIcon,
  ON_SITE: MapPinIcon,
  COMPLETED: CheckIcon,
} as const

type BookingStatusFlowProps = {
  status: BookingStatus
  busy?: boolean
  onAdvance: (next: AdvanceStatus) => void
  /** Hide advance controls (e.g. customer tracking view). */
  readOnly?: boolean
  /** Full card (detail page) or compact timeline (dashboard cards). */
  variant?: "card" | "inline"
  /** Where the advance button sits in the inline timeline. */
  actionPlacement?: "below" | "none"
}

export function JobAdvanceButton({
  status,
  busy = false,
  onAdvance,
  className = "bsf__cta bsf__cta--sm",
}: {
  status: BookingStatus
  busy?: boolean
  onAdvance: (next: AdvanceStatus) => void
  className?: string
}) {
  const next = nextJobAdvance(status)
  const waitingPayment = status === "ACCEPTED"
  if (!next || waitingPayment) return null

  return (
    <button
      type="button"
      className={className}
      disabled={busy}
      onClick={() => onAdvance(next)}
    >
      {busy ? (
        <>
          <LoaderCircleIcon size={14} className="animate-spin" />
          Updating…
        </>
      ) : (
        advanceActionLabel(next)
      )}
    </button>
  )
}

function HorizontalSteps({
  current,
  showHints = false,
  size = "md",
}: {
  current: number
  showHints?: boolean
  size?: "sm" | "md"
}) {
  const iconSize = size === "sm" ? 12 : 15
  return (
    <ol
      className={`bsf__rail${showHints ? " bsf__rail--hints" : ""}`}
      aria-label="Job progress"
    >
      {JOB_FLOW_STEPS.map((step, index) => {
        const Icon = STEP_ICONS[step.id]
        const done = current > index
        const active = current === index
        return (
          <li
            key={step.id}
            className={`bsf__rail-step${done ? " is-done" : ""}${active ? " is-active" : ""}`}
          >
            <span className="bsf__rail-dot" aria-hidden>
              {done ? <CheckIcon size={iconSize} /> : <Icon size={iconSize} />}
            </span>
            <span className="bsf__rail-label">{step.label}</span>
            {showHints ? <span className="bsf__rail-hint">{step.hint}</span> : null}
          </li>
        )
      })}
    </ol>
  )
}

export default function BookingStatusFlow({
  status,
  busy = false,
  onAdvance,
  readOnly = false,
  variant = "card",
  actionPlacement = "below",
}: BookingStatusFlowProps) {
  const current = jobFlowIndex(status)
  const next = nextJobAdvance(status)
  const waitingPayment = status === "ACCEPTED"

  if (variant === "inline") {
    return (
      <div className="bsf bsf--inline">
        <HorizontalSteps current={current} size="sm" />

        {waitingPayment ? (
          <p className="bsf__wait bsf__wait--sm">
            <WrenchIcon size={13} aria-hidden />
            Waiting for payment
          </p>
        ) : null}

        {!readOnly && actionPlacement === "below" ? (
          <JobAdvanceButton
            status={status}
            busy={busy}
            onAdvance={onAdvance}
          />
        ) : null}

        {current >= 3 ? (
          <p className="bsf__done bsf__done--sm">Job completed</p>
        ) : null}
      </div>
    )
  }

  return (
    <section className="bsf dash-card bd-page__card">
      <div className="bsf__head">
        <h2 className="dash-card__title">Job status</h2>
        <p className="bsf__sub">
          {readOnly
            ? current >= 3
              ? "This job is complete."
              : "Follow along as your technician updates the visit."
            : waitingPayment
              ? "Waiting for customer payment before you start the visit."
              : next
                ? "Move the job forward one step at a time."
                : "This job is complete."}
        </p>
      </div>

      <HorizontalSteps current={current} showHints size="md" />

      {!readOnly && waitingPayment ? (
        <p className="bsf__wait">
          <WrenchIcon size={15} aria-hidden />
          Status updates unlock after the customer pays.
        </p>
      ) : null}

      {!readOnly && next ? (
        <button
          type="button"
          className="bsf__cta bsf__cta--center"
          disabled={busy || waitingPayment}
          onClick={() => onAdvance(next)}
        >
          {busy ? (
            <>
              <LoaderCircleIcon size={16} className="animate-spin" />
              Updating…
            </>
          ) : (
            advanceActionLabel(next)
          )}
        </button>
      ) : current >= 3 ? (
        <p className="bsf__done">All steps finished for this booking.</p>
      ) : null}
    </section>
  )
}
