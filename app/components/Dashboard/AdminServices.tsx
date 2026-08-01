"use client"

import Link from "next/link"
import { useMemo, useState, type FormEvent, type RefObject } from "react"
import {
  LoaderCircleIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
  WrenchIcon,
} from "lucide-react"

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
  const [form, setForm] = useState<FormState>(emptyForm)
  const [mode, setMode] = useState<"add" | "edit" | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteSvc, setDeleteSvc] = useState<Service | null>(null)
  const revealRef = useReveal([servicesQuery.isFetching, mode])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return services
    return services.filter((s) =>
      `${s.title} ${s.catName} ${s.desc}`.toLowerCase().includes(query)
    )
  }, [services, q])

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
            value={services.length}
            label="Services"
            delta="From /services"
            delay={0}
            animate={!servicesQuery.isLoading}
          />
          <StatCard
            icon={<WrenchIcon size={18} />}
            value={services.filter((s) => s.isFeatured).length}
            label="Featured"
            delta="Homepage"
            variant="sky"
            delay={55}
            animate={!servicesQuery.isLoading}
          />
        </div>

        <section className="dash-card" style={{ marginTop: 14 }}>
          <label className="dash-search" style={{ maxWidth: 360, marginBottom: 14 }}>
            <SearchIcon size={16} />
            <input
              className="dash-input"
              placeholder="Search services"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </label>

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
              <h3>No services</h3>
              <p>Add a service to populate the catalogue.</p>
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
                      <th>Featured</th>
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
                              {s.tag ? (
                                <div className="mono-muted">
                                  {formatServiceTag(s.tag)}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </td>
                        <td>{s.catName}</td>
                        <td>{formatTaka(s.price)}</td>
                        <td className="mono-muted">{s.dur}</td>
                        <td>{s.isFeatured ? "Yes" : "—"}</td>
                        <td>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              type="button"
                              className="dash-btn dash-btn--ghost dash-btn--sm"
                              onClick={() => openEdit(s)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="dash-btn dash-btn--ghost dash-btn--sm"
                              onClick={() => setDeleteSvc(s)}
                              aria-label={`Delete ${s.title}`}
                            >
                              <Trash2Icon size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
          <label className="dash-field">
            <span>Category</span>
            {categories.length === 0 ? (
              <p className="service-form__hint">
                {categoriesQuery.isLoading
                  ? "Loading categories…"
                  : "No categories yet. Create one under Admin → Categories first."}
              </p>
            ) : (
              <select
                className="dash-input"
                value={form.categoryId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, categoryId: e.target.value }))
                }
                required
              >
                <option value="" disabled>
                  Select a category
                </option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </label>
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
          <label className="dash-field">
            <span>Tag</span>
            <select
              className="dash-input"
              value={form.tag}
              onChange={(e) => setForm((f) => ({ ...f, tag: e.target.value }))}
            >
              <option value="">No tag</option>
              {SERVICE_TAG_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
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
