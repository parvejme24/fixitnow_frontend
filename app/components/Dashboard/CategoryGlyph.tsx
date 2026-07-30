"use client"

import { iconFromSlug } from "@/app/lib/admin-data"

const LEGACY_PATHS: Record<string, string> = {
  pipe: "M6 4h4v4H6zm8 0h4v4h-4zM8 8v4h8V8M10 12v8m4-8v8",
  bolt: "M13 2 4 14h7l-1 8 9-12h-7l1-8z",
  snow: "M12 2v20M4.9 6.5l14.2 11M4.9 17.5l14.2-11M7 4l1.5 2.5M17 4l-1.5 2.5M7 20l1.5-2.5M17 20l-1.5-2.5",
  chip: "M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3M7 7h10v10H7z",
  saw: "M4 20 20 4M8 16l2 2M14 10l2 2M6 18l-2 2 3-1",
  brush: "M9.5 3.5 14 8l-6 6-2.5-2.5 4-8zM4 16l4 4 2-2-4-4-2 2z",
  spray: "M8 4h4v4H8zM10 8v3M6 11h8l1 9H5l1-9zM14 5h4v2h-4",
  bug: "M8 9V7a4 4 0 0 1 8 0v2M5 13h14M7 13v5a3 3 0 0 0 3 3h4a3 3 0 0 0 3-3v-5M4 9l3 2M20 9l-3 2M4 17l3-1M20 17l-3-1",
  tools: "M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4L15 12l-2.3-2.3 1.9-3.4z",
  box: "M21 8H3l2-4h14l2 4zM3 8v12h18V8M12 8v12",
  home: "M3 11 12 3l9 8v10H3V11zM9 21v-8h6v8",
  shield: "M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3z",
}

const LEGACY_EMOJI: Record<string, string> = {
  pipe: "🔧",
  bolt: "⚡",
  snow: "❄️",
  chip: "🔌",
  saw: "🪚",
  brush: "🎨",
  spray: "🧹",
  bug: "🐛",
  tools: "🛠️",
  box: "📦",
  home: "🏠",
  shield: "🛡️",
}

function isEmoji(value: string) {
  return /\p{Extended_Pictographic}/u.test(value)
}

export default function CategoryGlyph({
  icon,
  size = 22,
}: {
  icon: string
  size?: number
}) {
  const resolved = LEGACY_EMOJI[icon] || (isEmoji(icon) ? icon : iconFromSlug(icon))

  if (isEmoji(resolved) || LEGACY_EMOJI[icon]) {
    return (
      <span
        aria-hidden
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: Math.round(size * 0.92),
          lineHeight: 1,
          width: size,
          height: size,
        }}
      >
        {resolved}
      </span>
    )
  }

  const path = LEGACY_PATHS[icon]
  if (!path) {
    return (
      <span style={{ fontSize: size * 0.9 }} aria-hidden>
        🔧
      </span>
    )
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={path} />
    </svg>
  )
}
