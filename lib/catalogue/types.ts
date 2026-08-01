export type CategoryId = string

export type Category = {
  id: CategoryId
  name: string
  slug: string
  icon: string
  isVisible: boolean
  sortOrder: number
  jobsDone: number
  serviceCount: number
  technicianCount: number
}

export type Area = {
  id: string
  name: string
  technicianCount: number
}

export type ServiceTag = "MOST_BOOKED" | "TOP_RATED" | "EMERGENCY"

export type Service = {
  id: string
  cat: CategoryId
  catName: string
  title: string
  desc: string
  price: number
  dur: string
  rating: number
  reviews: number
  /** Raw API enum — format with `formatServiceTag` for display */
  tag?: ServiceTag
  isFeatured?: boolean
  /** Cover image URL from API (`image`) */
  image?: string | null
  isActive?: boolean
  sortOrder?: number
}

export type Technician = {
  id: string
  /** Linked auth user id when API includes `user` */
  userId?: string | null
  name: string
  trade: string
  cats: CategoryId[]
  area: string
  areaId?: string | null
  rating: number
  reviews: number
  jobs: number
  exp: number
  rate: number
  online: boolean
  skills: string[]
  initials: string
  /** Profile photo URL when the linked user has one */
  image?: string | null
  bio: string
  verified: boolean
  coverKm: number
  replyMins: number
  phone?: string | null
  offeredServices?: Service[]
}

export type Review = {
  id?: string
  author: string
  initials: string
  rating: number
  date: string
  body: string
}

export type ListMeta = {
  page: number
  limit: number
  total: number
  totalPages: number
}

export type ServicesQuery = {
  page?: number
  limit?: number
  categoryId?: string
  q?: string
  featured?: boolean
}

export type TechniciansQuery = {
  page?: number
  limit?: number
  categoryId?: string
  areaId?: string
  q?: string
  online?: boolean
}

export type TechnicianSlot = {
  id: string
  date: string
  startTime: string
  endTime: string
  isBooked: boolean
}
