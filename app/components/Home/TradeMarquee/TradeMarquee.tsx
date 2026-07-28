import type { ReactNode } from "react"

import "./TradeMarquee.css"

type Trade = {
  key: string
  label: string
  icon: ReactNode
}

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0 text-[#FFC93C]"
    >
      {children}
    </svg>
  )
}

const trades: Trade[] = [
  {
    key: "pipe",
    label: "Plumbing",
    icon: (
      <Icon>
        <path d="M6 8h6a2 2 0 0 1 2 2v2" />
        <path d="M10 8V5a1 1 0 0 1 1-1h2" />
        <path d="M14 12v5a2 2 0 0 0 2 2h2" />
        <path d="M4 8h2" />
        <path d="M18 19v2" />
      </Icon>
    ),
  },
  {
    key: "bolt",
    label: "Electrical",
    icon: (
      <Icon>
        <path d="M13 2 4.5 13.5h6L9 22l10-13h-6L13 2z" />
      </Icon>
    ),
  },
  {
    key: "snow",
    label: "AC & Cooling",
    icon: (
      <Icon>
        <path d="M12 2v20" />
        <path d="m4.9 7 14.2 10" />
        <path d="m19.1 7-14.2 10" />
        <path d="m8 4 4 3 4-3" />
        <path d="m8 20 4-3 4 3" />
        <path d="m3.5 10.5 3.5-1.5-1.5-3.5" />
        <path d="m17 18.5 1.5-3.5 3.5-1.5" />
        <path d="m3.5 13.5 3.5 1.5-1.5 3.5" />
        <path d="m17 5.5 1.5 3.5 3.5 1.5" />
      </Icon>
    ),
  },
  {
    key: "chip",
    label: "Appliance Repair",
    icon: (
      <Icon>
        <rect x="7" y="7" width="10" height="10" rx="1" />
        <path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3" />
        <path d="M10 10h4v4h-4z" />
      </Icon>
    ),
  },
  {
    key: "saw",
    label: "Carpentry",
    icon: (
      <Icon>
        <path d="M3 18 14 4l3 3-4 4 2 2-2 2-2-2-4 4-4-3z" />
        <path d="m14 7 3 3" />
      </Icon>
    ),
  },
  {
    key: "brush",
    label: "Painting",
    icon: (
      <Icon>
        <path d="m9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08" />
        <path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z" />
      </Icon>
    ),
  },
  {
    key: "spray",
    label: "Deep Cleaning",
    icon: (
      <Icon>
        <path d="M3 3h.01M7 5h.01M11 3h.01" />
        <path d="M10 10V6a1 1 0 0 1 1-1h1" />
        <path d="M8 10h8l-1 11H9L8 10z" />
        <path d="M9 14h6" />
      </Icon>
    ),
  },
  {
    key: "bug",
    label: "Pest Control",
    icon: (
      <Icon>
        <path d="m8 2 1.88 1.88" />
        <path d="M14.12 3.88 16 2" />
        <path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1" />
        <path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6" />
        <path d="M12 20v-9" />
        <path d="M6.53 9C4.6 8.8 3 7.1 3 5" />
        <path d="M6 13H2" />
        <path d="M3 21c0-2.1 1.7-3.9 3.8-4" />
        <path d="M20.97 5c0 2.1-1.6 3.8-3.5 4" />
        <path d="M22 13h-4" />
        <path d="M17.2 17c2.1.1 3.8 1.9 3.8 4" />
      </Icon>
    ),
  },
]

function TradeItem({ trade }: { trade: Trade }) {
  return (
    <div className="flex items-center gap-[11px] whitespace-nowrap">
      {trade.icon}
      <span
        className="text-[1.02rem] font-extrabold tracking-[-0.01em] text-[#6E8091] uppercase"
        style={{
          fontFamily: "var(--font-dispatch-display), Archivo Black, sans-serif",
        }}
      >
        {trade.label}
      </span>
    </div>
  )
}

export default function TradeMarquee() {
  const loop = [...trades, ...trades]

  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee__track">
        {loop.map((trade, index) => (
          <TradeItem key={`${trade.key}-${index}`} trade={trade} />
        ))}
      </div>
    </div>
  )
}
