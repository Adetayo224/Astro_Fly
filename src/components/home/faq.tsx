"use client"
import { AnimatePresence, motion } from "framer-motion"
import { Plus } from "lucide-react"
import { useState } from "react"
import { useBooking } from "@/components/booking/booking-provider"
import { formatNaira, type Pricing } from "@/lib/site"
import { cn } from "@/lib/utils"
import { SectionHeading } from "./reveal"

const faqs = (p: Pricing) => [
  {
    q: "How much does a drone shoot cost?",
    a: `${formatNaira(p.fullDayNaira)} for the full day, however long your event runs. If you do not need the full day, book by the hour at ${formatNaira(p.hourlyNaira)} per hour, with a minimum of ${p.minHours} hours (${formatNaira(p.hourlyNaira * p.minHours)}). You see your price before you book.`,
  },
  {
    q: "How do I pay?",
    a: "By bank transfer to Samfred Robotics LTD, Fidelity Bank, account 6060500990. Use your booking reference as the narration. We confirm every payment by email.",
  },
  {
    q: "Do I need my own drone pilot?",
    a: `No. If you have a pilot, they can fly our drone for you. If not, choose Match me with a pilot when you book. It adds ${formatNaira(p.pilotFeeNaira)} and we send you your pilot's name and number before the event.`,
  },
  {
    q: "Do I need to pay before you confirm?",
    a: "No. You can pay once we confirm your date. If your date is popular, a deposit holds it for you and comes off the total.",
  },
  {
    q: "Do you travel outside Ogbomoso?",
    a: "Yes. We are based in Ogbomoso and travel to events in other cities and states. Put the full address in your booking and we tell you about any travel cost before you pay.",
  },
  {
    q: "What happens if it rains or the wind is strong?",
    a: "Safety comes first. If the weather makes flying unsafe, we land and agree the next step with you, whether that is waiting for a break in the weather or moving the aerial shots to another time.",
  },
  {
    q: "Can you show the drone feed live on a screen?",
    a: "Yes. Choose Live feed to screen in the booking form and tell us about the screen or projector at the venue in your notes.",
  },
  {
    q: "How do I get my photos and videos?",
    a: "Through a download link, a flash drive or both. We agree the delivery method and timing when we confirm your booking.",
  },
  {
    q: "Can the drone fly indoors?",
    a: "Some venues allow it. Tell us if your event is indoors and we will advise on the right drone and the safest way to get the shot.",
  },
]

export function FAQ() {
  const { pricing } = useBooking()
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section id="faq" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-24 md:px-8 md:py-32">
      <div className="grid gap-12 md:grid-cols-[0.8fr_1.2fr] md:gap-20">
        <SectionHeading eyebrow="Questions" title="Good to know before you book." />
        <div className="border-t border-line">
          {faqs(pricing).map((f, i) => {
            const isOpen = open === i
            return (
              <div key={f.q} className="border-b border-line">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-6 py-5 text-left md:py-6"
                >
                  <span className={cn("text-[16px] font-medium transition-colors md:text-[18px]", isOpen && "text-signal-ink")}>
                    {f.q}
                  </span>
                  <motion.span
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 28 }}
                    className={cn(
                      "grid size-9 shrink-0 place-items-center rounded-full border transition-colors",
                      isOpen ? "border-signal bg-signal text-ink" : "border-line",
                    )}
                  >
                    <Plus className="size-4" />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 34 }}
                      className="overflow-hidden"
                    >
                      <p className="max-w-xl pb-6 text-[15px] leading-relaxed text-subtle">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
