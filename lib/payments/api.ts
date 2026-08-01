import { apiGet, apiPost } from "@/lib/api"

export type PaymentMethod = "BKASH" | "NAGAD" | "CARD"

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
  redirectUrl?: string | null
  createdAt?: string
}

type Loose = Record<string, unknown>

function asRecord(value: unknown): Loose | null {
  return value && typeof value === "object" ? (value as Loose) : null
}

function str(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback
}

function num(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

function unwrap(data: unknown): Loose {
  const obj = asRecord(data) ?? {}
  const nested = asRecord(obj.payment) ?? asRecord(obj.item)
  return nested ?? obj
}

export function normalizePayment(raw: unknown): Payment {
  const obj = unwrap(raw)
  const booking = asRecord(obj.booking)
  return {
    id: str(obj.id),
    bookingId: str(obj.bookingId ?? booking?.id),
    bookingRef: str(
      obj.bookingRef ?? booking?.refCode ?? booking?.reference
    ) || undefined,
    amount: num(obj.amount ?? obj.totalAmount ?? booking?.totalAmount),
    method: str(obj.method ?? obj.provider, "BKASH"),
    status: String(obj.status ?? "PENDING").toUpperCase() as PaymentStatus,
    redirectUrl:
      str(
        obj.redirectUrl ??
          obj.paymentUrl ??
          obj.checkoutUrl ??
          obj.url ??
          obj.GatewayPageURL
      ) || null,
    createdAt: str(obj.createdAt) || undefined,
  }
}

/** Customer: start payment for an accepted booking. */
export async function initiatePayment(
  input: { bookingId: string; method: PaymentMethod },
  token: string
) {
  const res = await apiPost<unknown>("/payments/initiate", input, token)
  return normalizePayment(res.data)
}

/** Owner: payment details. */
export async function fetchPayment(id: string, token: string) {
  const res = await apiGet<unknown>(`/payments/${id}`, undefined, token)
  return normalizePayment(res.data)
}

/** Admin: refund a payment. */
export async function refundPayment(id: string, token: string) {
  const res = await apiPost<unknown>(`/payments/${id}/refund`, {}, token)
  return normalizePayment(res.data)
}

export function getPaymentErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return "Payment failed. Please try again."
}
