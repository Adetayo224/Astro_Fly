import { cva, type VariantProps } from "class-variance-authority"
import Link from "next/link"
import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"

export const buttonVariants = cva(
  "relative inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium outline-none transition-[transform,background-color,box-shadow,border-color,color,opacity] duration-200 ease-[cubic-bezier(.22,1,.36,1)] active:scale-[0.96] disabled:pointer-events-none disabled:opacity-45 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[18px]",
  {
    variants: {
      variant: {
        primary:
          "bg-signal text-ink shadow-[0_0_0_1px_rgba(0,255,133,.6),0_10px_30px_-8px_rgba(0,255,133,.55)] hover:shadow-[0_0_0_1px_rgba(0,255,133,.9),0_14px_40px_-6px_rgba(0,255,133,.7)] hover:brightness-105",
        glass: "glass text-fg hover:border-signal/40",
        outline: "border border-line bg-transparent text-fg hover:border-signal/60 hover:bg-surface",
        ghost: "text-fg hover:bg-surface",
        subtle: "bg-surface text-fg hover:bg-surface-2",
        danger: "bg-destructive/12 text-destructive hover:bg-destructive/20",
      },
      size: {
        sm: "h-9 px-4 text-[13px]",
        md: "h-11 px-5 text-sm",
        lg: "h-12 px-6 text-[15px]",
        xl: "h-14 px-7 text-base font-semibold",
        icon: "size-11",
      },
      block: { true: "w-full" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
)

type Variants = VariantProps<typeof buttonVariants>

export function Button({ className, variant, size, block, type = "button", ...props }: ComponentProps<"button"> & Variants) {
  return <button type={type} className={cn(buttonVariants({ variant, size, block }), className)} {...props} />
}

export function ButtonLink({ className, variant, size, block, ...props }: ComponentProps<typeof Link> & Variants) {
  return <Link className={cn(buttonVariants({ variant, size, block }), className)} {...props} />
}
