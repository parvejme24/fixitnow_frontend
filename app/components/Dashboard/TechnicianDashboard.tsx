"use client"

import Link from "next/link"
import { useEffect, useMemo, useState, type RefObject } from "react"
import {
  CalendarDaysIcon,
  InboxIcon,
  LayoutDashboardIcon,
  LoaderCircleIcon,
  LockIcon,
  LogOutIcon,
  ShieldAlertIcon,
  StarIcon,
  TagsIcon,
  UserRoundIcon,
  WalletIcon,
  WrenchIcon,
} from "lucide-react"
import { useReducedMotion } from "framer-motion"

import { useAuth } from "@/app/providers/AuthProvider"
import ProfileFace from "@/app/components/Shared/ProfileFace"
import {
  formatTaka,
  SLOT_TIMES,
  WEEK_DAYS,
} from "@/app/lib/dashboard-data"
import { toDashBooking } from "@/lib/bookings/api"
import {
  getBookingErrorMessage,
  useAcceptBooking,
  useDeclineBooking,
  useMyBookings,
  useUpdateBookingStatus,
} from "@/lib/bookings/hooks"
import type { Booking, BookingStatus as ApiBookingStatus } from "@/lib/bookings/types"
import { useCategories } from "@/lib/catalogue/hooks"
import {
  addOneHour,
  slotKey,
  to24h,
} from "@/lib/technicians/api"
import {
  getTechnicianErrorMessage,
  useCreateMySlot,
  useDeleteMySlot,
  useMyTechnicianId,
  useMyTechnicianProfile,
  useMyTechnicianSlots,
  useUpdateMyCategories,
  useUpdateMySkills,
  useUpdateMySlot,
  useUpdateMyTechnicianProfile,
} from "@/lib/technicians/hooks"
import DashShell, { useReveal } from "./DashShell"
import {
  DashModal,
  DashTabs,
  DashToastHost,
  StatCard,
  StatusBadge,
  useDashToasts,
} from "./DashShared"

const TABS = [
  "Overview",
  "Bookings",
  "Availability",
  "Public profile",
  "Categories",
  "Earnings",
] as const

type TechTab = (typeof TABS)[number]

function nextSevenDays() {
  const start = new Date()
  start.setHours(12, 0, 0, 0)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const iso = d.toISOString().slice(0, 10)
    return {
      iso,
      label: WEEK_DAYS[d.getDay()],
      short: `${WEEK_DAYS[d.getDay()]} ${d.getDate()}`,
    }
  })
}

export default function TechnicianDashboard() {
  const { user } = useAuth()
  const name = user?.name || "Technician"
  const first = name.split(" ")[0] || "there"
  const techId = useMyTechnicianId()
  const profileQuery = useMyTechnicianProfile()
  const slotsQuery = useMyTechnicianSlots()
  const categoriesQuery = useCategories()
  const updateProfile = useUpdateMyTechnicianProfile()
  const updateCategories = useUpdateMyCategories()
  const updateSkills = useUpdateMySkills()
  const createSlot = useCreateMySlot()
  const updateSlot = useUpdateMySlot()
  const deleteSlot = useDeleteMySlot()
  const bookingsQuery = useMyBookings()
  const acceptBookingMut = useAcceptBooking()
  const declineBookingMut = useDeclineBooking()
  const updateBookingStatus = useUpdateBookingStatus()

  const tech = profileQuery.data
  const slots = slotsQuery.data ?? []

  const reduceMotion = useReducedMotion() ?? false
  const { toasts, pushToast } = useDashToasts()
  const [tab, setTab] = useState<TechTab>("Overview")
  const [barsReady, setBarsReady] = useState(false)
  const [leavingIds, setLeavingIds] = useState<string[]>([])
  const [respondingId, setRespondingId] = useState<string | null>(null)
  const [advancingId, setAdvancingId] = useState<string | null>(null)
  const [slotBusyKey, setSlotBusyKey] = useState<string | null>(null)
  const [editSlotId, setEditSlotId] = useState<string | null>(null)
  const [editStart, setEditStart] = useState("09:00")
  const [editEnd, setEditEnd] = useState("10:00")

  const rawById = useMemo(() => {
    const map = new Map<string, Booking>()
    for (const b of bookingsQuery.data ?? []) {
      map.set(b.id, b)
    }
    return map
  }, [bookingsQuery.data])

  const bookings = useMemo(
    () => (bookingsQuery.data ?? []).map(toDashBooking),
    [bookingsQuery.data]
  )
  const loading = bookingsQuery.isLoading

  const [trade, setTrade] = useState("")
  const [visitFee, setVisitFee] = useState("")
  const [bio, setBio] = useState("")
  const [expYrs, setExpYrs] = useState("")
  const [selectedCats, setSelectedCats] = useState<string[]>([])
  const [skills, setSkills] = useState<string[]>([])
  const [skillDraft, setSkillDraft] = useState("")
  const [profileSynced, setProfileSynced] = useState<string | null>(null)

  const barsOn = reduceMotion || barsReady
  const revealRef = useReveal([tab, loading, barsOn, profileQuery.isFetching])

  const week = useMemo(() => nextSevenDays(), [])

  const slotMap = useMemo(() => {
    const map = new Map<string, (typeof slots)[number]>()
    for (const slot of slots) {
      map.set(slotKey(slot.date, slot.startTime), slot)
    }
    return map
  }, [slots])

  useEffect(() => {
    let onId = 0
    const offId = window.setTimeout(() => {
      setBarsReady(false)
      onId = window.setTimeout(() => setBarsReady(true), reduceMotion ? 0 : 200)
    }, 0)
    return () => {
      window.clearTimeout(offId)
      window.clearTimeout(onId)
    }
  }, [tab, reduceMotion])

  useEffect(() => {
    if (!tech) return
    if (profileSynced === tech.id) return
    setTrade(tech.trade || "")
    setVisitFee(String(tech.rate || ""))
    setBio(tech.bio || "")
    setExpYrs(String(tech.exp || ""))
    setSelectedCats(tech.cats || [])
    setSkills(tech.skills || [])
    setProfileSynced(tech.id)
  }, [tech, profileSynced])

  const takingJobs = tech?.online ?? true
  const isVerified = tech?.verified === true

  const requireVerified = (action: string) => {
    if (isVerified) return true
    pushToast(
      "Account not verified",
      `An admin must verify your technician profile before you can ${action}.`,
      "error"
    )
    return false
  }

  const pending = bookings.filter((b) => b.status === "REQUESTED")
  const upcoming = bookings.filter((b) =>
    ["ACCEPTED", "PAID", "IN_PROGRESS"].includes(b.status)
  )
  const monthEarn = bookings
    .filter((b) => ["PAID", "COMPLETED", "IN_PROGRESS"].includes(b.status))
    .reduce((s, b) => s + b.amount, 0)

  const respond = async (id: string, action: "accept" | "decline") => {
    if (respondingId) return
    const row = bookings.find((b) => b.id === id)
    setRespondingId(id)
    setLeavingIds((prev) => [...prev, id])
    try {
      if (action === "accept") {
        await acceptBookingMut.mutateAsync(id)
        pushToast(
          "Request accepted",
          row ? `${row.reference} is now accepted.` : "Request accepted."
        )
      } else {
        await declineBookingMut.mutateAsync(id)
        pushToast(
          "Request declined",
          row ? `${row.reference} was declined.` : "Request declined."
        )
      }
    } catch (error) {
      pushToast(
        action === "accept" ? "Could not accept" : "Could not decline",
        getBookingErrorMessage(error),
        "error"
      )
    } finally {
      setLeavingIds((prev) => prev.filter((x) => x !== id))
      setRespondingId(null)
    }
  }

  type AdvanceStatus = Extract<
    ApiBookingStatus,
    "EN_ROUTE" | "ON_SITE" | "COMPLETED"
  >

  const nextAdvance = (raw: Booking | undefined): AdvanceStatus | null => {
    if (!raw) return null
    if (raw.status === "ACCEPTED" || raw.status === "PAID") return "EN_ROUTE"
    if (raw.status === "EN_ROUTE") return "ON_SITE"
    if (raw.status === "ON_SITE" || raw.status === "IN_PROGRESS") {
      return "COMPLETED"
    }
    return null
  }

  const advanceStatus = async (id: string) => {
    if (advancingId) return
    const raw = rawById.get(id)
    const next = nextAdvance(raw)
    if (!next) return
    setAdvancingId(id)
    try {
      await updateBookingStatus.mutateAsync({ id, status: next })
      pushToast(
        "Status updated",
        `${raw?.reference ?? "Booking"} is now ${next.replace(/_/g, " ").toLowerCase()}.`
      )
    } catch (error) {
      pushToast(
        "Could not update status",
        getBookingErrorMessage(error),
        "error"
      )
    } finally {
      setAdvancingId(null)
    }
  }

  const advanceLabel = (raw: Booking | undefined) => {
    const next = nextAdvance(raw)
    if (next === "EN_ROUTE") return "En route"
    if (next === "ON_SITE") return "On site"
    if (next === "COMPLETED") return "Complete"
    return null
  }

  const toggleOnline = async () => {
    try {
      await updateProfile.mutateAsync({ online: !takingJobs })
      pushToast(
        !takingJobs ? "Taking jobs" : "Paused",
        !takingJobs
          ? "Customers can book you again."
          : "New booking requests are paused."
      )
    } catch (error) {
      pushToast("Could not update status", getTechnicianErrorMessage(error), "error")
    }
  }

  const toggleSlotCell = async (dateIso: string, time12: string) => {
    if (!requireVerified("add availability")) return
    const startTime = to24h(time12)
    const key = slotKey(dateIso, startTime)
    const existing = slotMap.get(key)
    if (existing?.isBooked) return
    if (slotBusyKey || createSlot.isPending || deleteSlot.isPending) return

    if (existing) {
      setEditSlotId(existing.id)
      setEditStart(to24h(existing.startTime))
      setEditEnd(to24h(existing.endTime) || addOneHour(to24h(existing.startTime)))
      return
    }

    setSlotBusyKey(key)
    try {
      await createSlot.mutateAsync({
        date: dateIso,
        startTime,
        endTime: addOneHour(startTime),
      })
      pushToast("Slot opened", `${dateIso} ${time12} is available.`)
    } catch (error) {
      pushToast("Could not update slot", getTechnicianErrorMessage(error), "error")
    } finally {
      setSlotBusyKey(null)
    }
  }

  const saveEditedSlot = async () => {
    if (!editSlotId) return
    if (!requireVerified("manage availability")) return
    try {
      await updateSlot.mutateAsync({
        slotId: editSlotId,
        input: { startTime: editStart, endTime: editEnd },
      })
      pushToast("Slot updated", "Availability times were saved.")
      setEditSlotId(null)
    } catch (error) {
      pushToast("Could not update slot", getTechnicianErrorMessage(error), "error")
    }
  }

  const closeEditedSlot = async () => {
    if (!editSlotId) return
    if (!requireVerified("manage availability")) return
    try {
      await deleteSlot.mutateAsync(editSlotId)
      pushToast("Slot closed", "That time is no longer bookable.")
      setEditSlotId(null)
    } catch (error) {
      pushToast("Could not close slot", getTechnicianErrorMessage(error), "error")
    }
  }

  const saveProfile = async () => {
    try {
      await updateProfile.mutateAsync({
        trade: trade.trim() || undefined,
        bio: bio.trim(),
        visitFee: Number(visitFee) || 0,
        experienceYrs: Number(expYrs) || 0,
      })
      pushToast("Profile saved", "Your public profile was updated.")
    } catch (error) {
      pushToast("Could not save profile", getTechnicianErrorMessage(error), "error")
    }
  }

  const saveCategories = async () => {
    if (!requireVerified("set categories")) return
    try {
      await updateCategories.mutateAsync(selectedCats)
      pushToast("Categories saved", "Service categories updated.")
    } catch (error) {
      pushToast(
        "Could not save categories",
        getTechnicianErrorMessage(error),
        "error"
      )
    }
  }

  const saveSkills = async () => {
    try {
      await updateSkills.mutateAsync(skills)
      pushToast("Skills saved", "Your skill tags were updated.")
    } catch (error) {
      pushToast("Could not save skills", getTechnicianErrorMessage(error), "error")
    }
  }

  const addSkill = () => {
    const next = skillDraft.trim()
    if (!next) return
    if (skills.some((s) => s.toLowerCase() === next.toLowerCase())) {
      setSkillDraft("")
      return
    }
    setSkills((prev) => [...prev, next])
    setSkillDraft("")
  }

  const earningsMonths = useMemo(() => {
    const paid = (bookingsQuery.data ?? []).filter((b) =>
      ["PAID", "COMPLETED", "IN_PROGRESS", "EN_ROUTE", "ON_SITE"].includes(
        b.status
      )
    )
    const byMonth = new Map<string, number>()
    for (const b of paid) {
      let label = "Now"
      const src = b.createdAt || b.date
      const d = new Date(src)
      if (!Number.isNaN(d.getTime())) {
        label = d.toLocaleString("en-US", { month: "short" })
      } else if (typeof src === "string") {
        const parts = src.trim().split(/\s+/)
        if (parts.length >= 2) label = parts[1].slice(0, 3)
      }
      byMonth.set(label, (byMonth.get(label) ?? 0) + b.amount)
    }
    const rows = Array.from(byMonth.entries()).map(([label, value]) => ({
      label,
      value,
    }))
    return rows.length ? rows : [{ label: "—", value: 0 }]
  }, [bookingsQuery.data])

  const maxEarn = Math.max(...earningsMonths.map((m) => m.value), 1)
  const publicHref = techId ? `/technician?id=${techId}` : "/technicians"
  const categories = (categoriesQuery.data ?? []).filter((c) => c.isVisible)

  const groups = [
    {
      label: "Work",
      items: [
        {
          label: "Overview",
          href: "/dashboard/technician",
          icon: <LayoutDashboardIcon />,
          active: tab === "Overview",
          onClick: () => setTab("Overview"),
        },
        {
          label: "Bookings",
          href: "/dashboard/technician",
          icon: <InboxIcon />,
          pill: pending.length || undefined,
          active: tab === "Bookings",
          onClick: () => setTab("Bookings"),
        },
        {
          label: "Availability",
          href: "/dashboard/technician",
          icon: <CalendarDaysIcon />,
          active: tab === "Availability",
          onClick: () => setTab("Availability"),
        },
        {
          label: "Earnings",
          href: "/dashboard/technician",
          icon: <WalletIcon />,
          active: tab === "Earnings",
          onClick: () => setTab("Earnings"),
        },
      ],
    },
    {
      label: "Manage profile",
      items: [
        {
          label: "Public profile",
          href: "/dashboard/technician",
          icon: <WrenchIcon />,
          active: tab === "Public profile",
          onClick: () => setTab("Public profile"),
        },
        {
          label: "Categories",
          href: "/dashboard/technician",
          icon: <TagsIcon />,
          active: tab === "Categories",
          onClick: () => setTab("Categories"),
        },
        {
          label: "View live page",
          href: publicHref,
          icon: <StarIcon />,
        },
      ],
    },
    {
      label: "Account",
      items: [
        {
          label: "Photo & account",
          href: "/dashboard/profile",
          icon: <UserRoundIcon />,
        },
        { label: "Log out", href: "#", icon: <LogOutIcon /> },
      ],
    },
  ]

  const todayTomorrow = useMemo(() => {
    const fmt = (d: Date) =>
      d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(now.getDate() + 1)
    const allow = new Set([fmt(now), fmt(tomorrow)])
    return upcoming.filter((b) => allow.has(b.date))
  }, [upcoming])

  const openSlotCount = slots.filter((s) => !s.isBooked).length

  return (
    <DashShell
      role="TECHNICIAN"
      displayName={name}
      roleLabel="Technician"
      online={takingJobs}
      initials={user?.initials || undefined}
      image={user?.image}
      groups={groups}
    >
      <div ref={revealRef as RefObject<HTMLDivElement>}>
        <header className="dash-head">
          <div>
            <p className="dash-eyebrow">Technician dashboard</p>
            <h1 className="dash-title">Good morning, {first}</h1>
            <p className="dash-sub">
              {pending.length
                ? `${pending.length} request${pending.length === 1 ? "" : "s"} waiting on your answer.`
                : "No pending requests right now."}{" "}
              {!isVerified
                ? "Your account is unverified — availability and categories stay locked."
                : openSlotCount
                  ? `${openSlotCount} open slot${openSlotCount === 1 ? "" : "s"} this week.`
                  : "Add availability so customers can book you."}
            </p>
          </div>
          <div className="dash-head__actions">
            <div className="switch-wrap">
              <button
                type="button"
                className={`switch${takingJobs ? " is-on" : ""}`}
                aria-pressed={takingJobs}
                disabled={updateProfile.isPending || !techId}
                onClick={() => void toggleOnline()}
              >
                <i />
              </button>
              Taking jobs
            </div>
            <Link href={publicHref} className="dash-btn dash-btn--primary">
              View public profile →
            </Link>
          </div>
        </header>

        {!techId ? (
          <div className="dash-empty dash-card" style={{ marginBottom: 16 }}>
            <h3>Technician profile missing</h3>
            <p>
              Your account has no technician profile id yet. Sign out and back
              in, or complete technician registration.
            </p>
          </div>
        ) : null}

        {techId && !isVerified ? (
          <div className="tech-verify-banner" role="status">
            <ShieldAlertIcon size={22} aria-hidden />
            <div>
              <strong>Waiting for admin verification</strong>
              <p>
                You can edit your public profile and photo, but you cannot open
                availability slots or set categories until an admin verifies
                your account.
              </p>
            </div>
          </div>
        ) : null}

        <div className="stat-row">
          <StatCard
            icon={<InboxIcon size={18} />}
            value={pending.length}
            label="Pending requests"
            delta="Answer within 30 min"
            delay={0}
          />
          <StatCard
            icon={<CalendarDaysIcon size={18} />}
            value={openSlotCount}
            label="Open slots"
            delta={slotsQuery.isFetching ? "Refreshing…" : "Next 7 days"}
            variant="sky"
            delay={55}
          />
          <StatCard
            icon={<WalletIcon size={18} />}
            value={monthEarn}
            label="Earnings this month"
            delta="+18% vs June"
            variant="signal"
            prefix="৳"
            delay={110}
          />
          <StatCard
            icon={<StarIcon size={18} />}
            value={tech?.rating ?? 0}
            label="Your rating"
            delta={`${tech?.reviews ?? 0} reviews`}
            variant="violet"
            decimals={1}
            delay={165}
          />
        </div>

        <DashTabs
          tabs={[...TABS]}
          active={tab}
          onChange={(next) => setTab(next as TechTab)}
        />

        {tab === "Overview" && (
          <>
            <section className="dash-card" style={{ marginBottom: 14 }}>
              <div className="dash-card__head">
                <h2 className="dash-card__title">Manage your work</h2>
              </div>
              <p className="dash-card__sub">
                Jump to bookings, slots, profile details, or earnings.
              </p>
              <div className="tech-manage-grid">
                {(
                  [
                    {
                      tab: "Bookings" as TechTab,
                      label: "Bookings",
                      hint: pending.length
                        ? `${pending.length} pending`
                        : "Requests & jobs",
                      icon: <InboxIcon size={18} />,
                    },
                    {
                      tab: "Availability" as TechTab,
                      label: "Availability",
                      hint: isVerified
                        ? `${openSlotCount} open slots`
                        : "Locked until verified",
                      icon: isVerified ? (
                        <CalendarDaysIcon size={18} />
                      ) : (
                        <LockIcon size={18} />
                      ),
                    },
                    {
                      tab: "Public profile" as TechTab,
                      label: "Public profile",
                      hint: tech?.trade || "Trade, bio, skills",
                      icon: <WrenchIcon size={18} />,
                    },
                    {
                      tab: "Categories" as TechTab,
                      label: "Categories",
                      hint: isVerified
                        ? `${selectedCats.length} selected`
                        : "Locked until verified",
                      icon: isVerified ? (
                        <TagsIcon size={18} />
                      ) : (
                        <LockIcon size={18} />
                      ),
                    },
                    {
                      tab: "Earnings" as TechTab,
                      label: "Earnings",
                      hint: formatTaka(monthEarn),
                      icon: <WalletIcon size={18} />,
                    },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.tab}
                    type="button"
                    className="tech-manage-tile"
                    onClick={() => setTab(item.tab)}
                  >
                    <span className="tech-manage-tile__icon">{item.icon}</span>
                    <strong>{item.label}</strong>
                    <span>{item.hint}</span>
                  </button>
                ))}
                <Link href="/dashboard/profile" className="tech-manage-tile">
                  <span className="tech-manage-tile__icon">
                    <UserRoundIcon size={18} />
                  </span>
                  <strong>Photo & account</strong>
                  <span>Name, phone, photo</span>
                </Link>
                <Link href={publicHref} className="tech-manage-tile">
                  <span className="tech-manage-tile__icon">
                    <StarIcon size={18} />
                  </span>
                  <strong>Live page</strong>
                  <span>See what customers see</span>
                </Link>
              </div>
            </section>

            <section className="dash-card" style={{ marginBottom: 14 }}>
              <div className="dash-card__head">
                <h2 className="dash-card__title">Waiting on your answer</h2>
                <button
                  type="button"
                  className="dash-card__link"
                  onClick={() => setTab("Bookings")}
                >
                  Open bookings →
                </button>
              </div>
              {loading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="skel skel-row" />
                ))
              ) : pending.length === 0 ? (
                <div className="dash-empty">
                  <h3>Inbox clear</h3>
                  <p>No requests waiting right now.</p>
                </div>
              ) : (
                pending.slice(0, 3).map((b) => (
                  <div
                    key={b.id}
                    className={`req-row${leavingIds.includes(b.id) ? " is-leaving" : ""}`}
                  >
                    <span className="dash-avatar">{b.customer.initials}</span>
                    <div className="req-row__meta">
                      <strong>{b.service}</strong>
                      <div
                        style={{
                          color: "var(--steel-400)",
                          fontSize: "0.85rem",
                        }}
                      >
                        {b.customer.name} · {b.area} · {b.date} · {b.time}
                      </div>
                    </div>
                    <strong>{formatTaka(b.amount)}</strong>
                    <div className="req-row__actions">
                      <button
                        type="button"
                        className="dash-btn dash-btn--ghost dash-btn--sm"
                        disabled={respondingId === b.id}
                        onClick={() => void respond(b.id, "decline")}
                      >
                        Decline
                      </button>
                      <button
                        type="button"
                        className="dash-btn dash-btn--primary dash-btn--sm"
                        disabled={respondingId === b.id}
                        onClick={() => void respond(b.id, "accept")}
                      >
                        {respondingId === b.id ? "…" : "Accept"}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </section>

            <section className="dash-card">
              <h2 className="dash-card__title">Today and tomorrow</h2>
              <div className="job-strip" style={{ marginTop: 14 }}>
                {(todayTomorrow.length ? todayTomorrow : upcoming.slice(0, 4)).map(
                  (b) => {
                    const label = advanceLabel(rawById.get(b.id))
                    return (
                      <div key={b.id} className="job-mini">
                        <div className="job-mini__top">
                          <StatusBadge status={b.status} />
                          <strong>{formatTaka(b.amount)}</strong>
                        </div>
                        <strong>{b.service}</strong>
                        <div
                          style={{
                            color: "var(--steel-400)",
                            fontSize: "0.85rem",
                          }}
                        >
                          {b.customer.name} · {b.area}
                        </div>
                        <div
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.72rem",
                            marginTop: 6,
                          }}
                        >
                          {b.date} · {b.time}
                        </div>
                        {label ? (
                          <button
                            type="button"
                            className="dash-btn dash-btn--primary dash-btn--sm"
                            style={{ marginTop: 10 }}
                            disabled={advancingId === b.id}
                            onClick={() => void advanceStatus(b.id)}
                          >
                            {advancingId === b.id ? "Updating…" : label}
                          </button>
                        ) : null}
                      </div>
                    )
                  }
                )}
                {!todayTomorrow.length && !upcoming.length && (
                  <p style={{ color: "var(--steel-400)" }}>
                    No jobs in the next two days.
                  </p>
                )}
              </div>
            </section>
          </>
        )}

        {tab === "Bookings" && (
          <>
            <section className="dash-card" style={{ marginBottom: 14 }}>
              <div className="dash-card__head">
                <h2 className="dash-card__title">Pending requests</h2>
              </div>
              {loading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="skel skel-row" />
                ))
              ) : pending.length === 0 ? (
                <div className="dash-empty">
                  <h3>No pending requests</h3>
                  <p>New customer requests will land here.</p>
                </div>
              ) : (
                pending.map((b) => (
                  <div
                    key={b.id}
                    className={`req-row${leavingIds.includes(b.id) ? " is-leaving" : ""}`}
                  >
                    <span className="dash-avatar">{b.customer.initials}</span>
                    <div className="req-row__meta">
                      <strong>{b.service}</strong>
                      <div
                        style={{
                          color: "var(--steel-400)",
                          fontSize: "0.85rem",
                        }}
                      >
                        {b.customer.name} · {b.area} · {b.date} · {b.time}
                      </div>
                    </div>
                    <strong>{formatTaka(b.amount)}</strong>
                    <div className="req-row__actions">
                      <Link
                        href={`/bookings/${b.id}`}
                        className="dash-btn dash-btn--ghost dash-btn--sm"
                      >
                        Details
                      </Link>
                      <button
                        type="button"
                        className="dash-btn dash-btn--ghost dash-btn--sm"
                        disabled={respondingId === b.id}
                        onClick={() => void respond(b.id, "decline")}
                      >
                        Decline
                      </button>
                      <button
                        type="button"
                        className="dash-btn dash-btn--primary dash-btn--sm"
                        disabled={respondingId === b.id}
                        onClick={() => void respond(b.id, "accept")}
                      >
                        {respondingId === b.id ? "…" : "Accept"}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </section>

            <section className="dash-card">
              <div className="dash-card__head">
                <h2 className="dash-card__title">Upcoming & active jobs</h2>
              </div>
              {!upcoming.length ? (
                <div className="dash-empty">
                  <h3>No active jobs</h3>
                  <p>Accepted bookings will show here.</p>
                </div>
              ) : (
                upcoming.map((b) => {
                  const label = advanceLabel(rawById.get(b.id))
                  return (
                    <div key={b.id} className="req-row">
                      <span className="dash-avatar">{b.customer.initials}</span>
                      <div className="req-row__meta">
                        <strong>{b.service}</strong>
                        <div
                          style={{
                            color: "var(--steel-400)",
                            fontSize: "0.85rem",
                          }}
                        >
                          {b.customer.name} · {b.area} · {b.date} · {b.time}
                        </div>
                      </div>
                      <StatusBadge status={b.status} />
                      <strong>{formatTaka(b.amount)}</strong>
                      <div className="req-row__actions">
                        <Link
                          href={`/bookings/${b.id}`}
                          className="dash-btn dash-btn--ghost dash-btn--sm"
                        >
                          Details
                        </Link>
                        {label ? (
                          <button
                            type="button"
                            className="dash-btn dash-btn--primary dash-btn--sm"
                            disabled={advancingId === b.id}
                            onClick={() => void advanceStatus(b.id)}
                          >
                            {advancingId === b.id ? "Updating…" : label}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  )
                })
              )}
            </section>
          </>
        )}

        {tab === "Availability" && (
          <section className="dash-card">
            <div className="dash-card__head">
              <h2 className="dash-card__title">Weekly availability</h2>
              {slotsQuery.isFetching ? (
                <LoaderCircleIcon size={16} className="animate-spin" />
              ) : null}
            </div>
            {!isVerified ? (
              <div className="dash-empty" style={{ marginTop: 8 }}>
                <LockIcon size={28} aria-hidden />
                <h3>Availability locked</h3>
                <p>
                  Unverified technicians cannot open or edit slots. Ask an admin
                  to verify your profile, then come back here to set your week.
                </p>
              </div>
            ) : (
              <>
                <p style={{ color: "var(--steel-400)" }}>
                  Tap a closed cell to open a slot. Tap an open slot to edit or
                  close it. Booked slots stay locked.
                </p>
                {slotsQuery.isError ? (
                  <div className="dash-empty" style={{ marginTop: 12 }}>
                    <h3>Could not load slots</h3>
                    <p>{getTechnicianErrorMessage(slotsQuery.error)}</p>
                    <button
                      type="button"
                      className="dash-btn dash-btn--ghost"
                      onClick={() => void slotsQuery.refetch()}
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="sched" style={{ marginTop: 14 }}>
                      <div />
                      {week.map((d) => (
                        <div key={d.iso} className="sched__head">
                          {d.short}
                        </div>
                      ))}
                      {SLOT_TIMES.map((time) => (
                        <div key={time} style={{ display: "contents" }}>
                          <div className="sched__time">
                            {time.replace(":00 ", " ")}
                          </div>
                          {week.map((day) => {
                            const start = to24h(time)
                            const key = slotKey(day.iso, start)
                            const existing = slotMap.get(key)
                            const state = existing
                              ? existing.isBooked
                                ? "booked"
                                : "open"
                              : "off"
                            const busy = slotBusyKey === key
                            return (
                              <button
                                key={key}
                                type="button"
                                className={`sched__cell is-${state}`}
                                disabled={
                                  state === "booked" || busy || !techId
                                }
                                onClick={() =>
                                  void toggleSlotCell(day.iso, time)
                                }
                                aria-label={`${day.short} ${time}`}
                              />
                            )
                          })}
                        </div>
                      ))}
                    </div>
                    <div className="sched-legend">
                      <span>
                        <i style={{ background: "var(--hivis)" }} /> Open
                      </span>
                      <span>
                        <i style={{ background: "var(--steel-700)" }} /> Booked
                      </span>
                      <span>
                        <i style={{ background: "var(--concrete)" }} /> Closed
                      </span>
                    </div>
                  </>
                )}
              </>
            )}
          </section>
        )}

        {tab === "Public profile" && (
          <div className="dash-grid-2">
            <section className="dash-card">
              <div className="dash-card__head">
                <h2 className="dash-card__title">Public profile</h2>
                {profileQuery.isFetching ? (
                  <LoaderCircleIcon size={16} className="animate-spin" />
                ) : null}
              </div>
              {profileQuery.isError ? (
                <div className="dash-empty">
                  <h3>Could not load profile</h3>
                  <p>{getTechnicianErrorMessage(profileQuery.error)}</p>
                  <button
                    type="button"
                    className="dash-btn dash-btn--ghost"
                    onClick={() => void profileQuery.refetch()}
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      marginBottom: 14,
                    }}
                  >
                    <ProfileFace
                      image={user?.image ?? tech?.image}
                      initials={
                        user?.initials ||
                        tech?.initials ||
                        name.slice(0, 2).toUpperCase()
                      }
                      className="dash-avatar"
                    />
                    <div>
                      <strong style={{ display: "block" }}>{name}</strong>
                      <span
                        style={{
                          fontSize: "0.82rem",
                          color: "var(--steel-400)",
                        }}
                      >
                        Photo is managed in{" "}
                        <Link href="/dashboard/profile">Photo & account</Link>
                      </span>
                    </div>
                  </div>
                  <p>
                    <StatusBadge
                      status={takingJobs ? "Active" : "Suspended"}
                    />{" "}
                    {isVerified ? (
                      <span className="badge-soft">Verified</span>
                    ) : (
                      <span className="badge-soft badge-soft--warn">
                        Unverified
                      </span>
                    )}
                  </p>
                  <label
                    className="dash-field"
                    style={{ display: "block", marginTop: 12 }}
                  >
                    <span
                      style={{ fontSize: "0.82rem", color: "var(--steel-400)" }}
                    >
                      Trade
                    </span>
                    <input
                      className="dash-input"
                      value={trade}
                      onChange={(e) => setTrade(e.target.value)}
                      placeholder="e.g. Plumbing"
                    />
                  </label>
                  <label
                    className="dash-field"
                    style={{ display: "block", marginTop: 10 }}
                  >
                    <span
                      style={{ fontSize: "0.82rem", color: "var(--steel-400)" }}
                    >
                      Visit fee (৳)
                    </span>
                    <input
                      className="dash-input"
                      type="number"
                      min={0}
                      value={visitFee}
                      onChange={(e) => setVisitFee(e.target.value)}
                    />
                  </label>
                  <label
                    className="dash-field"
                    style={{ display: "block", marginTop: 10 }}
                  >
                    <span
                      style={{ fontSize: "0.82rem", color: "var(--steel-400)" }}
                    >
                      Experience (years)
                    </span>
                    <input
                      className="dash-input"
                      type="number"
                      min={0}
                      value={expYrs}
                      onChange={(e) => setExpYrs(e.target.value)}
                    />
                  </label>
                  <label
                    className="dash-field"
                    style={{ display: "block", marginTop: 10 }}
                  >
                    <span
                      style={{ fontSize: "0.82rem", color: "var(--steel-400)" }}
                    >
                      Bio
                    </span>
                    <textarea
                      className="dash-input"
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell customers what you specialize in"
                    />
                  </label>
                  <button
                    type="button"
                    className="dash-btn dash-btn--primary"
                    style={{ marginTop: 12 }}
                    disabled={updateProfile.isPending || !techId}
                    onClick={() => void saveProfile()}
                  >
                    {updateProfile.isPending ? "Saving…" : "Save profile"}
                  </button>
                </>
              )}
            </section>

            <section className="dash-card">
              <h2 className="dash-card__title">Skills</h2>
              <p style={{ color: "var(--steel-400)", marginBottom: 12 }}>
                Short tags shown on your public technician page.
              </p>
              <div className="chip-row">
                {skills.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="dash-chip is-active"
                    onClick={() =>
                      setSkills((prev) => prev.filter((x) => x !== s))
                    }
                  >
                    {s} ×
                  </button>
                ))}
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginTop: 10,
                  flexWrap: "wrap",
                }}
              >
                <input
                  className="dash-input"
                  style={{ flex: 1, minWidth: 140 }}
                  value={skillDraft}
                  onChange={(e) => setSkillDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addSkill()
                    }
                  }}
                  placeholder="Add a skill"
                />
                <button
                  type="button"
                  className="dash-btn dash-btn--ghost"
                  onClick={addSkill}
                >
                  Add
                </button>
                <button
                  type="button"
                  className="dash-btn dash-btn--primary"
                  disabled={updateSkills.isPending || !techId}
                  onClick={() => void saveSkills()}
                >
                  {updateSkills.isPending ? "Saving…" : "Save skills"}
                </button>
              </div>

              {tech?.offeredServices?.length ? (
                <>
                  <h3
                    className="dash-card__title"
                    style={{ marginTop: 22, fontSize: "1rem" }}
                  >
                    Linked services
                  </h3>
                  {tech.offeredServices.map((s) => (
                    <div
                      key={s.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "12px 0",
                        borderTop: "1px solid var(--steel-100)",
                      }}
                    >
                      <span>{s.title}</span>
                      <strong>{formatTaka(s.price)}</strong>
                    </div>
                  ))}
                </>
              ) : (
                <p style={{ color: "var(--steel-400)", marginTop: 16 }}>
                  Visit fee {formatTaka(tech?.rate ?? 0)} · {tech?.area || "—"}
                </p>
              )}

              <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Link href={publicHref} className="dash-btn dash-btn--ghost">
                  View live page →
                </Link>
                <button
                  type="button"
                  className="dash-btn dash-btn--ghost"
                  onClick={() => setTab("Categories")}
                >
                  Manage categories
                </button>
              </div>
            </section>
          </div>
        )}

        {tab === "Categories" && (
          <section className="dash-card">
            <div className="dash-card__head">
              <h2 className="dash-card__title">Categories you serve</h2>
              {!isVerified ? <LockIcon size={16} aria-hidden /> : null}
            </div>
            {!isVerified ? (
              <div className="dash-empty" style={{ marginTop: 8 }}>
                <LockIcon size={28} aria-hidden />
                <h3>Categories locked</h3>
                <p>
                  Unverified technicians cannot change service categories. Once
                  an admin verifies you, pick the categories customers should
                  find you under.
                </p>
                {selectedCats.length ? (
                  <p style={{ marginTop: 10, color: "var(--steel-400)" }}>
                    Current selection stays as-is until you are verified.
                  </p>
                ) : null}
              </div>
            ) : (
              <>
                <p style={{ color: "var(--steel-400)", marginBottom: 12 }}>
                  Pick the categories customers should find you under.
                </p>
                <div className="chip-row">
                  {categories.map((c) => {
                    const on = selectedCats.includes(c.id)
                    return (
                      <button
                        key={c.id}
                        type="button"
                        className={`dash-chip${on ? " is-active" : ""}`}
                        onClick={() =>
                          setSelectedCats((prev) =>
                            on
                              ? prev.filter((id) => id !== c.id)
                              : [...prev, c.id]
                          )
                        }
                      >
                        {c.icon ? `${c.icon} ` : ""}
                        {c.name}
                      </button>
                    )
                  })}
                </div>
                <button
                  type="button"
                  className="dash-btn dash-btn--primary"
                  style={{ marginTop: 14 }}
                  disabled={updateCategories.isPending || !techId}
                  onClick={() => void saveCategories()}
                >
                  {updateCategories.isPending ? "Saving…" : "Save categories"}
                </button>
              </>
            )}
          </section>
        )}

        {tab === "Earnings" && (
          <div className="dash-grid-2">
            <section className="dash-card">
              <div className="dash-card__head">
                <h2 className="dash-card__title">Monthly earnings</h2>
                <span className="badge-soft">From your bookings</span>
              </div>
              <div className="chart chart--sm">
                {earningsMonths.map((m) => (
                  <div key={m.label} className="chart__col">
                    <div
                      className={`chart__bar${barsOn ? " is-on" : ""}`}
                      style={{
                        ["--h" as string]: `${(m.value / maxEarn) * 100}%`,
                      }}
                      data-tip={formatTaka(m.value)}
                    />
                    <span className="chart__label">{m.label}</span>
                  </div>
                ))}
              </div>
            </section>
            <section className="dash-card">
              <h2 className="dash-card__title">Paid jobs</h2>
              {bookings
                .filter((b) => ["PAID", "COMPLETED"].includes(b.status))
                .map((b) => (
                  <Link
                    key={b.id}
                    href={`/bookings/${b.id}`}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                      padding: "10px 0",
                      borderTop: "1px solid var(--steel-100)",
                      textDecoration: "none",
                      color: "inherit",
                    }}
                  >
                    <div>
                      <strong>{b.reference}</strong>
                      <div
                        style={{
                          color: "var(--steel-400)",
                          fontSize: "0.82rem",
                        }}
                      >
                        {b.service}
                      </div>
                    </div>
                    <strong>{formatTaka(b.amount)}</strong>
                  </Link>
                ))}
              {!bookings.some((b) =>
                ["PAID", "COMPLETED"].includes(b.status)
              ) ? (
                <p style={{ color: "var(--steel-400)", marginTop: 12 }}>
                  Paid jobs will show here once customers complete payment.
                </p>
              ) : null}
            </section>
          </div>
        )}
      </div>

      <DashModal
        open={Boolean(editSlotId)}
        title="Edit availability slot"
        onClose={() => setEditSlotId(null)}
        actions={
          <>
            <button
              type="button"
              className="dash-btn dash-btn--ghost"
              onClick={() => void closeEditedSlot()}
              disabled={deleteSlot.isPending || updateSlot.isPending}
            >
              Close slot
            </button>
            <button
              type="button"
              className="dash-btn dash-btn--primary"
              onClick={() => void saveEditedSlot()}
              disabled={updateSlot.isPending}
            >
              {updateSlot.isPending ? "Saving…" : "Save times"}
            </button>
          </>
        }
      >
        <p style={{ color: "var(--steel-400)", marginTop: 0 }}>
          Update start/end times, or close this slot so customers cannot book it.
        </p>
        <label className="dash-field" style={{ display: "block", marginBottom: 10 }}>
          <span>Start (24h)</span>
          <input
            className="dash-input"
            value={editStart}
            onChange={(e) => setEditStart(e.target.value)}
            placeholder="09:00"
          />
        </label>
        <label className="dash-field" style={{ display: "block" }}>
          <span>End (24h)</span>
          <input
            className="dash-input"
            value={editEnd}
            onChange={(e) => setEditEnd(e.target.value)}
            placeholder="11:00"
          />
        </label>
      </DashModal>

      <DashToastHost toasts={toasts} />
    </DashShell>
  )
}
