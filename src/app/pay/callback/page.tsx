import type { Metadata } from "next"
import { Suspense } from "react"
import { PayCallback } from "@/components/bookings/pay-callback"

export const metadata: Metadata = { title: "Payment", robots: { index: false } }

export default function PayCallbackPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 pt-[calc(env(safe-area-inset-top)+96px)] pb-32 md:pt-36">
      <Suspense fallback={null}>
        <PayCallback />
      </Suspense>
    </div>
  )
}
