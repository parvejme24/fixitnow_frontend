/** Client-side payment history export (CSV + branded PDF receipt). */

import { jsPDF } from "jspdf"

export type PaymentExportRow = {
  id: string
  bookingId?: string
  bookingRef: string
  service: string
  amount: number
  method: string
  status: string
  date: string
  providerTxnId?: string | null
  /** Service / booking context */
  area?: string
  slotDate?: string
  slotTime?: string
  trade?: string
  notes?: string | null
  /** Parties */
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  technicianName?: string
  technicianTrade?: string
}

const INK = { r: 14, g: 20, b: 27 }
const STEEL = { r: 107, g: 127, b: 140 }
const HIVIS = { r: 255, g: 201, b: 60 }
const PANEL = { r: 19, g: 27, b: 36 }
const LINE = { r: 226, g: 230, b: 235 }
const SIGNAL = { r: 18, g: 184, b: 134 }

function csvEscape(value: string | number | null | undefined) {
  const raw = value == null ? "" : String(value)
  if (/[",\n\r]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`
  return raw
}

function triggerDownload(blob: Blob, filename: string) {
  if (typeof window === "undefined") return
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.rel = "noopener"
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000)
}

export function buildPaymentsCsv(rows: PaymentExportRow[]) {
  const header = [
    "Payment ID",
    "Booking ref",
    "Booking ID",
    "Service",
    "Area",
    "Slot date",
    "Slot time",
    "Customer",
    "Customer email",
    "Customer phone",
    "Technician",
    "Trade",
    "Amount (BDT)",
    "Method",
    "Status",
    "Date",
    "Provider txn",
  ]
  const lines = [
    header.join(","),
    ...rows.map((p) =>
      [
        csvEscape(p.id),
        csvEscape(p.bookingRef),
        csvEscape(p.bookingId || ""),
        csvEscape(p.service),
        csvEscape(p.area || ""),
        csvEscape(p.slotDate || ""),
        csvEscape(p.slotTime || ""),
        csvEscape(p.customerName || ""),
        csvEscape(p.customerEmail || ""),
        csvEscape(p.customerPhone || ""),
        csvEscape(p.technicianName || ""),
        csvEscape(p.technicianTrade || p.trade || ""),
        csvEscape(p.amount),
        csvEscape(p.method),
        csvEscape(p.status),
        csvEscape(p.date),
        csvEscape(p.providerTxnId || ""),
      ].join(",")
    ),
  ]
  return `${lines.join("\n")}\n`
}

export function downloadPaymentsCsv(
  rows: PaymentExportRow[],
  filename = `fixitnow-payments-${new Date().toISOString().slice(0, 10)}.csv`
) {
  const csv = buildPaymentsCsv(rows)
  triggerDownload(new Blob([csv], { type: "text/csv;charset=utf-8" }), filename)
}

function drawBrandMark(doc: jsPDF, x: number, y: number, size = 12) {
  doc.setFillColor(PANEL.r, PANEL.g, PANEL.b)
  doc.roundedRect(x, y, size, size, 2, 2, "F")
  doc.setDrawColor(HIVIS.r, HIVIS.g, HIVIS.b)
  doc.setLineWidth(0.7)
  // Simple wrench mark
  const cx = x + size / 2
  const cy = y + size / 2
  doc.line(cx - 2.2, cy + 2.4, cx + 2.4, cy - 2.2)
  doc.circle(cx - 2.6, cy + 2.8, 1.4, "S")
  doc.setFillColor(HIVIS.r, HIVIS.g, HIVIS.b)
  doc.circle(cx + 2.8, cy - 2.6, 1.1, "F")
}

function drawBrandWordmark(doc: jsPDF, x: number, y: number, size = 16) {
  doc.setFont("helvetica", "bold")
  doc.setFontSize(size)
  doc.setTextColor(255, 255, 255)
  doc.text("Fix", x, y)
  const fixW = doc.getTextWidth("Fix")
  doc.setTextColor(HIVIS.r, HIVIS.g, HIVIS.b)
  doc.text("It", x + fixW, y)
  const itW = doc.getTextWidth("It")
  doc.setTextColor(255, 255, 255)
  doc.text("Now", x + fixW + itW, y)
}

function sectionTitle(doc: jsPDF, title: string, x: number, y: number) {
  doc.setFillColor(HIVIS.r, HIVIS.g, HIVIS.b)
  doc.roundedRect(x, y - 4.2, 1.6, 5.2, 0.4, 0.4, "F")
  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.setTextColor(INK.r, INK.g, INK.b)
  doc.text(title.toUpperCase(), x + 4, y)
  return y + 7
}

function kv(
  doc: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number
) {
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(STEEL.r, STEEL.g, STEEL.b)
  doc.text(label, x, y)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.setTextColor(INK.r, INK.g, INK.b)
  const lines = doc.splitTextToSize(value || "—", width)
  doc.text(lines, x, y + 5)
  return y + 5 + lines.length * 4.4 + 4
}

function cardFrame(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number
) {
  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(LINE.r, LINE.g, LINE.b)
  doc.setLineWidth(0.3)
  doc.roundedRect(x, y, w, h, 3, 3, "FD")
}

function drawReceiptPdf(payment: PaymentExportRow) {
  const doc = new jsPDF({ unit: "mm", format: "a4" })
  const pageW = 210
  const margin = 16
  const contentW = pageW - margin * 2
  const payCode = `PAY-${payment.id.slice(0, 8).toUpperCase()}`

  // Header band
  doc.setFillColor(INK.r, INK.g, INK.b)
  doc.rect(0, 0, pageW, 42, "F")
  doc.setFillColor(HIVIS.r, HIVIS.g, HIVIS.b)
  doc.rect(0, 42, pageW, 2.2, "F")

  drawBrandMark(doc, margin, 12, 14)
  drawBrandWordmark(doc, margin + 18, 21, 18)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(STEEL.r, STEEL.g, STEEL.b)
  doc.text("Dhaka · On-demand home services", margin + 18, 27)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.setTextColor(HIVIS.r, HIVIS.g, HIVIS.b)
  doc.text("PAYMENT RECEIPT", pageW - margin, 18, { align: "right" })
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(255, 255, 255)
  doc.text(payCode, pageW - margin, 26, { align: "right" })
  doc.setTextColor(STEEL.r, STEEL.g, STEEL.b)
  doc.text(payment.date || "—", pageW - margin, 32, { align: "right" })

  let y = 52

  // Amount hero strip
  doc.setFillColor(255, 249, 230)
  doc.roundedRect(margin, y, contentW, 22, 3, 3, "F")
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(STEEL.r, STEEL.g, STEEL.b)
  doc.text("Amount paid", margin + 6, y + 8)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)
  doc.setTextColor(INK.r, INK.g, INK.b)
  doc.text(
    `BDT ${payment.amount.toLocaleString("en-IN")}`,
    margin + 6,
    y + 17
  )

  const status = payment.status.replace(/_/g, " ")
  doc.setFillColor(SIGNAL.r, SIGNAL.g, SIGNAL.b)
  const statusW = Math.max(28, doc.getTextWidth(status) + 10)
  doc.roundedRect(pageW - margin - statusW - 6, y + 6, statusW, 10, 2, 2, "F")
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.setTextColor(255, 255, 255)
  doc.text(status.toUpperCase(), pageW - margin - statusW / 2 - 6, y + 12.5, {
    align: "center",
  })

  y += 30

  // Two-column: Customer + Technician
  const colGap = 6
  const colW = (contentW - colGap) / 2
  const cardH = 46
  cardFrame(doc, margin, y, colW, cardH)
  cardFrame(doc, margin + colW + colGap, y, colW, cardH)

  let cy = sectionTitle(doc, "Customer", margin + 5, y + 9)
  cy = kv(
    doc,
    "Name",
    payment.customerName || "—",
    margin + 5,
    cy,
    colW - 12
  )
  if (payment.customerEmail) {
    cy = kv(doc, "Email", payment.customerEmail, margin + 5, cy, colW - 12)
  }
  if (payment.customerPhone) {
    kv(doc, "Phone", payment.customerPhone, margin + 5, cy, colW - 12)
  }

  let ty = sectionTitle(
    doc,
    "Technician",
    margin + colW + colGap + 5,
    y + 9
  )
  ty = kv(
    doc,
    "Name",
    payment.technicianName || "—",
    margin + colW + colGap + 5,
    ty,
    colW - 12
  )
  kv(
    doc,
    "Trade",
    payment.technicianTrade || payment.trade || "—",
    margin + colW + colGap + 5,
    ty,
    colW - 12
  )

  y += cardH + 8

  // Service card
  const serviceH = payment.notes ? 52 : 42
  cardFrame(doc, margin, y, contentW, serviceH)
  let sy = sectionTitle(doc, "Service details", margin + 5, y + 9)
  const half = contentW / 2 - 8
  let leftY = kv(doc, "Service", payment.service, margin + 5, sy, half)
  leftY = kv(doc, "Area", payment.area || "—", margin + 5, leftY, half)
  let rightY = kv(
    doc,
    "Booking ref",
    payment.bookingRef,
    margin + contentW / 2,
    sy,
    half
  )
  const slot =
    [payment.slotDate, payment.slotTime].filter(Boolean).join(" · ") || "—"
  rightY = kv(doc, "Scheduled slot", slot, margin + contentW / 2, rightY, half)
  if (payment.notes) {
    kv(
      doc,
      "Notes",
      payment.notes,
      margin + 5,
      Math.max(leftY, rightY),
      contentW - 12
    )
  }

  y += serviceH + 8

  // Payment card
  cardFrame(doc, margin, y, contentW, 48)
  let py = sectionTitle(doc, "Payment details", margin + 5, y + 9)
  let pLeft = kv(doc, "Method", payment.method.replace(/_/g, " "), margin + 5, py, half)
  pLeft = kv(doc, "Paid on", payment.date, margin + 5, pLeft, half)
  let pRight = kv(doc, "Payment ID", payment.id, margin + contentW / 2, py, half)
  if (payment.providerTxnId) {
    kv(
      doc,
      "Provider transaction",
      payment.providerTxnId,
      margin + contentW / 2,
      pRight,
      half
    )
  } else if (payment.bookingId) {
    kv(
      doc,
      "Booking ID",
      payment.bookingId,
      margin + contentW / 2,
      pRight,
      half
    )
  }
  void pLeft

  y += 58

  // Footer
  doc.setDrawColor(LINE.r, LINE.g, LINE.b)
  doc.setLineWidth(0.3)
  doc.line(margin, y, pageW - margin, y)
  y += 8
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.setTextColor(INK.r, INK.g, INK.b)
  doc.text("Thank you for choosing FixItNow", margin, y)
  y += 5
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(STEEL.r, STEEL.g, STEEL.b)
  doc.text(
    "This receipt confirms your online payment. Keep it for your records.",
    margin,
    y
  )
  y += 5
  doc.text(
    `Generated ${new Date().toLocaleString("en-GB")} · fixitnow.app`,
    margin,
    y
  )

  // Bottom brand bar
  doc.setFillColor(INK.r, INK.g, INK.b)
  doc.rect(0, 287, pageW, 10, "F")
  doc.setFillColor(HIVIS.r, HIVIS.g, HIVIS.b)
  doc.rect(0, 287, pageW, 1.2, "F")
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.setTextColor(HIVIS.r, HIVIS.g, HIVIS.b)
  doc.text("FixItNow", margin, 293.5)
  doc.setTextColor(STEEL.r, STEEL.g, STEEL.b)
  doc.setFont("helvetica", "normal")
  doc.text("Trusted home services in Dhaka", pageW - margin, 293.5, {
    align: "right",
  })

  return { doc, payCode }
}

/** Download a single payment’s details as a branded PDF receipt. */
export function downloadPaymentReceipt(payment: PaymentExportRow) {
  const { doc, payCode } = drawReceiptPdf(payment)
  doc.save(`fixitnow-receipt-${payCode}.pdf`)
}
