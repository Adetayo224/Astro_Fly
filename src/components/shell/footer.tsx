import Link from "next/link"
import { Logo } from "@/components/brand/logo"
import { InstallAppButton } from "./install-app"
import { site, whatsappLink } from "@/lib/site"

export function Footer() {
  return (
    <footer className="relative border-t border-line bg-bg pb-[calc(env(safe-area-inset-bottom)+88px)] md:pb-0">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr] md:px-8 md:py-16">
        <div className="flex flex-col gap-5">
          <Logo />
          <p className="max-w-sm text-[14px] leading-relaxed text-subtle">
            Astro_Fly is a service of {site.company}. New Sawmill Area, Pakiotan Estate, Ogbomoso, Oyo State, Nigeria.
          </p>
        </div>
        <div>
          <p className="font-mono text-[10.5px] tracking-[0.2em] text-subtle uppercase">Explore</p>
          <ul className="mt-4 grid gap-2.5 text-[14px]">
            <li><Link className="hover:text-signal-ink" href="/drones">Drones</Link></li>
            <li><Link className="hover:text-signal-ink" href="/#how-it-works">How it works</Link></li>
            <li><Link className="hover:text-signal-ink" href="/bookings">My Bookings</Link></li>
            <li><Link className="hover:text-signal-ink" href="/#faq">Questions</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-mono text-[10.5px] tracking-[0.2em] text-subtle uppercase">Reach us</p>
          <ul className="mt-4 grid gap-2.5 text-[14px]">
            <li>
              <a className="hover:text-signal-ink" href={whatsappLink()} target="_blank" rel="noopener noreferrer">
                WhatsApp {site.whatsappDisplay}
              </a>
            </li>
            <li><a className="hover:text-signal-ink" href={`mailto:${site.email}`}>{site.email}</a></li>
            <li><Link className="hover:text-signal-ink" href="/chat">Chat with us</Link></li>
            <li>
              <InstallAppButton className="inline-flex items-center gap-2 text-signal-ink hover:underline" />
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-6 text-[12.5px] text-subtle md:flex-row md:items-center md:justify-between md:px-8">
          <p>© {site.company}. All rights reserved.</p>
          <p className="font-mono text-[11px] tracking-wider">
            DJI product images © DJI. Used to show the drones we fly.
            {site.modelCredit ? ` 3D model: ${site.modelCredit}.` : ""}
          </p>
        </div>
      </div>
    </footer>
  )
}
