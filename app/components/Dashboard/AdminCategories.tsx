"use client"

import Link from "next/link"
import { useEffect, useMemo, useState, type FormEvent, type RefObject } from "react"
import {
  AlertTriangleIcon,
  BoxIcon,
  CheckIcon,
  LoaderCircleIcon,
  SearchIcon,
  TagIcon,
  Trash2Icon,
  TrendingUpIcon,
} from "lucide-react"
import { useReducedMotion } from "framer-motion"

import {
  CATEGORY_ICON_OPTIONS,
  filterCategoryIcons,
  slugify,
  type AdminCategory,
} from "@/app/lib/admin-data"
import {
  getCategoryErrorMessage,
  useAdminCategoriesQuery,
  useCategoryStatsQuery,
  useCreateCategory,
  useDeleteCategory,
  useToggleCategoryVisibility,
  useUpdateCategory,
} from "@/lib/admin/use-admin-categories"
import AdminShell from "./AdminShell"
import CategoryGlyph from "./CategoryGlyph"
import { useReveal } from "./DashShell"
import {
  DashModal,
  DashTabs,
  DashToastHost,
  StatCard,
  useDashToasts,
} from "./DashShared"

function useDebounced<T>(value: T, ms: number) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const id = window.setTimeout(() => setV(value), ms)
    return () => window.clearTimeout(id)
  }, [value, ms])
  return v
}

type FormState = {
  name: string
  slug: string
  icon: string
  active: boolean
  slugTouched: boolean
}

const emptyForm = (): FormState => ({
  name: "",
  slug: "",
  icon: "",
  active: true,
  slugTouched: false,
})

export default function AdminCategories() {
  const reduceMotion = useReducedMotion() ?? false
  const { toasts, pushToast } = useDashToasts()
  const categoriesQuery = useAdminCategoriesQuery()
  const statsQuery = useCategoryStatsQuery()
  const createMutation = useCreateCategory()
  const updateMutation = useUpdateCategory()
  const toggleMutation = useToggleCategoryVisibility()
  const deleteMutation = useDeleteCategory()

  const categories = useMemo(
    () => categoriesQuery.data ?? [],
    [categoriesQuery.data]
  )
  const [view, setView] = useState("Cards")
  const [q, setQ] = useState("")
  const debouncedQ = useDebounced(q, 180)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [iconQuery, setIconQuery] = useState("")
  const [nameError, setNameError] = useState("")
  const [slugError, setSlugError] = useState("")
  const [mode, setMode] = useState<"add" | "edit" | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteCat, setDeleteCat] = useState<AdminCategory | null>(null)
  const [leavingIds, setLeavingIds] = useState<string[]>([])
  const revealRef = useReveal([view])

  const filteredIcons = useMemo(() => {
    const list = filterCategoryIcons(iconQuery)
    if (!form.icon) return list
    if (list.some((o) => o.emoji === form.icon)) return list
    const selected = CATEGORY_ICON_OPTIONS.find((o) => o.emoji === form.icon)
    return selected ? [selected, ...list] : list
  }, [iconQuery, form.icon])

  // Always show every category — hide/unhide only changes the active badge/style
  const displayCategories = categories

  const filtered = useMemo(() => {
    const query = debouncedQ.trim().toLowerCase()
    if (!query) return displayCategories
    return displayCategories.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.slug.toLowerCase().includes(query)
    )
  }, [displayCategories, debouncedQ])

  const stats = statsQuery.data
  const categoryCount = stats?.categories ?? displayCategories.length
  const liveCount =
    stats?.liveInSearch ?? displayCategories.filter((c) => c.active).length
  const jobsTotal =
    stats?.jobsAllTime ?? displayCategories.reduce((s, c) => s + c.jobs, 0)
  const servicesListed =
    stats?.servicesListed ??
    displayCategories.reduce((s, c) => s + c.services, 0)
  const statsReady = !statsQuery.isLoading && !categoriesQuery.isLoading
  const saving =
    createMutation.isPending ||
    (updateMutation.isPending && mode != null)

  const formComplete = Boolean(
    form.name.trim() &&
      (form.slug.trim() || slugify(form.name)) &&
      form.icon.trim()
  )
  const canSubmit = formComplete && !saving

  const openAdd = () => {
    setForm(emptyForm())
    setIconQuery("")
    setNameError("")
    setSlugError("")
    setEditId(null)
    setMode("add")
  }

  const openEdit = (c: AdminCategory) => {
    const matched = CATEGORY_ICON_OPTIONS.find(
      (o) => o.emoji === c.icon || o.key === c.icon
    )
    setForm({
      name: c.name,
      slug: c.slug,
      icon: matched?.emoji ?? c.icon ?? "🔧",
      active: c.active,
      slugTouched: true,
    })
    setIconQuery("")
    setNameError("")
    setSlugError("")
    setEditId(c.id)
    setMode("edit")
  }

  const setName = (name: string) => {
    setForm((prev) => ({
      ...prev,
      name,
      slug: prev.slugTouched ? prev.slug : slugify(name),
    }))
    if (name.trim()) setNameError("")
  }

  const validate = () => {
    const name = form.name.trim()
    const slug = (form.slug.trim() || slugify(form.name)).toLowerCase()
    let ok = true
    if (!name) {
      setNameError("Give the category a name customers will recognise.")
      ok = false
    } else {
      setNameError("")
    }
    if (!slug) {
      setSlugError("Add a URL slug (letters and numbers).")
      ok = false
    } else if (
      displayCategories.some(
        (c) => c.slug === slug && c.id !== editId
      )
    ) {
      setSlugError("That slug is already used by another category.")
      ok = false
    } else {
      setSlugError("")
    }
    if (!form.icon.trim()) {
      ok = false
    }
    return ok ? { name, slug } : null
  }

  const saveForm = async (event?: FormEvent) => {
    event?.preventDefault()
    const checked = validate()
    if (!checked || !canSubmit) return

    const payload = {
      name: checked.name,
      slug: checked.slug,
      isVisible: form.active,
      icon: form.icon,
    }

    try {
      if (mode === "add") {
        const created = await createMutation.mutateAsync(payload)
        setMode(null)
        setEditId(null)
        setForm(emptyForm())
        pushToast(
          "Category added successfully",
          form.active
            ? `${created.name} is now live in customer search.`
            : `${created.name} was saved but is hidden from search.`
        )
        return
      }
      if (editId) {
        const result = await updateMutation.mutateAsync({
          id: editId,
          input: payload,
        })
        setMode(null)
        setEditId(null)
        setForm(emptyForm())
        pushToast(
          "Category updated",
          `${result.updated.name || payload.name} saved successfully.`
        )
      }
    } catch (error) {
      pushToast("Could not save category", getCategoryErrorMessage(error), "error")
    }
  }

  const toggleActive = (cat: AdminCategory, active: boolean) => {
    void toggleMutation.mutateAsync({ category: cat, active }).then(() => {
      pushToast(
        active ? "Category is live" : "Category hidden",
        active
          ? `${cat.name} is visible to customers.`
          : `${cat.name} is off search.`
      )
    })
  }

  const turnOffInstead = () => {
    if (!deleteCat) return
    const target = deleteCat
    setDeleteCat(null)
    toggleActive(target, false)
  }

  const deletePermanent = async () => {
    if (!deleteCat || deleteMutation.isPending) return
    const id = deleteCat.id
    const name = deleteCat.name
    setDeleteCat(null)
    setLeavingIds((prev) => [...prev, id])
    window.setTimeout(
      async () => {
        try {
          await deleteMutation.mutateAsync(id)
          pushToast("Category deleted", `${name} was removed permanently.`, "error")
        } catch (error) {
          pushToast(
            "Could not delete category",
            getCategoryErrorMessage(error),
            "error"
          )
        } finally {
          setLeavingIds((prev) => prev.filter((x) => x !== id))
        }
      },
      reduceMotion ? 0 : 320
    )
  }

  return (
    <AdminShell page="categories" categoryCount={displayCategories.length}>
      <div ref={revealRef as RefObject<HTMLDivElement>}>
        <p className="dash-breadcrumb">
          <Link href="/dashboard/admin">Admin</Link>
          <span>/</span>
          <span>Categories</span>
        </p>
        <header className="dash-head">
          <div>
            <h1 className="dash-title">Service categories</h1>
            <p className="dash-sub">
              Turning a category off hides it from search. Existing bookings in
              it are untouched.
            </p>
          </div>
          <div className="dash-head__actions">
            <button
              type="button"
              className="dash-btn dash-btn--primary"
              onClick={openAdd}
            >
              Add category
            </button>
          </div>
        </header>

        {categoriesQuery.isError ? (
          <div className="dash-empty dash-card" style={{ marginBottom: 16 }}>
            <h3>Could not load categories</h3>
            <p>{getCategoryErrorMessage(categoriesQuery.error)}</p>
            <button
              type="button"
              className="dash-btn dash-btn--ghost"
              onClick={() => void categoriesQuery.refetch()}
            >
              Retry
            </button>
          </div>
        ) : null}

        <div className="stat-row">
          <StatCard
            icon={<TagIcon size={18} />}
            value={categoryCount}
            label="Categories"
            delta="All trades in catalogue"
            delay={0}
            animate={statsReady}
          />
          <StatCard
            icon={<CheckIcon size={18} />}
            value={liveCount}
            label="Live in search"
            delta="Visible to customers"
            variant="signal"
            delay={55}
            animate={statsReady}
          />
          <StatCard
            icon={<BoxIcon size={18} />}
            value={servicesListed}
            label="Services listed"
            delta="Across all trades"
            variant="sky"
            delay={110}
            animate={statsReady}
          />
          <StatCard
            icon={<TrendingUpIcon size={18} />}
            value={jobsTotal}
            label="Jobs all-time"
            delta="Since launch"
            variant="violet"
            delay={165}
            animate={statsReady}
          />
        </div>

        <div className="cat-toolbar">
          <strong>All categories</strong>
          <label className="dash-search">
            <SearchIcon size={16} />
            <input
              className="dash-input"
              placeholder="Search categories"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </label>
          <DashTabs
            tabs={["Cards", "Table"]}
            active={view}
            onChange={setView}
          />
        </div>

        {categoriesQuery.isLoading ? (
          <div className="cat-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skel skel-card" />
            ))}
          </div>
        ) : !filtered.length ? (
          <div className="dash-empty dash-card">
            <h3>No category by that name</h3>
            <p>Try another search or add a new trade.</p>
            <button
              type="button"
              className="dash-btn dash-btn--primary"
              onClick={openAdd}
            >
              Add category
            </button>
          </div>
        ) : view === "Cards" ? (
          <div className="cat-grid">
            {filtered.map((c) => (
              <article
                key={c.id}
                className={`cat-card${c.active ? "" : " is-off"}${leavingIds.includes(c.id) ? " is-leaving" : ""}`}
              >
                <div className="cat-card__top">
                  <span className={`cat-glyph${c.active ? "" : " is-off"}`}>
                    <CategoryGlyph icon={c.icon} />
                  </span>
                  <label className="dash-switch">
                    <input
                      type="checkbox"
                      checked={c.active}
                      onChange={(e) => toggleActive(c, e.target.checked)}
                    />
                    <span />
                  </label>
                </div>
                <h3 className="cat-card__name">{c.name}</h3>
                <p className="cat-card__slug">/{c.slug}</p>
                <p className="cat-card__meta">
                  {c.services} services · {c.jobs.toLocaleString("en-IN")} jobs
                  {typeof c.technicians === "number"
                    ? ` · ${c.technicians} techs`
                    : ""}
                </p>
                <div className="cat-card__foot">
                  <button
                    type="button"
                    className="dash-btn dash-btn--ghost dash-btn--sm"
                    onClick={() => openEdit(c)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="dash-icon-btn"
                    aria-label={`Delete ${c.name}`}
                    onClick={() => setDeleteCat(c)}
                  >
                    <Trash2Icon size={16} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="table-wrap dash-card" style={{ padding: 0 }}>
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Slug</th>
                  <th>Services</th>
                  <th>Jobs</th>
                  <th>Visible</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    className={
                      leavingIds.includes(c.id) ? "is-leaving" : undefined
                    }
                  >
                    <td>
                      <div className="cell-person">
                        <span
                          className={`cat-glyph cat-glyph--sm${c.active ? "" : " is-off"}`}
                        >
                          <CategoryGlyph icon={c.icon} size={16} />
                        </span>
                        <strong>{c.name}</strong>
                      </div>
                    </td>
                    <td className="mono-muted">/{c.slug}</td>
                    <td>{c.services}</td>
                    <td>
                      <strong className="mono-count">
                        {c.jobs.toLocaleString("en-IN")}
                      </strong>
                    </td>
                    <td>
                      <label className="dash-switch">
                        <input
                          type="checkbox"
                          checked={c.active}
                          onChange={(e) => toggleActive(c, e.target.checked)}
                        />
                        <span />
                      </label>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          type="button"
                          className="dash-btn dash-btn--ghost dash-btn--sm"
                          onClick={() => openEdit(c)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="dash-icon-btn"
                          aria-label={`Delete ${c.name}`}
                          onClick={() => setDeleteCat(c)}
                        >
                          <Trash2Icon size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="table-foot">
              <span>{filtered.length} categories</span>
            </div>
          </div>
        )}
      </div>

      <DashModal
        open={mode != null}
        title={mode === "edit" ? "Edit category" : "Add a category"}
        onClose={() => {
          if (saving) return
          setMode(null)
        }}
        actions={
          <>
            <button
              type="button"
              className="dash-btn dash-btn--secondary"
              disabled={saving}
              onClick={() => setMode(null)}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="category-form"
              className="dash-btn dash-btn--primary"
              disabled={!canSubmit}
            >
              {saving ? (
                <>
                  <LoaderCircleIcon size={16} className="animate-spin" />
                  Saving…
                </>
              ) : mode === "edit" ? (
                "Save changes"
              ) : (
                "Create category"
              )}
            </button>
          </>
        }
      >
        <form
          id="category-form"
          className={`modal-stack category-form${nameError || slugError ? " is-shake" : ""}`}
          onSubmit={(e) => void saveForm(e)}
        >
          <label className="field">
            <span>Category name *</span>
            <input
              className={`dash-input${nameError ? " is-error" : ""}`}
              placeholder="e.g. Solar installation"
              value={form.name}
              autoFocus
              onChange={(e) => setName(e.target.value)}
            />
            {nameError ? <em className="field-error">{nameError}</em> : null}
          </label>
          <label className="field">
            <span>URL slug</span>
            <input
              className={`dash-input mono-input${slugError ? " is-error" : ""}`}
              placeholder="e.g. solar-installation"
              value={form.slug}
              onChange={(e) => {
                setForm((prev) => ({
                  ...prev,
                  slug: slugify(e.target.value),
                  slugTouched: true,
                }))
                setSlugError("")
              }}
            />
            <small className="field-hint">
              Customers see this in search — /services?cat=
              {form.slug || "…"}
            </small>
            {slugError ? <em className="field-error">{slugError}</em> : null}
          </label>
          <div className="field">
            <span>Icon *</span>
            <label className="icon-picker-search">
              <SearchIcon size={15} />
              <input
                className="dash-input"
                placeholder="Search icons (e.g. plumbing, solar, pest)"
                value={iconQuery}
                onChange={(e) => setIconQuery(e.target.value)}
              />
            </label>
            {!iconQuery.trim() ? (
              <small className="field-hint">
                {CATEGORY_ICON_OPTIONS.length} icons — scroll or search to pick
                one
              </small>
            ) : (
              <small className="field-hint">
                {filteredIcons.length} match
                {filteredIcons.length === 1 ? "" : "es"} for “{iconQuery.trim()}”
              </small>
            )}
            <div
              className="icon-picker"
              role="listbox"
              aria-label="Category icon"
            >
              {filteredIcons.length ? (
                filteredIcons.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    role="option"
                    title={opt.label}
                    aria-selected={form.icon === opt.emoji}
                    className={`icon-picker__btn${form.icon === opt.emoji ? " is-selected" : ""}`}
                    onClick={() =>
                      setForm((prev) => ({ ...prev, icon: opt.emoji }))
                    }
                    aria-label={`${opt.label} (${opt.keywords[0] || opt.key})`}
                  >
                    <CategoryGlyph icon={opt.emoji} size={20} />
                  </button>
                ))
              ) : (
                <p className="icon-picker__empty">
                  No icons match that search. Try “plumbing”, “cleaning”, or
                  clear the search.
                </p>
              )}
            </div>
          </div>
          <label className="field field--row">
            <span>Show in customer search right away</span>
            <label className="dash-switch">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, active: e.target.checked }))
                }
              />
              <span />
            </label>
          </label>
        </form>
      </DashModal>

      <DashModal
        open={Boolean(deleteCat)}
        title={deleteCat ? `Delete ${deleteCat.name}?` : "Delete category"}
        onClose={() => setDeleteCat(null)}
        actions={
          <>
            <button
              type="button"
              className="dash-btn dash-btn--ghost"
              onClick={() => void turnOffInstead()}
            >
              Turn it off instead
            </button>
            <button
              type="button"
              className="dash-btn dash-btn--danger"
              disabled={deleteMutation.isPending}
              onClick={() => void deletePermanent()}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete permanently"}
            </button>
          </>
        }
      >
        {deleteCat ? (
          <div className="modal-stack">
            <p>
              {deleteCat.services} services sit inside {deleteCat.name}. They
              become unsearchable until moved to another category.
            </p>
            <div className="tip-box tip-box--amber">
              <AlertTriangleIcon size={16} />
              Prefer turning it off to keep history and job totals intact.
            </div>
          </div>
        ) : null}
      </DashModal>

      <DashToastHost toasts={toasts} />
    </AdminShell>
  )
}
