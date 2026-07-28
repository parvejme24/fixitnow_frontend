"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { useReducedMotion } from "framer-motion"
import {
  Grid2X2Icon,
  ListIcon,
  SearchIcon,
  WrenchIcon,
} from "lucide-react"

import {
  CATEGORIES,
  SERVICES,
  categoryCounts,
  categoryName,
  formatTaka,
  type CategoryId,
  type Service,
} from "@/app/lib/catalogue"
import "./BrowseServices.css"

type View = "grid" | "list"
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

function stars(rating: number) {
  return `${rating.toFixed(1)} ★`
}

function filterServices(
  q: string,
  cats: CategoryId[],
  minRating: number,
  budget: number,
  sort: SortKey
) {
  const query = q.trim().toLowerCase()
  let list = SERVICES.filter((s) => {
    const hay = `${s.title} ${s.desc} ${categoryName(s.cat)}`.toLowerCase()
    if (query && !hay.includes(query)) return false
    if (cats.length && !cats.includes(s.cat)) return false
    if (s.rating < minRating) return false
    if (s.price > budget) return false
    return true
  })

  list = [...list].sort((a, b) => {
    if (sort === "rating") return b.rating - a.rating
    if (sort === "price-asc") return a.price - b.price
    if (sort === "price-desc") return b.price - a.price
    return b.reviews - a.reviews
  })
  return list
}

function ServiceCard({ service, index }: { service: Service; index: number }) {
  return (
    <Link
      href={`/services/${service.id}`}
      className="svc-card browse-reveal"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="svc-card__media">
        {service.tag && <span className="svc-card__badge">{service.tag}</span>}
        <span className="svc-card__glyph">
          <WrenchIcon size={42} />
        </span>
        <span className="svc-card__price">{formatTaka(service.price)}</span>
      </div>
      <div className="svc-card__body">
        <p className="svc-card__cat">{categoryName(service.cat)}</p>
        <h3 className="svc-card__title">{service.title}</h3>
        <p className="svc-card__desc">{service.desc}</p>
        <div className="svc-card__foot">
          <span>
            {stars(service.rating)} · {service.reviews}
          </span>
          <span>{service.dur}</span>
        </div>
      </div>
    </Link>
  )
}

function ServiceRow({ service, index }: { service: Service; index: number }) {
  return (
    <Link
      href={`/services/${service.id}`}
      className="svc-row browse-reveal"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="svc-row__icon">
        <WrenchIcon size={26} />
      </div>
      <div>
        <p className="svc-row__meta">
          {categoryName(service.cat)} · {service.dur}
        </p>
        <h3 className="svc-row__title">{service.title}</h3>
        <p className="svc-row__desc">{service.desc}</p>
        <p className="svc-row__meta" style={{ marginTop: 6 }}>
          {stars(service.rating)} · {service.reviews} reviews
        </p>
      </div>
      <div className="svc-row__right">
        <p className="svc-row__price">{formatTaka(service.price)}</p>
        <p className="svc-row__starting">starting</p>
        <span className="svc-row__book">Book →</span>
      </div>
    </Link>
  )
}

export default function BrowseServices() {
  const searchParams = useSearchParams()
  const reduceMotion = useReducedMotion() ?? false
  const counts = useMemo(() => categoryCounts(), [])

  const initialCat = searchParams.get("cat") as CategoryId | null

  const [q, setQ] = useState("")
  const debouncedQ = useDebounced(q, 220)
  const [cats, setCats] = useState<CategoryId[]>(
    initialCat && CATEGORIES.some((c) => c.id === initialCat) ? [initialCat] : []
  )
  const [minRating, setMinRating] = useState(0)
  const [budget, setBudget] = useState(4500)
  const [view, setView] = useState<View>("grid")
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

  const services = useMemo(
    () => filterServices(debouncedQ, cats, minRating, budget, sort),
    [debouncedQ, cats, minRating, budget, sort]
  )

  const toggleCat = (id: CategoryId) => {
    setCats((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  const clearAll = () => {
    setQ("")
    setCats([])
    setMinRating(0)
    setBudget(4500)
    setToast({
      title: "Filters cleared",
      message: "Showing the full catalogue again.",
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

  const resultCount = services.length
  const countLabel = `${resultCount} service${resultCount === 1 ? "" : "s"}`

  return (
    <div className="browse-page">
      <section className="browse-hero">
        <div className="browse-hero__inner">
          <p className="browse-crumbs">
            <Link href="/">Home</Link>
            {" / "}
            <strong>Browse services</strong>
          </p>
          <h1>Find the right hands</h1>
          <p>Filter by trade, rating and budget. Results update as you go.</p>
          <div className="browse-search">
            <SearchIcon />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder='Try “AC gas refill” or “blocked drain”'
              aria-label="Search services"
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
            <h3>Budget ceiling</h3>
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
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
              </select>

              <div className="view-toggle">
                <button
                  type="button"
                  className={view === "grid" ? "is-active" : ""}
                  aria-label="Grid view"
                  onClick={() => setView("grid")}
                >
                  <Grid2X2Icon size={16} />
                </button>
                <button
                  type="button"
                  className={view === "list" ? "is-active" : ""}
                  aria-label="List view"
                  onClick={() => setView("list")}
                >
                  <ListIcon size={16} />
                </button>
              </div>
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
            <div className="skeleton-grid" aria-hidden="true">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton-card">
                  <div className="skeleton-card__media" />
                  <div className="skeleton-card__body">
                    <div className="skeleton-card__line short" />
                    <div className="skeleton-card__line" />
                    <div className="skeleton-card__line" />
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
                Try clearing filters. Catalogue has {SERVICES.length} services.
              </p>
              <button type="button" className="btn-ghost" onClick={clearAll}>
                Clear filters
              </button>
            </div>
          ) : view === "grid" ? (
            <div className="svc-grid">
              {services.map((service, index) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  index={reduceMotion ? 0 : index}
                />
              ))}
            </div>
          ) : (
            <div className="svc-list">
              {services.map((service, index) => (
                <ServiceRow
                  key={service.id}
                  service={service}
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
