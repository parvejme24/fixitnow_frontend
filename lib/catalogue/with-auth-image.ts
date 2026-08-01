import type { AuthUser } from "@/lib/auth/types"
import type { Technician } from "@/lib/catalogue/types"

/** Use the signed-in technician's account photo on their public tech profile. */
export function technicianWithAuthImage(
  tech: Technician,
  user?: AuthUser | null
): Technician {
  if (!user?.image || user.role !== "TECHNICIAN") return tech

  const owns =
    Boolean(user.technicianProfile?.id && user.technicianProfile.id === tech.id) ||
    Boolean(user.id && tech.userId && user.id === tech.userId)

  if (!owns) return tech
  return { ...tech, image: user.image }
}

export function techniciansWithAuthImage(
  list: Technician[],
  user?: AuthUser | null
): Technician[] {
  if (!user?.image || user.role !== "TECHNICIAN") return list
  return list.map((tech) => technicianWithAuthImage(tech, user))
}
