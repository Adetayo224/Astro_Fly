import { NextResponse } from "next/server"
import { z } from "zod"
import { requireAdmin } from "@/lib/server/admin-auth"
import { countSubscriptions, hasPush } from "@/lib/server/push"
import { getPricing, updatePricing } from "@/lib/server/settings"
import { supabaseAdmin, T } from "@/lib/server/supabase"

async function myNotify(email: string) {
  const sb = supabaseAdmin()
  if (!sb) return true
  const { data } = await sb.from(T.team).select("notify_email").eq("email", email).maybeSingle()
  return data?.notify_email ?? false
}

async function payload(email: string) {
  const [pricing, notifyEmail, devices] = await Promise.all([getPricing(), myNotify(email), countSubscriptions(email)])
  return { pricing, notifyEmail, push: { available: hasPush, devices } }
}

export async function GET(req: Request) {
  const me = await requireAdmin(req)
  if (!me) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  return NextResponse.json(await payload(me.email))
}

const naira = z.number().int("Use whole naira").min(0, "Cannot be below zero").max(10_000_000, "That is too high")
const schema = z.object({
  pricing: z
    .object({
      depositNaira: naira,
      pilotFeeNaira: naira,
      fullDayNaira: naira,
      hourlyNaira: naira,
      minHours: z.number().int().min(1, "At least 1 hour").max(24, "At most 24 hours"),
    })
    .optional(),
  notifyEmail: z.boolean().optional(),
})

export async function PATCH(req: Request) {
  const me = await requireAdmin(req)
  if (!me) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 422 })
  const { pricing, notifyEmail } = parsed.data
  try {
    if (pricing) await updatePricing(pricing, me.email)
    if (notifyEmail !== undefined) {
      const sb = supabaseAdmin()
      if (sb) {
        const { error } = await sb.from(T.team).update({ notify_email: notifyEmail }).eq("email", me.email)
        if (error) throw new Error(error.message)
      }
    }
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Could not save" }, { status: 500 })
  }
  return NextResponse.json(await payload(me.email))
}
