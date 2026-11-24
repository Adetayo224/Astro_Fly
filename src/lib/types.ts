export type DroneStatus = "available" | "coming_soon"

export type DroneCategory = "compact" | "pro" | "cinema" | "fpv" | "selfie"

export interface Drone {
  id: string
  slug: string
  name: string
  tagline: string
  description: string
  status: DroneStatus
  category: DroneCategory
  image: string
  weight: string
  flight_time: string
  camera: string
  video: string
  range: string
  sensing: string
  best_for: string[]
  sort_order: number
}

export const BOOKING_STATUSES = ["pending", "confirmed", "paid", "completed", "cancelled"] as const
export type BookingStatus = (typeof BOOKING_STATUSES)[number]

export interface Booking {
  id: string
  reference: string
  status: BookingStatus
  full_name: string
  email: string
  phone: string
  whatsapp: string
  event_type: string
  event_date: string // yyyy mm dd stored as ISO date
  start_time: string
  duration: string
  custom_duration: string | null
  venue_name: string
  address: string
  city: string
  state: string
  setting: "indoor" | "outdoor" | "both"
  guests: string
  drone_slug: string
  drone_name: string
  deliverables: string[]
  /** True when we match them with an Astro_Fly pilot */
  needs_pilot: boolean
  pilot_fee: number
  /** Filled in by the team once a pilot is matched */
  pilot_name: string | null
  pilot_phone: string | null
  notes: string | null
  pay_option: "deposit" | "later"
  price: number | null
  amount_paid: number
  payment_reference: string | null
  admin_note: string | null
  created_at: string
  updated_at: string
}

export interface BookingEvent {
  id: string
  booking_id: string
  status: BookingStatus
  note: string | null
  created_at: string
}

export const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: "Pending review",
  confirmed: "Confirmed",
  paid: "Paid",
  completed: "Completed",
  cancelled: "Cancelled",
}
