"use client"
import { ArrowRight } from "lucide-react"
import { useBooking } from "@/components/booking/booking-provider"
import { Reveal, RevealItem, SectionHeading } from "./reveal"

const EVENTS = [
  { name: "Weddings", shots: "Church exit, couple entrance, the full reception from above", code: "WED" },
  { name: "Birthdays", shots: "Arrival, cake moment, group photo that fits everyone", code: "BDY" },
  { name: "Concerts", shots: "Crowd sweeps, stage reveals, the whole venue lit up", code: "CNC" },
  { name: "Church programmes", shots: "Crusades, conventions, harvest and outdoor services", code: "CHP" },
  { name: "Corporate launches", shots: "Brand reveals, site openings, team photos at scale", code: "CRP" },
  { name: "Real estate", shots: "Estates, plots and buildings with clear aerial context", code: "RES" },
  { name: "Sports", shots: "Tournaments, marathons and match days from the best seat", code: "SPT" },
]

export function EventTypes() {
  const { openBooking } = useBooking()
  return (
    <section id="events" className="relative border-y border-line bg-surface/40">
      <div className="mx-auto max-w-7xl px-5 py-24 md:px-8 md:py-32">
        <SectionHeading
          eyebrow="What we shoot"
          title="Built for Nigerian events, big and small."
          body="From a family birthday in the compound to a crusade ground packed with thousands."
        />
        <Reveal as="ul" className="mt-12 border-t border-line">
          {EVENTS.map((e, i) => (
            <RevealItem as="li" key={e.name}>
              <button
                type="button"
                onClick={() => openBooking()}
                className="group relative flex w-full items-center gap-4 overflow-hidden border-b border-line py-5 text-left md:gap-8 md:py-7"
              >
                <span className="absolute inset-0 -z-0 origin-left scale-x-0 bg-signal/[0.06] transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-x-100" />
                <span className="relative w-10 font-mono text-[11px] text-subtle md:w-16">{String(i + 1).padStart(2, "0")}</span>
                <span className="relative flex-1">
                  <span className="block font-heading text-[24px] font-semibold tracking-tight transition-colors group-hover:text-signal-ink md:text-[40px]">
                    {e.name}
                  </span>
                  <span className="mt-1 block text-[13.5px] text-subtle md:text-[15px]">{e.shots}</span>
                </span>
                <span className="relative hidden font-mono text-[11px] tracking-[0.2em] text-subtle md:block">{e.code}</span>
                <span className="relative grid size-11 shrink-0 place-items-center rounded-full border border-line transition group-hover:border-signal group-hover:bg-signal group-hover:text-ink">
                  <ArrowRight className="size-[18px] transition-transform group-hover:translate-x-0.5" />
                </span>
              </button>
            </RevealItem>
          ))}
        </Reveal>
      </div>
    </section>
  )
}
