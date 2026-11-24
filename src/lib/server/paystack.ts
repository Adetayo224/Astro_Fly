import "server-only"
import { createHmac, timingSafeEqual } from "node:crypto"
import { env, hasPaystack } from "./env"

const API = "https://api.paystack.co"

export interface InitResult {
  authorization_url: string
  reference: string
}

export async function initializePayment(opts: {
  email: string
  amountNaira: number
  bookingReference: string
  kind: "deposit" | "balance"
  callbackUrl: string
}): Promise<InitResult> {
  const reference = `${opts.bookingReference}_${opts.kind.toUpperCase()}_${Date.now()}`
  if (!hasPaystack) {
    // Mock checkout: skip straight to the callback, which "verifies" the mock reference.
    const mockRef = `MOCK_${opts.bookingReference}_${opts.amountNaira}_${Date.now()}`
    return { authorization_url: `${opts.callbackUrl}?reference=${mockRef}`, reference: mockRef }
  }
  const res = await fetch(`${API}/transaction/initialize`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.paystackSecret}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      email: opts.email,
      amount: Math.round(opts.amountNaira * 100),
      currency: "NGN",
      reference,
      callback_url: opts.callbackUrl,
      metadata: { booking_reference: opts.bookingReference, kind: opts.kind },
    }),
  })
  const json = await res.json()
  if (!res.ok || !json.status) throw new Error(json.message || "Paystack could not start the payment")
  return { authorization_url: json.data.authorization_url, reference: json.data.reference }
}

export interface VerifiedPayment {
  ok: boolean
  bookingReference: string | null
  amountNaira: number
  paystackRef: string
}

export async function verifyPayment(reference: string): Promise<VerifiedPayment> {
  if (reference.startsWith("MOCK_")) {
    if (hasPaystack) return { ok: false, bookingReference: null, amountNaira: 0, paystackRef: reference }
    const [, bookingReference, amount] = reference.split("_")
    return { ok: true, bookingReference, amountNaira: Number(amount), paystackRef: reference }
  }
  const res = await fetch(`${API}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${env.paystackSecret}` },
    cache: "no-store",
  })
  const json = await res.json()
  const data = json?.data
  const ok = res.ok && json.status && data?.status === "success" && data?.currency === "NGN"
  return {
    ok: Boolean(ok),
    bookingReference: data?.metadata?.booking_reference ?? reference.split("_")[0] ?? null,
    amountNaira: ok ? Number(data.amount) / 100 : 0,
    paystackRef: reference,
  }
}

export function validWebhookSignature(rawBody: string, signature: string | null) {
  if (!hasPaystack || !signature) return false
  const hash = createHmac("sha512", env.paystackSecret).update(rawBody).digest("hex")
  const a = Buffer.from(hash)
  const b = Buffer.from(signature)
  return a.length === b.length && timingSafeEqual(a, b)
}
