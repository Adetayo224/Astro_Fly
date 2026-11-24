import "server-only"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { env, hasSupabase } from "./env"

let admin: SupabaseClient | null = null

/** Service role client. Server only. Bypasses RLS, so every route using it checks access itself. */
export function supabaseAdmin(): SupabaseClient | null {
  if (!hasSupabase) return null
  if (!admin) {
    admin = createClient(env.supabaseUrl, env.supabaseService, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return admin
}

/** All Astro_Fly objects are prefixed because the database is shared with other Samfred apps. */
export const T = {
  drones: "astrofly_drones",
  bookings: "astrofly_bookings",
  events: "astrofly_booking_events",
  notify: "astrofly_notify_me",
  team: "astrofly_team",
} as const

export const FLYER_BUCKET = "astrofly-flyers"
