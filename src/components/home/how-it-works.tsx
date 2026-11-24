"use client"
import { motion } from "framer-motion"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useEffect, useRef } from "react"
import { SectionHeading } from "./reveal"

const STEPS = [
  {
    title: "Pick a drone",
    body: "Start with the drone that fits your event. Not sure? Choose the Mini 4K and we will advise.",
    readout: "SELECT",
  },
  {
    title: "Tell us about the day",
    body: "Date, venue, programme and what you want to keep. Upload your flyer if you have one.",
    readout: "PLAN",
  },
  {
    title: "Get your price, then pay",
    body: "We check the details and send your price. Pay a deposit to hold the date, the rest before the shoot.",
    readout: "CONFIRM",
  },
  {
    title: "We fly and deliver",
    body: "The pilot arrives early, flies the plan, and you get your photos, video and reels after the event.",
    readout: "DELIVER",
  },
]

export function HowItWorks() {
  const list = useRef<HTMLOListElement>(null)
  const line = useRef<HTMLDivElement>(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    const ctx = gsap.context(() => {
      gsap.fromTo(
        line.current,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: { trigger: list.current, start: "top 70%", end: "bottom 60%", scrub: 0.5 },
        },
      )
    })
    return () => ctx.revert()
  }, [])

  return (
    <section id="how-it-works" className="relative mx-auto max-w-7xl scroll-mt-24 px-5 py-24 md:px-8 md:py-36">
      <div className="grid gap-14 md:grid-cols-[1fr_1.1fr] md:gap-20">
        <div className="md:sticky md:top-32 md:self-start">
          <SectionHeading
            eyebrow="How it works"
            title="From first message to final cut in four steps."
            body="No long calls, no guesswork. You book in a few minutes and we handle the flying."
          />
        </div>
        <ol ref={list} className="relative flex flex-col gap-5">
          <div className="absolute top-6 bottom-6 left-[27px] w-px bg-line" aria-hidden />
          <div
            ref={line}
            className="absolute top-6 bottom-6 left-[27px] w-px origin-top bg-signal shadow-[0_0_10px_#00ff85]"
            aria-hidden
          />
          {STEPS.map((s, i) => (
            <motion.li
              key={s.title}
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-20% 0px" }}
              transition={{ type: "spring", stiffness: 110, damping: 20, delay: 0.05 }}
              className="relative flex gap-5"
            >
              <motion.span
                initial={{ scale: 0.6, backgroundColor: "var(--surface)" }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true, margin: "-20% 0px" }}
                className="relative z-10 grid size-14 shrink-0 place-items-center rounded-2xl border border-line bg-surface font-mono text-[15px] font-semibold text-signal-ink"
              >
                0{i + 1}
              </motion.span>
              <div className="flex-1 rounded-3xl border border-line bg-surface/60 p-5 md:p-6">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-[19px] font-semibold md:text-[22px]">{s.title}</h3>
                  <span className="font-mono text-[10px] tracking-[0.2em] text-subtle">{s.readout}</span>
                </div>
                <p className="mt-2 text-[14.5px] leading-relaxed text-subtle">{s.body}</p>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  )
}
