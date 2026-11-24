"use client"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let client: SupabaseClient | null = null

export const supabaseConfigured = Boolean(url && anon)

export function supabaseBrowser(): SupabaseClient | null {
  if (!supabaseConfigured) return null
  if (!client) client = createClient(url!, anon!)
  return client
}
