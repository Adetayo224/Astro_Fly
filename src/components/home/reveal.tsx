"use client"
import { motion, type Variants } from "framer-motion"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }
export const revealItem: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 110, damping: 20 } },
}

export function Reveal({ children, className, as = "div" }: { children: ReactNode; className?: string; as?: "div" | "ul" | "ol" }) {
  const M = motion[as]
  return (
    <M className={className} variants={container} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-12% 0px" }}>
      {children}
    </M>
  )
}

export function RevealItem({ children, className, as = "div" }: { children: ReactNode; className?: string; as?: "div" | "li" }) {
  const M = motion[as]
  return (
    <M className={className} variants={revealItem}>
      {children}
    </M>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  body,
  className,
  align = "left",
}: {
  eyebrow: string
  title: ReactNode
  body?: ReactNode
  className?: string
  align?: "left" | "center"
}) {
  return (
    <Reveal className={cn("flex flex-col gap-4", align === "center" && "items-center text-center", className)}>
      <RevealItem>
        <p className="eyebrow">{eyebrow}</p>
      </RevealItem>
      <RevealItem>
        <h2 className="max-w-2xl text-[32px] leading-[1.05] font-semibold md:text-[52px]">{title}</h2>
      </RevealItem>
      {body && (
        <RevealItem>
          <p className="max-w-xl text-[15.5px] leading-relaxed text-subtle md:text-[17px]">{body}</p>
        </RevealItem>
      )}
    </Reveal>
  )
}
