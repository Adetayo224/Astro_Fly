import { NextResponse } from "next/server"
import { z } from "zod"
import { requireAdmin } from "@/lib/server/admin-auth"
import { addNote, getBookingById, listEvents } from "@/lib/server/bookings"
import { sendCustomEmail } from "@/lib/server/email"

const schema = z.object({
  subject: z.string().trim().min(2, "Add a subject").max(140),
  message: z.string().trim().min(2, "Write a message").max(5000),
})

/** Lets the team write to a customer from the dashboard, in the branded template. */
export async function POST(req: Request, ctx: RouteContext<"/api/admin/bookings/[id]/email">) {
  const me = await requireAdmin(req)
  if (!me) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  const { id } = await ctx.params
  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 422 })
  const booking = await getBookingById(id)
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const sent = await sendCustomEmail(booking, parsed.data.subject, parsed.data.message)
  if (!sent || ("error" in sent && sent.error)) {
    return NextResponse.json({ error: "The email could not be sent. Check RESEND_API_KEY." }, { status: 502 })
  }
  await addNote(booking.id, booking.status, `Email sent: ${parsed.data.subject}`)
  return NextResponse.json({ ok: true, mocked: sent.mocked, events: await listEvents(id) })
}
