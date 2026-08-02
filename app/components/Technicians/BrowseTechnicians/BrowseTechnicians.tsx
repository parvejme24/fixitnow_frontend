"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { useReducedMotion } from "framer-motion"
import { SearchIcon, StarIcon } from "lucide-react"

import {
  categoryName,
  formatTaka,
  type CategoryId,
  type Technician,
} from "@/app/lib/catalogue"
import BrowseSelect from "@/app/components/Shared/BrowseSelect/BrowseSelect"
import ProfileFace from "@/app/components/Shared/ProfileFace"
import { useAuth } from "@/app/providers/AuthProvider"
import { useAreas, useCategories, useTechnicians } from "@/lib/catalogue/hooks"
import { techniciansWithAuthImage } from "@/lib/catalogue/with-auth-image"
import "../../Services/BrowseServices/BrowseServices.css"

type SortKey = "pop" | "rating" | "price-asc" | "price-desc"

const SORT_OPTIONS = [
  { value: "pop", label: "Most booked" },
  { value: "rating", label: "Top rated" },
  { value: "price-asc", label: "Fee: low to high" },
  { value: "price-desc", label: "Fee: high to low" },
] as const

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
  list: Technician[],
  q: string,
  cats: CategoryId[],
  area: string,
  minRating: number,
  budget: number,
  today: boolean,
  sort: SortKey
) {
  const query = q.trim().toLowerCase()
  let filtered = list.filter((t) => {
    if (!t.verified) return false
    const hay = `${t.name} ${t.trade} ${t.skills.join(" ")} ${(t.areas?.length ? t.areas : [t.area]).join(" ")}`.toLowerCase()
    if (query && !hay.includes(query)) return false
    if (cats.length && !t.cats.some((c) => cats.includes(c))) return false
    if (
      area &&
      !(t.areas?.length ? t.areas.includes(area) : t.area === area)
    )
      return false
    if (t.rating < minRating) return false
    if (t.rate > budget) return false
    if (today && !t.online) return false
    return true
  })

  filtered = [...filtered].sort((a, b) => {
    if (sort === "rating") return b.rating - a.rating
    if (sort === "price-asc") return a.rate - b.rate
    if (sort === "price-desc") return b.rate - a.rate
    return b.jobs - a.jobs
  })
  return filtered
}

function TechCard({ tech, index }: { tech: Technician; index: number }) {
  const tags =
    (tech.catNames?.length ? tech.catNames : tech.skills).slice(0, 3)

  return (
    <Link
      href={`/technician?id=${tech.id}`}
      className="tech-card browse-reveal"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="tech-card__top">
        <div className="tech-card__avatar">
          <ProfileFace
            image={tech.image}
            initials={tech.initials}
            name={tech.name}
            className="tech-card__face"
          />
          {tech.online && <span className="tech-card__online" />}
        </div>
        <div>
          <h3 className="tech-card__name">{tech.name}</h3>
          <p className="tech-card__trade">
            {tech.trade}
            {tech.area ? ` · ${tech.area}` : ""}
            {tech.verified ? "" : " · Unverified"}
          </p>
        </div>
      </div>
      <div className="tech-card__skills">
        {tags.map((tag) => (
          <span key={tag}>{tag}</span>
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
          <b>{tech.online ? "Now" : "Off"}</b>
          <span>{tech.online ? "Online" : "Offline"}</span>
        </div>
      </div>
    </Link>
  )
}

export default function BrowseTechnicians() {
  const searchParams = useSearchParams()
  const reduceMotion = useReducedMotion() ?? false
  const { user } = useAuth()
  const categoriesQuery = useCategories()
  const areasQuery = useAreas()
  const categories = categoriesQuery.data ?? []
  const areas = areasQuery.data ?? []

  const initialCat = searchParams.get("cat")

  const [q, setQ] = useState("")
  const debouncedQ = useDebounced(q, 220)
  const [cats, setCats] = useState<CategoryId[]>(initialCat ? [initialCat] : [])
  const [area, setArea] = useState("")
  const [minRating, setMinRating] = useState(0)
  const [budget, setBudget] = useState(4500)
  const [today, setToday] = useState(false)
  const [sort, setSort] = useState<SortKey>("pop")
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [toast, setToast] = useState<{ title: string; message: string } | null>(
    null
  )

  const selectedAreaId = useMemo(
    () => areas.find((a) => a.name === area)?.id,
    [areas, area]
  )

  const apiQuery = useMemo(
    () => ({
      limit: 100,
      q: debouncedQ.trim() || undefined,
      categoryId: cats.length === 1 ? cats[0] : undefined,
      areaId: selectedAreaId,
      online: today || undefined,
    }),
    [debouncedQ, cats, selectedAreaId, today]
  )

  const techniciansQuery = useTechnicians(apiQuery)
  const fetchedTechnicians = useMemo(
    () =>
      techniciansWithAuthImage(techniciansQuery.data?.items ?? [], user),
    [techniciansQuery.data?.items, user]
  )
  const totalFromApi =
    techniciansQuery.data?.meta?.total ?? fetchedTechnicians.length

  const hasError = techniciansQuery.isError && !fetchedTechnicians.length
  const loading = techniciansQuery.isLoading && !fetchedTechnicians.length
  const isRefreshing = techniciansQuery.isFetching && !loading

  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(() => setToast(null), 3200)
    return () => window.clearTimeout(id)
  }, [toast])

  useEffect(() => {
    if (!initialCat || !categories.length) return
    if (categories.some((c) => c.id === initialCat)) {
      setCats((prev) => (prev.includes(initialCat) ? prev : [initialCat]))
    }
  }, [initialCat, categories])

  // Drop filters for categories that were hidden (live update, no reload)
  useEffect(() => {
    if (!categoriesQuery.isFetched) return
    const visible = new Set(categories.map((c) => c.id))
    setCats((prev) => {
      const next = prev.filter((id) => visible.has(id))
      return next.length === prev.length ? prev : next
    })
  }, [categories, categoriesQuery.isFetched])

  const technicians = useMemo(
    () =>
      filterTechnicians(
        fetchedTechnicians,
        cats.length === 1 ? "" : debouncedQ,
        cats.length === 1 ? [] : cats,
        selectedAreaId ? "" : area,
        minRating,
        budget,
        false,
        sort
      ),
    [
      fetchedTechnicians,
      debouncedQ,
      cats,
      area,
      selectedAreaId,
      minRating,
      budget,
      sort,
    ]
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

  const retry = () => {
    void categoriesQuery.refetch()
    void areasQuery.refetch()
    void techniciansQuery.refetch()
  }

  const activeChips: { key: string; label: string; onRemove: () => void }[] = []
  for (const id of cats) {
    activeChips.push({
      key: `cat-${id}`,
      label: categoryName(id, categories),
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
            {categories.map((cat) => (
              <label key={cat.id} className="check">
                <input
                  type="checkbox"
                  checked={cats.includes(cat.id)}
                  onChange={() => toggleCat(cat.id)}
                />
                <span>{cat.name}</span>
                <em>{cat.technicianCount}</em>
              </label>
            ))}
          </div>

          <div className="browse-block">
            <h3>Area in Dhaka</h3>
            <BrowseSelect
              aria-label="Filter by area"
              value={area || "__all__"}
              onValueChange={(value) =>
                setArea(value === "__all__" ? "" : value)
              }
              options={[
                { value: "__all__", label: "Anywhere in Dhaka" },
                ...areas.map((a) => ({ value: a.name, label: a.name })),
              ]}
            />
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
              {isRefreshing && (
                <span className="result-count" style={{ opacity: 0.55 }}>
                  Updating…
                </span>
              )}
            </div>

            <div className="result-bar__right">
              <BrowseSelect
                aria-label="Sort technicians"
                value={sort}
                onValueChange={(value) => setSort(value as SortKey)}
                options={[...SORT_OPTIONS]}
                triggerClassName="w-auto min-w-[12.5rem]"
              />
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

          {hasError ? (
            <div className="browse-empty">
              <div className="browse-empty__icon">
                <SearchIcon size={26} />
              </div>
              <h3>Could not load technicians</h3>
              <p>Check your connection and try again.</p>
              <button type="button" className="btn-ghost" onClick={retry}>
                Retry
              </button>
            </div>
          ) : loading ? (
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
                Try clearing filters. API has {totalFromApi} matching technician
                {totalFromApi === 1 ? "" : "s"} before local filters.
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
