import { DELIVERABLES } from "./booking-schema"

/** "2026-12-12" to "Saturday, 12 December 2026". Parsed as a local date to avoid timezone drift. */
export function formatEventDate(iso: string, opts: { short?: boolean } = {}) {
  if (!iso) return ""
  const [y, m, d] = iso.split("-").map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString("en-GB", {
    weekday: opts.short ? "short" : "long",
    day: "numeric",
    month: opts.short ? "short" : "long",
    year: "numeric",
  })
}

/** "16:30" to "4:30 PM" */
export function formatTime(t: string) {
  if (!t) return ""
  const [h, m] = t.split(":").map(Number)
  const suffix = h >= 12 ? "PM" : "AM"
  const hh = h % 12 === 0 ? 12 : h % 12
  return `${hh}:${String(m).padStart(2, "0")} ${suffix}`
}

export function deliverableLabels(ids: string[]) {
  return ids.map((id) => DELIVERABLES.find((d) => d.id === id)?.label ?? id)
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}
