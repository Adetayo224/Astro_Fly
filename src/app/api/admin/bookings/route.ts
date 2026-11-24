import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/server/admin-auth"
import { listBookings } from "@/lib/server/bookings"

export async function GET(req: Request) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  return NextResponse.json({ bookings: await listBookings() })
}
