"use client"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { DroneCard } from "@/components/drones/drone-card"
import type { Drone } from "@/lib/types"
import { cn } from "@/lib/utils"

/** Native feeling swipe carousel: CSS scroll snap with momentum, arrows on desktop, dots for position. */
export function DroneCarousel({ drones }: { drones: Drone[] }) {
  const track = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const [edges, setEdges] = useState({ start: true, end: false })

  useEffect(() => {
    const el = track.current
    if (!el) return
    const onScroll = () => {
      const card = el.firstElementChild as HTMLElement | null
      const w = card ? card.offsetWidth + 16 : 1
      setIndex(Math.round(el.scrollLeft / w))
      setEdges({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth > el.scrollWidth - 8 })
    }
    onScroll()
    el.addEventListener("scroll", onScroll, { passive: true })
    return () => el.removeEventListener("scroll", onScroll)
  }, [])

  const by = (n: number) => {
    const el = track.current
    if (!el) return
    const card = el.firstElementChild as HTMLElement | null
    el.scrollBy({ left: n * ((card?.offsetWidth ?? 300) + 16), behavior: "smooth" })
  }

  return (
    <div className="relative">
      <div className="absolute -top-[110px] right-5 hidden gap-2 md:right-8 md:flex">
        {[
          { n: -1, icon: ArrowLeft, disabled: edges.start, label: "Previous drones" },
          { n: 1, icon: ArrowRight, disabled: edges.end, label: "Next drones" },
        ].map(({ n, icon: Icon, disabled, label }) => (
          <button
            key={n}
            type="button"
            onClick={() => by(n)}
            disabled={disabled}
            aria-label={label}
            className="grid size-11 place-items-center rounded-full border border-line bg-surface transition hover:border-signal/50 active:scale-90 disabled:opacity-30"
          >
            <Icon className="size-[18px]" />
          </button>
        ))}
      </div>
      <div
        ref={track}
        data-lenis-prevent-horizontal
        className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-5 pb-2 md:scroll-px-8 md:px-8 [scroll-padding-inline:1.25rem]"
      >
        {drones.map((d, i) => (
          <DroneCard key={d.slug} drone={d} priority={i < 2} className="w-[82vw] max-w-[360px] shrink-0 snap-start md:w-[340px]" />
        ))}
        <div className="w-1 shrink-0" aria-hidden />
      </div>
      <div className="mt-5 flex justify-center gap-1.5" aria-hidden>
        {drones.map((d, i) => (
          <span
            key={d.slug}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i === index ? "w-6 bg-signal" : "w-1.5 bg-fg/20",
            )}
          />
        ))}
      </div>
    </div>
  )
}
