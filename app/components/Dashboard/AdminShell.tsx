"use client"

import {
  AlertTriangleIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  TagIcon,
  UsersIcon,
} from "lucide-react"
import type { ReactNode } from "react"

import { useAdminCategoriesQuery } from "@/lib/admin/use-admin-categories"
import DashShell from "./DashShell"

type AdminPage = "overview" | "categories" | "disputes"

export default function AdminShell({
  page,
  children,
  categoryCount,
}: {
  page: AdminPage
  children: ReactNode
  categoryCount?: number
}) {
  const categoriesQuery = useAdminCategoriesQuery()
  const count = categoryCount ?? categoriesQuery.data?.length ?? 8

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
          href: "/dashboard/admin#users",
          icon: <UsersIcon />,
          pill: 18,
          active: false,
        },
        {
          label: "Categories",
          href: "/dashboard/admin/categories",
          icon: <TagIcon />,
          pill: count,
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
      items: [{ label: "Log out", href: "#", icon: <LogOutIcon /> }],
    },
  ]

  return (
    <DashShell
      role="ADMIN"
      displayName="Platform admin"
      roleLabel="Admin"
      initials="AD"
      online
      groups={groups}
    >
      {children}
    </DashShell>
  )
}
