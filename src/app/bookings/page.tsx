import type { Metadata } from "next"
import { Suspense } from "react"
import { BookingLookup } from "@/components/bookings/booking-lookup"
import { Footer } from "@/components/shell/footer"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = { title: "My Bookings", description: "Check the status of your Astro_Fly booking." }

export default function BookingsPage() {
  return (
    <>
      <div className="mx-auto max-w-7xl px-5 pt-[calc(env(safe-area-inset-top)+96px)] pb-24 md:px-8 md:pt-36">
        <p className="eyebrow">My Bookings</p>
        <h1 className="mt-4 max-w-2xl text-[40px] leading-[1.02] font-semibold md:text-[60px]">Where is my booking?</h1>
        <p className="mt-4 max-w-lg text-[15.5px] leading-relaxed text-subtle">
          Use the email you booked with and the reference we sent you.
        </p>
        <div className="mt-10">
          <Suspense fallback={<Skeleton className="h-96 rounded-[28px]" />}>
            <BookingLookup />
          </Suspense>
        </div>
      </div>
      <Footer />
    </>
  )
}
