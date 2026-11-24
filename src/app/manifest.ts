import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Astro_Fly by Samfred Robotics",
    short_name: "Astro_Fly",
    description: "Book a drone shoot for your event in Nigeria.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#050505",
    theme_color: "#050505",
    categories: ["photo", "lifestyle", "business"],
    screenshots: [
      { src: "/screenshots/phone-home.png", sizes: "780x1688", type: "image/png", form_factor: "narrow", label: "Book a drone shoot" },
      { src: "/screenshots/desktop-home.png", sizes: "1440x900", type: "image/png", form_factor: "wide", label: "Astro_Fly on desktop" },
    ],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Book a drone", url: "/book", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "My Bookings", url: "/bookings", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Team dashboard", url: "/admin", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  }
}
