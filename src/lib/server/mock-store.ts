import "server-only"
import type { Booking, BookingEvent } from "@/lib/types"

/**
 * In memory store used when Supabase keys are missing, so the full flow can be
 * tried locally. Data lives until the dev server restarts.
 */
interface MockDB {
  bookings: Booking[]
  events: BookingEvent[]
  notify: { email: string; drone_slug: string; created_at: string }[]
  flyers: Map<string, { name: string; type: string; data: Buffer }>
  team: { email: string; role: "owner" | "admin"; invited_by: string | null; created_at: string }[]
}

const g = globalThis as unknown as { __astroMock?: MockDB }

function daysFromNow(n: number) {
  const d = new Date(Date.now() + n * 86400000)
  return d.toISOString().slice(0, 10)
}

function seed(): MockDB {
  const now = new Date().toISOString()
  const base = {
    custom_duration: null,
    has_flyer: false,
    flyer_path: null,
    flyer_name: null,
    design_flyer: false,
    flyer_details: null,
    notes: null,
    amount_paid: 0,
    payment_reference: null,
    admin_note: null,
    created_at: now,
    updated_at: now,
  }
  const bookings: Booking[] = [
    {
      ...base,
      id: "demo-1",
      reference: "AF2026DEMO",
      status: "pending",
      full_name: "Demo Customer",
      email: "demo@example.com",
      phone: "+2348000000000",
      whatsapp: "+2348000000000",
      event_type: "Wedding",
      event_date: daysFromNow(21),
      start_time: "11:00",
      duration: "Half day",
      venue_name: "Demo Event Centre",
      address: "12 Example Road",
      city: "Ogbomoso",
      state: "Oyo",
      setting: "outdoor",
      guests: "150 to 300",
      drone_slug: "dji-mini-4k",
      drone_name: "DJI Mini 4K",
      deliverables: ["photos", "edited_video"],
      design_flyer: true,
      flyer_details: "Demo flyer request. Names, date and venue.",
      pay_option: "later",
      price: null,
    },
    {
      ...base,
      id: "demo-2",
      reference: "AF2026TEST",
      status: "confirmed",
      full_name: "Sample Booking",
      email: "sample@example.com",
      phone: "+2348000000001",
      whatsapp: "+2348000000001",
      event_type: "Corporate launch",
      event_date: daysFromNow(9),
      start_time: "16:00",
      duration: "3 hours",
      venue_name: "Sample Hall",
      address: "4 Sample Close",
      city: "Ibadan",
      state: "Oyo",
      setting: "both",
      guests: "50 to 150",
      drone_slug: "dji-lito-1",
      drone_name: "DJI Lito 1",
      deliverables: ["edited_video", "social_reel", "live_feed"],
      pay_option: "deposit",
      price: 180000,
      amount_paid: 20000,
      payment_reference: "MOCK_DEMO",
    },
  ]
  const events: BookingEvent[] = bookings.map((b) => ({
    id: `ev-${b.id}`,
    booking_id: b.id,
    status: b.status,
    note: "Demo data",
    created_at: now,
  }))
  const team = [{ email: "demo@admin", role: "owner" as const, invited_by: "setup", created_at: now }]
  return { bookings, events, notify: [], flyers: new Map(), team }
}

export function mockDB(): MockDB {
  if (!g.__astroMock) g.__astroMock = seed()
  return g.__astroMock
}
