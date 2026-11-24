"use client"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useMemo, useState } from "react"
import { formatTime } from "@/lib/format"
import { cn } from "@/lib/utils"

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]

const pad = (n: number) => String(n).padStart(2, "0")
const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** Month calendar with past days disabled. Value is an ISO date string. */
export function Calendar({
  value,
  onChange,
  invalid,
}: {
  value?: string
  onChange: (iso: string) => void
  invalid?: boolean
}) {
  const today = useMemo(() => {
    const t = new Date()
    t.setHours(0, 0, 0, 0)
    return t
  }, [])
  const initial = value ? new Date(`${value}T00:00:00`) : today
  const [cursor, setCursor] = useState(new Date(initial.getFullYear(), initial.getMonth(), 1))
  const [dir, setDir] = useState(1)

  const days = useMemo(() => {
    const first = new Date(cursor)
    const offset = (first.getDay() + 6) % 7 // Monday first
    const count = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate()
    const cells: (Date | null)[] = Array.from({ length: offset }, () => null)
    for (let d = 1; d <= count; d++) cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), d))
    return cells
  }, [cursor])

  const canPrev = cursor > new Date(today.getFullYear(), today.getMonth(), 1)
  const move = (n: number) => {
    setDir(n)
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + n, 1))
  }
  const label = cursor.toLocaleDateString("en-GB", { month: "long", year: "numeric" })
  const todayISO = toISO(today)

  return (
    <div className={cn("rounded-3xl border bg-surface/60 p-4", invalid ? "border-destructive/60" : "border-line")}>
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => move(-1)}
          disabled={!canPrev}
          aria-label="Previous month"
          className="grid size-10 place-items-center rounded-full transition hover:bg-surface-2 active:scale-90 disabled:opacity-25"
        >
          <ChevronLeft className="size-[18px]" />
        </button>
        <AnimatePresence mode="popLayout" initial={false} custom={dir}>
          <motion.span
            key={label}
            custom={dir}
            initial={{ opacity: 0, y: dir * 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: dir * -8 }}
            className="font-heading text-[15px] font-semibold"
          >
            {label}
          </motion.span>
        </AnimatePresence>
        <button
          type="button"
          onClick={() => move(1)}
          aria-label="Next month"
          className="grid size-10 place-items-center rounded-full transition hover:bg-surface-2 active:scale-90"
        >
          <ChevronRight className="size-[18px]" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((w) => (
          <span key={w} className="pb-1 font-mono text-[10.5px] tracking-wider text-subtle uppercase">
            {w}
          </span>
        ))}
        {days.map((d, i) => {
          if (!d) return <span key={`e${i}`} />
          const iso = toISO(d)
          const past = iso < todayISO
          const selected = iso === value
          const isToday = iso === todayISO
          return (
            <button
              key={iso}
              type="button"
              disabled={past}
              onClick={() => onChange(iso)}
              aria-label={d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
              aria-pressed={selected}
              className={cn(
                "relative grid aspect-square place-items-center rounded-xl text-[14px] tabular-nums transition-[transform,background-color] active:scale-90",
                past && "text-fg/20 line-through decoration-fg/15",
                !past && !selected && "hover:bg-surface-2",
                selected && "bg-signal font-semibold text-ink shadow-[0_6px_20px_-6px_rgba(0,255,133,.8)]",
              )}
            >
              {d.getDate()}
              {isToday && !selected && <span className="absolute bottom-1.5 size-1 rounded-full bg-signal" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

const GROUPS = [
  { id: "morning", label: "Morning", from: 6, to: 11.5 },
  { id: "afternoon", label: "Afternoon", from: 12, to: 16.5 },
  { id: "evening", label: "Evening", from: 17, to: 22 },
] as const

function slots(from: number, to: number) {
  const out: string[] = []
  for (let t = from; t <= to; t += 0.5) out.push(`${pad(Math.floor(t))}:${t % 1 ? "30" : "00"}`)
  return out
}

export function TimePicker({
  value,
  onChange,
  invalid,
}: {
  value?: string
  onChange: (v: string) => void
  invalid?: boolean
}) {
  const initialGroup = value
    ? (GROUPS.find((g) => {
        const [h, m] = value.split(":").map(Number)
        const t = h + m / 60
        return t >= g.from && t <= g.to + 0.4
      })?.id ?? "morning")
    : "morning"
  const [group, setGroup] = useState<string>(initialGroup)
  const g = GROUPS.find((x) => x.id === group)!
  return (
    <div className={cn("rounded-3xl border bg-surface/60 p-3", invalid ? "border-destructive/60" : "border-line")}>
      <div className="mb-3 grid grid-cols-3 gap-1 rounded-2xl bg-bg/60 p-1">
        {GROUPS.map((x) => (
          <button
            key={x.id}
            type="button"
            onClick={() => setGroup(x.id)}
            className={cn(
              "relative h-9 rounded-xl text-[13px] font-medium transition-colors",
              group === x.id ? "text-fg" : "text-subtle hover:text-fg",
            )}
          >
            {group === x.id && (
              <motion.span layoutId="time-group" className="absolute inset-0 -z-0 rounded-xl bg-surface-2" />
            )}
            <span className="relative">{x.label}</span>
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {slots(g.from, g.to).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            aria-pressed={s === value}
            className={cn(
              "h-11 rounded-xl border font-mono text-[13px] tabular-nums transition-[transform,background-color,border-color] active:scale-95",
              s === value ? "border-signal bg-signal font-semibold text-ink" : "border-line hover:border-fg/25",
            )}
          >
            {formatTime(s)}
          </button>
        ))}
      </div>
    </div>
  )
}
