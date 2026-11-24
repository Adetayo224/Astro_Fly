"use client"
import { Check, Copy, Landmark } from "lucide-react"
import { useState } from "react"
import { formatNaira, site, whatsappLink } from "@/lib/site"
import { cn } from "@/lib/utils"
import { WhatsAppIcon } from "@/components/shell/whatsapp-fab"

function CopyRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  const [done, setDone] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value)
          setDone(true)
          setTimeout(() => setDone(false), 1400)
        } catch {}
      }}
      className="group flex w-full items-center justify-between gap-4 py-3 text-left transition active:scale-[0.99]"
    >
      <span className="text-[13px] text-subtle">{label}</span>
      <span className="flex items-center gap-2">
        <span className={cn("text-right text-[14.5px] font-semibold", mono && "font-mono tracking-wider")}>{value}</span>
        {done ? (
          <Check className="size-4 text-signal-ink" />
        ) : (
          <Copy className="size-4 text-subtle transition group-hover:text-fg" />
        )}
      </span>
    </button>
  )
}

/** Bank transfer details with tap to copy. The team confirms each payment by email. */
export function BankDetailsCard({
  reference,
  amount,
  title = "Pay by bank transfer",
  className,
}: {
  reference: string
  amount?: number
  title?: string
  className?: string
}) {
  return (
    <div className={cn("brackets rounded-3xl border border-signal/30 bg-signal/[0.05] p-5 text-left", className)}>
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-2xl bg-signal/15 text-signal-ink">
          <Landmark className="size-5" />
        </span>
        <div>
          <p className="text-[15px] font-semibold">{title}</p>
          {amount ? <p className="font-mono text-[13px] text-signal-ink">{formatNaira(amount)}</p> : null}
        </div>
      </div>
      <div className="mt-3 divide-y divide-line">
        <CopyRow label="Bank" value={site.bank.name} />
        <CopyRow label="Account number" value={site.bank.accountNumber} mono />
        <CopyRow label="Account name" value={site.bank.accountName} />
        <CopyRow label="Narration" value={reference} mono />
      </div>
      <p className="mt-3 text-[12.5px] leading-relaxed text-subtle">
        Use your booking reference as the narration. We confirm every payment by email, usually the same day.
      </p>
      <a
        href={whatsappLink(`Hello Astro_Fly, I have paid for booking ${reference}. Here is my proof of payment.`)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 flex h-12 items-center justify-center gap-2 rounded-full bg-[#25D366] text-[14px] font-semibold text-white transition active:scale-[0.98]"
      >
        <WhatsAppIcon className="size-5" /> Send proof of payment
      </a>
    </div>
  )
}
