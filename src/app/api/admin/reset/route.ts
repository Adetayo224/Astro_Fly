import { NextResponse } from "next/server"
import { env } from "@/lib/server/env"
import { supabaseAdmin, T } from "@/lib/server/supabase"

/**
 * "Forgot password" for the dashboard.
 * Team members who never had a login (for example the first owner) get a set password invite,
 * everyone else gets the normal reset email. The answer is always the same, so the form never
 * reveals who is on the team.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { email?: string }
  const email = body.email?.trim().toLowerCase()
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email" }, { status: 400 })
  }
  const sb = supabaseAdmin()
  if (!sb) return NextResponse.json({ ok: true })

  const redirectTo = `${new URL(req.url).origin}/admin/accept`
  const { data: users } = await sb.auth.admin.listUsers({ perPage: 1000 })
  const hasAccount = (users?.users ?? []).some((u) => u.email?.toLowerCase() === email)

  let error: { message: string } | null = null
  if (hasAccount) {
    ;({ error } = await sb.auth.resetPasswordForEmail(email, { redirectTo }))
  } else {
    const { data: member } = await sb.from(T.team).select("email").eq("email", email).maybeSingle()
    if (member || env.adminEmails.includes(email)) {
      ;({ error } = await sb.auth.admin.inviteUserByEmail(email, { redirectTo, data: { astrofly_team: true } }))
    }
  }
  if (error) {
    console.error("[admin reset]", error.message)
    const busy = /rate|too many|seconds/i.test(error.message)
    return NextResponse.json(
      { error: busy ? "Too many emails were sent. Wait a few minutes and try again." : "Could not send the email. Try again shortly." },
      { status: busy ? 429 : 500 },
    )
  }
  return NextResponse.json({ ok: true })
}
