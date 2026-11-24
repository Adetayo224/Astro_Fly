import { NextResponse } from "next/server"
import { z } from "zod"
import { requireAdmin } from "@/lib/server/admin-auth"
import { getBookingById, listEvents, recordPayment } from "@/lib/server/bookings"
import { sendPaymentEmail } from "@/lib/server/email"

const schema = z.object({ amount: z.number().int().min(1).max(100_000_000), notify: z.boolean().default(true) })

/** Records a bank transfer the team has confirmed, and emails the customer a receipt. */
export async function POST(req: Request, ctx: RouteContext<"/api/admin/bookings/[id]/payment">) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  const { id } = await ctx.params
  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Enter the amount received" }, { status: 422 })
  const booking = await getBookingById(id)
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const ref = `BANK_${Date.now()}`
  const result = await recordPayment(booking.reference, parsed.data.amount, ref, "bank")
  if (!result) return NextResponse.json({ error: "Could not record payment" }, { status: 500 })
  let emailed = false
  if (parsed.data.notify) {
    await sendPaymentEmail(result.booking, parsed.data.amount, "Bank transfer")
    emailed = true
  }
  return NextResponse.json({ booking: result.booking, events: await listEvents(id), emailed })
}
