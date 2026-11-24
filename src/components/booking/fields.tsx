"use client"
import { AnimatePresence, motion } from "framer-motion"
import { Check, ChevronDown } from "lucide-react"
import { forwardRef, useId, type ComponentProps, type ReactNode } from "react"
import { cn } from "@/lib/utils"

export function Field({
  label,
  hint,
  error,
  children,
  htmlFor,
  className,
  optional,
}: {
  label: ReactNode
  hint?: ReactNode
  error?: string
  children: ReactNode
  htmlFor?: string
  className?: string
  optional?: boolean
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={htmlFor} className="flex items-baseline justify-between gap-2 text-[13px] font-medium text-fg/90">
        <span>{label}</span>
        {optional && <span className="font-mono text-[10px] tracking-wider text-subtle uppercase">Optional</span>}
      </label>
      {children}
      <AnimatePresence initial={false}>
        {error ? (
          <motion.p
            key="err"
            role="alert"
            initial={{ opacity: 0, height: 0, y: -4 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="text-[12.5px] text-destructive"
          >
            {error}
          </motion.p>
        ) : hint ? (
          <p className="text-[12.5px] text-subtle">{hint}</p>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

const inputBase =
  "w-full rounded-2xl border border-input bg-surface/70 px-4 text-[16px] text-fg placeholder:text-subtle/70 outline-none transition-[border-color,box-shadow,background-color] duration-200 focus:border-signal/70 focus:bg-surface focus:shadow-[0_0_0_4px_rgba(0,255,133,.12)] aria-[invalid=true]:border-destructive/70"

export const TextInput = forwardRef<HTMLInputElement, ComponentProps<"input"> & { invalid?: boolean }>(
  function TextInput({ className, invalid, ...props }, ref) {
    return <input ref={ref} aria-invalid={invalid || undefined} className={cn(inputBase, "h-13", className)} {...props} />
  },
)

export const TextArea = forwardRef<HTMLTextAreaElement, ComponentProps<"textarea"> & { invalid?: boolean }>(
  function TextArea({ className, invalid, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(inputBase, "min-h-28 resize-none py-3.5 leading-relaxed", className)}
        {...props}
      />
    )
  },
)

export const SelectInput = forwardRef<HTMLSelectElement, ComponentProps<"select"> & { invalid?: boolean }>(
  function SelectInput({ className, invalid, children, ...props }, ref) {
    return (
      <div className="relative">
        <select
          ref={ref}
          aria-invalid={invalid || undefined}
          className={cn(inputBase, "h-13 appearance-none pr-10", className)}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-subtle" />
      </div>
    )
  },
)

/** Tappable chip used for single and multi choice questions. */
export function Chip({
  selected,
  onClick,
  children,
  multi,
  className,
  disabled,
}: {
  selected: boolean
  onClick: () => void
  children: ReactNode
  multi?: boolean
  className?: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role={multi ? "checkbox" : "radio"}
      aria-checked={selected}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "relative flex min-h-12 items-center justify-center gap-2 rounded-2xl border px-4 py-2.5 text-[14px] font-medium transition-[transform,border-color,background-color,color] duration-200 active:scale-[0.97] disabled:opacity-40",
        selected
          ? "border-signal bg-signal/12 text-fg shadow-[inset_0_0_0_1px_rgba(0,255,133,.35)]"
          : "border-line bg-surface/60 text-fg/85 hover:border-fg/25",
        className,
      )}
    >
      {multi && (
        <span
          className={cn(
            "grid size-[18px] shrink-0 place-items-center rounded-md border transition-colors",
            selected ? "border-signal bg-signal text-ink" : "border-fg/30",
          )}
        >
          {selected && <Check className="size-3" strokeWidth={3} />}
        </span>
      )}
      {children}
    </button>
  )
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  invalid,
}: {
  value: T | undefined
  onChange: (v: T) => void
  options: readonly { id: T; label: string }[]
  invalid?: boolean
}) {
  const id = useId()
  return (
    <div
      role="radiogroup"
      className={cn(
        "relative grid rounded-2xl border bg-surface/70 p-1",
        invalid ? "border-destructive/70" : "border-line",
      )}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((o) => {
        const active = o.id === value
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.id)}
            className={cn(
              "relative z-10 h-11 rounded-xl text-[14px] font-medium transition-colors",
              active ? "text-ink" : "text-fg/75 hover:text-fg",
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 -z-10 rounded-xl bg-signal"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
              />
            )}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export function CheckRow({
  checked,
  onChange,
  children,
  description,
  invalid,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  children: ReactNode
  description?: ReactNode
  invalid?: boolean
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-colors active:scale-[0.99]",
        checked ? "border-signal/60 bg-signal/8" : invalid ? "border-destructive/60" : "border-line bg-surface/50",
      )}
    >
      <span
        className={cn(
          "mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border transition-colors",
          checked ? "border-signal bg-signal text-ink" : "border-fg/30",
        )}
      >
        <AnimatePresence>
          {checked && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
              <Check className="size-3.5" strokeWidth={3} />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
      <span className="flex flex-col gap-1">
        <span className="text-[14px] font-medium text-fg">{children}</span>
        {description && <span className="text-[13px] leading-relaxed text-subtle">{description}</span>}
      </span>
    </button>
  )
}
