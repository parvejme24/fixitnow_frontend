"use client"

import Link from "next/link"
import { MailIcon, MapPinIcon, PhoneIcon } from "lucide-react"
import { motion, useReducedMotion } from "framer-motion"

import BrandLogo from "@/app/components/Shared/BrandLogo"

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

const contactClass =
  "inline-flex items-center gap-2.5 text-[0.9rem] text-[#9AABB8] no-underline transition-colors hover:text-[#FFC93C] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#FFC93C]"

const iconWrapClass =
  "inline-flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-[#1C2733] text-[#FFC93C]"

const bottomLinks = [
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "FAQ", href: "/faq" },
] as const

const MAP_EMBED_SRC =
  "https://www.google.com/maps?q=Banani,+Dhaka+1213,+Bangladesh&output=embed"

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

      <div className="mx-auto w-full max-w-[1100px] px-[18px] py-14 pb-10 min-[701px]:px-6">
        <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-2 lg:gap-10">
          <div className="flex flex-col text-left">
            <BrandLogo ringOffsetClassName="focus-visible:ring-offset-[#131B24]" />

            <p className="mt-3.5 max-w-[42ch] text-[0.9rem] leading-[1.55] text-[#9AABB8]">
              FixItNow helps you book verified home technicians in Dhaka on
              fixed time slots. Clear starting prices, confirmed availability,
              and no charge if the job never starts.
            </p>

            <div
              className="mt-6 inline-flex w-fit items-center gap-1.5 rounded-full bg-[#DDF6EE] px-2.5 py-1 text-[0.68rem] font-semibold tracking-[0.07em] text-[#07785A] uppercase"
              role="status"
              aria-live="polite"
            >
              <LivePulseDot />
              <span>Dhaka · live booking</span>
            </div>

            <div className="mt-8 flex flex-col items-start gap-3.5">
              <a href="mailto:support@fixitnow.com" className={contactClass}>
                <span className={iconWrapClass}>
                  <MailIcon size={15} aria-hidden />
                </span>
                support@fixitnow.com
              </a>

              <a href="tel:+8801712345678" className={contactClass}>
                <span className={iconWrapClass}>
                  <PhoneIcon size={15} aria-hidden />
                </span>
                +880 1712-345678
              </a>

              <p className={`m-0 ${contactClass}`}>
                <span className={iconWrapClass}>
                  <MapPinIcon size={15} aria-hidden />
                </span>
                Banani, Dhaka 1213
              </p>
            </div>
          </div>

          <div className="flex min-h-[240px] flex-col overflow-hidden rounded-[14px] border border-[#26333F] bg-[#1C2733] shadow-[0_12px_32px_rgba(0,0,0,0.28)] lg:min-h-[280px]">
            <div className="flex items-center gap-2 border-b border-[#26333F] px-3.5 py-2.5">
              <span className={iconWrapClass}>
                <MapPinIcon size={15} aria-hidden />
              </span>
              <p className="m-0 text-[0.82rem] text-[#9AABB8]">
                Banani, Dhaka 1213
              </p>
            </div>
            <iframe
              title="FixItNow main branch map — Banani, Dhaka"
              src={MAP_EMBED_SRC}
              className="h-full min-h-[220px] w-full flex-1 border-0 lg:min-h-[240px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>
      </div>

      <div
        className="mx-auto flex w-full max-w-[1240px] flex-col items-center justify-center gap-3 border-t border-[#26333F] px-[18px] py-[18px] text-center text-[0.8rem] text-[#6E8091] min-[701px]:px-6 sm:flex-row sm:justify-between"
        style={{
          fontFamily: "var(--font-hivis-mono), IBM Plex Mono, monospace",
        }}
      >
        <p className="m-0">© 2026 FixItNow</p>
        <nav
          aria-label="Legal"
          className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2"
        >
          {bottomLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[#6E8091] no-underline transition-colors hover:text-[#FFC93C]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  )
}
