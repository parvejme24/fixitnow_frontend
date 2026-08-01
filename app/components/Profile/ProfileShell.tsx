"use client"

import Link from "next/link"
import {
  AlertTriangleIcon,
  CalendarDaysIcon,
  InboxIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MapPinIcon,
  StarIcon,
  TagIcon,
  UserRoundIcon,
  UsersIcon,
  WalletIcon,
  WrenchIcon,
} from "lucide-react"
import type { ReactNode } from "react"

import DashShell, {
  type DashNavGroup,
} from "@/app/components/Dashboard/DashShell"
import { useAuth } from "@/app/providers/AuthProvider"
import { initialsFromName, type AuthRole } from "@/lib/auth/types"

/** Same sidebar groups as each role’s dashboard — keep every route visible on profile. */
function navForRole(role: AuthRole, techId?: string | null): DashNavGroup[] {
  if (role === "ADMIN") {
    return [
      {
        label: "Oversight",
        items: [
          {
            label: "Overview",
            href: "/dashboard/admin",
            icon: <LayoutDashboardIcon />,
          },
          {
            label: "Users",
            href: "/dashboard/admin/users",
            icon: <UsersIcon />,
          },
          {
            label: "Bookings",
            href: "/dashboard/admin/bookings",
            icon: <CalendarDaysIcon />,
          },
          {
            label: "Categories",
            href: "/dashboard/admin/categories",
            icon: <TagIcon />,
          },
          {
            label: "Areas",
            href: "/dashboard/admin/areas",
            icon: <MapPinIcon />,
          },
          {
            label: "Services",
            href: "/dashboard/admin/services",
            icon: <WrenchIcon />,
          },
          {
            label: "Disputes",
            href: "/dashboard/admin/disputes",
            icon: <AlertTriangleIcon />,
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
            active: true,
          },
          { label: "Log out", href: "#", icon: <LogOutIcon /> },
        ],
      },
    ]
  }

  if (role === "TECHNICIAN") {
    const publicHref = techId ? `/technician?id=${techId}` : "/technicians"
    return [
      {
        label: "Work",
        items: [
          {
            label: "Overview",
            href: "/dashboard/technician",
            icon: <LayoutDashboardIcon />,
          },
          {
            label: "Bookings",
            href: "/dashboard/technician",
            icon: <InboxIcon />,
          },
          {
            label: "Availability",
            href: "/dashboard/technician",
            icon: <CalendarDaysIcon />,
          },
          {
            label: "Earnings",
            href: "/dashboard/technician",
            icon: <WalletIcon />,
          },
        ],
      },
      {
        label: "Profile",
        items: [
          {
            label: "My services",
            href: "/dashboard/technician",
            icon: <WrenchIcon />,
          },
          {
            label: "Public profile",
            href: publicHref,
            icon: <StarIcon />,
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
            active: true,
          },
          { label: "Log out", href: "#", icon: <LogOutIcon /> },
        ],
      },
    ]
  }

  return [
    {
      label: "Booking",
      items: [
        {
          label: "My bookings",
          href: "/bookings",
          icon: <InboxIcon />,
        },
        {
          label: "Browse services",
          href: "/services",
          icon: <WrenchIcon />,
        },
        {
          label: "Pay a booking",
          href: "/bookings",
          icon: <WalletIcon />,
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
          active: true,
        },
        { label: "Log out", href: "#", icon: <LogOutIcon /> },
      ],
    },
  ]
}

export default function ProfileShell({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  if (!user) return <>{children}</>

  const role = user.role
  const roleLabel =
    role === "ADMIN" ? "Admin" : role === "TECHNICIAN" ? "Technician" : "Customer"

  return (
    <DashShell
      role={role}
      displayName={user.name || "Account"}
      roleLabel={roleLabel}
      initials={user.initials || initialsFromName(user.name || user.email)}
      image={user.image}
      online
      groups={navForRole(role, user.technicianProfile?.id)}
    >
      {children}
    </DashShell>
  )
}

export function ProfileBreadcrumb() {
  const { user } = useAuth()
  const home =
    user?.role === "ADMIN"
      ? "/dashboard/admin"
      : user?.role === "TECHNICIAN"
        ? "/dashboard/technician"
        : "/bookings"
  const homeLabel =
    user?.role === "ADMIN"
      ? "Admin"
      : user?.role === "TECHNICIAN"
        ? "Technician"
        : "Bookings"

  return (
    <p className="dash-breadcrumb">
      <Link href={home}>{homeLabel}</Link>
      <span>/</span>
      <span>Profile</span>
    </p>
  )
}
