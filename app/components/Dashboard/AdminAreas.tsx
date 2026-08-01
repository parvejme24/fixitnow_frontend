"use client"

import { useMemo, useState, type FormEvent, type RefObject } from "react"
import {
  LoaderCircleIcon,
  MapPinIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react"

import type { Area } from "@/lib/catalogue/types"
import {
  getAreaErrorMessage,
  useAdminAreasQuery,
  useCreateArea,
  useDeleteArea,
  useUpdateArea,
} from "@/lib/admin/use-admin-areas"
import AdminShell from "./AdminShell"
import { useReveal } from "./DashShell"
import {
  DashModal,
  DashToastHost,
  StatCard,
  useDashToasts,
} from "./DashShared"

export default function AdminAreas() {
  const { toasts, pushToast } = useDashToasts()
  const areasQuery = useAdminAreasQuery()
  const createMutation = useCreateArea()
  const updateMutation = useUpdateArea()
  const deleteMutation = useDeleteArea()

  const areas = areasQuery.data ?? []
  const [q, setQ] = useState("")
  const [name, setName] = useState("")
  const [mode, setMode] = useState<"add" | "edit" | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteAreaRow, setDeleteAreaRow] = useState<Area | null>(null)
  const revealRef = useReveal([areasQuery.isFetching, mode])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return areas
    return areas.filter((a) => a.name.toLowerCase().includes(query))
  }, [areas, q])

  const totalTechs = areas.reduce((sum, a) => sum + (a.technicianCount || 0), 0)

  const openAdd = () => {
    setName("")
    setEditId(null)
    setMode("add")
  }

  const openEdit = (area: Area) => {
    setName(area.name)
    setEditId(area.id)
    setMode("edit")
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      pushToast("Name required", "Enter an area name.", "error")
      return
    }

    try {
      if (mode === "edit" && editId) {
        await updateMutation.mutateAsync({
          id: editId,
          input: { name: trimmed },
        })
        pushToast("Area updated", `${trimmed} was saved.`)
      } else {
        await createMutation.mutateAsync({ name: trimmed })
        pushToast("Area created", `${trimmed} is available for technicians.`)
      }
      setMode(null)
      setEditId(null)
      setName("")
    } catch (error) {
      pushToast(
        mode === "edit" ? "Could not update area" : "Could not create area",
        getAreaErrorMessage(error),
        "error"
      )
    }
  }

  const onDelete = async () => {
    if (!deleteAreaRow) return
    try {
      await deleteMutation.mutateAsync(deleteAreaRow.id)
      pushToast("Area deleted", `${deleteAreaRow.name} was removed.`)
      setDeleteAreaRow(null)
    } catch (error) {
      pushToast("Could not delete area", getAreaErrorMessage(error), "error")
    }
  }

  const saving = createMutation.isPending || updateMutation.isPending

  return (
    <AdminShell page="areas">
      <div ref={revealRef as RefObject<HTMLDivElement>}>
        <header className="dash-head">
          <div>
            <p className="dash-eyebrow">Admin · Catalogue</p>
            <h1 className="dash-title">Service areas</h1>
            <p className="dash-sub">
              Public list from <code>GET /areas</code>. Admins can create,
              rename, and delete areas used in technician filters.
            </p>
          </div>
          <div className="dash-head__actions">
            <button
              type="button"
              className="dash-btn dash-btn--primary"
              onClick={openAdd}
            >
              <PlusIcon size={16} /> Add area
            </button>
          </div>
        </header>

        <div className="stat-row">
          <StatCard
            icon={<MapPinIcon size={18} />}
            value={areas.length}
            label="Areas"
            delta={areasQuery.isFetching ? "Refreshing…" : "Live catalogue"}
            delay={0}
          />
          <StatCard
            icon={<MapPinIcon size={18} />}
            value={totalTechs}
            label="Technicians covered"
            delta="Across all areas"
            variant="sky"
            delay={55}
          />
        </div>

        <section className="dash-card">
          <div className="dash-card__head">
            <h2 className="dash-card__title">All areas</h2>
            <div className="admin-filters" style={{ margin: 0, gridTemplateColumns: "1fr auto" }}>
              <label className="dash-field" style={{ margin: 0 }}>
                <span className="sr-only">Search areas</span>
                <span style={{ position: "relative", display: "block" }}>
                  <SearchIcon
                    size={16}
                    style={{
                      position: "absolute",
                      left: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--steel-400)",
                    }}
                  />
                  <input
                    className="dash-input"
                    style={{ paddingLeft: 36 }}
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search by name"
                  />
                </span>
              </label>
              {areasQuery.isFetching ? (
                <LoaderCircleIcon size={18} className="animate-spin" />
              ) : null}
            </div>
          </div>

          {areasQuery.isError ? (
            <div className="dash-empty">
              <h3>Could not load areas</h3>
              <p>{getAreaErrorMessage(areasQuery.error)}</p>
              <button
                type="button"
                className="dash-btn dash-btn--ghost"
                onClick={() => void areasQuery.refetch()}
              >
                Retry
              </button>
            </div>
          ) : areasQuery.isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skel skel-row" />
            ))
          ) : filtered.length === 0 ? (
            <div className="dash-empty">
              <h3>No areas yet</h3>
              <p>Add Dhaka neighbourhoods so technicians can set coverage.</p>
              <button
                type="button"
                className="dash-btn dash-btn--primary"
                onClick={openAdd}
              >
                Add area
              </button>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Area</th>
                    <th>Technicians</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((area) => (
                    <tr key={area.id}>
                      <td>
                        <strong>{area.name}</strong>
                      </td>
                      <td className="mono-muted">{area.technicianCount}</td>
                      <td>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button
                            type="button"
                            className="dash-btn dash-btn--ghost dash-btn--sm"
                            onClick={() => openEdit(area)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="dash-btn dash-btn--ghost dash-btn--sm"
                            onClick={() => setDeleteAreaRow(area)}
                            aria-label={`Delete ${area.name}`}
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
          )}
        </section>
      </div>

      <DashModal
        open={mode !== null}
        title={mode === "edit" ? "Edit area" : "Add area"}
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
              type="submit"
              form="admin-area-form"
              className="dash-btn dash-btn--primary"
              disabled={saving}
            >
              {saving ? "Saving…" : mode === "edit" ? "Save changes" : "Create area"}
            </button>
          </>
        }
      >
        <form id="admin-area-form" onSubmit={(e) => void onSubmit(e)}>
          <label className="dash-field" style={{ display: "block" }}>
            <span>Area name</span>
            <input
              className="dash-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mohammadpur"
              autoFocus
            />
          </label>
        </form>
      </DashModal>

      <DashModal
        open={Boolean(deleteAreaRow)}
        title="Delete this area?"
        onClose={() => {
          if (deleteMutation.isPending) return
          setDeleteAreaRow(null)
        }}
        actions={
          <>
            <button
              type="button"
              className="dash-btn dash-btn--ghost"
              disabled={deleteMutation.isPending}
              onClick={() => setDeleteAreaRow(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="dash-btn dash-btn--primary"
              disabled={deleteMutation.isPending}
              onClick={() => void onDelete()}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete area"}
            </button>
          </>
        }
      >
        <p style={{ marginTop: 0, color: "var(--steel-400)" }}>
          {deleteAreaRow
            ? `Remove “${deleteAreaRow.name}” from the catalogue? Technicians linked to it may need a new area.`
            : null}
        </p>
      </DashModal>

      <DashToastHost toasts={toasts} />
    </AdminShell>
  )
}
