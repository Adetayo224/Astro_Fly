import type { Metadata, Viewport } from "next"
import { Inter, JetBrains_Mono, Sora } from "next/font/google"
import { BottomTabs } from "@/components/shell/bottom-tabs"
import { Providers } from "@/components/shell/providers"
import { TopBar } from "@/components/shell/top-bar"
import { WhatsAppFab } from "@/components/shell/whatsapp-fab"
import { getDrones } from "@/lib/server/drones"
import { getPricing } from "@/lib/server/settings"
import { site } from "@/lib/site"
import "./globals.css"

const sora = Sora({ variable: "--font-sora", subsets: ["latin"], display: "swap" })
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" })
const mono = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"], display: "swap" })

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: "Astro_Fly | Drone shoots for events in Nigeria", template: "%s | Astro_Fly" },
  description: site.description,
  applicationName: "Astro_Fly",
  appleWebApp: { capable: true, title: "Astro_Fly", statusBarStyle: "black-translucent" },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
  openGraph: {
    title: "Astro_Fly | Drone shoots for events in Nigeria",
    description: site.description,
    type: "website",
    locale: "en_NG",
    siteName: "Astro_Fly",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#050505" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [drones, pricing] = await Promise.all([getDrones(), getPricing()])
  return (
    <html
      lang="en-NG"
      className={`dark ${sora.variable} ${inter.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-svh">
        <Providers drones={drones} pricing={pricing}>
          <TopBar />
          <main id="main">{children}</main>
          <BottomTabs />
          <WhatsAppFab />
        </Providers>
      </body>
    </html>
  )
}
