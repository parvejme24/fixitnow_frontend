"use client"

import Link from "next/link"
import { WrenchIcon } from "lucide-react"

import { cn } from "@/lib/utils"

type BrandLogoProps = {
  onNavigate?: () => void
  showTag?: boolean
  className?: string
  ringOffsetClassName?: string
}

export default function BrandLogo({
  onNavigate,
  showTag = false,
  className,
  ringOffsetClassName = "focus-visible:ring-offset-[#0E141B]",
}: BrandLogoProps) {
  return (
    <Link
      href="/"
      onClick={onNavigate}
      className={cn(
        "group/logo flex min-w-0 items-center gap-2.5 text-inherit no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC93C] focus-visible:ring-offset-2",
        ringOffsetClassName,
        className
      )}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-[6px] bg-[#131B24] ring-1 ring-[#2A3642] transition-transform duration-300 ease-out motion-safe:group-hover/logo:rotate-12 motion-reduce:transition-none">
        <WrenchIcon className="size-4 text-[#FFC93C]" strokeWidth={2.25} />
      </span>

      <span className="flex min-w-0 flex-col leading-none">
        <span
          className="truncate text-[1.15rem] tracking-tight text-white sm:text-[1.25rem]"
          style={{ fontFamily: "var(--font-dispatch-display), sans-serif" }}
        >
          Fix<span className="text-[#FFC93C]">It</span>Now
        </span>
        {showTag && (
          <span
            className="mt-0.5 hidden text-[9px] tracking-[0.18em] text-[#6B7F8C] uppercase sm:block"
            style={{ fontFamily: "var(--font-dispatch-mono), monospace" }}
          >
            Dhaka · Live
          </span>
        )}
      </span>
    </Link>
  )
}
