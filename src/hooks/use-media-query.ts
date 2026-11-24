"use client"
import { useSyncExternalStore } from "react"

export function useMediaQuery(query: string, serverValue = false) {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query)
      m.addEventListener("change", cb)
      return () => m.removeEventListener("change", cb)
    },
    () => window.matchMedia(query).matches,
    () => serverValue,
  )
}

export const useIsDesktop = () => useMediaQuery("(min-width: 768px)")
export const usePrefersReducedMotion = () => useMediaQuery("(prefers-reduced-motion: reduce)")
