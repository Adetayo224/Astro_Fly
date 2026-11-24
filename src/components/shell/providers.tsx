"use client"
import { MotionConfig } from "framer-motion"
import { ThemeProvider } from "next-themes"
import { useEffect, type ReactNode } from "react"
import { Toaster } from "sonner"
import { BookingProvider } from "@/components/booking/booking-provider"
import type { Drone } from "@/lib/types"
import { InstallApp } from "./install-app"
import { SmoothScroll } from "./smooth-scroll"

function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return
    navigator.serviceWorker.register("/sw.js").catch(() => {})
  }, [])
  return null
}

export function Providers({ drones, children }: { drones: Drone[]; children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      themes={["dark", "light"]}
      storageKey="astrofly-theme"
      disableTransitionOnChange
    >
      <MotionConfig reducedMotion="user">
        <BookingProvider drones={drones}>
          <SmoothScroll />
          <ServiceWorker />
          {children}
          <InstallApp />
          <Toaster
            position="top-center"
            toastOptions={{
              className: "!rounded-2xl !border !border-line !bg-surface !text-fg !font-sans",
            }}
          />
        </BookingProvider>
      </MotionConfig>
    </ThemeProvider>
  )
}
