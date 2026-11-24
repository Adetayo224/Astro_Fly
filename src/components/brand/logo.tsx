import Link from "next/link"
import { cn } from "@/lib/utils"

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-8", className)}>
      <rect x="1" y="1" width="30" height="30" rx="9" className="fill-ink" />
      <rect x="1" y="1" width="30" height="30" rx="9" fill="none" stroke="#00FF85" strokeOpacity=".35" />
      <g stroke="#00FF85" strokeWidth="1.6" strokeLinecap="round" fill="none">
        <path d="M10 10l12 12M22 10L10 22" strokeOpacity=".9" />
        <circle cx="9" cy="9" r="3" />
        <circle cx="23" cy="9" r="3" />
        <circle cx="9" cy="23" r="3" />
        <circle cx="23" cy="23" r="3" />
      </g>
      <rect x="13" y="13" width="6" height="6" rx="2" fill="#00FF85" />
    </svg>
  )
}

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <Link href="/" className={cn("group flex items-center gap-2.5", className)}>
      <LogoMark className="transition-transform duration-500 group-hover:rotate-90" />
      <span className="flex flex-col leading-none">
        <span className="font-heading text-[17px] font-semibold tracking-tight text-fg">
          Astro<span className="text-signal-ink">_</span>Fly
        </span>
        {!compact && (
          <span className="mt-1 font-mono text-[9.5px] tracking-[0.14em] text-subtle uppercase">
            by Samfred Robotics
          </span>
        )}
      </span>
    </Link>
  )
}
