import { Mail, Phone } from "lucide-react"
import type { Metadata } from "next"
import { InstallAppButton } from "@/components/shell/install-app"
import { WhatsAppIcon } from "@/components/shell/whatsapp-fab"
import { Footer } from "@/components/shell/footer"
import { Reveal, RevealItem } from "@/components/home/reveal"
import { site, whatsappLink } from "@/lib/site"

export const metadata: Metadata = { title: "Chat", description: "Talk to the Astro_Fly team on WhatsApp, by phone or email." }

const STARTERS = [
  "Is my date still free?",
  "I need a price for a wedding",
  "Can you cover an event outside Oyo State?",
  "I have a question about my booking",
  "Can you stream the drone feed to a screen?",
]

export default function ChatPage() {
  return (
    <>
      <div className="mx-auto max-w-3xl px-5 pt-[calc(env(safe-area-inset-top)+96px)] pb-24 md:px-8 md:pt-36">
        <p className="eyebrow">Chat</p>
        <h1 className="mt-4 text-[40px] leading-[1.02] font-semibold md:text-[56px]">Talk to the team.</h1>
        <p className="mt-4 max-w-lg text-[15.5px] leading-relaxed text-subtle">
          Real people from Samfred Robotics answer every message. Tap a question to start a WhatsApp chat with it
          already typed.
        </p>

        <div className="mt-10 rounded-[32px] border border-line bg-surface p-4 md:p-6">
          <div className="flex items-center gap-3 border-b border-line pb-4">
            <span className="grid size-11 place-items-center rounded-full bg-[#25D366] text-white">
              <WhatsAppIcon className="size-6" />
            </span>
            <div>
              <p className="text-[15px] font-semibold">Astro_Fly bookings</p>
              <p className="flex items-center gap-1.5 font-mono text-[11px] text-subtle">
                <span className="size-1.5 rounded-full bg-signal" /> {site.whatsappDisplay}
              </p>
            </div>
          </div>
          <Reveal className="flex flex-col items-end gap-2.5 py-6">
            {STARTERS.map((s) => (
              <RevealItem key={s}>
                <a
                  href={whatsappLink(`Hello Astro_Fly. ${s}`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-[20px] rounded-br-md bg-signal px-4 py-3 text-[14.5px] font-medium text-ink shadow-[0_8px_24px_-12px_rgba(0,255,133,.8)] transition active:scale-95 hover:brightness-105"
                >
                  {s}
                </a>
              </RevealItem>
            ))}
          </Reveal>
          <a
            href={whatsappLink("Hello Astro_Fly.")}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-14 items-center justify-between rounded-full border border-line bg-bg px-5 text-[14.5px] text-subtle transition hover:border-signal/50"
          >
            Write your own message
            <span className="grid size-9 place-items-center rounded-full bg-[#25D366] text-white">
              <WhatsAppIcon className="size-5" />
            </span>
          </a>
        </div>

        <InstallAppButton className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-[24px] border border-dashed border-signal/40 text-[14.5px] font-semibold text-signal-ink transition hover:bg-signal/5 active:scale-[0.98]" />

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <a
            href={`tel:+${site.phone}`}
            className="flex items-center gap-4 rounded-[24px] border border-line bg-surface p-5 transition hover:border-signal/40 active:scale-[0.98]"
          >
            <Phone className="size-5 text-signal-ink" />
            <span>
              <span className="block text-[14.5px] font-semibold">Call us</span>
              <span className="font-mono text-[12px] text-subtle">{site.phoneDisplay}</span>
            </span>
          </a>
          <a
            href={`mailto:${site.email}`}
            className="flex items-center gap-4 rounded-[24px] border border-line bg-surface p-5 transition hover:border-signal/40 active:scale-[0.98]"
          >
            <Mail className="size-5 text-signal-ink" />
            <span>
              <span className="block text-[14.5px] font-semibold">Email us</span>
              <span className="font-mono text-[12px] text-subtle">{site.email}</span>
            </span>
          </a>
        </div>
      </div>
      <Footer />
    </>
  )
}
