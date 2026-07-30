import type {
  Area,
  Category,
  Service,
  Technician,
} from "@/lib/catalogue/types"

type Loose = Record<string, unknown>

function asRecord(value: unknown): Loose | null {
  return value && typeof value === "object" ? (value as Loose) : null
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
  return typeof value === "boolean" ? value : fallback
}

export function formatServiceTag(tag?: string | null) {
  if (!tag) return undefined
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
    tag: formatServiceTag(str(obj.tag) || null),
    isFeatured: bool(obj.isFeatured),
  }
}

function categoryIdsFromTechnician(obj: Loose): string[] {
  const cats = asArray(obj.categories)
  const ids: string[] = []
  for (const item of cats) {
    const row = asRecord(item)
    if (!row) continue
    const nested = asRecord(row.category)
    const id = str(nested?.id || row.id)
    if (id) ids.push(id)
  }
  return ids
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

export function normalizeTechnician(raw: unknown): Technician {
  const obj = asRecord(raw) ?? {}
  const user = asRecord(obj.user)
  const area = asRecord(obj.area)
  const offered = asArray(obj.offeredServices).map(normalizeService)

  return {
    id: str(obj.id),
    name: str(user?.name ?? obj.name, "Technician"),
    trade: str(obj.trade, "General"),
    cats: categoryIdsFromTechnician(obj),
    area: str(area?.name ?? obj.area, "Dhaka"),
    rating: num(obj.ratingAvg ?? obj.rating),
    reviews: num(obj.reviewCount ?? obj.reviews),
    jobs: num(obj.jobsCompleted ?? obj.jobs),
    exp: num(obj.experienceYrs ?? obj.exp),
    rate: num(obj.visitFee ?? obj.rate),
    online: bool(obj.online, true),
    skills: skillsFromTechnician(obj),
    initials: str(obj.initials) || str(user?.name, "FN").slice(0, 2).toUpperCase(),
    bio: str(obj.bio),
    verified: bool(obj.verified, true),
    offeredServices: offered.length ? offered : undefined,
  }
}
