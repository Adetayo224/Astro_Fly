"use client"
import { zodResolver } from "@hookform/resolvers/zod"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowLeft, ArrowRight, CalendarClock, Clock, Loader2, Minus, Pencil, Plus, UserRound, UsersRound } from "lucide-react"
import Image from "next/image"
import { useEffect, useMemo, useRef, useState } from "react"
import { Controller, useForm, type Resolver } from "react-hook-form"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  bookingSchema,
  DELIVERABLES,
  EVENT_TYPES,
  NIGERIAN_STATES,
  SETTINGS,
  STEP_FIELDS,
  stepSchemas,
  type BookingInput,
} from "@/lib/booking-schema"
import { deliverableLabels, formatEventDate, formatTime } from "@/lib/format"
import { FULL_DAY, MAX_HOURS, bookingTotal, formatNaira, hoursFrom, hoursLabel, shootPrice, upfrontNaira } from "@/lib/site"
import type { Drone } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useBooking } from "./booking-provider"
import { Calendar, TimePicker } from "./date-time"
import { CheckRow, Chip, Field, Segmented, SelectInput, TextArea, TextInput } from "./fields"
import { SuccessScreen, type SuccessData } from "./success-screen"

const STEPS = ["Your details", "Your event", "Shoot needs", "Review and pay"] as const

const DEFAULTS: BookingInput = {
  full_name: "",
  email: "",
  phone: "+234 ",
  whatsapp_same: true,
  whatsapp: "+234 ",
  event_type: "",
  event_date: "",
  start_time: "",
  duration: "",
  custom_duration: "",
  venue_name: "",
  address: "",
  city: "",
  state: "",
  setting: undefined as unknown as "outdoor",
  drone_slug: "",
  deliverables: [],
  has_pilot: undefined as unknown as "yes",
  notes: "",
  pay_option: "later",
  terms: false,
}

/** Draft kept in memory so closing the sheet by accident does not lose progress. */
const draft: { values: Partial<BookingInput> | null; step: number } = {
  values: null,
  step: 0,
}
export function clearBookingDraft() {
  draft.values = null
  draft.step = 0
}

export function BookingFlow({
  drones,
  initialDrone,
  onDone,
  onClose,
}: {
  drones: Drone[]
  initialDrone?: string
  onDone?: () => void
  onClose?: () => void
}) {
  const { pricing } = useBooking()
  const available = useMemo(() => drones.filter((d) => d.status === "available"), [drones])
  const [step, setStep] = useState(draft.step)
  const [dir, setDir] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState<SuccessData | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const stepRef = useRef(0)
  stepRef.current = step

  const resolver: Resolver<BookingInput> = (values, ctx, opts) =>
    (zodResolver(stepSchemas[stepRef.current] as never) as unknown as Resolver<BookingInput>)(values, ctx, opts)

  const form = useForm<BookingInput>({
    defaultValues: {
      ...DEFAULTS,
      drone_slug: available[0]?.slug ?? "",
      ...draft.values,
      ...(initialDrone && available.some((d) => d.slug === initialDrone) ? { drone_slug: initialDrone } : {}),
    },
    resolver,
    mode: "onTouched",
  })
  const { register, control, watch, formState, trigger, getValues } = form
  const errors = formState.errors

  // Keep the draft in sync while the flow is open.
  useEffect(() => {
    const sub = form.watch((values, { name }) => {
      draft.values = values as Partial<BookingInput>
      // Clear an error as soon as the person fixes that field (chips, calendar, pickers)
      if (name && form.getFieldState(name as keyof BookingInput).error) void form.trigger(name as keyof BookingInput)
    })
    return () => sub.unsubscribe()
  }, [form])
  useEffect(() => {
    draft.step = step
  }, [step])

  const whatsappSame = watch("whatsapp_same")
  const duration = watch("duration")
  const hasPilot = watch("has_pilot")
  const total = bookingTotal(duration || "", hasPilot === "no", pricing)
  const dueNow = upfrontNaira(hasPilot === "no", pricing, total)

  const scrollTop = () => scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })

  const go = async (next: number) => {
    if (next > step) {
      const ok = await trigger(STEP_FIELDS[step] as unknown as (keyof BookingInput)[], { shouldFocus: true })
      let extraOk = true
      // Cross field checks shown alongside the other errors on this step
      if (step === 0 && !getValues("whatsapp_same") && !/^\+?\d{10,15}$/.test((getValues("whatsapp") || "").replace(/[\s()]/g, ""))) {
        form.setError("whatsapp", { message: "Enter a valid WhatsApp number" })
        extraOk = false
      }
      if (!ok || !extraOk) {
        requestAnimationFrame(() => {
          scrollRef.current?.querySelector('[aria-invalid="true"], [role="alert"]')?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          })
        })
        return
      }
    }
    setDir(next > step ? 1 : -1)
    setStep(next)
    scrollTop()
  }

  const submit = async () => {
    const ok = await trigger(STEP_FIELDS[3] as unknown as (keyof BookingInput)[])
    if (!ok) {
      requestAnimationFrame(() =>
        scrollRef.current?.querySelector('[role="alert"]')?.scrollIntoView({ behavior: "smooth", block: "center" }),
      )
      return
    }
    const parsed = bookingSchema.safeParse(getValues())
    if (!parsed.success) {
      const first = parsed.error.issues[0]
      const target = STEP_FIELDS.findIndex((f) => (f as readonly string[]).includes(String(first.path[0])))
      toast.error(first.message)
      if (target >= 0 && target !== 3) {
        setDir(-1)
        setStep(target)
        setTimeout(() => trigger(STEP_FIELDS[target] as unknown as (keyof BookingInput)[]), 50)
      }
      return
    }
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.set("payload", JSON.stringify(getValues()))
      const res = await fetch("/api/bookings", { method: "POST", body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Something went wrong")
      setSuccess({
        reference: json.reference,
        email: json.email,
        payOption: json.pay_option,
        amountDue: json.amount_due,
        needsPilot: json.needs_pilot,
        name: parsed.data.full_name.split(" ")[0],
      })
      clearBookingDraft()
      onDone?.()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "We could not send your booking. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (success) return <SuccessScreen data={success} onClose={onClose} />

  const v = getValues()
  const drone = drones.find((d) => d.slug === v.drone_slug)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Progress */}
      <div className="shrink-0 px-5 pt-1 pb-4">
        <div className="mb-3 flex items-center justify-between">
          <AnimatePresence mode="wait" initial={false}>
            <motion.h3
              key={step}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="text-[22px] font-semibold"
            >
              {STEPS[step]}
            </motion.h3>
          </AnimatePresence>
          <span className="font-mono text-[11px] tracking-[0.16em] text-subtle">
            STEP {step + 1}/{STEPS.length}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-1.5" aria-hidden>
          {STEPS.map((_, i) => (
            <div key={i} className="h-1 overflow-hidden rounded-full bg-fg/10">
              <motion.div
                className="h-full rounded-full bg-signal shadow-[0_0_12px_rgba(0,255,133,.8)]"
                initial={false}
                animate={{ width: i <= step ? "100%" : "0%" }}
                transition={{ type: "spring", stiffness: 140, damping: 22, delay: i === step ? 0.05 : 0 }}
              />
            </div>
          ))}
        </div>
      </div>

      <div ref={scrollRef} data-lenis-prevent className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <form onSubmit={(e) => e.preventDefault()} noValidate className="px-5 pb-8">
          <AnimatePresence mode="wait" initial={false} custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              initial={{ opacity: 0, x: dir * 28 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir * -28 }}
              transition={{ type: "spring", stiffness: 420, damping: 40 }}
              className="flex flex-col gap-6"
            >
              {step === 0 && (
                <>
                  <p className="text-[14.5px] leading-relaxed text-subtle">
                    Tell us who you are so we can confirm the shoot with you directly.
                  </p>
                  <Field label="Full name" htmlFor="full_name" error={errors.full_name?.message}>
                    <TextInput
                      id="full_name"
                      autoComplete="name"
                      placeholder="Adaeze Okafor"
                      invalid={!!errors.full_name}
                      {...register("full_name")}
                    />
                  </Field>
                  <Field label="Email" htmlFor="email" error={errors.email?.message} hint="We send your booking reference here.">
                    <TextInput
                      id="email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      invalid={!!errors.email}
                      {...register("email")}
                    />
                  </Field>
                  <Field label="Phone number" htmlFor="phone" error={errors.phone?.message}>
                    <TextInput
                      id="phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      invalid={!!errors.phone}
                      {...register("phone")}
                    />
                  </Field>
                  <Controller
                    control={control}
                    name="whatsapp_same"
                    render={({ field }) => (
                      <CheckRow checked={!!field.value} onChange={field.onChange}>
                        My WhatsApp number is the same as my phone
                      </CheckRow>
                    )}
                  />
                  <AnimatePresence initial={false}>
                    {!whatsappSame && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <Field label="WhatsApp number" htmlFor="whatsapp" error={errors.whatsapp?.message}>
                          <TextInput
                            id="whatsapp"
                            type="tel"
                            inputMode="tel"
                            invalid={!!errors.whatsapp}
                            {...register("whatsapp")}
                          />
                        </Field>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}

              {step === 1 && (
                <>
                  <Controller
                    control={control}
                    name="event_type"
                    render={({ field }) => (
                      <Field label="What are we shooting?" error={errors.event_type?.message}>
                        <div role="radiogroup" className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-2">
                          {EVENT_TYPES.map((t) => (
                            <Chip key={t} selected={field.value === t} onClick={() => field.onChange(t)}>
                              {t}
                            </Chip>
                          ))}
                        </div>
                      </Field>
                    )}
                  />
                  <Controller
                    control={control}
                    name="event_date"
                    render={({ field }) => (
                      <Field
                        label="Event date"
                        error={errors.event_date?.message}
                        hint={field.value ? formatEventDate(field.value) : undefined}
                      >
                        <Calendar value={field.value} onChange={field.onChange} invalid={!!errors.event_date} />
                      </Field>
                    )}
                  />
                  <Controller
                    control={control}
                    name="start_time"
                    render={({ field }) => (
                      <Field label="Start time" error={errors.start_time?.message}>
                        <TimePicker value={field.value} onChange={field.onChange} invalid={!!errors.start_time} />
                      </Field>
                    )}
                  />
                  <Controller
                    control={control}
                    name="duration"
                    render={({ field }) => {
                      const hours = hoursFrom(field.value || "")
                      const plans = [
                        {
                          id: "full",
                          on: field.value === FULL_DAY,
                          icon: <CalendarClock className="size-5" />,
                          title: "Full day",
                          body: "We cover the whole event, however long it runs.",
                          price: formatNaira(pricing.fullDayNaira),
                          pick: () => field.onChange(FULL_DAY),
                        },
                        {
                          id: "hourly",
                          on: hours !== null,
                          icon: <Clock className="size-5" />,
                          title: "By the hour",
                          body: `${formatNaira(pricing.hourlyNaira)} per hour, minimum ${hoursLabel(pricing.minHours)} (${formatNaira(pricing.hourlyNaira * pricing.minHours)}).`,
                          price: `${formatNaira(pricing.hourlyNaira)}/hr`,
                          pick: () => hours === null && field.onChange(hoursLabel(pricing.minHours)),
                        },
                      ]
                      const setHours = (h: number) => field.onChange(hoursLabel(Math.min(MAX_HOURS, Math.max(1, h))))
                      const hourly = hours !== null ? shootPrice(field.value, pricing) : null
                      return (
                        <Field label="How would you like to book?" error={errors.duration?.message}>
                          <div role="radiogroup" className="grid gap-2.5 sm:grid-cols-2">
                            {plans.map((o) => (
                              <button
                                key={o.id}
                                type="button"
                                role="radio"
                                aria-checked={o.on}
                                onClick={o.pick}
                                className={cn(
                                  "flex flex-col gap-2 rounded-2xl border p-4 text-left transition-colors active:scale-[0.99]",
                                  o.on ? "border-signal bg-signal/8" : "border-line bg-surface/50 hover:border-fg/25",
                                  errors.duration && !o.on && "border-destructive/60",
                                )}
                              >
                                <span className="flex items-center justify-between gap-2">
                                  <span className={cn("text-subtle", o.on && "text-signal-ink")}>{o.icon}</span>
                                  <span className="font-mono text-[13px] font-semibold">{o.price}</span>
                                </span>
                                <span className="text-[15px] font-semibold">{o.title}</span>
                                <span className="text-[12.5px] leading-relaxed text-subtle">{o.body}</span>
                              </button>
                            ))}
                          </div>
                          <AnimatePresence initial={false}>
                            {hours !== null && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="mt-1 flex items-center gap-3 rounded-2xl border border-line bg-surface/60 p-3">
                                  <Button variant="outline" size="icon" aria-label="Fewer hours" onClick={() => setHours(hours - 1)} disabled={hours <= 1}>
                                    <Minus />
                                  </Button>
                                  <div className="flex-1 text-center">
                                    <p className="font-heading text-[20px] font-semibold tabular-nums">{hoursLabel(hours)}</p>
                                    <p className="text-[12.5px] text-subtle">{formatNaira(hourly ?? 0)}</p>
                                  </div>
                                  <Button variant="outline" size="icon" aria-label="More hours" onClick={() => setHours(hours + 1)} disabled={hours >= MAX_HOURS}>
                                    <Plus />
                                  </Button>
                                </div>
                                {hours < pricing.minHours && (
                                  <p className="mt-2 text-[12.5px] leading-relaxed text-subtle">
                                    Bookings under {hoursLabel(pricing.minHours)} pay the minimum of{" "}
                                    {formatNaira(pricing.hourlyNaira * pricing.minHours)}.
                                  </p>
                                )}
                                {hourly === pricing.fullDayNaira && hours * pricing.hourlyNaira >= pricing.fullDayNaira && (
                                  <p className="mt-2 text-[12.5px] leading-relaxed text-signal-ink">
                                    This is the same as the full day price, so we will cover the whole event.
                                  </p>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </Field>
                      )
                    }}
                  />
                  <Field label="Venue name" htmlFor="venue_name" error={errors.venue_name?.message}>
                    <TextInput
                      id="venue_name"
                      placeholder="Event centre, church or hall"
                      invalid={!!errors.venue_name}
                      {...register("venue_name")}
                    />
                  </Field>
                  <Field label="Full address" htmlFor="address" error={errors.address?.message}>
                    <TextInput
                      id="address"
                      autoComplete="street-address"
                      placeholder="Street and area"
                      invalid={!!errors.address}
                      {...register("address")}
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="City" htmlFor="city" error={errors.city?.message}>
                      <TextInput
                        id="city"
                        autoComplete="address-level2"
                        placeholder="Ogbomoso"
                        invalid={!!errors.city}
                        {...register("city")}
                      />
                    </Field>
                    <Field label="State" htmlFor="state" error={errors.state?.message}>
                      <SelectInput id="state" invalid={!!errors.state} {...register("state")}>
                        <option value="">Choose</option>
                        {NIGERIAN_STATES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </SelectInput>
                    </Field>
                  </div>
                  <Controller
                    control={control}
                    name="setting"
                    render={({ field }) => (
                      <Field label="Indoor or outdoor?" error={errors.setting?.message}>
                        <Segmented
                          value={field.value}
                          onChange={field.onChange}
                          options={SETTINGS}
                          invalid={!!errors.setting}
                        />
                      </Field>
                    )}
                  />
                </>
              )}

              {step === 2 && (
                <>
                  <Controller
                    control={control}
                    name="drone_slug"
                    render={({ field }) => (
                      <Field label="Drone" error={errors.drone_slug?.message}>
                        <div role="radiogroup" className="grid gap-2.5">
                          {available.map((d) => {
                            const selected = field.value === d.slug
                            return (
                              <button
                                key={d.slug}
                                type="button"
                                role="radio"
                                aria-checked={selected}
                                onClick={() => field.onChange(d.slug)}
                                className={cn(
                                  "flex items-center gap-4 rounded-2xl border p-3 pr-4 text-left transition-[border-color,background-color,transform] active:scale-[0.99]",
                                  selected ? "border-signal bg-signal/8" : "border-line bg-surface/60 hover:border-fg/25",
                                )}
                              >
                                <div className="relative h-16 w-20 shrink-0 rounded-xl bg-gradient-to-b from-fg/[0.06] to-transparent">
                                  <Image src={d.image} alt="" fill sizes="80px" className="object-contain p-1" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="font-heading text-[15px] font-semibold">{d.name}</p>
                                  <p className="mt-0.5 truncate font-mono text-[11px] text-subtle">
                                    {d.video} · {d.flight_time}
                                  </p>
                                </div>
                                <span
                                  className={cn(
                                    "grid size-5 shrink-0 place-items-center rounded-full border-2 transition-colors",
                                    selected ? "border-signal" : "border-fg/25",
                                  )}
                                >
                                  {selected && <motion.span layoutId="drone-dot" className="size-2.5 rounded-full bg-signal" />}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      </Field>
                    )}
                  />
                  <Controller
                    control={control}
                    name="deliverables"
                    render={({ field }) => (
                      <Field label="What do you want from the shoot?" error={errors.deliverables?.message}>
                        <div className="grid grid-cols-2 gap-2">
                          {DELIVERABLES.map((d) => {
                            const on = field.value?.includes(d.id)
                            return (
                              <Chip
                                key={d.id}
                                multi
                                selected={!!on}
                                className="justify-start text-left"
                                onClick={() =>
                                  field.onChange(on ? field.value.filter((x) => x !== d.id) : [...(field.value || []), d.id])
                                }
                              >
                                {d.label}
                              </Chip>
                            )
                          })}
                        </div>
                      </Field>
                    )}
                  />
                  <Controller
                    control={control}
                    name="has_pilot"
                    render={({ field }) => (
                      <Field
                        label="Do you have your own drone pilot?"
                        error={errors.has_pilot?.message}
                        hint="If not, we match you with one of our pilots and introduce them to you before the event."
                      >
                        <div role="radiogroup" className="grid gap-2.5">
                          {[
                            {
                              id: "yes" as const,
                              icon: UserRound,
                              title: "Yes, I have my own pilot",
                              body: "Your pilot flies our drone on the day.",
                              fee: null,
                            },
                            {
                              id: "no" as const,
                              icon: UsersRound,
                              title: "No, match me with an Astro_Fly pilot",
                              body: "We pick a trained pilot for your event and send you their name and number.",
                              fee: `+${formatNaira(pricing.pilotFeeNaira)}`,
                            },
                          ].map((o) => {
                            const on = field.value === o.id
                            const Icon = o.icon
                            return (
                              <button
                                key={o.id}
                                type="button"
                                role="radio"
                                aria-checked={on}
                                onClick={() => field.onChange(o.id)}
                                className={cn(
                                  "flex items-start gap-3 rounded-2xl border p-4 text-left transition-colors active:scale-[0.99]",
                                  on
                                    ? "border-signal bg-signal/8"
                                    : errors.has_pilot
                                      ? "border-destructive/60"
                                      : "border-line bg-surface/50 hover:border-fg/25",
                                )}
                              >
                                <span
                                  className={cn(
                                    "grid size-10 shrink-0 place-items-center rounded-xl transition-colors",
                                    on ? "bg-signal text-ink" : "bg-surface-2 text-fg/70",
                                  )}
                                >
                                  <Icon className="size-5" />
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="flex items-start justify-between gap-3">
                                    <span className="text-[14.5px] font-semibold">{o.title}</span>
                                    {o.fee && <span className="shrink-0 font-mono text-[12.5px] text-signal-ink">{o.fee}</span>}
                                  </span>
                                  <span className="mt-1 block text-[13px] leading-relaxed text-subtle">{o.body}</span>
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      </Field>
                    )}
                  />
                  <Field label="Anything else we should know?" htmlFor="notes" optional>
                    <TextArea
                      id="notes"
                      placeholder="Key moments to catch, parking, programme timings"
                      {...register("notes")}
                    />
                  </Field>
                </>
              )}

              {step === 3 && (
                <>
                  <Summary title="You" onEdit={() => go(0)}>
                    <Row k="Name" v={v.full_name} />
                    <Row k="Email" v={v.email} />
                    <Row k="Phone" v={v.phone} />
                    <Row k="WhatsApp" v={v.whatsapp_same ? v.phone : v.whatsapp || ""} />
                  </Summary>
                  <Summary title="Event" onEdit={() => go(1)}>
                    <Row k="Type" v={v.event_type} />
                    <Row k="Date" v={formatEventDate(v.event_date)} />
                    <Row k="Start" v={formatTime(v.start_time)} />
                    <Row k="Booked for" v={v.duration === FULL_DAY ? "Full day" : `${v.duration}, by the hour`} />
                    <Row k="Venue" v={`${v.venue_name}, ${v.address}, ${v.city}, ${v.state}`} />
                    <Row k="Setting" v={SETTINGS.find((s) => s.id === v.setting)?.label ?? ""} />
                  </Summary>
                  <Summary title="Shoot" onEdit={() => go(2)}>
                    <Row k="Drone" v={drone?.name ?? ""} />
                    <Row k="Deliverables" v={deliverableLabels(v.deliverables || []).join(", ")} />
                    <Row
                      k="Pilot"
                      v={v.has_pilot === "no" ? `Astro_Fly pilot (+${formatNaira(pricing.pilotFeeNaira)})` : "My own pilot"}
                    />
                    {v.notes ? <Row k="Notes" v={v.notes} /> : null}
                  </Summary>

                  <div className="brackets rounded-3xl border border-line bg-surface/60 p-5">
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <p className="eyebrow">Your price</p>
                        <p className="mt-2 font-heading text-[30px] font-semibold tracking-tight tabular-nums">
                          {total !== null ? formatNaira(total) : "Choose how long"}
                        </p>
                      </div>
                    </div>
                    <dl className="mt-3 flex flex-col gap-1.5 text-[13.5px]">
                      <div className="flex justify-between gap-3">
                        <dt className="text-subtle">{v.duration === FULL_DAY ? "Full day" : `${v.duration || ""} by the hour`}</dt>
                        <dd className="font-mono tabular-nums">{formatNaira(shootPrice(v.duration || "", pricing) ?? 0)}</dd>
                      </div>
                      {v.has_pilot === "no" && (
                        <div className="flex justify-between gap-3">
                          <dt className="text-subtle">Astro_Fly pilot</dt>
                          <dd className="font-mono tabular-nums">{formatNaira(pricing.pilotFeeNaira)}</dd>
                        </div>
                      )}
                    </dl>
                    <p className="mt-3 text-[13px] leading-relaxed text-subtle">
                      We confirm your date by email and WhatsApp within 24 hours.
                    </p>
                  </div>

                  <Controller
                    control={control}
                    name="pay_option"
                    render={({ field }) => (
                      <Field label="How would you like to pay?">
                        <div role="radiogroup" className="grid gap-2.5">
                          {[
                            {
                              id: "deposit" as const,
                              title: `Pay ${formatNaira(dueNow)} now`,
                              body:
                                hasPilot === "no"
                                  ? `${formatNaira(pricing.depositNaira)} to hold your date plus ${formatNaira(pricing.pilotFeeNaira)} for your pilot, by bank transfer to Samfred Robotics. We confirm it by email.`
                                  : "By bank transfer to Samfred Robotics. Your date is held once we confirm it by email, and it comes off your total.",
                            },
                            {
                              id: "later" as const,
                              title: "Pay after we confirm",
                              body: "Book now and pay by bank transfer once we confirm your date. Your date is held once payment comes in.",
                            },
                          ].map((o) => {
                            const on = field.value === o.id
                            return (
                              <button
                                key={o.id}
                                type="button"
                                role="radio"
                                aria-checked={on}
                                onClick={() => field.onChange(o.id)}
                                className={cn(
                                  "flex gap-3 rounded-2xl border p-4 text-left transition-colors active:scale-[0.99]",
                                  on ? "border-signal bg-signal/8" : "border-line bg-surface/50 hover:border-fg/25",
                                )}
                              >
                                <span
                                  className={cn(
                                    "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2",
                                    on ? "border-signal" : "border-fg/25",
                                  )}
                                >
                                  {on && <motion.span layoutId="pay-dot" className="size-2.5 rounded-full bg-signal" />}
                                </span>
                                <span>
                                  <span className="block text-[14.5px] font-semibold">{o.title}</span>
                                  <span className="mt-1 block text-[13px] leading-relaxed text-subtle">{o.body}</span>
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      </Field>
                    )}
                  />

                  <Controller
                    control={control}
                    name="terms"
                    render={({ field }) => (
                      <div className="flex flex-col gap-2">
                        <CheckRow
                          checked={!!field.value}
                          onChange={field.onChange}
                          invalid={!!errors.terms}
                          description="Flights depend on weather and airspace rules. If we cannot fly safely on the day, we agree the next step with you. Your final price and payment terms are confirmed in writing before the shoot."
                        >
                          I agree to the booking terms
                        </CheckRow>
                        {errors.terms && (
                          <p role="alert" className="text-[12.5px] text-destructive">
                            {errors.terms.message}
                          </p>
                        )}
                      </div>
                    )}
                  />
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </form>
      </div>

      {/* Sticky action bar */}
      <div className="shrink-0 border-t border-line bg-bg/90 px-5 pt-3 pb-[max(env(safe-area-inset-bottom),14px)] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          {step > 0 && (
            <Button variant="subtle" size="xl" className="px-5" onClick={() => go(step - 1)} aria-label="Back">
              <ArrowLeft />
            </Button>
          )}
          {step < 3 ? (
            <Button size="xl" className="min-w-0 flex-1" onClick={() => go(step + 1)}>
              Continue
              <ArrowRight />
            </Button>
          ) : (
            <Button size="xl" className="min-w-0 flex-1" onClick={submit} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" /> Sending your booking
                </>
              ) : (
                "Book Now"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function Summary({ title, onEdit, children }: { title: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-line bg-surface/50 p-5">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="font-mono text-[11px] font-medium tracking-[0.18em] text-subtle uppercase">{title}</h4>
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12.5px] font-medium text-signal-ink transition hover:bg-signal/10 active:scale-95"
        >
          <Pencil className="size-3.5" /> Edit
        </button>
      </div>
      <dl className="divide-y divide-line">{children}</dl>
    </section>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-6 py-2.5 text-[14px]">
      <dt className="shrink-0 text-subtle">{k}</dt>
      <dd className="text-right font-medium break-words">{v}</dd>
    </div>
  )
}
