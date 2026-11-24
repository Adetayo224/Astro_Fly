import { NextResponse } from "next/server"
import { z } from "zod"
import { requireAdmin } from "@/lib/server/admin-auth"
import { countSubscriptions, pushToTeam, removeSubscription, saveSubscription } from "@/lib/server/push"

const subSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string().min(1), auth: z.string().min(1) }),
})

/** Turn on alerts for this device. With { test: true }, sends a test alert to my devices instead. */
export async function POST(req: Request) {
  const me = await requireAdmin(req)
  if (!me) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  const body = (await req.json().catch(() => null)) as { test?: boolean; subscription?: unknown } | null
  if (body?.test) {
    const { sent } = await pushToTeam(
      { title: "Astro_Fly alerts are on", body: "You will get an alert like this when a new booking comes in.", url: "/admin", tag: "test" },
      [me.email],
    )
    return NextResponse.json({ sent })
  }
  const parsed = subSchema.safeParse(body?.subscription)
  if (!parsed.success) return NextResponse.json({ error: "Invalid subscription" }, { status: 422 })
  try {
    await saveSubscription(me.email, parsed.data, req.headers.get("user-agent"))
  } catch {
    return NextResponse.json({ error: "Could not turn on alerts for this account" }, { status: 400 })
  }
  return NextResponse.json({ devices: await countSubscriptions(me.email) })
}

export async function DELETE(req: Request) {
  const me = await requireAdmin(req)
  if (!me) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  const endpoint = new URL(req.url).searchParams.get("endpoint") || ""
  if (endpoint) await removeSubscription(me.email, endpoint)
  return NextResponse.json({ devices: await countSubscriptions(me.email) })
}
