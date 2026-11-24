"use client"
import { motion } from "framer-motion"
import Image from "next/image"
import { GALLERY } from "@/lib/gallery"
import { cn } from "@/lib/utils"
import { SectionHeading } from "./reveal"

/** Flight path diagrams for the shots we fly. Shown until real photos are added in src/lib/gallery.ts. */
const SHOTS: { name: string; body: string; path: string; span?: string; viewBox?: string }[] = [
  {
    name: "Orbit",
    body: "A slow circle around the couple or the stage.",
    path: "M200 70 C290 70 330 110 330 150 C330 195 270 230 200 230 C130 230 70 195 70 150 C70 110 110 70 200 70 Z",
    span: "md:col-span-2",
  },
  {
    name: "Reveal",
    body: "Rise from behind a roof line to show the whole venue.",
    path: "M60 240 C120 240 150 220 170 170 C190 120 240 80 340 70",
  },
  {
    name: "Top down",
    body: "Straight overhead for patterns, crowds and group photos.",
    path: "M200 40 L200 260",
  },
  {
    name: "Fly through",
    body: "Through the gate, over the guests, onto the dance floor.",
    path: "M40 200 C110 200 120 110 200 110 C280 110 290 200 360 200",
    span: "md:col-span-2",
  },
  {
    name: "Follow",
    body: "Tracks the car, the procession or the runners.",
    path: "M40 230 C100 170 140 230 200 170 C260 110 300 170 360 90",
  },
  {
    name: "Pull back",
    body: "Starts close on faces and pulls back to the full scene.",
    path: "M200 160 C220 140 260 110 340 60",
  },
]

function ShotTile({ shot, i }: { shot: (typeof SHOTS)[number]; i: number }) {
  return (
    <motion.figure
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ type: "spring", stiffness: 100, damping: 20, delay: (i % 3) * 0.06 }}
      className={cn(
        "group relative overflow-hidden rounded-[28px] border border-line bg-surface",
        shot.span,
      )}
    >
      <div className="hud-grid absolute inset-0 opacity-80" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_60%,rgba(0,255,133,.10),transparent_65%)]" />
      <svg viewBox="0 0 400 300" className="relative aspect-[4/3] w-full md:aspect-auto md:h-64" preserveAspectRatio="xMidYMid meet" aria-hidden>
        <motion.path
          d={shot.path}
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.18"
          strokeWidth="1.5"
          strokeDasharray="4 6"
          className="text-fg"
        />
        <motion.path
          id={`shot-${i}`}
          d={shot.path}
          fill="none"
          stroke="#00FF85"
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          style={{ filter: "drop-shadow(0 0 6px rgba(0,255,133,.8))" }}
        />
        <g>
          <circle r="7" fill="#00FF85" />
          <circle r="15" fill="none" stroke="#00FF85" strokeOpacity=".35" />
          <animateMotion dur={`${6 + i}s`} repeatCount="indefinite" rotate="auto" path={shot.path} />
        </g>
        {shot.name === "Orbit" && <circle cx="200" cy="150" r="5" className="fill-fg/60" />}
      </svg>
      <figcaption className="relative flex items-end justify-between gap-4 p-5 pt-0">
        <div>
          <p className="font-heading text-[20px] font-semibold">{shot.name}</p>
          <p className="mt-1 text-[13.5px] leading-snug text-subtle">{shot.body}</p>
        </div>
        <span className="shrink-0 whitespace-nowrap font-mono text-[10px] tracking-[0.2em] text-subtle">SHOT {String(i + 1).padStart(2, "0")}</span>
      </figcaption>
    </motion.figure>
  )
}

export function Gallery() {
  const hasPhotos = GALLERY.length > 0
  return (
    <section id="gallery" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-24 md:px-8 md:py-32">
      <SectionHeading
        eyebrow={hasPhotos ? "Gallery" : "Shots we fly"}
        title={hasPhotos ? "From our recent flights." : "Six moves that make an event look big."}
        body={
          hasPhotos
            ? undefined
            : "Our gallery of real Astro_Fly shoots is on the way. Meanwhile, here are the moves we plan for every event."
        }
      />
      {hasPhotos ? (
        <div className="mt-12 columns-1 gap-4 sm:columns-2 lg:columns-3">
          {GALLERY.map((g) => (
            <figure key={g.src} className="mb-4 break-inside-avoid overflow-hidden rounded-[24px] border border-line">
              <Image src={g.src} alt={g.alt} width={800} height={600} className="h-auto w-full" />
              <figcaption className="p-4 text-[13.5px] text-subtle">{g.caption}</figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <div className="mt-12 grid gap-4 md:grid-cols-4">
          {SHOTS.map((s, i) => (
            <ShotTile key={s.name} shot={s} i={i} />
          ))}
        </div>
      )}
    </section>
  )
}
