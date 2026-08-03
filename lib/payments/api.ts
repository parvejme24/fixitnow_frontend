/**
 * Payments API — `/api/v1/payments`
 *
 * GET|POST /payments/shurjopay/callback — gateway return (backend)
 * POST /payments/webhook               — optional dev stub
 * POST /payments/initiate              — customer → ShurjoPay checkoutUrl
 * GET  /payments/me                    — customer payment history
 * GET  /payments/me/summary            — customer payment summary
 * GET  /payments/history               — customer payment history (alias)
 * GET  /payments/:id                   — auth
 * POST /payments/:id/refund            — technician or admin
 */
import { ApiError, apiGet, apiPost } from "@/lib/api"

export type PaymentMethod = "BKASH" | "NAGAD" | "CARD" | "SHURJOPAY"

export type PaymentStatus =
  | "PENDING"
  | "INITIATED"
  | "SUCCESS"
  | "PAID"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED"

export type Payment = {
  id: string
  bookingId: string
  bookingRef?: string
  service?: string
  amount: number
  method: string
  status: PaymentStatus
  providerTxnId?: string | null
  paidAt?: string | null
  createdAt?: string
}

export type PaymentSummary = {
  count: number
  paidCount: number
  pendingCount: number
  failedCount: number
  refundedCount: number
  totalPaid: number
  totalPending: number
  totalRefunded: number
  totalFailed: number
}

export type InitiatePaymentInput = {
  bookingId: string
  /** Optional — backend may default to ShurjoPay. */
  method?: PaymentMethod
}

export type PaymentRedirect = {
  checkoutUrl: string
  successUrl: string
  cancelUrl: string
}

export type InitiatePaymentResult = {
  payment: Payment
  checkoutUrl: string
  redirect: PaymentRedirect
}

export type WebhookPaymentInput = {
  paymentId: string
  status: "SUCCESS" | "FAILED" | "CANCELLED"
  providerTxnId?: string
}

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
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.replace(/,/g, "").trim())
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

function unwrapPayment(data: unknown): Loose {
  const obj = asRecord(data) ?? {}
  const nested =
    asRecord(obj.payment) ?? asRecord(obj.item) ?? asRecord(obj.data)
  return nested ?? obj
}

export function normalizePayment(raw: unknown): Payment {
  const obj = unwrapPayment(raw)
  const booking = asRecord(obj.booking)
  const service = asRecord(obj.service) ?? asRecord(booking?.service)
  return {
    id: str(obj.id),
    bookingId: str(obj.bookingId ?? booking?.id),
    bookingRef:
      str(obj.bookingRef ?? booking?.refCode ?? booking?.reference) ||
      undefined,
    service:
      str(
        obj.serviceTitle ??
          obj.serviceName ??
          service?.title ??
          service?.name ??
          booking?.service
      ) || undefined,
    amount: num(
      obj.amount ??
        obj.totalAmount ??
        booking?.totalAmount ??
        service?.price
    ),
    method: str(obj.method ?? obj.provider ?? obj.paymentMethod, "SHURJOPAY"),
    status: String(obj.status ?? "PENDING").toUpperCase() as PaymentStatus,
    providerTxnId: str(obj.providerTxnId) || null,
    paidAt: str(obj.paidAt) || null,
    createdAt: str(obj.createdAt) || undefined,
  }
}

function listPayments(data: unknown): Payment[] {
  const items = Array.isArray(data)
    ? data
    : asArray(
        asRecord(data)?.payments ??
          asRecord(data)?.items ??
          asRecord(data)?.results ??
          asRecord(data)?.history
      )
  return items.map(normalizePayment).filter((p) => Boolean(p.id))
}

export function normalizePaymentSummary(raw: unknown): PaymentSummary {
  const obj = asRecord(raw) ?? {}
  const nested =
    asRecord(obj.summary) ?? asRecord(obj.stats) ?? asRecord(obj.data) ?? obj
  return {
    count: num(
      nested.count ?? nested.totalCount ?? nested.totalPayments ?? nested.total
    ),
    paidCount: num(
      nested.paidCount ?? nested.successfulCount ?? nested.successCount
    ),
    pendingCount: num(nested.pendingCount ?? nested.awaitingCount),
    failedCount: num(nested.failedCount ?? nested.cancelledCount),
    refundedCount: num(nested.refundedCount),
    totalPaid: num(
      nested.totalPaid ?? nested.paidAmount ?? nested.successfulAmount
    ),
    totalPending: num(nested.totalPending ?? nested.pendingAmount),
    totalRefunded: num(nested.totalRefunded ?? nested.refundedAmount),
    totalFailed: num(nested.totalFailed ?? nested.failedAmount),
  }
}

function appOrigin() {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin
  }
  return ""
}

function pickCheckoutUrl(raw: unknown): string {
  const obj = asRecord(raw) ?? {}
  const redirect = asRecord(obj.redirect)
  return (
    str(obj.checkoutUrl) ||
    str(redirect?.checkoutUrl) ||
    str(obj.paymentUrl) ||
    str(redirect?.paymentUrl) ||
    str(obj.redirectUrl) ||
    str(redirect?.url)
  )
}

function normalizeRedirect(
  raw: unknown,
  paymentId: string,
  checkoutUrl: string
): PaymentRedirect {
  const obj = asRecord(raw) ?? {}
  const redirect = asRecord(obj.redirect) ?? obj
  const origin = appOrigin()
  return {
    checkoutUrl,
    successUrl:
      str(redirect.successUrl) ||
      `${origin}/payment/success?paymentId=${encodeURIComponent(paymentId)}`,
    cancelUrl:
      str(redirect.cancelUrl) ||
      `${origin}/payment/cancel?paymentId=${encodeURIComponent(paymentId)}`,
  }
}

/** Customer: `POST /payments/initiate` → ShurjoPay `checkoutUrl` */
export async function initiatePayment(
  input: InitiatePaymentInput,
  token: string
): Promise<InitiatePaymentResult> {
  const body: Record<string, string> = { bookingId: input.bookingId }
  if (input.method) body.method = input.method

  const res = await apiPost<unknown>("/payments/initiate", body, token)
  const payment = normalizePayment(res.data)
  const checkoutUrl = pickCheckoutUrl(res.data)

  if (!checkoutUrl) {
    throw new ApiError(
      "Payment initiated but no checkout URL was returned.",
      "MISSING_CHECKOUT_URL",
      500
    )
  }

  return {
    payment,
    checkoutUrl,
    redirect: normalizeRedirect(res.data, payment.id, checkoutUrl),
  }
}

/** Auth: `GET /payments/:id` */
export async function fetchPayment(id: string, token: string) {
  const res = await apiGet<unknown>(`/payments/${id}`, undefined, token)
  return normalizePayment(res.data)
}

/** Customer: `GET /payments/me` (falls back to `/payments/history`). */
export async function fetchMyPayments(token: string): Promise<Payment[]> {
  try {
    const res = await apiGet<unknown>("/payments/me", undefined, token)
    return listPayments(res.data)
  } catch (error) {
    if (
      error instanceof ApiError &&
      (error.status === 404 || error.code === "NOT_FOUND")
    ) {
      const res = await apiGet<unknown>("/payments/history", undefined, token)
      return listPayments(res.data)
    }
    throw error
  }
}

/** Customer: `GET /payments/me/summary` */
export async function fetchMyPaymentSummary(token: string) {
  const res = await apiGet<unknown>("/payments/me/summary", undefined, token)
  return normalizePaymentSummary(res.data)
}

/** Technician or admin: `POST /payments/:id/refund` */
export async function refundPayment(id: string, token: string) {
  const res = await apiPost<unknown>(`/payments/${id}/refund`, {}, token)
  return normalizePayment(res.data)
}

/** Optional dev stub: `POST /payments/webhook` */
export async function postPaymentWebhook(input: WebhookPaymentInput) {
  const res = await apiPost<unknown>("/payments/webhook", input)
  return normalizePayment(res.data)
}

/** Send the browser to ShurjoPay (same tab). */
export function goToShurjoPayCheckout(checkoutUrl: string) {
  if (typeof window === "undefined" || !checkoutUrl) return
  window.location.href = checkoutUrl
}

export function getPaymentErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return "Payment failed. Please try again."
}
