import { NextResponse } from "next/server"
import { getPricing } from "@/lib/server/settings"

/** Public prices, so pages that were already open pick up changes made in the dashboard. */
export async function GET() {
  return NextResponse.json({ pricing: await getPricing() })
}
