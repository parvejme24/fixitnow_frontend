export type CategoryId =
  | "c1"
  | "c2"
  | "c3"
  | "c4"
  | "c5"
  | "c6"
  | "c7"
  | "c8"

export type Service = {
  id: string
  cat: CategoryId
  title: string
  desc: string
  price: number
  dur: string
  rating: number
  reviews: number
  tag?: string
}

export type Review = {
  author: string
  initials: string
  rating: number
  date: string
  body: string
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
}

export const CATEGORIES: { id: CategoryId; name: string }[] = [
  { id: "c1", name: "Plumbing" },
  { id: "c2", name: "Electrical" },
  { id: "c3", name: "AC & Cooling" },
  { id: "c4", name: "Appliance Repair" },
  { id: "c5", name: "Carpentry" },
  { id: "c6", name: "Painting" },
  { id: "c7", name: "Deep Cleaning" },
  { id: "c8", name: "Pest Control" },
]

export const AREAS = [
  "Dhanmondi",
  "Mohammadpur",
  "Gulshan",
  "Uttara",
  "Bashundhara",
  "Mirpur",
  "Banani",
  "Old Dhaka",
] as const

export const SERVICES: Service[] = [
  {
    id: "s1",
    cat: "c1",
    title: "Leaking Tap & Pipe Fix",
    desc: "Drips, joint leaks, washer swaps and minor pipe reseals.",
    price: 450,
    dur: "45 min",
    rating: 4.9,
    reviews: 312,
    tag: "Most booked",
  },
  {
    id: "s2",
    cat: "c1",
    title: "Bathroom Fitting Install",
    desc: "Basin, commode, mixer and accessory mounting done clean.",
    price: 1650,
    dur: "2 hrs",
    rating: 4.7,
    reviews: 148,
  },
  {
    id: "s3",
    cat: "c2",
    title: "Wiring Fault Diagnosis",
    desc: "Trace short circuits, burnt joints and overloaded lines.",
    price: 700,
    dur: "1 hr",
    rating: 4.8,
    reviews: 264,
    tag: "Emergency",
  },
  {
    id: "s4",
    cat: "c2",
    title: "Switchboard & Socket Setup",
    desc: "New points, MCB swaps and tidy board rearrangements.",
    price: 950,
    dur: "1.5 hrs",
    rating: 4.6,
    reviews: 121,
  },
  {
    id: "s5",
    cat: "c3",
    title: "AC Servicing & Gas Refill",
    desc: "Full coil wash, filter clean and measured gas top-up.",
    price: 1400,
    dur: "1.5 hrs",
    rating: 4.9,
    reviews: 428,
    tag: "Top rated",
  },
  {
    id: "s6",
    cat: "c3",
    title: "Split AC Installation",
    desc: "Mounting, copper piping, vacuum and first-run check.",
    price: 2800,
    dur: "3 hrs",
    rating: 4.7,
    reviews: 96,
  },
  {
    id: "s7",
    cat: "c4",
    title: "Fridge Not Cooling",
    desc: "Compressor checks, thermostat and gas leak diagnosis.",
    price: 1100,
    dur: "1 hr",
    rating: 4.5,
    reviews: 187,
  },
  {
    id: "s8",
    cat: "c4",
    title: "Washing Machine Repair",
    desc: "Drum, drain pump, belt and error-code fixes.",
    price: 1250,
    dur: "1.5 hrs",
    rating: 4.6,
    reviews: 143,
  },
  {
    id: "s9",
    cat: "c5",
    title: "Furniture Assembly",
    desc: "Flat-pack wardrobes, beds and desks built square.",
    price: 800,
    dur: "2 hrs",
    rating: 4.8,
    reviews: 209,
  },
  {
    id: "s10",
    cat: "c5",
    title: "Door & Lock Repair",
    desc: "Sagging doors, latch alignment and lock cylinder swaps.",
    price: 650,
    dur: "1 hr",
    rating: 4.7,
    reviews: 88,
  },
  {
    id: "s11",
    cat: "c6",
    title: "Single Room Repaint",
    desc: "Putty, primer and two coats with clean edges.",
    price: 4200,
    dur: "6 hrs",
    rating: 4.6,
    reviews: 74,
  },
  {
    id: "s12",
    cat: "c7",
    title: "Full Apartment Deep Clean",
    desc: "Kitchen degrease, baths, floors and dust-heavy corners.",
    price: 3600,
    dur: "5 hrs",
    rating: 4.9,
    reviews: 356,
    tag: "Most booked",
  },
  {
    id: "s13",
    cat: "c7",
    title: "Sofa & Mattress Shampoo",
    desc: "Hot-water extraction for sofas, cushions and mattresses.",
    price: 1900,
    dur: "2 hrs",
    rating: 4.8,
    reviews: 132,
  },
  {
    id: "s14",
    cat: "c8",
    title: "Cockroach & Ant Treatment",
    desc: "Odourless gel and spray treatment for kitchens and drains.",
    price: 1500,
    dur: "1 hr",
    rating: 4.4,
    reviews: 61,
  },
  {
    id: "s15",
    cat: "c2",
    title: "Ceiling Fan Install",
    desc: "Bracket mounting, wiring and balance check.",
    price: 550,
    dur: "45 min",
    rating: 4.7,
    reviews: 176,
  },
  {
    id: "s16",
    cat: "c1",
    title: "Blocked Drain Clearing",
    desc: "Machine rodding for sinks, floors and bathroom lines.",
    price: 900,
    dur: "1 hr",
    rating: 4.5,
    reviews: 118,
    tag: "Emergency",
  },
]

export const TECHNICIANS: Technician[] = [
  {
    id: "t1",
    name: "Rakib Hasan",
    trade: "Plumbing",
    cats: ["c1"],
    area: "Dhanmondi",
    rating: 4.9,
    reviews: 210,
    jobs: 482,
    exp: 7,
    rate: 500,
    online: true,
    skills: ["Leak fix", "Drain", "Fitting", "Mixer install", "Pipe reseal"],
    initials: "RH",
    verified: true,
    bio: "Dhanmondi flats are my weekday circuit. I carry compression fittings, a hand snake, and the patience to find a drip before it soaks the ceiling below.",
  },
  {
    id: "t2",
    name: "Shamim Ahmed",
    trade: "Electrical",
    cats: ["c2"],
    area: "Mohammadpur",
    rating: 4.8,
    reviews: 188,
    jobs: 391,
    exp: 9,
    rate: 650,
    online: true,
    skills: ["Wiring", "MCB", "Fault find", "Board tidy", "Earthing check"],
    initials: "SA",
    verified: true,
    bio: "Nine years tracing shorts and overloaded boards across Mohammadpur. I won't energise a panel until the earthing reads safe — and I leave the labels readable for the next tech.",
  },
  {
    id: "t3",
    name: "Nasima Akter",
    trade: "AC & Cooling",
    cats: ["c3"],
    area: "Gulshan",
    rating: 4.9,
    reviews: 256,
    jobs: 510,
    exp: 6,
    rate: 900,
    online: false,
    skills: ["Gas refill", "Install", "Service", "Coil wash", "Vacuum"],
    initials: "NA",
    verified: true,
    bio: "Split units in Gulshan high-rises are my specialty. Measured gas, clean coils, and a first-run checklist before I pack up the gauges.",
  },
  {
    id: "t4",
    name: "Jubayer Rahman",
    trade: "Appliance Repair",
    cats: ["c4"],
    area: "Uttara",
    rating: 4.6,
    reviews: 142,
    jobs: 278,
    exp: 5,
    rate: 750,
    online: true,
    skills: ["Fridge", "Washer", "Diagnostics", "Thermostat", "Pump"],
    initials: "JR",
    verified: true,
    bio: "Fridges that won't cool and washers that throw error codes — I diagnose first, quote second, and only replace parts that actually failed.",
  },
  {
    id: "t5",
    name: "Milon Sarker",
    trade: "Carpentry",
    cats: ["c5"],
    area: "Mirpur",
    rating: 4.7,
    reviews: 119,
    jobs: 245,
    exp: 8,
    rate: 700,
    online: false,
    skills: ["Assembly", "Doors", "Shelves", "Locks", "Hinges"],
    initials: "MS",
    verified: false,
    bio: "Flat-pack chaos to square furniture, sagging doors to smooth latches. Mirpur sites, hand tools, and cuts measured twice.",
  },
  {
    id: "t6",
    name: "Farhana Islam",
    trade: "Deep Cleaning",
    cats: ["c7"],
    area: "Bashundhara",
    rating: 4.9,
    reviews: 301,
    jobs: 620,
    exp: 4,
    rate: 850,
    online: true,
    skills: ["Deep clean", "Sofa", "Kitchen", "Bathrooms", "Mattress"],
    initials: "FI",
    verified: true,
    bio: "Kitchen grease, dusty corners, and fabric shampoo — I work room by room with a checklist so nothing gets a half pass.",
  },
  {
    id: "t7",
    name: "Tanvir Hossain",
    trade: "Painting",
    cats: ["c6"],
    area: "Banani",
    rating: 4.5,
    reviews: 97,
    jobs: 168,
    exp: 6,
    rate: 1200,
    online: false,
    skills: ["Interior", "Putty", "Touch-up", "Primer", "Edges"],
    initials: "TH",
    verified: true,
    bio: "Putty, primer, two coats, clean edges. Banani apartments where the tape lines matter as much as the colour.",
  },
  {
    id: "t8",
    name: "Imran Chowdhury",
    trade: "Pest Control",
    cats: ["c8"],
    area: "Old Dhaka",
    rating: 4.4,
    reviews: 73,
    jobs: 154,
    exp: 5,
    rate: 900,
    online: true,
    skills: ["Cockroach", "Ant", "Gel bait", "Drain spray", "Follow-up"],
    initials: "IC",
    verified: false,
    bio: "Odourless gel and targeted spray for kitchens and drains in Old Dhaka. I mark the follow-up window before I leave.",
  },
  {
    id: "t9",
    name: "Sohel Rana",
    trade: "Electrical",
    cats: ["c2", "c3"],
    area: "Mohammadpur",
    rating: 4.7,
    reviews: 165,
    jobs: 333,
    exp: 10,
    rate: 800,
    online: false,
    skills: ["Fans", "Sockets", "AC power", "MCB", "Balancing"],
    initials: "SR",
    verified: true,
    bio: "Ten years bridging electrical and AC power work — fans, sockets, and outdoor unit feeds done to code, not guesswork.",
  },
]

/** Shared review set used when a technician has no tagged reviews. */
export const SHARED_REVIEWS: Review[] = [
  {
    author: "Mahmudul Hasan",
    initials: "MH",
    rating: 5,
    date: "24 Jul 2026",
    body: "Found the fault in twenty minutes and explained every step before touching the board. Clean finish.",
  },
  {
    author: "Shirin Akter",
    initials: "SA",
    rating: 5,
    date: "20 Jul 2026",
    body: "Arrived on the exact slot, worked quietly, and left the workspace cleaner than he found it.",
  },
  {
    author: "Kamrul Hasan",
    initials: "KH",
    rating: 4,
    date: "11 Jul 2026",
    body: "Good work overall. Took a little longer on the rearrange, but the result feels solid.",
  },
  {
    author: "Tasnim Jahan",
    initials: "TJ",
    rating: 5,
    date: "02 Jul 2026",
    body: "He refused to install the board until the earthing was fixed. That honesty is why I booked again.",
  },
]

const TECH_REVIEWS: Partial<Record<string, Review[]>> = {
  t2: SHARED_REVIEWS,
}

export function categoryName(id: CategoryId) {
  return CATEGORIES.find((c) => c.id === id)?.name ?? id
}

export function formatTaka(n: number) {
  return `৳${n.toLocaleString("en-IN")}`
}

export function categoryCounts() {
  const counts = Object.fromEntries(
    CATEGORIES.map((c) => [c.id, 0])
  ) as Record<CategoryId, number>
  for (const s of SERVICES) counts[s.cat] += 1
  return counts
}

export function technicianCategoryCounts() {
  const counts = Object.fromEntries(
    CATEGORIES.map((c) => [c.id, 0])
  ) as Record<CategoryId, number>
  for (const t of TECHNICIANS) {
    for (const c of t.cats) counts[c] += 1
  }
  return counts
}

export function getTechnicianById(id: string) {
  return TECHNICIANS.find((t) => t.id === id)
}

export function getServiceById(id: string) {
  return SERVICES.find((s) => s.id === id)
}

/** Resolve technician for /technician?id= & ?service= (default t2). */
export function resolveTechnician(
  id?: string | null,
  serviceId?: string | null
): Technician {
  if (id) {
    const byId = getTechnicianById(id)
    if (byId) return byId
  }
  if (serviceId) {
    const service = getServiceById(serviceId)
    if (service) {
      const match = TECHNICIANS.find((t) => t.cats.includes(service.cat))
      if (match) return match
    }
    return TECHNICIANS[0]
  }
  return getTechnicianById("t2") ?? TECHNICIANS[0]
}

export function servicesForTechnician(tech: Technician) {
  return SERVICES.filter((s) => tech.cats.includes(s.cat))
}

export function techniciansForService(service: Service) {
  const list = TECHNICIANS.filter((t) => t.cats.includes(service.cat))
  return list.length ? list : TECHNICIANS.slice(0, 3)
}

export function reviewsForTechnician(tech: Technician) {
  return TECH_REVIEWS[tech.id] ?? SHARED_REVIEWS
}

export function reviewsForService(_service: Service) {
  return SHARED_REVIEWS
}

export function firstName(full: string) {
  return full.split(" ")[0] ?? full
}

export function formatReviewDate(d = new Date()) {
  const day = String(d.getDate()).padStart(2, "0")
  const mon = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][
    d.getMonth()
  ]
  return `${day} ${mon} ${d.getFullYear()}`
}

export function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return "YN"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}
