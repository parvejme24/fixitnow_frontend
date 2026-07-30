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
  tag?: string
  isFeatured?: boolean
}

export type Technician = {
  id: string
  name: string
  trade: string
  cats: CategoryId[]
  area: string
  rating: number
  reviews: number
  jobs: number
  exp: number
  rate: number
  online: boolean
  skills: string[]
  initials: string
  bio: string
  verified: boolean
  offeredServices?: Service[]
}

export type Review = {
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
