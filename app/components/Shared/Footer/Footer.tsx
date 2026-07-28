"use client"

import Link from "next/link"
import { motion, useReducedMotion, type Transition } from "framer-motion"

import BrandLogo from "@/app/components/Shared/BrandLogo"

const serviceLinks = [
  { label: "Plumbing", href: "/services?cat=c1" },
  { label: "Electrical", href: "/services?cat=c2" },
  { label: "AC & Cooling", href: "/services?cat=c3" },
  { label: "Appliance Repair", href: "/services?cat=c4" },
  { label: "Carpentry", href: "/services?cat=c5" },
] as const

const technicianLinks = [
  { label: "Join the network", href: "/auth/register" },
  { label: "Technician dashboard", href: "/technicians" },
  { label: "Manage bookings", href: "/bookings" },
  { label: "Admin console", href: "/auth/login" },
] as const

const companyLinks = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Safety standards", href: "/#safety" },
  { label: "Contact", href: "/#contact" },
] as const

const columns = [
  { heading: "Services", links: serviceLinks },
  { heading: "For technicians", links: technicianLinks },
  { heading: "Company", links: companyLinks },
] as const

const fastTransition: Transition = {
  duration: 0.18,
  ease: [0.22, 0.68, 0.32, 1],
}

function FooterLink({ href, label }: { href: string; label: string }) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      className="w-fit"
      whileHover={reduceMotion ? undefined : { x: 4 }}
      transition={fastTransition}
    >
      <Link
        href={href}
        className="block w-fit text-[0.89rem] text-[#9AABB8] no-underline transition-colors duration-[180ms] ease-out hover:text-[#FFC93C] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#FFC93C]"
      >
        {label}
      </Link>
    </motion.div>
  )
}

function LivePulseDot() {
  const reduceMotion = useReducedMotion()

  if (reduceMotion) {
    return (
      <span
        aria-hidden="true"
        className="size-1.5 shrink-0 rounded-full bg-current"
      />
    )
  }

  return (
    <motion.span
      aria-hidden="true"
      className="size-1.5 shrink-0 rounded-full bg-current"
      animate={{
        boxShadow: [
          "0 0 0 0 rgba(18,184,134,0.6)",
          "0 0 0 6px rgba(18,184,134,0)",
          "0 0 0 0 rgba(18,184,134,0.6)",
        ],
      }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
    />
  )
}

export default function Footer() {
  return (
    <footer
      aria-label="Site"
      className="w-full bg-[#131B24] text-[#9AABB8]"
      style={{ fontFamily: "var(--font-dispatch-sans), system-ui, sans-serif" }}
    >
      <div
        aria-hidden="true"
        className="h-2.5 w-full rounded-none bg-[repeating-linear-gradient(45deg,#FFC93C_0_14px,#0E141B_14px_28px)] [background-size:39.6px_39.6px]"
      />

      <div className="mx-auto w-full max-w-[1240px] px-[18px] min-[701px]:px-6">
        <div className="grid grid-cols-1 gap-[26px] py-14 pb-10 min-[701px]:grid-cols-2 min-[701px]:gap-[34px] min-[1081px]:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div>
            <BrandLogo ringOffsetClassName="focus-visible:ring-offset-[#131B24]" />

            <p className="mt-3.5 max-w-[34ch] text-[0.9rem] leading-[1.55] text-[#9AABB8]">
              Book a verified technician for a fixed time slot. They show up, or
              you don&apos;t pay.
            </p>

            <div
              className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-[#DDF6EE] px-2.5 py-1 text-[0.68rem] font-semibold tracking-[0.07em] text-[#07785A] uppercase"
              role="status"
              aria-live="polite"
            >
              <LivePulseDot />
              <span>1,204 jobs this week</span>
            </div>
          </div>

          {columns.map((column) => (
            <nav key={column.heading} aria-label={column.heading}>
              <h4
                className="mb-3.5 text-[0.7rem] font-semibold tracking-[0.16em] text-[#FFC93C] uppercase"
                style={{
                  fontFamily:
                    "var(--font-hivis-mono), IBM Plex Mono, monospace",
                }}
              >
                {column.heading}
              </h4>
              <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                {column.links.map((link) => (
                  <li key={`${column.heading}-${link.href}`}>
                    <FooterLink href={link.href} label={link.label} />
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div
          className="flex flex-wrap items-center justify-between gap-3.5 border-t border-[#26333F] py-[18px] text-[0.8rem] text-[#6E8091]"
          style={{
            fontFamily: "var(--font-hivis-mono), IBM Plex Mono, monospace",
          }}
        >
          <p className="m-0">© 2026 FixItNow · Dhaka, Bangladesh</p>
          <p className="m-0">Verified techs · Fixed slots · Dhaka coverage</p>
        </div>
      </div>
    </footer>
  )
}
