import { z } from "zod"
import { FULL_DAY, hoursFrom } from "./site"

export const EVENT_TYPES = [
  "Wedding",
  "Birthday",
  "Concert",
  "Church programme",
  "Corporate launch",
  "Real estate",
  "Sports",
  "Other",
] as const


export const DELIVERABLES = [
  { id: "photos", label: "Photos" },
  { id: "edited_video", label: "Edited video" },
  { id: "raw_footage", label: "Raw footage" },
  { id: "live_feed", label: "Live feed to screen" },
  { id: "social_reel", label: "Social media reel" },
] as const

export const SETTINGS = [
  { id: "outdoor", label: "Outdoor" },
  { id: "indoor", label: "Indoor" },
  { id: "both", label: "Both" },
] as const


export const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT Abuja", "Gombe", "Imo",
  "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa",
  "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe",
  "Zamfara",
] as const


const phone = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s()]/g, ""))
  .refine((v) => /^\+?\d{10,15}$/.test(v), "Enter a valid phone number")

function todayISO() {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export const detailsSchema = z.object({
  full_name: z.string().trim().min(2, "Tell us your full name").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  phone,
  whatsapp_same: z.boolean(),
  whatsapp: z.string().trim().optional(),
})

export const eventSchema = z.object({
  event_type: z.string().min(1, "Choose the type of event"),
  event_date: z
    .string()
    .min(1, "Pick the event date")
    .refine((v) => v >= todayISO(), "The date cannot be in the past"),
  start_time: z.string().min(1, "Pick a start time"),
  duration: z
    .string()
    .min(1, "Choose full day or by the hour")
    .refine((v) => v === FULL_DAY || (hoursFrom(v) ?? 0) >= 1, "Choose full day or by the hour"),
  custom_duration: z.string().trim().max(80).optional(),
  venue_name: z.string().trim().min(2, "Enter the venue name").max(160),
  address: z.string().trim().min(5, "Enter the full address").max(300),
  city: z.string().trim().min(2, "Enter the city").max(80),
  state: z.string().min(1, "Choose the state"),
  setting: z.enum(["indoor", "outdoor", "both"], { message: "Indoor or outdoor?" }),
})

export const needsSchema = z.object({
  drone_slug: z.string().min(1, "Choose a drone"),
  deliverables: z.array(z.string()).min(1, "Pick at least one thing you want from us"),
  /** "yes" = they bring their own pilot, "no" = match them with an Astro_Fly pilot (extra fee) */
  has_pilot: z.enum(["yes", "no"], { message: "Tell us if you have your own pilot" }),
  notes: z.string().trim().max(2000).optional(),
})

export const reviewSchema = z.object({
  pay_option: z.enum(["deposit", "later"]),
  terms: z.boolean().refine((v) => v === true, "Please accept the booking terms"),
})

export const bookingSchema = detailsSchema
  .extend(eventSchema.shape)
  .extend(needsSchema.shape)
  .extend(reviewSchema.shape)
  .superRefine((v, ctx) => {
    if (!v.whatsapp_same) {
      const w = (v.whatsapp || "").replace(/[\s()]/g, "")
      if (!/^\+?\d{10,15}$/.test(w)) {
        ctx.addIssue({ code: "custom", path: ["whatsapp"], message: "Enter a valid WhatsApp number" })
      }
    }
    if (v.duration === "Custom" && !v.custom_duration?.trim()) {
      ctx.addIssue({ code: "custom", path: ["custom_duration"], message: "Tell us how long you need" })
    }
  })

export type BookingInput = z.input<typeof bookingSchema>
export type BookingData = z.output<typeof bookingSchema>

export const STEP_FIELDS = [
  ["full_name", "email", "phone", "whatsapp_same", "whatsapp"],
  [
    "event_type",
    "event_date",
    "start_time",
    "duration",
    "custom_duration",
    "venue_name",
    "address",
    "city",
    "state",
    "setting",
  ],
  ["drone_slug", "deliverables", "has_pilot", "notes"],
  ["pay_option", "terms"],
] as const

export const lookupSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter the email you booked with"),
  reference: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^AF\d{4}[A-Z0-9]{4}$/, "References look like AF2026K7Q2"),
})

export const notifySchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  drone_slug: z.string().min(1),
})

/** Per step schemas used by the form. Each carries its own cross field checks. */
export const stepSchemas = [
  detailsSchema.superRefine((v, ctx) => {
    if (!v.whatsapp_same) {
      const w = (v.whatsapp || "").replace(/[\s()]/g, "")
      if (!/^\+?\d{10,15}$/.test(w)) {
        ctx.addIssue({ code: "custom", path: ["whatsapp"], message: "Enter a valid WhatsApp number" })
      }
    }
  }),
  eventSchema.superRefine((v, ctx) => {
    if (v.duration === "Custom" && !v.custom_duration?.trim()) {
      ctx.addIssue({ code: "custom", path: ["custom_duration"], message: "Tell us how long you need" })
    }
  }),
  needsSchema,
  reviewSchema,
] as const
