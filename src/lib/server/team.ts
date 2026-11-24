import "server-only"
import type { AdminUser, TeamRole } from "./admin-auth"
import { mockDB } from "./mock-store"
import { supabaseAdmin, T } from "./supabase"

export interface TeamMember {
  email: string
  role: TeamRole
  invited_by: string | null
  created_at: string
  status?: "active" | "invited"
}

export async function listTeam(): Promise<TeamMember[]> {
  const sb = supabaseAdmin()
  if (!sb) return mockDB().team.map((m) => ({ ...m, status: "active" }))
  const { data, error } = await sb.from(T.team).select("*").order("created_at", { ascending: true })
  if (error) throw new Error(error.message)
  // Mark people who have not finished setting a password yet
  const { data: users } = await sb.auth.admin.listUsers({ perPage: 1000 })
  const byEmail = new Map((users?.users ?? []).map((u) => [u.email?.toLowerCase(), u]))
  return (data as TeamMember[]).map((m) => {
    const u = byEmail.get(m.email)
    return { ...m, status: u?.last_sign_in_at ? "active" : "invited" }
  })
}

export type InviteResult = "invited" | "existing_account" | "already_member"

/**
 * Gives someone access to the Astro_Fly dashboard.
 * New people get an invite email (sent by Supabase through the project's SMTP) with a link
 * to set their own password. People who already have an account in this Supabase project
 * (for example from another Samfred app) simply get access and sign in with their password.
 */
export async function inviteMember(email: string, role: TeamRole, by: AdminUser, redirectTo: string): Promise<InviteResult> {
  email = email.trim().toLowerCase()
  const sb = supabaseAdmin()
  if (!sb) {
    const db = mockDB()
    if (db.team.some((m) => m.email === email)) return "already_member"
    db.team.push({ email, role, invited_by: by.email, created_at: new Date().toISOString() })
    return "invited"
  }
  const { data: existing } = await sb.from(T.team).select("email").eq("email", email).maybeSingle()
  if (existing) return "already_member"

  const { data: users } = await sb.auth.admin.listUsers({ perPage: 1000 })
  const hasAccount = (users?.users ?? []).some((u) => u.email?.toLowerCase() === email)

  if (!hasAccount) {
    const { error } = await sb.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: { astrofly_team: true },
    })
    if (error) throw new Error(error.message)
  }
  const { error } = await sb.from(T.team).insert({ email, role, invited_by: by.email })
  if (error) throw new Error(error.message)
  return hasAccount ? "existing_account" : "invited"
}

/** Removes dashboard access only. The person's login (which other Samfred apps may use) is kept. */
export async function removeMember(email: string, by: AdminUser) {
  email = email.trim().toLowerCase()
  if (email === by.email) throw new Error("You cannot remove yourself")
  const all = await listTeam()
  const target = all.find((m) => m.email === email)
  if (!target) throw new Error("That person is not on the team")
  if (target.role === "owner" && all.filter((m) => m.role === "owner").length <= 1) {
    throw new Error("Keep at least one owner on the team")
  }
  const sb = supabaseAdmin()
  if (!sb) {
    const db = mockDB()
    db.team = db.team.filter((m) => m.email !== email)
    return
  }
  const { error } = await sb.from(T.team).delete().eq("email", email)
  if (error) throw new Error(error.message)
}
