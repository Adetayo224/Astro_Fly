import { NextResponse } from "next/server"
import { notifySchema } from "@/lib/booking-schema"
import { DRONES } from "@/lib/drones"
import { addNotify } from "@/lib/server/bookings"

export async function POST(req: Request) {
  const parsed = notifySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Enter a valid email" }, { status: 422 })
  }
  if (!DRONES.some((d) => d.slug === parsed.data.drone_slug)) {
    return NextResponse.json({ error: "Unknown drone" }, { status: 404 })
  }
  try {
    await addNotify(parsed.data.email, parsed.data.drone_slug)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("[notify]", e)
    return NextResponse.json({ error: "Could not save that right now. Try again shortly." }, { status: 500 })
  }
}
