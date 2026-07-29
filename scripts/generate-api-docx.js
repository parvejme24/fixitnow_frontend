const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, BorderStyle, WidthType, AlignmentType, ShadingType } = require("docx")
const fs = require("fs")
const path = require("path")

const border = { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" }
const borders = { top: border, bottom: border, left: border, right: border }
const headerShade = { type: ShadingType.CLEAR, fill: "0E141B" }
const altShade = { type: ShadingType.CLEAR, fill: "F7F9FB" }

function cell(text, opts = {}) {
  const { bold = false, header = false, width = 1800, shade } = opts
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: header ? headerShade : shade,
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: String(text ?? ""),
            bold: bold || header,
            color: header ? "FFFFFF" : "0E141B",
            size: 18,
            font: "Calibri",
          }),
        ],
      }),
    ],
  })
}

function apiTable(rows) {
  const widths = [900, 3200, 1100, 3600]
  const header = new TableRow({
    children: ["Method", "Endpoint", "Auth", "Purpose"].map((h, i) =>
      cell(h, { header: true, width: widths[i] })
    ),
  })
  const body = rows.map((r, idx) =>
    new TableRow({
      children: [
        cell(r[0], { bold: true, width: widths[0], shade: idx % 2 ? altShade : undefined }),
        cell(r[1], { width: widths[1], shade: idx % 2 ? altShade : undefined }),
        cell(r[2], { width: widths[2], shade: idx % 2 ? altShade : undefined }),
        cell(r[3], { width: widths[3], shade: idx % 2 ? altShade : undefined }),
      ],
    })
  )
  return new Table({
    width: { size: 8800, type: WidthType.DXA },
    columnWidths: widths,
    rows: [header, ...body],
  })
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 160 },
    children: [new TextRun({ text, bold: true, color: "0E141B", font: "Calibri", size: 32 })],
  })
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 120 },
    children: [new TextRun({ text, bold: true, color: "131B24", font: "Calibri", size: 26 })],
  })
}
function p(text) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text, font: "Calibri", size: 20, color: "1B2631" })],
  })
}
function bullet(text) {
  return new Paragraph({
    spacing: { after: 60 },
    indent: { left: 360 },
    children: [new TextRun({ text: `• ${text}`, font: "Calibri", size: 20, color: "1B2631" })],
  })
}
function code(text) {
  return new Paragraph({
    spacing: { after: 80 },
    shading: { type: ShadingType.CLEAR, fill: "EDF1F4" },
    children: [new TextRun({ text, font: "Consolas", size: 17, color: "0E141B" })],
  })
}

const doc = new Document({
  styles: {
    default: {
      document: {
        styles: [{ id: "Normal", run: { font: "Calibri", size: 20 } }],
      },
    },
  },
  sections: [
    {
      properties: {
        page: {
          margin: { top: 720, bottom: 720, left: 720, right: 720 },
        },
      },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
          children: [
            new TextRun({ text: "FixItNow", bold: true, size: 48, color: "0E141B", font: "Calibri" }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: "API Reference · Data Models · Backend Build Guide",
              size: 22,
              color: "4A5C6B",
              font: "Calibri",
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
          children: [
            new TextRun({
              text: "Home services booking platform — Dhaka · Hi-Vis Workshop",
              size: 18,
              color: "6E8091",
              font: "Calibri",
            }),
          ],
        }),

        h1("1. Project Overview"),
        p("FixItNow is a home-services booking product for Dhaka. Customers browse services and technicians, request a fixed time slot, pay only after the technician accepts, then track the job to completion."),
        p("Base API URL: /api/v1"),
        p("Auth header: Authorization: Bearer <access_token>"),
        p("Currency: BDT (৳) stored as whole taka integers (e.g. 1400 = ৳1,400)."),

        h1("2. Roles"),
        bullet("CUSTOMER — book services, pay, leave reviews"),
        bullet("TECHNICIAN — manage profile, slots, accept/decline jobs, update job status"),
        bullet("ADMIN — manage users, categories, services, verify technicians, refunds"),

        h1("3. Prisma Data Models"),
        p("Schema lives in prisma/schema/ (multi-file)."),

        h2("3.1 Auth"),
        bullet("User — id, name, email, phone, passwordHash, role, initials, isActive"),
        bullet("PasswordResetToken — token, userId, expiresAt, usedAt"),

        h2("3.2 Catalogue"),
        bullet("Category — id (c1–c8), name, slug, sortOrder, jobsDone"),
        bullet("Area — Dhaka areas (Dhanmondi, Gulshan, …)"),
        bullet("Service — id (s1–s16), categoryId, title, description, price, duration, ratingAvg, reviewCount, tag, isFeatured"),

        h2("3.3 Technicians"),
        bullet("TechnicianProfile — trade, area, bio, initials, visitFee, experienceYrs, jobsCompleted, ratingAvg, online, verified"),
        bullet("TechnicianCategory — many-to-many with Category"),
        bullet("TechnicianSkill — skill name tags"),
        bullet("AvailabilitySlot — date, startTime, isBooked"),

        h2("3.4 Bookings & Payments"),
        bullet("Booking — refCode (FIX-xxxx), customer, technician, service, slot, price snapshot, status timeline"),
        bullet("Payment — amount, method (BKASH|NAGAD|CARD), status, providerTxnId"),

        h2("3.5 Reviews"),
        bullet("Review — author, rating 1–5, body, target SERVICE|TECHNICIAN, optional bookingId"),

        h2("3.6 Booking status flow"),
        code("REQUESTED → ACCEPTED → PAID → EN_ROUTE → ON_SITE → COMPLETED"),
        p("Also: DECLINED · CANCELLED"),

        h1("4. Standard Response Format"),
        h2("Success"),
        code('{ "success": true, "data": {}, "meta": { "page": 1, "limit": 20, "total": 100 } }'),
        h2("Error"),
        code('{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "…" } }'),

        h1("5. Auth APIs"),
        apiTable([
          ["POST", "/auth/register", "Public", "Create customer / technician / admin"],
          ["POST", "/auth/login", "Public", "Login → JWT / session"],
          ["POST", "/auth/logout", "User", "Logout"],
          ["GET", "/auth/me", "User", "Current user profile"],
          ["PATCH", "/auth/me", "User", "Update name, phone, initials"],
          ["POST", "/auth/forgot-password", "Public", "Send reset email"],
          ["POST", "/auth/reset-password", "Public", "Reset password with token"],
          ["POST", "/auth/change-password", "User", "Change password while logged in"],
        ]),
        p("Register body: name, email, phone, password, role, trade? (required if technician)"),

        h1("6. Catalogue APIs"),
        apiTable([
          ["GET", "/categories", "Public", "All trades + service/tech counts"],
          ["GET", "/categories/:id", "Public", "One category"],
          ["GET", "/areas", "Public", "Dhaka areas list"],
          ["GET", "/services", "Public", "Browse / filter services"],
          ["GET", "/services/featured", "Public", "Homepage popular services (4)"],
          ["GET", "/services/:id", "Public", "Service detail"],
          ["POST", "/services", "Admin", "Create service"],
          ["PATCH", "/services/:id", "Admin", "Update service"],
          ["DELETE", "/services/:id", "Admin", "Soft-disable service"],
        ]),
        p("GET /services query: q, cat, minRating, maxPrice, sort=pop|rating|price-asc|price-desc, page, limit"),

        h1("7. Technician APIs"),
        apiTable([
          ["GET", "/technicians", "Public", "Browse / filter technicians"],
          ["GET", "/technicians/top", "Public", "Homepage top technicians (3)"],
          ["GET", "/technicians/:id", "Public", "Profile + skills + offered services"],
          ["GET", "/technicians/:id/slots", "Public", "Free/booked slots for date range"],
          ["PATCH", "/technicians/me", "Technician", "Update bio, rate, online, area"],
          ["PUT", "/technicians/me/categories", "Technician", "Set trade categories"],
          ["PUT", "/technicians/me/skills", "Technician", "Replace skills list"],
          ["POST", "/technicians/me/slots", "Technician", "Add availability slot"],
          ["PATCH", "/technicians/me/slots/:slotId", "Technician", "Edit slot"],
          ["DELETE", "/technicians/me/slots/:slotId", "Technician", "Remove slot"],
          ["PATCH", "/technicians/:id/verify", "Admin", "Verify / unverify technician"],
        ]),
        p("GET /technicians query: q, cat, area, minRating, maxRate, today=true, sort=pop|rating|price-asc|price-desc"),
        p("GET /technicians/:id/slots query: from=YYYY-MM-DD&days=7"),

        h1("8. Booking APIs"),
        apiTable([
          ["POST", "/bookings", "Customer", "Request booking (service + tech + slot)"],
          ["GET", "/bookings", "User", "List my bookings (customer or tech)"],
          ["GET", "/bookings/:id", "Owner", "Booking detail (id or FIX-xxxx)"],
          ["POST", "/bookings/:id/accept", "Technician", "Accept → ACCEPTED"],
          ["POST", "/bookings/:id/decline", "Technician", "Decline → DECLINED"],
          ["POST", "/bookings/:id/cancel", "Customer", "Cancel if allowed"],
          ["PATCH", "/bookings/:id/status", "Tech/Admin", "EN_ROUTE → ON_SITE → COMPLETED"],
        ]),
        p("POST /bookings body:"),
        code('{ "serviceId": "s5", "technicianId": "t3", "slotId": "…", "notes": "optional" }'),
        p("Returns: { refCode, totalAmount, status: \"REQUESTED\" }"),

        h1("9. Payment APIs"),
        apiTable([
          ["POST", "/payments/initiate", "Customer", "Start payment after accept"],
          ["GET", "/payments/:id", "Owner", "Payment status"],
          ["POST", "/payments/webhook", "Gateway", "Provider callback"],
          ["POST", "/payments/:id/refund", "Admin", "Refund payment"],
        ]),
        p("POST /payments/initiate body: { bookingId, method: \"BKASH\" | \"NAGAD\" | \"CARD\" }"),
        p("Frontend routes: /payment/success · /payment/cancel"),

        h1("10. Review APIs"),
        apiTable([
          ["GET", "/services/:id/reviews", "Public", "Service reviews"],
          ["GET", "/technicians/:id/reviews", "Public", "Technician reviews"],
          ["POST", "/reviews", "Customer", "Create review / rating"],
          ["DELETE", "/reviews/:id", "Author/Admin", "Delete review"],
        ]),
        p("POST /reviews body:"),
        code('{ "target": "SERVICE"|"TECHNICIAN", "serviceId": "s5", "technicianId": "t2", "bookingId": "optional", "rating": 5, "body": "…" }'),

        h1("11. Admin APIs"),
        apiTable([
          ["GET", "/admin/stats", "Admin", "Jobs, revenue, disputes overview"],
          ["GET", "/admin/users", "Admin", "List / search users"],
          ["PATCH", "/admin/users/:id", "Admin", "Suspend / restore / ban"],
          ["POST", "/admin/categories", "Admin", "Add trade category"],
          ["PATCH", "/admin/categories/:id", "Admin", "Edit / retire category"],
        ]),

        h1("12. Frontend Pages ↔ APIs"),
        bullet("Home — GET /services/featured, GET /technicians/top, GET /categories"),
        bullet("Browse services — GET /services"),
        bullet("Service detail — GET /services/:id, GET /services/:id/reviews, POST /reviews"),
        bullet("Browse technicians — GET /technicians"),
        bullet("Technician detail — GET /technicians/:id, GET …/slots, POST /bookings"),
        bullet("My bookings — GET /bookings, payment + status actions"),
        bullet("Auth — /auth/register, /auth/login, /auth/forgot-password"),

        h1("13. Recommended Build Order"),
        bullet("1. Auth — register, login, me"),
        bullet("2. Catalogue — categories, services list/detail"),
        bullet("3. Technicians — list, detail, slots"),
        bullet("4. Bookings — create, accept/decline, list"),
        bullet("5. Payments — initiate + webhook"),
        bullet("6. Reviews — list + create"),
        bullet("7. Admin — stats, user moderation"),

        h1("14. Seed Data Notes"),
        bullet("Categories: c1 Plumbing … c8 Pest Control"),
        bullet("Services: s1–s16 with tags Most booked / Top rated / Emergency"),
        bullet("Technicians: t1–t9 (Rakib, Shamim, Nasima, Jubayer, Milon, Farhana, Tanvir, Imran, Sohel)"),
        bullet("Areas: Dhanmondi, Mohammadpur, Gulshan, Uttara, Bashundhara, Mirpur, Banani, Old Dhaka"),
        bullet("Demo booking ref pattern: FIX-(4830 + random 0–59)"),

        new Paragraph({
          spacing: { before: 480 },
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "— End of FixItNow API & Data Documentation —",
              italics: true,
              size: 18,
              color: "6E8091",
              font: "Calibri",
            }),
          ],
        }),
      ],
    },
  ],
})

async function main() {
  const outDir = path.join(process.cwd(), "docs")
  fs.mkdirSync(outDir, { recursive: true })
  const outPath = path.join(outDir, "FixItNow-API-Documentation.docx")
  const buffer = await Packer.toBuffer(doc)
  fs.writeFileSync(outPath, buffer)
  console.log(outPath)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
