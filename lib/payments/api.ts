/**
 * Payments API — `/api/v1/payments`
 *
 * POST /payments/initiate              — customer → ShurjoPay checkoutUrl
 * GET|POST /payments/shurjopay/callback — gateway return (backend; no frontend call)
 * POST /payments/webhook               — optional dev stub
 * GET  /payments/:id                   — auth
 * POST /payments/:id/refund            — admin
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
  amount: number
  method: string
  status: PaymentStatus
  providerTxnId?: string | null
  paidAt?: string | null
  createdAt?: string
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

function str(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback
}

function num(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
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
  return {
    id: str(obj.id),
    bookingId: str(obj.bookingId ?? booking?.id),
    bookingRef:
      str(obj.bookingRef ?? booking?.refCode ?? booking?.reference) ||
      undefined,
    amount: num(
      obj.amount ??
        obj.totalAmount ??
        booking?.totalAmount ??
        asRecord(booking?.service)?.price
    ),
    method: str(obj.method ?? obj.provider ?? obj.paymentMethod, "SHURJOPAY"),
    status: String(obj.status ?? "PENDING").toUpperCase() as PaymentStatus,
    providerTxnId: str(obj.providerTxnId) || null,
    paidAt: str(obj.paidAt) || null,
    createdAt: str(obj.createdAt) || undefined,
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

/** Admin: `POST /payments/:id/refund` */
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
