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
}
export const DEFAULT_PRICING: Pricing = { depositNaira: site.depositNaira, pilotFeeNaira: site.pilotFeeNaira }

/** What the customer pays to hold the date: the deposit plus the pilot fee if we provide the pilot. */
export function upfrontNaira(needsPilot: boolean, pricing: Pricing = DEFAULT_PRICING) {
  return pricing.depositNaira + (needsPilot ? pricing.pilotFeeNaira : 0)
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
