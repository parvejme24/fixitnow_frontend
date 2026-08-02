"use client"

import Link from "next/link"
import { useEffect, useMemo, useState, type RefObject } from "react"
import {
  CheckCircle2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LoaderCircleIcon,
  SearchIcon,
  UsersIcon,
} from "lucide-react"

import BrowseSelect from "@/app/components/Shared/BrowseSelect/BrowseSelect"
import type { AdminUser } from "@/app/lib/admin-data"
import { useAuth } from "@/app/providers/AuthProvider"
import {
  getUserErrorMessage,
  useAdminUsersQuery,
  useUpdateUserRole,
  useUpdateUserStatus,
  useUpdateUserVerified,
} from "@/lib/admin/use-admin-users"
import type { AuthRole } from "@/lib/auth/types"
import { adminRoleToApi } from "@/lib/admin/users-api"
import AdminShell from "./AdminShell"
import { useReveal } from "./DashShell"
import {
  DashToastHost,
  StatCard,
  StatusBadge,
  useDashToasts,
} from "./DashShared"

const PAGE_SIZE = 10
const ROLE_OPTIONS: AdminUser["role"][] = ["Customer", "Technician", "Admin"]
type VerifiedFilter = "all" | "true" | "false"

function useDebounced<T>(value: T, ms: number) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const id = window.setTimeout(() => setV(value), ms)
    return () => window.clearTimeout(id)
  }, [value, ms])
  return v
}

function roleClass(role: AdminUser["role"]) {
  if (role === "Admin") return "user-role user-role--admin"
  if (role === "Technician") return "user-role user-role--tech"
  return "user-role user-role--customer"
}

function UserAvatar({ user }: { user: AdminUser }) {
  const [broken, setBroken] = useState(false)
  const showImage = Boolean(user.image) && !broken
  const isVerified =
    user.role === "Technician" && Boolean(user.technicianVerified)

  return (
    <span className="user-avatar" aria-hidden>
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={user.image!}
          alt=""
          className="user-avatar__img"
          onError={() => setBroken(true)}
        />
      ) : (
        <span className="user-avatar__fallback">{user.initials}</span>
      )}
      {isVerified ? <span className="user-avatar__verified" /> : null}
    </span>
  )
}

function VerifiedSignal() {
  return (
    <span className="user-verified-signal" title="Verified">
      <CheckCircle2Icon size={14} aria-hidden />
      Verified
    </span>
  )
}

function UnverifiedSignal() {
  return (
    <span className="user-verified-signal user-verified-signal--off" title="Unverified">
      Unverified
    </span>
  )
}

export default function AdminUsers() {
  const { user: me } = useAuth()
  const { toasts, pushToast } = useDashToasts()
  const [q, setQ] = useState("")
  const debouncedQ = useDebounced(q, 200)
  const [roleFilter, setRoleFilter] = useState("Every role")
  const [verifiedFilter, setVerifiedFilter] = useState<VerifiedFilter>("all")
  const [page, setPage] = useState(0)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [verifyPendingId, setVerifyPendingId] = useState<string | null>(null)
  const [statusPendingId, setStatusPendingId] = useState<string | null>(null)

  const apiQuery = useMemo(() => {
    const role: AuthRole | undefined =
      roleFilter === "Every role"
        ? undefined
        : adminRoleToApi(roleFilter as AdminUser["role"])
    const verified =
      verifiedFilter === "all" ? undefined : verifiedFilter === "true"
    return { role, verified }
  }, [roleFilter, verifiedFilter])

  const usersQuery = useAdminUsersQuery(apiQuery)
  const roleMutation = useUpdateUserRole()
  const statusMutation = useUpdateUserStatus()
  const verifyMutation = useUpdateUserVerified()
  const users = usersQuery.data ?? []
  const revealRef = useReveal([page, usersQuery.isFetching, apiQuery])

  const filtered = useMemo(() => {
    const query = debouncedQ.trim().toLowerCase()
    if (!query) return users
    return users.filter((u) =>
      `${u.name} ${u.email}`.toLowerCase().includes(query)
    )
  }, [users, debouncedQ])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const showPagination = filtered.length > PAGE_SIZE
  const safePage = Math.min(page, pageCount - 1)
  const start = safePage * PAGE_SIZE
  const pageRows = filtered.slice(start, start + PAGE_SIZE)
  const showingFrom = filtered.length ? start + 1 : 0
  const showingTo = Math.min(start + PAGE_SIZE, filtered.length)

  const customers = users.filter((u) => u.role === "Customer").length
  const technicians = users.filter((u) => u.role === "Technician").length
  const admins = users.filter((u) => u.role === "Admin").length
  const verifiedTechs = users.filter(
    (u) => u.role === "Technician" && u.technicianVerified
  ).length
  const unverifiedTechs = users.filter(
    (u) => u.role === "Technician" && !u.technicianVerified
  ).length

  const resetFilters = () => {
    setQ("")
    setRoleFilter("Every role")
    setVerifiedFilter("all")
    setPage(0)
  }

  const changeRole = async (user: AdminUser, role: AdminUser["role"]) => {
    if (role === user.role || roleMutation.isPending) return
    if (me?.id && user.id === me.id) {
      pushToast(
        "Cannot change your role",
        "You cannot change your own account role.",
        "error"
      )
      return
    }
    setPendingId(user.id)
    try {
      await roleMutation.mutateAsync({ id: user.id, role })
      pushToast("Role updated", `${user.name} is now a ${role.toLowerCase()}.`)
    } catch (error) {
      pushToast("Could not update role", getUserErrorMessage(error), "error")
    } finally {
      setPendingId(null)
    }
  }

  const changeVerified = async (user: AdminUser, verified: boolean) => {
    if (user.role !== "Technician") return
    if (!user.technicianId) {
      pushToast(
        "No technician profile",
        "This account has no technician profile to verify.",
        "error"
      )
      return
    }
    if (Boolean(user.technicianVerified) === verified || verifyMutation.isPending)
      return
    setVerifyPendingId(user.id)
    try {
      await verifyMutation.mutateAsync({ id: user.id, verified })
      pushToast(
        verified ? "Technician verified" : "Verification removed",
        verified
          ? `${user.name} is now verified and can appear publicly.`
          : `${user.name} is unverified and hidden from the technicians list.`
      )
    } catch (error) {
      pushToast("Could not update verification", getUserErrorMessage(error), "error")
    } finally {
      setVerifyPendingId(null)
    }
  }

  const changeStatus = async (user: AdminUser, status: AdminUser["status"]) => {
    if (status === user.status || statusMutation.isPending) return
    setStatusPendingId(user.id)
    try {
      await statusMutation.mutateAsync({ id: user.id, status })
      pushToast("Status updated", `${user.name} is now ${status.toLowerCase()}.`)
    } catch (error) {
      pushToast("Could not update status", getUserErrorMessage(error), "error")
    } finally {
      setStatusPendingId(null)
    }
  }

  return (
    <AdminShell page="users">
      <div ref={revealRef as RefObject<HTMLDivElement>}>
        <p className="dash-breadcrumb">
          <Link href="/dashboard/admin">Admin</Link>
          <span>/</span>
          <span>Users</span>
        </p>
        <header className="dash-head">
          <div>
            <h1 className="dash-title">All users</h1>
            <p className="dash-sub">
              Load every account, filter by role or verification, and toggle
              technician verified status. You cannot change your own role.
            </p>
          </div>
          <div className="dash-head__actions">
            <button
              type="button"
              className="dash-btn dash-btn--ghost"
              onClick={() => void usersQuery.refetch()}
              disabled={usersQuery.isFetching}
            >
              {usersQuery.isFetching ? (
                <>
                  <LoaderCircleIcon size={16} className="animate-spin" />
                  Refreshing…
                </>
              ) : (
                "Refresh"
              )}
            </button>
          </div>
        </header>

        {usersQuery.isError ? (
          <div className="dash-empty dash-card" style={{ marginBottom: 16 }}>
            <h3>Could not load users</h3>
            <p>{getUserErrorMessage(usersQuery.error)}</p>
            <button
              type="button"
              className="dash-btn dash-btn--ghost"
              onClick={() => void usersQuery.refetch()}
            >
              Retry
            </button>
          </div>
        ) : null}

        <div className="stat-row">
          <StatCard
            icon={<UsersIcon size={18} />}
            value={users.length}
            label="Loaded users"
            delta="From /admin/users"
            delay={0}
            animate={!usersQuery.isLoading}
          />
          <StatCard
            icon={<UsersIcon size={18} />}
            value={customers}
            label="Customers"
            delta="Book services"
            variant="sky"
            delay={55}
            animate={!usersQuery.isLoading}
          />
          <StatCard
            icon={<UsersIcon size={18} />}
            value={technicians}
            label="Technicians"
            delta={`${verifiedTechs} verified · ${unverifiedTechs} pending`}
            variant="signal"
            delay={110}
            animate={!usersQuery.isLoading}
          />
          <StatCard
            icon={<UsersIcon size={18} />}
            value={admins}
            label="Admins"
            delta="Platform access"
            variant="violet"
            delay={165}
            animate={!usersQuery.isLoading}
          />
        </div>

        <section className="dash-card" id="users" style={{ marginTop: 14 }}>
          <div className="dash-card__head">
            <h2 className="dash-card__title">Accounts</h2>
          </div>

          <div className="admin-filters admin-filters--users">
            <label className="dash-search">
              <SearchIcon size={16} />
              <input
                className="dash-input"
                placeholder="Search name or email"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value)
                  setPage(0)
                }}
              />
            </label>
            <BrowseSelect
              value={roleFilter}
              onValueChange={(v) => {
                setRoleFilter(v)
                setPage(0)
              }}
              options={[
                { value: "Every role", label: "Every role" },
                { value: "Customer", label: "Customer" },
                { value: "Technician", label: "Technician" },
                { value: "Admin", label: "Admin" },
              ]}
            />
            <BrowseSelect
              value={verifiedFilter}
              onValueChange={(v) => {
                setVerifiedFilter(v as VerifiedFilter)
                setPage(0)
              }}
              options={[
                { value: "all", label: "All verification" },
                { value: "true", label: "Verified" },
                { value: "false", label: "Unverified" },
              ]}
            />
          </div>

          <div className="table-wrap table-wrap--scroll">
            {usersQuery.isLoading ? (
              <div>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="skel skel-row" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="dash-empty">
                <h3>No accounts match</h3>
                <p>Try clearing search or resetting filters.</p>
                <button
                  type="button"
                  className="dash-btn dash-btn--ghost"
                  onClick={resetFilters}
                >
                  Reset filters
                </button>
              </div>
            ) : (
              <>
                <div className="table-scroll">
                  <table className="dash-table users-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Role</th>
                        <th>Joined</th>
                        <th>Status</th>
                        <th>Change status</th>
                        <th>Change role</th>
                        <th>Verification</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageRows.map((u) => {
                        const isSelf = Boolean(me?.id && u.id === me.id)
                        const isTech = u.role === "Technician"
                        const isVerified = isTech && Boolean(u.technicianVerified)
                        const busy =
                          pendingId === u.id && roleMutation.isPending
                        const verifying =
                          verifyPendingId === u.id && verifyMutation.isPending
                        return (
                          <tr key={u.id}>
                            <td>
                              <div className="cell-person">
                                <UserAvatar user={u} />
                                <div className="cell-stack">
                                  <strong>
                                    <span>
                                      {u.name}
                                      {isSelf ? " (you)" : ""}
                                    </span>
                                    {isVerified ? (
                                      <CheckCircle2Icon
                                        size={14}
                                        className="user-name-verified"
                                        aria-label="Verified"
                                      />
                                    ) : null}
                                  </strong>
                                  <small className="mono-muted">{u.email}</small>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className={roleClass(u.role)}>{u.role}</span>
                            </td>
                            <td className="mono-muted">{u.joined}</td>
                            <td>
                              <div className="user-status-cell">
                                <StatusBadge status={u.status} />
                                {isTech ? (
                                  isVerified ? (
                                    <VerifiedSignal />
                                  ) : (
                                    <UnverifiedSignal />
                                  )
                                ) : null}
                              </div>
                            </td>
                            <td>
                              <div className="user-role-select">
                                <select
                                  className="dash-input user-role-select__input"
                                  value={u.status}
                                  disabled={
                                    isSelf ||
                                    (statusPendingId === u.id &&
                                      statusMutation.isPending)
                                  }
                                  aria-label={`Change status for ${u.name}`}
                                  onChange={(e) =>
                                    void changeStatus(
                                      u,
                                      e.target.value as AdminUser["status"]
                                    )
                                  }
                                >
                                  <option value="Active">Active</option>
                                  <option value="Suspended">Suspended</option>
                                  <option value="Banned">Banned</option>
                                </select>
                              </div>
                            </td>
                            <td>
                              {isSelf ? (
                                <span className="mono-muted">Your role</span>
                              ) : (
                                <div className="user-role-select">
                                  <select
                                    className="dash-input user-role-select__input"
                                    value={u.role}
                                    disabled={busy}
                                    aria-label={`Change role for ${u.name}`}
                                    onChange={(e) =>
                                      void changeRole(
                                        u,
                                        e.target.value as AdminUser["role"]
                                      )
                                    }
                                  >
                                    {ROLE_OPTIONS.map((role) => (
                                      <option key={role} value={role}>
                                        {role}
                                      </option>
                                    ))}
                                  </select>
                                  {busy ? (
                                    <LoaderCircleIcon
                                      size={14}
                                      className="animate-spin user-role-select__spin"
                                    />
                                  ) : null}
                                </div>
                              )}
                            </td>
                            <td>
                              {isTech ? (
                                u.technicianId ? (
                                  <div className="user-role-select">
                                    <select
                                      className="dash-input user-role-select__input"
                                      value={isVerified ? "true" : "false"}
                                      disabled={verifying}
                                      aria-label={`Change verification for ${u.name}`}
                                      onChange={(e) =>
                                        void changeVerified(
                                          u,
                                          e.target.value === "true"
                                        )
                                      }
                                    >
                                      <option value="true">Verified</option>
                                      <option value="false">Unverified</option>
                                    </select>
                                    {verifying ? (
                                      <LoaderCircleIcon
                                        size={14}
                                        className="animate-spin user-role-select__spin"
                                      />
                                    ) : null}
                                  </div>
                                ) : (
                                  <span className="mono-muted">No profile</span>
                                )
                              ) : (
                                <span className="mono-muted">—</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="table-foot">
                  <span>
                    Showing {showingFrom}–{showingTo} of {filtered.length}{" "}
                    accounts
                  </span>
                  {showPagination ? (
                    <div className="pager pager--nums">
                      <button
                        type="button"
                        disabled={safePage === 0}
                        aria-label="Previous page"
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                      >
                        <ChevronLeftIcon size={18} />
                      </button>
                      {Array.from({ length: pageCount }).map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          className={i === safePage ? "is-active" : undefined}
                          onClick={() => setPage(i)}
                        >
                          {i + 1}
                        </button>
                      ))}
                      <button
                        type="button"
                        disabled={safePage >= pageCount - 1}
                        aria-label="Next page"
                        onClick={() =>
                          setPage((p) => Math.min(pageCount - 1, p + 1))
                        }
                      >
                        <ChevronRightIcon size={18} />
                      </button>
                    </div>
                  ) : null}
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      <DashToastHost toasts={toasts} />
    </AdminShell>
  )
}
