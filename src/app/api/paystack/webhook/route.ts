import { NextResponse } from "next/server"
import { settlePayment } from "@/lib/server/payments"
import { validWebhookSignature } from "@/lib/server/paystack"

export async function POST(req: Request) {
  const raw = await req.text()
  if (!validWebhookSignature(raw, req.headers.get("x-paystack-signature"))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }
  const event = JSON.parse(raw)
  if (event?.event === "charge.success" && event.data?.reference) {
    // Re-verify with the API rather than trusting the payload amount.
    await settlePayment(String(event.data.reference)).catch((e) => console.error("[paystack:webhook]", e))
  }
  return NextResponse.json({ received: true })
}
