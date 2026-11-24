"use client"
import { animate, useInView } from "framer-motion"
import { useEffect, useRef } from "react"

/** Counts from 0 to value once it scrolls into view. */
export function CountUp({
  value,
  decimals = 0,
  duration = 1.6,
  delay = 0,
  suffix = "",
  className,
}: {
  value: number
  decimals?: number
  duration?: number
  delay?: number
  suffix?: string
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: "-10% 0px" })
  useEffect(() => {
    if (!inView || !ref.current) return
    const el = ref.current
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduce) {
      el.textContent = value.toFixed(decimals) + suffix
      return
    }
    const c = animate(0, value, {
      duration,
      delay,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => (el.textContent = v.toFixed(decimals) + suffix),
    })
    return () => c.stop()
  }, [inView, value, decimals, duration, delay, suffix])
  return (
    <span ref={ref} className={className}>
      {(0).toFixed(decimals) + suffix}
    </span>
  )
}
