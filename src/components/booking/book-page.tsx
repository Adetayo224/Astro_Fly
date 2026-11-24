"use client"
import { useRouter, useSearchParams } from "next/navigation"
import { useBooking } from "./booking-provider"
import { BookingFlow } from "./booking-flow"

/** Full page version of the booking flow for shared links like /book?drone=dji-lito-1 */
export function BookPage() {
  const params = useSearchParams()
  const router = useRouter()
  const { drones } = useBooking()
  return (
    <div className="mx-auto flex h-[calc(100svh-64px-64px-env(safe-area-inset-bottom))] max-w-2xl flex-col overflow-hidden rounded-none border-line md:my-6 md:h-[calc(100svh-120px)] md:rounded-[32px] md:border md:bg-surface/30">
      <BookingFlow drones={drones} initialDrone={params.get("drone") ?? undefined} onClose={() => router.push("/")} />
    </div>
  )
}
