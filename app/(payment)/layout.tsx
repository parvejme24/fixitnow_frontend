import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Payment — FixItNow",
}

/** Bare shell — no navbar / footer (SurjoPay sandbox + status pages). */
export default function PaymentLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <div className="min-h-dvh w-full bg-[#f7f9fb]">{children}</div>
}
