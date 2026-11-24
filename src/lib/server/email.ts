import "server-only"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { render } from "@react-email/components"
import type { ReactElement } from "react"
import nodemailer, { type Transporter } from "nodemailer"
import { Resend } from "resend"
import BookingConfirmationEmail from "@/emails/booking-confirmation"
import CustomMessageEmail from "@/emails/custom-message"
import PaymentReceiptEmail from "@/emails/payment-receipt"
import PilotAssignedEmail from "@/emails/pilot-assigned"
import StatusUpdateEmail from "@/emails/status-update"
import TeamAlertEmail from "@/emails/team-alert"
import { site } from "@/lib/site"
import type { Booking } from "@/lib/types"
import { env, hasMailer, hasSmtp } from "./env"
import { getPricing } from "./settings"
import { supabaseAdmin, T } from "./supabase"

let resend: Resend | null = null
let smtp: Transporter | null = null

async function send(
  to: string,
  subject: string,
  element: ReactElement,
  tag: string,
  replyTo?: string,
): Promise<{ mocked: boolean; error?: unknown }> {
  const html = await render(element)
  const text = await render(element, { plainText: true })
  if (!hasMailer) {
    // Mock mode: keep a copy on disk so the design can be checked without keys.
    if (process.env.NODE_ENV !== "production") {
      const dir = path.join(process.cwd(), ".mock_emails")
      await mkdir(dir, { recursive: true })
      await writeFile(path.join(dir, `${Date.now()}-${tag}.html`), html)
    }
    console.info(`[email:mock] to=${to} subject="${subject}"`)
    return { mocked: true }
  }
  const reply = replyTo || env.teamEmail || undefined
  if (hasSmtp) {
    smtp ??= nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpPort === 465,
      auth: { user: env.smtpUser, pass: env.smtpPass },
    })
    try {
      await smtp.sendMail({ from: env.emailFrom, to, subject, html, text, replyTo: reply })
      return { mocked: false }
    } catch (error) {
      console.error("[email] smtp send failed", error)
      if (!env.resendKey) return { mocked: false, error }
      // fall through to the Resend API
    }
  }
  resend ??= new Resend(env.resendKey)
  const { error } = await resend.emails.send({
    from: env.emailFrom,
    to,
    subject,
    html,
    text,
    replyTo: reply,
  })
  if (error) console.error("[email] send failed", error)
  return { mocked: false, error }
}

/** Email failures are logged and never break the booking itself. */
async function safe<T>(fn: () => Promise<T>) {
  try {
    return await fn()
  } catch (e) {
    console.error("[email] error", e)
    return null
  }
}

/** Everyone who should hear about a new booking: team members with email alerts on, plus TEAM_EMAIL. */
async function teamAlertRecipients(): Promise<string[]> {
  const list = new Set<string>()
  const sb = supabaseAdmin()
  if (sb) {
    const { data } = await sb.from(T.team).select("email").eq("notify_email", true)
    data?.forEach((m) => list.add(m.email.toLowerCase()))
    // TEAM_EMAIL is only a fallback, so a team member who turns alerts off is respected
    if (!data && env.teamEmail) list.add(env.teamEmail.toLowerCase())
  } else {
    list.add(env.teamEmail || "team@mock.local")
  }
  return [...list]
}

export async function sendBookingEmails(booking: Booking) {
  const siteUrl = site.url
  const pricing = await getPricing()
  const team = await teamAlertRecipients()
  const subject = `New booking ${booking.reference}: ${booking.event_type} on ${booking.event_date}`
  return Promise.all([
    safe(() =>
      send(
        booking.email,
        `Booking received: ${booking.reference}`,
        BookingConfirmationEmail({ booking, siteUrl, depositNaira: pricing.depositNaira }),
        "confirmation",
      ),
    ),
    // Replies to the alert go to the customer
    ...team.map((to) => safe(() => send(to, subject, TeamAlertEmail({ booking, siteUrl }), "team", booking.email))),
  ])
}

const STATUS_SUBJECT: Record<Booking["status"], string> = {
  pending: "Your booking is under review",
  confirmed: "Your date is confirmed",
  paid: "You are all set",
  completed: "Thank you for flying with us",
  cancelled: "Your booking has been cancelled",
}

export function sendStatusEmail(booking: Booking, message?: string | null) {
  return safe(() =>
    send(
      booking.email,
      `${STATUS_SUBJECT[booking.status]}: ${booking.reference}`,
      StatusUpdateEmail({ booking, siteUrl: site.url, message }),
      `status-${booking.status}`,
    ),
  )
}

export function sendPaymentEmail(booking: Booking, amount: number, paystackRef: string) {
  return safe(() =>
    send(
      booking.email,
      `Payment received: ${booking.reference}`,
      PaymentReceiptEmail({ booking, amount, paystackRef, siteUrl: site.url }),
      "payment",
    ),
  )
}

export function sendCustomEmail(booking: Booking, subject: string, message: string) {
  return safe(() =>
    send(
      booking.email,
      `${subject} (${booking.reference})`,
      CustomMessageEmail({ booking, subject, message, siteUrl: site.url }),
      "custom",
    ),
  )
}

export function sendPilotEmail(booking: Booking) {
  return safe(() =>
    send(
      booking.email,
      `Meet your pilot: ${booking.pilot_name} (${booking.reference})`,
      PilotAssignedEmail({ booking, siteUrl: site.url }),
      "pilot",
    ),
  )
}
