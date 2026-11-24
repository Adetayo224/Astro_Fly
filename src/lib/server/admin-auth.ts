import "server-only"
import { env, hasSupabase } from "./env"
import { supabaseAdmin, T } from "./supabase"

export const MOCK_ADMIN_TOKEN = "mock-admin"

export type TeamRole = "owner" | "admin"
export interface AdminUser {
  email: string
  role: TeamRole
}

/**
 * Checks the bearer token on admin API calls.
 * With Supabase: the token must be a valid Supabase session whose email is in the
 * astrofly_team table (or in ADMIN_EMAILS, treated as owners).
 * Without Supabase (mock mode, local only): accepts the demo token.
 */
export async function requireAdmin(req: Request): Promise<AdminUser | null> {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
  if (!token) return null
  if (!hasSupabase) {
    const allowed = process.env.NODE_ENV !== "production" || process.env.ALLOW_DEMO_ADMIN === "true"
    return token === MOCK_ADMIN_TOKEN && allowed ? { email: "demo@admin", role: "owner" } : null
  }
  const sb = supabaseAdmin()!
  const { data, error } = await sb.auth.getUser(token)
  if (error || !data.user?.email) return null
  const email = data.user.email.toLowerCase()
  if (env.adminEmails.includes(email)) return { email, role: "owner" }
  const { data: row } = await sb.from(T.team).select("email, role").eq("email", email).maybeSingle()
  return row ? { email, role: row.role as TeamRole } : null
}
