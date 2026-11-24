import { Mail, MapPin, MessageCircle, Phone } from "lucide-react"
import { site, whatsappLink } from "@/lib/site"
import { Reveal, RevealItem, SectionHeading } from "./reveal"

export function Contact() {
  const items = [
    {
      icon: MessageCircle,
      label: "WhatsApp",
      value: site.whatsappDisplay,
      href: whatsappLink("Hello Astro_Fly, I have a question about a drone shoot."),
      note: "Fastest way to reach us",
    },
    { icon: Phone, label: "Call", value: site.phoneDisplay, href: `tel:+${site.phone}`, note: "Mornings to evenings" },
    { icon: Mail, label: "Email", value: site.email, href: `mailto:${site.email}`, note: "For quotes and invoices" },
    {
      icon: MapPin,
      label: "Studio",
      value: site.address[0],
      href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.address.join(", "))}`,
      note: site.address[1],
    },
  ]
  return (
    <section id="contact" className="relative scroll-mt-24 overflow-hidden border-t border-line">
      <div className="pointer-events-none absolute -top-40 left-1/2 size-[640px] -translate-x-1/2 rounded-full bg-signal/10 blur-[120px]" />
      <div className="relative mx-auto max-w-7xl px-5 py-24 md:px-8 md:py-32">
        <SectionHeading
          eyebrow="Contact"
          title="Talk to a real person."
          body="Questions about a date, a venue or a special shot? Message us. We reply ourselves."
        />
        <Reveal className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(({ icon: Icon, label, value, href, note }) => (
            <RevealItem key={label}>
              <a
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="group flex h-full flex-col gap-6 rounded-[28px] border border-line bg-surface p-6 transition hover:border-signal/40 active:scale-[0.98]"
              >
                <span className="grid size-11 place-items-center rounded-2xl bg-signal/10 text-signal-ink transition group-hover:bg-signal group-hover:text-ink">
                  <Icon className="size-5" />
                </span>
                <span>
                  <span className="block font-mono text-[10.5px] tracking-[0.2em] text-subtle uppercase">{label}</span>
                  <span className="mt-1.5 block text-[16px] font-semibold break-words">{value}</span>
                  <span className="mt-1 block text-[13px] text-subtle">{note}</span>
                </span>
              </a>
            </RevealItem>
          ))}
        </Reveal>
      </div>
    </section>
  )
}
