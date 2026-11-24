import { NextResponse } from "next/server"
import { lookupSchema } from "@/lib/booking-schema"
import { lookupBooking } from "@/lib/server/bookings"

export async function POST(req: Request) {
  const parsed = lookupSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check your details" }, { status: 422 })
  }
  const found = await lookupBooking(parsed.data.reference, parsed.data.email)
  if (!found) {
    return NextResponse.json(
      { error: "We could not find a booking with that email and reference. Check both and try again." },
      { status: 404 },
    )
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { admin_note, ...booking } = found.booking
  return NextResponse.json({ booking, events: found.events })
}
