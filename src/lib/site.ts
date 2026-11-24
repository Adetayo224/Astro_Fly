export const site = {
  name: "Astro_Fly",
  byline: "by Samfred Robotics",
  company: "Samfred Robotics Ltd",
  description:
    "Book a drone and pilot for your wedding, birthday, concert, church programme or launch in Nigeria. Pick a drone, tell us about your day, and we handle the shots from above.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  /** WhatsApp chat line (0906 958 3537) in international format for wa.me links */
  whatsapp: "2349069583537",
  whatsappDisplay: "0906 958 3537",
  /** Phone line for calls */
  phone: "2348029891863",
  phoneDisplay: "0802 989 1863",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "orders@samfredrobotics.com",
  /** Customers pay by bank transfer; the team confirms each payment by email. */
  bank: {
    name: "Fidelity Bank",
    accountNumber: "6060500990",
    accountName: "Samfred Robotics LTD",
  },
  address: ["New Sawmill Area, Pakiotan Estate", "Ogbomoso, Oyo State, Nigeria"],
  /** Paid to hold the date */
  depositNaira: Number(process.env.NEXT_PUBLIC_DEPOSIT_NGN || 20000),
  /** Added when the customer asks us to match them with a pilot */
  pilotFeeNaira: Number(process.env.NEXT_PUBLIC_PILOT_FEE_NGN || 10000),
  /** Attribution for a CC BY 3D model in public/models, shown in the footer when set. */
  modelCredit: process.env.NEXT_PUBLIC_MODEL_CREDIT || "",
} as const

/** Prices the team can change in the dashboard (Settings). The env values are only the defaults. */
export interface Pricing {
  depositNaira: number
  pilotFeeNaira: number
  /** Whole event, any length */
  fullDayNaira: number
  /** Per hour when they do not book the full day */
  hourlyNaira: number
  /** Hourly bookings are charged for at least this many hours */
  minHours: number
}
export const DEFAULT_PRICING: Pricing = {
  depositNaira: site.depositNaira,
  pilotFeeNaira: site.pilotFeeNaira,
  fullDayNaira: 50000,
  hourlyNaira: 5000,
  minHours: 4,
}

export const FULL_DAY = "Full day"
export const MAX_HOURS = 12

/** "3 hours" -> 3, "Full day" -> null */
export function hoursFrom(duration: string): number | null {
  const m = /^(\d{1,2}) hours?$/.exec(duration.trim())
  return m ? Number(m[1]) : null
}
export const hoursLabel = (h: number) => `${h} hour${h === 1 ? "" : "s"}`

/** Shoot price before any pilot fee. Hourly bookings pay for at least minHours and never more than a full day. */
export function shootPrice(duration: string, p: Pricing): number | null {
  if (duration === FULL_DAY) return p.fullDayNaira
  const h = hoursFrom(duration)
  if (!h) return null
  return Math.min(Math.max(h, p.minHours) * p.hourlyNaira, p.fullDayNaira)
}

/** Full price of a booking: the shoot plus the pilot fee when we provide the pilot. */
export function bookingTotal(duration: string, needsPilot: boolean, p: Pricing): number | null {
  const shoot = shootPrice(duration, p)
  return shoot === null ? null : shoot + (needsPilot ? p.pilotFeeNaira : 0)
}

/** What the customer pays to hold the date: the deposit plus the pilot fee if we provide the pilot, capped at the total. */
export function upfrontNaira(needsPilot: boolean, pricing: Pricing = DEFAULT_PRICING, total?: number | null) {
  const due = pricing.depositNaira + (needsPilot ? pricing.pilotFeeNaira : 0)
  return total ? Math.min(due, total) : due
}

export function whatsappLink(message?: string) {
  const base = `https://wa.me/${site.whatsapp}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}

export function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount)
}
