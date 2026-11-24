import "server-only"
import { cacheLife, cacheTag } from "next/cache"
import { DRONES } from "@/lib/drones"
import type { Drone } from "@/lib/types"
import { supabaseAdmin, T } from "./supabase"

/** Drone catalogue from Supabase, falling back to the local seed when keys are missing. */
export async function getDrones(): Promise<Drone[]> {
  "use cache"
  cacheLife("minutes")
  cacheTag("drones")
  const sb = supabaseAdmin()
  if (!sb) return DRONES
  const { data, error } = await sb.from(T.drones).select("*").order("sort_order", { ascending: true })
  if (error || !data?.length) return DRONES
  return data as Drone[]
}

export async function getDrone(slug: string): Promise<Drone | null> {
  const all = await getDrones()
  return all.find((d) => d.slug === slug) ?? null
}
