"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { useReducedMotion } from "framer-motion"
import { SearchIcon, StarIcon } from "lucide-react"

import {
  AREAS,
  CATEGORIES,
  TECHNICIANS,
  categoryName,
  formatTaka,
  technicianCategoryCounts,
  type CategoryId,
  type Technician,
} from "@/app/lib/catalogue"
import "../../Services/BrowseServices/BrowseServices.css"

type SortKey = "pop" | "rating" | "price-asc" | "price-desc"

const RATING_CHIPS = [
  { label: "Any", value: 0 },
  { label: "4.5+", value: 4.5 },
  { label: "4.7+", value: 4.7 },
  { label: "4.9+", value: 4.9 },
] as const

function useDebounced<T>(value: T, delay = 220) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(id)
  }, [value, delay])
  return debounced
}

function filterTechnicians(
  q: string,
  cats: CategoryId[],
  area: string,
  minRating: number,
  budget: number,
  today: boolean,
  sort: SortKey
) {
  const query = q.trim().toLowerCase()
  let list = TECHNICIANS.filter((t) => {
    const hay = `${t.name} ${t.trade} ${t.skills.join(" ")}`.toLowerCase()
    if (query && !hay.includes(query)) return false
    if (cats.length && !t.cats.some((c) => cats.includes(c))) return false
    if (area && t.area !== area) return false
    if (t.rating < minRating) return false
    if (t.rate > budget) return false
    if (today && !t.online) return false
    return true
  })

  list = [...list].sort((a, b) => {
    if (sort === "rating") return b.rating - a.rating
    if (sort === "price-asc") return a.rate - b.rate
    if (sort === "price-desc") return b.rate - a.rate
    return b.jobs - a.jobs
  })
  return list
}

function TechCard({ tech, index }: { tech: Technician; index: number }) {
  return (
    <Link
      href={`/technician?id=${tech.id}`}
      className="tech-card browse-reveal"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="tech-card__top">
        <div className="tech-card__avatar">
          {tech.initials}
          {tech.online && <span className="tech-card__online" />}
        </div>
        <div>
          <h3 className="tech-card__name">{tech.name}</h3>
          <p className="tech-card__trade">
            {tech.trade} · {tech.area}
          </p>
        </div>
      </div>
      <div className="tech-card__skills">
        {tech.skills.slice(0, 3).map((skill) => (
          <span key={skill}>{skill}</span>
        ))}
      </div>
      <p className="tech-card__rating">
        <StarIcon size={14} className="inline" /> {tech.rating.toFixed(1)} ·{" "}
        {formatTaka(tech.rate)}/visit
      </p>
      <div className="tech-card__stats">
        <div>
          <b>{tech.jobs}</b>
          <span>Jobs</span>
        </div>
        <div>
          <b>{tech.exp}y</b>
          <span>Exp.</span>
        </div>
        <div>
          <b>{tech.online ? "Now" : "Sun"}</b>
          <span>Free</span>
        </div>
      </div>
    </Link>
  )
}

export default function BrowseTechnicians() {
  const searchParams = useSearchParams()
  const reduceMotion = useReducedMotion() ?? false
  const counts = useMemo(() => technicianCategoryCounts(), [])

  const initialCat = searchParams.get("cat") as CategoryId | null

  const [q, setQ] = useState("")
  const debouncedQ = useDebounced(q, 220)
  const [cats, setCats] = useState<CategoryId[]>(
    initialCat && CATEGORIES.some((c) => c.id === initialCat) ? [initialCat] : []
  )
  const [area, setArea] = useState("")
  const [minRating, setMinRating] = useState(0)
  const [budget, setBudget] = useState(4500)
  const [today, setToday] = useState(false)
  const [sort, setSort] = useState<SortKey>("pop")
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ title: string; message: string } | null>(
    null
  )

  useEffect(() => {
    const id = window.setTimeout(() => setLoading(false), 550)
    return () => window.clearTimeout(id)
  }, [])

  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(() => setToast(null), 3200)
    return () => window.clearTimeout(id)
  }, [toast])

  const technicians = useMemo(
    () =>
      filterTechnicians(
        debouncedQ,
        cats,
        area,
        minRating,
        budget,
        today,
        sort
      ),
    [debouncedQ, cats, area, minRating, budget, today, sort]
  )

  const toggleCat = (id: CategoryId) => {
    setCats((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  const clearAll = () => {
    setQ("")
    setCats([])
    setArea("")
    setMinRating(0)
    setBudget(4500)
    setToday(false)
    setToast({
      title: "Filters cleared",
      message: "Showing all technicians again.",
    })
  }

  const activeChips: { key: string; label: string; onRemove: () => void }[] = []
  for (const id of cats) {
    activeChips.push({
      key: `cat-${id}`,
      label: categoryName(id),
      onRemove: () => setCats((prev) => prev.filter((c) => c !== id)),
    })
  }
  if (area) {
    activeChips.push({
      key: "area",
      label: area,
      onRemove: () => setArea(""),
    })
  }
  if (minRating > 0) {
    activeChips.push({
      key: "rating",
      label: `${minRating}+`,
      onRemove: () => setMinRating(0),
    })
  }
  if (budget < 4500) {
    activeChips.push({
      key: "budget",
      label: `Under ${formatTaka(budget)}`,
      onRemove: () => setBudget(4500),
    })
  }
  if (today) {
    activeChips.push({
      key: "today",
      label: "Available today",
      onRemove: () => setToday(false),
    })
  }

  const resultCount = technicians.length
  const countLabel = `${resultCount} technician${resultCount === 1 ? "" : "s"}`

  return (
    <div className="browse-page">
      <section className="browse-hero">
        <div className="browse-hero__inner">
          <p className="browse-crumbs">
            <Link href="/">Home</Link>
            {" / "}
            <strong>Technicians</strong>
          </p>
          <h1>Meet the crew</h1>
          <p>
            Filter by trade, area, rating and visit fee. Results update as you
            go.
          </p>
          <div className="browse-search">
            <SearchIcon />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder='Try “Shamim” or “wiring” or “Gulshan”'
              aria-label="Search technicians"
            />
          </div>
        </div>
      </section>

      <section className="browse">
        <div className="browse-mobile-filters">
          <button
            type="button"
            className="btn-ghost"
            onClick={() => setFiltersOpen((v) => !v)}
          >
            Filters
          </button>
        </div>

        <aside
          className={`browse-filters${filtersOpen ? "" : " is-collapsed"}`}
        >
          <div className="browse-filters__head">
            <span>Refine</span>
            <button
              type="button"
              className="browse-filters__clear"
              onClick={clearAll}
            >
              Clear all
            </button>
          </div>

          <div className="browse-block">
            <h3>Trade</h3>
            {CATEGORIES.map((cat) => (
              <label key={cat.id} className="check">
                <input
                  type="checkbox"
                  checked={cats.includes(cat.id)}
                  onChange={() => toggleCat(cat.id)}
                />
                <span>{cat.name}</span>
                <em>{counts[cat.id]}</em>
              </label>
            ))}
          </div>

          <div className="browse-block">
            <h3>Area in Dhaka</h3>
            <select
              className="browse-select"
              value={area}
              onChange={(e) => setArea(e.target.value)}
            >
              <option value="">Anywhere in Dhaka</option>
              {AREAS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          <div className="browse-block">
            <h3>Minimum rating</h3>
            <div className="chip-row">
              {RATING_CHIPS.map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  className={`chip${minRating === chip.value ? " is-active" : ""}`}
                  onClick={() => setMinRating(chip.value)}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          <div className="browse-block">
            <h3>Visit fee ceiling</h3>
            <input
              className="browse-range"
              type="range"
              min={400}
              max={4500}
              step={100}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
            />
            <div className="budget-labels">
              <span>৳400</span>
              <strong>{formatTaka(budget)}</strong>
            </div>
          </div>

          <div className="browse-block">
            <div className="switch-row">
              <span>Available today only</span>
              <button
                type="button"
                className={`switch${today ? " is-on" : ""}`}
                aria-pressed={today}
                onClick={() => setToday((v) => !v)}
              >
                <i />
              </button>
            </div>
          </div>
        </aside>

        <div>
          <div className="result-bar">
            <div className="result-bar__left">
              <span className="result-count">{countLabel}</span>
            </div>

            <div className="result-bar__right">
              <select
                className="browse-select"
                style={{ width: "auto" }}
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
              >
                <option value="pop">Most booked</option>
                <option value="rating">Top rated</option>
                <option value="price-asc">Fee: low to high</option>
                <option value="price-desc">Fee: high to low</option>
              </select>
            </div>
          </div>

          {activeChips.length > 0 && (
            <div className="active-chips">
              {activeChips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  className="chip is-removable"
                  onClick={chip.onRemove}
                >
                  {chip.label} ✕
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="skeleton-grid tech-grid" aria-hidden="true">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton-card">
                  <div className="skeleton-card__body" style={{ paddingTop: 18 }}>
                    <div className="skeleton-card__line short" />
                    <div className="skeleton-card__line" />
                    <div className="skeleton-card__line" />
                    <div className="skeleton-card__line short" />
                  </div>
                </div>
              ))}
            </div>
          ) : resultCount === 0 ? (
            <div className="browse-empty">
              <div className="browse-empty__icon">
                <SearchIcon size={26} />
              </div>
              <h3>No matches at these filters</h3>
              <p>
                Try clearing filters. Network has {TECHNICIANS.length}{" "}
                technicians.
              </p>
              <button type="button" className="btn-ghost" onClick={clearAll}>
                Clear filters
              </button>
            </div>
          ) : (
            <div className="tech-grid">
              {technicians.map((tech, index) => (
                <TechCard
                  key={tech.id}
                  tech={tech}
                  index={reduceMotion ? 0 : index}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {toast && (
        <div className="browse-toast" role="status">
          <strong>{toast.title}</strong>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  )
}
