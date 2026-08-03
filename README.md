# FixItNow — Home Services Booking Platform (Frontend)

**Live Demo:** [https://fixitnow-frontend-weld.vercel.app/](https://fixitnow-frontend-weld.vercel.app/)  
**Repository:** [https://github.com/parvejme24/fixitnow_frontend](https://github.com/parvejme24/fixitnow_frontend)

[![Live Demo](https://img.shields.io/badge/Live-Demo-0d9b70?style=for-the-badge)](https://fixitnow-frontend-weld.vercel.app/)
[![GitHub](https://img.shields.io/badge/GitHub-Repo-181717?style=for-the-badge&logo=github)](https://github.com/parvejme24/fixitnow_frontend)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

---

## Overview

**FixItNow** is a full-featured frontend for an on-demand home services marketplace focused on Dhaka. Customers browse services and technicians, book fixed time slots, pay after acceptance, and track job progress. Technicians manage availability, bookings, and earnings. Admins oversee users, catalogue, bookings, and platform health.

The app connects to a live REST backend and is built as a production-style portfolio project demonstrating multi-role UX, API integration, and polished dashboard UI.

**Product flow**

```text
Browse → Request slot → Technician accepts → Pay → Track job → Complete
```

---

## Key Features

### Public
- Marketing home page (hero, categories, featured services, how it works, top technicians)
- Browse services with filters, sort, and grid/list layout
- Browse technicians with fee, rating, area, and availability filters
- Service and technician detail pages
- Terms, Privacy (accordion), FAQ (accordion)
- Branded 404 page and contact footer with Google Map

### Authentication
- Login / register (customer & technician)
- Forgot, reset, and change password flows
- Token-based session persistence
- Guest guards on auth pages; protected dashboard routes

### Customer
- Bookings management and status tracking
- Payments history with summary stats and receipt/PDF support
- Profile update with avatar upload

### Technician
- Dashboard for bookings, availability slots, and earnings charts
- Public profile, skills, and category management
- Job status flow (en route → on site → in progress → completed)

### Admin
- Platform overview with live stats and filterable revenue chart
- Manage users, services, categories, and areas
- View-only bookings oversight and action/disputes queue

---

## Tech Stack

| Area | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| UI Library | React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS 4, shadcn/ui (Base UI), Lucide icons |
| Motion | Framer Motion |
| Server state | TanStack Query (caching, polling, live refresh) |
| Payments UX | Gateway checkout redirect + jsPDF receipts |
| Charts | Custom revenue / earnings chart components |
| Hosting | Vercel |
| Backend API | `https://fixitnow-backend-weld.vercel.app/api/v1` |

---

## Architecture Overview

```text
app/
├── (public)/          # Home, browse, legal pages
├── (dashboard)/       # Role dashboards, bookings, payments, profile
├── (payment)/         # Checkout / success / cancel
├── auth/              # Login, register, password flows
├── components/        # Feature UI (Home, Dashboard, Auth, Shared)
└── providers/         # Auth provider + route guards

lib/
├── api.ts             # Shared HTTP client
├── auth/              # Auth API, types, token storage
├── catalogue/         # Categories, services, areas, technicians
├── bookings/          # Bookings + earn-series helpers
├── payments/          # Payments API, hooks, export
├── admin/             # Admin stats, users, services, areas
└── technicians/       # Technician profile, slots, reviews
```

**Design choices**
- **App Router route groups** separate public, dashboard, and payment surfaces
- **Role-based navigation** and dashboard shells for Customer / Technician / Admin
- **API modules + React Query hooks** keep fetching, caching, and mutations consistent
- **Client guards** (`AuthGuard`, `GuestGuard`) control access without hard-coding redirects in every page
- **Shared UI primitives** (selects, charts, legal layout) reduce duplication across browse and admin screens

---

## Deployment

The frontend is deployed on **Vercel**.

| Resource | URL |
| --- | --- |
| Live app | [https://fixitnow-frontend-weld.vercel.app/](https://fixitnow-frontend-weld.vercel.app/) |
| GitHub | [https://github.com/parvejme24/fixitnow_frontend](https://github.com/parvejme24/fixitnow_frontend) |
| API base | `https://fixitnow-backend-weld.vercel.app/api/v1` |

**Deploy steps (Vercel)**
1. Import the GitHub repository
2. Set `NEXT_PUBLIC_API_BASE_URL`
3. Build command: `npm run build`
4. Output: Next.js default (Vercel detects automatically)

---

## Getting Started

### Prerequisites
- Node.js **20+**
- npm (or pnpm / yarn / bun)

### Install & run

```bash
git clone https://github.com/parvejme24/fixitnow_frontend.git
cd fixitnow_frontend
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm start` | Serve production build |
| `npm run lint` | Run ESLint |

### Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Admin | `mdparvej@gmail.com` | `password123@#` |
| Technician | `rakib@fixitnow.test` | `password123@#` |
| Customer | `ayesha.customer@fixitnow.test` | `password123@#` |

---

## Environment Variables

Create `.env.local` from `.env.example`:

```env
NEXT_PUBLIC_API_BASE_URL=https://fixitnow-backend-weld.vercel.app/api/v1
```

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | Yes | Backend API base URL (includes `/api/v1`) |

---

## Testing

Automated end-to-end or unit test suites are **not included yet**.

Current quality checks:
- TypeScript type-checking during development / build
- ESLint via `npm run lint`
- Manual QA across customer, technician, and admin flows against the live API

Planned: Playwright coverage for browse → book → pay happy path.

---

## Challenges and Learning

**Challenges**
- Designing **three distinct role experiences** without fragmenting the codebase
- Keeping **browse and admin lists** consistent with API shapes (including inactive services, filters, and live refresh)
- Handling **payment redirect UX** and post-payment history/receipt flows
- Avoiding CSS/style breakage on public pages when shared components lived only in dashboard stylesheets
- Building **guest/auth route guards** that feel instant and avoid flash of wrong screens

**Learning**
- Structuring a scalable Next.js App Router project with clear domain modules (`lib/*`)
- Using TanStack Query for caching, invalidation, and lightweight polling
- Building reusable dashboard patterns (stat cards, charts, filters, modals)
- Shipping resume-ready polish: 404, legal pages, footer map, responsive layouts

---

## Roadmap and Future Improvement

- [ ] Playwright E2E tests for auth, booking, and payment flows
- [ ] Stronger empty/error/skeleton states across all data screens
- [ ] Dark / light theme toggle
- [ ] i18n (English + Bangla)
- [ ] Performance audits (image optimization, route-level code splitting)
- [ ] Accessibility pass (keyboard, focus, screen reader labels)

---

## Author

**Md Parvej**  
Frontend developer · FixItNow portfolio / assignment project

- **Live Demo:** [fixitnow-frontend-weld.vercel.app](https://fixitnow-frontend-weld.vercel.app/)
- **GitHub:** [parvejme24/fixitnow_frontend](https://github.com/parvejme24/fixitnow_frontend)
