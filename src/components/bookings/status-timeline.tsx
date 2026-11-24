"use client"
import { motion } from "framer-motion"
import { Check, X } from "lucide-react"
import { formatDateTime } from "@/lib/format"
import type { BookingEvent, BookingStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

const FLOW: { id: BookingStatus; label: string; body: string }[] = [
  { id: "pending", label: "Received", body: "We have your details and are preparing your price." },
  { id: "confirmed", label: "Confirmed", body: "Your pilot and drone are reserved for the date." },
  { id: "paid", label: "Paid", body: "Payment complete. We plan the shots with you." },
  { id: "completed", label: "Delivered", body: "The shoot is done and your files are on their way." },
]

export function StatusTimeline({ status, events }: { status: BookingStatus; events: BookingEvent[] }) {
  if (status === "cancelled") {
    const ev = [...events].reverse().find((e) => e.status === "cancelled")
    return (
      <div className="flex items-start gap-4 rounded-3xl border border-destructive/30 bg-destructive/8 p-5">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-destructive/15 text-destructive">
          <X className="size-5" />
        </span>
        <div>
          <p className="font-semibold">This booking was cancelled</p>
          <p className="mt-1 text-[13.5px] text-subtle">
            {ev?.note || "Message us on WhatsApp if you want to book a new date."}
          </p>
        </div>
      </div>
    )
  }
  const current = FLOW.findIndex((s) => s.id === status)
  return (
    <ol className="relative flex flex-col gap-1">
      {FLOW.map((s, i) => {
        const done = i < current
        const active = i === current
        const ev = [...events].reverse().find((e) => e.status === s.id)
        return (
          <li key={s.id} className="relative flex gap-4 pb-5 last:pb-0">
            {i < FLOW.length - 1 && (
              <span className="absolute top-9 bottom-0 left-[17px] w-[2px] overflow-hidden rounded-full bg-fg/10">
                <motion.span
                  className="block h-full w-full origin-top bg-signal"
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: done ? 1 : 0 }}
                  transition={{ duration: 0.6, delay: 0.2 + i * 0.25, ease: [0.22, 1, 0.36, 1] }}
                />
              </span>
            )}
            <motion.span
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 + i * 0.25 }}
              className={cn(
                "relative z-10 grid size-9 shrink-0 place-items-center rounded-full border-2 font-mono text-[12px] font-semibold",
                done && "border-signal bg-signal text-ink",
                active && "border-signal bg-bg text-signal-ink shadow-[0_0_0_6px_rgba(0,255,133,.12)]",
                !done && !active && "border-fg/15 bg-bg text-subtle",
              )}
            >
              {done ? <Check className="size-4" strokeWidth={3} /> : i + 1}
              {active && <span className="absolute inset-0 animate-ping rounded-full border-2 border-signal/60 [animation-duration:2s]" />}
            </motion.span>
            <div className="pt-1">
              <p className={cn("text-[15px] font-semibold", !done && !active && "text-subtle")}>{s.label}</p>
              <p className="mt-0.5 text-[13px] leading-relaxed text-subtle">{ev?.note && ev.note !== "Booking received" ? ev.note : s.body}</p>
              {ev && <p className="mt-1 font-mono text-[11px] text-subtle/80">{formatDateTime(ev.created_at)}</p>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
