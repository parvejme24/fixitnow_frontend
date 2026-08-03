"use client"

import Link from "next/link"
import { useMemo, useState, type FormEvent, type RefObject } from "react"
import {
  LoaderCircleIcon,
  PlusIcon,
  SearchIcon,
  SquarePenIcon,
  Trash2Icon,
  WrenchIcon,
} from "lucide-react"

import BrowseSelect from "@/app/components/Shared/BrowseSelect/BrowseSelect"
import ServiceMedia from "@/app/components/Shared/ServiceMedia"
import { formatTaka } from "@/app/lib/catalogue"
import {
  getAdminServiceErrorMessage,
  useAdminServicesQuery,
  useCreateService,
  useDeleteService,
  useUpdateService,
} from "@/lib/admin/use-admin-platform"
import { useAdminCategoriesQuery } from "@/lib/admin/use-admin-categories"
import {
  formatServiceTag,
  SERVICE_TAG_OPTIONS,
} from "@/lib/catalogue/normalize"
import type { Service, ServiceTag } from "@/lib/catalogue/types"
import AdminShell from "./AdminShell"
import { useReveal } from "./DashShell"
import {
  DashModal,
  DashToastHost,
  StatCard,
  useDashToasts,
} from "./DashShared"

type FormState = {
  title: string
  description: string
  price: string
  duration: string
  categoryId: string
  tag: string
  isFeatured: boolean
  isActive: boolean
  imageFile: File | null
  imagePreview: string | null
}

const EVERY_CATEGORY = "every-category"
const EVERY_TAG = "every-tag"
const NO_TAG = "no-tag"
const EVERY_FEATURED = "every-featured"
const FEATURED_ONLY = "featured"
const NOT_FEATURED = "not-featured"
const EVERY_STATUS = "every-status"
const ACTIVE_ONLY = "active"
const INACTIVE_ONLY = "inactive"
const EVERY_PRICE = "every-price"

const PRICE_FILTERS = [
  { value: EVERY_PRICE, label: "Every price" },
  { value: "under-500", label: "Under ৳500" },
  { value: "500-999", label: "৳500 – ৳999" },
  { value: "1000-1999", label: "৳1,000 – ৳1,999" },
  { value: "2000-plus", label: "৳2,000+" },
] as const

function matchesPrice(amount: number, filter: string) {
  if (filter === EVERY_PRICE) return true
  if (filter === "under-500") return amount < 500
  if (filter === "500-999") return amount >= 500 && amount < 1000
  if (filter === "1000-1999") return amount >= 1000 && amount < 2000
  if (filter === "2000-plus") return amount >= 2000
  return true
}

const emptyForm = (): FormState => ({
  title: "",
  description: "",
  price: "",
  duration: "1 hr",
  categoryId: "",
  tag: "",
  isFeatured: false,
  isActive: true,
  imageFile: null,
  imagePreview: null,
})

export default function AdminServices() {
  const { toasts, pushToast } = useDashToasts()
  const servicesQuery = useAdminServicesQuery()
  const categoriesQuery = useAdminCategoriesQuery()
  const createMutation = useCreateService()
  const updateMutation = useUpdateService()
  const deleteMutation = useDeleteService()

  const services = servicesQuery.data ?? []
  const categories = categoriesQuery.data ?? []

  const [q, setQ] = useState("")
  const [categoryFilter, setCategoryFilter] = useState(EVERY_CATEGORY)
  const [tagFilter, setTagFilter] = useState(EVERY_TAG)
  const [featuredFilter, setFeaturedFilter] = useState(EVERY_FEATURED)
  const [statusFilter, setStatusFilter] = useState(EVERY_STATUS)
  const [priceFilter, setPriceFilter] = useState(EVERY_PRICE)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [mode, setMode] = useState<"add" | "edit" | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteSvc, setDeleteSvc] = useState<Service | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const revealRef = useReveal([
    servicesQuery.isFetching,
    mode,
    categoryFilter,
    tagFilter,
    featuredFilter,
    statusFilter,
    priceFilter,
  ])

  const durations = useMemo(() => {
    const set = new Set<string>()
    for (const s of services) {
      const dur = s.dur?.trim()
      if (dur) set.add(dur)
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [services])

  const [durationFilter, setDurationFilter] = useState("every-duration")

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return services.filter((s) => {
      if (categoryFilter !== EVERY_CATEGORY && s.cat !== categoryFilter) {
        return false
      }
      if (tagFilter === NO_TAG && s.tag) return false
      if (
        tagFilter !== EVERY_TAG &&
        tagFilter !== NO_TAG &&
        s.tag !== tagFilter
      ) {
        return false
      }
      if (featuredFilter === FEATURED_ONLY && !s.isFeatured) return false
      if (featuredFilter === NOT_FEATURED && s.isFeatured) return false
      const active = s.isActive !== false
      if (statusFilter === ACTIVE_ONLY && !active) return false
      if (statusFilter === INACTIVE_ONLY && active) return false
      if (!matchesPrice(s.price, priceFilter)) return false
      if (
        durationFilter !== "every-duration" &&
        (s.dur || "").trim() !== durationFilter
      ) {
        return false
      }
      if (!query) return true
      return `${s.title} ${s.catName} ${s.desc} ${s.tag || ""} ${s.dur}`
        .toLowerCase()
        .includes(query)
    })
  }, [
    services,
    q,
    categoryFilter,
    tagFilter,
    featuredFilter,
    statusFilter,
    priceFilter,
    durationFilter,
  ])

  const hasActiveFilters =
    Boolean(q.trim()) ||
    categoryFilter !== EVERY_CATEGORY ||
    tagFilter !== EVERY_TAG ||
    featuredFilter !== EVERY_FEATURED ||
    statusFilter !== EVERY_STATUS ||
    priceFilter !== EVERY_PRICE ||
    durationFilter !== "every-duration"

  const clearFilters = () => {
    setQ("")
    setCategoryFilter(EVERY_CATEGORY)
    setTagFilter(EVERY_TAG)
    setFeaturedFilter(EVERY_FEATURED)
    setStatusFilter(EVERY_STATUS)
    setPriceFilter(EVERY_PRICE)
    setDurationFilter("every-duration")
  }

  const openAdd = () => {
    setForm({
      ...emptyForm(),
      categoryId: categories[0]?.id ?? "",
    })
    setEditId(null)
    setMode("add")
  }

  const openEdit = (s: Service) => {
    setForm({
      title: s.title,
      description: s.desc,
      price: String(s.price),
      duration: s.dur,
      categoryId: s.cat,
      tag: s.tag ?? "",
      isFeatured: Boolean(s.isFeatured),
      isActive: s.isActive !== false,
      imageFile: null,
      imagePreview: s.image ?? null,
    })
    setEditId(s.id)
    setMode("edit")
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.categoryId || !form.price) {
      pushToast("Missing fields", "Title, category, and price are required.", "error")
      return
    }
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      duration: form.duration.trim() || "1 hr",
      categoryId: form.categoryId,
      tag: (form.tag as ServiceTag | "") || null,
      isFeatured: form.isFeatured,
      isActive: form.isActive,
      image: form.imageFile,
    }
    try {
      if (mode === "edit" && editId) {
        await updateMutation.mutateAsync({ id: editId, input: payload })
        pushToast("Service updated", `${payload.title} was saved.`)
      } else {
        await createMutation.mutateAsync(payload)
        pushToast("Service created", `${payload.title} is live.`)
      }
      setMode(null)
      setForm(emptyForm())
    } catch (error) {
      pushToast("Save failed", getAdminServiceErrorMessage(error), "error")
    }
  }

  const confirmDelete = async () => {
    if (!deleteSvc) return
    try {
      await deleteMutation.mutateAsync(deleteSvc.id)
      pushToast("Service deleted", `${deleteSvc.title} was removed.`)
      setDeleteSvc(null)
    } catch (error) {
      pushToast("Delete failed", getAdminServiceErrorMessage(error), "error")
    }
  }

  const toggleActive = async (service: Service, active: boolean) => {
    if (togglingId) return
    setTogglingId(service.id)
    try {
      await updateMutation.mutateAsync({
        id: service.id,
        input: { isActive: active },
      })
      pushToast(
        active ? "Service active" : "Service inactive",
        active
          ? `${service.title} is available to customers.`
          : `${service.title} is hidden from the catalogue.`
      )
    } catch (error) {
      pushToast("Update failed", getAdminServiceErrorMessage(error), "error")
    } finally {
      setTogglingId(null)
    }
  }

  const saving = createMutation.isPending || updateMutation.isPending

  return (
    <AdminShell page="services">
      <div ref={revealRef as RefObject<HTMLDivElement>}>
        <p className="dash-breadcrumb">
          <Link href="/dashboard/admin">Admin</Link>
          <span>/</span>
          <span>Services</span>
        </p>
        <header className="dash-head">
          <div>
            <h1 className="dash-title">Services catalogue</h1>
            <p className="dash-sub">
              Create, edit, and delete services via the admin service APIs.
            </p>
          </div>
          <div className="dash-head__actions">
            <button
              type="button"
              className="dash-btn dash-btn--primary"
              onClick={openAdd}
            >
              <PlusIcon size={16} /> Add service
            </button>
          </div>
        </header>

        <div className="stat-row">
          <StatCard
            icon={<WrenchIcon size={18} />}
            value={filtered.length}
            label="Services"
            delta={
              hasActiveFilters
                ? `Of ${services.length} total`
                : "Matching filters"
            }
            delay={0}
            animate={!servicesQuery.isLoading}
          />
          <StatCard
            icon={<WrenchIcon size={18} />}
            value={filtered.filter((s) => s.isFeatured).length}
            label="Featured"
            delta="In current filter"
            variant="sky"
            delay={55}
            animate={!servicesQuery.isLoading}
          />
          <StatCard
            icon={<WrenchIcon size={18} />}
            value={filtered.filter((s) => s.isActive !== false).length}
            label="Active"
            delta="In current filter"
            variant="signal"
            delay={110}
            animate={!servicesQuery.isLoading}
          />
          <StatCard
            icon={<WrenchIcon size={18} />}
            value={filtered.filter((s) => s.isActive === false).length}
            label="Inactive"
            delta="In current filter"
            variant="flare"
            delay={165}
            animate={!servicesQuery.isLoading}
          />
        </div>

        <section className="dash-card" style={{ marginTop: 14 }}>
          <div className="admin-filters admin-filters--services">
            <label className="dash-search">
              <SearchIcon size={16} />
              <input
                className="dash-input"
                placeholder="Search title, category, tag…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </label>
            <BrowseSelect
              aria-label="Filter by category"
              value={categoryFilter}
              onValueChange={setCategoryFilter}
              searchable
              searchPlaceholder="Search category…"
              placeholder="Every category"
              options={[
                { value: EVERY_CATEGORY, label: "Every category" },
                ...categories.map((c) => ({
                  value: c.id,
                  label: c.name,
                  keywords: c.slug,
                })),
              ]}
            />
            <BrowseSelect
              aria-label="Filter by tag"
              value={tagFilter}
              onValueChange={setTagFilter}
              options={[
                { value: EVERY_TAG, label: "Every tag" },
                { value: NO_TAG, label: "No tag" },
                ...SERVICE_TAG_OPTIONS.map((t) => ({
                  value: t.value,
                  label: t.label,
                })),
              ]}
            />
            <BrowseSelect
              aria-label="Filter by featured"
              value={featuredFilter}
              onValueChange={setFeaturedFilter}
              options={[
                { value: EVERY_FEATURED, label: "Featured: all" },
                { value: FEATURED_ONLY, label: "Featured only" },
                { value: NOT_FEATURED, label: "Not featured" },
              ]}
            />
            <BrowseSelect
              aria-label="Filter by status"
              value={statusFilter}
              onValueChange={setStatusFilter}
              options={[
                { value: EVERY_STATUS, label: "Status: all" },
                { value: ACTIVE_ONLY, label: "Active" },
                { value: INACTIVE_ONLY, label: "Inactive" },
              ]}
            />
            <BrowseSelect
              aria-label="Filter by price"
              value={priceFilter}
              onValueChange={setPriceFilter}
              options={PRICE_FILTERS.map((p) => ({
                value: p.value,
                label: p.label,
              }))}
            />
            <BrowseSelect
              aria-label="Filter by duration"
              value={durationFilter}
              onValueChange={setDurationFilter}
              searchable={durations.length > 6}
              searchPlaceholder="Search duration…"
              placeholder="Every duration"
              options={[
                { value: "every-duration", label: "Every duration" },
                ...durations.map((d) => ({ value: d, label: d })),
              ]}
            />
            {hasActiveFilters ? (
              <button
                type="button"
                className="dash-btn dash-btn--ghost"
                onClick={clearFilters}
              >
                Clear filters
              </button>
            ) : null}
          </div>

          {servicesQuery.isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skel skel-row" />
            ))
          ) : servicesQuery.isError ? (
            <div className="dash-empty">
              <h3>Could not load services</h3>
              <p>{getAdminServiceErrorMessage(servicesQuery.error)}</p>
              <button
                type="button"
                className="dash-btn dash-btn--ghost"
                onClick={() => void servicesQuery.refetch()}
              >
                Retry
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="dash-empty">
              <h3>No services match</h3>
              <p>
                {hasActiveFilters
                  ? "Try clearing filters or adjusting search."
                  : "Add a service to populate the catalogue."}
              </p>
              {hasActiveFilters ? (
                <button
                  type="button"
                  className="dash-btn dash-btn--ghost"
                  onClick={clearFilters}
                >
                  Clear filters
                </button>
              ) : null}
            </div>
          ) : (
            <div className="table-wrap table-wrap--scroll">
              <div className="table-scroll">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Duration</th>
                      <th>Tag</th>
                      <th>Featured</th>
                      <th>Status</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((s) => (
                      <tr key={s.id}>
                        <td>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                            }}
                          >
                            <span
                              style={{
                                width: 44,
                                height: 44,
                                borderRadius: 8,
                                overflow: "hidden",
                                flexShrink: 0,
                                position: "relative",
                                background: "var(--steel-800)",
                              }}
                            >
                              <ServiceMedia
                                image={s.image}
                                title={s.title}
                                glyphSize={18}
                              />
                            </span>
                            <div>
                              <strong>{s.title}</strong>
                            </div>
                          </div>
                        </td>
                        <td>{s.catName}</td>
                        <td>{formatTaka(s.price)}</td>
                        <td className="mono-muted">{s.dur}</td>
                        <td className="mono-muted">
                          {s.tag ? formatServiceTag(s.tag) : "—"}
                        </td>
                        <td>{s.isFeatured ? "Yes" : "—"}</td>
                        <td>
                          <label className="dash-switch">
                            <input
                              type="checkbox"
                              checked={s.isActive !== false}
                              disabled={togglingId === s.id}
                              aria-label={
                                s.isActive !== false
                                  ? `Deactivate ${s.title}`
                                  : `Activate ${s.title}`
                              }
                              onChange={(e) =>
                                void toggleActive(s, e.target.checked)
                              }
                            />
                            <span />
                          </label>
                        </td>
                        <td>
                          <div className="row-actions">
                            <button
                              type="button"
                              className="dash-icon-btn"
                              aria-label={`Edit ${s.title}`}
                              title="Edit"
                              onClick={() => openEdit(s)}
                            >
                              <SquarePenIcon size={16} />
                            </button>
                            <button
                              type="button"
                              className="dash-icon-btn"
                              onClick={() => setDeleteSvc(s)}
                              aria-label={`Delete ${s.title}`}
                            >
                              <Trash2Icon size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="table-foot">
                <span>
                  Showing {filtered.length} of {services.length} services
                </span>
              </div>
            </div>
          )}
        </section>
      </div>

      <DashModal
        open={mode != null}
        title={mode === "add" ? "Add service" : "Edit service"}
        onClose={() => {
          if (saving) return
          setMode(null)
        }}
        actions={
          <>
            <button
              type="button"
              className="dash-btn dash-btn--ghost"
              disabled={saving}
              onClick={() => setMode(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="dash-btn dash-btn--primary"
              disabled={saving}
              onClick={() => {
                const fake = { preventDefault() {} } as FormEvent
                void onSubmit(fake)
              }}
            >
              {saving ? (
                <>
                  <LoaderCircleIcon size={16} className="animate-spin" />
                  Saving…
                </>
              ) : mode === "add" ? (
                "Create"
              ) : (
                "Save"
              )}
            </button>
          </>
        }
      >
        <div className="service-form">
          <label className="dash-field">
            <span>Title</span>
            <input
              className="dash-input"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Kitchen Sink & Tap Fix"
              required
            />
          </label>
          <div className="dash-field">
            <span>Category</span>
            {categories.length === 0 ? (
              <p className="service-form__hint">
                {categoriesQuery.isLoading
                  ? "Loading categories…"
                  : "No categories yet. Create one under Admin → Categories first."}
              </p>
            ) : (
              <BrowseSelect
                aria-label="Service category"
                value={form.categoryId || ""}
                onValueChange={(value) =>
                  setForm((f) => ({ ...f, categoryId: value }))
                }
                searchable
                searchPlaceholder="Search category…"
                placeholder="Select a category"
                className="service-form__select"
                options={categories.map((c) => ({
                  value: c.id,
                  label: c.name,
                  keywords: c.slug,
                }))}
              />
            )}
          </div>
          <label className="dash-field">
            <span>Price (৳)</span>
            <input
              className="dash-input"
              type="number"
              min={0}
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              placeholder="900"
              required
            />
          </label>
          <label className="dash-field">
            <span>Duration</span>
            <input
              className="dash-input"
              value={form.duration}
              onChange={(e) =>
                setForm((f) => ({ ...f, duration: e.target.value }))
              }
              placeholder="45 min"
            />
          </label>
          <label className="dash-field">
            <span>Description</span>
            <textarea
              className="dash-input"
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="What this job includes for the customer"
            />
          </label>
          <label className="dash-field">
            <span>Cover image</span>
            <div className="service-form__media">
              <span className="service-form__thumb">
                <ServiceMedia
                  image={form.imagePreview}
                  title={form.title || "Service"}
                  glyphSize={20}
                />
              </span>
              <input
                className="dash-input"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null
                  if (!file) {
                    setForm((f) => ({
                      ...f,
                      imageFile: null,
                      imagePreview: mode === "edit" ? f.imagePreview : null,
                    }))
                    return
                  }
                  if (file.size > 5 * 1024 * 1024) {
                    pushToast(
                      "Image too large",
                      "Keep the cover under 5MB.",
                      "error"
                    )
                    return
                  }
                  setForm((f) => ({
                    ...f,
                    imageFile: file,
                    imagePreview: URL.createObjectURL(file),
                  }))
                }}
              />
            </div>
          </label>
          <label className="dash-check">
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(e) =>
                setForm((f) => ({ ...f, isFeatured: e.target.checked }))
              }
            />
            Featured on home
          </label>
        </div>
      </DashModal>

      <DashModal
        open={Boolean(deleteSvc)}
        title={deleteSvc ? `Delete ${deleteSvc.title}?` : "Delete service"}
        onClose={() => setDeleteSvc(null)}
        actions={
          <>
            <button
              type="button"
              className="dash-btn dash-btn--ghost"
              onClick={() => setDeleteSvc(null)}
            >
              Keep
            </button>
            <button
              type="button"
              className="dash-btn dash-btn--primary"
              disabled={deleteMutation.isPending}
              onClick={() => void confirmDelete()}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </button>
          </>
        }
      >
        <p>
          Remove <strong>{deleteSvc?.title}</strong> from the catalogue? This
          cannot be undone.
        </p>
      </DashModal>

      <DashToastHost toasts={toasts} />
    </AdminShell>
  )
}
