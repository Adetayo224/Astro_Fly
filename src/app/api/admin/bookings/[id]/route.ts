import { NextResponse } from "next/server"
import { z } from "zod"
import { BOOKING_STATUSES } from "@/lib/types"
import { requireAdmin } from "@/lib/server/admin-auth"
import { flyerUrl, getBookingById, listEvents, updateBooking } from "@/lib/server/bookings"
import { sendStatusEmail } from "@/lib/server/email"

export async function GET(req: Request, ctx: RouteContext<"/api/admin/bookings/[id]">) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  const { id } = await ctx.params
  const booking = await getBookingById(id)
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ booking, events: await listEvents(id), flyerUrl: await flyerUrl(booking) })
}

const patchSchema = z.object({
  status: z.enum(BOOKING_STATUSES).optional(),
  price: z.number().int().min(0).max(100_000_000).nullable().optional(),
  admin_note: z.string().max(2000).nullable().optional(),
  notify: z.boolean().default(true),
  message: z.string().max(1000).nullable().optional(),
})

export async function PATCH(req: Request, ctx: RouteContext<"/api/admin/bookings/[id]">) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  const { id } = await ctx.params
  const parsed = patchSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Invalid update" }, { status: 422 })
  const { notify, message, ...patch } = parsed.data
  const result = await updateBooking(id, patch, message || undefined)
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 })
  let emailed = false
  if (notify && (result.statusChanged || message)) {
    await sendStatusEmail(result.booking, message)
    emailed = true
  }
  return NextResponse.json({ booking: result.booking, events: await listEvents(id), emailed })
}
