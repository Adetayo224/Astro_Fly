"use client"
import { motion } from "framer-motion"
import { usePathname } from "next/navigation"
import { whatsappLink } from "@/lib/site"

export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden fill="currentColor">
      <path d="M16.04 3C9.4 3 4 8.33 4 14.9c0 2.3.67 4.45 1.83 6.27L4 29l8.06-1.8a12.2 12.2 0 0 0 3.98.67c6.63 0 12.03-5.33 12.03-11.9C28.07 8.33 22.67 3 16.04 3zm0 21.73c-1.25 0-2.48-.22-3.63-.64l-.52-.2-4.78 1.07 1.1-4.55-.34-.55a9.7 9.7 0 0 1-1.52-5.2c0-5.4 4.46-9.8 9.69-9.8 5.36 0 9.7 4.4 9.7 9.8 0 5.39-4.34 9.8-9.7 9.8zm5.33-7.3c-.29-.15-1.73-.85-2-.94-.27-.1-.46-.15-.66.14-.19.29-.75.94-.92 1.13-.17.2-.34.22-.63.08-.29-.15-1.23-.45-2.34-1.43a8.7 8.7 0 0 1-1.62-2c-.17-.29 0-.45.13-.6.13-.13.29-.34.44-.51.14-.17.19-.29.29-.48.1-.2.05-.37-.03-.51-.07-.15-.65-1.57-.9-2.15-.23-.56-.47-.48-.65-.49h-.55c-.2 0-.51.07-.78.37-.27.29-1.02 1-1.02 2.42 0 1.43 1.05 2.81 1.2 3 .14.2 2.06 3.13 4.99 4.39.7.3 1.24.48 1.66.61.7.22 1.34.19 1.84.12.56-.08 1.73-.7 1.97-1.38.25-.68.25-1.26.17-1.38-.07-.12-.26-.2-.55-.34z" />
    </svg>
  )
}

export function WhatsAppFab() {
  const pathname = usePathname()
  const message = "Hello Astro_Fly, I would like to ask about a drone shoot."
  return (
    <motion.a
      href={whatsappLink(message)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Astro_Fly on WhatsApp"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20, delay: 1.2 }}
      whileTap={{ scale: 0.9 }}
      className={
        "group fixed right-4 z-40 flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_12px_30px_-8px_rgba(37,211,102,.7)] transition-[bottom] md:right-8 md:bottom-8 " +
        (pathname.startsWith("/admin") ? "bottom-6" : "bottom-[calc(env(safe-area-inset-bottom)+80px)]")
      }
    >
      <span className="absolute inset-1 animate-ping rounded-full bg-[#25D366]/25 [animation-duration:3s]" />
      <WhatsAppIcon className="relative size-7" />
    </motion.a>
  )
}
