import { NextResponse } from "next/server"
import { z } from "zod"
import { site, upfrontNaira } from "@/lib/site"
import { getBookingByReference } from "@/lib/server/bookings"
import { initializePayment } from "@/lib/server/paystack"
import { getPricing } from "@/lib/server/settings"

const schema = z.object({
  reference: z.string().trim().toUpperCase(),
  email: z.string().trim().toLowerCase().email(),
  kind: z.enum(["deposit", "balance"]),
})

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 422 })
  const { reference, email, kind } = parsed.data

  const booking = await getBookingByReference(reference)
  if (!booking || booking.email.toLowerCase() !== email) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 })
  }
  if (booking.status === "cancelled" || booking.status === "completed") {
    return NextResponse.json({ error: "This booking cannot take payments" }, { status: 409 })
  }

  const pricing = await getPricing()
  let amount: number
  if (kind === "deposit") {
    if (booking.amount_paid > 0) return NextResponse.json({ error: "Deposit already paid" }, { status: 409 })
    amount = booking.price ? Math.min(upfrontNaira(booking.needs_pilot, pricing), booking.price) : upfrontNaira(booking.needs_pilot, pricing)
  } else {
    if (!booking.price) return NextResponse.json({ error: "Your price has not been set yet" }, { status: 409 })
    amount = booking.price - booking.amount_paid
    if (amount <= 0) return NextResponse.json({ error: "Nothing left to pay" }, { status: 409 })
  }

  const origin = req.headers.get("origin") || site.url
  try {
    const init = await initializePayment({
      email: booking.email,
      amountNaira: amount,
      bookingReference: booking.reference,
      kind,
      callbackUrl: `${origin}/pay/callback`,
    })
    return NextResponse.json({ url: init.authorization_url, amount })
  } catch (e) {
    console.error("[paystack:init]", e)
    return NextResponse.json({ error: "Payment could not start. Please try again." }, { status: 502 })
  }
}
