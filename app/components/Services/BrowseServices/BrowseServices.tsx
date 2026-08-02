"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { useReducedMotion } from "framer-motion"
import {
  Grid2X2Icon,
  ListIcon,
  SearchIcon,
} from "lucide-react"

import {
  categoryName,
  formatTaka,
  type CategoryId,
  type Service,
} from "@/app/lib/catalogue"
import BrowseSelect from "@/app/components/Shared/BrowseSelect/BrowseSelect"
import ServiceMedia from "@/app/components/Shared/ServiceMedia"
import { formatServiceTag } from "@/lib/catalogue/normalize"
import {
  useAreas,
  useCategories,
  useServices,
  useTechnicians,
} from "@/lib/catalogue/hooks"
import "./BrowseServices.css"

type View = "grid" | "list"
type SortKey = "pop" | "rating" | "price-asc" | "price-desc"

const SORT_OPTIONS = [
  { value: "pop", label: "Most booked" },
  { value: "rating", label: "Top rated" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
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

function stars(rating: number) {
  return `${rating.toFixed(1)} ★`
}

function filterServices(
  list: Service[],
  q: string,
  cats: CategoryId[],
  minRating: number,
  budget: number,
  sort: SortKey
) {
  const query = q.trim().toLowerCase()
  let filtered = list.filter((s) => {
    const hay = `${s.title} ${s.desc} ${s.catName}`.toLowerCase()
    if (query && !hay.includes(query)) return false
    if (cats.length && !cats.includes(s.cat)) return false
    if (s.rating < minRating) return false
    if (s.price > budget) return false
    return true
  })

  filtered = [...filtered].sort((a, b) => {
    if (sort === "rating") return b.rating - a.rating
    if (sort === "price-asc") return a.price - b.price
    if (sort === "price-desc") return b.price - a.price
    return b.reviews - a.reviews
  })
  return filtered
}

function ServiceCard({
  service,
  index,
}: {
  service: Service
  index: number
}) {
  return (
    <Link
      href={`/services/${service.id}`}
      className="svc-card browse-reveal"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="svc-card__media">
        {service.tag && (
          <span className="svc-card__badge">{formatServiceTag(service.tag)}</span>
        )}
        <ServiceMedia
          image={service.image}
          title={service.title}
          className="svc-card__photo"
        />
        <span className="svc-card__price">{formatTaka(service.price)}</span>
      </div>
      <div className="svc-card__body">
        <p className="svc-card__cat">{service.catName}</p>
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

function ServiceRow({
  service,
  index,
}: {
  service: Service
  index: number
}) {
  return (
    <Link
      href={`/services/${service.id}`}
      className="svc-row browse-reveal"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="svc-row__icon">
        <ServiceMedia
          image={service.image}
          title={service.title}
          className="svc-row__photo"
          glyphSize={22}
        />
      </div>
      <div>
        <p className="svc-row__meta">
          {service.catName} · {service.dur}
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
  const categoriesQuery = useCategories()
  const areasQuery = useAreas()
  const techniciansQuery = useTechnicians({ limit: 100 })
  const categories = categoriesQuery.data ?? []
  const areas = areasQuery.data ?? []
  const technicians = techniciansQuery.data?.items ?? []

  const initialCat = searchParams.get("cat")
  const initialArea = searchParams.get("area") ?? ""

  const [q, setQ] = useState("")
  const debouncedQ = useDebounced(q, 220)
  const [cats, setCats] = useState<CategoryId[]>(initialCat ? [initialCat] : [])
  const [area, setArea] = useState(initialArea)
  const [minRating, setMinRating] = useState(0)
  const [budget, setBudget] = useState(4500)
  const [view, setView] = useState<View>("grid")
  const [sort, setSort] = useState<SortKey>("pop")
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [toast, setToast] = useState<{ title: string; message: string } | null>(
    null
  )

  // Hit the API with search + single-category filters (multi-cat stays client-side)
  const apiQuery = useMemo(
    () => ({
      limit: 100,
      q: debouncedQ.trim() || undefined,
      categoryId: cats.length === 1 ? cats[0] : undefined,
    }),
    [debouncedQ, cats]
  )

  const servicesQuery = useServices(apiQuery)
  const fetchedServices = servicesQuery.data?.items ?? []
  const totalFromApi = servicesQuery.data?.meta?.total ?? fetchedServices.length

  const loading =
    (categoriesQuery.isLoading || servicesQuery.isLoading) &&
    !fetchedServices.length
  const hasError =
    (servicesQuery.isError || categoriesQuery.isError) &&
    !fetchedServices.length
  const isRefreshing = servicesQuery.isFetching && !loading

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

  useEffect(() => {
    if (!initialArea || !areas.length) return
    if (areas.some((a) => a.name === initialArea)) {
      setArea(initialArea)
    }
  }, [initialArea, areas])

  // Drop filters for categories that were hidden (live update, no reload)
  useEffect(() => {
    if (!categoriesQuery.isFetched) return
    const visible = new Set(categories.map((c) => c.id))
    setCats((prev) => {
      const next = prev.filter((id) => visible.has(id))
      return next.length === prev.length ? prev : next
    })
  }, [categories, categoriesQuery.isFetched])

  /** Category IDs covered by verified technicians in the selected area. */
  const areaCategoryIds = useMemo(() => {
    if (!area) return null
    const ids = new Set<string>()
    for (const tech of technicians) {
      if (!tech.verified) continue
      const covers = tech.areas?.length
        ? tech.areas.includes(area)
        : tech.area === area
      if (!covers) continue
      for (const catId of tech.cats) ids.add(catId)
    }
    return ids
  }, [area, technicians])

  const services = useMemo(() => {
    let list = filterServices(
      fetchedServices,
      // Search already applied by API when present; keep local for multi-field safety
      cats.length === 1 ? "" : debouncedQ,
      cats.length === 1 ? [] : cats,
      minRating,
      budget,
      sort
    )
    if (areaCategoryIds) {
      list = list.filter((s) => areaCategoryIds.has(s.cat))
    }
    return list
  }, [
    fetchedServices,
    debouncedQ,
    cats,
    minRating,
    budget,
    sort,
    areaCategoryIds,
  ])

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
    setToast({
      title: "Filters cleared",
      message: "Showing the full catalogue again.",
    })
  }

  const retry = () => {
    void categoriesQuery.refetch()
    void servicesQuery.refetch()
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
          <p>
            Filter by trade, area, rating and budget. Results update as you go.
          </p>
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
            {categories.map((cat) => (
              <label key={cat.id} className="check">
                <input
                  type="checkbox"
                  checked={cats.includes(cat.id)}
                  onChange={() => toggleCat(cat.id)}
                />
                <span>{cat.name}</span>
                <em>{cat.serviceCount}</em>
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
              {isRefreshing && (
                <span className="result-count" style={{ opacity: 0.55 }}>
                  Updating…
                </span>
              )}
            </div>

            <div className="result-bar__right">
              <BrowseSelect
                aria-label="Sort services"
                value={sort}
                onValueChange={(value) => setSort(value as SortKey)}
                options={[...SORT_OPTIONS]}
                triggerClassName="w-auto min-w-[12.5rem]"
              />

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

          {hasError ? (
            <div className="browse-empty">
              <div className="browse-empty__icon">
                <SearchIcon size={26} />
              </div>
              <h3>Could not load services</h3>
              <p>Check your connection and try again.</p>
              <button type="button" className="btn-ghost" onClick={retry}>
                Retry
              </button>
            </div>
          ) : loading ? (
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
                Try clearing filters. API has {totalFromApi} matching service
                {totalFromApi === 1 ? "" : "s"} before local filters.
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
