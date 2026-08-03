import type { ReactNode } from "react"
import Link from "next/link"

export default function LegalPage({
  title,
  eyebrow,
  updated,
  children,
}: {
  title: string
  eyebrow: string
  updated?: string
  children: ReactNode
}) {
  return (
    <div className="bg-[#F7F9FB]">
      <section className="border-b border-[#E2E8ED] bg-[#0E141B] px-4 py-12 text-center sm:px-6 sm:py-14">
        <p
          className="mb-2 text-[0.72rem] font-semibold tracking-[0.14em] text-[#9AABB8] uppercase"
          style={{ fontFamily: "var(--font-dispatch-mono), monospace" }}
        >
          {eyebrow}
        </p>
        <h1
          className="text-[2rem] leading-none tracking-tight text-white sm:text-[2.6rem]"
          style={{ fontFamily: "var(--font-dispatch-display), sans-serif" }}
        >
          {title}
        </h1>
        {updated ? (
          <p className="mt-3 text-sm text-[#9AABB8]">Last updated: {updated}</p>
        ) : null}
      </section>

      <article
        className="mx-auto w-full max-w-[760px] px-4 py-10 sm:px-6 sm:py-12"
        style={{ fontFamily: "var(--font-dispatch-sans), sans-serif" }}
      >
        <div className="rounded-[16px] border border-[#E2E8ED] bg-white px-5 py-7 shadow-[0_10px_28px_rgba(14,20,27,0.06)] sm:px-8 sm:py-9">
          {children}
        </div>

        <p className="mt-8 text-center text-sm text-[#6E8091]">
          Questions?{" "}
          <a
            href="mailto:support@fixitnow.com"
            className="font-medium text-[#0E141B] underline-offset-2 hover:text-[#0d9b70] hover:underline"
          >
            support@fixitnow.com
          </a>{" "}
          ·{" "}
          <Link
            href="/"
            className="font-medium text-[#0E141B] underline-offset-2 hover:text-[#0d9b70] hover:underline"
          >
            Back home
          </Link>
        </p>
      </article>
    </div>
  )
}

export function LegalSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="mb-7 last:mb-0">
      <h2 className="mb-2.5 text-[1.05rem] font-semibold tracking-tight text-[#0E141B]">
        {title}
      </h2>
      <div className="space-y-3 text-[0.95rem] leading-[1.65] text-[#4A5C6B]">
        {children}
      </div>
    </section>
  )
}
