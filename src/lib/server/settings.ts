import "server-only"
import { cacheLife, cacheTag, revalidateTag } from "next/cache"
import { DEFAULT_PRICING, type Pricing } from "@/lib/site"
import { supabaseAdmin } from "./supabase"

const TABLE = "astrofly_settings"
let mockPricing: Pricing | null = null

/** Current prices. Cached and refreshed straight away when the team saves new ones. */
export async function getPricing(): Promise<Pricing> {
  "use cache"
  cacheLife("hours")
  cacheTag("pricing")
  const sb = supabaseAdmin()
  if (!sb) return mockPricing ?? DEFAULT_PRICING
  const { data } = await sb.from(TABLE).select("deposit_ngn, pilot_fee_ngn, full_day_ngn, hourly_ngn, min_hours").eq("id", 1).maybeSingle()
  if (!data) return DEFAULT_PRICING
  return {
    depositNaira: data.deposit_ngn,
    pilotFeeNaira: data.pilot_fee_ngn,
    fullDayNaira: data.full_day_ngn,
    hourlyNaira: data.hourly_ngn,
    minHours: data.min_hours,
  }
}

export async function updatePricing(p: Pricing, by: string): Promise<Pricing> {
  const sb = supabaseAdmin()
  if (!sb) {
    mockPricing = p
  } else {
    const { error } = await sb
      .from(TABLE)
      .upsert({
        id: 1,
        deposit_ngn: p.depositNaira,
        pilot_fee_ngn: p.pilotFeeNaira,
        full_day_ngn: p.fullDayNaira,
        hourly_ngn: p.hourlyNaira,
        min_hours: p.minHours,
        updated_by: by,
      })
    if (error) throw new Error(error.message)
  }
  revalidateTag("pricing", { expire: 0 })
  return p
}
