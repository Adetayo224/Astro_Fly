"use client"
import { AnimatePresence, motion } from "framer-motion"
import { Loader2, MessageCircle, Search } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { Field, TextInput } from "@/components/booking/fields"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { deliverableLabels, formatEventDate, formatTime } from "@/lib/format"
import { formatNaira, site, whatsappLink } from "@/lib/site"
import { STATUS_LABEL, type Booking, type BookingEvent } from "@/lib/types"
import { cn } from "@/lib/utils"
import { StatusTimeline } from "./status-timeline"
import { BankDetailsCard } from "@/components/booking/bank-details"

type PublicBooking = Omit<Booking, "admin_note" | "flyer_path">
const STORE = "astrofly-last-booking"

export function BookingLookup() {
  const params = useSearchParams()
  const [email, setEmail] = useState("")
  const [reference, setReference] = useState(params.get("ref") ?? "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()
  const [result, setResult] = useState<{ booking: PublicBooking; events: BookingEvent[] } | null>(null)
  const auto = useRef(false)

  const lookup = async (em = email, ref = reference) => {
    setError(undefined)
    setLoading(true)
    try {
      const res = await fetch("/api/bookings/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: em, reference: ref }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setResult(json)
      try {
        localStorage.setItem(STORE, JSON.stringify({ email: em, reference: json.booking.reference }))
      } catch {}
    } catch (e) {
      setResult(null)
      setError(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  // Returning visitors: fill in the last booking they checked on this device.
  useEffect(() => {
    if (auto.current) return
    auto.current = true
    try {
      const saved = JSON.parse(localStorage.getItem(STORE) || "null")
      const ref = params.get("ref")
      if (saved?.email && (!ref || ref === saved.reference)) {
        // Syncing from localStorage, an external store, once on mount.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setEmail(saved.email)
        setReference(saved.reference)
        lookup(saved.email, saved.reference)
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const b = result?.booking
  const balance = b?.price ? Math.max(b.price - b.amount_paid, 0) : null
  const canPay = b && b.status !== "cancelled" && b.status !== "completed"

  return (
    <div className="grid gap-8 lg:grid-cols-[400px_1fr] lg:gap-12">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          lookup()
        }}
        noValidate
        className="brackets flex h-fit flex-col gap-5 rounded-[28px] border border-line bg-surface/60 p-6 lg:sticky lg:top-28"
      >
        <Field label="Email you booked with" htmlFor="lk-email">
          <TextInput
            id="lk-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="Booking reference" htmlFor="lk-ref" hint="It starts with AF and is in your confirmation email.">
          <TextInput
            id="lk-ref"
            placeholder="AF2026K7Q2"
            autoCapitalize="characters"
            value={reference}
            onChange={(e) => setReference(e.target.value.toUpperCase().replace(/\s/g, ""))}
            className="font-mono tracking-[0.12em]"
          />
        </Field>
        <AnimatePresence>
          {error && (
            <motion.p
              role="alert"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl border border-destructive/30 bg-destructive/8 p-3 text-[13px] text-destructive"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
        <Button type="submit" size="xl" block disabled={loading}>
          {loading ? <Loader2 className="animate-spin" /> : <Search />}
          Find my booking
        </Button>
      </form>

      <div className="min-h-[300px]">
        <AnimatePresence mode="wait" initial={false}>
          {loading && !b ? (
            <motion.div key="sk" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-4">
              <Skeleton className="h-28 rounded-[28px]" />
              <Skeleton className="h-64 rounded-[28px]" />
              <Skeleton className="h-40 rounded-[28px]" />
            </motion.div>
          ) : b ? (
            <motion.div
              key={b.reference}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 26 }}
              className="flex flex-col gap-4"
            >
              <div className="rounded-[28px] border border-line bg-surface p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-[11px] tracking-[0.2em] text-subtle">REFERENCE</p>
                    <p className="mt-1 font-mono text-[26px] font-semibold tracking-[0.1em] text-signal-ink">{b.reference}</p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-3 py-1.5 font-mono text-[11px] font-semibold tracking-[0.14em] uppercase",
                      b.status === "cancelled" ? "bg-destructive/15 text-destructive" : "bg-signal/15 text-signal-ink",
                    )}
                  >
                    {STATUS_LABEL[b.status]}
                  </span>
                </div>
                <p className="mt-4 text-[15px]">
                  {b.event_type} on <span className="font-semibold">{formatEventDate(b.event_date)}</span> at{" "}
                  {formatTime(b.start_time)}
                </p>
                <p className="mt-1 text-[14px] text-subtle">
                  {b.venue_name}, {b.city}, {b.state}
                </p>
              </div>

              <div className="rounded-[28px] border border-line bg-surface p-6">
                <p className="eyebrow mb-5">Progress</p>
                <StatusTimeline status={b.status} events={result!.events} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[28px] border border-line bg-surface p-6">
                  <p className="eyebrow">Payment</p>
                  <dl className="mt-4 grid gap-3 text-[14px]">
                    <div className="flex justify-between">
                      <dt className="text-subtle">Price</dt>
                      <dd className="font-semibold">{b.price ? formatNaira(b.price) : "To be confirmed"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-subtle">Paid</dt>
                      <dd className="font-mono">{formatNaira(b.amount_paid)}</dd>
                    </div>
                    {balance !== null && (
                      <div className="flex justify-between border-t border-line pt-3">
                        <dt className="text-subtle">Balance</dt>
                        <dd className="font-mono font-semibold">{formatNaira(balance)}</dd>
                      </div>
                    )}
                  </dl>
                  {canPay && !b.price && b.amount_paid === 0 && (
                    <p className="mt-4 text-[13px] leading-relaxed text-subtle">
                      Your price is on the way. You can hold the date now with a {formatNaira(site.depositNaira)}{" "}
                      deposit using the bank details below.
                    </p>
                  )}
                </div>
                <div className="rounded-[28px] border border-line bg-surface p-6">
                  <p className="eyebrow">Shoot</p>
                  <dl className="mt-4 grid gap-3 text-[14px]">
                    <div className="flex justify-between gap-4">
                      <dt className="text-subtle">Drone</dt>
                      <dd className="font-semibold">{b.drone_name}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-subtle">Duration</dt>
                      <dd>{b.duration === "Custom" ? b.custom_duration : b.duration}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="shrink-0 text-subtle">You want</dt>
                      <dd className="text-right">{deliverableLabels(b.deliverables).join(", ")}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              {canPay && ((balance !== null && balance > 0) || (!b.price && b.amount_paid === 0)) && (
                <BankDetailsCard
                  reference={b.reference}
                  amount={balance !== null && balance > 0 ? balance : site.depositNaira}
                  title={balance !== null && balance > 0 ? "Pay your balance" : "Hold your date with a deposit"}
                />
              )}

              <a
                href={whatsappLink(`Hello Astro_Fly, I have a question about my booking ${b.reference}.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-14 items-center justify-center gap-2 rounded-full border border-line bg-surface text-[15px] font-semibold transition hover:border-signal/50 active:scale-[0.98]"
              >
                <MessageCircle className="size-[18px] text-signal-ink" />
                Ask about this booking on WhatsApp
              </a>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative grid h-full min-h-[320px] place-items-center overflow-hidden rounded-[28px] border border-dashed border-fg/15 p-8 text-center"
            >
              <div className="relative max-w-sm">
                <div className="mx-auto grid size-16 place-items-center rounded-full border border-line">
                  <span className="size-3 animate-pulse rounded-full bg-signal shadow-[0_0_16px_#00ff85]" />
                </div>
                <p className="mt-5 text-[18px] font-semibold">Your booking will show here</p>
                <p className="mt-2 text-[14px] leading-relaxed text-subtle">
                  Enter your email and reference to see the status, your price and what happens next.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
