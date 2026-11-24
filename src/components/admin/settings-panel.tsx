"use client"
import { Bell, BellOff, KeyRound, Loader2, LogOut, Mail, Minus, Plus, Wallet } from "lucide-react"
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import { toast } from "sonner"
import { CheckRow, Field, PasswordInput, TextInput } from "@/components/booking/fields"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatNaira, type Pricing } from "@/lib/site"
import { supabaseBrowser } from "@/lib/supabase-browser"

interface SettingsData {
  pricing: Pricing
  notifyEmail: boolean
  push: { available: boolean; devices: number }
}

const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""

function Card({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section className="rounded-[28px] border border-line bg-surface p-5 md:p-6">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-full bg-signal/12 text-signal-ink">{icon}</span>
        <h2 className="text-[18px] font-semibold">{title}</h2>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  )
}

function toKey(base64: string) {
  const pad = "=".repeat((4 - (base64.length % 4)) % 4)
  const raw = atob((base64 + pad).replace(/-/g, "+").replace(/_/g, "/"))
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}

async function swRegistration() {
  const existing = await navigator.serviceWorker.getRegistration("/")
  if (!existing) await navigator.serviceWorker.register("/sw.js")
  return navigator.serviceWorker.ready
}

const digits = (v: string) => v.replace(/\D/g, "")

export function SettingsPanel({
  token,
  me,
  email,
  onSignOut,
}: {
  token: string
  me: { email: string; role: "owner" | "admin" } | null
  email: string
  onSignOut: () => void
}) {
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}`, "Content-Type": "application/json" }), [token])
  const [data, setData] = useState<SettingsData | null>(null)

  useEffect(() => {
    fetch("/api/admin/settings", { headers })
      .then((r) => r.json())
      .then((j: SettingsData) => setData(j))
      .catch(() => toast.error("Could not load settings"))
  }, [headers])

  const patch = useCallback(
    async (body: Partial<Pick<SettingsData, "pricing" | "notifyEmail">>) => {
      const res = await fetch("/api/admin/settings", { method: "PATCH", headers, body: JSON.stringify(body) })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error || "Could not save")
      setData(j)
      return j as SettingsData
    },
    [headers],
  )

  return (
    <div>
      <p className="eyebrow">Settings</p>
      <h1 className="mt-2 text-[32px] font-semibold md:text-[40px]">Prices, alerts and your account</h1>
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div className="flex flex-col gap-5">
          {data ? <PricesCard pricing={data.pricing} save={(p) => patch({ pricing: p })} /> : <Skeleton className="h-96 rounded-[28px]" />}
        </div>
        <div className="flex flex-col gap-5">
          {data ? (
            <AlertsCard data={data} headers={headers} setData={setData} patch={patch} />
          ) : (
            <Skeleton className="h-72 rounded-[28px]" />
          )}
          <AccountCard me={me} email={email} onSignOut={onSignOut} />
        </div>
      </div>
    </div>
  )
}

function PricesCard({ pricing, save }: { pricing: Pricing; save: (p: Pricing) => Promise<unknown> }) {
  const [deposit, setDeposit] = useState(String(pricing.depositNaira))
  const [pilot, setPilot] = useState(String(pricing.pilotFeeNaira))
  const [busy, setBusy] = useState(false)
  const d = Number(digits(deposit) || 0)
  const p = Number(digits(pilot) || 0)
  const changed = d !== pricing.depositNaira || p !== pricing.pilotFeeNaira

  const step = (set: (v: string) => void, value: number, by: number) => set(String(Math.max(0, value + by)))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      await save({ depositNaira: d, pilotFeeNaira: p })
      toast.success("Prices saved. The booking form shows them now.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save")
    } finally {
      setBusy(false)
    }
  }

  const row = (id: string, label: string, hint: string, value: string, set: (v: string) => void, n: number) => (
    <Field label={label} htmlFor={id} hint={hint}>
      <div className="flex gap-2">
        <Button variant="outline" size="icon" aria-label={`Lower ${label} by 5,000`} onClick={() => step(set, n, -5000)}>
          <Minus />
        </Button>
        <div className="relative flex-1">
          <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-subtle">₦</span>
          <TextInput
            id={id}
            inputMode="numeric"
            value={n ? n.toLocaleString("en-NG") : value === "" ? "" : "0"}
            onChange={(e) => set(digits(e.target.value))}
            className="pl-9 font-mono tabular-nums"
          />
        </div>
        <Button variant="outline" size="icon" aria-label={`Raise ${label} by 5,000`} onClick={() => step(set, n, 5000)}>
          <Plus />
        </Button>
      </div>
    </Field>
  )

  return (
    <Card icon={<Wallet className="size-[18px]" />} title="Prices">
      <form onSubmit={submit} className="flex flex-col gap-5">
        {row("set-deposit", "Deposit to hold a date", "Paid by every customer to hold their date.", deposit, setDeposit, d)}
        {row("set-pilot", "Pilot fee", "Added when a customer asks us to provide the pilot.", pilot, setPilot, p)}
        <div className="rounded-2xl border border-line bg-bg/50 p-4 text-[13.5px] leading-relaxed">
          <p>
            Customer with their own pilot pays <strong>{formatNaira(d)}</strong> to hold the date.
          </p>
          <p>
            Customer who needs our pilot pays <strong>{formatNaira(d + p)}</strong> to hold the date.
          </p>
          <p className="mt-2 text-[12.5px] text-subtle">
            New prices apply to new bookings. Bookings already made keep the pilot fee they booked with.
          </p>
        </div>
        <Button type="submit" size="lg" block disabled={busy || !changed}>
          {busy && <Loader2 className="animate-spin" />} {changed ? "Save prices" : "Prices are up to date"}
        </Button>
      </form>
    </Card>
  )
}

function AlertsCard({
  data,
  headers,
  setData,
  patch,
}: {
  data: SettingsData
  headers: Record<string, string>
  setData: (d: SettingsData) => void
  patch: (b: { notifyEmail: boolean }) => Promise<SettingsData>
}) {
  const [busy, setBusy] = useState<string | null>(null)
  const [deviceOn, setDeviceOn] = useState<boolean | null>(null)
  const [support, setSupport] = useState<"ok" | "ios-browser" | "none" | "blocked" | null>(null)

  useEffect(() => {
    const check = async () => {
      const ua = navigator.userAgent
      const ios = /iPhone|iPad|iPod/.test(ua) || (ua.includes("Mac") && navigator.maxTouchPoints > 1)
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        setSupport(ios && !standalone ? "ios-browser" : "none")
        setDeviceOn(false)
        return
      }
      if (ios && !standalone) setSupport("ios-browser")
      else setSupport(Notification.permission === "denied" ? "blocked" : "ok")
      const reg = await navigator.serviceWorker.getRegistration("/")
      const sub = await reg?.pushManager.getSubscription()
      setDeviceOn(Boolean(sub))
    }
    void check().catch(() => setDeviceOn(false))
  }, [])

  const toggleEmail = async () => {
    setBusy("email")
    try {
      const d = await patch({ notifyEmail: !data.notifyEmail })
      toast.success(d.notifyEmail ? "You will get an email for every new booking" : "New booking emails are off for you")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save")
    } finally {
      setBusy(null)
    }
  }

  const turnOn = async () => {
    setBusy("device")
    try {
      const permission = await Notification.requestPermission()
      if (permission !== "granted") {
        setSupport(permission === "denied" ? "blocked" : "ok")
        throw new Error("Alerts were not allowed on this device")
      }
      const reg = await swRegistration()
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toKey(VAPID) }))
      const res = await fetch("/api/admin/push", { method: "POST", headers, body: JSON.stringify({ subscription: sub.toJSON() }) })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error)
      setDeviceOn(true)
      setData({ ...data, push: { ...data.push, devices: j.devices } })
      await fetch("/api/admin/push", { method: "POST", headers, body: JSON.stringify({ test: true }) })
      toast.success("Alerts are on for this device. A test alert is on its way.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not turn on alerts")
    } finally {
      setBusy(null)
    }
  }

  const turnOff = async () => {
    setBusy("device")
    try {
      const reg = await navigator.serviceWorker.getRegistration("/")
      const sub = await reg?.pushManager.getSubscription()
      if (sub) {
        const res = await fetch(`/api/admin/push?endpoint=${encodeURIComponent(sub.endpoint)}`, { method: "DELETE", headers })
        const j = await res.json()
        await sub.unsubscribe()
        setData({ ...data, push: { ...data.push, devices: j.devices ?? 0 } })
      }
      setDeviceOn(false)
      toast.success("Alerts are off for this device")
    } catch {
      toast.error("Could not turn off alerts")
    } finally {
      setBusy(null)
    }
  }

  const test = async () => {
    setBusy("test")
    try {
      const res = await fetch("/api/admin/push", { method: "POST", headers, body: JSON.stringify({ test: true }) })
      const j = await res.json()
      toast.success(j.sent ? `Test alert sent to ${j.sent} device${j.sent === 1 ? "" : "s"}` : "No devices to alert yet")
    } finally {
      setBusy(null)
    }
  }

  return (
    <Card icon={<Bell className="size-[18px]" />} title="New booking alerts">
      <div className="flex flex-col gap-4">
        <CheckRow
          checked={data.notifyEmail}
          onChange={() => void toggleEmail()}
          description="An email with the full booking details each time someone books."
        >
          <span className="inline-flex items-center gap-2">
            <Mail className="size-4" /> Email me about new bookings {busy === "email" && <Loader2 className="size-3.5 animate-spin" />}
          </span>
        </CheckRow>

        <div className="rounded-2xl border border-line bg-bg/50 p-4">
          <p className="text-[14px] font-medium">Phone and computer alerts</p>
          <p className="mt-1 text-[13px] leading-relaxed text-subtle">
            A pop up alert on this device the moment a booking comes in, even when the dashboard is closed.
            {data.push.devices > 0 && ` On for ${data.push.devices} of your device${data.push.devices === 1 ? "" : "s"}.`}
          </p>
          {!data.push.available ? (
            <p className="mt-3 text-[13px] text-subtle">Alerts are not set up on this server yet.</p>
          ) : support === "ios-browser" ? (
            <p className="mt-3 rounded-xl bg-signal/8 p-3 text-[13px] leading-relaxed">
              On iPhone, alerts only work from the installed app. In Safari tap Share, then Add to Home Screen, open
              Astro_Fly from your home screen, sign in and come back here.
            </p>
          ) : support === "none" ? (
            <p className="mt-3 text-[13px] text-subtle">This browser does not support alerts. Try Chrome, Edge or Safari.</p>
          ) : support === "blocked" && !deviceOn ? (
            <p className="mt-3 text-[13px] leading-relaxed text-subtle">
              Alerts are blocked for this site. Allow notifications for this site in your browser or phone settings, then
              reload this page.
            </p>
          ) : deviceOn === null ? (
            <Skeleton className="mt-3 h-11 rounded-full" />
          ) : deviceOn ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="outline" size="md" onClick={test} disabled={!!busy}>
                {busy === "test" ? <Loader2 className="animate-spin" /> : <Bell />} Send a test
              </Button>
              <Button variant="ghost" size="md" onClick={turnOff} disabled={!!busy}>
                {busy === "device" ? <Loader2 className="animate-spin" /> : <BellOff />} Turn off on this device
              </Button>
            </div>
          ) : (
            <Button size="md" className="mt-3" onClick={turnOn} disabled={!!busy}>
              {busy === "device" ? <Loader2 className="animate-spin" /> : <Bell />} Turn on alerts on this device
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}

function AccountCard({
  me,
  email,
  onSignOut,
}: {
  me: { email: string; role: "owner" | "admin" } | null
  email: string
  onSignOut: () => void
}) {
  const [pw, setPw] = useState("")
  const [pw2, setPw2] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(undefined)
    if (pw.length < 8) return setError("Use at least 8 characters")
    if (pw !== pw2) return setError("The two passwords do not match")
    const sb = supabaseBrowser()
    if (!sb) return setError("Passwords cannot be changed in demo mode")
    setBusy(true)
    const { error } = await sb.auth.updateUser({ password: pw })
    setBusy(false)
    if (error) return setError(error.message)
    setPw("")
    setPw2("")
    toast.success("Password changed. Use the new one next time you sign in.")
  }

  return (
    <Card icon={<KeyRound className="size-[18px]" />} title="Your account">
      <p className="text-[14px]">
        Signed in as <strong className="break-all">{me?.email ?? email}</strong>
        {me && <span className="ml-2 rounded-full bg-fg/10 px-2 py-0.5 font-mono text-[10.5px] uppercase">{me.role}</span>}
      </p>
      <form onSubmit={submit} className="mt-5 flex flex-col gap-4">
        <p className="text-[14px] font-medium">Change password</p>
        <Field label="New password" htmlFor="acc-pw">
          <PasswordInput id="acc-pw" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
        </Field>
        <Field label="Type it again" htmlFor="acc-pw2" error={error}>
          <PasswordInput id="acc-pw2" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
        </Field>
        <Button type="submit" size="lg" block disabled={busy || !pw || !pw2}>
          {busy && <Loader2 className="animate-spin" />} Change password
        </Button>
        <p className="text-[12.5px] leading-relaxed text-subtle">
          This password is also used by any other Samfred app you sign in to with this email.
        </p>
      </form>
      <div className="mt-6 border-t border-line pt-5">
        <Button variant="outline" size="lg" block onClick={onSignOut}>
          <LogOut /> Sign out
        </Button>
      </div>
    </Card>
  )
}
