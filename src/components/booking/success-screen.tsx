"use client"
import { motion } from "framer-motion"
import { Check, Copy, MessageCircle } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { ButtonLink } from "@/components/ui/button"
import { site, whatsappLink } from "@/lib/site"
import { BankDetailsCard } from "./bank-details"

export interface SuccessData {
  reference: string
  email: string
  payOption: "deposit" | "later"
  name: string
}

export function SuccessCheck({ size = 112 }: { size?: number }) {
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <motion.span
        className="absolute inset-0 rounded-full bg-signal/20"
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: [0.4, 1.35, 1.6], opacity: [0, 0.6, 0] }}
        transition={{ duration: 1.4, delay: 0.35, ease: "easeOut" }}
      />
      <motion.svg
        viewBox="0 0 100 100"
        className="relative"
        width={size}
        height={size}
        initial={{ scale: 0.6, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 16 }}
      >
        <motion.circle
          cx="50"
          cy="50"
          r="44"
          fill="rgba(0,255,133,.12)"
          stroke="#00FF85"
          strokeWidth="3"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{ filter: "drop-shadow(0 0 12px rgba(0,255,133,.7))" }}
        />
        <motion.path
          d="M30 52 L45 66 L71 38"
          fill="none"
          stroke="#00FF85"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.45, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
        />
      </motion.svg>
    </div>
  )
}

export function SuccessScreen({ data, onClose }: { data: SuccessData; onClose?: () => void }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(data.reference)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      toast("Your reference is " + data.reference)
    }
  }

  const item = {
    hidden: { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 30 } },
  }

  return (
    <div data-lenis-prevent className="min-h-0 flex-1 overflow-y-auto px-5 pb-[max(env(safe-area-inset-bottom),20px)]">
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.08, delayChildren: 0.55 } } }}
        className="mx-auto flex max-w-md flex-col items-center pt-6 text-center"
      >
        <SuccessCheck />
        <motion.p variants={item} className="eyebrow mt-6">
          Booking received
        </motion.p>
        <motion.h3 variants={item} className="mt-3 text-[28px] leading-tight font-semibold">
          Thank you, {data.name}. You are on our flight plan.
        </motion.h3>
        <motion.p variants={item} className="mt-3 text-[14.5px] leading-relaxed text-subtle">
          We sent a confirmation email to <span className="text-fg">{data.email}</span>. Our team will reply with your
          price within 24 hours.
        </motion.p>

        <motion.button
          variants={item}
          type="button"
          onClick={copy}
          className="brackets group mt-7 w-full rounded-3xl border border-signal/40 bg-signal/6 px-6 py-5 transition active:scale-[0.98]"
        >
          <span className="block font-mono text-[11px] tracking-[0.2em] text-subtle">BOOKING REFERENCE</span>
          <span className="mt-2 flex items-center justify-center gap-3">
            <span className="font-mono text-[30px] font-semibold tracking-[0.12em] text-signal-ink text-glow">
              {data.reference}
            </span>
            {copied ? <Check className="size-5 text-signal-ink" /> : <Copy className="size-5 text-subtle group-hover:text-fg" />}
          </span>
          <span className="mt-1 block text-[12px] text-subtle">{copied ? "Copied" : "Tap to copy"}</span>
        </motion.button>

        <motion.div variants={item} className="mt-6 flex w-full flex-col gap-3">
          {data.payOption === "deposit" && (
            <BankDetailsCard
              reference={data.reference}
              amount={site.depositNaira}
              title="Pay your deposit to hold the date"
            />
          )}
          <a
            href={whatsappLink(`Hello Astro_Fly, I just booked a drone shoot. My booking reference is ${data.reference}.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-full border border-line bg-surface text-[15px] font-semibold transition active:scale-[0.97] hover:border-signal/50"
          >
            <MessageCircle className="size-[18px] text-signal-ink" />
            Chat with us on WhatsApp
          </a>
          <ButtonLink href={`/bookings?ref=${data.reference}`} variant="ghost" size="lg" block onClick={onClose}>
            Track this booking
          </ButtonLink>
        </motion.div>
      </motion.div>
    </div>
  )
}
