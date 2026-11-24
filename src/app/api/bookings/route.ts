import { NextResponse } from "next/server"
import { bookingSchema } from "@/lib/booking-schema"
import { upfrontNaira } from "@/lib/site"
import { createBooking } from "@/lib/server/bookings"
import { getDrones } from "@/lib/server/drones"
import { sendBookingEmails } from "@/lib/server/email"

export async function POST(req: Request) {
  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  let payload: unknown
  try {
    payload = JSON.parse(String(form.get("payload") ?? ""))
  } catch {
    return NextResponse.json({ error: "Invalid booking data" }, { status: 400 })
  }

  const parsed = bookingSchema.safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Some details need another look", issues: parsed.error.flatten().fieldErrors },
      { status: 422 },
    )
  }
  const data = parsed.data

  const drone = (await getDrones()).find((d) => d.slug === data.drone_slug)
  if (!drone || drone.status !== "available") {
    return NextResponse.json({ error: "That drone is not available to book yet" }, { status: 422 })
  }

  try {
    const booking = await createBooking(data)
    await sendBookingEmails(booking)
    return NextResponse.json({
      reference: booking.reference,
      email: booking.email,
      pay_option: booking.pay_option,
      needs_pilot: booking.needs_pilot,
      amount_due: upfrontNaira(booking.needs_pilot),
    })
  } catch (e) {
    console.error("[bookings] create failed", e)
    return NextResponse.json({ error: "We could not save your booking. Please try again or message us on WhatsApp." }, { status: 500 })
  }
}
