"use client"
import { motion } from "framer-motion"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { isActive, TABS } from "./nav-items"
import { TabIcon } from "./tab-icons"

export function BottomTabs() {
  const pathname = usePathname()
  if (pathname.startsWith("/admin")) return null
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-bg/80 pb-safe backdrop-blur-2xl backdrop-saturate-150 md:hidden"
    >
      <ul className="mx-auto grid h-[64px] max-w-md grid-cols-4">
        {TABS.map((t) => {
          const active = isActive(pathname, t.href)
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-full flex-col items-center justify-center gap-1 transition-[color,transform] active:scale-90",
                  active ? "text-signal-ink" : "text-subtle",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="tab-glow"
                    className="absolute top-0 h-[2px] w-10 rounded-full bg-signal shadow-[0_0_12px_#00ff85]"
                    transition={{ type: "spring", stiffness: 500, damping: 36 }}
                  />
                )}
                <TabIcon name={t.icon} active={active} />
                <span className="text-[10.5px] font-medium tracking-wide">{t.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
