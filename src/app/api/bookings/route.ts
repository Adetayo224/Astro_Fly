import { NextResponse } from "next/server"
import { bookingSchema, FLYER_MAX_BYTES, FLYER_TYPES } from "@/lib/booking-schema"
import { createBooking, type FlyerUpload } from "@/lib/server/bookings"
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

  let flyer: FlyerUpload | undefined
  if (data.has_flyer === "yes") {
    const file = form.get("flyer")
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Please attach your flyer", issues: { flyer: ["Attach your flyer"] } }, { status: 422 })
    }
    if (file.size > FLYER_MAX_BYTES) {
      return NextResponse.json({ error: "Flyer must be 10 MB or smaller" }, { status: 413 })
    }
    if (!FLYER_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Flyer must be an image or a PDF" }, { status: 415 })
    }
    flyer = { name: file.name.slice(0, 120), type: file.type, data: Buffer.from(await file.arrayBuffer()) }
  }

  try {
    const booking = await createBooking(data, flyer)
    await sendBookingEmails(booking)
    return NextResponse.json({ reference: booking.reference, email: booking.email, pay_option: booking.pay_option })
  } catch (e) {
    console.error("[bookings] create failed", e)
    return NextResponse.json({ error: "We could not save your booking. Please try again or message us on WhatsApp." }, { status: 500 })
  }
}
