"use client"
import { AnimatePresence, motion } from "framer-motion"
import { Bell, Check, Loader2 } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

export function NotifyMe({ droneSlug, droneName, className }: { droneSlug: string; droneName: string; className?: string }) {
  const [email, setEmail] = useState("")
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle")
  const [msg, setMsg] = useState("")

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setState("error")
      setMsg("Enter a valid email")
      return
    }
    setState("loading")
    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, drone_slug: droneSlug }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setState("done")
    } catch (err) {
      setState("error")
      setMsg(err instanceof Error ? err.message : "Try again")
    }
  }

  return (
    <div className={cn("relative", className)} onClick={(e) => e.stopPropagation()}>
      <AnimatePresence mode="wait" initial={false}>
        {state === "done" ? (
          <motion.p
            key="done"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex h-11 items-center gap-2 rounded-full bg-signal/10 px-4 text-[13px] font-medium text-signal-ink"
          >
            <Check className="size-4" /> We will email you when the {droneName} lands.
          </motion.p>
        ) : (
          <motion.form key="form" onSubmit={submit} noValidate className="flex flex-col gap-1.5">
            <div
              className={cn(
                "flex h-11 items-center rounded-full border bg-bg/60 pl-4 transition-colors focus-within:border-signal/60",
                state === "error" ? "border-destructive/60" : "border-line",
              )}
            >
              <Bell className="size-4 shrink-0 text-subtle" />
              <input
                type="email"
                inputMode="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (state === "error") setState("idle")
                }}
                placeholder="Your email"
                aria-label={`Email me when the ${droneName} is available`}
                className="h-full min-w-0 flex-1 bg-transparent px-3 text-[14px] outline-none placeholder:text-subtle/80"
              />
              <button
                type="submit"
                disabled={state === "loading"}
                className="mr-1 h-9 shrink-0 rounded-full bg-fg px-4 text-[12.5px] font-semibold text-bg transition active:scale-95 disabled:opacity-60"
              >
                {state === "loading" ? <Loader2 className="size-4 animate-spin" /> : "Notify me"}
              </button>
            </div>
            {state === "error" && <p className="pl-4 text-[12px] text-destructive">{msg}</p>}
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )
}
