import "server-only"

export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  supabaseAnon: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  supabaseService: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  resendKey: process.env.RESEND_API_KEY || "",
  emailFrom: process.env.EMAIL_FROM || "Astro_Fly <bookings@astrofly.ng>",
  teamEmail: process.env.TEAM_EMAIL || "",
  paystackSecret: process.env.PAYSTACK_SECRET_KEY || "",
  adminEmails: (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
}

export const hasSupabase = Boolean(env.supabaseUrl && env.supabaseService)
export const hasResend = Boolean(env.resendKey)
export const hasPaystack = Boolean(env.paystackSecret)
