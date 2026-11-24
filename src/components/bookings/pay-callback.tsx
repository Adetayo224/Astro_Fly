"use client"
import { motion } from "framer-motion"
import { Loader2, X } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { SuccessCheck } from "@/components/booking/success-screen"
import { ButtonLink } from "@/components/ui/button"
import { formatNaira, whatsappLink } from "@/lib/site"

export function PayCallback() {
  const params = useSearchParams()
  const reference = params.get("reference") || params.get("trxref")
  const [state, setState] = useState<"loading" | "ok" | "fail">(reference ? "loading" : "fail")
  const [data, setData] = useState<{ amount: number; booking: { reference: string; status: string } } | null>(null)
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true
    if (!reference) return
    fetch(`/api/paystack/verify?reference=${encodeURIComponent(reference)}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) {
          setData(j)
          setState("ok")
        } else setState("fail")
      })
      .catch(() => setState("fail"))
  }, [reference])

  if (state === "loading") {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <Loader2 className="size-10 animate-spin text-signal-ink" />
        <p className="font-mono text-[12px] tracking-[0.2em] text-subtle uppercase">Confirming your payment</p>
      </div>
    )
  }
  if (state === "fail") {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <span className="grid size-24 place-items-center rounded-full bg-destructive/12 text-destructive">
          <X className="size-10" />
        </span>
        <h1 className="mt-6 text-[30px] font-semibold">We could not confirm this payment</h1>
        <p className="mt-3 max-w-md text-[15px] text-subtle">
          If money left your account, do not worry. Paystack will notify us and your booking will update. You can also send
          us the payment receipt on WhatsApp.
        </p>
        <div className="mt-8 flex w-full max-w-sm flex-col gap-3">
          <ButtonLink href="/bookings" size="xl" block>
            Check my booking
          </ButtonLink>
          <a
            href={whatsappLink(`Hello Astro_Fly, I made a payment but it did not confirm. Reference ${reference ?? ""}.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[14px] font-medium text-signal-ink"
          >
            Message us on WhatsApp
          </a>
        </div>
      </div>
    )
  }
  return (
    <div className="flex flex-col items-center py-12 text-center">
      <SuccessCheck />
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
        <p className="eyebrow mt-6">Payment received</p>
        <h1 className="mt-3 text-[32px] font-semibold">{formatNaira(data!.amount)} paid. Thank you.</h1>
        <p className="mx-auto mt-3 max-w-md text-[15px] text-subtle">
          {data!.booking.status === "paid"
            ? "Your booking is fully paid. We have emailed your receipt."
            : "Your date is now held. We have emailed your receipt and will be in touch with next steps."}
        </p>
        <p className="mt-6 font-mono text-[22px] font-semibold tracking-[0.12em] text-signal-ink">{data!.booking.reference}</p>
        <div className="mx-auto mt-8 flex w-full max-w-sm flex-col gap-3">
          <ButtonLink href={`/bookings?ref=${data!.booking.reference}`} size="xl" block>
            View my booking
          </ButtonLink>
          <ButtonLink href="/" variant="ghost" size="lg" block>
            Back home
          </ButtonLink>
        </div>
      </motion.div>
    </div>
  )
}
