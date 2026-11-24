"use client"
import { AnimatePresence, motion } from "framer-motion"
import { Loader2, LogOut, RefreshCw, Search } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Logo } from "@/components/brand/logo"
import { CheckRow, Field, PasswordInput, TextArea, TextInput } from "@/components/booking/fields"
import { CountUp } from "@/components/home/count-up"
import { ThemeToggle } from "@/components/shell/theme-toggle"
import { Button } from "@/components/ui/button"
import { Sheet } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { deliverableLabels, formatDateTime, formatEventDate, formatTime } from "@/lib/format"
import { formatNaira } from "@/lib/site"
import { supabaseBrowser, supabaseConfigured } from "@/lib/supabase-browser"
import { BOOKING_STATUSES, STATUS_LABEL, type Booking, type BookingEvent, type BookingStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

const MOCK_TOKEN = "mock-admin"

const STATUS_STYLE: Record<BookingStatus, string> = {
  pending: "bg-amber-400/15 text-amber-600 dark:text-amber-300",
  confirmed: "bg-sky-400/15 text-sky-700 dark:text-sky-300",
  paid: "bg-signal/15 text-signal-ink",
  completed: "bg-fg/10 text-fg/80",
  cancelled: "bg-destructive/15 text-destructive",
}

function StatusPill({ status }: { status: BookingStatus }) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 font-mono text-[10.5px] font-semibold tracking-[0.1em] uppercase", STATUS_STYLE[status])}>
      {status}
    </span>
  )
}

export function AdminApp() {
  const [token, setToken] = useState<string | null>(null)
  const [email, setEmail] = useState<string>("")
  const [checking, setChecking] = useState(supabaseConfigured)

  useEffect(() => {
    const sb = supabaseBrowser()
    if (!sb) return
    sb.auth.getSession().then(({ data }) => {
      if (data.session) {
        setToken(data.session.access_token)
        setEmail(data.session.user.email ?? "")
      }
      setChecking(false)
    })
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => {
      setToken(session?.access_token ?? null)
      setEmail(session?.user.email ?? "")
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabaseBrowser()?.auth.signOut()
    setToken(null)
  }

  if (checking) {
    return (
      <div className="grid min-h-svh place-items-center">
        <Loader2 className="size-8 animate-spin text-signal-ink" />
      </div>
    )
  }
  if (!token) return <Login onToken={(t, e) => (setToken(t), setEmail(e))} />
  return <Dashboard token={token} email={email} onSignOut={signOut} />
}

function Login({ onToken }: { onToken: (t: string, email: string) => void }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()
  const [mode, setMode] = useState<"signin" | "reset" | "sent">("signin")

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const sb = supabaseBrowser()
    if (!sb) return
    setLoading(true)
    setError(undefined)
    if (mode === "reset") {
      const { error } = await sb.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/admin/accept`,
      })
      setLoading(false)
      if (error) return setError(error.message)
      setMode("sent")
      return
    }
    const { data, error } = await sb.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error || !data.session) return setError(error?.message || "Sign in failed")
    onToken(data.session.access_token, data.session.user.email ?? email)
  }

  return (
    <div className="relative grid min-h-svh place-items-center px-5">
      <div className="noise absolute inset-0" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="brackets glass relative w-full max-w-sm rounded-[28px] p-7"
      >
        <Logo />
        <h1 className="mt-8 text-[26px] font-semibold">
          {mode === "signin" ? "Team dashboard" : "Set a new password"}
        </h1>
        {supabaseConfigured && mode === "sent" ? (
          <div className="mt-4 flex flex-col gap-5">
            <p className="text-[14px] leading-relaxed text-subtle">
              If {email} is on the team, a link is on its way. Open it on this device to choose your password. The link
              works for one hour.
            </p>
            <Button variant="outline" size="lg" block onClick={() => setMode("signin")}>
              Back to sign in
            </Button>
          </div>
        ) : supabaseConfigured ? (
          <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
            {mode === "reset" && (
              <p className="text-[13.5px] leading-relaxed text-subtle">
                Enter your email and we will send you a link to set your password. Use this if your invite link expired.
              </p>
            )}
            <Field label="Email" htmlFor="a-email">
              <TextInput id="a-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            {mode === "signin" && (
              <Field label="Password" htmlFor="a-pass">
                <PasswordInput
                  id="a-pass"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Field>
            )}
            {error && <p className="text-[13px] text-destructive">{error}</p>}
            <Button type="submit" size="xl" block disabled={loading}>
              {loading && <Loader2 className="animate-spin" />} {mode === "signin" ? "Sign in" : "Send me a link"}
            </Button>
            <button
              type="button"
              onClick={() => {
                setError(undefined)
                setMode(mode === "signin" ? "reset" : "signin")
              }}
              className="text-[13px] font-medium text-signal-ink"
            >
              {mode === "signin" ? "Forgot password or invite link expired?" : "Back to sign in"}
            </button>
          </form>
        ) : (
          <div className="mt-4 flex flex-col gap-5">
            <p className="text-[14px] leading-relaxed text-subtle">
              Supabase keys are not set, so the dashboard runs in demo mode with sample data held in memory. Add your keys in
              .env.local to use real sign in.
            </p>
            <Button size="xl" block onClick={() => onToken(MOCK_TOKEN, "demo@astrofly")}>
              Open demo dashboard
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  )
}

function Dashboard({ token, email, onSignOut }: { token: string; email: string; onSignOut: () => void }) {
  const [bookings, setBookings] = useState<Booking[] | null>(null)
  const [filter, setFilter] = useState<BookingStatus | "all">("all")
  const [q, setQ] = useState("")
  const [selected, setSelected] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [tab, setTab] = useState<"bookings" | "team">("bookings")
  const [me, setMe] = useState<{ email: string; role: "owner" | "admin" } | null>(null)

  useEffect(() => {
    fetch("/api/admin/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => j && setMe(j))
      .catch(() => {})
  }, [token])

  const fetchList = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/bookings", { headers: { Authorization: `Bearer ${token}` } })
      if (res.status === 401) {
        toast.error("This account does not have access to the Astro_Fly dashboard. Ask an owner to invite you.")
        onSignOut()
        return
      }
      const json = await res.json()
      setBookings(json.bookings)
    } catch {
      toast.error("Could not load bookings")
    }
  }, [token, onSignOut])

  const load = async () => {
    setRefreshing(true)
    await fetchList()
    setRefreshing(false)
  }

  useEffect(() => {
    void Promise.resolve().then(fetchList)
  }, [fetchList])

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: bookings?.length ?? 0 }
    BOOKING_STATUSES.forEach((s) => (c[s] = bookings?.filter((b) => b.status === s).length ?? 0))
    return c
  }, [bookings])

  const list = useMemo(() => {
    const term = q.trim().toLowerCase()
    return (bookings ?? [])
      .filter((b) => filter === "all" || b.status === filter)
      .filter(
        (b) =>
          !term ||
          [b.reference, b.full_name, b.email, b.phone, b.venue_name, b.city].some((x) => x.toLowerCase().includes(term)),
      )
  }, [bookings, filter, q])

  const onUpdated = (b: Booking) => setBookings((all) => all?.map((x) => (x.id === b.id ? b : x)) ?? null)

  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-40 border-b border-line bg-bg/80 pt-safe backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-5 md:px-8">
          <Logo compact />
          <nav className="ml-3 flex rounded-full border border-line bg-surface p-1" aria-label="Dashboard sections">
            {(["bookings", "team"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                aria-current={tab === t ? "page" : undefined}
                className={cn(
                  "relative h-8 rounded-full px-3.5 text-[13px] font-medium capitalize transition-colors",
                  tab === t ? "text-ink" : "text-subtle hover:text-fg",
                )}
              >
                {tab === t && (
                  <motion.span layoutId="admin-tab" className="absolute inset-0 -z-0 rounded-full bg-signal" />
                )}
                <span className="relative">{t}</span>
              </button>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-[13px] text-subtle md:inline">{email}</span>
            <ThemeToggle />
            <button
              onClick={onSignOut}
              aria-label="Sign out"
              className="grid size-10 place-items-center rounded-full border border-line transition hover:border-signal/50 active:scale-90"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 md:px-8">
        {tab === "team" ? (
          <TeamPanel token={token} me={me} />
        ) : (
        <>
        {token === MOCK_TOKEN && (
          <p className="mb-6 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-[13px] text-amber-700 dark:text-amber-200">
            Demo mode. Bookings live in memory and reset when the server restarts. Emails are saved to .mock_emails.
          </p>
        )}
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Bookings</p>
            <h1 className="mt-2 text-[32px] font-semibold md:text-[40px]">Flight board</h1>
          </div>
          <Button variant="outline" size="md" onClick={load} disabled={refreshing}>
            <RefreshCw className={cn(refreshing && "animate-spin")} /> Refresh
          </Button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {(["all", ...BOOKING_STATUSES] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                "rounded-3xl border p-4 text-left transition active:scale-[0.97]",
                filter === s ? "border-signal bg-signal/8" : "border-line bg-surface hover:border-fg/20",
              )}
            >
              <p className="font-mono text-[10.5px] tracking-[0.16em] text-subtle uppercase">{s === "all" ? "All" : s}</p>
              <p className="mt-2 font-heading text-[30px] font-semibold tabular-nums">
                {bookings ? <CountUp value={counts[s]} duration={0.9} /> : "0"}
              </p>
            </button>
          ))}
        </div>

        <div className="relative mt-6">
          <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-subtle" />
          <TextInput
            placeholder="Search name, reference, email, phone or venue"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-11"
          />
        </div>

        <div className="mt-6">
          {!bookings ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-3xl" />
              ))}
            </div>
          ) : list.length === 0 ? (
            <p className="rounded-3xl border border-dashed border-fg/15 py-16 text-center text-subtle">No bookings here yet.</p>
          ) : (
            <motion.ul layout className="flex flex-col gap-2.5">
              <AnimatePresence initial={false}>
                {list.map((b) => (
                  <motion.li key={b.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <button
                      onClick={() => setSelected(b.id)}
                      className="grid w-full grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 rounded-3xl border border-line bg-surface p-4 text-left transition hover:border-signal/40 active:scale-[0.99] md:grid-cols-[150px_1.4fr_1.2fr_1fr_120px_110px] md:p-5"
                    >
                      <span className="font-mono text-[13px] font-semibold tracking-wider text-signal-ink">{b.reference}</span>
                      <span className="justify-self-end md:order-last md:justify-self-start">
                        <StatusPill status={b.status} />
                      </span>
                      <span className="col-span-2 md:col-span-1">
                        <span className="block text-[14.5px] font-semibold">{b.full_name}</span>
                        <span className="block text-[12.5px] text-subtle">{b.phone}</span>
                      </span>
                      <span className="col-span-2 text-[13.5px] md:col-span-1">
                        {b.event_type} · {formatEventDate(b.event_date, { short: true })}
                      </span>
                      <span className="col-span-2 truncate text-[13px] text-subtle md:col-span-1">
                        {b.drone_name}
                        {b.needs_pilot && (
                          <span
                            className={cn(
                              "ml-2 rounded-full px-2 py-0.5 font-mono text-[10px] tracking-wider uppercase",
                              b.pilot_name ? "bg-fg/10 text-fg/70" : "bg-amber-400/15 text-amber-600 dark:text-amber-300",
                            )}
                          >
                            {b.pilot_name ? `Pilot: ${b.pilot_name.split(" ")[0]}` : "Needs pilot"}
                          </span>
                        )}
                      </span>
                      <span className="col-span-2 font-mono text-[13px] md:col-span-1">{b.price ? formatNaira(b.price) : "No price"}</span>
                    </button>
                  </motion.li>
                ))}
              </AnimatePresence>
            </motion.ul>
          )}
        </div>
        </>
        )}
      </div>

      <BookingDetail id={selected} token={token} onClose={() => setSelected(null)} onUpdated={onUpdated} />
    </div>
  )
}

function BookingDetail({
  id,
  token,
  onClose,
  onUpdated,
}: {
  id: string | null
  token: string
  onClose: () => void
  onUpdated: (b: Booking) => void
}) {
  const [data, setData] = useState<{ booking: Booking; events: BookingEvent[] } | null>(null)
  const [pilotName, setPilotName] = useState("")
  const [pilotPhone, setPilotPhone] = useState("")
  const [matching, setMatching] = useState(false)
  const [status, setStatus] = useState<BookingStatus>("pending")
  const [price, setPrice] = useState("")
  const [note, setNote] = useState("")
  const [message, setMessage] = useState("")
  const [notify, setNotify] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!id) return
    fetch(`/api/admin/bookings/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((j) => {
        setData(j)
        setStatus(j.booking.status)
        setPrice(j.booking.price ? String(j.booking.price) : "")
        setNote(j.booking.admin_note ?? "")
        setPilotName(j.booking.pilot_name ?? "")
        setPilotPhone(j.booking.pilot_phone ?? "")
        setMessage("")
        setNotify(true)
      })
      .catch(() => toast.error("Could not load booking"))
  }, [id, token])

  const save = async () => {
    if (!data) return
    const p = price.replace(/[^\d]/g, "")
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/bookings/${data.booking.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          price: p ? Number(p) : null,
          admin_note: note || null,
          notify,
          message: message || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setData((d) => (d ? { ...d, booking: json.booking, events: json.events } : d))
      onUpdated(json.booking)
      setMessage("")
      toast.success(json.emailed ? "Saved and emailed the customer" : "Saved")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save")
    } finally {
      setSaving(false)
    }
  }

  const [payAmount, setPayAmount] = useState("")
  const [paying, setPaying] = useState(false)
  const [mailSubject, setMailSubject] = useState("")
  const [mailBody, setMailBody] = useState("")
  const [mailing, setMailing] = useState(false)

  const recordPayment = async () => {
    if (!data) return
    const amount = Number(payAmount.replace(/\D/g, ""))
    if (!amount) return toast.error("Enter the amount you received")
    setPaying(true)
    try {
      const res = await fetch(`/api/admin/bookings/${data.booking.id}/payment`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ amount, notify: true }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setData((d) => (d ? { ...d, booking: json.booking, events: json.events } : d))
      setStatus(json.booking.status)
      onUpdated(json.booking)
      setPayAmount("")
      toast.success(`${formatNaira(amount)} recorded. Receipt emailed to the customer.`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not record payment")
    } finally {
      setPaying(false)
    }
  }

  const sendMail = async () => {
    if (!data) return
    setMailing(true)
    try {
      const res = await fetch(`/api/admin/bookings/${data.booking.id}/email`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ subject: mailSubject, message: mailBody }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setData((d) => (d ? { ...d, events: json.events } : d))
      setMailSubject("")
      setMailBody("")
      toast.success(json.mocked ? "Saved to .mock_emails (add RESEND_API_KEY to really send)" : "Email sent")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send")
    } finally {
      setMailing(false)
    }
  }

  const matchPilot = async () => {
    if (!data) return
    setMatching(true)
    try {
      const res = await fetch(`/api/admin/bookings/${data.booking.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ pilot_name: pilotName.trim(), pilot_phone: pilotPhone.trim() || null, notify: true }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setData((d) => (d ? { ...d, booking: json.booking, events: json.events } : d))
      onUpdated(json.booking)
      toast.success(json.emailed ? "Pilot saved and introduced to the customer by email" : "Pilot saved")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save the pilot")
    } finally {
      setMatching(false)
    }
  }

  // Only show data that belongs to the booking currently open
  const b = data?.booking.id === id ? data?.booking : undefined

  return (
    <Sheet
      open={!!id}
      onClose={onClose}
      width="600px"
      title={b ? <span className="font-mono tracking-wider text-signal-ink">{b.reference}</span> : "Booking"}
      footer={
        b && (
          <Button size="xl" block onClick={save} disabled={saving}>
            {saving && <Loader2 className="animate-spin" />}
            {notify && (status !== b.status || message) ? "Save and email customer" : "Save changes"}
          </Button>
        )
      }
    >
      {!b ? (
        <div className="flex flex-col gap-3 p-5">
          <Skeleton className="h-24 rounded-3xl" />
          <Skeleton className="h-64 rounded-3xl" />
        </div>
      ) : (
        <div className="flex flex-col gap-6 p-5 pb-10">
          <section className="rounded-3xl border border-line bg-surface p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[18px] font-semibold">{b.full_name}</p>
                <p className="text-[13.5px] text-subtle">{b.email}</p>
              </div>
              <StatusPill status={b.status} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <a href={`tel:${b.phone}`} className="rounded-full border border-line px-3.5 py-2 text-[13px] font-medium hover:border-signal/50">
                Call {b.phone}
              </a>
              <a
                href={`https://wa.me/${b.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`Hello ${b.full_name.split(" ")[0]}, this is Astro_Fly about your booking ${b.reference}.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-[#25D366] px-3.5 py-2 text-[13px] font-semibold text-white"
              >
                WhatsApp
              </a>
            </div>
          </section>

          <dl className="divide-y divide-line rounded-3xl border border-line bg-surface/60 px-5 text-[14px]">
            {[
              ["Event", b.event_type],
              ["Date", `${formatEventDate(b.event_date)} at ${formatTime(b.start_time)}`],
              ["Duration", b.duration === "Custom" ? b.custom_duration ?? "Custom" : b.duration],
              ["Venue", `${b.venue_name}, ${b.address}, ${b.city}, ${b.state}`],
              ["Setting", b.setting],
              ["Guests", b.guests],
              ["Drone", b.drone_name],
              ["Deliverables", deliverableLabels(b.deliverables).join(", ")],
              [
                "Pilot",
                b.needs_pilot
                  ? b.pilot_name
                    ? `${b.pilot_name}${b.pilot_phone ? `, ${b.pilot_phone}` : ""}`
                    : `Needs an Astro_Fly pilot (+${formatNaira(b.pilot_fee)})`
                  : "Has their own pilot",
              ],
              ...(b.notes ? [["Notes", b.notes]] : []),
              ["Payment choice", b.pay_option === "deposit" ? "Deposit now" : "Pay later"],
              ["Paid so far", formatNaira(b.amount_paid)],
              ["Received", formatDateTime(b.created_at)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-6 py-3">
                <dt className="shrink-0 text-subtle">{k}</dt>
                <dd className="text-right break-words">{v}</dd>
              </div>
            ))}
          </dl>

          {b.needs_pilot && (
            <section className="flex flex-col gap-4 rounded-3xl border border-line bg-surface/60 p-5">
              <div className="flex items-baseline justify-between gap-3">
                <p className="eyebrow">Match a pilot</p>
                <span className="font-mono text-[12px] text-subtle">Fee {formatNaira(b.pilot_fee)}</span>
              </div>
              <p className="text-[13px] leading-relaxed text-subtle">
                Choose who will fly for this customer. When you save, they get an email introducing the pilot, and the
                pilot shows on their booking page.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Pilot name" htmlFor="p-name">
                  <TextInput id="p-name" value={pilotName} onChange={(e) => setPilotName(e.target.value)} />
                </Field>
                <Field label="Pilot phone" htmlFor="p-phone">
                  <TextInput
                    id="p-phone"
                    type="tel"
                    inputMode="tel"
                    placeholder="0803 000 0000"
                    value={pilotPhone}
                    onChange={(e) => setPilotPhone(e.target.value)}
                  />
                </Field>
              </div>
              <Button size="lg" onClick={matchPilot} disabled={matching || !pilotName.trim()}>
                {matching && <Loader2 className="animate-spin" />}
                {b.pilot_name ? "Update pilot and tell the customer" : "Save and introduce the pilot"}
              </Button>
            </section>
          )}

          <section className="flex flex-col gap-5 rounded-3xl border border-signal/30 bg-signal/[0.04] p-5">
            <p className="eyebrow">Update</p>
            <Field label="Price in naira" htmlFor="ad-price" hint={price ? formatNaira(Number(price.replace(/\D/g, "")) || 0) : "Leave empty while it is to be confirmed"}>
              <TextInput
                id="ad-price"
                inputMode="numeric"
                placeholder="150000"
                value={price}
                onChange={(e) => setPrice(e.target.value.replace(/[^\d]/g, ""))}
                className="font-mono"
              />
            </Field>
            <Field label="Status">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {BOOKING_STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    aria-pressed={status === s}
                    className={cn(
                      "h-11 rounded-2xl border text-[13.5px] font-medium transition active:scale-95",
                      status === s ? "border-signal bg-signal text-ink" : "border-line bg-surface hover:border-fg/25",
                    )}
                  >
                    {STATUS_LABEL[s]}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Message to the customer" htmlFor="ad-msg" optional hint="Added to the status email.">
              <TextArea id="ad-msg" value={message} onChange={(e) => setMessage(e.target.value)} className="min-h-20" />
            </Field>
            <CheckRow checked={notify} onChange={setNotify} description="Sent when the status changes or you add a message.">
              Email the customer
            </CheckRow>
            <Field label="Private team note" htmlFor="ad-note" optional>
              <TextArea id="ad-note" value={note} onChange={(e) => setNote(e.target.value)} className="min-h-20" />
            </Field>
          </section>

          <section className="flex flex-col gap-4 rounded-3xl border border-line bg-surface/60 p-5">
            <div className="flex items-baseline justify-between gap-3">
              <p className="eyebrow">Record a bank transfer</p>
              <span className="font-mono text-[12px] text-subtle">
                Paid {formatNaira(b.amount_paid)}
                {b.price ? ` of ${formatNaira(b.price)}` : ""}
              </span>
            </div>
            <p className="text-[13px] leading-relaxed text-subtle">
              Once the money is in the Fidelity account, enter the amount. The customer gets a receipt by email and the
              status updates on its own.
            </p>
            <div className="flex gap-2">
              <TextInput
                inputMode="numeric"
                placeholder={b.price ? String(Math.max(b.price - b.amount_paid, 0)) : "20000"}
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value.replace(/[^\d]/g, ""))}
                className="font-mono"
                aria-label="Amount received in naira"
              />
              <Button size="lg" onClick={recordPayment} disabled={paying || !payAmount} className="shrink-0">
                {paying && <Loader2 className="animate-spin" />} Record
              </Button>
            </div>
          </section>

          <section className="flex flex-col gap-4 rounded-3xl border border-line bg-surface/60 p-5">
            <p className="eyebrow">Write to the customer</p>
            <Field label="Subject" htmlFor="m-subject">
              <TextInput
                id="m-subject"
                placeholder="About your shoot"
                value={mailSubject}
                onChange={(e) => setMailSubject(e.target.value)}
              />
            </Field>
            <Field label="Message" htmlFor="m-body" hint="Sent from orders@samfredrobotics.com in the Astro_Fly email design.">
              <TextArea id="m-body" value={mailBody} onChange={(e) => setMailBody(e.target.value)} className="min-h-32" />
            </Field>
            <Button variant="outline" size="lg" onClick={sendMail} disabled={mailing || !mailSubject || !mailBody}>
              {mailing && <Loader2 className="animate-spin" />} Send email
            </Button>
          </section>

          <section>
            <p className="eyebrow mb-3">History</p>
            <ol className="flex flex-col gap-3 border-l border-line pl-5">
              {data!.events.map((e) => (
                <li key={e.id} className="relative">
                  <span className="absolute top-1.5 -left-[25px] size-2.5 rounded-full bg-signal" />
                  <p className="text-[13.5px]">
                    <span className="font-semibold">{STATUS_LABEL[e.status]}</span>
                    {e.note ? <span className="text-subtle"> · {e.note}</span> : null}
                  </p>
                  <p className="font-mono text-[11px] text-subtle">{formatDateTime(e.created_at)}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>
      )}
    </Sheet>
  )
}

interface Member {
  email: string
  role: "owner" | "admin"
  invited_by: string | null
  created_at: string
  status?: "active" | "invited"
}

/** Owners invite people by email and remove them. Removing only takes away dashboard access. */
function TeamPanel({ token, me }: { token: string; me: { email: string; role: "owner" | "admin" } | null }) {
  const [team, setTeam] = useState<Member[] | null>(null)
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<"admin" | "owner">("admin")
  const [busy, setBusy] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null)
  const isOwner = me?.role === "owner"
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}`, "Content-Type": "application/json" }), [token])

  useEffect(() => {
    fetch("/api/admin/team", { headers })
      .then((r) => r.json())
      .then((j) => setTeam(j.team ?? []))
      .catch(() => toast.error("Could not load the team"))
  }, [headers])

  const invite = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      const res = await fetch("/api/admin/team", { method: "POST", headers, body: JSON.stringify({ email, role }) })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setTeam(json.team)
      setEmail("")
      toast.success(
        json.result === "invited"
          ? "Invite sent. They will get an email to set their password."
          : json.result === "existing_account"
            ? "Access given. They already have a Samfred account, so they can sign in with their usual password."
            : "They are already on the team.",
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invite failed")
    } finally {
      setBusy(false)
    }
  }

  const remove = async (target: string) => {
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/team?email=${encodeURIComponent(target)}`, { method: "DELETE", headers })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setTeam(json.team)
      toast.success(`${target} no longer has access`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not remove")
    } finally {
      setBusy(false)
      setConfirmRemove(null)
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <div>
        <p className="eyebrow">Team</p>
        <h1 className="mt-2 text-[32px] font-semibold md:text-[40px]">Who can manage bookings</h1>
        <p className="mt-2 max-w-lg text-[14.5px] text-subtle">
          Owners can invite and remove people. Admins can manage bookings, prices, payments and emails.
        </p>
        <ul className="mt-6 flex flex-col gap-2.5">
          {!team
            ? Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-3xl" />)
            : team.map((m) => (
                <li key={m.email} className="flex flex-wrap items-center gap-3 rounded-3xl border border-line bg-surface p-4 md:p-5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-signal/12 font-heading text-[15px] font-semibold text-signal-ink uppercase">
                    {m.email[0]}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14.5px] font-semibold">
                      {m.email}
                      {m.email === me?.email && <span className="ml-2 text-[12px] font-normal text-subtle">You</span>}
                    </span>
                    <span className="block font-mono text-[11px] text-subtle">
                      {m.status === "invited" ? "Invite sent, waiting for them to set a password" : "Active"}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 font-mono text-[10.5px] font-semibold tracking-[0.1em] uppercase",
                      m.role === "owner" ? "bg-signal/15 text-signal-ink" : "bg-fg/10 text-fg/80",
                    )}
                  >
                    {m.role}
                  </span>
                  {isOwner && m.email !== me?.email && (
                    confirmRemove === m.email ? (
                      <span className="flex gap-2">
                        <Button variant="danger" size="sm" onClick={() => remove(m.email)} disabled={busy}>
                          Remove access
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setConfirmRemove(null)}>
                          Keep
                        </Button>
                      </span>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => setConfirmRemove(m.email)}>
                        Remove
                      </Button>
                    )
                  )}
                </li>
              ))}
        </ul>
      </div>

      <div className="h-fit rounded-[28px] border border-signal/30 bg-signal/[0.04] p-6 lg:sticky lg:top-24">
        <p className="eyebrow">Invite someone</p>
        {isOwner ? (
          <form onSubmit={invite} className="mt-4 flex flex-col gap-4">
            <Field label="Their email" htmlFor="t-email">
              <TextInput
                id="t-email"
                type="email"
                placeholder="name@samfredrobotics.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field label="Role">
              <div className="grid grid-cols-2 gap-2">
                {(["admin", "owner"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    aria-pressed={role === r}
                    className={cn(
                      "h-11 rounded-2xl border text-[13.5px] font-medium capitalize transition active:scale-95",
                      role === r ? "border-signal bg-signal text-ink" : "border-line bg-surface hover:border-fg/25",
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </Field>
            <Button type="submit" size="lg" block disabled={busy || !email}>
              {busy && <Loader2 className="animate-spin" />} Send invite
            </Button>
            <p className="text-[12.5px] leading-relaxed text-subtle">
              They get an email with a link to set their own password. The link works for one hour; if it expires they can
              use Forgot password on the sign in page.
            </p>
          </form>
        ) : (
          <p className="mt-3 text-[14px] text-subtle">Only owners can invite or remove people.</p>
        )}
      </div>
    </div>
  )
}
