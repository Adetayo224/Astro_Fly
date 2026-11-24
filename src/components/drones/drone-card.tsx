"use client"
import { motion } from "framer-motion"
import { ArrowUpRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useBooking } from "@/components/booking/booking-provider"
import { Button } from "@/components/ui/button"
import { CATEGORY_LABEL } from "@/lib/drones"
import type { Drone } from "@/lib/types"
import { cn } from "@/lib/utils"
import { NotifyMe } from "./notify-me"

export function DroneCard({ drone, priority, className }: { drone: Drone; priority?: boolean; className?: string }) {
  const { openBooking } = useBooking()
  const soon = drone.status === "coming_soon"

  return (
    <motion.article
      layout
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-[28px] border border-line bg-surface transition-[border-color,box-shadow] duration-300",
        !soon && "hover:border-signal/40 hover:shadow-[0_20px_60px_-30px_rgba(0,255,133,.45)]",
        className,
      )}
    >
      <Link href={`/drones/${drone.slug}`} className="absolute inset-0 z-0" aria-label={`${drone.name} details`} />
      <div className="pointer-events-none relative aspect-[4/3] overflow-hidden">
        <div
          className={cn(
            "absolute inset-0 hud-grid opacity-70",
            "[mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_75%)]",
          )}
        />
        <div
          className={cn(
            "absolute top-1/2 left-1/2 size-[60%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl transition-opacity duration-500",
            soon ? "bg-fg/5" : "bg-signal/15 group-hover:bg-signal/25",
          )}
        />
        <Image
          src={drone.image}
          alt={drone.name}
          fill
          priority={priority}
          sizes="(max-width: 768px) 85vw, 400px"
          className={cn(
            "object-contain p-4 transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)] group-hover:-translate-y-1.5 group-hover:scale-[1.04]",
            soon && "opacity-45 grayscale-[60%]",
          )}
        />
        <div className="absolute top-4 left-4 flex gap-2">
          {soon ? (
            <span className="rounded-full border border-line bg-bg/70 px-3 py-1 font-mono text-[10px] tracking-[0.16em] text-subtle uppercase backdrop-blur">
              Coming soon
            </span>
          ) : (
            <span className="flex items-center gap-1.5 rounded-full bg-signal px-3 py-1 font-mono text-[10px] font-semibold tracking-[0.16em] text-ink uppercase">
              <span className="size-1.5 animate-pulse rounded-full bg-ink" />
              Available
            </span>
          )}
        </div>
        <span className="absolute top-4 right-4 grid size-9 place-items-center rounded-full border border-line bg-bg/60 text-fg/70 backdrop-blur transition group-hover:text-signal-ink">
          <ArrowUpRight className="size-4" />
        </span>
      </div>

      <div className="relative z-[1] flex flex-1 flex-col gap-4 p-5 pt-1 pointer-events-none">
        <div>
          <p className="font-mono text-[10.5px] tracking-[0.18em] text-subtle uppercase">{CATEGORY_LABEL[drone.category]}</p>
          <h3 className={cn("mt-1 text-[21px] font-semibold", soon && "text-fg/70")}>{drone.name}</h3>
          <p className="mt-1 text-[14px] leading-snug text-subtle">{drone.tagline}</p>
        </div>
        <dl className="grid grid-cols-3 gap-2 border-y border-line py-3">
          {[
            ["Video", drone.video.split(",")[0].replace(/ (at|up to) /, " · ")],
            ["Flight", drone.flight_time],
            ["Weight", drone.weight],
          ].map(([k, v]) => (
            <div key={k} className="min-w-0">
              <dt className="font-mono text-[9.5px] tracking-[0.18em] text-subtle uppercase">{k}</dt>
              <dd className="mt-1 truncate font-mono text-[12px] text-fg/90">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="pointer-events-auto mt-auto">
          {soon ? (
            <div className="flex flex-col gap-2.5">
              <Button variant="subtle" size="lg" block disabled>
                Coming soon
              </Button>
              <NotifyMe droneSlug={drone.slug} droneName={drone.name} />
            </div>
          ) : (
            <Button size="lg" block onClick={() => openBooking(drone.slug)}>
              Book this drone
            </Button>
          )}
        </div>
      </div>
    </motion.article>
  )
}
