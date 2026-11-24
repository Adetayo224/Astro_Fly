"use client"
import { AnimatePresence, motion } from "framer-motion"
import { Download, Plus, Share, X } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { LogoMark } from "@/components/brand/logo"
import { Button } from "@/components/ui/button"
import { Sheet } from "@/components/ui/sheet"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

const DISMISS_KEY = "astrofly-install-dismissed"
const OPEN_EVENT = "astrofly:install"

/** Opens the install sheet from anywhere (footer, chat page). */
export function openInstall() {
  window.dispatchEvent(new Event(OPEN_EVENT))
}

export function InstallAppButton({ className }: { className?: string }) {
  return (
    <button type="button" onClick={openInstall} className={className}>
      <Download className="size-4" /> Install the app
    </button>
  )
}

type Platform = "ios" | "android" | "desktop"

function detect(): { platform: Platform; standalone: boolean } {
  const ua = navigator.userAgent
  const ios = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  return { platform: ios ? "ios" : /android/i.test(ua) ? "android" : "desktop", standalone }
}

/**
 * Lets people put Astro_Fly on their home screen as an app.
 * Android and desktop Chrome get the native install prompt; iPhone and iPad get the
 * Add to Home Screen steps, because Safari has no install prompt.
 */
export function InstallApp() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [env, setEnv] = useState<{ platform: Platform; standalone: boolean } | null>(null)
  const [banner, setBanner] = useState(false)
  const [sheet, setSheet] = useState(false)

  useEffect(() => {
    const info = detect()
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    const onOpen = () => setSheet(true)
    const onInstalled = () => {
      setBanner(false)
      setSheet(false)
    }
    window.addEventListener("beforeinstallprompt", onPrompt)
    window.addEventListener(OPEN_EVENT, onOpen)
    window.addEventListener("appinstalled", onInstalled)

    let t: ReturnType<typeof setTimeout> | undefined
    // Gentle nudge on phones only, once every two weeks, never inside the installed app
    if (!info.standalone && info.platform !== "desktop") {
      let dismissed = 0
      try {
        dismissed = Number(localStorage.getItem(DISMISS_KEY) || 0)
      } catch {}
      if (Date.now() - dismissed > 14 * 86400000) t = setTimeout(() => setBanner(true), 9000)
    }
    queueMicrotask(() => setEnv(info))
    return () => {
      if (t) clearTimeout(t)
      window.removeEventListener("beforeinstallprompt", onPrompt)
      window.removeEventListener(OPEN_EVENT, onOpen)
      window.removeEventListener("appinstalled", onInstalled)
    }
  }, [])

  const dismiss = useCallback(() => {
    setBanner(false)
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()))
    } catch {}
  }, [])

  const install = async () => {
    if (deferred) {
      await deferred.prompt()
      const choice = await deferred.userChoice
      setDeferred(null)
      if (choice.outcome === "accepted") {
        setSheet(false)
        setBanner(false)
      }
      return
    }
    setBanner(false)
    setSheet(true)
  }

  if (!env || env.standalone) return null

  return (
    <>
      <AnimatePresence>
        {banner && (
          <motion.div
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+76px)] z-[60] md:hidden"
          >
            <div className="glass flex items-center gap-3 rounded-[22px] p-3 pr-2 shadow-[0_20px_60px_-20px_rgba(0,0,0,.7)]">
              <LogoMark className="size-11 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold">Get the Astro_Fly app</p>
                <p className="truncate text-[12px] text-subtle">Book and track shoots from your home screen</p>
              </div>
              <Button size="sm" onClick={install}>
                Install
              </Button>
              <button onClick={dismiss} aria-label="Not now" className="grid size-9 place-items-center rounded-full text-subtle">
                <X className="size-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Sheet open={sheet} onClose={() => setSheet(false)} title="Install Astro_Fly" width="440px">
        <div className="flex flex-col gap-5 px-5 pt-2 pb-8">
          <div className="flex items-center gap-4">
            <LogoMark className="size-16" />
            <div>
              <p className="text-[17px] font-semibold">Astro_Fly</p>
              <p className="text-[13px] text-subtle">Works offline for pages you have opened. No app store needed.</p>
            </div>
          </div>
          {env.platform === "ios" ? (
            <ol className="flex flex-col gap-3">
              {[
                { icon: Share, text: "Tap the Share button in Safari's toolbar" },
                { icon: Plus, text: "Scroll down and tap Add to Home Screen" },
                { icon: Download, text: "Tap Add. Astro_Fly appears on your home screen" },
              ].map(({ icon: Icon, text }, i) => (
                <li key={text} className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-4">
                  <span className="font-mono text-[12px] text-signal-ink">0{i + 1}</span>
                  <Icon className="size-5 shrink-0 text-fg" />
                  <span className="text-[14px]">{text}</span>
                </li>
              ))}
              <li className="text-[12.5px] text-subtle">On iPhone this works from Safari. In Chrome on iPhone, use the Share button in the address bar.</li>
            </ol>
          ) : deferred ? (
            <Button size="xl" block onClick={install}>
              <Download /> Install now
            </Button>
          ) : (
            <ol className="flex flex-col gap-3">
              {[
                env.platform === "android" ? "Open the menu (three dots) in Chrome" : "Open the browser menu, or look for the install icon in the address bar",
                env.platform === "android" ? "Tap Install app or Add to Home screen" : "Choose Install Astro_Fly",
                "Confirm. Astro_Fly opens like any other app",
              ].map((text, i) => (
                <li key={text} className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-4">
                  <span className="font-mono text-[12px] text-signal-ink">0{i + 1}</span>
                  <span className="text-[14px]">{text}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </Sheet>
    </>
  )
}
