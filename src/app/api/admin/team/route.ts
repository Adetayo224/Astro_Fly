import { NextResponse } from "next/server"
import { z } from "zod"
import { site } from "@/lib/site"
import { requireAdmin } from "@/lib/server/admin-auth"
import { inviteMember, listTeam, removeMember } from "@/lib/server/team"

export async function GET(req: Request) {
  const me = await requireAdmin(req)
  if (!me) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  return NextResponse.json({ team: await listTeam(), me })
}

const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  role: z.enum(["owner", "admin"]).default("admin"),
})

export async function POST(req: Request) {
  const me = await requireAdmin(req)
  if (!me) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  if (me.role !== "owner") return NextResponse.json({ error: "Only owners can invite people" }, { status: 403 })
  const parsed = inviteSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 422 })
  const origin = req.headers.get("origin") || site.url
  try {
    const result = await inviteMember(parsed.data.email, parsed.data.role, me, `${origin}/admin/accept`)
    return NextResponse.json({ result, team: await listTeam() })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Invite failed" }, { status: 400 })
  }
}

export async function DELETE(req: Request) {
  const me = await requireAdmin(req)
  if (!me) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  if (me.role !== "owner") return NextResponse.json({ error: "Only owners can remove people" }, { status: 403 })
  const email = new URL(req.url).searchParams.get("email") || ""
  try {
    await removeMember(email, me)
    return NextResponse.json({ team: await listTeam() })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Could not remove" }, { status: 400 })
  }
}
