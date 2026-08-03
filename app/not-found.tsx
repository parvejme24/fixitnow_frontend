import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeftIcon, HomeIcon, SearchIcon, WrenchIcon } from "lucide-react"

import Footer from "@/app/components/Shared/Footer/Footer"
import Navbar from "@/app/components/Shared/Navbar/Navbar"

export const metadata: Metadata = {
  title: "Page not found — FixItNow",
  description: "This page does not exist or may have moved.",
}

export default function NotFound() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-[#F7F9FB]">
      <Navbar />
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 sm:px-6">
        <div className="w-full max-w-lg text-center">
          <div
            className="mx-auto mb-6 flex size-16 items-center justify-center rounded-[14px] bg-[#0E141B] ring-1 ring-[#2A3642]"
            aria-hidden
          >
            <WrenchIcon className="size-7 text-[#FFC93C]" strokeWidth={2.25} />
          </div>

          <p
            className="mb-2 text-[0.72rem] font-semibold tracking-[0.14em] text-[#9AABB8] uppercase"
            style={{ fontFamily: "var(--font-dispatch-mono), monospace" }}
          >
            Error 404
          </p>

          <h1
            className="mb-3 text-[2.4rem] leading-none tracking-tight text-[#0E141B] sm:text-[3rem]"
            style={{ fontFamily: "var(--font-dispatch-display), sans-serif" }}
          >
            Page not found
          </h1>

          <p
            className="mx-auto mb-8 max-w-md text-[1rem] leading-relaxed text-[#4A5C6B]"
            style={{ fontFamily: "var(--font-dispatch-sans), sans-serif" }}
          >
            This route does not exist, or the link may be outdated. Head home or
            browse services to keep booking.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-[#FFC93C] px-5 text-sm font-semibold text-[#0E141B] transition-colors hover:bg-[#FFD45C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC93C] focus-visible:ring-offset-2"
            >
              <HomeIcon size={16} aria-hidden />
              Go home
            </Link>
            <Link
              href="/services"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] border-[1.5px] border-[#E2E8ED] bg-white px-5 text-sm font-semibold text-[#0E141B] transition-colors hover:border-[#9AABB8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC93C] focus-visible:ring-offset-2"
            >
              <SearchIcon size={16} aria-hidden />
              Browse services
            </Link>
            <Link
              href="/technicians"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] border-[1.5px] border-transparent px-4 text-sm font-medium text-[#4A5C6B] transition-colors hover:text-[#0E141B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC93C] focus-visible:ring-offset-2"
            >
              <ArrowLeftIcon size={16} aria-hidden />
              Technicians
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
