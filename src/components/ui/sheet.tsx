"use client"
import { AnimatePresence, motion, useDragControls, type PanInfo } from "framer-motion"
import { X } from "lucide-react"
import { useEffect, useId, useRef, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { getLenis } from "@/components/shell/smooth-scroll"
import { useIsDesktop } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"

const spring = { type: "spring", stiffness: 380, damping: 38, mass: 0.9 } as const

interface SheetProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  /** Full height on phones (booking flow). Otherwise height fits content. */
  full?: boolean
  /** Desktop width of the side panel */
  width?: string
  children: ReactNode
  footer?: ReactNode
  header?: ReactNode
  className?: string
  /** Render children straight into the panel (they manage their own scrolling). */
  bare?: boolean
}

/**
 * Native style sheet: springs up from the bottom on phones (drag the handle down to close)
 * and slides in from the right as a side panel on desktop.
 */
export function Sheet({ open, onClose, title, full, width = "520px", children, footer, header, className, bare }: SheetProps) {
  const desktop = useIsDesktop()
  const drag = useDragControls()
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()

  useEffect(() => {
    if (!open) return
    const lenis = getLenis()
    lenis?.stop()
    const prevOverflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = "hidden"
    const prevFocus = document.activeElement as HTMLElement | null
    const t = setTimeout(() => panelRef.current?.focus(), 50)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "Tab" && panelRef.current) {
        const f = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])',
        )
        if (!f.length) return
        const first = f[0]
        const last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener("keydown", onKey)
    return () => {
      clearTimeout(t)
      window.removeEventListener("keydown", onKey)
      document.documentElement.style.overflow = prevOverflow
      lenis?.start()
      prevFocus?.focus?.()
    }
  }, [open, onClose])

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 600) onClose()
  }

  if (typeof document === "undefined") return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80]" role="presentation">
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            tabIndex={-1}
            className={cn(
              "absolute flex flex-col bg-bg text-fg outline-none shadow-[0_-20px_80px_-20px_rgba(0,0,0,.6)]",
              desktop
                ? "inset-y-0 right-0 border-l border-line"
                : cn(
                    "inset-x-0 bottom-0 rounded-t-[28px] border-t border-line",
                    full ? "top-[max(env(safe-area-inset-top),12px)]" : "max-h-[92svh]",
                  ),
              className,
            )}
            style={desktop ? { width: `min(${width}, 100vw)` } : undefined}
            initial={desktop ? { x: "100%" } : { y: "100%" }}
            animate={desktop ? { x: 0 } : { y: 0 }}
            exit={desktop ? { x: "100%" } : { y: "100%" }}
            transition={spring}
            drag={desktop ? false : "y"}
            dragControls={drag}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={onDragEnd}
          >
            {!desktop && (
              <div
                className="flex h-7 shrink-0 cursor-grab touch-none items-center justify-center active:cursor-grabbing"
                onPointerDown={(e) => drag.start(e)}
              >
                <span className="h-1.5 w-11 rounded-full bg-fg/20" />
              </div>
            )}
            <div
              className={cn("flex shrink-0 items-center gap-3 px-5", desktop ? "h-16 border-b border-line" : "pb-3")}
              onPointerDown={(e) => !desktop && drag.start(e)}
            >
              <div className="min-w-0 flex-1">
                {header ?? (title ? <h2 id={titleId} className="text-lg font-semibold">{title}</h2> : null)}
              </div>
              <button
                type="button"
                onClick={onClose}
                onPointerDown={(e) => e.stopPropagation()}
                aria-label="Close"
                className="grid size-10 shrink-0 place-items-center rounded-full bg-surface text-fg transition active:scale-90 hover:bg-surface-2"
              >
                <X className="size-[18px]" />
              </button>
            </div>
            {bare ? (
              <div className="flex min-h-0 flex-1 flex-col">{children}</div>
            ) : (
              <div data-lenis-prevent className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                {children}
              </div>
            )}
            {footer && <div className="shrink-0 border-t border-line bg-bg/95 px-5 pt-3 pb-[max(env(safe-area-inset-bottom),14px)] backdrop-blur">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
