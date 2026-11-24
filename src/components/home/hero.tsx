"use client"
import { motion } from "framer-motion"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { ArrowDown, ArrowRight } from "lucide-react"
import { useTheme } from "next-themes"
import dynamic from "next/dynamic"
import Image from "next/image"
import { Component, useEffect, useRef, useState, type ReactNode } from "react"
import { useBooking } from "@/components/booking/booking-provider"
import { ButtonLink } from "@/components/ui/button"
import { Button } from "@/components/ui/button"
import { useIsDesktop, usePrefersReducedMotion } from "@/hooks/use-media-query"
import { detectQuality, probeWebGL, type Quality } from "@/components/three/quality"
import { cn } from "@/lib/utils"
import { CountUp } from "./count-up"

const HeroScene = dynamic(() => import("@/components/three/hero-scene"), { ssr: false })

function Readout({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className="font-mono text-[9.5px] tracking-[0.22em] text-subtle uppercase">{label}</span>
      <span className="font-mono text-[13px] font-medium tabular-nums text-fg">{children}</span>
    </div>
  )
}

/** Keeps the page alive if WebGL crashes on an unusual device. */
class SceneBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch() {
    this.props.onError()
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

/** Shown when a device has no WebGL: the real product photo, floating. */
function DroneFallback() {
  return (
    <div className="absolute inset-x-0 top-[16%] flex justify-center md:top-[12%]" aria-hidden>
      <div className="absolute top-1/2 left-1/2 size-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-signal/15 blur-[90px]" />
      <div className="drone-float relative h-[240px] w-[min(86vw,520px)] md:h-[300px]">
        <Image src="/drones/dji-mini-4k.webp" alt="" fill priority sizes="520px" className="object-contain" />
      </div>
    </div>
  )
}

function SceneLoader({ done }: { done: boolean }) {
  return (
    <motion.div
      initial={false}
      animate={{ opacity: done ? 0 : 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="pointer-events-none absolute inset-0 z-[1] grid place-items-center"
      aria-hidden
    >
      <div className="flex -translate-y-16 flex-col items-center gap-5 md:-translate-y-10">
        <div className="relative size-24">
          <div className="absolute inset-0 rounded-full border border-fg/10" />
          <div className="absolute inset-0 animate-spin rounded-full border border-transparent border-t-signal [animation-duration:1.1s]" />
          <div className="absolute inset-[30%] rounded-full bg-signal/20 blur-md" />
          <div className="absolute inset-[44%] rounded-full bg-signal shadow-[0_0_20px_#00ff85]" />
        </div>
        <span className="font-mono text-[10.5px] tracking-[0.3em] text-subtle uppercase">Preparing for takeoff</span>
      </div>
    </motion.div>
  )
}

export function Hero({ modelUrl }: { modelUrl?: string }) {
  const { openBooking } = useBooking()
  const desktop = useIsDesktop()
  const reduced = usePrefersReducedMotion()
  const { resolvedTheme } = useTheme()
  const wrap = useRef<HTMLElement>(null)
  const panel1 = useRef<HTMLDivElement>(null)
  const panel2 = useRef<HTMLDivElement>(null)
  const cue = useRef<HTMLDivElement>(null)
  const progress = useRef(0)
  const [quality, setQuality] = useState<Quality | null>(null)
  const [ready, setReady] = useState(false)
  const [fallback, setFallback] = useState(false)

  // Mount the 3D scene after first paint so text and layout show instantly.
  // The loader also gives up after a few seconds so it never hangs over the page.
  useEffect(() => {
    const giveUp = setTimeout(() => setReady(true), 6000)
    const start = () => {
      // ?quality=low|mid|high forces a tier, handy for testing on real devices
      const forced = new URLSearchParams(window.location.search).get("quality")
      const webgl = probeWebGL()
      if (!webgl) {
        setFallback(true)
        setReady(true)
        return
      }
      if (forced === "low" || forced === "mid" || forced === "high") setQuality(forced)
      else setQuality(webgl.software ? "low" : detectQuality())
    }
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }
    const schedule = () => (w.requestIdleCallback ? w.requestIdleCallback(start, { timeout: 1200 }) : setTimeout(start, 300))
    if (document.readyState === "complete") schedule()
    else window.addEventListener("load", schedule, { once: true })
    return () => {
      clearTimeout(giveUp)
      window.removeEventListener("load", schedule)
    }
  }, [])

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: wrap.current,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        onUpdate: (s) => (progress.current = s.progress),
      })
      const tl = gsap.timeline({
        scrollTrigger: { trigger: wrap.current, start: "top top", end: "bottom bottom", scrub: 0.6 },
      })
      tl.to(panel1.current, { autoAlpha: 0, y: -60, scale: 0.96, duration: 0.3, ease: "power2.in" }, 0.05)
        .to(cue.current, { autoAlpha: 0, duration: 0.1 }, 0)
        .fromTo(panel2.current, { autoAlpha: 0, y: 70 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: "power2.out" }, 0.4)
        .to(panel2.current, { autoAlpha: 0, y: -40, duration: 0.2, ease: "power2.in" }, 0.85)
    }, wrap)
    return () => ctx.revert()
  }, [])

  const light = resolvedTheme === "light"

  return (
    <section ref={wrap} className="relative h-[230svh]" aria-label="Astro_Fly hero">
      <div className="sticky top-0 h-svh overflow-hidden">
        {/* 3D stage */}
        <div className="absolute inset-0 bg-bg">
          {fallback && <DroneFallback />}
          {quality && !fallback && (
            <SceneBoundary
              onError={() => {
                setFallback(true)
                setReady(true)
              }}
            >
            <HeroScene
              key={light ? "l" : "d"}
              progress={progress}
              quality={quality}
              mobile={!desktop}
              reduced={reduced}
              light={light}
              modelUrl={modelUrl}
              onReady={() => setReady(true)}
            />
            </SceneBoundary>
          )}
        </div>
        <SceneLoader done={ready} />

        {/* Texture over the stage */}
        <div className="noise pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-bg to-transparent" />

        {/* HUD readouts */}
        <div className="pointer-events-none absolute inset-x-0 top-[calc(env(safe-area-inset-top)+76px)] z-10 mx-auto flex max-w-7xl justify-between px-5 md:top-28 md:px-8">
          <div className="flex gap-6 md:gap-9">
            <Readout label="Alt">
              <CountUp value={120} delay={0.4} suffix=" m" />
            </Readout>
            <Readout label="Bat">
              <CountUp value={98} delay={0.6} suffix="%" />
            </Readout>
          </div>
          <div className="flex gap-6 text-right md:gap-9">
            <Readout label="Sig">
              <span className="inline-flex items-end gap-[3px]">
                {[5, 8, 11, 14].map((h, i) => (
                  <motion.span
                    key={h}
                    className="w-[3px] rounded-sm bg-signal"
                    style={{ height: h }}
                    initial={{ opacity: 0.15 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 + i * 0.18 }}
                  />
                ))}
              </span>
            </Readout>
            <Readout label="GPS" className="hidden sm:flex">
              <CountUp value={8.1333} decimals={4} delay={0.7} />
              {" N "}
              <CountUp value={4.2667} decimals={4} delay={0.8} />
              {" E"}
            </Readout>
            <Readout label="Sats" className="sm:hidden">
              <CountUp value={18} delay={0.7} />
            </Readout>
          </div>
        </div>

        {/* Panel 1 */}
        <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-[calc(env(safe-area-inset-bottom)+150px)] md:pb-14">
          <div
            ref={panel1}
            className="brackets glass mx-auto max-w-[620px] rounded-[28px] p-5 shadow-[0_30px_80px_-30px_rgba(0,0,0,.7)] md:p-9"
          >
            <div>
              <p className="rise eyebrow flex items-center gap-2" style={{ animationDelay: "60ms" }}>
                <span className="size-1.5 animate-pulse rounded-full bg-signal" />
                Event drone shoots in Nigeria
              </p>
              <h1
                style={{ animationDelay: "120ms" }}
                className="rise mt-3 text-[34px] leading-[1.02] font-semibold md:mt-4 md:text-[60px]"
              >
                Your day, seen from <span className="text-signal-ink text-glow">the sky.</span>
              </h1>
              <p
                style={{ animationDelay: "180ms" }}
                className="rise mt-3 max-w-md text-[14.5px] leading-relaxed text-subtle md:mt-4 md:text-[17px]"
              >
                Weddings, owambes, concerts, church programmes and launches. Pick a drone, tell us about the day, and our
                pilot brings home the shots you will keep for years.
              </p>
              <div
                style={{ animationDelay: "240ms" }}
                className="rise mt-6 flex gap-2.5 sm:gap-3 md:mt-7"
              >
                <Button size="xl" onClick={() => openBooking()} className="flex-1 px-4">
                  Book a Drone
                  <ArrowRight />
                </Button>
                <ButtonLink href="/drones" variant="glass" size="xl" className="flex-1 px-4">
                  See Our Drones
                </ButtonLink>
              </div>
            </div>
          </div>
          <div ref={cue} className="mt-5 hidden items-center justify-center gap-2 text-subtle md:flex">
            <ArrowDown className="size-4 animate-bounce" />
            <span className="font-mono text-[10.5px] tracking-[0.25em] uppercase">Scroll to fly</span>
          </div>
        </div>

        {/* Panel 2 */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 px-4 pb-[calc(env(safe-area-inset-bottom)+92px)] md:inset-y-0 md:flex md:items-center md:pb-0">
          <div
            ref={panel2}
            className="glass pointer-events-auto invisible mx-auto w-full max-w-[520px] rounded-[28px] p-6 opacity-0 md:mr-auto md:ml-[max(2rem,calc((100vw-80rem)/2+2rem))] md:p-8"
          >
            <p className="eyebrow">Why people book us</p>
            <h2 className="mt-3 text-[28px] leading-[1.08] font-semibold md:text-[38px]">
              One pilot. One plan. Every angle covered.
            </h2>
            <ul className="mt-6 grid gap-4">
              {[
                ["Planned around your programme", "We walk the venue with you and mark the moments before the day."],
                ["Steady 4K footage", "Gimbal stabilised video and sharp stills, even in a breeze."],
                ["Edited and delivered", "Photos, a cut video and reels for your socials, sent to you after the event."],
              ].map(([t, d], i) => (
                <li key={t} className="flex gap-4">
                  <span className="mt-0.5 font-mono text-[12px] text-signal-ink">0{i + 1}</span>
                  <span>
                    <span className="block text-[15px] font-semibold">{t}</span>
                    <span className="mt-0.5 block text-[13.5px] leading-relaxed text-subtle">{d}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
