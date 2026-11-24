"use client"
import { zodResolver } from "@hookform/resolvers/zod"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowLeft, ArrowRight, FileText, ImageUp, Loader2, Lock, Pencil, X } from "lucide-react"
import Image from "next/image"
import { useEffect, useMemo, useRef, useState } from "react"
import { Controller, useForm, type Resolver } from "react-hook-form"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  bookingSchema,
  DELIVERABLES,
  DURATIONS,
  EVENT_TYPES,
  FLYER_MAX_BYTES,
  FLYER_TYPES,
  GUEST_RANGES,
  NIGERIAN_STATES,
  SETTINGS,
  STEP_FIELDS,
  stepSchemas,
  type BookingInput,
} from "@/lib/booking-schema"
import { deliverableLabels, formatEventDate, formatTime } from "@/lib/format"
import { formatNaira, site } from "@/lib/site"
import type { Drone } from "@/lib/types"
import { cn } from "@/lib/utils"
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
  guests: "",
  drone_slug: "",
  deliverables: [],
  has_flyer: undefined as unknown as "yes",
  design_flyer: false,
  flyer_details: "",
  notes: "",
  pay_option: "later",
  terms: false,
}

/** Draft kept in memory so closing the sheet by accident does not lose progress. */
const draft: { values: Partial<BookingInput> | null; step: number; flyer: File | null } = {
  values: null,
  step: 0,
  flyer: null,
}
export function clearBookingDraft() {
  draft.values = null
  draft.step = 0
  draft.flyer = null
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
  const available = useMemo(() => drones.filter((d) => d.status === "available"), [drones])
  const [step, setStep] = useState(draft.step)
  const [dir, setDir] = useState(1)
  const [flyer, setFlyer] = useState<File | null>(draft.flyer)
  const [flyerError, setFlyerError] = useState<string>()
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
    const sub = form.watch((values) => {
      draft.values = values as Partial<BookingInput>
    })
    return () => sub.unsubscribe()
  }, [form])
  useEffect(() => {
    draft.step = step
  }, [step])
  useEffect(() => {
    draft.flyer = flyer
  }, [flyer])

  const whatsappSame = watch("whatsapp_same")
  const duration = watch("duration")
  const hasFlyer = watch("has_flyer")
  const designFlyer = watch("design_flyer")

  const scrollTop = () => scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })

  const go = async (next: number) => {
    if (next > step) {
      const ok = await trigger(STEP_FIELDS[step] as unknown as (keyof BookingInput)[], { shouldFocus: true })
      let flyerOk = true
      // Cross field checks shown alongside the other errors on this step
      if (step === 0 && !getValues("whatsapp_same") && !/^\+?\d{10,15}$/.test((getValues("whatsapp") || "").replace(/[\s()]/g, ""))) {
        form.setError("whatsapp", { message: "Enter a valid WhatsApp number" })
        flyerOk = false
      }
      if (step === 1 && getValues("duration") === "Custom" && !getValues("custom_duration")?.trim()) {
        form.setError("custom_duration", { message: "Tell us how long you need" })
        flyerOk = false
      }
      if (step === 2 && getValues("has_flyer") === "no" && getValues("design_flyer") && !getValues("flyer_details")?.trim()) {
        form.setError("flyer_details", { message: "Tell us what to put on the flyer" })
        flyerOk = false
      }
      if (step === 2 && getValues("has_flyer") === "yes" && !flyer) {
        setFlyerError("Attach your flyer, or choose No")
        flyerOk = false
      }
      if (!ok || !flyerOk) {
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
      if (parsed.data.has_flyer === "yes" && flyer) fd.set("flyer", flyer)
      const res = await fetch("/api/bookings", { method: "POST", body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Something went wrong")
      setSuccess({
        reference: json.reference,
        email: json.email,
        payOption: json.pay_option,
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

  const pickFlyer = (f: File | undefined) => {
    setFlyerError(undefined)
    if (!f) return
    if (!FLYER_TYPES.includes(f.type)) return setFlyerError("Use a JPG, PNG, WEBP, HEIC image or a PDF")
    if (f.size > FLYER_MAX_BYTES) return setFlyerError("That file is over 10 MB. Try a smaller one")
    setFlyer(f)
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
                    render={({ field }) => (
                      <Field label="How long should we fly?" error={errors.duration?.message}>
                        <div role="radiogroup" className="grid grid-cols-3 gap-2">
                          {DURATIONS.map((d) => (
                            <Chip key={d} selected={field.value === d} onClick={() => field.onChange(d)}>
                              {d}
                            </Chip>
                          ))}
                        </div>
                      </Field>
                    )}
                  />
                  <AnimatePresence initial={false}>
                    {duration === "Custom" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <Field label="Custom duration" htmlFor="custom_duration" error={errors.custom_duration?.message}>
                          <TextInput
                            id="custom_duration"
                            placeholder="For example, 5 hours or two days"
                            invalid={!!errors.custom_duration}
                            {...register("custom_duration")}
                          />
                        </Field>
                      </motion.div>
                    )}
                  </AnimatePresence>
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
                  <Controller
                    control={control}
                    name="guests"
                    render={({ field }) => (
                      <Field label="Roughly how many guests?" error={errors.guests?.message}>
                        <div role="radiogroup" className="flex flex-wrap gap-2">
                          {GUEST_RANGES.map((g) => (
                            <Chip key={g} selected={field.value === g} onClick={() => field.onChange(g)} className="flex-1 basis-[30%]">
                              {g}
                            </Chip>
                          ))}
                        </div>
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
                    name="has_flyer"
                    render={({ field }) => (
                      <Field
                        label="Do you have an event flyer?"
                        error={errors.has_flyer?.message}
                        hint="It helps the pilot plan around your programme."
                      >
                        <Segmented
                          value={field.value}
                          onChange={(v) => {
                            field.onChange(v)
                            setFlyerError(undefined)
                          }}
                          options={[
                            { id: "yes", label: "Yes, I have one" },
                            { id: "no", label: "No" },
                          ]}
                          invalid={!!errors.has_flyer}
                        />
                      </Field>
                    )}
                  />
                  <AnimatePresence mode="wait" initial={false}>
                    {hasFlyer === "yes" && (
                      <motion.div key="yes" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <FlyerDrop file={flyer} onPick={pickFlyer} onClear={() => setFlyer(null)} error={flyerError} />
                      </motion.div>
                    )}
                    {hasFlyer === "no" && (
                      <motion.div
                        key="no"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col gap-4"
                      >
                        <Controller
                          control={control}
                          name="design_flyer"
                          render={({ field }) => (
                            <CheckRow
                              checked={!!field.value}
                              onChange={field.onChange}
                              description="Our designer will make one and send it to you for approval."
                            >
                              Please design a flyer for me
                            </CheckRow>
                          )}
                        />
                        <AnimatePresence initial={false}>
                          {designFlyer && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <Field label="What should the flyer say?" htmlFor="flyer_details" error={errors.flyer_details?.message}>
                                <TextArea
                                  id="flyer_details"
                                  placeholder="Names, date, venue, colours, dress code, hashtag, anything you want on it"
                                  invalid={!!errors.flyer_details}
                                  {...register("flyer_details")}
                                />
                              </Field>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}
                  </AnimatePresence>
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
                    <Row k="Duration" v={v.duration === "Custom" ? v.custom_duration || "Custom" : v.duration} />
                    <Row k="Venue" v={`${v.venue_name}, ${v.address}, ${v.city}, ${v.state}`} />
                    <Row k="Setting" v={SETTINGS.find((s) => s.id === v.setting)?.label ?? ""} />
                    <Row k="Guests" v={v.guests} />
                  </Summary>
                  <Summary title="Shoot" onEdit={() => go(2)}>
                    <Row k="Drone" v={drone?.name ?? ""} />
                    <Row k="Deliverables" v={deliverableLabels(v.deliverables || []).join(", ")} />
                    <Row
                      k="Flyer"
                      v={v.has_flyer === "yes" ? flyer?.name ?? "Attached" : v.design_flyer ? "Please design one" : "No flyer"}
                    />
                    {v.notes ? <Row k="Notes" v={v.notes} /> : null}
                  </Summary>

                  <div className="brackets rounded-3xl border border-line bg-surface/60 p-5">
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <p className="eyebrow">Price</p>
                        <p className="mt-2 font-heading text-[26px] font-semibold tracking-tight">To be confirmed</p>
                      </div>
                      <Lock className="mb-2 size-5 text-subtle" />
                    </div>
                    <p className="mt-2 text-[13.5px] leading-relaxed text-subtle">
                      We price every shoot after checking the venue, the drone and what you need. You will get the final
                      price by email and WhatsApp within 24 hours.
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
                              title: `Pay ${formatNaira(site.depositNaira)} deposit now`,
                              body: "By bank transfer to Samfred Robotics. Your date is held once we confirm it by email, and the deposit comes off your final price.",
                            },
                            {
                              id: "later" as const,
                              title: "Pay after we confirm",
                              body: "Book now and pay by bank transfer once we send your price. Your date is held once payment comes in.",
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

function FlyerDrop({
  file,
  onPick,
  onClear,
  error,
}: {
  file: File | null
  onPick: (f: File | undefined) => void
  onClear: () => void
  error?: string
}) {
  const [over, setOver] = useState(false)
  const preview = useMemo(() => (file && file.type.startsWith("image/") ? URL.createObjectURL(file) : null), [file])
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview)
  }, [preview])

  return (
    <div className="flex flex-col gap-2">
      {file ? (
        <div className="flex items-center gap-4 rounded-2xl border border-signal/50 bg-signal/6 p-3">
          <div className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-surface">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Flyer preview" className="size-full object-cover" />
            ) : (
              <FileText className="size-7 text-signal-ink" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-medium">{file.name}</p>
            <p className="font-mono text-[11px] text-subtle">{(file.size / 1024 / 1024).toFixed(2)} MB · ready to send</p>
          </div>
          <button
            type="button"
            onClick={onClear}
            aria-label="Remove flyer"
            className="grid size-10 place-items-center rounded-full bg-surface transition active:scale-90"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <label
          onDragOver={(e) => {
            e.preventDefault()
            setOver(true)
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setOver(false)
            onPick(e.dataTransfer.files?.[0])
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border border-dashed px-6 py-9 text-center transition-colors",
            over ? "border-signal bg-signal/8" : error ? "border-destructive/60" : "border-fg/20 bg-surface/40 hover:border-signal/50",
          )}
        >
          <span className="grid size-12 place-items-center rounded-2xl bg-signal/12 text-signal-ink">
            <ImageUp className="size-6" />
          </span>
          <span className="text-[14.5px] font-medium">Upload your flyer</span>
          <span className="text-[12.5px] text-subtle">Image or PDF, up to 10 MB</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
            className="sr-only"
            onChange={(e) => onPick(e.target.files?.[0])}
            data-testid="flyer-input"
          />
        </label>
      )}
      {error && (
        <p role="alert" className="text-[12.5px] text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
