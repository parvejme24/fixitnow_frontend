"use client"

import {
  AlertTriangleIcon,
  CalendarDaysIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MapPinIcon,
  TagIcon,
  UserRoundIcon,
  UsersIcon,
  WrenchIcon,
} from "lucide-react"
import type { ReactNode } from "react"

import { useAuth } from "@/app/providers/AuthProvider"
import { useAdminAreasQuery } from "@/lib/admin/use-admin-areas"
import { useAdminCategoriesQuery } from "@/lib/admin/use-admin-categories"
import { useAdminUsersQuery } from "@/lib/admin/use-admin-users"
import { initialsFromName } from "@/lib/auth/types"
import DashShell from "./DashShell"

type AdminPage =
  | "overview"
  | "users"
  | "categories"
  | "areas"
  | "services"
  | "bookings"
  | "disputes"

export default function AdminShell({
  page,
  children,
  categoryCount,
}: {
  page: AdminPage
  children: ReactNode
  categoryCount?: number
}) {
  const { user } = useAuth()
  const categoriesQuery = useAdminCategoriesQuery()
  const areasQuery = useAdminAreasQuery()
  const usersQuery = useAdminUsersQuery()
  const count = categoryCount ?? categoriesQuery.data?.length ?? 0
  const areaCount = areasQuery.data?.length ?? 0
  const userCount = usersQuery.data?.length ?? 0

  const groups = [
    {
      label: "Oversight",
      items: [
        {
          label: "Overview",
          href: "/dashboard/admin",
          icon: <LayoutDashboardIcon />,
          active: page === "overview",
        },
        {
          label: "Users",
          href: "/dashboard/admin/users",
          icon: <UsersIcon />,
          pill: userCount || undefined,
          active: page === "users",
        },
        {
          label: "Bookings",
          href: "/dashboard/admin/bookings",
          icon: <CalendarDaysIcon />,
          active: page === "bookings",
        },
        {
          label: "Categories",
          href: "/dashboard/admin/categories",
          icon: <TagIcon />,
          pill: count || undefined,
          active: page === "categories",
        },
        {
          label: "Areas",
          href: "/dashboard/admin/areas",
          icon: <MapPinIcon />,
          pill: areaCount || undefined,
          active: page === "areas",
        },
        {
          label: "Services",
          href: "/dashboard/admin/services",
          icon: <WrenchIcon />,
          active: page === "services",
        },
        {
          label: "Disputes",
          href: "/dashboard/admin/disputes",
          icon: <AlertTriangleIcon />,
          active: page === "disputes",
        },
      ],
    },
    {
      label: "Account",
      items: [
        {
          label: "My profile",
          href: "/dashboard/profile",
          icon: <UserRoundIcon />,
        },
        { label: "Log out", href: "#", icon: <LogOutIcon /> },
      ],
    },
  ]

  return (
    <DashShell
      role="ADMIN"
      displayName={user?.name || "Platform admin"}
      roleLabel="Admin"
      initials={
        user?.initials || initialsFromName(user?.name || "Platform admin")
      }
      image={user?.image}
      online
      groups={groups}
    >
      {children}
    </DashShell>
  )
}
