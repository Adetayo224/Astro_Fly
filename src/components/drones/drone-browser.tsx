"use client"
import { AnimatePresence, LayoutGroup, motion } from "framer-motion"
import { useMemo, useState } from "react"
import { CATEGORY_LABEL } from "@/lib/drones"
import type { Drone, DroneCategory } from "@/lib/types"
import { cn } from "@/lib/utils"
import { DroneCard } from "./drone-card"

type StatusFilter = "all" | "available" | "coming_soon"

const STATUS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "available", label: "Available now" },
  { id: "coming_soon", label: "Coming soon" },
]

export function DroneBrowser({ drones }: { drones: Drone[] }) {
  const [status, setStatus] = useState<StatusFilter>("all")
  const [cat, setCat] = useState<DroneCategory | "all">("all")
  const cats = useMemo(() => Array.from(new Set(drones.map((d) => d.category))), [drones])

  const list = drones
    .filter((d) => (status === "all" ? true : d.status === status))
    .filter((d) => (cat === "all" ? true : d.category === cat))
    .sort((a, b) => Number(a.status !== "available") - Number(b.status !== "available") || a.sort_order - b.sort_order)

  return (
    <div>
      <h2 className="sr-only">All drones</h2>
      <div className="sticky top-[calc(env(safe-area-inset-top)+64px)] z-30 -mx-5 border-b border-line bg-bg/80 px-5 py-3 backdrop-blur-xl md:top-[72px] md:-mx-8 md:px-8">
        <LayoutGroup id="status">
          <div role="tablist" className="no-scrollbar flex gap-1 overflow-x-auto">
            {STATUS.map((s) => {
              const active = status === s.id
              const count = s.id === "all" ? drones.length : drones.filter((d) => d.status === s.id).length
              return (
                <button
                  key={s.id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setStatus(s.id)}
                  className={cn(
                    "relative flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-[13.5px] font-medium transition-colors",
                    active ? "text-ink" : "text-subtle hover:text-fg",
                  )}
                >
                  {active && (
                    <motion.span layoutId="status-pill" className="absolute inset-0 -z-10 rounded-full bg-signal" transition={{ type: "spring", stiffness: 500, damping: 38 }} />
                  )}
                  {s.label}
                  <span className={cn("font-mono text-[11px]", active ? "text-ink/75" : "text-subtle")}>{count}</span>
                </button>
              )
            })}
          </div>
        </LayoutGroup>
        <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto">
          {(["all", ...cats] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              aria-pressed={cat === c}
              className={cn(
                "h-9 shrink-0 rounded-full border px-3.5 text-[12.5px] font-medium transition-[colors,transform] active:scale-95",
                cat === c ? "border-signal/70 bg-signal/10 text-fg" : "border-line text-subtle hover:text-fg",
              )}
            >
              {c === "all" ? "Every type" : CATEGORY_LABEL[c]}
            </button>
          ))}
        </div>
      </div>

      <motion.div layout className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout" initial={false}>
          {list.map((d, i) => (
            <motion.div
              key={d.slug}
              layout
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0, transition: { delay: Math.min(i * 0.04, 0.3) } }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
              className="min-w-0"
            >
              <DroneCard drone={d} priority={i < 3} className="h-full" />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
      {list.length === 0 && (
        <p className="py-20 text-center text-subtle">No drones match these filters yet.</p>
      )}
    </div>
  )
}
