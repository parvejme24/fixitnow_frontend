export type BookingStatus =
  | "REQUESTED"
  | "ACCEPTED"
  | "DECLINED"
  | "PAID"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"

export type PaymentStatus = "Paid" | "Refunded"

export type AccountStatus = "Active" | "Suspended" | "Banned"

export type DashBooking = {
  id: string
  reference: string
  service: string
  area: string
  technician: { name: string; initials: string }
  customer: { name: string; initials: string }
  date: string
  time: string
  amount: number
  status: BookingStatus
  reviewed?: boolean
  trade?: string
}

export type DashPayment = {
  id: string
  method: string
  bookingRef: string
  amount: number
  date: string
  status: PaymentStatus
}

export type DashReview = {
  id: string
  technician: string
  initials: string
  rating: number
  body: string
  date: string
  bookingRef: string
  bookingId?: string
  service?: string
  technicianId?: string
}

export type DashUser = {
  id: string
  name: string
  email: string
  initials: string
  role: "Customer" | "Technician" | "Admin"
  joined: string
  bookings: number
  status: AccountStatus
}

export const CUSTOMER_BOOKINGS: DashBooking[] = [
  {
    id: "b1",
    reference: "FIX-4821",
    service: "AC Deep Clean & Servicing",
    area: "Dhanmondi",
    technician: { name: "Jubayer Uddin", initials: "JU" },
    customer: { name: "Ayesha Siddika", initials: "AS" },
    date: "30 Jul 2026",
    time: "10:00 AM",
    amount: 2200,
    status: "IN_PROGRESS",
    trade: "AC & Cooling",
  },
  {
    id: "b2",
    reference: "FIX-4814",
    service: "Kitchen Sink & Tap Fix",
    area: "Mohammadpur",
    technician: { name: "Rakib Hossain", initials: "RH" },
    customer: { name: "Ayesha Siddika", initials: "AS" },
    date: "31 Jul 2026",
    time: "02:00 PM",
    amount: 900,
    status: "ACCEPTED",
    trade: "Plumbing",
  },
  {
    id: "b3",
    reference: "FIX-4802",
    service: "Fan & Light Installation",
    area: "Dhanmondi",
    technician: { name: "Farhana Islam", initials: "FI" },
    customer: { name: "Ayesha Siddika", initials: "AS" },
    date: "28 Jul 2026",
    time: "11:00 AM",
    amount: 800,
    status: "PAID",
    trade: "Electrical",
  },
  {
    id: "b4",
    reference: "FIX-4788",
    service: "2BHK Deep Home Cleaning",
    area: "Gulshan",
    technician: { name: "Nasima Akter", initials: "NA" },
    customer: { name: "Ayesha Siddika", initials: "AS" },
    date: "22 Jul 2026",
    time: "09:00 AM",
    amount: 2800,
    status: "COMPLETED",
    reviewed: false,
    trade: "Cleaning",
  },
  {
    id: "b5",
    reference: "FIX-4771",
    service: "Bathroom Leak & Pipe Repair",
    area: "Dhanmondi",
    technician: { name: "Sohel Omar", initials: "SO" },
    customer: { name: "Ayesha Siddika", initials: "AS" },
    date: "18 Jul 2026",
    time: "03:00 PM",
    amount: 1500,
    status: "COMPLETED",
    reviewed: true,
    trade: "Plumbing",
  },
  {
    id: "b6",
    reference: "FIX-4740",
    service: "MCB & Wiring Fault Diagnosis",
    area: "Banani",
    technician: { name: "Tanvir Ahmed", initials: "TA" },
    customer: { name: "Ayesha Siddika", initials: "AS" },
    date: "12 Jul 2026",
    time: "01:00 PM",
    amount: 1800,
    status: "CANCELLED",
    trade: "Electrical",
  },
  {
    id: "b7",
    reference: "FIX-4705",
    service: "AC Gas Refill & Cooling Fix",
    area: "Dhanmondi",
    technician: { name: "Jubayer Uddin", initials: "JU" },
    customer: { name: "Ayesha Siddika", initials: "AS" },
    date: "05 Jul 2026",
    time: "04:00 PM",
    amount: 3500,
    status: "REQUESTED",
    trade: "AC & Cooling",
  },
  {
    id: "b8",
    reference: "FIX-4660",
    service: "Door & Lock Carpentry",
    area: "Mirpur",
    technician: { name: "Milon Das", initials: "MD" },
    customer: { name: "Ayesha Siddika", initials: "AS" },
    date: "28 Jun 2026",
    time: "12:00 PM",
    amount: 1200,
    status: "DECLINED",
    trade: "Carpentry",
  },
]

export const CUSTOMER_PAYMENTS: DashPayment[] = [
  {
    id: "p1",
    method: "bKash",
    bookingRef: "FIX-4802",
    amount: 800,
    date: "27 Jul 2026",
    status: "Paid",
  },
  {
    id: "p2",
    method: "Card",
    bookingRef: "FIX-4788",
    amount: 2800,
    date: "21 Jul 2026",
    status: "Paid",
  },
  {
    id: "p3",
    method: "Nagad",
    bookingRef: "FIX-4771",
    amount: 1500,
    date: "17 Jul 2026",
    status: "Paid",
  },
  {
    id: "p4",
    method: "bKash",
    bookingRef: "FIX-4740",
    amount: 1800,
    date: "12 Jul 2026",
    status: "Refunded",
  },
]

export const CUSTOMER_REVIEWS: DashReview[] = [
  {
    id: "r1",
    technician: "Sohel Omar",
    initials: "SO",
    rating: 5,
    body: "Found the leak fast and sealed it clean. Explained every step.",
    date: "19 Jul 2026",
    bookingRef: "FIX-4771",
  },
]

export const TECH_BOOKINGS: DashBooking[] = [
  {
    id: "tb1",
    reference: "FIX-4833",
    service: "Kitchen Sink & Tap Fix",
    area: "Dhanmondi",
    technician: { name: "Shamim Ahmed", initials: "SA" },
    customer: { name: "Mahmudul Hasan", initials: "MH" },
    date: "30 Jul 2026",
    time: "08:00 AM",
    amount: 900,
    status: "PAID",
  },
  {
    id: "tb2",
    reference: "FIX-4830",
    service: "Bathroom Leak & Pipe Repair",
    area: "Mohammadpur",
    technician: { name: "Shamim Ahmed", initials: "SA" },
    customer: { name: "Shirin Akter", initials: "SK" },
    date: "30 Jul 2026",
    time: "11:00 AM",
    amount: 1500,
    status: "REQUESTED",
  },
  {
    id: "tb3",
    reference: "FIX-4826",
    service: "Kitchen Sink & Tap Fix",
    area: "Gulshan",
    technician: { name: "Shamim Ahmed", initials: "SA" },
    customer: { name: "Kamrul Hasan", initials: "KH" },
    date: "31 Jul 2026",
    time: "02:00 PM",
    amount: 900,
    status: "REQUESTED",
  },
  {
    id: "tb4",
    reference: "FIX-4818",
    service: "Bathroom Leak & Pipe Repair",
    area: "Banani",
    technician: { name: "Shamim Ahmed", initials: "SA" },
    customer: { name: "Tasnim Jahan", initials: "TJ" },
    date: "01 Aug 2026",
    time: "10:00 AM",
    amount: 1500,
    status: "ACCEPTED",
  },
  {
    id: "tb5",
    reference: "FIX-4790",
    service: "Kitchen Sink & Tap Fix",
    area: "Uttara",
    technician: { name: "Shamim Ahmed", initials: "SA" },
    customer: { name: "Rafiq Islam", initials: "RI" },
    date: "24 Jul 2026",
    time: "03:00 PM",
    amount: 900,
    status: "COMPLETED",
    reviewed: true,
  },
  {
    id: "tb6",
    reference: "FIX-4744",
    service: "Bathroom Leak & Pipe Repair",
    area: "Mirpur",
    technician: { name: "Shamim Ahmed", initials: "SA" },
    customer: { name: "Nusrat Jahan", initials: "NJ" },
    date: "15 Jul 2026",
    time: "01:00 PM",
    amount: 1500,
    status: "COMPLETED",
    reviewed: true,
  },
]

export const ADMIN_USERS: DashUser[] = [
  { id: "u1", name: "Ayesha Siddika", email: "ayesha@mail.com", initials: "AS", role: "Customer", joined: "12 Jan 2026", bookings: 8, status: "Active" },
  { id: "u2", name: "Shamim Ahmed", email: "shamim@mail.com", initials: "SA", role: "Technician", joined: "08 Jan 2026", bookings: 64, status: "Active" },
  { id: "u3", name: "Nasima Akter", email: "nasima@mail.com", initials: "NA", role: "Technician", joined: "14 Jan 2026", bookings: 48, status: "Active" },
  { id: "u4", name: "Rakib Hossain", email: "rakib@mail.com", initials: "RH", role: "Technician", joined: "03 Feb 2026", bookings: 72, status: "Active" },
  { id: "u5", name: "Jubayer Uddin", email: "jubayer@mail.com", initials: "JU", role: "Technician", joined: "11 Feb 2026", bookings: 55, status: "Active" },
  { id: "u6", name: "Farhana Islam", email: "farhana@mail.com", initials: "FI", role: "Technician", joined: "19 Feb 2026", bookings: 41, status: "Active" },
  { id: "u7", name: "Tanvir Ahmed", email: "tanvir@mail.com", initials: "TA", role: "Technician", joined: "02 Mar 2026", bookings: 33, status: "Suspended" },
  { id: "u8", name: "Sohel Omar", email: "sohel@mail.com", initials: "SO", role: "Technician", joined: "09 Mar 2026", bookings: 61, status: "Active" },
  { id: "u9", name: "Milon Das", email: "milon@mail.com", initials: "MD", role: "Technician", joined: "18 Mar 2026", bookings: 22, status: "Active" },
  { id: "u10", name: "Mahmudul Hasan", email: "mahmud@mail.com", initials: "MH", role: "Customer", joined: "21 Mar 2026", bookings: 5, status: "Active" },
  { id: "u11", name: "Shirin Akter", email: "shirin@mail.com", initials: "SK", role: "Customer", joined: "28 Mar 2026", bookings: 3, status: "Active" },
  { id: "u12", name: "Kamrul Hasan", email: "kamrul@mail.com", initials: "KH", role: "Customer", joined: "04 Apr 2026", bookings: 7, status: "Active" },
  { id: "u13", name: "Tasnim Jahan", email: "tasnim@mail.com", initials: "TJ", role: "Customer", joined: "12 Apr 2026", bookings: 2, status: "Active" },
  { id: "u14", name: "Nusrat Jahan", email: "nusrat@mail.com", initials: "NJ", role: "Customer", joined: "20 Apr 2026", bookings: 4, status: "Banned" },
  { id: "u15", name: "Rafiq Islam", email: "rafiq@mail.com", initials: "RI", role: "Customer", joined: "01 May 2026", bookings: 6, status: "Active" },
  { id: "u16", name: "Lamia Chowdhury", email: "lamia@mail.com", initials: "LC", role: "Customer", joined: "10 May 2026", bookings: 1, status: "Suspended" },
  { id: "u17", name: "Imran Kabir", email: "imran@mail.com", initials: "IK", role: "Customer", joined: "18 May 2026", bookings: 9, status: "Active" },
  { id: "u18", name: "Platform admin", email: "admin@fixitnow.bd", initials: "PA", role: "Admin", joined: "01 Jan 2026", bookings: 0, status: "Active" },
]

export const ADMIN_CATEGORIES = [
  { name: "Plumbing", jobs: 4120 },
  { name: "Electrical", jobs: 3860 },
  { name: "AC & Cooling", jobs: 3510 },
  { name: "Cleaning", jobs: 2980 },
  { name: "Appliance Repair", jobs: 2410 },
  { name: "Carpentry", jobs: 1890 },
]

export const ADMIN_STATUS_COUNTS: { status: BookingStatus; count: number }[] = [
  { status: "REQUESTED", count: 92 },
  { status: "ACCEPTED", count: 148 },
  { status: "PAID", count: 310 },
  { status: "IN_PROGRESS", count: 84 },
  { status: "COMPLETED", count: 540 },
  { status: "CANCELLED", count: 21 },
  { status: "DECLINED", count: 9 },
]

export const GROSS_MONTHS = [
  { label: "Feb", value: 182 },
  { label: "Mar", value: 246 },
  { label: "Apr", value: 214 },
  { label: "May", value: 308 },
  { label: "Jun", value: 372 },
  { label: "Jul", value: 441 },
]

export const TECH_EARNINGS_MONTHS = [
  { label: "Feb", value: 18 },
  { label: "Mar", value: 24 },
  { label: "Apr", value: 22 },
  { label: "May", value: 31 },
  { label: "Jun", value: 36 },
  { label: "Jul", value: 44 },
]

export const SLOT_TIMES = [
  "08:00 AM",
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "01:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
  "05:00 PM",
  "06:00 PM",
  "07:00 PM",
] as const

export const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const

export function formatTaka(n: number) {
  return `৳${n.toLocaleString("en-IN")}`
}

export function formatTakaK(n: number) {
  return `৳${(n * 1000).toLocaleString("en-IN")}`
}

export function isActiveStatus(status: BookingStatus) {
  return (
    status === "REQUESTED" ||
    status === "ACCEPTED" ||
    status === "PAID" ||
    status === "IN_PROGRESS"
  )
}
