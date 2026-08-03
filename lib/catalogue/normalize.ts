import type {
  Area,
  Category,
  Service,
  ServiceTag,
  Technician,
} from "@/lib/catalogue/types"
import { absoluteMediaUrl } from "@/lib/auth/types"

type Loose = Record<string, unknown>

function asRecord(value: unknown): Loose | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Loose)
    : null
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function str(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback
}

function num(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

function bool(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value
  if (typeof value === "number" && Number.isFinite(value)) return value !== 0
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase()
    if (["true", "1", "yes", "on"].includes(normalized)) return true
    if (["false", "0", "no", "off"].includes(normalized)) return false
  }
  return fallback
}

function pickString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value
  }
  return null
}

export const SERVICE_TAG_OPTIONS: { value: ServiceTag; label: string }[] = [
  { value: "MOST_BOOKED", label: "Most booked" },
  { value: "TOP_RATED", label: "Top rated" },
  { value: "EMERGENCY", label: "Emergency" },
]

const SERVICE_TAGS = new Set<string>(
  SERVICE_TAG_OPTIONS.map((o) => o.value)
)

export function parseServiceTag(raw?: string | null): ServiceTag | undefined {
  if (!raw) return undefined
  const normalized = raw.trim().toUpperCase().replace(/[\s-]+/g, "_")
  if (SERVICE_TAGS.has(normalized)) return normalized as ServiceTag
  // Accept already-formatted labels like "Most Booked"
  const fromLabel = SERVICE_TAG_OPTIONS.find(
    (o) => o.label.toLowerCase() === raw.trim().toLowerCase()
  )
  return fromLabel?.value
}

export function formatServiceTag(tag?: string | null) {
  if (!tag) return undefined
  const parsed = parseServiceTag(tag)
  if (parsed) {
    return SERVICE_TAG_OPTIONS.find((o) => o.value === parsed)?.label ?? parsed
  }
  return tag
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

export function normalizeCategory(raw: unknown): Category {
  const obj = asRecord(raw) ?? {}
  return {
    id: str(obj.id),
    name: str(obj.name, "Category"),
    slug: str(obj.slug),
    icon: str(obj.icon, "🔧"),
    isVisible: bool(obj.isVisible ?? obj.active ?? obj.isActive, true),
    sortOrder: num(obj.sortOrder),
    jobsDone: num(obj.jobsDone),
    serviceCount: num(obj.serviceCount),
    technicianCount: num(obj.technicianCount),
  }
}

export function normalizeArea(raw: unknown): Area {
  const obj = asRecord(raw) ?? {}
  const countObj = asRecord(obj._count)
  return {
    id: str(obj.id),
    name: str(obj.name),
    technicianCount: num(countObj?.technicians ?? obj.technicianCount),
  }
}

export function normalizeService(raw: unknown): Service {
  const obj = asRecord(raw) ?? {}
  const category = asRecord(obj.category)
  const catId = str(obj.categoryId || category?.id)
  return {
    id: str(obj.id),
    cat: catId,
    catName: str(category?.name, catId),
    title: str(obj.title, "Service"),
    desc: str(obj.description ?? obj.desc),
    price: num(obj.price),
    dur: str(obj.duration ?? obj.dur, "1 hr"),
    rating: num(obj.ratingAvg ?? obj.rating),
    reviews: num(obj.reviewCount ?? obj.reviews),
    tag: parseServiceTag(str(obj.tag) || null),
    isFeatured: bool(obj.isFeatured),
    image: absoluteMediaUrl(
      pickString(obj.image, obj.coverImage, obj.photo, obj.thumbnail)
    ),
    isActive: bool(obj.isActive, true),
    sortOrder: num(obj.sortOrder),
  }
}

function categoryIdsFromTechnician(obj: Loose): string[] {
  const cats = asArray(obj.categories)
  const ids: string[] = []
  for (const item of cats) {
    if (typeof item === "string") {
      if (item) ids.push(item)
      continue
    }
    const row = asRecord(item)
    if (!row) continue
    const nested = asRecord(row.category)
    const id = str(nested?.id || row.categoryId || row.id)
    if (id) ids.push(id)
  }
  return ids
}

function categoryNamesFromTechnician(obj: Loose): string[] {
  const cats = asArray(obj.categories)
  const names: string[] = []
  for (const item of cats) {
    if (typeof item === "string") continue
    const row = asRecord(item)
    if (!row) continue
    const nested = asRecord(row.category)
    const name = str(nested?.name || row.name)
    if (name) names.push(name)
  }
  return names
}

function skillsFromTechnician(obj: Loose): string[] {
  return asArray(obj.skills)
    .map((item) => {
      if (typeof item === "string") return item
      const row = asRecord(item)
      return str(row?.name)
    })
    .filter(Boolean)
}

function areaFromTechnician(obj: Loose): {
  name: string
  id: string | null
  names: string[]
} {
  const names: string[] = []
  const single = asRecord(obj.area)
  if (single) {
    const n = str(single.name)
    if (n) names.push(n)
  }
  for (const item of asArray(obj.areas)) {
    const row = asRecord(item)
    const n = str(row?.name ?? (typeof item === "string" ? item : ""))
    if (n && !names.includes(n)) names.push(n)
  }
  const first = asRecord(asArray(obj.areas)[0]) ?? single
  return {
    name: names[0] ?? "",
    id: str(first?.id) || null,
    names,
  }
}

export function normalizeTechnician(raw: unknown): Technician {
  const obj = asRecord(raw) ?? {}
  const user = asRecord(obj.user)
  const areaInfo = areaFromTechnician(obj)
  const offered = asArray(obj.offeredServices).map(normalizeService)

  // Live API: area/areas can vary; bio can be null; skills are { id, name }[]
  const bioRaw = obj.bio
  const bio = bioRaw == null ? "" : str(bioRaw)

  return {
    id: str(obj.id),
    userId: str(user?.id) || null,
    name: str(user?.name ?? obj.name, "Technician"),
    trade: str(obj.trade, "General"),
    cats: categoryIdsFromTechnician(obj),
    catNames: categoryNamesFromTechnician(obj),
    area: areaInfo.name,
    areas: areaInfo.names,
    areaId: areaInfo.id,
    rating: num(obj.ratingAvg ?? obj.rating),
    reviews: num(obj.reviewCount ?? obj.reviews),
    jobs: num(obj.jobsCompleted ?? obj.jobs),
    exp: num(obj.experienceYrs ?? obj.exp),
    rate: num(obj.visitFee ?? obj.rate),
    online: bool(obj.online, false),
    skills: skillsFromTechnician(obj),
    initials:
      str(obj.initials) ||
      str(user?.name, "FN")
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0])
        .join("")
        .toUpperCase() || "FN",
    image: absoluteMediaUrl(
      pickString(
        user?.image,
        user?.avatar,
        user?.profileImage,
        user?.profilePic,
        user?.photo,
        obj.image,
        obj.avatar,
        obj.profileImage
      )
    ),
    bio,
    verified: bool(obj.verified, false),
    coverKm: num(obj.coverKm, 4),
    replyMins: num(obj.replyMins, 8),
    phone: pickPhone(user?.phone ?? obj.phone),
    offeredServices: offered.length ? offered : undefined,
  }
}

function pickPhone(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim()
  return null
}
