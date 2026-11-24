import { NextResponse, type NextRequest } from "next/server"
import { MOCK_ADMIN_TOKEN } from "@/lib/server/admin-auth"
import { hasSupabase } from "@/lib/server/env"
import { mockDB } from "@/lib/server/mock-store"

/** Mock mode only: serves flyers kept in memory. Real flyers use Supabase signed URLs. */
export async function GET(req: NextRequest, ctx: RouteContext<"/api/admin/flyer/[id]">) {
  if (hasSupabase || req.nextUrl.searchParams.get("token") !== MOCK_ADMIN_TOKEN) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  const { id } = await ctx.params
  const f = mockDB().flyers.get(id)
  if (!f) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return new NextResponse(new Uint8Array(f.data), {
    headers: { "Content-Type": f.type, "Content-Disposition": `inline; filename="${f.name.replace(/"/g, "")}"` },
  })
}
