import { MessageSquareQuote } from "lucide-react"
import { REVIEWS } from "@/lib/reviews"
import { whatsappLink } from "@/lib/site"
import { Reveal, RevealItem, SectionHeading } from "./reveal"

export function Reviews() {
  return (
    <section id="reviews" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-24 md:px-8 md:py-28">
      <SectionHeading eyebrow="Reviews" title="What our clients say." />
      {REVIEWS.length ? (
        <Reveal className="mt-12 grid gap-4 md:grid-cols-3">
          {REVIEWS.map((r) => (
            <RevealItem key={r.name + r.date} className="rounded-[28px] border border-line bg-surface p-6">
              <p className="text-[16px] leading-relaxed">{r.quote}</p>
              <p className="mt-5 text-[14px] font-semibold">{r.name}</p>
              <p className="font-mono text-[11px] text-subtle">
                {r.event} · {r.date}
              </p>
            </RevealItem>
          ))}
        </Reveal>
      ) : (
        <Reveal className="mt-10">
          <RevealItem className="relative overflow-hidden rounded-[28px] border border-dashed border-fg/15 p-8 md:p-12">
            <div className="hud-grid absolute inset-0 opacity-50 [mask-image:linear-gradient(to_right,transparent,black)]" />
            <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:gap-5">
                <span className="grid size-14 shrink-0 place-items-center rounded-2xl border border-line bg-surface text-signal-ink">
                  <MessageSquareQuote className="size-6" />
                </span>
                <div>
                  <p className="text-[19px] font-semibold">No reviews yet. We would rather wait for real ones.</p>
                  <p className="mt-2 max-w-lg text-[14.5px] leading-relaxed text-subtle">
                    Reviews from our first Astro_Fly clients will appear here. Flown with us already? Send us a few words
                    on WhatsApp and we will add them.
                  </p>
                </div>
              </div>
              <a
                href={whatsappLink("Hello Astro_Fly, I would like to leave a review for my shoot.")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 shrink-0 items-center justify-center rounded-full border border-line px-6 text-[14px] font-medium transition hover:border-signal/60 active:scale-95"
              >
                Send a review
              </a>
            </div>
          </RevealItem>
        </Reveal>
      )}
    </section>
  )
}
