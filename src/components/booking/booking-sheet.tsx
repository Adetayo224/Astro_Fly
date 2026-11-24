"use client"
import { Sheet } from "@/components/ui/sheet"
import type { Drone } from "@/lib/types"
import { BookingFlow } from "./booking-flow"

export function BookingSheet({
  open,
  onClose,
  drones,
  initialDrone,
  onDone,
}: {
  open: boolean
  onClose: () => void
  drones: Drone[]
  initialDrone?: string
  onDone: () => void
}) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      full
      bare
      width="560px"
      header={
        <div className="flex items-center gap-2">
          <span className="size-2 animate-pulse rounded-full bg-signal shadow-[0_0_10px_#00ff85]" />
          <span className="font-mono text-[11px] tracking-[0.18em] text-subtle uppercase">Book a drone</span>
        </div>
      }
    >
      <BookingFlow drones={drones} initialDrone={initialDrone} onDone={onDone} onClose={onClose} />
    </Sheet>
  )
}
