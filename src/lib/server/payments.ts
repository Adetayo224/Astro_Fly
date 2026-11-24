import "server-only"
import { recordPayment } from "./bookings"
import { sendPaymentEmail } from "./email"
import { verifyPayment } from "./paystack"

/** Shared by the redirect callback and the webhook. Safe to call more than once. */
export async function settlePayment(paystackReference: string) {
  const v = await verifyPayment(paystackReference)
  if (!v.ok || !v.bookingReference) return { ok: false as const }
  const result = await recordPayment(v.bookingReference, v.amountNaira, v.paystackRef)
  if (!result) return { ok: false as const }
  if (!result.alreadyRecorded) await sendPaymentEmail(result.booking, v.amountNaira, v.paystackRef)
  return { ok: true as const, booking: result.booking, amount: v.amountNaira }
}
