"use client"
import { motion, useMotionValueEvent, useScroll } from "framer-motion"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Logo } from "@/components/brand/logo"
import { useBooking } from "@/components/booking/booking-provider"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { isActive, TABS } from "./nav-items"
import { ThemeToggle } from "./theme-toggle"

export function TopBar() {
  const pathname = usePathname()
  const { openBooking } = useBooking()
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 12))

  if (pathname.startsWith("/admin")) return null

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 pt-safe transition-[background-color,border-color,backdrop-filter] duration-300",
        scrolled ? "border-b border-line bg-bg/75 backdrop-blur-2xl backdrop-saturate-150" : "border-b border-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-5 md:h-[72px] md:px-8">
        <Logo />
        <nav aria-label="Primary" className="ml-8 hidden flex-1 items-center gap-1 md:flex">
          {TABS.map((t) => {
            const active = isActive(pathname, t.href)
            return (
              <Link
                key={t.href}
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative rounded-full px-4 py-2 text-[14px] font-medium transition-colors",
                  active ? "text-fg" : "text-subtle hover:text-fg",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 -z-10 rounded-full border border-line bg-surface"
                    transition={{ type: "spring", stiffness: 500, damping: 38 }}
                  />
                )}
                {t.label === "Bookings" ? "My Bookings" : t.label}
              </Link>
            )
          })}
        </nav>
        <div className="ml-auto flex items-center gap-2.5">
          <ThemeToggle />
          <Button size="sm" onClick={() => openBooking()} className="h-10 px-4 md:px-5">
            <span>
              Book<span className="hidden sm:inline"> a Drone</span>
            </span>
          </Button>
        </div>
      </div>
    </header>
  )
}
