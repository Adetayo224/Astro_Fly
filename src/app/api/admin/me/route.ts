import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/server/admin-auth"

export async function GET(req: Request) {
  const me = await requireAdmin(req)
  if (!me) return NextResponse.json({ error: "This account does not have access to Astro_Fly" }, { status: 401 })
  return NextResponse.json(me)
}
