"use client"

import { useId } from "react"
import { ChartAreaIcon, ChartColumnIcon } from "lucide-react"

import { formatTaka } from "@/app/lib/dashboard-data"
import type { EarnPoint } from "@/lib/bookings/earn-series"

export type EarnRange = "7d" | "30d" | "months"
export type EarnChartType = "bar" | "area"
export type { EarnPoint }

export function EarningsChartCard({
  title,
  subtitle,
  range,
  chartType,
  onRangeChange,
  onChartTypeChange,
  series,
  maxValue,
  barsOn,
  className = "",
}: {
  title: string
  subtitle: string
  range: EarnRange
  chartType: EarnChartType
  onRangeChange: (range: EarnRange) => void
  onChartTypeChange: (type: EarnChartType) => void
  series: EarnPoint[]
  maxValue: number
  barsOn: boolean
  className?: string
}) {
  const gradientId = useId()
  const n = series.length
  const w = 100
  const h = 100
  const coords = series.map((p, i) => {
    const x = n <= 1 ? w / 2 : (i / (n - 1)) * w
    const y = h - (Math.max(p.value, 0) / maxValue) * (h - 6) - 2
    return { x, y }
  })
  const line = coords
    .map(
      (c, i) =>
        `${i === 0 ? "M" : "L"}${c.x.toFixed(2)},${c.y.toFixed(2)}`
    )
    .join(" ")
  const areaPath = `${line} L${w},${h} L0,${h} Z`
  const labelStep = Math.max(1, Math.ceil(n / 7))

  return (
    <section className={`dash-card${className ? ` ${className}` : ""}`}>
      <div className="dash-card__head earn-chart__head">
        <div>
          <h2 className="dash-card__title">{title}</h2>
          <p className="dash-card__sub" style={{ margin: "4px 0 0" }}>
            {subtitle}
          </p>
        </div>
        <div className="earn-chart__tools">
          <div className="earn-seg" role="group" aria-label="Time range">
            {(
              [
                { id: "7d", label: "7 days" },
                { id: "30d", label: "30 days" },
                { id: "months", label: "Months" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={`earn-seg__btn${range === opt.id ? " is-active" : ""}`}
                onClick={() => onRangeChange(opt.id)}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="earn-seg" role="group" aria-label="Chart type">
            <button
              type="button"
              className={`earn-seg__btn${chartType === "bar" ? " is-active" : ""}`}
              onClick={() => onChartTypeChange("bar")}
              aria-label="Bar chart"
              title="Bar chart"
            >
              <ChartColumnIcon size={15} aria-hidden />
            </button>
            <button
              type="button"
              className={`earn-seg__btn${chartType === "area" ? " is-active" : ""}`}
              onClick={() => onChartTypeChange("area")}
              aria-label="Area chart"
              title="Area chart"
            >
              <ChartAreaIcon size={15} aria-hidden />
            </button>
          </div>
        </div>
      </div>

      {chartType === "bar" ? (
        <div
          className={`chart chart--sm${range === "30d" ? " chart--dense" : ""}`}
        >
          {series.map((m) => (
            <div key={m.key} className="chart__col">
              <div
                className={`chart__bar${barsOn ? " is-on" : ""}`}
                style={{
                  ["--h" as string]: `${(m.value / maxValue) * 100}%`,
                }}
                data-tip={formatTaka(m.value)}
              />
              <span className="chart__label">{m.label}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="chart-area">
          <svg
            className="chart-area__svg"
            viewBox={`0 0 ${w} ${h}`}
            preserveAspectRatio="none"
            role="img"
            aria-label={`${title} area chart`}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#12b886" stopOpacity="0.38" />
                <stop offset="100%" stopColor="#12b886" stopOpacity="0.03" />
              </linearGradient>
            </defs>
            <path d={areaPath} fill={`url(#${gradientId})`} />
            <path
              d={line || `M0,${h}`}
              fill="none"
              stroke="#0d9b70"
              strokeWidth="1.75"
              vectorEffect="non-scaling-stroke"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </svg>
          <div className="chart-area__labels">
            {series.map((p, i) => {
              const show = i === 0 || i === n - 1 || i % labelStep === 0
              return (
                <span key={p.key} title={formatTaka(p.value)}>
                  {show ? p.label : ""}
                </span>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}
