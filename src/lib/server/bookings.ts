import "server-only"
import { randomInt, randomUUID } from "node:crypto"
import type { BookingData } from "@/lib/booking-schema"
import { DRONES } from "@/lib/drones"
import type { Booking, BookingEvent, BookingStatus } from "@/lib/types"
import { mockDB } from "./mock-store"
import { getPricing } from "./settings"
import { supabaseAdmin, T } from "./supabase"

const REF_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

export function newReference() {
  let tail = ""
  for (let i = 0; i < 4; i++) tail += REF_ALPHABET[randomInt(REF_ALPHABET.length)]
  return `AF${new Date().getFullYear()}${tail}`
}

function droneName(slug: string) {
  return DRONES.find((d) => d.slug === slug)?.name ?? slug
}

export async function createBooking(input: BookingData): Promise<Booking> {
  const sb = supabaseAdmin()
  const now = new Date().toISOString()
  const id = randomUUID()

  const row: Omit<Booking, "reference"> = {
    id,
    status: "pending",
    full_name: input.full_name,
    email: input.email,
    phone: input.phone,
    whatsapp: input.whatsapp_same ? input.phone : (input.whatsapp || "").replace(/[\s()]/g, ""),
    event_type: input.event_type,
    event_date: input.event_date,
    start_time: input.start_time,
    duration: input.duration,
    custom_duration: input.duration === "Custom" ? input.custom_duration || null : null,
    venue_name: input.venue_name,
    address: input.address,
    city: input.city,
    state: input.state,
    setting: input.setting,
    guests: "", // no longer asked; column kept for older bookings
    drone_slug: input.drone_slug,
    drone_name: droneName(input.drone_slug),
    deliverables: input.deliverables,
    needs_pilot: input.has_pilot === "no",
    pilot_fee: input.has_pilot === "no" ? (await getPricing()).pilotFeeNaira : 0,
    pilot_name: null,
    pilot_phone: null,
    notes: input.notes || null,
    pay_option: input.pay_option,
    price: null,
    amount_paid: 0,
    payment_reference: null,
    admin_note: null,
    created_at: now,
    updated_at: now,
  }

  if (!sb) {
    const db = mockDB()
    let reference = newReference()
    while (db.bookings.some((b) => b.reference === reference)) reference = newReference()
    const booking = { ...row, reference }
    db.bookings.unshift(booking)
    db.events.push({ id: randomUUID(), booking_id: id, status: "pending", note: "Booking received", created_at: now })
    return booking
  }

  // Retry on the rare reference collision (unique constraint).
  for (let attempt = 0; attempt < 5; attempt++) {
    const reference = newReference()
    const { data, error } = await sb.from(T.bookings).insert({ ...row, reference }).select().single()
    if (!error) {
      await sb.from(T.events).insert({ booking_id: id, status: "pending", note: "Booking received" })
      return data as Booking
    }
    if (error.code !== "23505") throw new Error(error.message)
  }
  throw new Error("Could not create a unique booking reference")
}

export async function getBookingByReference(reference: string): Promise<Booking | null> {
  const sb = supabaseAdmin()
  if (!sb) return mockDB().bookings.find((b) => b.reference === reference) ?? null
  const { data } = await sb.from(T.bookings).select("*").eq("reference", reference).maybeSingle()
  return (data as Booking) ?? null
}

export async function getBookingById(id: string): Promise<Booking | null> {
  const sb = supabaseAdmin()
  if (!sb) return mockDB().bookings.find((b) => b.id === id) ?? null
  const { data } = await sb.from(T.bookings).select("*").eq("id", id).maybeSingle()
  return (data as Booking) ?? null
}

export async function lookupBooking(reference: string, email: string) {
  const b = await getBookingByReference(reference)
  if (!b || b.email.toLowerCase() !== email.toLowerCase()) return null
  return { booking: b, events: await listEvents(b.id) }
}

export async function listEvents(bookingId: string): Promise<BookingEvent[]> {
  const sb = supabaseAdmin()
  if (!sb) {
    return mockDB()
      .events.filter((e) => e.booking_id === bookingId)
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
  }
  const { data } = await sb
    .from(T.events)
    .select("*")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: true })
  return (data as BookingEvent[]) ?? []
}

export async function listBookings(): Promise<Booking[]> {
  const sb = supabaseAdmin()
  if (!sb) return [...mockDB().bookings]
  const { data, error } = await sb.from(T.bookings).select("*").order("created_at", { ascending: false }).limit(500)
  if (error) throw new Error(error.message)
  return (data as Booking[]) ?? []
}

export interface BookingPatch {
  status?: BookingStatus
  price?: number | null
  admin_note?: string | null
  pilot_name?: string | null
  pilot_phone?: string | null
}

export async function updateBooking(id: string, patch: BookingPatch, note?: string) {
  const sb = supabaseAdmin()
  const now = new Date().toISOString()
  const prev = await getBookingById(id)
  if (!prev) return null
  const statusChanged = patch.status && patch.status !== prev.status

  if (!sb) {
    const db = mockDB()
    const b = db.bookings.find((x) => x.id === id)!
    Object.assign(b, patch, { updated_at: now })
    if (statusChanged) {
      db.events.push({ id: randomUUID(), booking_id: id, status: patch.status!, note: note || null, created_at: now })
    }
    return { booking: { ...b }, statusChanged: Boolean(statusChanged), previous: prev }
  }

  const { data, error } = await sb
    .from(T.bookings)
    .update({ ...patch, updated_at: now })
    .eq("id", id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  if (statusChanged) {
    await sb.from(T.events).insert({ booking_id: id, status: patch.status, note: note || null })
  }
  return { booking: data as Booking, statusChanged: Boolean(statusChanged), previous: prev }
}

/**
 * Records a successful payment. Idempotent per Paystack reference.
 * Full payment (or more) moves the booking to "paid". A deposit on a pending
 * booking confirms the date.
 */
export async function recordPayment(reference: string, amountNaira: number, paystackRef: string, method = "online") {
  const b = await getBookingByReference(reference)
  if (!b) return null
  const refs = (b.payment_reference || "").split(",").filter(Boolean)
  if (refs.includes(paystackRef)) return { booking: b, alreadyRecorded: true }

  const amount_paid = b.amount_paid + amountNaira
  let status: BookingStatus = b.status
  if (b.price && amount_paid >= b.price && b.status !== "completed") status = "paid"
  else if (b.status === "pending") status = "confirmed"

  const how = method === "bank" ? " by bank transfer" : ""
  const note =
    status === "paid" && b.price && amount_paid >= b.price
      ? `Payment of NGN ${amountNaira.toLocaleString("en-NG")} received${how}. Paid in full`
      : `Payment of NGN ${amountNaira.toLocaleString("en-NG")} received${how}`
  const sb = supabaseAdmin()
  const now = new Date().toISOString()
  const payment_reference = [...refs, paystackRef].join(",")

  if (!sb) {
    const db = mockDB()
    const row = db.bookings.find((x) => x.id === b.id)!
    Object.assign(row, { amount_paid, status, payment_reference, updated_at: now })
    db.events.push({ id: randomUUID(), booking_id: b.id, status, note, created_at: now })
    return { booking: { ...row }, alreadyRecorded: false }
  }
  const { data, error } = await sb
    .from(T.bookings)
    .update({ amount_paid, status, payment_reference, updated_at: now })
    .eq("id", b.id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  await sb.from(T.events).insert({ booking_id: b.id, status, note })
  return { booking: data as Booking, alreadyRecorded: false }
}

/** Adds a note to the booking history without changing its status. */
export async function addNote(bookingId: string, status: BookingStatus, note: string) {
  const sb = supabaseAdmin()
  if (!sb) {
    mockDB().events.push({ id: randomUUID(), booking_id: bookingId, status, note, created_at: new Date().toISOString() })
    return
  }
  await sb.from(T.events).insert({ booking_id: bookingId, status, note })
}

export async function addNotify(email: string, droneSlug: string) {
  const sb = supabaseAdmin()
  if (!sb) {
    const db = mockDB()
    if (!db.notify.some((n) => n.email === email && n.drone_slug === droneSlug)) {
      db.notify.push({ email, drone_slug: droneSlug, created_at: new Date().toISOString() })
    }
    return
  }
  const { error } = await sb
    .from(T.notify)
    .upsert({ email, drone_slug: droneSlug }, { onConflict: "email,drone_slug", ignoreDuplicates: true })
  if (error) throw new Error(error.message)
}
