"use client"

import {
  AlertTriangleIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  TagIcon,
  UserRoundIcon,
  UsersIcon,
} from "lucide-react"
import type { ReactNode } from "react"

import { useAuth } from "@/app/providers/AuthProvider"
import { useAdminCategoriesQuery } from "@/lib/admin/use-admin-categories"
import { useAdminUsersQuery } from "@/lib/admin/use-admin-users"
import { initialsFromName } from "@/lib/auth/types"
import DashShell from "./DashShell"

type AdminPage = "overview" | "users" | "categories" | "disputes"

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
  const usersQuery = useAdminUsersQuery()
  const count = categoryCount ?? categoriesQuery.data?.length ?? 0
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
          label: "Categories",
          href: "/dashboard/admin/categories",
          icon: <TagIcon />,
          pill: count || undefined,
          active: page === "categories",
        },
        {
          label: "Disputes",
          href: "/dashboard/admin/disputes",
          icon: <AlertTriangleIcon />,
          pill: 3,
          active: page === "disputes",
        },
      ],
    },
    {
      label: "Account",
      items: [
        {
          label: "My profile",
          href: "/profile",
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
      online
      groups={groups}
    >
      {children}
    </DashShell>
  )
}
