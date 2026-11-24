import type { Metadata } from "next"
import { Suspense } from "react"
import { BookPage } from "@/components/booking/book-page"

export const metadata: Metadata = { title: "Book a drone" }

export default function Page() {
  return (
    <div className="pt-[calc(env(safe-area-inset-top)+64px)] md:pt-[72px]">
      <Suspense fallback={null}>
        <BookPage />
      </Suspense>
    </div>
  )
}
