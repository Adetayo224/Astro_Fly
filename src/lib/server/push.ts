import "server-only"
import webpush from "web-push"
import { site } from "@/lib/site"
import { supabaseAdmin } from "./supabase"

const TABLE = "astrofly_push_subscriptions"
const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""
const privateKey = process.env.VAPID_PRIVATE_KEY || ""
export const hasPush = Boolean(publicKey && privateKey)

let ready = false
function setup() {
  if (!ready && hasPush) {
    webpush.setVapidDetails(`mailto:${site.email}`, publicKey, privateKey)
    ready = true
  }
  return ready
}

export interface PushPayload {
  title: string
  body: string
  url?: string
  tag?: string
}

export interface PushSub {
  endpoint: string
  keys: { p256dh: string; auth: string }
}

export async function saveSubscription(email: string, sub: PushSub, userAgent: string | null) {
  const sb = supabaseAdmin()
  if (!sb) return
  const { error } = await sb.from(TABLE).upsert({
    endpoint: sub.endpoint,
    email,
    p256dh: sub.keys.p256dh,
    auth: sub.keys.auth,
    user_agent: userAgent?.slice(0, 300) ?? null,
  })
  if (error) throw new Error(error.message)
}

export async function removeSubscription(email: string, endpoint: string) {
  await supabaseAdmin()?.from(TABLE).delete().eq("endpoint", endpoint).eq("email", email)
}

export async function countSubscriptions(email: string) {
  const sb = supabaseAdmin()
  if (!sb) return 0
  const { count } = await sb.from(TABLE).select("endpoint", { count: "exact", head: true }).eq("email", email)
  return count ?? 0
}

/** Sends an alert to every device the team turned alerts on for (or only to the given people). */
export async function pushToTeam(payload: PushPayload, onlyEmails?: string[]) {
  const sb = supabaseAdmin()
  if (!sb || !setup()) return { sent: 0 }
  let query = sb.from(TABLE).select("endpoint, p256dh, auth")
  if (onlyEmails) query = query.in("email", onlyEmails)
  const { data } = await query
  let sent = 0
  await Promise.all(
    (data ?? []).map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(payload),
          { TTL: 60 * 60 * 24, urgency: "high" },
        )
        sent++
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode
        // The device unsubscribed or the browser data was cleared
        if (code === 404 || code === 410) await sb.from(TABLE).delete().eq("endpoint", s.endpoint)
        else console.error("[push] send failed", code, e instanceof Error ? e.message : e)
      }
    }),
  )
  return { sent }
}
