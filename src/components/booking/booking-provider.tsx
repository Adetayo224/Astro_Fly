"use client"
import dynamic from "next/dynamic"
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react"
import type { Drone } from "@/lib/types"

const BookingSheet = dynamic(() => import("./booking-sheet").then((m) => m.BookingSheet), { ssr: false })

interface Ctx {
  openBooking: (droneSlug?: string) => void
  closeBooking: () => void
  drones: Drone[]
}

const BookingContext = createContext<Ctx | null>(null)

export function useBooking() {
  const ctx = useContext(BookingContext)
  if (!ctx) throw new Error("useBooking must be used inside BookingProvider")
  return ctx
}

export function BookingProvider({ drones, children }: { drones: Drone[]; children: ReactNode }) {
  // The form survives an accidental close. It only resets after a booking is completed.
  const [state, setState] = useState<{ open: boolean; slug?: string; key: number; done: boolean }>({
    open: false,
    key: 0,
    done: false,
  })
  const [loaded, setLoaded] = useState(false)

  const openBooking = useCallback((slug?: string) => {
    setLoaded(true)
    setState((s) => ({ open: true, slug, key: s.done ? s.key + 1 : s.key, done: false }))
  }, [])
  const closeBooking = useCallback(() => setState((s) => ({ ...s, open: false })), [])
  const markDone = useCallback(() => setState((s) => ({ ...s, done: true })), [])

  const value = useMemo(() => ({ openBooking, closeBooking, drones }), [openBooking, closeBooking, drones])

  return (
    <BookingContext.Provider value={value}>
      {children}
      {loaded && (
        <BookingSheet
          key={state.key}
          open={state.open}
          onClose={closeBooking}
          drones={drones}
          initialDrone={state.slug}
          onDone={markDone}
        />
      )}
    </BookingContext.Provider>
  )
}

/** Small client button that opens the booking sheet. Usable from server components. */
export function BookTrigger({
  drone,
  children,
  className,
}: {
  drone?: string
  children: ReactNode
  className?: string
}) {
  const { openBooking } = useBooking()
  return (
    <button type="button" className={className} onClick={() => openBooking(drone)}>
      {children}
    </button>
  )
}
